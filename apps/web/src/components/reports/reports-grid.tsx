'use client';

import { useState } from 'react';
import { generateReport } from '@/app/actions';
import { FileText, Plus, Download, AlertTriangle, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/intra-app-toast';

const REPORT_TYPES = [
  { id: 'executive_summary', title: 'Executive Summary', desc: 'High-level overview of total requirements and key obligations.' },
  { id: 'technical', title: 'Technical System Mapping', desc: 'Detailed mapping of required technical actions.' },
  { id: 'audit_evidence', title: 'Audit Evidence', desc: 'Comprehensive list of required evidence and documentation.' },
  { id: 'gap_analysis', title: 'Gap Analysis', desc: 'Highlights missing controls and critical risk areas.' },
  { id: 'checklist', title: 'Implementation Checklist', desc: 'Actionable checklist for compliance teams.' }
];

export function ReportsGrid({ regulationId, initialReports }: { regulationId: string, initialReports: any[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(REPORT_TYPES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateReport(regulationId, selectedReportType);
      if (!res.success) {
        toast.error("Generation Failed", res.error || "Failed to trigger report generation");
        return;
      }
      toast.success("Report Queued", "Your report generation task is processing.");
      setIsModalOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Failed to trigger report generation", e?.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse';
    }
  };

  const getDownloadUrl = (rawUrl: string) => {
    if (!rawUrl) return '#';
    const isLocalUrl = rawUrl.includes('127.0.0.1') || rawUrl.includes('localhost');
    const isCurrentEnvLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://regulation-compiler.onrender.com/api/v1';

    if (rawUrl.startsWith('http')) {
      if (isLocalUrl && !isCurrentEnvLocal) {
        return rawUrl.replace(/http:\/\/127\.0\.0\.1:8080/, apiBase.replace('/api/v1', ''));
      }
      return rawUrl;
    }
    return `${apiBase.replace('/api/v1', '')}${rawUrl}`;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Reports Library</h1>
          <p className="text-zinc-400 text-sm">Download immutable, point-in-time compliance reports generated from your enforceable requirements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Generate New Report
        </button>
      </div>

      {initialReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialReports.map((report) => (
            <div key={report.id} className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-5 h-full flex flex-col hover:border-zinc-700 transition-colors shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                  <FileText className="w-6 h-6 text-zinc-400" />
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getStatusStyle(report.status)}`}>
                  {report.status}
                </span>
              </div>
              
              <h3 className="text-base font-semibold text-zinc-100 mb-1 capitalize">
                {report.report_type.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-zinc-500 mb-6 flex-1">
                Generated on {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
              </p>
              
              {report.status === 'completed' && report.download_url ? (
                <a 
                  href={getDownloadUrl(report.download_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium py-2 rounded border border-zinc-800 transition-colors flex justify-center items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              ) : report.status === 'failed' ? (
                <button disabled className="w-full bg-red-950/30 text-red-500 border border-red-900/50 text-sm font-medium py-2 rounded cursor-not-allowed flex justify-center items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Generation Failed
                </button>
              ) : (
                <button disabled className="w-full bg-transparent text-zinc-600 border border-zinc-800 text-sm font-medium py-2 rounded cursor-not-allowed flex justify-center items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full border border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-zinc-900 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">No Reports Yet</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-6">Generate your first point-in-time compliance report to share with stakeholders or auditors.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-800"
          >
            Generate Report
          </button>
        </div>
      )}

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" onClick={() => !isGenerating && setIsModalOpen(false)}></div>
          
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#0a0a0c]">
              <h2 className="text-lg font-bold text-white">Generate New Report</h2>
              <button disabled={isGenerating} onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-zinc-400 mb-6">Select a report template. The system will compile the current state of all approved requirements into a signed PDF.</p>
              
              <div className="space-y-3">
                {REPORT_TYPES.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setSelectedReportType(type.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedReportType === type.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#0a0a0c] border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-zinc-200">{type.title}</span>
                      {selectedReportType === type.id && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                    </div>
                    <p className="text-xs text-zinc-500">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 border-t border-zinc-800 bg-[#0a0a0c] flex justify-end space-x-3">
              <button disabled={isGenerating} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500/50 focus:outline-none text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</> : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
