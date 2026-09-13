'use client';

import { useState, useEffect } from 'react';
import { FileText, ArrowRight, Loader2, X, CheckCircle2, Circle, ChevronRight, Check } from 'lucide-react';
import { generateReport, pollReports } from '@/app/actions';

const REPORT_TYPES = [
  { id: 'executive_summary', title: 'Executive Summary', description: 'High-level overview of total requirements and key obligations.' },
  { id: 'technical', title: 'Technical System Mapping', description: 'Detailed mapping of requirements to technical system actions.' },
  { id: 'audit_evidence', title: 'Audit Evidence', description: 'List of evidence artifacts required to prove compliance.' },
  { id: 'gap_analysis', title: 'Gap Analysis', description: 'Highlights missing controls and unresolved requirements.' },
  { id: 'checklist', title: 'Implementation Checklist', description: 'Actionable checklist for engineering and compliance teams.' },
];

const REPORT_STAGES = [
  { num: 1, name: 'Initialize Report' },
  { num: 2, name: 'Fetch Requirements' },
  { num: 3, name: 'Compile Document Layout' },
  { num: 4, name: 'Render PDF' },
  { num: 5, name: 'Secure Storage Upload' }
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://regulation-compiler.onrender.com/api/v1';

export function ReportGenerator({ regulationId, getToken }: { regulationId: string, getToken: () => Promise<string | null> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([REPORT_TYPES[0].id]);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  
  const [activeStage, setActiveStage] = useState<number>(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const toggleType = (id: string) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTypes(REPORT_TYPES.map(t => t.id));
  };

  const clearAll = () => {
    setSelectedTypes([]);
  };

  const handleReset = () => {
    setJobId(null);
    setReportId(null);
    setActiveStage(0);
    setCompletedStages([]);
    setError(null);
    setDownloadUrl(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleStartGeneration = async () => {
    if (selectedTypes.length === 0) return;
    try {
      handleReset();

      const res = await generateReport(regulationId, selectedTypes);
      if (!res.success) throw new Error(res.error);
      
      setJobId(res.data.job_id);
      setReportId(res.data.report_id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resolveDownloadUrl = (pathOrUrl: string) => {
    if (!pathOrUrl) return null;
    const isLocalUrl = pathOrUrl.includes('127.0.0.1') || pathOrUrl.includes('localhost');
    const isCurrentEnvLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (pathOrUrl.startsWith('http')) {
      if (isLocalUrl && !isCurrentEnvLocal) {
        return `${API_BASE.replace('/api/v1', '')}/api/v1/reports/${reportId}/download`;
      }
      return pathOrUrl;
    }
    return `${API_BASE.replace('/api/v1', '')}${pathOrUrl}`;
  };

  const getEffectiveApiBase = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://127.0.0.1:8080/api/v1';
    }
    return API_BASE;
  };

  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;
    let eventSource: EventSource | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    const connectSSE = async () => {
      let token = "";
      try {
        if (getToken) {
          token = await getToken() || "";
        }
      } catch (e) {
        // Fallback for local testing or unauthenticated mode
      }

      const activeBase = getEffectiveApiBase();
      const sseUrl = `${activeBase}/jobs/${jobId}/events${token ? `?token=${token}` : ''}`;
      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);

          if (data.stage_number) {
            setActiveStage(data.stage_number);
          }
          
          if (data.status === 'completed') {
            setCompletedStages(prev => [...new Set([...prev, data.stage_number])]);
            
            if (data.stage_number === 5) {
              if (pollTimer) clearInterval(pollTimer);
              eventSource?.close();
              if (data.details?.path) {
                const fullUrl = resolveDownloadUrl(data.details.path);
                if (fullUrl) setDownloadUrl(fullUrl);
              }
              fetchDownloadUrl();
            }
          } else if (data.status === 'failed') {
            if (pollTimer) clearInterval(pollTimer);
            setError(data.details?.error || "Report generation failed");
            eventSource?.close();
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      eventSource.onerror = () => {
        // Do not fail on SSE error; parallel poller below guarantees completion
      };
    };

    connectSSE();

    // Parallel active poller guarantees the UI NEVER hangs on dropped SSE connections
    pollTimer = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await pollReports(regulationId);
        if (res.success && res.data) {
          const report = res.data.find((r: any) => r.id === reportId);
          if (report) {
            if (report.status === 'completed') {
              setActiveStage(5);
              setCompletedStages([1, 2, 3, 4, 5]);
              if (report.download_url) {
                const fullUrl = resolveDownloadUrl(report.download_url);
                if (fullUrl) setDownloadUrl(fullUrl);
              }
              if (pollTimer) clearInterval(pollTimer);
              eventSource?.close();
            } else if (report.status === 'failed') {
              setError("Report generation failed");
              if (pollTimer) clearInterval(pollTimer);
              eventSource?.close();
            }
          }
        }
      } catch (pollErr) {
        console.warn("Parallel report polling check:", pollErr);
      }
    }, 1200);

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      eventSource?.close();
    };
  }, [jobId, reportId, regulationId]);

  const fetchDownloadUrl = async () => {
    try {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 15) {
           clearInterval(poll);
           return;
        }
        const res = await pollReports(regulationId);
        if (res.success && res.data) {
           const report = res.data.find((r: any) => r.id === reportId);
           if (report && report.status === 'completed' && report.download_url) {
              const fullUrl = resolveDownloadUrl(report.download_url);
              if (fullUrl) setDownloadUrl(fullUrl);
              clearInterval(poll);
           }
        }
      }, 1000);
    } catch (e) {
      console.error("Error polling reports:", e);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center justify-between p-4 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-900/50 rounded-lg text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-purple-100">Generate Report</div>
            <div className="text-xs text-purple-300/70">Produce a compliance manifest</div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-purple-500/50 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Report Generator
              </h2>
              <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!jobId ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-zinc-200">
                          Select Report Sections
                        </span>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Select one or more modules to compile a unified, comprehensive audit report.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded hover:bg-purple-950/40 transition-colors"
                        >
                          Select All
                        </button>
                        <span className="text-zinc-700">•</span>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800/40 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/60 border border-zinc-800/70 rounded-lg text-xs mb-3">
                      <span className="text-zinc-400">Included Modules:</span>
                      <span className="font-semibold text-purple-400">
                        {selectedTypes.length} of {REPORT_TYPES.length} selected
                      </span>
                    </div>

                    <div className="grid gap-2.5">
                      {REPORT_TYPES.map(type => {
                        const isChecked = selectedTypes.includes(type.id);
                        return (
                          <label 
                            key={type.id}
                            htmlFor={`report-type-${type.id}`}
                            className={`group p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isChecked 
                                ? 'bg-purple-950/25 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.08)]' 
                                : 'bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/80'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              name="report_sections"
                              id={`report-type-${type.id}`}
                              value={type.id}
                              checked={isChecked}
                              onChange={() => toggleType(type.id)}
                              className="sr-only"
                            />
                            <div className="pr-4">
                              <div className={`font-medium text-sm transition-colors ${isChecked ? 'text-purple-200' : 'text-zinc-200 group-hover:text-white'}`}>
                                {type.title}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">{type.description}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              isChecked 
                                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                                : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={handleStartGeneration}
                    disabled={selectedTypes.length === 0}
                    className={`w-full py-3.5 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
                      selectedTypes.length === 0
                        ? 'bg-zinc-800/70 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.25)] cursor-pointer'
                    }`}
                  >
                    {selectedTypes.length === 0 ? (
                      'Select at least 1 section'
                    ) : (
                      <>
                        Start Generation ({selectedTypes.length} {selectedTypes.length === 1 ? 'Section' : 'Sections'}) <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-sm text-red-400">
                      Error: {error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  
                  <div className="space-y-6">
                    {REPORT_STAGES.map(stage => {
                      const isCompleted = completedStages.includes(stage.num);
                      const isActive = activeStage === stage.num && !isCompleted;
                      const isPending = stage.num > activeStage;

                      return (
                        <div key={stage.num} className="flex gap-4">
                          <div className="flex flex-col items-center mt-0.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300
                              ${isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 
                                isActive ? 'bg-purple-500/20 text-purple-400' : 
                                'bg-zinc-800/50 text-zinc-600'}`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                               isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                               <Circle className="w-3 h-3" />}
                            </div>
                            {stage.num !== REPORT_STAGES.length && (
                              <div className={`w-px h-full my-1 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800'}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <span className={`text-sm font-semibold transition-colors duration-300 
                              ${isPending ? 'text-zinc-600' : 'text-zinc-200'}`}
                            >
                              {stage.num}. {stage.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-lg text-sm text-red-400">
                      Error: {error}
                    </div>
                  )}

                  {downloadUrl && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pt-4 border-t border-zinc-800">
                      <a 
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-colors"
                      >
                        <FileText className="w-5 h-5" />
                        Download Unified Report ({selectedTypes.length} {selectedTypes.length === 1 ? 'Section' : 'Sections'})
                      </a>
                      <button
                        onClick={handleReset}
                        className="w-full mt-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium rounded-xl border border-zinc-800 transition-colors"
                      >
                        Generate Another Report
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
