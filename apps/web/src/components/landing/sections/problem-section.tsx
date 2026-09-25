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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080A0E] border border-white/[0.06] text-[#79B5EC] text-xs font-mono font-medium uppercase tracking-wider mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-[#4D8FCC]" />
          The Structural Disconnect
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F4F6F8] tracking-tight leading-tight">
          Regulations were written for humans. <br />
          <span className="text-[#9CA3AF]">Compliance systems need structure.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#9CA3AF] leading-relaxed">
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
                    ? 'bg-[#0B0E14] border-[#4D8FCC]/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
                    : 'bg-[#080A0E] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#0B0E14]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4D8FCC]" />
                    <span className="font-mono text-xs font-bold text-[#F4F6F8]">{frag.ref}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#F87171] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/25">
                    {frag.flag}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] italic line-clamp-2">
                  &ldquo;{frag.text}&rdquo;
                </p>
                <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
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
          <div className="p-6 rounded-xl bg-[#080A0E] border border-white/[0.06] text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] mb-4">
              <span className="font-mono text-xs text-[#4D8FCC] uppercase tracking-wider font-semibold">
                Syntactic Boundary Deconstruction
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                Deterministic
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#050608] border border-white/[0.05]">
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Normalized Legal Entity</div>
                <div className="text-[#F4F6F8] font-bold">HIGH_RISK_AI_OPERATOR // ARTICLE_09</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#050608] border border-white/[0.05]">
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Extracted Obligation Scope</div>
                <div className="text-emerald-400 font-semibold">[MANDATORY] Continuous Lifecycle Risk Assessment</div>
                <div className="text-[#9CA3AF] mt-1 text-[11px]">Enforces active systematic reviews and verified post-market logs.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#050608] border border-white/[0.05]">
                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Target Engine AST Assertion</div>
                <div className="text-[#79B5EC] overflow-x-auto whitespace-pre">
                  {`assert(system.lifecycle.iterative_review == true)\nassert(system.risk_framework.documented == true)`}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
              <span>Latency: &lt;12ms</span>
              <span className="text-emerald-400">ZERO SEMANTIC DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
