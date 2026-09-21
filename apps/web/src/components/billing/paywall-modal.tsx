'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  X, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import { createCheckoutAction } from '@/app/actions';

import { useClerk } from '@clerk/nextjs';

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
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, mounted]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBlocking) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mounted, onClose, isBlocking]);

  if (!isOpen || !mounted) return null;

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

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex min-h-screen w-screen items-center justify-center animate-in fade-in duration-200"
      style={{ margin: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 }}
      onClick={isBlocking ? undefined : onClose}
    >
      <div 
        className="relative w-full max-w-lg my-auto p-6 sm:p-8 rounded-2xl bg-[#0B131D] border border-[#1E2C38] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(92,200,255,0.15)] text-white overflow-hidden flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (Hidden if Blocking) */}
        {!isBlocking && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Free Tier Limit Reached</span>
          </div>
        </div>

        {/* Modal Title & Subtitle */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Upgrade to Pro</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[#5CC8FF] border border-blue-500/30 font-mono font-normal">
              $49/month
            </span>
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {reason || "You have reached your limit of 3 complimentary website compliance audits and regulation compilations. Upgrade to Pro to unlock unlimited autonomous compliance audits, PDF compilation, and statutory monitoring."}
          </p>
        </div>

        {/* Usage Tracker Pill */}
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Free Actions Quota:</span>
          <span className="font-bold text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {freeUsesUsed} / {freeUsesLimit} used (0 remaining)
          </span>
        </div>

        {/* Pro Plan Value Pillars */}
        <div className="space-y-2.5 py-1 border-y border-zinc-800/80">
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Unlimited Website Audits:</b> Full autonomous crawling across GDPR, HIPAA, SOC 2, WCAG 2.1 AA, and PCI-DSS.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Unlimited Regulation Compilation:</b> Parse multi-hundred page PDF & HTML statutory gazettes into ASTs.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>24/7 Global Surveillance:</b> Real-time statutory gazette monitoring and automated drift alerts.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><b>Production Policy AST Exports:</b> Machine-executable Rego/JSON policies and cryptographic audit trails.</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#5CC8FF] hover:bg-[#4bb3e6] disabled:opacity-50 text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#05070A]" />
                <span>Redirecting to Dodo Payments...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#05070A]" />
                <span>Unlock Continued Access</span>
                <ArrowRight className="w-4 h-4 text-[#05070A]" />
              </>
            )}
          </button>

          {isBlocking ? (
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              disabled={isLoading}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          )}
        </div>

        {/* Trust Footer */}
        <div className="text-center">
          <span className="text-[11px] text-zinc-500 font-mono">
            Secured by Dodo Payments • Real-time webhook confirmation
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
