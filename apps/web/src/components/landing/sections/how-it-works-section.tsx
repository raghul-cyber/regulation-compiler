'use client';

import { Cpu } from 'lucide-react';
import { HowItWorksDiagram } from '../how-it-works-diagram';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const STAGES = [
  { step: '01', label: 'INGEST', desc: 'Continuous multi-gazette feed ingestion (US Federal Register, EUR-Lex, UK FCA, MAS).' },
  { step: '02', label: 'PARSE', desc: 'Boundary isolation, token separation, and semantic statutory obligation extraction.' },
  { step: '03', label: 'STRUCTURE', desc: 'Harmonization across cross-jurisdiction regulatory graphs and constraint schemas.' },
  { step: '04', label: 'VALIDATE', desc: 'In-memory zero-lag deterministic evaluation against production environment state.' },
  { step: '05', label: 'COMPILE', desc: 'Emission of executable OPA Rego rules, cryptographic audit proofs, and remediation playbooks.' },
];

export function HowItWorksSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: stagesRef, isRevealed: stagesRevealed } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Header */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1218] border border-[var(--rc-border-subtle)] text-[#93C5FD] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
          Compiler Architecture
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
          How RegCompiler Works
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#94A3B8] leading-relaxed">
          The end-to-end statutory compilation lifecycle. From raw governmental gazettes to real-time machine policy enforcement.
        </p>
      </div>

      {/* 5-Step Micro Overview Strip */}
      <div ref={stagesRef} className={`landing-stagger ${stagesRevealed ? 'revealed' : ''} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10`}>
        {STAGES.map((s) => (
          <div 
            key={s.step} 
            className="p-3.5 rounded-xl bg-[#0E1218] border border-[var(--rc-border)] text-left hover:border-[var(--rc-border-subtle)] transition-colors"
          >
            <div className="font-mono text-[10px] text-[#3B82F6] font-bold mb-1">
              STAGE {s.step}
            </div>
            <div className="font-mono text-xs font-bold text-[#F1F5F9] mb-1">
              {s.label}
            </div>
            <div className="text-[11px] text-[#94A3B8] leading-relaxed">
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Diagram Deep Dive */}
      <HowItWorksDiagram />
    </section>
  );
}
