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
    // Remote domain (e.g. Vercel)
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1') && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    return 'https://regulation-compiler.onrender.com/api/v1';
  }
  return (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1'))
    ? process.env.NEXT_PUBLIC_API_URL
    : 'https://regulation-compiler.onrender.com/api/v1';
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
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isRemote) {
        const res = await getFrameworksAction();
        if (res.success && Array.isArray(res.data)) {
          setFrameworks(res.data);
          return;
        }
      }
      const token = await getToken();
      const apiUrl = getApiUrl();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/regulations/frameworks`, { headers });
      if (!res.ok) throw new Error("Failed to load frameworks");
      const data = await res.json();
      setFrameworks(data);
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
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      
      if (isRemote) {
        // On remote domains (e.g. Vercel), use Server Action directly to eliminate cross-origin preflight/CORS errors
        const res = await uploadRegulationServerAction(formData);
        if (!res.success) {
          if (res.isPaymentRequired) {
            setIsLimitReached(true);
            setPaywallData({ used: res.freeUsesUsed || 3, limit: res.freeUsesLimit || 3 });
            setIsPaywallOpen(true);
            return;
          }
          throw new Error(res.error || "Upload failed");
        }
        responseData = res.data;
      } else {
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
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      let data: any = null;

      if (isRemote) {
        const res = await ingestFrameworkAction(acronym);
        if (!res.success) {
          if (res.isPaymentRequired) {
            setIsLimitReached(true);
            setPaywallData({ used: res.freeUsesUsed || 3, limit: res.freeUsesLimit || 3 });
            setIsPaywallOpen(true);
            return;
          }
          throw new Error(res.error || "Failed to ingest framework");
        }
        data = res.data;
      } else {
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
        <div className="bg-black/50 p-1 rounded-lg border border-gray-800 flex gap-1">
            <button 
                onClick={() => { setTab('standard'); setError(null); }}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'standard' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
                <Library className="h-4 w-4" />
                Standard Framework
            </button>
            <button 
                onClick={() => { setTab('custom'); setError(null); }}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'custom' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
                <UploadCloud className="h-4 w-4" />
                Custom Upload
            </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-red-200">{error}</div>
        </div>
      )}

      {tab === 'standard' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Library className="h-6 w-6 text-emerald-500" />
              <h2 className="text-xl font-semibold text-white">Supported Frameworks</h2>
            </div>
            
            {loadingFrameworks ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
                    <p>Loading catalog...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {frameworks.map(f => (
                        <div key={f.id} className="bg-black border border-gray-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors group flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{f.acronym}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{f.name}</p>
                                </div>
                                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {f.jurisdiction}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-6 flex-grow">{f.description}</p>
                            
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
                                    className={`w-full transition-all rounded py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                                        isLimitReached
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer'
                                            : ingesting === f.acronym
                                            ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                            : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30'
                                    }`}
                                >
                                    {isLimitReached ? (
                                        <>
                                            <Lock className="h-4 w-4 text-amber-400" />
                                            <span>3/3 Used • Upgrade to Pro</span>
                                        </>
                                    ) : ingesting === f.acronym ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Ingesting & Compiling {f.acronym}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RCIcon name="compiler" size={16} />
                                            <span>Live Ingest & Compile</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setTab('custom')}
                                    disabled={isLimitReached}
                                    className={`w-full transition-colors rounded py-2 text-sm font-medium flex items-center justify-center gap-2 ${isLimitReached ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                                >
                                    <UploadCloud className="h-4 w-4" />
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
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="h-6 w-6 text-emerald-500" />
            <h2 className="text-xl font-semibold text-white">Custom Upload</h2>
          </div>

          <div className="space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Regulation Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GDPR, HIPAA"
                  disabled={isUploading || isLimitReached}
                  className={`w-full bg-black border rounded-lg p-3 text-white transition-all outline-none ${isLimitReached ? 'border-amber-500/30 opacity-50 cursor-not-allowed' : 'border-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. EU, US, Global"
                  disabled={isUploading || isLimitReached}
                  className={`w-full bg-black border rounded-lg p-3 text-white transition-all outline-none ${isLimitReached ? 'border-amber-500/30 opacity-50 cursor-not-allowed' : 'border-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent'}`}
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isLimitReached ? 'border-amber-500/30 bg-amber-500/5 opacity-50 pointer-events-none cursor-not-allowed' :
                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 
                'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); if (!isLimitReached) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { if (!isLimitReached) handleDrop(e); }}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="text-white font-medium mb-1">{file.name}</div>
                  <div className="text-gray-400 text-sm mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${isLimitReached ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                    {isLimitReached ? <Lock className="h-8 w-8 text-amber-400" /> : <UploadCloud className="h-8 w-8 text-gray-400" />}
                  </div>
                  <p className="text-white font-medium mb-2">
                    {isLimitReached ? "Upload Locked — Free Uses Exhausted (3/3 Used)" : "Drag and drop your regulatory document here"}
                  </p>
                  <p className="text-gray-400 text-sm mb-6">
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
                    className={`px-6 py-2 font-medium rounded-lg transition-colors ${isLimitReached ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white text-black hover:bg-gray-200'}`}
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
              <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-3 text-sm text-red-300">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button / Locked Upgrade CTA */}
            {isLimitReached ? (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Lock className="h-5 w-5 text-amber-400" />
                <span>3/3 Free Uses Consumed • Upgrade to Pro</span>
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={isUploading || !file || !name || !jurisdiction}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  isUploading || !file || !name || !jurisdiction
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Ingesting Document...
                  </>
                ) : (
                  <>
                    <RCIcon name="compiler" size={24} />
                    Start Ingestion Pipeline
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto opacity-70">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-900 rounded-lg shrink-0">
            <FileSearch className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300">Semantic Parsing</h4>
            <p className="text-xs text-gray-500 mt-1">AI models extract obligations, definitions, and exceptions.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-900 rounded-lg shrink-0">
            <RCIcon name="traceability" size={20} className="text-gray-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300">Graph Linking</h4>
            <p className="text-xs text-gray-500 mt-1">Identifies dependencies and builds a knowledge graph.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-900 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300">Policy Generation</h4>
            <p className="text-xs text-gray-500 mt-1">Outputs executable compliance policies automatically.</p>
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
