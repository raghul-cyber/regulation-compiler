'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, FileSearch, ShieldCheck, Globe, Library, Lock } from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { uploadRegulationServerAction, ingestFrameworkAction, getFrameworksAction, getBillingStatusAction } from '@/app/actions';
import { PipelineProgress } from '@/components/regulations/pipeline-progress';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { PaywallModal } from '@/components/billing/paywall-modal';

interface Framework {
  id: string;
  name: string;
  acronym: string;
  jurisdiction: string;
  source_url: string;
  is_fetchable: boolean;
  description: string;
}

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.endsWith('.local');
    if (isLocal) {
      return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
    }
    // Remote domain (e.g. www.regcompiler.app): Use same-origin /api/v1 rewrite to eliminate all CORS & preflight errors
    return '/api/v1';
  }
  return '/api/v1';
};

export default function NewRegulationPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'standard' | 'custom'>('standard');

  // Custom Upload State
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared State
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [regulationId, setRegulationId] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [paywallData, setPaywallData] = useState({ used: 3, limit: 3 });

  // Check Billing Entitlement on Mount
  useEffect(() => {
    async function checkBilling() {
      try {
        const res = await getBillingStatusAction();
        if (res.success && res.data) {
          const remaining = res.data.free_usage?.remaining ?? 3;
          if (!res.data.is_admin && !res.data.paid_access && remaining <= 0) {
            setIsLimitReached(true);
            setPaywallData({
              used: res.data.free_usage?.used ?? 3,
              limit: res.data.free_usage?.limit ?? 3
            });
            setIsPaywallOpen(true);
          }
        }
      } catch (e) {
        console.warn("Could not check billing on regulations upload page:", e);
      }
    }
    checkBilling();
  }, []);

  // Standard Framework State
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);

  useEffect(() => {
    if (tab === 'standard') {
      fetchFrameworks();
    }
  }, [tab]);

  const fetchFrameworks = async () => {
    try {
      setLoadingFrameworks(true);
      setError(null);

      // 1. Prefer Server Action first: executes on Next.js server, completely bypassing browser CSP and CORS limitations
      try {
        const res = await getFrameworksAction();
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setFrameworks(res.data);
          return;
        }
      } catch (saErr) {
        console.warn('[Frameworks] Server action fallback to internal route fetch', saErr);
      }

      // 2. Try same-origin Next.js API route: eliminates CORS and preflight checks
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`/api/regulations/frameworks`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setFrameworks(data);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('[Frameworks] Same-origin API route fallback to /api/v1 rewrite', apiErr);
      }

      // 3. Fallback to /api/v1 same-origin rewrite
      const apiUrl = getApiUrl();
      const directRes = await fetch(`${apiUrl}/regulations/frameworks`, { headers });
      if (!directRes.ok) throw new Error("Failed to load frameworks");
      const data = await directRes.json();
      if (Array.isArray(data) && data.length > 0) {
        setFrameworks(data);
      } else {
        throw new Error("No frameworks returned");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFrameworks(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'html' && ext !== 'htm') {
      setError("Only PDF and HTML files are supported.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
    if (!name) {
      setName(selectedFile.name.split('.')[0]);
    }
  };

  const handleUpload = async () => {
    if (isLimitReached) {
      setIsPaywallOpen(true);
      return;
    }

    if (!file || !name || !jurisdiction) {
      setError("Please fill all required fields and select a file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('jurisdiction', jurisdiction);

      const token = await getToken();
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let responseData: any = null;
      let uploadActionSucceeded = false;

      // Prefer Server Action first: eliminates cross-origin and CSP limitations
      try {
        const res = await uploadRegulationServerAction(formData);
        if (res.success) {
          responseData = res.data;
          uploadActionSucceeded = true;
        } else if (res.isPaymentRequired) {
          setIsLimitReached(true);
          setPaywallData({ used: res.freeUsesUsed || 3, limit: res.freeUsesLimit || 3 });
          setIsPaywallOpen(true);
          return;
        }
      } catch (saErr) {
        console.warn('[Upload] Server action fallback to client fetch', saErr);
      }

      if (!uploadActionSucceeded) {
        try {
          const directRes = await fetch(`${apiUrl}/regulations/upload`, {
            method: 'POST',
            headers,
            body: formData
          });
          if (directRes.ok) {
            responseData = await directRes.json();
          } else {
            let errText = "Upload failed";
            try {
              const errJson = await directRes.json();
              errText = errJson.detail || errJson.message || errText;
              if (directRes.status === 402 || errJson.code === 'PAYMENT_REQUIRED') {
                setIsLimitReached(true);
                setPaywallData({ used: errJson.free_uses_used ?? 3, limit: errJson.free_uses_limit ?? 3 });
                setIsPaywallOpen(true);
                return;
              }
            } catch {
              errText = await directRes.text() || errText;
            }
            throw new Error(errText);
          }
        } catch (directErr: any) {
          if (directErr.message?.includes("PAYMENT_REQUIRED")) {
            setIsLimitReached(true);
            setIsPaywallOpen(true);
            return;
          }
          console.warn("Direct upload fallback to server action:", directErr);
          const res = await uploadRegulationServerAction(formData);
          if (!res.success) {
            if (res.isPaymentRequired) {
              setIsLimitReached(true);
              setPaywallData({ used: res.freeUsesUsed || 3, limit: res.freeUsesLimit || 3 });
              setIsPaywallOpen(true);
              return;
            }
            throw new Error(res.error || directErr.message || "Upload failed");
          }
          responseData = res.data;
        }
      }

      const returnedJobId = responseData?.job_id;
      const returnedRegId = responseData?.regulation_id || responseData?.regulation_version_id;

      if (!returnedJobId) {
        throw new Error("Server did not return a valid ingestion job ID");
      }

      setJobId(returnedJobId);
      setRegulationId(returnedRegId || returnedJobId);
      
    } catch (err: any) {
      if (err.message?.includes("PAYMENT_REQUIRED") || err.message?.includes("3 free uses")) {
        setIsPaywallOpen(true);
      } else {
        setError(err.message || "An unexpected error occurred during ingestion upload");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleIngestFramework = async (acronym: string) => {
    if (isLimitReached) {
      setIsPaywallOpen(true);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      setIngesting(acronym);
      let data: any = null;
      let serverActionSucceeded = false;
      try {
        const res = await ingestFrameworkAction(acronym);
        if (res.success) {
          data = res.data;
          serverActionSucceeded = true;
        } else if (res.isPaymentRequired) {
          setIsLimitReached(true);
          setPaywallData({ used: res.freeUsesUsed || 3, limit: res.freeUsesLimit || 3 });
          setIsPaywallOpen(true);
          return;
        }
      } catch (saErr) {
        console.warn('[IngestFramework] Server action fallback to client fetch', saErr);
      }

      if (!serverActionSucceeded) {
        const token = await getToken();
        const apiUrl = getApiUrl();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiUrl}/regulations/frameworks/${acronym}/ingest`, {
          method: 'POST',
          headers
        });
        data = await res.json();
        if (!res.ok) {
          if (res.status === 402 || data.code === 'PAYMENT_REQUIRED') {
            setIsLimitReached(true);
            setPaywallData({ used: data.free_uses_used ?? 3, limit: data.free_uses_limit ?? 3 });
            setIsPaywallOpen(true);
            return;
          }
          throw new Error(data.detail || data.message || "Failed to ingest framework");
        }
      }
      
      setJobId(data.job_id);
      setRegulationId(data.regulation_id || data.regulation_version_id);
    } catch (err: any) {
      if (err.message?.includes("PAYMENT_REQUIRED") || err.message?.includes("3 free uses")) {
        setIsLimitReached(true);
        setIsPaywallOpen(true);
      } else {
        setError(err.message || "Failed to ingest framework");
      }
    } finally {
      setIsUploading(false);
      setIngesting(null);
    }
  };

  if (jobId) {
    return (
      <PipelineProgress 
        jobId={jobId} 
        regulationId={regulationId || undefined} 
        getToken={getToken}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Add Regulation</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Ingest a new regulatory framework into the Knowledge Graph. Our AI will automatically parse requirements, map policies, and identify compliance gaps.
        </p>
      </div>

      {/* Account Action Locked Alert Banner (when 3 free uses are exhausted) */}
      {isLimitReached && (
        <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-200 shadow-xl shadow-amber-500/5 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-2">
                <span>Account Action Locked • 3/3 Free Uses Consumed</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Upgrade Required</span>
              </div>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                You have reached your limit of 3 free regulation compilations and website compliance audits. Ingestion and parsing are locked until you upgrade to Pro.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaywallOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Upgrade to Pro ($10.02/mo)</span>
          </button>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="bg-[#080A0E] p-1 rounded-[8px] border border-white/[0.08] flex gap-1 shadow-sm">
            <button 
                onClick={() => { setTab('standard'); setError(null); }}
                className={`px-6 py-2 rounded-[6px] text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${tab === 'standard' ? 'bg-[#4D8FCC] text-white shadow-sm border border-[#79B5EC]/20' : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.04]'}`}
            >
                <Library className="h-4 w-4" />
                Standard Framework
            </button>
            <button 
                onClick={() => { setTab('custom'); setError(null); }}
                className={`px-6 py-2 rounded-[6px] text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${tab === 'custom' ? 'bg-[#4D8FCC] text-white shadow-sm border border-[#79B5EC]/20' : 'text-[#9CA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.04]'}`}
            >
                <UploadCloud className="h-4 w-4" />
                Custom Upload
            </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-950/20 border border-red-900/40 rounded-[8px] flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}

      {tab === 'standard' && (
        <div className="bg-[#080A0E] border border-white/[0.08] rounded-[10px] p-8 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <Library className="h-5 w-5 text-[#4D8FCC]" />
              <h2 className="text-xl font-bold text-[#F4F6F8]">Supported Frameworks</h2>
            </div>
            
            {loadingFrameworks ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
                    <Loader2 className="h-7 w-7 animate-spin text-[#4D8FCC] mb-4" />
                    <p className="font-mono text-xs">Loading statutory catalog...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {frameworks.map(f => (
                        <div key={f.id} className="bg-[#050608] border border-white/[0.06] rounded-[8px] p-5 hover:border-white/[0.14] transition-all group flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-base font-bold text-[#F4F6F8] group-hover:text-[#93C5FD] transition-colors">{f.acronym}</h3>
                                    <p className="text-xs text-[#9CA3AF] mt-1">{f.name}</p>
                                </div>
                                <span className="bg-[#0B0E14] text-[#CBD5E1] border border-white/[0.06] text-xs px-2 py-0.5 rounded-[4px] flex items-center gap-1 font-mono">
                                    <Globe className="h-3 w-3 text-[#4D8FCC]" />
                                    {f.jurisdiction}
                                </span>
                            </div>
                            <p className="text-xs text-[#9CA3AF] mb-6 flex-grow leading-relaxed">{f.description}</p>
                            
                            {f.is_fetchable ? (
                                <button 
                                    onClick={() => {
                                      if (isLimitReached) {
                                        setIsPaywallOpen(true);
                                        return;
                                      }
                                      handleIngestFramework(f.acronym);
                                    }}
                                    disabled={isUploading || isLimitReached}
                                    className={`w-full transition-all rounded-[6px] py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                                        isLimitReached
                                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                                            : ingesting === f.acronym
                                            ? 'bg-[#4D8FCC] text-white border border-[#79B5EC]/30'
                                            : 'bg-[#4D8FCC]/15 hover:bg-[#4D8FCC] text-[#93C5FD] hover:text-white border border-[#4D8FCC]/30'
                                    }`}
                                >
                                    {isLimitReached ? (
                                        <>
                                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                                            <span>3/3 Used • Upgrade to Pro</span>
                                        </>
                                    ) : ingesting === f.acronym ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Ingesting & Compiling {f.acronym}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RCIcon name="compiler" size={14} />
                                            <span>Live Ingest & Compile</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setTab('custom')}
                                    disabled={isLimitReached}
                                    className={`w-full transition-colors rounded-[6px] py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${isLimitReached ? 'bg-[#0B0E14] text-[#64748B] cursor-not-allowed' : 'bg-[#0B0E14] hover:bg-[#10141A] text-[#CBD5E1] border border-white/[0.06]'}`}
                                >
                                    <UploadCloud className="h-3.5 w-3.5" />
                                    Requires Upload
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {tab === 'custom' && (
        <div className="bg-[#080A0E] border border-white/[0.08] rounded-[10px] p-8 max-w-2xl mx-auto shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="h-5 w-5 text-[#4D8FCC]" />
            <h2 className="text-xl font-bold text-[#F4F6F8]">Custom Upload Studio</h2>
          </div>

          <div className="space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5 font-medium">Regulation Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. EU AI Act, HIPAA"
                  disabled={isUploading || isLimitReached}
                  className={`w-full bg-[#050608] border rounded-[6px] p-3 text-sm text-[#F4F6F8] placeholder-[#475569] transition-all outline-none ${isLimitReached ? 'border-amber-500/30 opacity-50 cursor-not-allowed' : 'border-white/[0.08] focus:border-[#4D8FCC] focus:ring-1 focus:ring-[#4D8FCC]/30'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5 font-medium">Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. EU, US, Global"
                  disabled={isUploading || isLimitReached}
                  className={`w-full bg-[#050608] border rounded-[6px] p-3 text-sm text-[#F4F6F8] placeholder-[#475569] transition-all outline-none ${isLimitReached ? 'border-amber-500/30 opacity-50 cursor-not-allowed' : 'border-white/[0.08] focus:border-[#4D8FCC] focus:ring-1 focus:ring-[#4D8FCC]/30'}`}
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-[8px] p-8 text-center transition-all ${
                isLimitReached ? 'border-amber-500/30 bg-amber-500/5 opacity-50 pointer-events-none cursor-not-allowed' :
                isDragging ? 'border-[#4D8FCC] bg-[#0E1524]' : 
                file ? 'border-[#4D8FCC]/50 bg-[#080A0E]' : 
                'border-white/[0.10] hover:border-white/[0.20] bg-[#050608]'
              }`}
              onDragOver={(e) => { e.preventDefault(); if (!isLimitReached) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { if (!isLimitReached) handleDrop(e); }}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 bg-[#4D8FCC]/15 rounded-[8px] flex items-center justify-center mb-4 border border-[#4D8FCC]/25">
                    <FileText className="h-7 w-7 text-[#79B5EC]" />
                  </div>
                  <div className="text-[#F4F6F8] font-medium text-sm mb-1">{file.name}</div>
                  <div className="text-[#9CA3AF] text-xs mb-4 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-mono transition-colors cursor-pointer"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`h-14 w-14 rounded-[8px] flex items-center justify-center mb-4 border ${isLimitReached ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[#080A0E] text-[#9CA3AF] border-white/[0.08]'}`}>
                    {isLimitReached ? <Lock className="h-6 w-6 text-amber-400" /> : <UploadCloud className="h-6 w-6 text-[#4D8FCC]" />}
                  </div>
                  <p className="text-[#F4F6F8] font-medium text-sm mb-1.5">
                    {isLimitReached ? "Upload Locked — Free Uses Exhausted (3/3 Used)" : "Drag and drop statutory document"}
                  </p>
                  <p className="text-[#64748B] text-xs mb-5 font-mono">
                    {isLimitReached ? "Upgrade to Pro to unlock unlimited document parsing" : "Supports PDF and HTML files up to 50MB"}
                  </p>
                  <button 
                    onClick={() => {
                      if (isLimitReached) {
                        setIsPaywallOpen(true);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    disabled={isLimitReached}
                    className={`px-5 py-2 font-medium text-xs uppercase tracking-wider rounded-[6px] transition-colors cursor-pointer ${isLimitReached ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-[#0B0E14] text-[#F4F6F8] border border-white/[0.12] hover:border-white/[0.24] hover:bg-[#11151A]'}`}
                  >
                    {isLimitReached ? "Action Locked" : "Browse Files"}
                  </button>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    accept=".pdf,.html,.htm"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-[8px] flex items-start gap-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button / Locked Upgrade CTA */}
            {isLimitReached ? (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-3.5 rounded-[6px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>3/3 Free Uses Consumed • Upgrade to Pro</span>
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={isUploading || !file || !name || !jurisdiction}
                className={`w-full py-3.5 rounded-[6px] font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm ${
                  isUploading || !file || !name || !jurisdiction
                    ? 'bg-[#0B0E14] text-[#64748B] cursor-not-allowed border border-white/[0.06]'
                    : 'bg-[#4D8FCC] hover:bg-[#3B72A8] text-white border border-[#79B5EC]/20 active:scale-[0.99]'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Ingesting Document...
                  </>
                ) : (
                  <>
                    <RCIcon name="compiler" size={18} />
                    Start Ingestion Pipeline
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-4xl mx-auto">
        <div className="flex items-start gap-3 p-4 rounded-[8px] bg-[#080A0E] border border-white/[0.06]">
          <div className="p-2 bg-[#0B0E14] border border-white/[0.06] rounded-[6px] shrink-0 text-[#4D8FCC]">
            <FileSearch className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F4F6F8]">Semantic Parsing</h4>
            <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed">Deterministic AST extracts obligations, definitions, and boundaries.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-[8px] bg-[#080A0E] border border-white/[0.06]">
          <div className="p-2 bg-[#0B0E14] border border-white/[0.06] rounded-[6px] shrink-0 text-[#4D8FCC]">
            <RCIcon name="traceability" size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F4F6F8]">Graph Harmonization</h4>
            <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed">Identifies cross-framework dependencies and builds a unified knowledge graph.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-[8px] bg-[#080A0E] border border-white/[0.06]">
          <div className="p-2 bg-[#0B0E14] border border-white/[0.06] rounded-[6px] shrink-0 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F4F6F8]">Policy Generation</h4>
            <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed">Emits executable verification policies and cryptographic audit traces.</p>
          </div>
        </div>
      </div>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        freeUsesUsed={paywallData.used}
        freeUsesLimit={paywallData.limit}
        isBlocking={isLimitReached}
      />
    </div>
  );
}
