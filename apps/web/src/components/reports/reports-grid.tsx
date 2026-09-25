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
          <h1 className="text-2xl font-bold text-[#F4F6F8] mb-1.5">Reports Library</h1>
          <p className="text-xs text-[#9CA3AF]">Download immutable, point-in-time compliance reports generated from your enforceable requirements.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4D8FCC] hover:bg-[#3B72A8] active:scale-[0.98] text-white px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer border border-[#79B5EC]/20"
        >
          <Plus className="w-3.5 h-3.5" /> Generate New Report
        </button>
      </div>

      {initialReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialReports.map((report) => (
            <div key={report.id} className="bg-[#080A0E] border border-white/[0.08] rounded-[8px] p-5 h-full flex flex-col hover:border-white/[0.16] transition-all shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#0B0E14] p-2 rounded-[6px] border border-white/[0.06]">
                  <FileText className="w-4 h-4 text-[#4D8FCC]" />
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-[4px] border ${getStatusStyle(report.status)}`}>
                  {report.status}
                </span>
              </div>
              
              <h3 className="text-sm font-bold text-[#F4F6F8] mb-1 capitalize">
                {report.report_type.replace(/_/g, ' ')}
              </h3>
              <p className="text-xs text-[#64748B] mb-6 flex-1 font-mono">
                Generated on {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
              </p>
              
              {report.status === 'completed' && report.download_url ? (
                <a 
                  href={getDownloadUrl(report.download_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full bg-[#0B0E14] hover:bg-[#11151A] text-[#CBD5E1] hover:text-[#F4F6F8] text-xs font-semibold py-2 rounded-[6px] border border-white/[0.08] transition-colors flex justify-center items-center gap-2 cursor-pointer uppercase tracking-wider font-mono"
                >
                  <Download className="w-3.5 h-3.5 text-[#4D8FCC]" /> Download PDF
                </a>
              ) : report.status === 'failed' ? (
                <button disabled className="w-full bg-rose-950/20 text-rose-400 border border-rose-900/40 text-xs font-medium py-2 rounded-[6px] cursor-not-allowed flex justify-center items-center gap-2 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Generation Failed
                </button>
              ) : (
                <button disabled className="w-full bg-[#0B0E14] text-[#64748B] border border-white/[0.06] text-xs font-medium py-2 rounded-[6px] cursor-not-allowed flex justify-center items-center gap-2 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4D8FCC]" /> Processing...
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full border border-dashed border-white/[0.08] rounded-[8px] p-12 flex flex-col items-center justify-center text-center bg-[#050608]">
          <div className="bg-[#080A0E] p-3 rounded-[6px] mb-4 border border-white/[0.08]">
            <FileText className="w-6 h-6 text-[#4D8FCC]" />
          </div>
          <h3 className="text-base font-bold text-[#F4F6F8] mb-1.5">No Reports Yet</h3>
          <p className="text-[#64748B] text-xs max-w-sm mb-6 leading-relaxed">Generate your first point-in-time compliance report to share with stakeholders or auditors.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white px-4 py-2 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer border border-[#79B5EC]/20"
          >
            Generate Report
          </button>
        </div>
      )}

      {/* Generate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => !isGenerating && setIsModalOpen(false)}></div>
          
          <div className="relative bg-[#080A0E] border border-white/[0.08] rounded-[10px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-[#050608]">
              <h2 className="text-base font-bold text-[#F4F6F8]">Generate New Report</h2>
              <button disabled={isGenerating} onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#F4F6F8] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-xs text-[#9CA3AF] mb-5">Select a report template. The system will compile the current state of all approved requirements into a signed PDF.</p>
              
              <div className="space-y-3">
                {REPORT_TYPES.map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setSelectedReportType(type.id)}
                    className={`w-full text-left p-4 rounded-[6px] border transition-all cursor-pointer ${selectedReportType === type.id ? 'bg-[#0B0E14] border-[#4D8FCC]/50 shadow-sm' : 'bg-[#050608] border-white/[0.06] hover:border-white/[0.14]'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#F4F6F8] text-sm">{type.title}</span>
                      {selectedReportType === type.id && <CheckCircle2 className="w-4 h-4 text-[#4D8FCC]" />}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/[0.06] bg-[#050608] flex justify-end space-x-3">
              <button disabled={isGenerating} onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#F4F6F8] transition-colors cursor-pointer">Cancel</button>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#4D8FCC] hover:bg-[#3B72A8] active:scale-[0.98] text-white rounded-[6px] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer shadow-sm border border-[#79B5EC]/20"
              >
                {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Generating...</> : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
