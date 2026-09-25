'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  CreditCard,
  Layers,
  History
} from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { getBillingStatusAction, getBillingUsageAction, createCheckoutAction, getCustomerPortalAction } from '@/app/actions';
import { PaywallModal } from '@/components/billing/paywall-modal';

interface BillingData {
  authenticated: boolean;
  is_admin: boolean;
  plan: string;
  status: string;
  paid_access: boolean;
  free_usage: {
    limit: number;
    used: number;
    remaining: number;
  };
  paid_credits: number;
  current_period_end: string | null;
  dodo_customer_id: string | null;
}

interface UsageEventItem {
  id: string;
  operation_type: string;
  operation_id: string;
  status: string;
  credits_consumed: number;
  created_at: string | null;
  metadata?: Record<string, any>;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const [statusRes, usageRes] = await Promise.all([
        getBillingStatusAction(),
        getBillingUsageAction()
      ]);

      if (statusRes.success && statusRes.data) {
        setBilling(statusRes.data);
      }
      if (usageRes.success && usageRes.data?.events) {
        setUsageEvents(usageRes.data.events);
      }
    } catch (e) {
      console.error("Failed to load billing status:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await getCustomerPortalAction();
      if (res.success && res.data?.portal_url) {
        window.open(res.data.portal_url, '_blank');
      } else {
        setPortalError(res.error || "Customer portal is not available for this account yet.");
      }
    } catch (err: any) {
      setPortalError(err.message || "Failed to open customer portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 px-4 flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#4D8FCC] mb-3" />
        <span className="text-sm font-mono text-[#94A3B8]">Loading billing & usage telemetry...</span>
      </div>
    );
  }

  const freeUsed = billing?.free_usage?.used ?? 0;
  const freeLimit = billing?.free_usage?.limit ?? 3;
  const freeRemaining = billing?.free_usage?.remaining ?? 0;
  const isExhausted = freeUsed >= freeLimit;
  const percentage = Math.min(100, Math.round((freeUsed / freeLimit) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[10px] bg-[#080A0E] border border-white/[0.08] shadow-md relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-[4px] font-mono text-[10px] tracking-wider uppercase bg-[#4D8FCC]/15 text-[#79B5EC] border border-[#4D8FCC]/30 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC]" />
              Statutory Entitlements Engine
            </span>
            <span className="px-2 py-0.5 rounded-[4px] font-mono text-[10px] tracking-wider uppercase bg-[#0B0E14] text-[#CBD5E1] border border-white/[0.06] font-medium">
              Dodo Payments Gateway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F6F8] flex items-center gap-3">
            <span>Billing & Metered Quotas</span>
          </h1>
          <p className="mt-1 text-xs text-[#9CA3AF] max-w-xl">
            Autonomous compilation entitlements, executive subscription tiers, and persistent PostgreSQL usage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-[6px] bg-[#050608] border border-white/[0.06] flex flex-col items-end font-mono">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Gateway Protocol</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Webhook Synced
            </span>
          </div>
        </div>
      </div>

      {/* Plan & Usage KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Tier */}
        <div className="p-6 rounded-[8px] bg-[#080A0E] border border-white/[0.08] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#93C5FD] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4D8FCC]" />
              Current Plan Tier
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-[#F4F6F8] capitalize tracking-tight">
                {billing?.is_admin ? 'Enterprise Admin' : billing?.plan || 'Free'}
              </span>
              {billing?.is_admin ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-[4px] uppercase">
                  Exempt
                </span>
              ) : billing?.paid_access ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#4D8FCC]/15 text-[#93C5FD] border border-[#4D8FCC]/30 rounded-[4px] uppercase">
                  Active Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.06] rounded-[4px] uppercase">
                  Complimentary
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-[#9CA3AF] leading-relaxed font-sans">
              {billing?.is_admin 
                ? 'Unlimited full-stack statutory compilation and compliance auditing enabled across all nodes.'
                : billing?.paid_access
                ? 'Full Pro entitlement unlocked with high-priority AST pipeline access & multi-framework code gen.'
                : '3 complimentary regulation compilations allocated to your account before metered boundary.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64748B]">Node Status:</span>
            <span className="font-semibold text-emerald-400 capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {billing?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Card 2: Free Quota Meter */}
        <div className="p-6 rounded-[8px] bg-[#080A0E] border border-white/[0.08] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#93C5FD] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4D8FCC]" />
              Compilation Quota Meter
            </div>
            <div className="text-2xl font-extrabold text-[#F4F6F8] font-mono">
              {billing?.is_admin ? (
                <span className="text-emerald-400 font-sans">Unlimited</span>
              ) : (
                <span>{freeUsed} / {freeLimit} <span className="text-xs text-[#64748B] font-normal">consumed</span></span>
              )}
            </div>

            {!billing?.is_admin && (
              <div className="mt-4">
                <div className="w-full h-2 bg-[#050608] rounded-full overflow-hidden border border-white/[0.06] p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                      isExhausted 
                        ? 'bg-amber-500' 
                        : 'bg-[#4D8FCC]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2.5 text-[11px] text-[#9CA3AF] flex justify-between font-mono">
                  <span className="text-[#93C5FD]">{freeRemaining} allocations left</span>
                  <span className={isExhausted ? 'text-amber-400 font-semibold' : 'text-[#64748B]'}>
                    {isExhausted ? 'Quota Exhausted' : `${freeLimit - freeUsed} available`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64748B]">Metered Boundary:</span>
            <span className="text-[#CBD5E1]">PDF / HTML Statutory Ingest</span>
          </div>
        </div>

        {/* Card 3: Quick Action / Upgrade */}
        <div className="p-6 rounded-[8px] bg-[#080A0E] border border-white/[0.08] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#79B5EC] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <RCIcon name="shield" size={14} className="text-[#4D8FCC]" />
              Executive Access
            </div>
            <div className="text-base font-extrabold text-[#F4F6F8]">
              {billing?.paid_access || billing?.is_admin ? 'Active Entitlement' : 'Unlock Unlimited Compilations'}
            </div>
            <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed font-sans">
              Instant AST pipeline prioritization. Automated legislative surveillance with webhook activation in &lt; 800ms.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-2.5">
            {!billing?.paid_access && !billing?.is_admin && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-2.5 px-4 rounded-[6px] bg-[#4D8FCC] hover:bg-[#3B72A8] active:scale-[0.99] text-white font-mono font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer tracking-wider uppercase border border-[#79B5EC]/20"
              >
                <span>Upgrade to Pro ($10.02/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {billing?.dodo_customer_id && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full py-2.5 px-3 rounded-lg bg-[#141922] hover:bg-[#1A2230] text-zinc-300 border border-[var(--rc-border)] text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 text-[#93C5FD]" />}
                <span>Manage via Dodo Portal</span>
              </button>
            )}

            {portalError && (
              <p className="text-[11px] font-mono text-amber-400">{portalError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Background Action & Audit Ledger */}
      <div className="p-6 sm:p-8 rounded-[10px] bg-[#080A0E] border border-white/[0.08] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#F4F6F8] flex items-center gap-2.5">
              <History className="w-4 h-4 text-[#4D8FCC]" />
              <span>Live Statutory Action & Audit Ledger</span>
            </h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Authoritative PostgreSQL usage ledger tracking metered user actions in real-time. Persistent across sessions.
            </p>
          </div>
          <button
            onClick={loadBilling}
            className="px-3 py-1.5 rounded-[6px] bg-[#0B0E14] hover:bg-[#11151A] text-[#9CA3AF] hover:text-[#F4F6F8] border border-white/[0.08] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Refresh Ledger</span>
          </button>
        </div>

        {usageEvents.length === 0 ? (
          <div className="py-12 text-center text-[#64748B] font-mono text-xs border border-dashed border-white/[0.06] rounded-[8px] bg-[#050608]">
            No metered background operations recorded yet. Perform a website compliance audit or regulation compilation to generate live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#64748B] font-mono">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Timestamp (UTC)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Operation Type</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Operation ID / Target</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Credits</th>
                  <th className="pb-3 font-semibold text-right uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-[#CBD5E1] font-mono">
                {usageEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-[#9CA3AF] text-[11px]">
                      {evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3.5 font-semibold text-[#F4F6F8] capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC]" />
                      {evt.operation_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 text-[#9CA3AF] truncate max-w-[220px]" title={evt.operation_id}>
                      {evt.metadata?.target_url || evt.metadata?.regulation_name || evt.metadata?.acronym || evt.operation_id}
                    </td>
                    <td className="py-3.5 text-[#C9B88A] font-bold">
                      {evt.credits_consumed > 0 ? `-${evt.credits_consumed} Action` : '0 (Exempt)'}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-wider ${
                        evt.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : evt.status === 'reserved'
                          ? 'bg-[#4D8FCC]/15 text-[#93C5FD] border border-[#4D8FCC]/30'
                          : 'bg-[#0B0E14] text-[#9CA3AF] border border-white/[0.06]'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Feature Comparison Table */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#0E1218] border border-[var(--rc-border)] shadow-sm">
        <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
          <span>Plan Comparison & Metering Architecture</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--rc-border)] text-[#64748B] font-mono">
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px]">Capability</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px]">Free Tier</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px] text-[#93C5FD]">Pro Tier ($10.02/mo)</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px] text-emerald-400">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rc-border)] text-[#CBD5E1] font-sans">
              <tr className="hover:bg-[#141922]/50 transition-colors">
                <td className="py-3.5 font-medium text-white">Statutory Regulation Compilations</td>
                <td className="py-3.5 font-mono text-[#94A3B8]">3 complimentary uses</td>
                <td className="py-3.5 font-mono text-[#93C5FD] font-bold">Unlimited Direct AST</td>
                <td className="py-3.5 font-mono text-emerald-400 font-bold">Unlimited Dedicated Core</td>
              </tr>
              <tr className="hover:bg-[#141922]/50 transition-colors">
                <td className="py-3.5 font-medium text-white">Automated Website Compliance Auditor</td>
                <td className="py-3.5 font-mono text-[#94A3B8]">Included in 3 uses</td>
                <td className="py-3.5 font-mono text-[#93C5FD] font-bold">Unlimited Live Scans</td>
                <td className="py-3.5 font-mono text-emerald-400 font-bold">Continuous Automated Surveillance</td>
              </tr>
              <tr className="hover:bg-[#141922]/50 transition-colors">
                <td className="py-3.5 font-medium text-white">24/7 Global Gazette Surveillance</td>
                <td className="py-3.5 text-[#64748B] font-mono">Read-only</td>
                <td className="py-3.5 text-zinc-200">Live Signals & Drift Alerts</td>
                <td className="py-3.5 text-emerald-300">Custom Jurisdiction Watchdogs</td>
              </tr>
              <tr className="hover:bg-[#141922]/50 transition-colors">
                <td className="py-3.5 font-medium text-white">Export Code Formats</td>
                <td className="py-3.5 text-[#94A3B8] font-mono">JSON Policy AST</td>
                <td className="py-3.5 text-zinc-200 font-mono">Rego • AST • Nginx • Next.js</td>
                <td className="py-3.5 text-emerald-300 font-mono">Full CI/CD Pipeline Integrations</td>
              </tr>
              <tr className="hover:bg-[#141922]/50 transition-colors">
                <td className="py-3.5 font-medium text-white">Billing & Invoicing SLA</td>
                <td className="py-3.5 text-[#64748B] font-mono">—</td>
                <td className="py-3.5 text-zinc-200">Dodo Payments Instant Webhook</td>
                <td className="py-3.5 text-emerald-300">Custom Invoicing & SLA Guarantee</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        freeUsesUsed={freeUsed}
        freeUsesLimit={freeLimit}
      />
    </div>
  );
}
