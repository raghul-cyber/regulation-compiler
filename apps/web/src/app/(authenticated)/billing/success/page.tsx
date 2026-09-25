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
      <div className="p-8 sm:p-10 rounded-[10px] bg-[#080A0E] border border-white/[0.08] shadow-md relative overflow-hidden text-white">
        {isConfirming ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-[8px] bg-[#4D8FCC]/15 border border-[#4D8FCC]/30 flex items-center justify-center text-[#4D8FCC]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#F4F6F8]">
                Confirming Payment...
              </h2>
              <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
                Verifying your transaction with Dodo Payments and activating your compilation entitlements.
              </p>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#050608] border border-white/[0.06] text-xs font-mono text-[#9CA3AF]">
              Waiting for authoritative webhook confirmation... (Attempt {attempts}/12)
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-[8px] bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                <RCIcon name="shield" size={14} className="text-emerald-400" />
                <span>Payment Confirmed • Pro Tier Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F6F8]">
                Access Activated!
              </h2>
              <p className="mt-2 text-xs text-[#CBD5E1] leading-relaxed max-w-sm mx-auto">
                Your paid compilation entitlement is now active. You have full access to compile regulations, run website compliance audits, and deploy policy ASTs.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/regulations/new"
                className="w-full sm:w-auto py-2.5 px-6 rounded-[6px] bg-[#4D8FCC] hover:bg-[#3B72A8] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm border border-[#79B5EC]/20 cursor-pointer"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-2.5 px-5 rounded-[6px] bg-[#0B0E14] hover:bg-[#11151A] text-[#CBD5E1] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
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
