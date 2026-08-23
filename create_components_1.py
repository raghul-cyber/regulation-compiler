import os

components_dir = "apps/web/src/components/compliance"

# 1. Policies View
policies_view = """'use client';
import { useState, useEffect } from 'react';
import { getPolicies, evaluateCompliance } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function PoliciesView() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  async function loadPolicies() {
    try {
      const data = await getPolicies();
      setPolicies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate(policyId: string) {
    setEvaluating(policyId);
    try {
      const mockPayload = { "encryption": true, "access_control": true }; // Mock payload for now
      const payloadString = prompt("Enter mock system JSON payload for evaluation:", JSON.stringify(mockPayload));
      if (!payloadString) return;
      
      const payload = JSON.parse(payloadString);
      await evaluateCompliance(policyId, payload);
      alert("Evaluation complete! Check Dashboard tab.");
    } catch (e) {
      console.error(e);
      alert("Evaluation failed.");
    } finally {
      setEvaluating(null);
    }
  }

  if (loading) return <div className="text-zinc-500">Loading policies...</div>;
  if (!policies.length) return <div className="text-zinc-500">No active policies found.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Active Policies</h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0a0a0c]">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase text-zinc-300">
            <tr>
              <th className="px-6 py-3">Regulation Source</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Reqs</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} className="border-b border-zinc-800">
                <td className="px-6 py-4 font-medium text-zinc-100">{p.regulation_name}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">{p.status}</span></td>
                <td className="px-6 py-4">{p.total_requirements}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-400">C:{p.severity_breakdown.critical}</span>
                    <span className="text-orange-400">H:{p.severity_breakdown.high}</span>
                    <span className="text-yellow-400">M:{p.severity_breakdown.medium}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button size="sm" variant="outline" onClick={() => handleEvaluate(p.id)} disabled={evaluating === p.id}>
                    {evaluating === p.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Run Evaluation
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

with open(os.path.join(components_dir, "policies-view.tsx"), "w", encoding="utf-8") as f:
    f.write(policies_view)

# 2. Compliance Dashboard
dashboard_view = """'use client';
import { useState, useEffect } from 'react';
import { getComplianceDashboard } from '@/lib/api';

export function ComplianceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await getComplianceDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-zinc-500">Loading dashboard...</div>;
  if (!data) return <div className="text-zinc-500">No data available. Run an evaluation first!</div>;

  const total = data.compliant + data.non_compliant + data.missing_unknown;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Compliance Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
          <h3 className="text-sm text-zinc-400">Compliant</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">{data.compliant}</p>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
          <h3 className="text-sm text-zinc-400">Non-Compliant</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">{data.non_compliant}</p>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
          <h3 className="text-sm text-zinc-400">Missing / Unknown</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{data.missing_unknown}</p>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
        <h3 className="text-lg font-medium text-white mb-4">Failing Items ({data.failing_items.length})</h3>
        <ul className="space-y-2">
          {data.failing_items.map((item: any, i: number) => (
            <li key={i} className="flex justify-between items-center p-3 bg-zinc-900/50 rounded border border-zinc-800 text-sm">
              <span className="text-zinc-300 font-medium">{item.title}</span>
              <span className={`px-2 py-1 rounded text-xs ${item.gap === 'Missing Control' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {item.gap}
              </span>
            </li>
          ))}
          {data.failing_items.length === 0 && <li className="text-zinc-500 text-sm">No failing items!</li>}
        </ul>
      </div>
    </div>
  );
}
"""

with open(os.path.join(components_dir, "compliance-dashboard.tsx"), "w", encoding="utf-8") as f:
    f.write(dashboard_view)

# 3. Gap Analysis
gap_analysis = """'use client';
import { useState, useEffect } from 'react';
import { getGapAnalysis } from '@/lib/api';
import { RemediationModal } from './remediation-modal';

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

  if (loading) return <div className="text-zinc-500">Loading gaps...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Gap Analysis</h2>
      
      <div className="space-y-4">
        {gaps.map((gap, i) => (
          <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-[#0a0a0c] flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h4 className="text-zinc-100 font-medium">{gap.title}</h4>
              <div className="mt-1 flex gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${gap.gap_type === 'Missing Control' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  Gap: {gap.gap_type}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-400"><span className="text-zinc-300 font-medium">Recommended Action:</span> {gap.recommended_action}</p>
            </div>
            <button onClick={() => setActiveRemediation(gap)} className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Remediate
            </button>
          </div>
        ))}
        {gaps.length === 0 && <div className="text-zinc-500">No gaps found.</div>}
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
"""

with open(os.path.join(components_dir, "gap-analysis.tsx"), "w", encoding="utf-8") as f:
    f.write(gap_analysis)

print("Created component files")
