import os

components_dir = "apps/web/src/components/compliance"

# 4. Compliance Checklist
checklist_view = """'use client';
import { useState, useEffect } from 'react';
import { getComplianceChecklist } from '@/lib/api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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

  if (loading) return <div className="text-zinc-500">Loading checklist...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Compliance Checklist</h2>
      <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center justify-between p-4 ${i !== items.length - 1 ? 'border-b border-zinc-800' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                {item.status === 'pass' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {item.status === 'fail' && <XCircle className="w-5 h-5 text-red-500" />}
                {item.status === 'missing' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                <p className="text-xs text-zinc-500 mt-1">Source: {item.regulation}</p>
              </div>
            </div>
            {item.status !== 'pass' && item.compliance_check_id && (
              <button 
                onClick={() => setActiveRemediation(item)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                Remediate
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="p-4 text-zinc-500">No checklist items found.</div>}
      </div>

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
"""

with open(os.path.join(components_dir, "compliance-checklist.tsx"), "w", encoding="utf-8") as f:
    f.write(checklist_view)

# 5. Remediation Modal
remediation_modal = """'use client';
import { useState } from 'react';
import { remediateCompliance } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function RemediationModal({ isOpen, onClose, onSuccess, checkId, reqId, title }: any) {
  const [payload, setPayload] = useState('{\\n  "fix_applied": true\\n}');
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
"""

with open(os.path.join(components_dir, "remediation-modal.tsx"), "w", encoding="utf-8") as f:
    f.write(remediation_modal)

print("Created component files 2")
