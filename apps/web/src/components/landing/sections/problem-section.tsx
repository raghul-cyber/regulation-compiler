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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151311] border border-[rgba(201,196,186,0.12)] text-[#AD956C] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <AlertCircle className="w-3.5 h-3.5 text-[#AD956C]" />
          The Structural Disconnect
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F7F4EC] tracking-tight leading-tight">
          Regulations were written for humans. <br />
          <span className="text-[#8D8982]">Compliance systems need structure.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C9C4BA] leading-relaxed">
          Traditional compliance relies on manual PDF audits, subjective checklists, and static spreadsheets. As global regulatory bodies publish thousands of statutory amendments every year, manual interpretation collapses under operational ambiguity.
        </p>
      </div>

      {/* Interactive Document Fragment Breakdown Visualization */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''} grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`}>
        {/* Left Column: Fragment Selector Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-mono text-[#8D8982] uppercase tracking-wider mb-2">
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
                    ? 'bg-[#1B1815] border-[#AD956C]/50 shadow-[0_8px_24px_rgba(0,0,0,0.6)]'
                    : 'bg-[#151311] border-[rgba(201,196,186,0.08)] hover:border-[rgba(201,196,186,0.18)] hover:bg-[#1B1815]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#AD956C]" />
                    <span className="font-mono text-xs font-bold text-[#F7F4EC]">{frag.ref}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#C5B38B] bg-[#9A5D62]/20 px-2 py-0.5 rounded border border-[#9A5D62]/30">
                    {frag.flag}
                  </span>
                </div>
                <p className="text-xs text-[#C9C4BA] italic line-clamp-2">
                  &ldquo;{frag.text}&rdquo;
                </p>
                <div className="mt-2.5 pt-2 border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8D8982]">
                  <span>Vulnerability: {frag.state}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Reorganization & Structural Resolution */}
        <div className="lg:col-span-6">
          <div className="text-xs font-mono text-[#8D8982] uppercase tracking-wider mb-2">
            02 // AUTOMATED PARSER TRANSFORMATION
          </div>
          <div className="p-6 rounded-xl bg-[#151311] border border-[rgba(201,196,186,0.10)] text-left relative overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(201,196,186,0.08)] mb-4">
              <span className="font-mono text-xs text-[#AD956C] uppercase tracking-wider font-semibold">
                Syntactic Boundary Deconstruction
              </span>
              <span className="text-[10px] font-mono text-[#718A79] bg-[#718A79]/10 px-2 py-0.5 rounded border border-[#718A79]/30">
                Deterministic
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#100E0D] border border-[rgba(201,196,186,0.08)]">
                <div className="text-[10px] text-[#8D8982] uppercase tracking-wider mb-1">Normalized Legal Entity</div>
                <div className="text-[#F7F4EC] font-bold">HIGH_RISK_AI_OPERATOR // ARTICLE_09</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#100E0D] border border-[rgba(201,196,186,0.08)]">
                <div className="text-[10px] text-[#8D8982] uppercase tracking-wider mb-1">Extracted Obligation Scope</div>
                <div className="text-[#718A79] font-semibold">[MANDATORY] Continuous Lifecycle Risk Assessment</div>
                <div className="text-[#C9C4BA] mt-1 text-[11px]">Enforces active systematic reviews and verified post-market logs.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#100E0D] border border-[rgba(201,196,186,0.08)]">
                <div className="text-[10px] text-[#8D8982] uppercase tracking-wider mb-1">Target Engine AST Assertion</div>
                <div className="text-[#C9C4BA] overflow-x-auto whitespace-pre">
                  {`assert(system.lifecycle.iterative_review == true)\nassert(system.risk_framework.documented == true)`}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8D8982]">
              <span>Latency: &lt;12ms</span>
              <span className="text-[#718A79]">ZERO SEMANTIC DRIFT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
