"use client";

import { useEffect, useState } from 'react';
import { 
  Loader2, CheckCircle2, XCircle, Target, CheckSquare, 
  ChevronRight, ChevronDown, RotateCcw, Download, Cpu, 
  Network, ShieldCheck, FileJson 
} from 'lucide-react';
import Link from 'next/link';
import { ReportGenerator } from './report-generator';

interface JobEvent {
  id: string;
  job_id: string;
  stage_number: number;
  stage_name: string;
  status: 'started' | 'completed' | 'failed';
  details: any;
  created_at: string;
}

const STAGES = [
  { num: 1, name: "Ingest", hasDetails: false },
  { num: 2, name: "Parse/OCR", hasDetails: true },
  { num: 3, name: "AI Understanding", hasDetails: true },
  { num: 4, name: "Classify", hasDetails: true },
  { num: 5, name: "Extract Requirements", hasDetails: true },
  { num: 6, name: "Knowledge Graph Linking", hasDetails: true },
  { num: 7, name: "Rule Compilation", hasDetails: true },
  { num: 8, name: "Validation", hasDetails: true },
  { num: 9, name: "Persist to Policy DB", hasDetails: true }
];

export function PipelineProgress({ jobId, getToken, regulationId }: { jobId: string, getToken: () => Promise<string | null>, regulationId?: string }) {
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [jobStatus, setJobStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let abortController = new AbortController();

    const connectSSE = async () => {
      try {
        const token = await getToken();
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
        
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/jobs/${jobId}/events`, {
          headers,
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`SSE Connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'heartbeat') continue;
                
                setEvents(prev => {
                  if (prev.some(e => e.id === parsed.id)) return prev;
                  return [...prev, parsed];
                });

                setCurrentStage(parsed.stage_number);
                
                if (parsed.status === 'failed') {
                  setJobStatus('failed');
                  setErrorDetails(parsed.details?.error || "Pipeline failed");
                  return;
                }
                if (parsed.stage_number === 9 && parsed.status === 'completed') {
                  setJobStatus('completed');
                  return;
                } else {
                  setJobStatus('processing');
                }
              } catch(e) {
                console.error("SSE parse error", e, data);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err.message);
      }
    };
    
    connectSSE();

    return () => {
      abortController.abort();
    };
  }, [jobId, getToken]);

  const toggleExpand = (stageNum: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(stageNum)) next.delete(stageNum);
      else next.add(stageNum);
      return next;
    });
  };

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      const token = await getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      const res = await fetch(`${API_BASE}/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to retry job");
      // Reset state for new run
      setEvents([]);
      setCurrentStage(0);
      setJobStatus('processing');
      setErrorDetails(null);
      setError(null);
      setExpandedNodes(new Set());
    } catch(err: any) {
      setError(err.message);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDownloadPolicy = async () => {
    try {
      setIsDownloading(true);
      const token = await getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
      
      const stage9Event = events.find(e => e.stage_number === 9 && e.status === 'completed');
      const policyId = stage9Event?.details?.policy_id;
      
      const url = regulationId 
        ? `${API_BASE}/regulations/${regulationId}/policy/download` 
        : policyId 
          ? `${API_BASE}/policies/${policyId}/download`
          : null;

      if (!url) {
        throw new Error("No policy ID or regulation ID available for download");
      }

      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'compiled_compliance_policy.json';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("Policy download error:", err);
      setError(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper to get stage duration
  const getStageDuration = (stageNum: number) => {
    const stageEvents = events.filter(e => e.stage_number === stageNum);
    const start = stageEvents.find(e => e.status === 'started');
    const end = stageEvents.find(e => e.status === 'completed' || e.status === 'failed');
    if (start && end) {
      const ms = new Date(end.created_at).getTime() - new Date(start.created_at).getTime();
      return `${(ms / 1000).toFixed(1)}s`;
    }
    if (start && !end) {
      const ms = Date.now() - new Date(start.created_at).getTime();
      return `${(ms / 1000).toFixed(1)}s elapsed`;
    }
    return null;
  };
  
  const getTotalDuration = () => {
    const start = events.find(e => e.stage_number === 1 && e.status === 'started');
    const end = events.find(e => e.stage_number === 9 && (e.status === 'completed' || e.status === 'failed')) || 
                events.find(e => e.status === 'failed');
    if (start) {
        if (end) {
            const ms = new Date(end.created_at).getTime() - new Date(start.created_at).getTime();
            return `${(ms / 1000).toFixed(1)}s total`;
        }
        const ms = Date.now() - new Date(start.created_at).getTime();
        return `${(ms / 1000).toFixed(1)}s elapsed`;
    }
    return "0.0s";
  };

  const getStageDetails = (stageNum: number) => {
    const end = events.find(e => e.stage_number === stageNum && e.status === 'completed');
    return end?.details;
  };

  const getStageState = (stageNum: number) => {
    const stageEvents = events.filter(e => e.stage_number === stageNum);
    if (stageEvents.some(e => e.status === 'failed')) return 'failed';
    if (stageEvents.some(e => e.status === 'completed')) return 'completed';
    if (stageEvents.some(e => e.status === 'started')) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Compilation Pipeline</h2>
          <p className="text-sm text-zinc-400 mt-1">Job ID: <span className="font-mono text-xs">{jobId}</span></p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-zinc-300">{getTotalDuration()}</div>
          <div className="text-xs text-zinc-500 mt-1 capitalize">{jobStatus}</div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-400 font-mono">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative pl-6 py-4">
        {/* Vertical Line */}
        <div className="absolute left-[31px] top-6 bottom-6 w-px bg-zinc-800" />

        <div className="space-y-8">
          {STAGES.map((stage) => {
            const state = getStageState(stage.num);
            const isPending = state === 'pending';
            const isActive = state === 'active';
            const isCompleted = state === 'completed';
            const isFailed = state === 'failed';
            const duration = getStageDuration(stage.num);
            const details = getStageDetails(stage.num);
            const isExpanded = expandedNodes.has(stage.num);

            return (
              <div key={stage.num} className="relative z-10">
                <div className="flex items-start gap-4">
                  {/* Node Icon */}
                  <div className={`mt-0.5 rounded-full p-1 border-2 bg-[#0a0a0c] transition-colors duration-300
                    ${isPending ? 'border-zinc-800 text-zinc-700' : ''}
                    ${isActive ? 'border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : ''}
                    ${isCompleted ? 'border-emerald-500 text-emerald-500' : ''}
                    ${isFailed ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}
                  `}>
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-zinc-800" />
                    )}
                  </div>

                  {/* Node Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => stage.hasDetails && (isCompleted || isFailed) ? toggleExpand(stage.num) : null}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold transition-colors duration-300 
                          ${isPending ? 'text-zinc-600' : 'text-zinc-200'}
                          ${isFailed ? 'text-red-400' : ''}
                        `}>
                          {stage.num}. {stage.name}
                        </span>
                        {stage.hasDetails && (isCompleted || isFailed) && (
                          <div className="text-zinc-500 hover:text-zinc-300 transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        )}
                      </div>
                      {duration && (
                        <span className={`text-xs font-mono transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                          {duration}
                        </span>
                      )}
                    </div>
                    
                    {/* Failed State UI */}
                    {isFailed && (
                      <div className="mt-3 p-4 rounded-lg border border-red-900/50 bg-red-950/20">
                        <div className="text-sm font-mono text-red-400 mb-3 whitespace-pre-wrap">
                          {errorDetails || "Pipeline encountered a fatal error."}
                        </div>
                        <button 
                          onClick={handleRetry} 
                          disabled={isRetrying}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-300 bg-red-900/30 hover:bg-red-900/50 rounded transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                          {isRetrying ? 'Retrying...' : 'Retry Pipeline'}
                        </button>
                      </div>
                    )}

                    {/* Expandable Details UI */}
                    {isExpanded && details && !isFailed && (
                      <div className="mt-3 p-4 rounded-lg border border-zinc-800/60 bg-zinc-900/30 animate-in slide-in-from-top-2 fade-in duration-200">
                        {stage.name === 'Classify' ? (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded text-center">
                              <div className="text-2xl font-light text-amber-500 mb-1">{details.obligation}</div>
                              <div className="text-[10px] uppercase tracking-wider text-amber-500/70">Obligations</div>
                            </div>
                            <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded text-center">
                              <div className="text-2xl font-light text-emerald-500 mb-1">{details.permission}</div>
                              <div className="text-[10px] uppercase tracking-wider text-emerald-500/70">Permissions</div>
                            </div>
                            <div className="bg-rose-950/20 border border-rose-900/30 p-3 rounded text-center">
                              <div className="text-2xl font-light text-rose-500 mb-1">{details.prohibition}</div>
                              <div className="text-[10px] uppercase tracking-wider text-rose-500/70">Prohibitions</div>
                            </div>
                          </div>
                        ) : stage.name === 'Extract Requirements' ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-blue-400">
                              <Target className="w-4 h-4" />
                              <span className="font-semibold">{details.total_extracted} Requirements Extracted</span>
                            </div>
                            <div className="text-xs font-mono text-zinc-500 pl-6 border-l border-zinc-800 py-1">
                              Latest: "{details.latest_title}"
                            </div>
                          </div>
                        ) : stage.name === 'Validation' ? (
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                              <span className="text-zinc-300"><strong className="text-emerald-400 font-medium">{details.validated}</strong> Validated</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                                <span className="text-[10px] text-amber-500">!</span>
                              </div>
                              <span className="text-zinc-300"><strong className="text-amber-400 font-medium">{details.needs_review}</strong> Needs Review</span>
                            </div>
                          </div>
                        ) : stage.name === 'Knowledge Graph Linking' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-purple-400">
                              <Network className="w-4 h-4" />
                              <span className="font-semibold">{details.entities_linked || 0} Knowledge Entities Linked</span>
                            </div>
                            <div className="text-xs text-zinc-400">
                              Dependency graph created with {details.relationships_count || 0} cross-clause statutory relationships.
                            </div>
                          </div>
                        ) : stage.name === 'Rule Compilation' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-cyan-400">
                              <Cpu className="w-4 h-4" />
                              <span className="font-semibold">{details.rules_generated || 0} Executable AST Rules Compiled</span>
                            </div>
                            <div className="text-xs text-zinc-400">
                              Generated mathematical AST logic conditions ready for automated real-time compliance evaluation.
                            </div>
                          </div>
                        ) : stage.name === 'Persist to Policy DB' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                              <ShieldCheck className="w-4 h-4" />
                              <span className="font-semibold">Policy Engine Deployed ({details.total_requirements || 0} Rules)</span>
                            </div>
                            <div className="text-xs text-zinc-400 font-mono">
                              {details.status}
                            </div>
                          </div>
                        ) : (
                          <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post-Completion Actions (Phase 4 Trigger Prompts) */}
      {jobStatus === 'completed' && (
        <div className="mt-8 pt-6 border-t border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Pipeline Successfully Compiled
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Ready for Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href={regulationId ? `/regulations/${regulationId}/requirements` : '/regulations'}
              className="group flex flex-col justify-between p-4 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/30 hover:border-blue-500/50 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-900/50 rounded-lg text-blue-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-blue-100">Review Requirements</div>
                  <div className="text-xs text-blue-300/70">Validate extracted statutory rules</div>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs text-blue-400 font-medium">
                Inspect rules <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <button
              onClick={handleDownloadPolicy}
              disabled={isDownloading}
              className="group flex flex-col justify-between p-4 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30 hover:border-emerald-500/50 rounded-xl transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-900/50 rounded-lg text-emerald-400">
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileJson className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-emerald-100">Download Executable Policy</div>
                  <div className="text-xs text-emerald-300/70">Export AST policy JSON artifact</div>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs text-emerald-400 font-medium">
                {isDownloading ? "Downloading..." : "Download .json"}
                <Download className="w-4 h-4 ml-1 transform group-hover:translate-y-0.5 transition-all" />
              </div>
            </button>
            
            {regulationId && (
              <div className="flex flex-col justify-between">
                <ReportGenerator regulationId={regulationId} getToken={getToken} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
