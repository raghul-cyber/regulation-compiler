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
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Engineering Laboratory Room Atmosphere (Graphite & Champagne Lighting) */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[400px] rounded-full blur-[150px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(36, 43, 51, 0.40) 0%, rgba(188, 167, 123, 0.14) 50%, transparent 85%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <Cpu className="w-3.5 h-3.5 text-[#BCA77B]" />
          Compiler Architecture
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          How RegCompiler Works
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed">
          The end-to-end statutory compilation lifecycle. From raw governmental gazettes to real-time machine policy enforcement.
        </p>
      </div>

      {/* 5-Step Micro Overview Strip */}
      <div ref={stagesRef} className={`landing-stagger ${stagesRevealed ? 'revealed' : ''} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10`}>
        {STAGES.map((s) => (
          <div 
            key={s.step} 
            className="p-3.5 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] text-left hover:border-[rgba(188,167,123,0.35)] hover:bg-[#171C23]/90 transition-all shadow-[0_8px_24px_rgba(9,11,15,0.65)]"
          >
            <div className="font-mono text-[10px] text-[#BCA77B] font-bold mb-1">
              STAGE {s.step}
            </div>
            <div className="font-mono text-xs font-bold text-[#FAF9F5] mb-1">
              {s.label}
            </div>
            <div className="text-[11px] text-[#C7CCD2] leading-relaxed">
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
