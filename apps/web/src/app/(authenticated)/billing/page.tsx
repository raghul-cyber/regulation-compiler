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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#151311] border border-[#211D19] relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-[#344D63]/20 text-[#607D96] border border-[#344D63]/40 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#607D96]" />
              Statutory Entitlements Engine
            </span>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase bg-[#100E0D] text-[#8D8982] border border-[#211D19] font-medium">
              Dodo Payments Gateway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F7F4EC] flex items-center gap-3">
            <span>Billing & Metered Quotas</span>
          </h1>
          <p className="mt-1 text-xs text-[#8D8982] max-w-xl font-sans">
            Autonomous compilation entitlements, executive subscription tiers, and persistent PostgreSQL usage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-lg bg-[#100E0D] border border-[#211D19] flex flex-col items-end font-mono">
            <span className="text-[10px] text-[#625F5A] uppercase tracking-wider">Gateway Protocol</span>
            <span className="text-xs font-medium text-[#718A79] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79]" /> Webhook Synced
            </span>
          </div>
        </div>
      </div>

      {/* Plan & Usage KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Active Tier */}
        <div className="p-6 rounded-xl bg-[#100E0D] border border-[#211D19] hover:border-[#2A241F] transition-colors flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#607D96] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#AD956C]" />
              Current Plan Tier
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#F7F4EC] capitalize tracking-tight">
                {billing?.is_admin ? 'Enterprise Admin' : billing?.plan || 'Free'}
              </span>
              {billing?.is_admin ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-[#718A79]/15 text-[#718A79] border border-[#718A79]/30 rounded uppercase">
                  Exempt
                </span>
              ) : billing?.paid_access ? (
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-[#344D63]/20 text-[#607D96] border border-[#344D63]/40 rounded uppercase">
                  Active Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium bg-[#151311] text-[#8D8982] border border-[#211D19] rounded uppercase">
                  Complimentary
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-[#8D8982] leading-relaxed font-sans">
              {billing?.is_admin 
                ? 'Unlimited full-stack statutory compilation and compliance auditing enabled across all nodes.'
                : billing?.paid_access
                ? 'Full Pro entitlement unlocked with high-priority AST pipeline access & multi-framework code gen.'
                : '3 complimentary regulation compilations allocated to your account before metered boundary.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#211D19] flex items-center justify-between text-xs font-mono">
            <span className="text-[#625F5A]">Node Status:</span>
            <span className="font-medium text-[#718A79] capitalize flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79]" />
              {billing?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Card 2: Free Quota Meter */}
        <div className="p-6 rounded-xl bg-[#100E0D] border border-[#211D19] hover:border-[#2A241F] transition-colors flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#AD956C] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#AD956C]" />
              Compilation Quota Meter
            </div>
            <div className="text-2xl font-semibold text-[#F7F4EC] font-mono">
              {billing?.is_admin ? (
                <span className="text-[#718A79] font-sans">Unlimited</span>
              ) : (
                <span>{freeUsed} / {freeLimit} <span className="text-xs text-[#625F5A] font-normal">consumed</span></span>
              )}
            </div>

            {!billing?.is_admin && (
              <div className="mt-4">
                <div className="w-full h-2 bg-[#080706] rounded-full overflow-hidden border border-[#211D19] p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExhausted 
                        ? 'bg-[#A48A5C]' 
                        : 'bg-[#3F5C74]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-2.5 text-[11px] text-[#8D8982] flex justify-between font-mono">
                  <span className="text-[#607D96]">{freeRemaining} allocations left</span>
                  <span className={isExhausted ? 'text-[#A48A5C] font-medium' : 'text-[#625F5A]'}>
                    {isExhausted ? 'Quota Exhausted' : `${freeLimit - freeUsed} available`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#211D19] flex items-center justify-between text-xs font-mono">
            <span className="text-[#625F5A]">Metered Boundary:</span>
            <span className="text-[#C9C4BA]">PDF / HTML Statutory Ingest</span>
          </div>
        </div>

        {/* Card 3: Quick Action / Upgrade */}
        <div className="p-6 rounded-xl bg-[#100E0D] border border-[#211D19] hover:border-[#2A241F] transition-colors flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] font-mono text-[#607D96] uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5">
              <RCIcon name="shield" size={14} className="text-[#AD956C]" />
              Executive Access
            </div>
            <div className="text-base font-semibold text-[#F7F4EC]">
              {billing?.paid_access || billing?.is_admin ? 'Active Entitlement' : 'Unlock Unlimited Compilations'}
            </div>
            <p className="mt-2 text-xs text-[#8D8982] leading-relaxed font-sans">
              Instant AST pipeline prioritization. Automated legislative surveillance with webhook activation in &lt; 800ms.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#211D19] space-y-2.5">
            {!billing?.paid_access && !billing?.is_admin && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#3F5C74] hover:bg-[#4B6982] active:scale-[0.99] text-[#F7F4EC] font-mono font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer tracking-wider uppercase border border-[#607D96]/30"
              >
                <span>Upgrade to Pro ($10.02/mo)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#AD956C]" />
              </button>
            )}

            {billing?.dodo_customer_id && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full py-2.5 px-3 rounded-lg bg-[#151311] hover:bg-[#1B1815] text-[#C9C4BA] hover:text-[#F7F4EC] border border-[#211D19] text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 text-[#AD956C]" />}
                <span>Manage via Dodo Portal</span>
              </button>
            )}

            {portalError && (
              <p className="text-[11px] font-mono text-[#A48A5C]">{portalError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Background Action & Audit Ledger */}
      <div className="p-6 sm:p-8 rounded-xl bg-[#100E0D] border border-[#211D19] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#211D19] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#F7F4EC] flex items-center gap-2.5">
              <History className="w-4 h-4 text-[#AD956C]" />
              <span>Live Statutory Action & Audit Ledger</span>
            </h3>
            <p className="mt-1 text-xs text-[#8D8982] font-sans">
              Authoritative PostgreSQL usage ledger tracking metered user actions in real-time. Persistent across sessions.
            </p>
          </div>
          <button
            onClick={loadBilling}
            className="px-3 py-1.5 rounded-lg bg-[#151311] hover:bg-[#1B1815] text-[#8D8982] hover:text-[#F7F4EC] border border-[#211D19] hover:border-[#AD956C]/30 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Refresh Ledger</span>
          </button>
        </div>

        {usageEvents.length === 0 ? (
          <div className="py-12 text-center text-[#625F5A] font-mono text-xs border border-dashed border-[#211D19] rounded-lg bg-[#0B0A09]">
            No metered background operations recorded yet. Perform a website compliance audit or regulation compilation to generate live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#211D19] text-[#8D8982] font-mono">
                  <th className="pb-3 font-medium uppercase tracking-wider text-[11px]">Timestamp (UTC)</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-[11px]">Operation Type</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-[11px]">Operation ID / Target</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-[11px]">Credits</th>
                  <th className="pb-3 font-medium text-right uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#211D19] text-[#C9C4BA] font-mono">
                {usageEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#151311]/50 transition-colors">
                    <td className="py-3.5 text-[#8D8982] text-[11px]">
                      {evt.created_at ? new Date(evt.created_at).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3.5 font-medium text-[#F7F4EC] capitalize flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#607D96]" />
                      {evt.operation_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 text-[#8D8982] truncate max-w-[220px]" title={evt.operation_id}>
                      {evt.metadata?.target_url || evt.metadata?.regulation_name || evt.metadata?.acronym || evt.operation_id}
                    </td>
                    <td className="py-3.5 text-[#AD956C] font-semibold">
                      {evt.credits_consumed > 0 ? `-${evt.credits_consumed} Action` : '0 (Exempt)'}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] uppercase font-medium tracking-wider ${
                        evt.status === 'completed'
                          ? 'bg-[#718A79]/15 text-[#718A79] border border-[#718A79]/30'
                          : evt.status === 'reserved'
                          ? 'bg-[#344D63]/20 text-[#607D96] border border-[#344D63]/40'
                          : 'bg-[#151311] text-[#8D8982] border border-[#211D19]'
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
      <div className="p-6 sm:p-8 rounded-xl bg-[#100E0D] border border-[#211D19] shadow-sm">
        <h3 className="text-base font-semibold text-[#F7F4EC] mb-4 flex items-center gap-2">
          <span>Plan Comparison & Metering Architecture</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#211D19] text-[#8D8982] font-mono">
                <th className="pb-3.5 font-medium uppercase tracking-wider text-[11px]">Capability</th>
                <th className="pb-3.5 font-medium uppercase tracking-wider text-[11px]">Free Tier</th>
                <th className="pb-3.5 font-medium uppercase tracking-wider text-[11px] text-[#607D96]">Pro Tier ($10.02/mo)</th>
                <th className="pb-3.5 font-medium uppercase tracking-wider text-[11px] text-[#718A79]">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#211D19] text-[#C9C4BA] font-sans">
              <tr className="hover:bg-[#151311]/50 transition-colors">
                <td className="py-3.5 font-medium text-[#F7F4EC]">Statutory Regulation Compilations</td>
                <td className="py-3.5 font-mono text-[#8D8982]">3 complimentary uses</td>
                <td className="py-3.5 font-mono text-[#607D96] font-semibold">Unlimited Direct AST</td>
                <td className="py-3.5 font-mono text-[#718A79] font-semibold">Unlimited Dedicated Core</td>
              </tr>
              <tr className="hover:bg-[#151311]/50 transition-colors">
                <td className="py-3.5 font-medium text-[#F7F4EC]">Automated Website Compliance Auditor</td>
                <td className="py-3.5 font-mono text-[#8D8982]">Included in 3 uses</td>
                <td className="py-3.5 font-mono text-[#607D96] font-semibold">Unlimited Live Scans</td>
                <td className="py-3.5 font-mono text-[#718A79] font-semibold">Continuous Automated Surveillance</td>
              </tr>
              <tr className="hover:bg-[#151311]/50 transition-colors">
                <td className="py-3.5 font-medium text-[#F7F4EC]">24/7 Global Gazette Surveillance</td>
                <td className="py-3.5 text-[#625F5A] font-mono">Read-only</td>
                <td className="py-3.5 text-[#C9C4BA]">Live Signals & Drift Alerts</td>
                <td className="py-3.5 text-[#718A79]">Custom Jurisdiction Watchdogs</td>
              </tr>
              <tr className="hover:bg-[#151311]/50 transition-colors">
                <td className="py-3.5 font-medium text-[#F7F4EC]">Export Code Formats</td>
                <td className="py-3.5 text-[#8D8982] font-mono">JSON Policy AST</td>
                <td className="py-3.5 text-[#C9C4BA] font-mono">Rego • AST • Nginx • Next.js</td>
                <td className="py-3.5 text-[#718A79] font-mono">Full CI/CD Pipeline Integrations</td>
              </tr>
              <tr className="hover:bg-[#151311]/50 transition-colors">
                <td className="py-3.5 font-medium text-[#F7F4EC]">Billing & Invoicing SLA</td>
                <td className="py-3.5 text-[#625F5A] font-mono">—</td>
                <td className="py-3.5 text-[#C9C4BA]">Dodo Payments Instant Webhook</td>
                <td className="py-3.5 text-[#718A79]">Custom Invoicing & SLA Guarantee</td>
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
