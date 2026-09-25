'use client';
import { useState, useEffect } from 'react';
import { getComplianceChecklist } from '@/app/(authenticated)/dashboard/actions';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ListChecks } from 'lucide-react';
import { RemediationModal } from './remediation-modal';

export function ComplianceChecklist() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRemediation, setActiveRemediation] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    loadChecklist().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  async function loadChecklist() {
    try {
      const data = await getComplianceChecklist();
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      }
    } catch (e) {
      console.error("Error loading checklist:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[#64748B] bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4D8FCC]" />
        <span className="text-sm font-medium font-mono text-[#CBD5E1]">Loading comprehensive checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--rc-border)]">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8]">Compliance Checklist</h2>
          <p className="text-sm text-[#94A3B8] mt-1">A unified, flat view of every evaluated control across your active policies.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#080A0E] border border-[var(--rc-border)] border-dashed rounded-2xl">
          <ListChecks className="w-12 h-12 text-[#64748B] mb-4" />
          <h3 className="text-xl font-bold text-[#F4F6F8] mb-2">Checklist Empty</h3>
          <p className="text-[#94A3B8] max-w-md text-sm leading-relaxed">
            No compliance checks have been recorded yet. Run an evaluation from the Policies tab to populate this checklist.
          </p>
        </div>
      ) : (
        <div className="bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl overflow-hidden shadow-xl">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-5 hover:bg-[#0B0E14] transition-colors ${i !== items.length - 1 ? 'border-b border-[var(--rc-border)]' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  {item.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
                  {item.status === 'fail' && <XCircle className="w-5 h-5 text-rose-400" />}
                  {item.status === 'unknown' && <AlertCircle className="w-5 h-5 text-[#C9B88A]" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F4F6F8]">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 font-mono">
                    <p className="text-xs text-[#64748B]">Source: <span className="text-[#94A3B8]">{item.regulation}</span></p>
                    {item.status === 'fail' && <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide">Requires Action</span>}
                    {item.status === 'unknown' && <span className="text-[10px] px-2 py-0.5 rounded bg-[#C9B88A]/10 text-[#C9B88A] border border-[#C9B88A]/20 uppercase tracking-wide">Needs Evidence</span>}
                  </div>
                </div>
              </div>
              {item.status !== 'pass' && item.compliance_check_id && (
                <button 
                  onClick={() => setActiveRemediation(item)}
                  className="shrink-0 text-xs font-mono text-[#93C5FD] hover:text-white font-medium px-4 py-1.5 border border-[#4D8FCC]/30 rounded-lg hover:bg-[#4D8FCC]/20 transition-colors bg-[#4D8FCC]/10 ml-4 cursor-pointer"
                >
                  Resolve Item
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeRemediation && (
        <RemediationModal 
          isOpen={true} 
          onClose={() => setActiveRemediation(null)}
          onSuccess={() => {
            setActiveRemediation(null);
            loadChecklist();
          }}
          gap={activeRemediation}
        />
      )}
    </div>
  );
}
