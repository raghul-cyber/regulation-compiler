'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Globe } from 'lucide-react';
import { HeroProductPreview } from './hero-product-preview';
import { useScrollReveal, useCountUp } from '@/hooks/use-scroll-reveal';
import { Courier_Prime } from 'next/font/google';

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
});

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
    <div className="flex flex-col items-center justify-center select-none">
      <span className="block min-h-[1.25em] tracking-tight text-[#F2F6F8]">
        {line1Text}
        {isTypingLine1 && <span className="landing-cursor" aria-hidden="true" />}
      </span>
      <span className="block min-h-[1.25em] mt-1 sm:mt-2 tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2F6F8] via-[#E2E8F0] to-[#9AA9B5]">
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
      className="w-full flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 scroll-mt-28 relative landing-scanlines"
    >
      <div ref={heroRef} className={`landing-reveal ${heroRevealed ? 'revealed' : ''} flex flex-col items-center`}>
        {/* Small Technical Eyebrow Badge */}
        <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#080D13]/90 border border-[#17222C] text-xs font-semibold text-[#9AA9B5] mb-8 backdrop-blur-md shadow-lg shadow-black/40 hover:border-[#1E2C38] transition-colors">
          <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center shrink-0">
            <Image 
              src="/logo-icon.png" 
              alt="Regulation Compiler Logo" 
              width={16} 
              height={16}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="text-[#F2F6F8] font-medium">Regulation Compiler</span>
          <span className="text-[#62717C]">•</span>
          <span className="text-[#5CC8FF] font-mono tracking-wider text-[11px] uppercase">
            REGULATORY INTELLIGENCE / COMPLIANCE COMPILER
          </span>
        </div>

        {/* Main Headline with Terminal Cursor */}
        <h1 className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F2F6F8] max-w-4xl mx-auto leading-[1.25] ${courierPrime.className}`}>
          <TypingHeadline delay={150} speed={28} />
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#9AA9B5] max-w-3xl font-normal leading-relaxed">
          Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
        </p>

        {/* Action CTAs */}
        <div className="mt-9 flex flex-wrap justify-center gap-4 pointer-events-auto">
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="landing-cta-glow bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold transition-all px-8 h-12 flex items-center gap-2 cursor-pointer"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rounded-xl font-semibold px-6 h-12 bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-xl font-semibold px-8 h-12 bg-[#0C131B] text-[#F2F6F8] border border-[#17222C] hover:border-[#1E2C38] hover:bg-[#17222C]/60 transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
          
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button 
                size="lg" 
                className="landing-cta-glow bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold transition-all px-8 h-12 flex items-center gap-2 cursor-pointer"
              >
                <span>Start Compiling</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </SignInButton>
            <button 
              onClick={scrollToWebsiteAuditor}
              className="rounded-xl font-semibold px-6 h-12 bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Instant Website Auditor</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold uppercase">New</span>
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="rounded-xl font-semibold px-8 h-12 bg-[#0C131B] text-[#F2F6F8] border border-[#17222C] hover:border-[#1E2C38] hover:bg-[#17222C]/60 transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <span>Explore How It Works</span>
            </button>
          </Show>
        </div>
      </div>

      {/* Real-Time Platform Metrics Bar — Animated Count-Up */}
      <div 
        ref={metricsRef}
        className={`landing-stagger ${metricsRevealed ? 'revealed' : ''} mt-12 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3.5 pointer-events-auto font-sans`}
      >
        <div ref={count1.ref} className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">{count1.displayValue}</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Live Regulatory Signals</div>
          <div className="text-[11px] text-[#67D6A0] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67D6A0] inline-block" />
            Federal Register &amp; FCA
          </div>
        </div>

        <div ref={count2.ref} className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">{count2.displayValue}</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Compiled Frameworks</div>
          <div className="text-[11px] text-[#5CC8FF] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CC8FF] inline-block" />
            EU AI Act, DORA, GDPR
          </div>
        </div>

        <div ref={count3.ref} className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">{count3.displayValue}</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Formal AST Rules</div>
          <div className="text-[11px] text-[#5CC8FF] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CC8FF] inline-block" />
            Deterministic Trees
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">&lt;50ms</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Evaluation Latency</div>
          <div className="text-[11px] text-[#67D6A0] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67D6A0] inline-block" />
            In-Memory Zero-Lag Engine
          </div>
        </div>
      </div>

      {/* Authentic Hero Product Preview */}
      <HeroProductPreview />
    </section>
  );
}
