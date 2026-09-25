'use client';
import { useState } from 'react';
import { remediateCompliance } from '@/app/(authenticated)/dashboard/actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/intra-app-toast';

export function RemediationModal({ isOpen, onClose, onSuccess, checkId, reqId, title }: any) {
  const [payload, setPayload] = useState('{\n  "fix_applied": true\n}');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      await remediateCompliance(checkId, reqId, JSON.parse(payload));
      toast.success("Remediation Applied", "Updated system payload submitted successfully.");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Remediation Failed", err?.message || "Failed to apply remediation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-[#F4F6F8] mb-1.5">Remediate Violation</h3>
        <p className="text-xs text-[#94A3B8] mb-6">Requirement: <span className="text-[#F4F6F8] font-medium">{title}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-2">Updated System Payload (JSON)</label>
            <textarea
              className="w-full h-32 bg-[#050608] border border-[var(--rc-border)] rounded-xl p-3 text-xs text-[#CBD5E1] font-mono focus:outline-none focus:border-[#4D8FCC] transition-all resize-none"
              value={payload}
              onChange={e => setPayload(e.target.value)}
              spellCheck={false}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--rc-border)]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#94A3B8] hover:text-white hover:bg-[#10141A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2 rounded-lg text-xs font-mono font-medium text-white bg-[#4D8FCC] hover:bg-[#3D7BBB] transition-colors flex items-center cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Apply Fix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
