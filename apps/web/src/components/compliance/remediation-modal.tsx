'use client';
import { useState } from 'react';
import { remediateCompliance } from '@/app/(authenticated)/dashboard/actions';
import { Loader2 } from 'lucide-react';

export function RemediationModal({ isOpen, onClose, onSuccess, checkId, reqId, title }: any) {
  const [payload, setPayload] = useState('{\n  "fix_applied": true\n}');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      await remediateCompliance(checkId, reqId, JSON.parse(payload));
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to apply remediation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0a0a0c] border border-zinc-800 rounded-xl shadow-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-2">Remediate Violation</h3>
        <p className="text-sm text-zinc-400 mb-6">Requirement: <span className="text-zinc-200">{title}</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Updated System Payload</label>
            <textarea
              className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={payload}
              onChange={e => setPayload(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apply Fix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
