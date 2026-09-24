'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <span className="text-sm font-mono">Loading billing & usage telemetry...</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0A121E]/90 via-[#060A10]/95 to-[#0A121E]/90 border border-[#162A3B] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-radial from-[#00F0FF]/10 via-transparent to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              Statutory Entitlements Engine
            </span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              Dodo Payments Gateway
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>Billing & Metered Quotas</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Autonomous compilation entitlements, executive subscription tiers, and persistent PostgreSQL usage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#03060A]/80 border border-[#162A3B] flex flex-col items-end font-mono">
            <span className="text-[10px] text-zinc-500 uppercase">Gateway Protocol</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Webhook Synced
            </span>
          </div>
        </div>
      </div>

      {/* Plan & Usage KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Tier */}
        <div className="stitch-card p-6 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent" />
          <div>
            <div className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Current Plan Tier
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white capitalize tracking-tight">
                {billing?.is_admin ? 'Enterprise Admin' : billing?.plan || 'Free'}
              </span>
              {billing?.is_admin ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  Exempt
                </span>
              ) : billing?.paid_access ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 rounded uppercase shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  Active Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 rounded uppercase">
                  Complimentary
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-400 leading-relaxed font-sans">
              {billing?.is_admin 
                ? 'Unlimited full-stack statutory compilation and compliance auditing enabled across all nodes.'
                : billing?.paid_access
                ? 'Full Pro entitlement unlocked with high-priority AST pipeline access & multi-framework code gen.'
                : '3 complimentary regulation compilations allocated to your account before metered boundary.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#162A3B] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Node Status:</span>
            <span className="font-semibold text-emerald-400 capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {billing?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Card 2: Free Quota Meter */}
        <div className="stitch-card p-6 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7928CA]/40 to-transparent" />
          <div>
            <div className="text-[10px] font-mono text-[#D498FF] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Compilation Quota Meter
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {billing?.is_admin ? (
                <span className="text-emerald-400 font-sans">Unlimited</span>
              ) : (
                <span>{freeUsed} / {freeLimit} <span className="text-xs text-zinc-500 font-normal">consumed</span></span>
              )}
            </div>

            {!billing?.is_admin && (
              <div className="mt-4">
                <div className="w-full h-2.5 bg-[#03060A] rounded-full overflow-hidden border border-[#162A3B] p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                      isExhausted 
                        ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                        : 'bg-gradient-to-r from-[#00F0FF] to-[#7928CA] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2.5 text-[11px] text-zinc-400 flex justify-between font-mono">
                  <span className="text-[#00F0FF]">{freeRemaining} allocations left</span>
                  <span className={isExhausted ? 'text-red-400' : 'text-zinc-500'}>
                    {isExhausted ? 'Quota Exhausted' : `${freeLimit - freeUsed} available`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#162A3B] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Metered Boundary:</span>
            <span className="text-zinc-400">PDF / HTML Statutory Ingest</span>
          </div>
        </div>

        {/* Card 3: Quick Action / Upgrade */}
        <div className="stitch-card p-6 rounded-2xl bg-gradient-to-b from-[#0F1B2B]/95 to-[#080F18]/95 border border-[#1E3B52] shadow-[0_16px_50px_rgba(0,240,255,0.08)] flex flex-col justify-between backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00F0FF] via-[#7928CA] to-[#00F0FF]" />
          <div>
            <div className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
              Executive Access
            </div>
            <div className="text-base font-extrabold text-white">
              {billing?.paid_access || billing?.is_admin ? 'Active Entitlement' : 'Unlock Unlimited Compilations'}
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans">
              Instant AST pipeline prioritization. Automated legislative surveillance with webhook activation in &lt; 800ms.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#162A3B] space-y-2.5">
            {!billing?.paid_access && !billing?.is_admin && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#00B4D8] to-[#0077B6] hover:brightness-110 active:scale-[0.99] text-[#020508] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] cursor-pointer tracking-wider uppercase"
              >
                <span>Upgrade to Pro ($10.02/mo)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {billing?.dodo_customer_id && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-[#050A10] hover:bg-[#08101A] text-zinc-300 border border-[#162A3B] text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />}
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
      <div className="stitch-card p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-[#162A3B] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
              <History className="w-4 h-4 text-[#00F0FF]" />
              <span>Live Statutory Action & Audit Ledger</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Authoritative PostgreSQL usage ledger tracking metered user actions in real-time. Persistent across sessions.
            </p>
          </div>
          <button
            onClick={loadBilling}
            className="px-3.5 py-1.5 rounded-lg bg-[#050A10] hover:bg-[#0A121C] text-zinc-400 hover:text-[#00F0FF] border border-[#162A3B] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Refresh Ledger</span>
          </button>
        </div>

        {usageEvents.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-[#162A3B] rounded-xl bg-[#03060A]/40">
            No metered background operations recorded yet. Perform a website compliance audit or regulation compilation to generate live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#162A3B] text-zinc-400 font-mono">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Timestamp (UTC)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Operation Type</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Operation ID / Target</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Credits</th>
                  <th className="pb-3 font-semibold text-right uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162A3B]/60 text-zinc-300 font-mono">
                {usageEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                    <td className="py-3.5 text-zinc-400 text-[11px]">
                      {evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3.5 font-semibold text-white capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                      {evt.operation_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 text-zinc-400 truncate max-w-[220px]" title={evt.operation_id}>
                      {evt.metadata?.target_url || evt.metadata?.regulation_name || evt.metadata?.acronym || evt.operation_id}
                    </td>
                    <td className="py-3.5 text-amber-400 font-bold">
                      {evt.credits_consumed > 0 ? `-${evt.credits_consumed} Action` : '0 (Exempt)'}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        evt.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : evt.status === 'reserved'
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                          : 'bg-zinc-800 text-zinc-400'
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
      <div className="stitch-card p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
          <span>Plan Comparison & Metering Architecture</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#162A3B] text-zinc-400 font-mono">
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px]">Capability</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px]">Free Tier</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px] text-[#00F0FF]">Pro Tier ($10.02/mo)</th>
                <th className="pb-3.5 font-semibold uppercase tracking-wider text-[11px] text-emerald-400">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#162A3B]/60 text-zinc-300 font-sans">
              <tr className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                <td className="py-3.5 font-medium text-white">Statutory Regulation Compilations</td>
                <td className="py-3.5 font-mono text-zinc-400">3 complimentary uses</td>
                <td className="py-3.5 font-mono text-[#00F0FF] font-bold">Unlimited Direct AST</td>
                <td className="py-3.5 font-mono text-emerald-400 font-bold">Unlimited Dedicated Core</td>
              </tr>
              <tr className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                <td className="py-3.5 font-medium text-white">Automated Website Compliance Auditor</td>
                <td className="py-3.5 font-mono text-zinc-400">Included in 3 uses</td>
                <td className="py-3.5 font-mono text-[#00F0FF] font-bold">Unlimited Live Scans</td>
                <td className="py-3.5 font-mono text-emerald-400 font-bold">Continuous Automated Crawl</td>
              </tr>
              <tr className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                <td className="py-3.5 font-medium text-white">24/7 Global Gazette Surveillance</td>
                <td className="py-3.5 text-zinc-500 font-mono">Read-only</td>
                <td className="py-3.5 text-zinc-200">Live Signals & Drift Alerts</td>
                <td className="py-3.5 text-emerald-300">Custom Jurisdiction Watchdogs</td>
              </tr>
              <tr className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                <td className="py-3.5 font-medium text-white">Export Code Formats</td>
                <td className="py-3.5 text-zinc-400 font-mono">JSON Policy AST</td>
                <td className="py-3.5 text-zinc-200 font-mono">Rego • AST • Nginx • Next.js</td>
                <td className="py-3.5 text-emerald-300 font-mono">Full CI/CD Pipeline Integrations</td>
              </tr>
              <tr className="hover:bg-[#00F0FF]/[0.02] transition-colors">
                <td className="py-3.5 font-medium text-white">Billing & Invoicing SLA</td>
                <td className="py-3.5 text-zinc-500 font-mono">—</td>
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
