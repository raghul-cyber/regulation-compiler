'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { ArrowRight, Terminal } from 'lucide-react';
import { HeroProductPreview } from './hero-product-preview';

export function HeroSection() {
  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      id="hero" 
      className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center pt-10 scroll-mt-24"
    >
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

      {/* Main Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter max-w-5xl leading-[1.08] text-[#F2F6F8]">
        Turn Complex Regulations into <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2F6F8] via-[#5CC8FF] to-[#9AA9B5]">
          Executable Code.
        </span>
      </h1>

      {/* Supporting Copy (1-3 lines maximum) */}
      <p className="mt-6 text-base sm:text-lg md:text-xl text-[#9AA9B5] max-w-3xl font-normal leading-relaxed">
        Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
      </p>

      {/* Action CTAs */}
      <div className="mt-9 flex flex-wrap justify-center gap-4 pointer-events-auto">
        <Show when="signed-in">
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold shadow-[0_0_30px_rgba(92,200,255,0.3)] hover:shadow-[0_0_40px_rgba(92,200,255,0.5)] transition-all px-8 h-12 flex items-center gap-2 cursor-pointer"
            >
              <span>Start Compiling</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
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
              className="bg-[#5CC8FF] hover:bg-[#4bb3e6] text-[#05070A] rounded-xl font-semibold shadow-[0_0_30px_rgba(92,200,255,0.3)] hover:shadow-[0_0_40px_rgba(92,200,255,0.5)] transition-all px-8 h-12 flex items-center gap-2 cursor-pointer"
            >
              <span>Start Compiling</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </SignInButton>
          <button 
            onClick={scrollToHowItWorks}
            className="rounded-xl font-semibold px-8 h-12 bg-[#0C131B] text-[#F2F6F8] border border-[#17222C] hover:border-[#1E2C38] hover:bg-[#17222C]/60 transition-all cursor-pointer flex items-center gap-2 text-sm"
          >
            <span>Explore How It Works</span>
          </button>
        </Show>
      </div>

      {/* Real-Time Platform Metrics Bar */}
      <div className="mt-12 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3.5 pointer-events-auto font-sans">
        <div className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">39+</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Live Regulatory Signals</div>
          <div className="text-[11px] text-[#67D6A0] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67D6A0] inline-block" />
            Federal Register &amp; FCA
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">32+</div>
          <div className="text-xs text-[#9AA9B5] mt-1 font-medium">Compiled Frameworks</div>
          <div className="text-[11px] text-[#5CC8FF] font-mono mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5CC8FF] inline-block" />
            EU AI Act, DORA, GDPR
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#5CC8FF35] text-left transition-all duration-300">
          <div className="text-2xl md:text-3xl font-extrabold text-[#F2F6F8] tracking-tight">95+</div>
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
