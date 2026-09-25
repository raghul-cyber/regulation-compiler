'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, ArrowUpRight, Lock } from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { getBillingStatusAction } from '@/app/actions';
import { PaywallModal } from './paywall-modal';
import Link from 'next/link';

interface BillingStatus {
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
}

export function UsageIndicator() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await getBillingStatusAction();
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch (e) {
      console.warn("Could not refresh billing status:", e);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh periodically every 45s
    const interval = setInterval(loadStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.authenticated) {
    return null;
  }

  // Admin user display
  if (status.is_admin) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Admin Unlimited</span>
      </div>
    );
  }

  // Pro / Paid user display
  if (status.paid_access) {
    return (
      <Link 
        href="/billing"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4D8FCC]/10 border border-[#4D8FCC]/25 text-[#A3C7E8] hover:bg-[#4D8FCC]/20 transition-colors text-xs font-mono font-medium"
      >
        <RCIcon name="shield" size={14} className="text-[#4D8FCC]" />
        <span>Pro Plan • Active</span>
      </Link>
    );
  }

  // Free Tier user display (3 free uses policy)
  const used = status.free_usage.used;
  const limit = status.free_usage.limit;
  const isExhausted = used >= limit;
  const isApproaching = used === 2;

  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPaywallOpen(true)}
          className={`group inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
            isExhausted 
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25' 
              : isApproaching
              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:border-zinc-600'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
          title={`${used} of ${limit} free compilations used`}
        >
          {isExhausted ? (
            <Lock className="w-3 h-3 text-amber-400" />
          ) : (
            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isExhausted ? 'bg-red-500' : isApproaching ? 'bg-amber-400' : 'bg-[#4D8FCC]'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}

          <span>
            {isExhausted 
              ? `${used}/${limit} Used • Upgrade`
              : `${used}/${limit} Free Uses`}
          </span>

          <span className="opacity-60 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        freeUsesUsed={used}
        freeUsesLimit={limit}
        isBlocking={isExhausted}
      />
    </>
  );
}
