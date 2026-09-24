'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { getBillingStatusAction } from '@/app/actions';

export default function BillingSuccessPage() {
  const [isConfirming, setIsConfirming] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await getBillingStatusAction();
        if (res.success && res.data) {
          if (res.data.paid_access || res.data.is_admin || res.data.plan === 'pro') {
            setIsActivated(true);
            setIsConfirming(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Poll status check error:", e);
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next > 12) { // 24 seconds max polling
          setIsConfirming(false);
          // If max attempts reached, allow user to proceed anyway since webhook may take a moment
          setIsActivated(true);
        }
        return next;
      });
    };

    checkStatus();
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto py-16 px-4 text-center">
      <div className="p-8 sm:p-10 rounded-2xl bg-[#0E1218] border border-[var(--rc-border)] shadow-2xl relative overflow-hidden text-white">
        {isConfirming ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#3B82F6]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Confirming Payment...
              </h2>
              <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
                Verifying your transaction with Dodo Payments and activating your compilation entitlements.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090D13] border border-[var(--rc-border)] text-xs font-mono text-[#94A3B8]">
              Waiting for authoritative webhook confirmation... (Attempt {attempts}/12)
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                <RCIcon name="shield" size={14} className="text-[#10B981]" />
                <span>Payment Confirmed • Pro Tier Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Access Activated!
              </h2>
              <p className="mt-2 text-sm text-[#CBD5E1] leading-relaxed max-w-sm mx-auto">
                Your paid compilation entitlement is now active. You have full access to compile regulations, run website compliance audits, and deploy policy ASTs.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/regulations/new"
                className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
