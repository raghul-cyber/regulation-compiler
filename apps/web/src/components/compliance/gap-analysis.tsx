'use client';
import { useState, useEffect } from 'react';
import { getGapAnalysis } from '@/app/(authenticated)/dashboard/actions';
import { RemediationModal } from './remediation-modal';
import { Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';

export function GapAnalysis() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRemediation, setActiveRemediation] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    loadGaps().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  async function loadGaps() {
    try {
      const data = await getGapAnalysis();
      if (Array.isArray(data) && data.length > 0) {
        setGaps(data);
      }
    } catch (e) {
      console.error("Error loading gap analysis:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[#64748B] bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4D8FCC]" />
        <span className="text-sm font-medium font-mono text-[#CBD5E1]">Analyzing system gaps...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--rc-border)]">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8]">Gap Analysis</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Review unmapped requirements and implement remediation plans to close compliance gaps.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {gaps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#080A0E] border border-[var(--rc-border)] border-dashed rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-[#10B981] mb-4" />
            <h3 className="text-xl font-bold text-[#F4F6F8] mb-2">No Gaps Identified</h3>
            <p className="text-[#94A3B8] max-w-md text-sm leading-relaxed">
              All active policy controls are successfully mapped to your systems. Great job maintaining compliance!
            </p>
          </div>
        ) : (
          gaps.map((gap, i) => (
            <div key={i} className="p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E] hover:border-[var(--rc-border-subtle)] transition-colors flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-start md:items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-1 md:mt-0" />
                  <h4 className="text-[#F4F6F8] font-bold text-base leading-snug">{gap.title}</h4>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md uppercase tracking-wider ${
                    gap.gap_type === 'Missing Evidence/Data' 
                      ? 'bg-[#C9B88A]/15 text-[#C9B88A] border border-[#C9B88A]/30' 
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {gap.gap_type}
                  </span>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-[#050608] border border-[var(--rc-border)] text-xs">
                  <span className="text-[#4D8FCC] font-mono font-bold mb-1.5 flex items-center gap-2">
                    <RCIcon name="compiler" size={14} className="text-[#4D8FCC]" />
                    Algorithmic Remediation Directive
                  </span> 
                  <span className="text-[#CBD5E1] leading-relaxed block">{gap.recommended_action}</span>
                </div>
              </div>
              <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-[var(--rc-border)] pt-4 md:pt-0 md:pl-6">
                <button 
                  onClick={() => setActiveRemediation(gap)} 
                  className="w-full md:w-auto px-6 py-2.5 bg-[#4D8FCC] hover:bg-[#3D7BBB] text-white text-xs font-mono font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
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
          gap={activeRemediation}
        />
      )}
    </div>
  );
}
