'use client';

import { Layers, Database, Cpu, Binary, ShieldCheck, Code, ArrowRight } from 'lucide-react';

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
  return (
    <section id="architecture" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Eyebrow & Title */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17222C]/70 border border-[#1E2C38] text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <Layers className="w-3.5 h-3.5" />
          Technical Stack
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight leading-tight">
          Enterprise Architecture
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9AA9B5] leading-relaxed">
          Engineered as a deterministic compiler pipeline. Every statutory input traces directly to an immutable, machine-verifiable enforcement outcome.
        </p>
      </div>

      {/* Layer Stack */}
      <div className="space-y-3">
        {ARCH_LAYERS.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.step}
              className="p-5 rounded-xl bg-[#080D13]/85 border border-[#17222C] hover:border-[#1E2C38] transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left"
            >
              <div className="flex items-start md:items-center gap-4">
                <div className="p-3 rounded-xl bg-[#0C131B] border border-[#17222C] text-[#5CC8FF] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#5CC8FF] font-bold">
                      LAYER {layer.step}
                    </span>
                    <span className="text-[#62717C]">•</span>
                    <h3 className="text-base font-bold text-[#F2F6F8]">
                      {layer.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#9AA9B5] max-w-2xl leading-relaxed">
                    {layer.desc}
                  </p>
                </div>
              </div>

              <div className="font-mono text-[11px] text-[#9AA9B5] bg-[#0C131B] px-3 py-1.5 rounded-lg border border-[#17222C] shrink-0">
                {layer.tech}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
