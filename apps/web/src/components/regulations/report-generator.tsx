'use client';

import { useState, useEffect } from 'react';
import { FileText, ArrowRight, Loader2, X, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
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

export function ReportGenerator({ regulationId, getToken }: { regulationId: string, getToken: () => Promise<string | null> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0].id);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  
  const [activeStage, setActiveStage] = useState<number>(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleStartGeneration = async () => {
    try {
      setJobId(null);
      setReportId(null);
      setActiveStage(0);
      setCompletedStages([]);
      setError(null);
      setDownloadUrl(null);

      const res = await generateReport(regulationId, selectedType);
      if (!res.success) throw new Error(res.error);
      
      setJobId(res.data.job_id);
      setReportId(res.data.report_id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    let eventSource: EventSource | null = null;
    let isMounted = true;

    const connectSSE = async () => {
      const token = await getToken();
      if (!token) return;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      eventSource = new EventSource(`${API_BASE}/jobs/${jobId}/events?token=${token}`);

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);

        setActiveStage(data.stage_number);
        
        if (data.status === 'completed') {
          setCompletedStages(prev => [...new Set([...prev, data.stage_number])]);
          
          if (data.stage_number === 5) {
            eventSource?.close();
            fetchDownloadUrl();
          }
        } else if (data.status === 'failed') {
          setError(data.details?.error || "Report generation failed");
          eventSource?.close();
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    };

    connectSSE();

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, [jobId]);

  const fetchDownloadUrl = async () => {
    try {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 5) {
           clearInterval(poll);
           setError("Failed to fetch download URL. Please try again.");
           return;
        }
        const res = await pollReports(regulationId);
        if (res.success && res.data) {
           const report = res.data.find((r: any) => r.id === reportId);
           if (report && report.status === 'completed' && report.download_url) {
              setDownloadUrl(report.download_url);
              clearInterval(poll);
           }
        }
      }, 2000);
    } catch (e) {
      console.error(e);
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
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!jobId ? (
                <div className="space-y-6">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-zinc-300">Select Report Type</legend>
                    <div className="grid gap-3 mt-2">
                      {REPORT_TYPES.map(type => (
                        <label 
                          key={type.id}
                          htmlFor={`report-type-${type.id}`}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedType === type.id ? 'bg-purple-900/20 border-purple-500/50' : 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700'}`}
                        >
                          <input 
                            type="radio"
                            name="report_type"
                            id={`report-type-${type.id}`}
                            value={type.id}
                            checked={selectedType === type.id}
                            onChange={() => setSelectedType(type.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`font-medium ${selectedType === type.id ? 'text-purple-300' : 'text-zinc-200'}`}>
                                {type.title}
                              </div>
                              <div className="text-xs text-zinc-500 mt-1">{type.description}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedType === type.id ? 'border-purple-500' : 'border-zinc-700'}`}>
                              {selectedType === type.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <button 
                    onClick={handleStartGeneration}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors shadow-[0_0_20px_rgba(147,51,234,0.2)] flex items-center justify-center gap-2"
                  >
                    Start Generation <ChevronRight className="w-4 h-4" />
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
                        Download Generated Report
                      </a>
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
