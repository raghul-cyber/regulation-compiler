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
        className={`landing-stagger ${isRevealed ? 'revealed' : ''} py-3.5 px-5 rounded-[8px] bg-[#0E1218] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.4)]`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-y sm:divide-y-0 lg:divide-x divide-white/[0.06]">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div 
                key={cap.label} 
                className={`flex flex-col items-center text-center p-2 group transition-colors ${
                  i > 0 ? 'lg:pl-4' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[#3B82F6] group-hover:text-[#60A5FA] transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#94A3B8] group-hover:text-[#F1F5F9]">
                    {cap.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono">
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
