'use client';

import { useState } from 'react';
import { AlertCircle, FileText, Split, Layers, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const FRAGMENTS = [
  {
    id: 'doc_1',
    ref: 'EUR-Lex OJ L 2024/1689 §9',
    text: 'A risk management system shall be established, implemented, documented and maintained...',
    state: 'Ambiguous natural language prose without machine boundary markers',
    clauses: ['Recital 45', 'Art. 9(1)', 'Art. 9(2)(a)'],
    flag: 'HUMAN_READABLE_ONLY',
  },
  {
    id: 'doc_2',
    ref: 'US Federal Register Vol. 88 §164',
    text: 'Covered entities must conduct an accurate and thorough assessment of the potential risks...',
    state: 'Subjective thresholds without machine-verifiable boolean logic',
    clauses: ['§ 164.308(a)(1)(ii)(A)', '§ 164.312(a)(2)(iv)'],
    flag: 'UNINDEXED_OBLIGATION',
  },
  {
    id: 'doc_3',
    ref: 'UK FCA PS21/3 Operational Resilience',
    text: 'Firms must identify their important business services and set impact tolerances...',
    state: 'Periodic point-in-time audit reports that drift out of date within weeks',
    clauses: ['Principle 11', 'SYSC 15A.2.1R'],
    flag: 'STALE_COMPLIANCE_STATE',
  },
];

export function ProblemSection() {
  const [selectedFragment, setSelectedFragment] = useState<string>('doc_1');
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  return (
    <section id="problem" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Section Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-16`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1218] border border-[var(--rc-border-subtle)] text-[#93C5FD] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-[#3B82F6]" />
          The Structural Disconnect
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
          Regulations were written for humans. <br />
          <span className="text-[#94A3B8]">Compliance systems need structure.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#94A3B8] leading-relaxed">
          Traditional compliance relies on manual PDF audits, subjective checklists, and static spreadsheets. As global regulatory bodies publish thousands of statutory amendments every year, manual interpretation collapses under operational ambiguity.
        </p>
      </div>

      {/* Interactive Document Fragment Breakdown Visualization */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''} grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`}>
        {/* Left Column: Fragment Selector Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-mono text-[#64748B] uppercase tracking-wider mb-2">
            01 // UNSTRUCTURED STATUTORY FRAGMENTS
          </div>
          {FRAGMENTS.map((frag) => {
            const isSelected = selectedFragment === frag.id;
            return (
              <div
                key={frag.id}
                onClick={() => setSelectedFragment(frag.id)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#141922] border-[#2563EB] shadow-sm'
                    : 'bg-[#0E1218] border-[var(--rc-border)] hover:border-[var(--rc-border-subtle)] hover:bg-[#141922]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3B82F6]" />
                    <span className="font-mono text-xs font-bold text-[#F1F5F9]">{frag.ref}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#F87171] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/25">
                    {frag.flag}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] italic line-clamp-2">
                  &ldquo;{frag.text}&rdquo;
                </p>
                <div className="mt-2.5 pt-2 border-t border-[var(--rc-border)] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                  <span>Vulnerability: {frag.state}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Reorganization & Structural Resolution */}
        <div className="lg:col-span-6">
          <div className="text-xs font-mono text-[#64748B] uppercase tracking-wider mb-2">
            02 // AUTOMATED PARSER TRANSFORMATION
          </div>
          <div className="p-6 rounded-xl bg-[#0E1218] border border-[var(--rc-border)] text-left relative overflow-hidden">
            {/* Resolution Step Indicators */}
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#090D13] border border-[var(--rc-border)] flex items-start gap-3">
                <div className="p-1.5 rounded bg-[#141922] text-[#3B82F6] mt-0.5">
                  <Split className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[#F1F5F9] font-semibold">1. Boundary Tokenization</div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Isolating discrete statutory obligations from preamble recitals and guidance notes.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#090D13] border border-[var(--rc-border)] flex items-start gap-3">
                <div className="p-1.5 rounded bg-[#141922] text-[#3B82F6] mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[#F1F5F9] font-semibold">2. Dependency Graph Resolution</div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Connecting articles to specific technical security controls, data schemas, and threshold limits.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#090D13] border border-[#10B981]/30 flex items-start gap-3">
                <div className="p-1.5 rounded bg-[#10B981]/15 text-[#10B981] mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[#10B981] font-semibold">3. Deterministic AST Emission</div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Compiling legal mandates into unambiguous, machine-evaluable boolean conditions with cryptographic proof traces.
                  </div>
                </div>
              </div>
            </div>

            {/* Microstatus badge */}
            <div className="mt-5 pt-4 border-t border-[var(--rc-border)] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span>ZERO HUMAN AMBIGUITY</span>
              <span className="text-[#10B981] font-semibold">DETERMINISTIC COMPILATION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
