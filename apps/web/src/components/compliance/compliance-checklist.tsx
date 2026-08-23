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
    loadChecklist();
  }, []);

  async function loadChecklist() {
    try {
      const data = await getComplianceChecklist();
      setItems(data);
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
        <span className="text-sm font-medium">Loading comprehensive checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Compliance Checklist</h2>
          <p className="text-sm text-zinc-400 mt-1">A unified, flat view of every evaluated control across your active policies.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0a0a0c] border border-zinc-800 border-dashed rounded-xl">
          <ListChecks className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Checklist Empty</h3>
          <p className="text-zinc-400 max-w-md">
            No compliance checks have been recorded yet. Run an evaluation from the Policies tab to populate this checklist.
          </p>
        </div>
      ) : (
        <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-black/50">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-5 hover:bg-zinc-900/30 transition-colors ${i !== items.length - 1 ? 'border-b border-zinc-800' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0">
                  {item.status === 'pass' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                  {item.status === 'fail' && <XCircle className="w-6 h-6 text-red-500" />}
                  {item.status === 'unknown' && <AlertCircle className="w-6 h-6 text-yellow-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-zinc-500 font-medium">Source: <span className="text-zinc-400">{item.regulation}</span></p>
                    {item.status === 'fail' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase tracking-wide">Requires Action</span>}
                    {item.status === 'unknown' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 uppercase tracking-wide">Needs Evidence</span>}
                  </div>
                </div>
              </div>
              {item.status !== 'pass' && item.compliance_check_id && (
                <button 
                  onClick={() => setActiveRemediation(item)}
                  className="shrink-0 text-xs text-blue-400 hover:text-blue-300 font-medium px-4 py-2 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors bg-blue-500/5 ml-4"
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
          checkId={activeRemediation.compliance_check_id}
          reqId={activeRemediation.requirement_id}
          title={activeRemediation.title}
        />
      )}
    </div>
  );
}
