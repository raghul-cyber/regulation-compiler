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
        className={`landing-stagger ${isRevealed ? 'revealed' : ''} py-3.5 px-5 rounded-[8px] rc-glass-smoked border border-[rgba(220,210,190,0.12)] shadow-[0_12px_36px_rgba(8,7,6,0.7)] hover:border-[rgba(185,164,122,0.3)] transition-all`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 lg:divide-x divide-[rgba(220,210,190,0.08)]">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div 
                key={cap.label} 
                className={`flex flex-col items-center text-center p-2 group transition-colors ${
                  i > 0 ? 'lg:pl-4' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[#C7AF7B] group-hover:text-[#F4F0E8] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#C9C4BA] group-hover:text-[#F4F0E8]">
                    {cap.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#8D8982] font-mono group-hover:text-[#B7B4AC] transition-colors">
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
