'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HeroCompliancePreview } from './hero-compliance-preview';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { useMagneticCTA } from '@/hooks/use-tactile-motion';

const LINE1_TARGET = "Turn Complex Regulations";
const LINE2_TARGET = "into Executable Checks.";

const TypingHeadline = ({ delay = 150, speed = 28 }: { delay?: number; speed?: number }) => {
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCount(LINE1_TARGET.length + 1 + LINE2_TARGET.length);
      return;
    }

    let intervalId: NodeJS.Timeout;
    const totalChars = LINE1_TARGET.length + 1 + LINE2_TARGET.length;

    const startTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        setTypedCount((prev) => {
          if (prev >= totalChars) {
            clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(intervalId);
    };
  }, [delay, speed]);

  const line1Len = LINE1_TARGET.length;
  const line1Text = LINE1_TARGET.slice(0, Math.min(typedCount, line1Len));
  const isTypingLine1 = typedCount <= line1Len;

  const line2Count = Math.max(0, typedCount - (line1Len + 1));
  const line2Text = LINE2_TARGET.slice(0, Math.min(line2Count, LINE2_TARGET.length));

  return (
    <div className="flex flex-col items-center justify-center select-none text-center">
      <span className="block min-h-[1.2em] tracking-tight text-[#FAF9F5]">
        {line1Text}
        {isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
      <span className="block min-h-[1.2em] mt-1 sm:mt-2 tracking-tight text-[#F3F4F2]">
        {line2Text}
        {!isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
    </div>
  );
};

export function HeroSection() {
  const { ref: heroRef, isRevealed: heroRevealed } = useScrollReveal({ threshold: 0.05 });
  const { ref: magneticPrimaryRef, style: magneticPrimaryStyle } = useMagneticCTA(3);

  const scrollToBenefits = () => {
    const el = document.getElementById('benefits') || document.getElementById('what-it-does');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToWebsiteAuditor = () => {
    const el = document.getElementById('website-audit') || document.getElementById('website-auditor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      id="product" 
      className="w-full flex flex-col items-center text-center pt-4 sm:pt-12 md:pt-20 lg:pt-24 scroll-mt-24 relative"
    >
      {/* Central Hero Atmospheric Framing Light */}
      <div 
        className="absolute top-8 sm:top-16 left-1/2 -translate-x-1/2 w-full max-w-[760px] h-[180px] sm:h-[320px] md:h-[360px] rounded-full blur-[80px] sm:blur-[110px] pointer-events-none -z-10 reveal-hero-bg overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(197, 166, 110, 0.16) 0%, rgba(143, 95, 50, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div ref={heroRef} className={`landing-reveal ${heroRevealed ? 'revealed' : ''} flex flex-col items-center max-w-4xl px-3 sm:px-4 relative w-full`}>
        {/* Eyebrow: Regulatory Intelligence for Modern Teams */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-[4px] bg-[#171C23]/90 border border-[rgba(199,204,210,0.14)] text-[10px] sm:text-xs font-medium text-[#C7CCD2] mb-4 sm:mb-6 shadow-[0_4px_16px_rgba(9,11,15,0.6)] tracking-wide backdrop-blur-md reveal-label max-w-full">
          <div className="w-3.5 h-3.5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 opacity-95">
            <Image 
              src="/logo-icon.png" 
              alt="RegCompiler Logo" 
              width={14} 
              height={14}
              className="w-full h-full object-contain" 
              priority
            />
          </div>
          <span className="text-[#FAF9F5] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold shrink-0">RegCompiler</span>
          <span className="text-[#656C74] font-mono">|</span>
          <span className="text-[#BCA77B] font-mono tracking-wider text-[10px] sm:text-[11px] font-medium truncate">
            Regulatory Intelligence for Modern Teams
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#BCA77B] ml-0.5 shadow-[0_0_6px_rgba(188,167,123,0.5)] shrink-0 hidden sm:inline-block" />
        </div>

        {/* Main Headline with Clean Enterprise Typography in Warm Ivory */}
        <h1 className="text-[26px] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#FAF9F5] max-w-3xl mx-auto leading-[1.12] sm:leading-[1.15] reveal-headline">
          <TypingHeadline delay={150} speed={28} />
        </h1>

        {/* Supporting Copy in Warm Grey: User Benefit */}
        <p className="mt-3.5 sm:mt-5 text-sm sm:text-base md:text-xl text-[#C7CCD2] max-w-2xl font-normal leading-relaxed reveal-body px-2">
          Turn complex regulations into clear, actionable compliance checks for your website and systems.
        </p>

        {/* Action CTAs — Primary & Secondary */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto max-w-sm sm:max-w-none mx-auto pointer-events-auto reveal-cta">
          <Show when="signed-in">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button 
                ref={magneticPrimaryRef as any}
                style={magneticPrimaryStyle}
                className="w-full sm:w-auto rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-12 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
              >
                <span>Try RegCompiler</span>
                <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
              </button>
            </Link>
          </Show>
          
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button 
                ref={magneticPrimaryRef as any}
                style={magneticPrimaryStyle}
                className="w-full sm:w-auto rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-12 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
              >
                <span>Try RegCompiler</span>
                <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
              </button>
            </SignInButton>
          </Show>

          <button 
            onClick={scrollToWebsiteAuditor}
            className="w-full sm:w-auto rc-btn-graphite-metal rounded-[6px] font-medium px-5 h-12 min-h-[48px] flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Globe className="w-4 h-4 text-[#BCA77B]" />
            <span>Run a Website Audit</span>
          </button>

          <button 
            onClick={scrollToBenefits}
            className="w-full sm:w-auto rounded-[6px] font-medium px-5 h-12 min-h-[48px] bg-transparent text-[#AAB1BA] hover:text-[#FAF9F5] border border-[rgba(199,204,210,0.14)] hover:border-[rgba(188,167,123,0.35)] hover:bg-[#171C23]/60 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
          >
            <span>Explore the Product</span>
          </button>
        </div>

        {/* 3 Outcome Signals — Compact reassurance badges */}
        <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-xs text-[#969DA6]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
            <span>Continuous Regulatory Monitoring</span>
          </span>
          <span className="hidden sm:inline text-[rgba(199,204,210,0.15)]">&bull;</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
            <span>Instant Remediation Code</span>
          </span>
          <span className="hidden sm:inline text-[rgba(199,204,210,0.15)]">&bull;</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
            <span>No Complex Setup Required</span>
          </span>
        </div>
      </div>

      {/* Hero Product Visual Preview — User-First Compliance Overview */}
      <HeroCompliancePreview />
    </section>
  );
}
