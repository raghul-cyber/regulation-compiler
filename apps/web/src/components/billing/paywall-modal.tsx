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
  ShieldCheck 
} from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
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
        className="relative w-full max-w-lg my-auto p-6 sm:p-8 rounded-xl bg-[#12161C] border border-[#1D232B] shadow-2xl text-[#FAF9F5] overflow-hidden flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Atmosphere */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#BCA77B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#4D78A0]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (Hidden if Blocking) */}
        {!isBlocking && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-[#969DA6] hover:text-[#FAF9F5] hover:bg-[#171C23] transition-colors z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B39863]/15 border border-[#B39863]/30 text-[#CDB98B] text-xs font-mono font-medium uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Free Tier Limit Reached</span>
          </div>
        </div>

        {/* Modal Title & Subtitle */}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight text-[#FAF9F5] flex items-center gap-2">
            <span>Upgrade to Pro</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4D78A0]/15 text-[#7299B4] border border-[#4D78A0]/35 font-mono font-normal">
              $10.02/month
            </span>
          </h3>
          <p className="text-sm text-[#969DA6] leading-relaxed font-sans">
            {reason || "You have reached your limit of 3 complimentary website compliance audits and regulation compilations. Upgrade to Pro to unlock unlimited autonomous compliance audits, PDF compilation, and statutory monitoring."}
          </p>
        </div>

        {/* Usage Tracker Pill */}
        <div className="p-3 rounded-lg bg-[#0C0F14] border border-[#1D232B] flex items-center justify-between text-xs font-mono">
          <span className="text-[#969DA6]">Free Actions Quota:</span>
          <span className="font-medium text-[#CDB98B] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#B39863]" />
            {freeUsesUsed} / {freeUsesLimit} used (0 remaining)
          </span>
        </div>

        {/* Pro Plan Value Pillars */}
        <div className="space-y-2.5 py-1 border-y border-[#1D232B]">
          <div className="flex items-start gap-2.5 text-xs text-[#C7CCD2]">
            <Check className="w-4 h-4 text-[#76937F] shrink-0 mt-0.5" />
            <span><b className="text-[#FAF9F5]">Unlimited Website Audits:</b> Full autonomous inspection across GDPR, HIPAA, SOC 2, WCAG 2.1 AA, and PCI-DSS.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-[#C7CCD2]">
            <Check className="w-4 h-4 text-[#76937F] shrink-0 mt-0.5" />
            <span><b className="text-[#FAF9F5]">Unlimited Regulation Compilation:</b> Parse multi-hundred page PDF & HTML statutory gazettes into ASTs.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-[#C7CCD2]">
            <Check className="w-4 h-4 text-[#76937F] shrink-0 mt-0.5" />
            <span><b className="text-[#FAF9F5]">24/7 Global Surveillance:</b> Real-time statutory gazette monitoring and automated drift alerts.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-[#C7CCD2]">
            <Check className="w-4 h-4 text-[#76937F] shrink-0 mt-0.5" />
            <span><b className="text-[#FAF9F5]">Production Policy AST Exports:</b> Machine-executable Rego/JSON policies and cryptographic audit trails.</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-[#4A2830]/25 border border-[#A96770]/40 text-xs text-[#E5A4A9] flex items-start gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#A96770] mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full sm:flex-1 py-3 px-5 rounded-lg rc-btn-sapphire-metal disabled:opacity-50 text-[#FAF9F5] font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FAF9F5]" />
                <span>Redirecting to Dodo Payments...</span>
              </>
            ) : (
              <>
                <RCIcon name="shield" size={16} className="text-[#BCA77B]" />
                <span>Unlock Continued Access</span>
                <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
              </>
            )}
          </button>

          {isBlocking ? (
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              disabled={isLoading}
              className="w-full sm:w-auto py-3 px-4 rounded-lg rc-btn-graphite-metal text-[#FAF9F5] text-xs font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto py-3 px-4 rounded-lg rc-btn-graphite-metal text-[#FAF9F5] text-xs font-medium transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          )}
        </div>

        {/* Trust Footer */}
        <div className="text-center">
          <span className="text-[11px] text-[#656C74] font-mono">
            Secured by Dodo Payments • Real-time webhook confirmation
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
