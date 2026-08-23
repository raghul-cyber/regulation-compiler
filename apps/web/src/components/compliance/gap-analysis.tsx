'use client';
import { useState, useEffect } from 'react';
import { getGapAnalysis } from '@/app/(authenticated)/dashboard/actions';
import { RemediationModal } from './remediation-modal';
import { Loader2, Zap, CheckCircle2, AlertOctagon } from 'lucide-react';

export function GapAnalysis() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRemediation, setActiveRemediation] = useState<any>(null);

  useEffect(() => {
    loadGaps();
  }, []);

  async function loadGaps() {
    try {
      const data = await getGapAnalysis();
      setGaps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-[#0a0a0c] border border-zinc-800 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span className="text-sm font-medium">Analyzing system gaps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Gap Analysis</h2>
          <p className="text-sm text-zinc-400 mt-1">Review unmapped requirements and implement remediation plans to close compliance gaps.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0a0a0c] border border-zinc-800 border-dashed rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Gaps Identified</h3>
            <p className="text-zinc-400 max-w-md">
              All active policy controls are successfully mapped to your systems. Great job maintaining compliance!
            </p>
          </div>
        ) : (
          gaps.map((gap, i) => (
            <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-start md:items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-1 md:mt-0" />
                  <h4 className="text-zinc-100 font-medium text-lg leading-snug">{gap.title}</h4>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase tracking-wider ${gap.gap_type === 'Missing Evidence/Data' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {gap.gap_type}
                  </span>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-sm">
                  <span className="text-blue-400 font-medium mb-1 block flex items-center gap-2"><Zap className="w-4 h-4"/> AI Recommended Action</span> 
                  <span className="text-zinc-300 leading-relaxed">{gap.recommended_action}</span>
                </div>
              </div>
              <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                <button onClick={() => setActiveRemediation(gap)} className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                  Remediate Gap
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {activeRemediation && (
        <RemediationModal 
          isOpen={true} 
          onClose={() => setActiveRemediation(null)}
          onSuccess={() => {
            setActiveRemediation(null);
            loadGaps();
          }}
          checkId={activeRemediation.compliance_check_id}
          reqId={activeRemediation.requirement_id}
          title={activeRemediation.title}
        />
      )}
    </div>
  );
}
