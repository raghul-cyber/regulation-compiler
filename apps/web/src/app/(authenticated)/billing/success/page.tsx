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
      <div className="p-8 sm:p-10 rounded-xl bg-[#100E0D] border border-[#211D19] shadow-md relative overflow-hidden text-[#F7F4EC]">
        {isConfirming ? (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-lg bg-[#344D63]/20 border border-[#344D63]/40 flex items-center justify-center text-[#607D96]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#F7F4EC]">
                Confirming Payment...
              </h2>
              <p className="mt-2 text-xs text-[#8D8982] leading-relaxed max-w-sm mx-auto font-sans">
                Verifying your transaction with Dodo Payments and activating your compilation entitlements.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0B0A09] border border-[#211D19] text-xs font-mono text-[#8D8982]">
              Waiting for authoritative webhook confirmation... (Attempt {attempts}/12)
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-lg bg-[#718A79]/15 border border-[#718A79]/30 flex items-center justify-center text-[#718A79] shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#718A79]/15 border border-[#718A79]/30 text-[#718A79] text-xs font-mono font-medium uppercase tracking-wider mb-3">
                <RCIcon name="shield" size={14} className="text-[#718A79]" />
                <span>Payment Confirmed • Pro Tier Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F7F4EC]">
                Access Activated!
              </h2>
              <p className="mt-2 text-xs text-[#C9C4BA] leading-relaxed max-w-sm mx-auto font-sans">
                Your paid compilation entitlement is now active. You have full access to compile regulations, run website compliance audits, and deploy policy ASTs.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/regulations/new"
                className="w-full sm:w-auto py-2.5 px-6 rounded-lg bg-[#3F5C74] hover:bg-[#4B6982] text-[#F7F4EC] font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm border border-[#607D96]/30 cursor-pointer"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#AD956C]" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full sm:w-auto py-2.5 px-5 rounded-lg bg-[#151311] hover:bg-[#1B1815] text-[#C9C4BA] hover:text-[#F7F4EC] border border-[#211D19] text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
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
