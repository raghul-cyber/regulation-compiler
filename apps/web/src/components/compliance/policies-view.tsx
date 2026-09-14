'use client';
import { useState, useEffect } from 'react';
import { getPolicies, evaluateCompliance } from '@/app/(authenticated)/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ShieldCheck, Info, FileJson } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

export function PoliciesView() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const router = useRouter();
  
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalPolicyId, setEvalPolicyId] = useState<string | null>(null);
  const [evalPayload, setEvalPayload] = useState('{\n  "encryption": true,\n  "access_control": true\n}');
  const [evalError, setEvalError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    loadPolicies().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  async function loadPolicies() {
    try {
      const data = await getPolicies();
      if (Array.isArray(data) && data.length > 0) {
        setPolicies(data);
      }
    } catch (e) {
      console.error("Error loading policies:", e);
    } finally {
      setLoading(false);
    }
  }


  function openEvalModal(policyId: string) {
    setEvalPolicyId(policyId);
    setEvalModalOpen(true);
    setEvalError('');
  }

  async function submitEvaluation() {
    if (!evalPolicyId) return;
    
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(evalPayload);
      setEvalError('');
    } catch (e) {
      setEvalError('Invalid JSON format. Please fix the payload.');
      return;
    }

    setEvaluating(true);
    try {
      await evaluateCompliance(evalPolicyId, parsedPayload);
      alert("Evaluation complete! Check Dashboard and Gap Analysis tabs.");
      setEvalModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Evaluation failed. See console.");
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-[#0a0a0c] border border-zinc-800 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span className="text-sm font-medium">Loading mapped policies...</span>
      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0a0a0c] border border-zinc-800 border-dashed rounded-xl">
        <ShieldCheck className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Policies</h3>
        <p className="text-zinc-400 max-w-md mb-6">
          A Policy maps regulatory requirements directly to your organizational systems. 
          Upload a regulation and parse its rules to automatically generate your first active policy.
        </p>
        <Button onClick={() => router.push('/regulations/new')} className="bg-blue-600 hover:bg-blue-500">
          <Plus className="w-4 h-4 mr-2" />
          Upload Regulation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Active Policies</h2>
          <p className="text-sm text-zinc-400 mt-1">Policies dictate which regulations are currently enforced and monitored against your systems.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {policies.map(p => {
          const total = p.total_requirements || 1; 
          const cPct = (p.severity_breakdown.critical / total) * 100;
          const hPct = (p.severity_breakdown.high / total) * 100;
          const mPct = (p.severity_breakdown.medium / total) * 100;
          const lPct = (p.severity_breakdown.low / total) * 100;

          return (
            <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] gap-6">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-white truncate">{p.regulation_name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Actively monitoring <strong>{p.total_requirements}</strong> extracted rules against connected environments.</span>
                </div>
              </div>

              <div className="w-full md:w-64 shrink-0">
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                  <span>Severity Breakdown</span>
                  <span>{p.total_requirements} Total</span>
                </div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-800">
                  <div style={{ width: `${cPct}%` }} className="bg-red-500" title={`Critical: ${p.severity_breakdown.critical}`} />
                  <div style={{ width: `${hPct}%` }} className="bg-orange-500" title={`High: ${p.severity_breakdown.high}`} />
                  <div style={{ width: `${mPct}%` }} className="bg-yellow-500" title={`Medium: ${p.severity_breakdown.medium}`} />
                  <div style={{ width: `${lPct}%` }} className="bg-zinc-500" title={`Low: ${p.severity_breakdown.low}`} />
                </div>
                <div className="flex gap-3 text-[10px] text-zinc-500 mt-2 font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/>{p.severity_breakdown.critical}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"/>{p.severity_breakdown.high}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"/>{p.severity_breakdown.medium}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500"/>{p.severity_breakdown.low}</span>
                </div>
              </div>

              <div className="flex items-center justify-end w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                <Button variant="secondary" onClick={() => openEvalModal(p.id)} className="w-full md:w-auto">
                  Evaluate Policy
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      <Dialog open={evalModalOpen} onOpenChange={setEvalModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#0f0f11] border-zinc-800 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-zinc-800/60 bg-[#0a0a0c]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl text-white">Evaluate System Context</DialogTitle>
                <DialogDescription className="text-zinc-400 mt-1">
                  Provide your system's architecture or configuration payload to evaluate it against the active policy.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">System State Payload (JSON)</label>
                <textarea 
                  className="w-full h-64 bg-[#050505] border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                  value={evalPayload}
                  onChange={(e) => {
                    setEvalPayload(e.target.value);
                    if (evalError) setEvalError('');
                  }}
                  spellCheck={false}
                />
                {evalError && (
                  <p className="text-red-400 text-sm mt-2 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                    {evalError}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-4 px-6 border-t border-zinc-800/60 bg-[#0a0a0c]">
            <Button variant="ghost" onClick={() => setEvalModalOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              Cancel
            </Button>
            <Button onClick={submitEvaluation} disabled={evaluating} className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]">
              {evaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
