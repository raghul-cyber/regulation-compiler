'use client';

import { useState } from 'react';
import { CheckCircle2, Terminal, Cpu, FileCode2, Copy, Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'compiled'>('compiled');
  const [copied, setCopied] = useState(false);
  const [tabKey, setTabKey] = useState(0); // Reset progress bar on tab switch
  const { ref, isRevealed } = useScrollReveal({ threshold: 0.1 });

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabSwitch = (tab: 'input' | 'analysis' | 'compiled') => {
    setActiveTab(tab);
    setTabKey(prev => prev + 1);
  };

  return (
    <div ref={ref} className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full max-w-4xl mx-auto mt-12 rounded-[8px] rc-glass-smoked-elevated border border-[rgba(220,210,190,0.14)] shadow-[0_32px_80px_rgba(8,7,6,0.85)] overflow-hidden text-left transition-all hover:border-[rgba(185,164,122,0.3)]`}>
      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0B0A09]/95 border-b border-[rgba(220,210,190,0.08)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(220,210,190,0.18)] border border-[rgba(220,210,190,0.08)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(220,210,190,0.18)] border border-[rgba(220,210,190,0.08)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(220,210,190,0.18)] border border-[rgba(220,210,190,0.08)]" />
          <span className="ml-3 font-mono text-[11px] text-[#C9C4BA]">
            COMPILER_STUDIO // EU_AI_ACT_ART9.ast
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#8BA894] bg-[#718A79]/15 px-2 py-0.5 rounded-[4px] border border-[#718A79]/35 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#718A79]" />
            COMPILED &amp; VERIFIED
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#8D8982] hover:text-[#F4F0E8] hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Copy AST definition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#718A79]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Compiler Mode Navigation Tabs */}
      <div className="relative flex items-center gap-1 px-4 pt-1.5 border-b border-[rgba(220,210,190,0.08)] bg-[#0B0A09]/95 font-mono text-xs">
        <button
          onClick={() => handleTabSwitch('input')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'input'
              ? 'border-[#C7AF7B] text-[#F4F0E8] bg-[#171716]'
              : 'border-transparent text-[#8D8982] hover:text-[#C9C4BA]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-[#C7AF7B]" />
          <span>01. Statutory Input</span>
        </button>
        <button
          onClick={() => handleTabSwitch('analysis')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-[#C7AF7B] text-[#F4F0E8] bg-[#171716]'
              : 'border-transparent text-[#8D8982] hover:text-[#C9C4BA]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#C7AF7B]" />
          <span>02. Semantic Extraction</span>
        </button>
        <button
          onClick={() => handleTabSwitch('compiled')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'compiled'
              ? 'border-[#C7AF7B] text-[#F4F0E8] bg-[#171716]'
              : 'border-transparent text-[#8D8982] hover:text-[#C9C4BA]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#C7AF7B]" />
          <span>03. Executable AST Logic</span>
        </button>
        {/* Progress bar on tab switch */}
        <div className="absolute bottom-0 left-0 right-0">
          <div key={tabKey} className="landing-tab-progress-bar h-[2px] bg-[#C7AF7B]" />
        </div>
      </div>

      {/* Code / Content Area with Line Numbers */}
      <div className="p-5 font-mono text-xs leading-relaxed min-h-[200px] bg-[#10100F]">
        {activeTab === 'input' && (
          <div className="text-[#C9C4BA] space-y-2">
            <div className="text-[11px] text-[#8D8982]">// Source: EU Official Journal L 2024/1689 (Regulation (EU) 2024/1689)</div>
            <p className="text-[#F7F4EC]">
              <span className="text-[#AD956C] font-semibold">Article 9(1):</span> A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
            </p>
            <p className="text-[#8D8982] pl-4 border-l border-[rgba(201,196,186,0.12)]">
              (2) The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating...
            </p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#8D8982]">// Semantic Parser Output — Tokenized Boundaries &amp; Dependency Graph</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-[6px] bg-[#151311] border border-[rgba(201,196,186,0.08)]">
                <div className="flex items-center gap-1.5 text-[#718A79] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clauses Identified
                </div>
                <div className="text-[#F7F4EC] font-bold text-base">4 Sub-clauses</div>
                <div className="text-[10px] text-[#8D8982] mt-0.5">Art. 9.1, 9.2, 9.4, 9.7</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#151311] border border-[rgba(201,196,186,0.08)]">
                <div className="flex items-center gap-1.5 text-[#AD956C] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Obligations Extracted
                </div>
                <div className="text-[#F7F4EC] font-bold text-base">2 Mandatory Constraints</div>
                <div className="text-[10px] text-[#8D8982] mt-0.5">Iterative Lifecycle &amp; Testing</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#151311] border border-[rgba(201,196,186,0.08)]">
                <div className="flex items-center gap-1.5 text-[#4B6982] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cross-Graph Mappings
                </div>
                <div className="text-[#F7F4EC] font-bold text-base">ISO 42001 &amp; NIST AI</div>
                <div className="text-[10px] text-[#8D8982] mt-0.5">Section 6.1 Risk Framing</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compiled' && (
          <div className="text-[#F1EEE7] space-y-1 overflow-x-auto landing-line-numbers">
            <div><span className="text-[#625F5A]">// Deterministic AST Rule Tree (Target: OPA Rego / Python Policy Engine)</span></div>
            <div>
              <span className="text-[#AD956C]">rule</span> <span className="text-[#F7F4EC] font-bold">EU_AI_ACT_ART9_RISK_SYSTEM</span> <span className="text-[#8D8982]">&#123;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#625F5A]">// Preconditions</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4B6982]">when:</span> system.classification == <span className="text-[#718A79]">&quot;HIGH_RISK_AI&quot;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4B6982]">assert:</span>
            </div>
            <div className="pl-8 text-[#C9C4BA]">
              system.risk_framework.documented == <span className="text-[#718A79]">true</span> <span className="text-[#AD956C]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#C9C4BA]">
              system.risk_framework.lifecycle_iterative == <span className="text-[#718A79]">true</span> <span className="text-[#AD956C]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#C9C4BA]">
              system.post_market_monitoring.active == <span className="text-[#718A79]">true</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4B6982]">on_pass:</span> emit_cryptographic_proof(<span className="text-[#718A79]">&quot;SHA256:0x89e2...c41&quot;</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#4B6982]">on_fail:</span> dispatch_remediation_playbook(<span className="text-[#AD956C]">&quot;PLAYBOOK_AI_ACT_9&quot;</span>)
            </div>
            <div>
              <span className="text-[#8D8982]">&#125;</span><span className="landing-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-2.5 bg-[#0D0B0A] border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8D8982]">
        <div className="flex items-center gap-3">
          <span>TARGET: OPA_REGO_v0.68</span>
          <span className="text-[rgba(201,196,186,0.2)]">•</span>
          <span>COMPILE_TIME: 14.2ms</span>
        </div>
        <div className="text-[#AD956C] flex items-center gap-1.5 font-medium">
          <span>TAMPER-PROOF TRACE</span>
          <span className="text-[#C9C4BA] font-bold">e9f2a74c</span>
        </div>
      </div>
    </div>
  );
}
