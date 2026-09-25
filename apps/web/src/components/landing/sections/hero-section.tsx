'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Globe } from 'lucide-react';
import { HeroProductPreview } from './hero-product-preview';
import { useScrollReveal, useCountUp } from '@/hooks/use-scroll-reveal';
import { useMagneticCTA } from '@/hooks/use-tactile-motion';

const LINE1_TARGET = "Turn Complex Regulations";
const LINE2_TARGET = "into Executable Code.";

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
  const { ref: metricsRef, isRevealed: metricsRevealed } = useScrollReveal({ threshold: 0.2 });
  const { ref: magneticPrimaryRef, style: magneticPrimaryStyle } = useMagneticCTA(3);

  const count1 = useCountUp(39, '+');
  const count2 = useCountUp(32, '+');
  const count3 = useCountUp(95, '+');

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToWebsiteAuditor = () => {
    const el = document.getElementById('website-auditor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      id="product" 
      className="w-full flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 scroll-mt-28 relative"
    >
      {/* Central Hero Atmospheric Framing Light (Soft champagne halo above headline, sapphire depth below) */}
      <div 
        className="absolute top-16 left-1/2 -translate-x-1/2 w-[760px] h-[360px] rounded-full blur-[110px] pointer-events-none -z-10 reveal-hero-bg"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(188, 167, 123, 0.16) 0%, rgba(77, 120, 160, 0.10) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div ref={heroRef} className={`landing-reveal ${heroRevealed ? 'revealed' : ''} flex flex-col items-center max-w-5xl px-4 relative`}>
        {/* Refined Technical Designation Plate */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[4px] bg-[#171C23]/90 border border-[rgba(199,204,210,0.14)] text-xs font-medium text-[#C7CCD2] mb-8 shadow-[0_4px_16px_rgba(9,11,15,0.6)] tracking-wide backdrop-blur-md reveal-label">
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
          <span className="text-[#FAF9F5] font-mono text-[11px] uppercase tracking-wider font-semibold">REGCOMPILER // SPEC-01</span>
          <span className="text-[#656C74] font-mono">|</span>
          <span className="text-[#BCA77B] font-mono tracking-wider text-[10px] uppercase font-medium">
            REGULATORY INTELLIGENCE &bull; FORMAL COMPILER
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#BCA77B] ml-0.5 shadow-[0_0_6px_rgba(188,167,123,0.5)]" title="Statutory Precision Standard" />
        </div>

        {/* Main Headline with Clean Enterprise Sans-Serif Typography in Warm Ivory */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#FAF9F5] max-w-4xl mx-auto leading-[1.15] reveal-headline">
          <TypingHeadline delay={150} speed={28} />
        </h1>

        {/* Supporting Copy in Warm Grey */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#C7CCD2] max-w-3xl font-normal leading-relaxed reveal-body">
          Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
        </p>

        {/* Action CTAs — Clean Engineered Luxury Controls with Tactile Magnetic Interaction */}
        <div className="mt-9 flex flex-wrap justify-center gap-3.5 pointer-events-auto reveal-cta">
          <Show when="signed-in">
            <Link href="/dashboard">
              <button 
                ref={magneticPrimaryRef as any}
                style={magneticPrimaryStyle}
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
              </button>
            </Link>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rc-btn-graphite-metal rounded-[6px] font-medium px-5 h-11 flex items-center gap-2 text-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#BCA77B]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono bg-[#BCA77B]/15 text-[#BCA77B] border border-[#BCA77B]/30 font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#AAB1BA] hover:text-[#FAF9F5] border border-[rgba(199,204,210,0.14)] hover:border-[rgba(188,167,123,0.35)] hover:bg-[#171C23]/60 transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
          
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button 
                ref={magneticPrimaryRef as any}
                style={magneticPrimaryStyle}
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(9,11,15,0.7)]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
              </button>
            </SignInButton>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rc-btn-graphite-metal rounded-[6px] font-medium px-5 h-11 flex items-center gap-2 text-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#BCA77B]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono bg-[#BCA77B]/15 text-[#BCA77B] border border-[#BCA77B]/30 font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#AAB1BA] hover:text-[#FAF9F5] border border-[rgba(199,204,210,0.14)] hover:border-[rgba(188,167,123,0.35)] hover:bg-[#171C23]/60 transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
        </div>
      </div>

      {/* Integrated Technical Specification Rail — High-End Product Specifications */}
      <div 
        ref={metricsRef}
        className={`landing-reveal ${metricsRevealed ? 'revealed' : ''} mt-14 w-full max-w-4xl px-4 pointer-events-auto font-sans reveal-stats`}
      >
        <div className="w-full rounded-[8px] rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_24px_60px_rgba(9,11,15,0.85)] overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(199,204,210,0.08)] transition-all hover:border-[rgba(188,167,123,0.35)]">
          {/* Spec Item 1: Live Regulatory Signals */}
          <div ref={count1.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FAF9F5] tracking-tight font-mono leading-none">
                {count1.displayValue}
              </div>
              <div className="text-xs text-[#969DA6] mt-2 font-medium tracking-wide">
                Live Regulatory Signals
              </div>
            </div>
            <div className="text-[11px] text-[#76937F] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76937F] inline-block shrink-0" />
              <span className="truncate">Federal Register &amp; FCA</span>
            </div>
          </div>

          {/* Spec Item 2: Compiled Frameworks */}
          <div ref={count2.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FAF9F5] tracking-tight font-mono leading-none">
                {count2.displayValue}
              </div>
              <div className="text-xs text-[#969DA6] mt-2 font-medium tracking-wide">
                Compiled Frameworks
              </div>
            </div>
            <div className="text-[11px] text-[#6689A5] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D78A0] inline-block shrink-0" />
              <span className="truncate">EU AI Act, DORA, GDPR</span>
            </div>
          </div>

          {/* Spec Item 3: Formal AST Rules */}
          <div ref={count3.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FAF9F5] tracking-tight font-mono leading-none">
                {count3.displayValue}
              </div>
              <div className="text-xs text-[#969DA6] mt-2 font-medium tracking-wide">
                Formal AST Rules
              </div>
            </div>
            <div className="text-[11px] text-[#BCA77B] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BCA77B] inline-block shrink-0" />
              <span className="truncate">Deterministic Trees</span>
            </div>
          </div>

          {/* Spec Item 4: Evaluation Latency */}
          <div className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FAF9F5] tracking-tight font-mono leading-none">
                &lt;50ms
              </div>
              <div className="text-xs text-[#969DA6] mt-2 font-medium tracking-wide">
                Evaluation Latency
              </div>
            </div>
            <div className="text-[11px] text-[#76937F] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76937F] inline-block shrink-0" />
              <span className="truncate">In-Memory Zero-Lag Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentic Hero Product Preview */}
      <HeroProductPreview />
    </section>
  );
}
