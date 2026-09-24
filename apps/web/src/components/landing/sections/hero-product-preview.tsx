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
    <div ref={ref} className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full max-w-4xl mx-auto mt-12 rounded-[8px] bg-[#0E1218] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden text-left transition-colors hover:border-white/[0.14]`}>
      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0A0D12] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12] border border-white/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12] border border-white/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12] border border-white/[0.06]" />
          <span className="ml-3 font-mono text-[11px] text-[#8B949E]">
            COMPILER_STUDIO // EU_AI_ACT_ART9.ast
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-[4px] border border-emerald-500/25 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            COMPILED &amp; VERIFIED
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Copy AST definition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Compiler Mode Navigation Tabs */}
      <div className="relative flex items-center gap-1 px-4 pt-1.5 border-b border-white/[0.06] bg-[#0A0D12] font-mono text-xs">
        <button
          onClick={() => handleTabSwitch('input')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'input'
              ? 'border-[#2563EB] text-[#60A5FA] bg-white/[0.02]'
              : 'border-transparent text-[#64748B] hover:text-[#8B949E]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>01. Statutory Input</span>
        </button>
        <button
          onClick={() => handleTabSwitch('analysis')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-[#2563EB] text-[#60A5FA] bg-white/[0.02]'
              : 'border-transparent text-[#64748B] hover:text-[#8B949E]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>02. Semantic Extraction</span>
        </button>
        <button
          onClick={() => handleTabSwitch('compiled')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'compiled'
              ? 'border-[#2563EB] text-[#60A5FA] bg-white/[0.02]'
              : 'border-transparent text-[#64748B] hover:text-[#8B949E]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>03. Executable AST Logic</span>
        </button>
        {/* Progress bar on tab switch */}
        <div className="absolute bottom-0 left-0 right-0">
          <div key={tabKey} className="landing-tab-progress-bar h-[2px] bg-[#2563EB]" />
        </div>
      </div>

      {/* Code / Content Area with Line Numbers */}
      <div className="p-5 font-mono text-xs leading-relaxed min-h-[200px] bg-[#0E1218]">
        {activeTab === 'input' && (
          <div className="text-[#8B949E] space-y-2">
            <div className="text-[11px] text-[#64748B]">// Source: EU Official Journal L 2024/1689 (Regulation (EU) 2024/1689)</div>
            <p className="text-[#F1F5F9]">
              <span className="text-[#3B82F6] font-semibold">Article 9(1):</span> A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
            </p>
            <p className="text-[#8B949E] pl-4 border-l border-white/[0.08]">
              (2) The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating...
            </p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#64748B]">// Semantic Parser Output — Tokenized Boundaries &amp; Dependency Graph</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-[6px] bg-[#0A0D12] border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clauses Identified
                </div>
                <div className="text-[#F1F5F9] font-bold text-base">4 Sub-clauses</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Art. 9.1, 9.2, 9.4, 9.7</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#0A0D12] border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[#3B82F6] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Obligations Extracted
                </div>
                <div className="text-[#F1F5F9] font-bold text-base">2 Mandatory Constraints</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Iterative Lifecycle &amp; Testing</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#0A0D12] border border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[#3B82F6] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cross-Graph Mappings
                </div>
                <div className="text-[#F1F5F9] font-bold text-base">ISO 42001 &amp; NIST AI</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Section 6.1 Risk Framing</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compiled' && (
          <div className="text-[#F1F5F9] space-y-1 overflow-x-auto landing-line-numbers">
            <div><span className="text-[#64748B]">// Deterministic AST Rule Tree (Target: OPA Rego / Python Policy Engine)</span></div>
            <div>
              <span className="text-[#3B82F6]">rule</span> <span className="text-[#F1F5F9] font-bold">EU_AI_ACT_ART9_RISK_SYSTEM</span> <span className="text-[#64748B]">&#123;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#64748B]">// Preconditions</span>
            </div>
            <div className="pl-4">
              <span className="text-[#3B82F6]">when:</span> system.classification == <span className="text-emerald-400">&quot;HIGH_RISK_AI&quot;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#3B82F6]">assert:</span>
            </div>
            <div className="pl-8 text-[#8B949E]">
              system.risk_framework.documented == <span className="text-emerald-400">true</span> <span className="text-[#3B82F6]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#8B949E]">
              system.risk_framework.lifecycle_iterative == <span className="text-emerald-400">true</span> <span className="text-[#3B82F6]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#8B949E]">
              system.post_market_monitoring.active == <span className="text-emerald-400">true</span>
            </div>
            <div className="pl-4">
              <span className="text-[#3B82F6]">on_pass:</span> emit_cryptographic_proof(<span className="text-emerald-400">&quot;SHA256:0x89e2...c41&quot;</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#3B82F6]">on_fail:</span> dispatch_remediation_playbook(<span className="text-[#3B82F6]">&quot;PLAYBOOK_AI_ACT_9&quot;</span>)
            </div>
            <div>
              <span className="text-[#64748B]">&#125;</span><span className="landing-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-2.5 bg-[#0A0D12] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
        <div className="flex items-center gap-3">
          <span>TARGET: OPA_REGO_v0.68</span>
          <span>•</span>
          <span>COMPILE_TIME: 14.2ms</span>
        </div>
        <div className="text-[#3B82F6] flex items-center gap-1.5 font-medium">
          <span>TAMPER-PROOF TRACE</span>
          <span className="text-[#8B949E] font-bold">e9f2a74c</span>
        </div>
      </div>
    </div>
  );
}
