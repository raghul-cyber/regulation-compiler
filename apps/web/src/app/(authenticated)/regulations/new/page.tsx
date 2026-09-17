'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, BrainCircuit, FileSearch, ShieldCheck, Globe, Library } from 'lucide-react';
import { uploadRegulationServerAction, ingestFrameworkAction, getFrameworksAction } from '@/app/actions';
import { PipelineProgress } from '@/components/regulations/pipeline-progress';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

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
              errText = errJson.detail || errText;
            } catch {
              errText = await directRes.text() || errText;
            }
            throw new Error(errText);
          }
        } catch (directErr: any) {
          console.warn("Direct upload fallback to server action:", directErr);
          const res = await uploadRegulationServerAction(formData);
          if (!res.success) {
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
      setError(err.message || "An unexpected error occurred during ingestion upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleIngestFramework = async (acronym: string) => {
    setIsUploading(true);
    setError(null);
    try {
      setIngesting(acronym);
      const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      let data: any = null;

      if (isRemote) {
        const res = await ingestFrameworkAction(acronym);
        if (!res.success) throw new Error(res.error || "Failed to ingest framework");
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
        if (!res.ok) throw new Error(data.detail || "Failed to ingest framework");
      }
      
      setJobId(data.job_id);
      setRegulationId(data.regulation_id || data.regulation_version_id);
    } catch (err: any) {
      setError(err.message);
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
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <BrainCircuit className="w-3.5 h-3.5" />
          Statutory Ingestion Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Ingest Regulatory Framework
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Ingest a statutory document or canonical framework into the Knowledge Graph. The compiler automatically decomposes legal text into deterministic AST rules.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 flex gap-1 shadow-md">
            <button 
                onClick={() => { setTab('standard'); setError(null); }}
                className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer btn-tactile ${tab === 'standard' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
                <Library className="h-4 w-4" />
                Standard Catalog
            </button>
            <button 
                onClick={() => { setTab('custom'); setError(null); }}
                className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer btn-tactile ${tab === 'custom' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            >
                <UploadCloud className="h-4 w-4" />
                Custom Upload
            </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-950/30 border border-red-500/40 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}

      {tab === 'standard' && (
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Library className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Pre-Configured Statutory Catalogs</h2>
            </div>
            
            {loadingFrameworks ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                    <p className="text-sm font-medium text-zinc-300">Loading statutory catalogs...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {frameworks.map(f => (
                        <div key={f.id} className="bg-[#090a0f] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-all group flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{f.acronym}</h3>
                                      <p className="text-xs text-zinc-400 mt-0.5">{f.name}</p>
                                  </div>
                                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                                      <Globe className="h-3 w-3 text-zinc-500" />
                                      {f.jurisdiction}
                                  </span>
                              </div>
                              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{f.description}</p>
                            </div>
                            
                            {f.is_fetchable ? (
                                <button 
                                    onClick={() => handleIngestFramework(f.acronym)}
                                    disabled={isUploading}
                                    className={`w-full transition-all rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer btn-tactile ${
                                        ingesting === f.acronym
                                            ? 'bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-500/40'
                                            : 'bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30'
                                    }`}
                                >
                                    {ingesting === f.acronym ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Ingesting & Compiling {f.acronym}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <BrainCircuit className="h-4 w-4" />
                                            <span>Live Ingest & Compile</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setTab('custom')}
                                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer btn-tactile"
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
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <UploadCloud className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Custom Document Upload</h2>
          </div>

          <div className="space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Regulation Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. DORA, EU AI Act"
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Jurisdiction
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. EU, US, UK, Global"
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 
                file ? 'border-blue-500/50 bg-blue-500/5' : 
                'border-zinc-800 hover:border-zinc-700 bg-[#090a0f]/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-3 border border-blue-500/30">
                    <FileText className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="text-white font-medium text-sm mb-1">{file.name}</div>
                  <div className="text-zinc-500 text-xs mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove selected file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                    <UploadCloud className="h-7 w-7 text-zinc-400" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Drag and drop statutory document here</p>
                  <p className="text-zinc-500 text-xs mb-5">Accepts official PDF and HTML gazettes up to 50MB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-lg transition-all cursor-pointer btn-tactile shadow-sm"
                  >
                    Browse Files
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
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || !file || !name || !jurisdiction}
              className={`w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer btn-tactile ${
                isUploading || !file || !name || !jurisdiction
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Ingesting & Parsing Document...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="h-5 w-5" />
                  <span>Start Statutory Ingestion Pipeline</span>
                </>
              )}
            </button>
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
            <BrainCircuit className="h-5 w-5 text-gray-400" />
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
    </div>
  );
}
