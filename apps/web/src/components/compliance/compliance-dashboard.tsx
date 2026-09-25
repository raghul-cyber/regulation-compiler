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
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    loadDashboard().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, []);

  async function loadDashboard() {
    try {
      const [res, actRes] = await Promise.all([
        getComplianceDashboard().catch(() => null),
        getComplianceActivity().catch(() => [])
      ]);
      if (res) {
        setData(res);
      }
      setActivity(actRes || []);
    } catch (e) {
      console.error("Error loading dashboard metrics:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-[#64748B] bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#4D8FCC]" />
        <span className="text-sm font-medium font-mono text-[#CBD5E1]">Loading evaluation metrics...</span>
      </div>
    );
  }
  
  if (!data || (data.compliant === 0 && data.non_compliant === 0 && data.missing_unknown === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#080A0E] border border-[var(--rc-border)] rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#10141A] border border-[var(--rc-border)] flex items-center justify-center mb-4 text-[#64748B]">
          <Activity className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-[#F4F6F8] mb-2">Awaiting System Evaluation</h3>
        <p className="text-[#94A3B8] max-w-md mb-6 text-sm leading-relaxed">
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
      <div className="flex items-center justify-between pb-4 border-b border-[var(--rc-border)]">
        <div>
          <h2 className="text-xl font-bold text-[#F4F6F8]">Compliance Overview</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Aggregated health metrics across all evaluated policies and infrastructure payloads.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#F4F6F8] font-mono">{cPct}%</div>
          <div className="text-xs text-[#64748B] uppercase tracking-wider font-mono font-medium">Overall Score</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider">Compliant Controls</span>
              <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#10B981] font-mono">{data.compliant}</p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-4 leading-relaxed">Mapped systems fully satisfy these regulatory requirements.</p>
        </div>
        
        <div className="p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider">Non-Compliant</span>
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-rose-400 font-mono">{data.non_compliant}</p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-4 leading-relaxed">Identified gaps or violations in system implementation. Remediation required.</p>
        </div>
        
        <div className="p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider">Missing / Unknown</span>
              <div className="p-2 rounded-lg bg-[#C9B88A]/15 text-[#C9B88A] border border-[#C9B88A]/30">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-[#C9B88A] font-mono">{data.missing_unknown}</p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-4 leading-relaxed">Controls awaiting manual mapping or undefined in payload.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-[#F4F6F8]">Critical Failing Items</h3>
            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-medium rounded-lg">
              {data.failing_items.length} Total Issues
            </span>
          </div>
          
          {data.failing_items.length === 0 ? (
            <div className="text-center py-12 text-[#64748B] text-xs font-mono">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#10B981]" />
              No failing items detected in the latest evaluation.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.failing_items.slice(0, 5).map((item: any) => (
                <li key={item.requirement_id} className="p-4 rounded-xl bg-[#050608] border border-[var(--rc-border)] flex items-start gap-3 hover:border-[var(--rc-border-subtle)] transition-colors">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#F4F6F8] text-sm">{item.requirement_title}</div>
                    <div className="text-xs font-mono text-[#64748B] mt-1">Found in evaluation of {item.policy_id.substring(0,8)}...</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-[var(--rc-border)] bg-[#080A0E]">
           <h3 className="text-base font-bold text-[#F4F6F8] mb-6">Latest Activity</h3>
           <div className="space-y-5">
             {activity.length === 0 ? (
               <div className="text-xs font-mono text-[#64748B] italic">No recent activity.</div>
             ) : (
               activity.map((item: any) => (
                 <div key={item.id} className="relative pl-4 border-l border-[var(--rc-border)]">
                   <div className="absolute w-2 h-2 bg-[#4D8FCC] rounded-full -left-[4.5px] top-1" />
                   <p className="text-xs font-semibold text-[#CBD5E1] capitalize">{item.action.replace(/_/g, ' ')}</p>
                   <p className="text-[11px] font-mono text-[#64748B] mt-0.5">{item.entity_type}: {item.entity_id.substring(0,8)}...</p>
                   <p className="text-[10px] font-mono text-[#64748B] mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
