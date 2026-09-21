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
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Billing & Usage Entitlements</h1>
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded">
            Dodo Payments Gateway
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your compilation entitlements, plan tiers, and payment subscriptions.
        </p>
      </div>

      {/* Plan & Usage KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Tier */}
        <div className="p-6 rounded-2xl bg-[#080D13] border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Current Plan Tier
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white capitalize">
                {billing?.is_admin ? 'Enterprise Admin' : billing?.plan || 'Free'}
              </span>
              {billing?.is_admin ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded uppercase">
                  Exempt
                </span>
              ) : billing?.paid_access ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded uppercase">
                  Active Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 rounded uppercase">
                  Complimentary
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              {billing?.is_admin 
                ? 'Unlimited full-stack statutory compilation and compliance auditing enabled.'
                : billing?.paid_access
                ? 'Full Pro entitlement unlocked with high-priority AST pipeline access.'
                : '3 complimentary regulation compilations allocated to your account.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Status:</span>
            <span className="font-semibold text-emerald-400 capitalize">{billing?.status || 'Active'}</span>
          </div>
        </div>

        {/* Card 2: Free Quota Meter */}
        <div className="p-6 rounded-2xl bg-[#080D13] border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
              Complimentary Compilation Quota
            </div>
            <div className="text-2xl font-extrabold text-white">
              {billing?.is_admin ? (
                <span className="text-emerald-400">Unlimited</span>
              ) : (
                <span>{freeUsed} / {freeLimit} <span className="text-xs text-zinc-500 font-normal">used</span></span>
              )}
            </div>

            {!billing?.is_admin && (
              <div className="mt-3">
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExhausted ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-400 flex justify-between font-mono">
                  <span>{freeRemaining} remaining</span>
                  <span>{isExhausted ? 'Limit reached' : `${freeLimit - freeUsed} available`}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Metered Boundary:</span>
            <span className="text-zinc-400 font-mono">PDF / HTML Upload & Ingest</span>
          </div>
        </div>

        {/* Card 3: Quick Action / Upgrade */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0B131D] to-[#080D13] border border-[#1E2C38] shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-[#5CC8FF] uppercase tracking-wider mb-2">
              Payment & Subscription
            </div>
            <div className="text-sm font-semibold text-white">
              {billing?.paid_access || billing?.is_admin ? 'Active Entitlement' : 'Unlock Unlimited Compilations'}
            </div>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Real-time payment processing via Dodo Payments. Instant webhook activation with zero delay.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2">
            {!billing?.paid_access && !billing?.is_admin && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>Upgrade to Pro Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {billing?.dodo_customer_id && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>Manage via Dodo Portal</span>
              </button>
            )}

            {portalError && (
              <p className="text-[11px] text-amber-400">{portalError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Background Action & Audit Ledger */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080D13] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#5CC8FF]" />
              <span>Live Background Action & Audit Ledger</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Authoritative PostgreSQL usage ledger tracking metered user actions in real-time. Persistent across logout and login.
            </p>
          </div>
          <button
            onClick={loadBilling}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
          >
            Refresh Ledger
          </button>
        </div>

        {usageEvents.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800/80 rounded-xl">
            No metered background operations recorded yet. Perform a website compliance audit or regulation compilation to see live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono">
                  <th className="pb-3 font-semibold">Timestamp (UTC)</th>
                  <th className="pb-3 font-semibold">Operation Type</th>
                  <th className="pb-3 font-semibold">Operation ID / Target</th>
                  <th className="pb-3 font-semibold">Credits</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-mono">
                {usageEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 text-zinc-400 text-[11px]">
                      {evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3 font-semibold text-white capitalize">
                      {evt.operation_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 text-zinc-400 truncate max-w-[220px]" title={evt.operation_id}>
                      {evt.metadata?.target_url || evt.metadata?.regulation_name || evt.metadata?.acronym || evt.operation_id}
                    </td>
                    <td className="py-3 text-amber-400 font-bold">
                      {evt.credits_consumed > 0 ? `-${evt.credits_consumed} Action` : '0 (Exempt)'}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        evt.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : evt.status === 'reserved'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
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
      <div className="p-6 sm:p-8 rounded-2xl bg-[#080D13] border border-zinc-800">
        <h3 className="text-base font-bold text-white mb-4">Plan Comparison & Metering Architecture</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono">
                <th className="pb-3 font-semibold">Capability</th>
                <th className="pb-3 font-semibold">Free Tier</th>
                <th className="pb-3 font-semibold text-[#5CC8FF]">Pro Tier</th>
                <th className="pb-3 font-semibold text-emerald-400">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-3 font-medium">Statutory Regulation Compilations</td>
                <td className="py-3 font-mono text-zinc-400">3 complimentary uses</td>
                <td className="py-3 font-mono text-white font-bold">Unlimited</td>
                <td className="py-3 font-mono text-white font-bold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Automated Website Compliance Auditor</td>
                <td className="py-3 font-mono text-zinc-400">Included in 3 uses</td>
                <td className="py-3 font-mono text-white font-bold">Unlimited Live Scans</td>
                <td className="py-3 font-mono text-white font-bold">Continuous Automated Crawl</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">24/7 Global Gazette Surveillance</td>
                <td className="py-3 text-zinc-500">Read-only</td>
                <td className="py-3 text-white">Live Signals & Drift Alerts</td>
                <td className="py-3 text-white">Custom Jurisdiction Watchdogs</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Export Formats</td>
                <td className="py-3 text-zinc-400">JSON Policy AST</td>
                <td className="py-3 text-white">Rego / AST / Nginx / Next.js</td>
                <td className="py-3 text-white">Full CI/CD Pipeline Integrations</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Billing & Invoicing</td>
                <td className="py-3 text-zinc-500">—</td>
                <td className="py-3 text-white">Dodo Payments Checkout</td>
                <td className="py-3 text-white">Custom Invoicing & SLA</td>
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
