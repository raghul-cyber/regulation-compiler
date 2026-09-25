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
    <section id="problem" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Dark Archive Room Atmosphere (Dusky Plum & Deep Burgundy) */}
      <div 
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[650px] h-[420px] rounded-full blur-[150px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(48, 35, 47, 0.28) 0%, rgba(74, 40, 48, 0.16) 45%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Section Eyebrow & Title */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-16`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-[#BCA77B]" />
          The Structural Disconnect
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Regulations were written for humans. <br />
          <span className="text-[#969DA6]">Compliance systems need structure.</span>
        </h2>
        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed">
          Traditional compliance relies on manual PDF audits, subjective checklists, and static spreadsheets. As global regulatory bodies publish thousands of statutory amendments every year, manual interpretation collapses under operational ambiguity.
        </p>
      </div>

      {/* Interactive Document Fragment Breakdown Visualization */}
      <div ref={contentRef} className={`landing-reveal ${contentRevealed ? 'revealed' : ''} grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`}>
        {/* Left Column: Fragment Selector Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-mono text-[#969DA6] uppercase tracking-wider mb-2">
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
                    ? 'bg-[#30232F]/50 border-[rgba(188,167,123,0.45)] shadow-[0_12px_36px_rgba(9,11,15,0.7)] backdrop-blur-md'
                    : 'rc-glass-smoked border-[rgba(199,204,210,0.08)] hover:border-[rgba(188,167,123,0.25)] hover:bg-[#171C23]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#BCA77B]" />
                    <span className="font-mono text-xs font-bold text-[#FAF9F5]">{frag.ref}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#BCA77B] bg-[#4A2830] px-2 py-0.5 rounded border border-[#4A2830]">
                    {frag.flag}
                  </span>
                </div>
                <p className="text-xs text-[#C7CCD2] italic line-clamp-2">
                  &ldquo;{frag.text}&rdquo;
                </p>
                <div className="mt-2.5 pt-2 border-t border-[rgba(199,204,210,0.08)] flex items-center justify-between text-[11px] font-mono text-[#969DA6]">
                  <span>Vulnerability: {frag.state}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Reorganization & Structural Resolution */}
        <div className="lg:col-span-6">
          <div className="text-xs font-mono text-[#969DA6] uppercase tracking-wider mb-2">
            02 // AUTOMATED PARSER TRANSFORMATION
          </div>
          <div className="p-6 rounded-xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.12)] text-left relative overflow-hidden shadow-[0_16px_48px_rgba(9,11,15,0.75)]">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(199,204,210,0.08)] mb-4">
              <span className="font-mono text-xs text-[#BCA77B] uppercase tracking-wider font-semibold">
                Syntactic Boundary Deconstruction
              </span>
              <span className="text-[10px] font-mono text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded border border-[#76937F]/35">
                Deterministic
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
                <div className="text-[10px] text-[#969DA6] uppercase tracking-wider mb-1">Normalized Legal Entity</div>
                <div className="text-[#FAF9F5] font-bold">HIGH_RISK_AI_OPERATOR // ARTICLE_09</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
                <div className="text-[10px] text-[#969DA6] uppercase tracking-wider mb-1">Extracted Obligation Scope</div>
                <div className="text-[#76937F] font-semibold">[MANDATORY] Continuous Lifecycle Risk Assessment</div>
                <div className="text-[#C7CCD2] mt-1 text-[11px]">Enforces active systematic reviews and verified post-market logs.</div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)]">
                <div className="text-[10px] text-[#969DA6] uppercase tracking-wider mb-1">Target Engine AST Assertion</div>
                <div className="text-[#C7CCD2] overflow-x-auto whitespace-pre">
                  {`assert(system.lifecycle.iterative_review == true)\nassert(system.risk_framework.documented == true)`}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[rgba(199,204,210,0.08)] flex items-center justify-between text-[11px] font-mono text-[#969DA6]">
              <span>Latency: &lt;12ms</span>
              <span className="text-[#76937F]">AST Output Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
