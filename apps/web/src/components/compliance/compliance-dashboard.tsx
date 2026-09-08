'use client';
import { useState, useEffect } from 'react';
import { getComplianceDashboard, getComplianceActivity } from '@/app/(authenticated)/dashboard/actions';
import { Loader2, ShieldAlert, Activity, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ComplianceDashboard() {
  const [data, setData] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [res, actRes] = await Promise.all([
        getComplianceDashboard(),
        getComplianceActivity()
      ]);
      setData(res);
      setActivity(actRes || []);
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
        <span className="text-sm font-medium">Loading evaluation metrics...</span>
      </div>
    );
  }
  
  if (!data || (data.compliant === 0 && data.non_compliant === 0 && data.missing_unknown === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#0a0a0c] border border-zinc-800 border-dashed rounded-xl">
        <Activity className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Awaiting System Evaluation</h3>
        <p className="text-zinc-400 max-w-md mb-6">
          The compliance dashboard aggregates the results of your policy evaluations. 
          Run an evaluation against your active policies to populate these metrics.
        </p>
      </div>
    );
  }

  const total = data.compliant + data.non_compliant + data.missing_unknown;
  const cPct = ((data.compliant / total) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Compliance Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">Aggregated health metrics across all evaluated policies and infrastructure payloads.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{cPct}%</div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Overall Score</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 text-emerald-500/20"><CheckCircle2 className="w-16 h-16"/></div>
          <h3 className="text-sm text-zinc-400 font-medium">Compliant Controls</h3>
          <p className="text-4xl font-bold text-emerald-400 mt-3">{data.compliant}</p>
          <p className="text-xs text-zinc-500 mt-4 leading-relaxed max-w-[80%]">Mapped systems fully satisfy these regulatory requirements.</p>
        </div>
        
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 text-red-500/10"><ShieldAlert className="w-16 h-16"/></div>
          <h3 className="text-sm text-zinc-400 font-medium">Non-Compliant</h3>
          <p className="text-4xl font-bold text-red-400 mt-3">{data.non_compliant}</p>
          <p className="text-xs text-zinc-500 mt-4 leading-relaxed max-w-[80%]">Identified gaps or violations in system implementation. Remediation required.</p>
        </div>
        
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 text-yellow-500/10"><HelpCircle className="w-16 h-16"/></div>
          <h3 className="text-sm text-zinc-400 font-medium">Missing / Unknown</h3>
          <p className="text-4xl font-bold text-yellow-400 mt-3">{data.missing_unknown}</p>
          <p className="text-xs text-zinc-500 mt-4 leading-relaxed max-w-[80%]">Controls awaiting manual mapping or undefined in payload.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">Critical Failing Items</h3>
            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded-md">{data.failing_items.length} Total Issues</span>
          </div>
          
          {data.failing_items.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
              No failing items detected in the latest evaluation.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.failing_items.slice(0, 5).map((item: any) => (
                <li key={item.requirement_id} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 flex items-start gap-3 hover:bg-zinc-800/50 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-zinc-200 text-sm">{item.requirement_title}</div>
                    <div className="text-xs text-zinc-500 mt-1">Found in evaluation of {item.policy_id.substring(0,8)}...</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
           <h3 className="text-lg font-medium text-white mb-6">Latest Activity</h3>
           <div className="space-y-6">
             {activity.length === 0 ? (
               <div className="text-sm text-zinc-500 italic">No recent activity.</div>
             ) : (
               activity.map((item: any) => (
                 <div key={item.id} className="relative pl-4 border-l border-zinc-800">
                   <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[4.5px] top-1" />
                   <p className="text-sm text-zinc-300">{item.action.replace(/_/g, ' ')}</p>
                   <p className="text-xs text-zinc-500 mt-1">{item.entity_type}: {item.entity_id.substring(0,8)}...</p>
                   <p className="text-xs text-zinc-600 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
