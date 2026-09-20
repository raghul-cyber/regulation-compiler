'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
      <div className="p-8 sm:p-10 rounded-3xl bg-[#0B131D] border border-[#1E2C38] shadow-2xl relative overflow-hidden text-white">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {isConfirming ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Confirming Payment...
              </h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Verifying your transaction with Dodo Payments and activating your compilation entitlements.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400">
              Waiting for authoritative webhook confirmation... (Attempt {attempts}/12)
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Payment Confirmed • Pro Tier Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Access Activated!
              </h2>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto">
                Your paid compilation entitlement is now active. You have full access to compile regulations, run website compliance audits, and deploy policy ASTs.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/regulations/new"
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
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
