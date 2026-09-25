'use client';

import { Layers, Database, Cpu, Binary, ShieldCheck, Code } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const ARCH_LAYERS = [
  {
    step: '01',
    name: 'Statutory Ingestion Engine',
    badge: 'INGESTION',
    icon: Database,
    tech: 'Multi-Gazette Daemons',
    desc: 'Asynchronous scrapers stream official amendments from the US Federal Register, EUR-Lex, UK FCA, and Singapore MAS.',
  },
  {
    step: '02',
    name: 'Semantic Parser & Tokenizer',
    badge: 'PARSING',
    icon: Cpu,
    tech: 'Statutory AST Compiler',
    desc: 'Transforms ambiguous statutory prose into structured Abstract Syntax Trees with boolean operators, constraints, and scope boundaries.',
  },
  {
    step: '03',
    name: 'Cross-Framework Graph Harmonizer',
    badge: 'GRAPH',
    icon: Binary,
    tech: 'Multi-Jurisdiction Graph',
    desc: 'Automatically maps equivalent obligations across GDPR, DORA, SEC, and NIST to eliminate redundant security controls.',
  },
  {
    step: '04',
    name: 'Deterministic Evaluation Engine',
    badge: 'RUNTIME',
    icon: ShieldCheck,
    tech: 'Sub-50ms In-Memory Engine',
    desc: 'Evaluates production infrastructure telemetry, admission controllers, and event streams against compiled policy trees.',
  },
  {
    step: '05',
    name: 'Policy-as-Code Emission',
    badge: 'OUTPUT',
    icon: Code,
    tech: 'OPA Rego & JSON Schemas',
    desc: 'Generates immutable Open Policy Agent (OPA) rules, CI/CD admission policies, and cryptographic compliance dossiers.',
  },
];

export function ArchitectureSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: layersRef, isRevealed: layersRevealed } = useScrollReveal({ threshold: 0.08 });

  return (
    <section id="architecture" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Control Room Atmosphere (Deep Sapphire & Titanium Reflections) */}
      <div 
        className="absolute top-1/2 right-10 -translate-y-1/2 w-[680px] h-[460px] rounded-full blur-[150px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(38, 62, 85, 0.30) 0%, rgba(20, 28, 36, 0.14) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171716] border border-[rgba(220,210,190,0.12)] text-[#C7AF7B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(8,7,6,0.5)] backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-[#C7AF7B]" />
          Technical Stack
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F0E8] tracking-tight leading-tight">
          Enterprise Architecture
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C9C4BA] leading-relaxed">
          Engineered as a deterministic compiler pipeline. Every statutory input traces directly to an immutable, machine-verifiable enforcement outcome.
        </p>
      </div>

      {/* Layer Stack */}
      <div ref={layersRef} className={`landing-stagger ${layersRevealed ? 'revealed' : ''} space-y-3`}>
        {ARCH_LAYERS.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.step}
              className="p-5 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] hover:bg-[#171716]/90 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left shadow-[0_8px_24px_rgba(8,7,6,0.65)]"
            >
              <div className="flex items-start md:items-center gap-4">
                <div className="p-3 rounded-lg bg-[#171716] border border-[rgba(220,210,190,0.08)] text-[#C7AF7B] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#C7AF7B] font-bold">
                      LAYER {layer.step}
                    </span>
                    <span className="text-[#625F5A]">•</span>
                    <h3 className="text-base font-bold text-[#F4F0E8]">
                      {layer.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#C9C4BA] max-w-2xl leading-relaxed">
                    {layer.desc}
                  </p>
                </div>
              </div>

              <div className="font-mono text-[11px] text-[#B7B4AC] bg-[#10100F] px-3 py-1.5 rounded-lg border border-[rgba(220,210,190,0.08)] shrink-0">
                {layer.tech}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
