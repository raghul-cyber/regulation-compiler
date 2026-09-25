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
      <span className="block min-h-[1.2em] tracking-tight text-[#F4F6F8]">
        {line1Text}
        {isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
      <span className="block min-h-[1.2em] mt-1 sm:mt-2 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4F6F8] via-[#E2E8F0] to-[#9CA3AF]">
          {line2Text}
        </span>
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
      <div ref={heroRef} className={`landing-reveal ${heroRevealed ? 'revealed' : ''} flex flex-col items-center max-w-5xl px-4`}>
        {/* Refined Technical Designation Plate */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] bg-[#080A0E]/95 border border-white/[0.08] text-xs font-medium text-[#9CA3AF] mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.5)] tracking-wide">
          <div className="w-3.5 h-3.5 rounded-[2px] overflow-hidden flex items-center justify-center shrink-0 opacity-90">
            <Image 
              src="/logo-icon.png" 
              alt="RegCompiler Logo" 
              width={14} 
              height={14}
              className="w-full h-full object-contain" 
              priority
            />
          </div>
          <span className="text-[#F4F6F8] font-mono text-[11px] uppercase tracking-wider font-semibold">REGCOMPILER // SPEC-01</span>
          <span className="text-[#3A424E] font-mono">|</span>
          <span className="text-[#7EA2C4] font-mono tracking-wider text-[10px] uppercase font-medium">
            REGULATORY INTELLIGENCE &bull; FORMAL COMPILER
          </span>
          <span className="w-1 h-1 rounded-full bg-[#C9B88A] ml-0.5" title="Statutory Precision Standard" />
        </div>

        {/* Main Headline with Clean Enterprise Sans-Serif Typography */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-[#F4F6F8] max-w-4xl mx-auto leading-[1.15]">
          <TypingHeadline delay={150} speed={28} />
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#9CA3AF] max-w-3xl font-normal leading-relaxed">
          Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
        </p>

        {/* Action CTAs — Clean Engineered Buttons */}
        <div className="mt-9 flex flex-wrap justify-center gap-3.5 pointer-events-auto">
          <Show when="signed-in">
            <Link href="/dashboard">
              <button 
                className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium text-sm transition-all px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-[#79B5EC]/20 active:scale-[0.98]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rounded-[6px] font-medium px-5 h-11 bg-[#080A0E] text-[#F4F6F8] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#0B0E14] transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <Globe className="w-4 h-4 text-[#4D8FCC]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#4D8FCC]/15 text-[#79B5EC] font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#9CA3AF] hover:text-[#F4F6F8] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
          
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button 
                className="bg-[#4D8FCC] hover:bg-[#3B72A8] text-white rounded-[6px] font-medium text-sm transition-all px-6 h-11 flex items-center gap-2 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.4)] border border-[#79B5EC]/20 active:scale-[0.98]"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignInButton>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rounded-[6px] font-medium px-5 h-11 bg-[#080A0E] text-[#F4F6F8] border border-white/[0.08] hover:border-white/[0.16] hover:bg-[#0B0E14] transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <Globe className="w-4 h-4 text-[#4D8FCC]" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#4D8FCC]/15 text-[#79B5EC] font-semibold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-[6px] font-medium px-5 h-11 bg-transparent text-[#9CA3AF] hover:text-[#F4F6F8] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all cursor-pointer flex items-center gap-2 text-sm active:scale-[0.98]"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
        </div>
      </div>

      {/* Integrated Technical Specification Rail — Monolithic Architectural Module */}
      <div 
        ref={metricsRef}
        className={`landing-reveal ${metricsRevealed ? 'revealed' : ''} mt-14 w-full max-w-4xl px-4 pointer-events-auto font-sans`}
      >
        <div className="w-full rounded-[8px] bg-[#080A0E]/90 border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.06] transition-colors hover:border-white/[0.12]">
          {/* Spec Item 1: Live Regulatory Signals */}
          <div ref={count1.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F4F6F8] tracking-tight font-mono leading-none">
                {count1.displayValue}
              </div>
              <div className="text-xs text-[#A0A6B1] mt-2 font-medium tracking-wide">
                Live Regulatory Signals
              </div>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
              <span className="truncate">Federal Register &amp; FCA</span>
            </div>
          </div>

          {/* Spec Item 2: Compiled Frameworks */}
          <div ref={count2.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F4F6F8] tracking-tight font-mono leading-none">
                {count2.displayValue}
              </div>
              <div className="text-xs text-[#A0A6B1] mt-2 font-medium tracking-wide">
                Compiled Frameworks
              </div>
            </div>
            <div className="text-[11px] text-[#6B8BA4] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC] inline-block shrink-0" />
              <span className="truncate">EU AI Act, DORA, GDPR</span>
            </div>
          </div>

          {/* Spec Item 3: Formal AST Rules */}
          <div ref={count3.ref} className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F4F6F8] tracking-tight font-mono leading-none">
                {count3.displayValue}
              </div>
              <div className="text-xs text-[#A0A6B1] mt-2 font-medium tracking-wide">
                Formal AST Rules
              </div>
            </div>
            <div className="text-[11px] text-[#6B8BA4] font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D8FCC] inline-block shrink-0" />
              <span className="truncate">Deterministic Trees</span>
            </div>
          </div>

          {/* Spec Item 4: Evaluation Latency */}
          <div className="p-5 md:p-6 text-left flex flex-col justify-between group">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F4F6F8] tracking-tight font-mono leading-none">
                &lt;50ms
              </div>
              <div className="text-xs text-[#A0A6B1] mt-2 font-medium tracking-wide">
                Evaluation Latency
              </div>
            </div>
            <div className="text-[11px] text-emerald-400/90 font-mono mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
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
