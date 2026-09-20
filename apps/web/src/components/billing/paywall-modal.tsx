'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  X,
  Lock,
  ExternalLink
} from 'lucide-react';
import { createCheckoutAction } from '@/app/actions';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeUsesUsed?: number;
  freeUsesLimit?: number;
  reason?: string;
  isBlocking?: boolean;
}

export function PaywallModal({
  isOpen,
  onClose,
  freeUsesUsed = 3,
  freeUsesLimit = 3,
  reason,
  isBlocking = false
}: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intercept Escape key when blocking mode is active
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isBlocking) {
          onClose();
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBlocking, onClose]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const returnUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/billing/success`
        : undefined;

      const res = await createCheckoutAction(undefined, returnUrl);

      if (!res.success) {
        throw new Error(res.error || 'Failed to initialize secure checkout');
      }

      const checkoutUrl = res.data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Server did not return a valid checkout URL');
      }
    } catch (err: any) {
      setError(err.message || "We couldn't start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-200"
      onClick={() => {
        if (!isBlocking) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-lg my-auto p-5 sm:p-7 rounded-2xl bg-[#0B131D] border border-[#1E2C38] shadow-2xl shadow-blue-500/10 text-white overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button - hidden in blocking mode */}
        {!isBlocking && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="overflow-y-auto pr-1 -mr-1 space-y-4">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>{isBlocking ? 'Account Action Locked • 3/3 Free Uses Consumed' : 'Usage Limit Reached • Dodo Payments'}</span>
          </div>

          {/* Modal Title */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isBlocking ? 'Upgrade to Pro to Continue' : 'Your free access is used up'}
          </h3>

          {/* Usage Pill Bar */}
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono">Free audits & compilations:</span>
            <span className="font-bold font-mono text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {freeUsesUsed} / {freeUsesLimit} used (0 remaining)
            </span>
          </div>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {reason || "You have reached your limit of 3 complimentary website compliance audits and regulation compilations. Upgrade to Pro to unlock unlimited autonomous compliance audits, PDF compilation, and statutory monitoring."}
          </p>

          {/* Pro Plan Value Pillars */}
          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Unlimited Website Audits:</b> Autonomous crawling against GDPR, HIPAA, SOC 2, and WCAG.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Unlimited Regulation Compilation:</b> Parse complex statutory PDF & HTML gazettes into ASTs.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>24/7 Global Surveillance:</b> Real-time statutory feed and automated drift alerts.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Production Policy AST Exports:</b> Executable Rego/JSON policies and statutory audit trails.</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 break-words">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#5CC8FF] hover:bg-[#4bb3e6] disabled:opacity-50 text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                <span>Preparing secure checkout...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Upgrade to Pro ($49/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {!isBlocking ? (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          ) : (
            <a
              href="/billing"
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors text-center cursor-pointer"
            >
              View Billing
            </a>
          )}
        </div>

        <div className="mt-3 text-center">
          <span className="text-[11px] text-zinc-500 font-mono">
            Secured by Dodo Payments • Real-time webhook confirmation
          </span>
        </div>
      </div>
    </div>
  );
}
