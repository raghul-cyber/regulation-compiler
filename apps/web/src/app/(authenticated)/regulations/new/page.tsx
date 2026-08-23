'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, BrainCircuit, FileSearch, ShieldCheck, Globe, Library } from 'lucide-react';
import { uploadRegulationServerAction } from '@/app/actions';
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
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/regulations/frameworks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      if (!token) throw new Error("Not authenticated");

      const res = await uploadRegulationServerAction(formData);
      
      if (!res.success) {
        throw new Error(res.error || "Upload failed");
      }

      setJobId(res.data.job_id);
      setRegulationId(res.data.regulation_id);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleIngestFramework = async (acronym: string) => {
    setIsUploading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/regulations/frameworks/${acronym}/ingest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to ingest framework");
      
      setJobId(data.job_id);
      setRegulationId(data.regulation_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (jobId && regulationId) {
    return (
      <PipelineProgress 
        jobId={jobId} 
        regulationId={regulationId} 
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
                                    onClick={() => handleIngestFramework(f.acronym)}
                                    disabled={isUploading}
                                    className="w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all rounded py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                                    Live Ingest & Compile
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setTab('custom')}
                                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors rounded py-2 text-sm font-medium flex items-center justify-center gap-2"
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
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. EU, US, Global"
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 
                'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
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
                  <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-white font-medium mb-2">Drag and drop your regulatory document here</p>
                  <p className="text-gray-400 text-sm mb-6">Supports PDF and HTML files up to 50MB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
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

            {/* Submit Button */}
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
                  <BrainCircuit className="h-6 w-6" />
                  Start Ingestion Pipeline
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
