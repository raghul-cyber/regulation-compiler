'use client';

import Link from 'next/link';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useMagneticCTA } from '@/hooks/use-tactile-motion';

export function FinalCTASection() {
  const { ref: magneticRef, style: magneticStyle } = useMagneticCTA(3);

  const scrollToWebsiteAuditor = () => {
    const el = document.getElementById('website-auditor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="cta" className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-6 relative">
      {/* Quiet Center Halo Atmosphere */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 135, 82, 0.16) 0%, rgba(77, 120, 160, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div className="p-8 sm:p-12 rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_32px_80px_rgba(9,11,15,0.85)] relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-2 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-[#BCA77B]" />
            <span>Ready for Action</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight">
            From regulation to action.
          </h2>

          {/* 3 User Outcomes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-left sm:text-center">
            <div className="p-3 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
              <span className="font-mono text-xs font-bold text-[#BCA77B] uppercase block">UNDERSTAND</span>
              <p className="text-xs text-[#C7CCD2] mt-1">Know what requirements apply to your systems.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
              <span className="font-mono text-xs font-bold text-[#BCA77B] uppercase block">IDENTIFY</span>
              <p className="text-xs text-[#C7CCD2] mt-1">See exactly what needs attention and why.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
              <span className="font-mono text-xs font-bold text-[#BCA77B] uppercase block">ACT</span>
              <p className="text-xs text-[#C7CCD2] mt-1">Get drop-in code fixes and clear next steps.</p>
            </div>
          </div>

          {/* Supporting Statement */}
          <p className="text-[#C7CCD2] text-base md:text-lg max-w-xl mx-auto font-normal leading-relaxed pt-2">
            Know what your website needs before compliance becomes a problem.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-wrap justify-center items-center gap-3.5 pt-2">
            <button 
              ref={magneticRef as any}
              style={magneticStyle}
              onClick={scrollToWebsiteAuditor}
              className="rc-btn-sapphire-metal rounded-[6px] font-medium px-8 h-11 transition-all cursor-pointer flex items-center gap-2 text-sm shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
            >
              <Globe className="w-4 h-4 text-[#BCA77B]" />
              <span>Run Your First Audit</span>
              <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
            </button>

            <Show when="signed-in">
              <Link href="/dashboard">
                <button 
                  className="rc-btn-graphite-metal rounded-[6px] font-medium px-7 h-11 cursor-pointer flex items-center gap-2 text-sm"
                >
                  <span>Try RegCompiler</span>
                </button>
              </Link>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button 
                  className="rc-btn-graphite-metal rounded-[6px] font-medium px-7 h-11 cursor-pointer flex items-center gap-2 text-sm"
                >
                  <span>Try RegCompiler</span>
                </button>
              </SignInButton>
            </Show>
          </div>

          {/* Quiet Trust Footnote */}
          <div className="pt-6 border-t border-[rgba(199,204,210,0.08)] flex flex-wrap items-center justify-center gap-5 text-xs text-[#969DA6]">
            <Link href="/terms" className="hover:text-[#C7CCD2] transition-colors">
              Terms of Service
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-[#C7CCD2] transition-colors">
              Privacy Policy
            </Link>
            <span>&bull;</span>
            <span className="text-[#76937F] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76937F]" />
              <span>Surveillance Daemon Active</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
