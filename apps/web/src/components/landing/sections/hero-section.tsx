'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Globe } from 'lucide-react';
import { HeroProductPreview } from './hero-product-preview';
import { useScrollReveal, useCountUp } from '@/hooks/use-scroll-reveal';

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
      <span className="block min-h-[1.2em] tracking-tight text-[#F7F4EC]">
        {line1Text}
        {isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
      <span className="block min-h-[1.2em] mt-1 sm:mt-2 tracking-tight text-[#F1EEE7]">
        {line2Text}
        {!isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
    </div>
  );
};

export function HeroSection() {
  const { ref: heroRef, isRevealed: heroRevealed } = useScrollReveal({ threshold: 0.05 });
  const { ref: metricsRef, isRevealed: metricsRevealed } = useScrollReveal({ threshold: 0.2 });

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
        className="absolute top-16 left-1/2 -translate-x-1/2 w-[720px] h-[340px] rounded-full blur-[110px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(199, 175, 123, 0.12) 0%, rgba(38, 62, 85, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <div ref={heroRef} className={`landing-reveal ${heroRevealed ? 'revealed' : ''} flex flex-col items-center max-w-5xl px-4 relative`}>
        {/* Refined Technical Designation Plate */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[4px] bg-[#171716]/90 border border-[rgba(220,210,190,0.12)] text-xs font-medium text-[#C9C4BA] mb-8 shadow-[0_4px_16px_rgba(8,7,6,0.6)] tracking-wide backdrop-blur-md">
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
          <span className="text-[#F4F0E8] font-mono text-[11px] uppercase tracking-wider font-semibold">REGCOMPILER // SPEC-01</span>
          <span className="text-[#625F5A] font-mono">|</span>
          <span className="text-[#C7AF7B] font-mono tracking-wider text-[10px] uppercase font-medium">
            REGULATORY INTELLIGENCE &bull; FORMAL COMPILER
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C7AF7B] ml-0.5 shadow-[0_0_6px_rgba(199,175,123,0.5)]" title="Statutory Precision Standard" />
        </div>

        {/* Main Headline with Clean Enterprise Sans-Serif Typography in Warm Ivory */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#F4F0E8] max-w-4xl mx-auto leading-[1.15]">
          <TypingHeadline delay={150} speed={28} />
        </h1>

        {/* Supporting Copy in Warm Grey */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#C9C4BA] max-w-3xl font-normal leading-relaxed">
          Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
        </p>

        {/* Action CTAs — Clean Engineered Luxury Controls */}
        <div className="mt-9 flex flex-wrap justify-center gap-3.5 pointer-events-auto">
          <Show when="signed-in">
            <Link href="/dashboard">
              <button 
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(17,24,32,0.6)]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4 text-[#C7AF7B]" />
              </button>
            </Link>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rc-btn-graphite-metal rounded-[6px] font-medium px-5 h-11 flex items-center gap-2 text-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#C7AF7B]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono bg-[#C7AF7B]/15 text-[#C7AF7B] border border-[#C7AF7B]/30 font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#B7B4AC] hover:text-[#F4F0E8] border border-[rgba(220,210,190,0.12)] hover:border-[rgba(185,164,122,0.3)] hover:bg-[#171716]/60 transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
          
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button 
                className="rc-btn-sapphire-metal rounded-[6px] font-medium text-sm px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(17,24,32,0.6)]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4 text-[#C7AF7B]" />
              </button>
            </SignInButton>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rc-btn-graphite-metal rounded-[6px] font-medium px-5 h-11 flex items-center gap-2 text-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#C7AF7B]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono bg-[#C7AF7B]/15 text-[#C7AF7B] border border-[#C7AF7B]/30 font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#B7B4AC] hover:text-[#F4F0E8] border border-[rgba(220,210,190,0.12)] hover:border-[rgba(185,164,122,0.3)] hover:bg-[#171716]/60 transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
        </div>
      </div>

      {/* Integrated Technical Specification Rail — High-End Product Specifications */}
      <div 
        ref={metricsRef}
        className={`landing-reveal ${metricsRevealed ? 'revealed' : ''} mt-14 w-full max-w-4xl px-4 pointer-events-auto font-sans`}
      >
        <div className="w-full rounded-[8px] rc-glass-smoked-elevated border border-[rgba(220,210,190,0.14)] shadow-[0_24px_60px_rgba(8,7,6,0.85)] overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(220,210,190,0.08)] transition-all hover:border-[rgba(185,164,122,0.35)]">
          {/* Spec Item 1: Live Regulatory Signals */}
          <div ref={count1.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F7F4EC] tracking-tight font-mono leading-none">
                {count1.displayValue}
              </div>
              <div className="text-xs text-[#8D8982] mt-2 font-medium tracking-wide">
                Live Regulatory Signals
              </div>
            </div>
            <div className="text-[11px] text-[#718A79] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79] inline-block shrink-0" />
              <span className="truncate">Federal Register &amp; FCA</span>
            </div>
          </div>

          {/* Spec Item 2: Compiled Frameworks */}
          <div ref={count2.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F7F4EC] tracking-tight font-mono leading-none">
                {count2.displayValue}
              </div>
              <div className="text-xs text-[#8D8982] mt-2 font-medium tracking-wide">
                Compiled Frameworks
              </div>
            </div>
            <div className="text-[11px] text-[#4B6982] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F5C74] inline-block shrink-0" />
              <span className="truncate">EU AI Act, DORA, GDPR</span>
            </div>
          </div>

          {/* Spec Item 3: Formal AST Rules */}
          <div ref={count3.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F7F4EC] tracking-tight font-mono leading-none">
                {count3.displayValue}
              </div>
              <div className="text-xs text-[#8D8982] mt-2 font-medium tracking-wide">
                Formal AST Rules
              </div>
            </div>
            <div className="text-[11px] text-[#AD956C] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#AD956C] inline-block shrink-0" />
              <span className="truncate">Deterministic Trees</span>
            </div>
          </div>

          {/* Spec Item 4: Evaluation Latency */}
          <div className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F7F4EC] tracking-tight font-mono leading-none">
                &lt;50ms
              </div>
              <div className="text-xs text-[#8D8982] mt-2 font-medium tracking-wide">
                Evaluation Latency
              </div>
            </div>
            <div className="text-[11px] text-[#718A79] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79] inline-block shrink-0" />
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
