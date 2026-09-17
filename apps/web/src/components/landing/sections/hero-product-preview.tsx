'use client';

import { useState, useEffect, useRef } from 'react';
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
    <div ref={ref} className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full max-w-4xl mx-auto mt-14 rounded-2xl bg-[#080D13]/90 border border-[#17222C] shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden text-left transition-all duration-300 hover:border-[#1E2C38]`}>
      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0C131B]/80 border-b border-[#17222C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#17222C] border border-[#1E2C38]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#17222C] border border-[#1E2C38]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#17222C] border border-[#1E2C38]" />
          <span className="ml-3 font-mono text-[11px] text-[#9AA9B5]">
            COMPILER_STUDIO // EU_AI_ACT_ART9.ast
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#67D6A0] bg-[#67D6A015] px-2 py-0.5 rounded border border-[#67D6A030] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#67D6A0] animate-pulse" />
            COMPILED &amp; VERIFIED
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#62717C] hover:text-[#F2F6F8] hover:bg-[#17222C] transition-colors"
            title="Copy AST definition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#67D6A0]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Compiler Mode Navigation Tabs */}
      <div className="relative flex items-center gap-1 px-4 pt-2 border-b border-[#17222C] bg-[#080D13] font-mono text-xs">
        <button
          onClick={() => handleTabSwitch('input')}
          className={`px-3 py-2 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'input'
              ? 'border-[#5CC8FF] text-[#5CC8FF] bg-[#0C131B]'
              : 'border-transparent text-[#62717C] hover:text-[#9AA9B5]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>01. Statutory Input</span>
        </button>
        <button
          onClick={() => handleTabSwitch('analysis')}
          className={`px-3 py-2 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'analysis'
              ? 'border-[#5CC8FF] text-[#5CC8FF] bg-[#0C131B]'
              : 'border-transparent text-[#62717C] hover:text-[#9AA9B5]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>02. Semantic Extraction</span>
        </button>
        <button
          onClick={() => handleTabSwitch('compiled')}
          className={`px-3 py-2 border-b-2 font-medium transition-all flex items-center gap-2 ${
            activeTab === 'compiled'
              ? 'border-[#5CC8FF] text-[#5CC8FF] bg-[#0C131B]'
              : 'border-transparent text-[#62717C] hover:text-[#9AA9B5]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>03. Executable AST Logic</span>
        </button>
        {/* Progress bar on tab switch */}
        <div className="absolute bottom-0 left-0 right-0">
          <div key={tabKey} className="landing-tab-progress-bar" />
        </div>
      </div>

      {/* Code / Content Area with Line Numbers */}
      <div className="p-5 font-mono text-xs leading-relaxed min-h-[200px]">
        {activeTab === 'input' && (
          <div className="text-[#9AA9B5] space-y-2">
            <div className="text-[11px] text-[#62717C]">// Source: EU Official Journal L 2024/1689 (Regulation (EU) 2024/1689)</div>
            <p className="text-[#F2F6F8]">
              <span className="text-[#5CC8FF] font-semibold">Article 9(1):</span> A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
            </p>
            <p className="text-[#9AA9B5] pl-4 border-l border-[#17222C]">
              (2) The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating...
            </p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#62717C]">// Semantic Parser Output — Tokenized Boundaries &amp; Dependency Graph</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#0C131B] border border-[#17222C]">
                <div className="flex items-center gap-2 text-[#67D6A0] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clauses Identified
                </div>
                <div className="text-[#F2F6F8] font-bold text-lg">4 Sub-clauses</div>
                <div className="text-[10px] text-[#62717C] mt-0.5">Art. 9.1, 9.2, 9.4, 9.7</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0C131B] border border-[#17222C]">
                <div className="flex items-center gap-2 text-[#5CC8FF] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Obligations Extracted
                </div>
                <div className="text-[#F2F6F8] font-bold text-lg">2 Mandatory Constraints</div>
                <div className="text-[10px] text-[#62717C] mt-0.5">Iterative Lifecycle &amp; Testing</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0C131B] border border-[#17222C]">
                <div className="flex items-center gap-2 text-[#5CC8FF] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cross-Graph Mappings
                </div>
                <div className="text-[#F2F6F8] font-bold text-lg">ISO 42001 &amp; NIST AI</div>
                <div className="text-[10px] text-[#62717C] mt-0.5">Section 6.1 Risk Framing</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compiled' && (
          <div className="text-[#F2F6F8] space-y-1 overflow-x-auto landing-line-numbers">
            <div><span className="text-[#62717C]">// Deterministic AST Rule Tree (Target: OPA Rego / Python Policy Engine)</span></div>
            <div>
              <span className="text-[#5CC8FF]">rule</span> <span className="text-[#F2F6F8] font-bold">EU_AI_ACT_ART9_RISK_SYSTEM</span> <span className="text-[#62717C]">&#123;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#62717C]">// Preconditions</span>
            </div>
            <div className="pl-4">
              <span className="text-[#5CC8FF]">when:</span> system.classification == <span className="text-[#67D6A0]">&quot;HIGH_RISK_AI&quot;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#5CC8FF]">assert:</span>
            </div>
            <div className="pl-8 text-[#9AA9B5]">
              system.risk_framework.documented == <span className="text-[#67D6A0]">true</span> <span className="text-[#5CC8FF]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#9AA9B5]">
              system.risk_framework.lifecycle_iterative == <span className="text-[#67D6A0]">true</span> <span className="text-[#5CC8FF]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#9AA9B5]">
              system.post_market_monitoring.active == <span className="text-[#67D6A0]">true</span>
            </div>
            <div className="pl-4">
              <span className="text-[#5CC8FF]">on_pass:</span> emit_cryptographic_proof(<span className="text-[#67D6A0]">&quot;SHA256:0x89e2...c41&quot;</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#5CC8FF]">on_fail:</span> dispatch_remediation_playbook(<span className="text-[#5CC8FF]">&quot;PLAYBOOK_AI_ACT_9&quot;</span>)
            </div>
            <div>
              <span className="text-[#62717C]">&#125;</span><span className="landing-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-5 py-2.5 bg-[#0C131B]/60 border-t border-[#17222C] flex items-center justify-between text-[11px] font-mono text-[#62717C]">
        <div className="flex items-center gap-3">
          <span>TARGET: OPA_REGO_v0.68</span>
          <span>•</span>
          <span>COMPILE_TIME: 14.2ms</span>
        </div>
        <div className="text-[#5CC8FF] flex items-center gap-1.5">
          <span>TAMPER-PROOF TRACE</span>
          <span className="text-[#9AA9B5] font-bold">e9f2a74c</span>
        </div>
      </div>
    </div>
  );
}
