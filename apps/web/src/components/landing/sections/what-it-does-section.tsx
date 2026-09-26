'use client';

import { useState } from 'react';
import { BookOpen, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface BenefitCard {
  id: string;
  step: string;
  action: string;
  title: string;
  description: string;
  outcome: string;
  icon: typeof BookOpen;
}

const BENEFITS: BenefitCard[] = [
  {
    id: 'understand',
    step: '01',
    action: 'UNDERSTAND',
    title: 'Know what regulations actually require',
    description: 'Quickly understand what a regulation requires without reading hundreds of pages of legal text.',
    outcome: 'Clear summaries instead of legal ambiguity',
    icon: BookOpen,
  },
  {
    id: 'check',
    step: '02',
    action: 'CHECK',
    title: 'Check your website and systems automatically',
    description: 'Check your website, headers, cookies, and digital systems against relevant compliance requirements in minutes.',
    outcome: 'Find compliance gaps before anyone else does',
    icon: ShieldCheck,
  },
  {
    id: 'act',
    step: '03',
    action: 'ACT',
    title: 'Get clear findings and actionable next steps',
    description: 'Turn dense requirements into prioritized tasks and instant, drop-in code fixes for your team.',
    outcome: 'Deploy fixes directly with zero guesswork',
    icon: Zap,
  },
];

export function WhatItDoesSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: cardsRef, isRevealed: cardsRevealed } = useScrollReveal({ threshold: 0.1 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const scrollToWebsiteAuditor = () => {
    const el = document.getElementById('website-audit') || document.getElementById('website-auditor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      id="benefits" 
      className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative"
    >
      {/* Background Framing Atmosphere */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 135, 82, 0.12) 0%, rgba(140, 107, 66, 0.05) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div 
        ref={titleRef} 
        className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-12`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>Benefits</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Compliance, without the paperwork overload.
        </h2>

        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed max-w-2xl mx-auto">
          RegCompiler helps modern teams navigate regulatory requirements and verify their digital infrastructure without manually deciphering dense legal documents.
        </p>
      </div>

      {/* 3 Interactive User-Centric Benefit Cards */}
      <div 
        ref={cardsRef} 
        className={`landing-stagger ${cardsRevealed ? 'revealed' : ''} grid grid-cols-1 md:grid-cols-3 gap-6`}
      >
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          const isHovered = hoveredCard === b.id;

          return (
            <div
              key={b.id}
              onMouseEnter={() => setHoveredCard(b.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`p-6 sm:p-7 rounded-xl rc-glass-smoked border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-default shadow-[0_8px_24px_rgba(9,11,15,0.65)] ${
                isHovered
                  ? 'border-[rgba(188,167,123,0.45)] bg-[#171C23] -translate-y-1 shadow-[0_16px_40px_rgba(9,11,15,0.85)]'
                  : 'border-[rgba(199,204,210,0.12)] hover:border-[rgba(188,167,123,0.30)]'
              }`}
            >
              {/* Subtle Ambient Hover Glow */}
              <div 
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background: 'radial-gradient(circle 240px at 50% 10%, rgba(188, 167, 123, 0.08), transparent 80%)',
                }}
              />

              <div className="relative z-10">
                {/* Step & Action Badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs font-bold text-[#BCA77B] tracking-wider uppercase">
                    {b.action}
                  </span>
                  <span className="font-mono text-xs text-[#969DA6]">
                    {b.step}
                  </span>
                </div>

                {/* Icon Box */}
                <div className="w-11 h-11 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.12)] flex items-center justify-center text-[#BCA77B] mb-5 group-hover:scale-105 group-hover:border-[#BCA77B]/40 transition-all">
                  <Icon className="w-5 h-5" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#FAF9F5] mb-2.5 leading-snug group-hover:text-[#FAF9F5] transition-colors">
                  {b.title}
                </h3>

                {/* Plain-English Explanation */}
                <p className="text-sm text-[#C7CCD2] leading-relaxed">
                  {b.description}
                </p>
              </div>

              {/* Bottom Outcome Tag */}
              <div className="mt-6 pt-4 border-t border-[rgba(199,204,210,0.08)] flex items-center gap-2 text-xs font-mono text-[#76937F] relative z-10">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{b.outcome}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Micro-CTA link */}
      <div className="mt-8 text-center">
        <button
          onClick={scrollToWebsiteAuditor}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#BCA77B] hover:text-[#FAF9F5] transition-colors cursor-pointer group"
        >
          <span>See what your website needs in under 60 seconds</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  );
}
