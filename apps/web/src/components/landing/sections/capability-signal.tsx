'use client';

import { FileText, Cpu, Binary, CheckCircle2, ShieldCheck, Code2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const CAPABILITIES = [
  { icon: FileText, label: 'REGULATION INGESTION', detail: 'Multi-Gazette Feeds' },
  { icon: Cpu, label: 'CLAUSE ANALYSIS', detail: 'Tokenized Boundaries' },
  { icon: Binary, label: 'STRUCTURED RULES', detail: 'Deterministic AST' },
  { icon: CheckCircle2, label: 'VALIDATION', detail: 'Sub-50ms Evaluation' },
  { icon: ShieldCheck, label: 'TRACEABILITY', detail: 'Cryptographic Proofs' },
  { icon: Code2, label: 'COMPILED LOGIC', detail: 'OPA & Policy As Code' },
];

export function CapabilitySignal() {
  const { ref, isRevealed } = useScrollReveal();

  return (
    <section className="w-full max-w-6xl mx-auto px-4 pointer-events-auto">
      <div 
        ref={ref} 
        className={`landing-stagger ${isRevealed ? 'revealed' : ''} py-4 px-6 rounded-2xl bg-[#080D13]/80 border border-[#17222C] shadow-lg backdrop-blur-md`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 divide-y sm:divide-y-0 lg:divide-x divide-[#17222C]">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div 
                key={cap.label} 
                className={`flex flex-col items-center text-center p-2 group transition-transform duration-200 hover:-translate-y-0.5 ${
                  i > 0 ? 'lg:pl-4' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5 text-[#5CC8FF] group-hover:text-[#F2F6F8] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#9AA9B5] group-hover:text-[#F2F6F8]">
                    {cap.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#62717C] font-mono">
                  {cap.detail}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
