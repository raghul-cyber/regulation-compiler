'use client';

import { useState } from 'react';
import { CheckCircle2, Terminal, Cpu, FileCode2, Copy, Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { useLuxuryTilt } from '@/hooks/use-tactile-motion';

export function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'compiled'>('compiled');
  const [copied, setCopied] = useState(false);
  const [tabKey, setTabKey] = useState(0); // Reset progress bar on tab switch
  const { ref: scrollRef, isRevealed } = useScrollReveal({ threshold: 0.1 });
  const { ref: tiltRef, tiltStyle, reflectionPos } = useLuxuryTilt(1.2);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabSwitch = (tab: 'input' | 'analysis' | 'compiled') => {
    setActiveTab(tab);
    setTabKey(prev => prev + 1);
  };

  return (
    <div 
      ref={(el) => {
        (scrollRef as any).current = el;
        (tiltRef as any).current = el;
      }} 
      style={tiltStyle}
      className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full max-w-4xl mx-auto mt-12 rounded-[8px] rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_32px_80px_rgba(9,11,15,0.85)] overflow-hidden text-left transition-all hover:border-[rgba(188,167,123,0.35)] relative group`}
    >
      {/* Subtle Moving Glass Reflection Layer */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0"
        style={{
          background: `radial-gradient(circle 350px at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(188,167,123,0.06), transparent 80%)`,
        }}
      />

      {/* Top Window Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0C0F14]/95 border-b border-[rgba(199,204,210,0.08)] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)]" />
          <span className="ml-3 font-mono text-[11px] text-[#C7CCD2]">
            COMPILER_STUDIO // EU_AI_ACT_ART9.ast
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded-[4px] border border-[#76937F]/35 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76937F]" />
            COMPILED &amp; VERIFIED
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-[#969DA6] hover:text-[#FAF9F5] hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Copy AST definition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#76937F]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Compiler Mode Navigation Tabs */}
      <div className="relative flex items-center gap-1 px-4 pt-1.5 border-b border-[rgba(199,204,210,0.08)] bg-[#0C0F14]/95 font-mono text-xs z-10">
        <button
          onClick={() => handleTabSwitch('input')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'input'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>01. Statutory Input</span>
        </button>
        <button
          onClick={() => handleTabSwitch('analysis')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>02. Semantic Extraction</span>
        </button>
        <button
          onClick={() => handleTabSwitch('compiled')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'compiled'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>03. Executable AST Logic</span>
        </button>
        {/* Progress bar on tab switch */}
        <div className="absolute bottom-0 left-0 right-0">
          <div key={tabKey} className="landing-tab-progress-bar h-[2px] bg-[#BCA77B]" />
        </div>
      </div>

      {/* Code / Content Area with Line Numbers */}
      <div className="p-5 font-mono text-xs leading-relaxed min-h-[200px] bg-[#0C0F14] relative z-10">
        {activeTab === 'input' && (
          <div className="text-[#C7CCD2] space-y-2">
            <div className="text-[11px] text-[#969DA6]">// Source: EU Official Journal L 2024/1689 (Regulation (EU) 2024/1689)</div>
            <p className="text-[#FAF9F5]">
              <span className="text-[#BCA77B] font-semibold">Article 9(1):</span> A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems.
            </p>
            <p className="text-[#969DA6] pl-4 border-l border-[rgba(199,204,210,0.12)]">
              (2) The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating...
            </p>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#969DA6]">// Semantic Parser Output — Tokenized Boundaries &amp; Dependency Graph</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-[6px] bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <div className="flex items-center gap-1.5 text-[#76937F] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Clauses Identified
                </div>
                <div className="text-[#FAF9F5] font-bold text-base">4 Sub-clauses</div>
                <div className="text-[10px] text-[#969DA6] mt-0.5">Art. 9.1, 9.2, 9.4, 9.7</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <div className="flex items-center gap-1.5 text-[#BCA77B] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Obligations Extracted
                </div>
                <div className="text-[#FAF9F5] font-bold text-base">2 Mandatory Constraints</div>
                <div className="text-[10px] text-[#969DA6] mt-0.5">Iterative Lifecycle &amp; Testing</div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <div className="flex items-center gap-1.5 text-[#4D78A0] font-semibold text-[11px] mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cross-Graph Mappings
                </div>
                <div className="text-[#FAF9F5] font-bold text-base">ISO 42001 &amp; NIST AI</div>
                <div className="text-[10px] text-[#969DA6] mt-0.5">Section 6.1 Risk Framing</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compiled' && (
          <div className="text-[#F3F4F2] space-y-1 overflow-x-auto landing-line-numbers">
            <div><span className="text-[#656C74]">// Deterministic AST Rule Tree (Target: OPA Rego / Python Policy Engine)</span></div>
            <div>
              <span className="text-[#BCA77B]">rule</span> <span className="text-[#FAF9F5] font-bold">EU_AI_ACT_ART9_RISK_SYSTEM</span> <span className="text-[#969DA6]">&#123;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#656C74]">// Preconditions</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4D78A0]">when:</span> system.classification == <span className="text-[#76937F]">&quot;HIGH_RISK_AI&quot;</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4D78A0]">assert:</span>
            </div>
            <div className="pl-8 text-[#C7CCD2]">
              system.risk_framework.documented == <span className="text-[#76937F]">true</span> <span className="text-[#BCA77B]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#C7CCD2]">
              system.risk_framework.lifecycle_iterative == <span className="text-[#76937F]">true</span> <span className="text-[#BCA77B]">&amp;&amp;</span>
            </div>
            <div className="pl-8 text-[#C7CCD2]">
              system.post_market_monitoring.active == <span className="text-[#76937F]">true</span>
            </div>
            <div className="pl-4">
              <span className="text-[#4D78A0]">on_pass:</span> emit_cryptographic_proof(<span className="text-[#76937F]">&quot;SHA256:0x89e2...c41&quot;</span>)
            </div>
            <div className="pl-4">
              <span className="text-[#4D78A0]">on_fail:</span> dispatch_remediation_playbook(<span className="text-[#BCA77B]">&quot;PLAYBOOK_AI_ACT_9&quot;</span>)
            </div>
            <div>
              <span className="text-[#969DA6]">&#125;</span><span className="landing-cursor" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-4 py-2.5 bg-[#090B0F] border-t border-[rgba(199,204,210,0.08)] flex items-center justify-between text-[11px] font-mono text-[#969DA6] relative z-10">
        <div className="flex items-center gap-3">
          <span>TARGET: OPA_REGO_v0.68</span>
          <span className="text-[rgba(199,204,210,0.2)]">•</span>
          <span>COMPILE_TIME: 14.2ms</span>
        </div>
        <div className="text-[#BCA77B] flex items-center gap-1.5 font-medium">
          <span>TAMPER-PROOF TRACE</span>
          <span className="text-[#C7CCD2] font-bold">e9f2a74c</span>
        </div>
      </div>
    </div>
  );
}
