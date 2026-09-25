'use client';
import { useState, useEffect } from 'react';
import { getPolicies, evaluateCompliance } from '@/app/(authenticated)/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ShieldCheck, Info, FileJson } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/intra-app-toast';
import { EvaluationResultModal } from './evaluation-result-modal';

interface PoliciesViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export function PoliciesView({ onNavigateTab }: PoliciesViewProps = {}) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const router = useRouter();
  const toast = useToast();
  
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
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

  function handleNavigate(tabId: string) {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else {
      router.push(`/dashboard?tab=${tabId}`);
    }
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
      
      // Close input payload modal
      setEvalModalOpen(false);
      
      // Open rich Intra-App Popup Modal
      setResultModalOpen(true);

      // Dispatch high-visibility intra-app notification toast
      toast.success(
        "Evaluation Complete!", 
        "System state compiled against policy rules. Check Dashboard and Gap Analysis tabs.",
        {
          action: {
            label: "Open Dashboard",
            onClick: () => handleNavigate('dashboard'),
          },
          secondaryAction: {
            label: "Gap Analysis",
            onClick: () => handleNavigate('gaps'),
          },
          duration: 6000,
        }
      );
    } catch (e: any) {
      console.error("Compliance evaluation error:", e);
      setEvalError('Evaluation failed. Please verify your system payload.');
      toast.error(
        "Evaluation Failed", 
        e?.message || "Unable to evaluate policy against system context. Check console logs."
      );
    } finally {
      setEvaluating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[#64748B] bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4D8FCC]" />
        <span className="text-sm font-medium font-mono text-[#CBD5E1]">Loading mapped policies...</span>
      </div>
    );
  }

  if (!policies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#080A0E] border border-[var(--rc-border)] border-dashed rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#10141A] border border-[var(--rc-border)] flex items-center justify-center mb-4 text-[#64748B]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-[#F4F6F8] mb-2">No Active Policies</h3>
        <p className="text-[#94A3B8] max-w-md mb-6 text-sm leading-relaxed">
          A Policy maps regulatory requirements directly to your organizational systems. 
          Upload a regulation and parse its rules to automatically generate your first active policy.
        </p>
        <Button onClick={() => router.push('/regulations/new')} className="bg-[#4D8FCC] hover:bg-[#3D7BBB] text-white cursor-pointer shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Upload Regulation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--rc-border)]">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8]">Active Policies</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Policies dictate which regulations are currently enforced and monitored against your systems.</p>
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
            <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E] hover:border-[var(--rc-border-subtle)] transition-colors gap-6">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-[#F4F6F8] truncate">{p.regulation_name}</h3>
                  <span className="px-2.5 py-0.5 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] rounded-full text-xs font-mono font-medium uppercase tracking-wider flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" />
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-1">
                  <Info className="w-3.5 h-3.5 text-[#4D8FCC]" />
                  <span>Actively monitoring <strong>{p.total_requirements}</strong> extracted rules against connected environments.</span>
                </div>
              </div>

              <div className="w-full md:w-64 shrink-0">
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5 font-mono">
                  <span>Severity Breakdown</span>
                  <span>{p.total_requirements} Total</span>
                </div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-[#10141A]">
                  <div style={{ width: `${cPct}%` }} className="bg-rose-500" title={`Critical: ${p.severity_breakdown.critical}`} />
                  <div style={{ width: `${hPct}%` }} className="bg-amber-500" title={`High: ${p.severity_breakdown.high}`} />
                  <div style={{ width: `${mPct}%` }} className="bg-[#C9B88A]" title={`Medium: ${p.severity_breakdown.medium}`} />
                  <div style={{ width: `${lPct}%` }} className="bg-[#4D8FCC]" title={`Low: ${p.severity_breakdown.low}`} />
                </div>
                <div className="flex gap-3 text-[10px] text-[#64748B] mt-2 font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>{p.severity_breakdown.critical}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>{p.severity_breakdown.high}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#C9B88A]"/>{p.severity_breakdown.medium}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC]"/>{p.severity_breakdown.low}</span>
                </div>
              </div>

              <div className="flex items-center justify-end w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-[var(--rc-border)] pt-4 md:pt-0 md:pl-6">
                <Button variant="secondary" onClick={() => openEvalModal(p.id)} className="w-full md:w-auto bg-[#10141A] text-[#F4F6F8] border border-[var(--rc-border)] hover:border-[var(--rc-border-subtle)] cursor-pointer">
                  Evaluate Policy
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      <Dialog open={evalModalOpen} onOpenChange={setEvalModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[#080A0E] border-[var(--rc-border)] p-0 overflow-hidden text-[#F4F6F8]">
          <DialogHeader className="p-6 pb-4 border-b border-[var(--rc-border)] bg-[#0B0E14]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#4D8FCC]/15 text-[#93C5FD] border border-[#4D8FCC]/30 rounded-xl">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#F4F6F8]">Evaluate System Context</DialogTitle>
                <DialogDescription className="text-[#94A3B8] mt-1 text-xs">
                  Provide your system's architecture or configuration payload to evaluate it against the active policy.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2 block">System State Payload (JSON)</label>
                <textarea 
                  className="w-full h-64 bg-[#050608] border border-[var(--rc-border)] rounded-xl p-4 text-xs font-mono text-[#CBD5E1] focus:outline-none focus:border-[#4D8FCC] transition-all resize-none"
                  value={evalPayload}
                  onChange={(e) => {
                    setEvalPayload(e.target.value);
                    if (evalError) setEvalError('');
                  }}
                  spellCheck={false}
                />
                {evalError && (
                  <p className="text-rose-400 text-xs mt-2 font-mono flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2" />
                    {evalError}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-4 px-6 border-t border-[var(--rc-border)] bg-[#0B0E14]">
            <Button variant="ghost" onClick={() => setEvalModalOpen(false)} className="text-[#94A3B8] hover:text-white hover:bg-[#10141A] cursor-pointer">
              Cancel
            </Button>
            <Button onClick={submitEvaluation} disabled={evaluating} className="bg-[#4D8FCC] hover:bg-[#3D7BBB] text-white min-w-[120px] cursor-pointer shadow-sm font-mono text-xs">
              {evaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Run Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EvaluationResultModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        onNavigateToDashboard={() => handleNavigate('dashboard')}
        onNavigateToGaps={() => handleNavigate('gaps')}
        policyTitle={policies.find(p => p.id === evalPolicyId)?.regulation_name}
      />
    </div>
  );
}
