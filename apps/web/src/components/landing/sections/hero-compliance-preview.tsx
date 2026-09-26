'use client';

import { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Layers, 
  Zap, 
  FileCheck2,
  Lock,
  Globe
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { useLuxuryTilt } from '@/hooks/use-tactile-motion';

export function HeroCompliancePreview() {
  const [activeTab, setActiveTab] = useState<'overview' | 'remediation' | 'frameworks'>('overview');
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs' | 'nginx'>('nextjs');
  const [copied, setCopied] = useState(false);
  const { ref: scrollRef, isRevealed } = useScrollReveal({ threshold: 0.1 });
  const { ref: tiltRef, tiltStyle, reflectionPos } = useLuxuryTilt(1.2);

  const handleCopy = () => {
    const code = activeCodeTab === 'nextjs' 
      ? `// next.config.ts\nexport default {\n  headers: async () => [{\n    source: '/:path*',\n    headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }],\n  }],\n};`
      : `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToAuditor = () => {
    const el = document.getElementById('website-audit') || document.getElementById('website-auditor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div 
      ref={(el) => {
        (scrollRef as any).current = el;
        (tiltRef as any).current = el;
      }} 
      style={tiltStyle}
      className={`landing-reveal ${isRevealed ? 'revealed' : ''} w-full max-w-4xl mx-auto mt-6 sm:mt-10 rounded-[10px] rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_32px_80px_rgba(9,11,15,0.85)] overflow-hidden text-left transition-all hover:border-[rgba(188,167,123,0.35)] relative group`}
    >
      {/* Subtle Moving Glass Reflection Layer */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0"
        style={{
          background: `radial-gradient(circle 380px at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(188,167,123,0.06), transparent 80%)`,
        }}
      />

      {/* Top Window Navigation Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-[#0C0F14]/95 border-b border-[rgba(199,204,210,0.08)] relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)] shrink-0" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)] shrink-0" />
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[rgba(199,204,210,0.22)] border border-[rgba(199,204,210,0.10)] shrink-0" />
          <span className="ml-1.5 sm:ml-3 font-mono text-[10px] sm:text-[11px] text-[#C7CCD2] flex items-center gap-1.5 truncate">
            <Globe className="w-3 h-3 text-[#BCA77B] shrink-0" />
            <span className="truncate">cloud-portal.io &bull; Audit Result</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[9px] sm:text-[10px] text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded-[4px] border border-[#76937F]/35 flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76937F]" />
            GRADE A &bull; 94/100
          </span>
        </div>
      </div>

      {/* User-First Interactive Navigation Tabs */}
      <div className="relative flex items-center gap-1 px-2 sm:px-4 pt-1 border-b border-[rgba(199,204,210,0.08)] bg-[#0C0F14]/95 font-mono text-xs z-10 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 px-2.5 sm:px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>01. Compliance Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('remediation')}
          className={`shrink-0 px-2.5 sm:px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs whitespace-nowrap ${
            activeTab === 'remediation'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>02. Actionable Fix</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#BCA77B]" />
        </button>
        <button
          onClick={() => setActiveTab('frameworks')}
          className={`shrink-0 px-2.5 sm:px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs whitespace-nowrap ${
            activeTab === 'frameworks'
              ? 'border-[#BCA77B] text-[#FAF9F5] bg-[#171C23]'
              : 'border-transparent text-[#969DA6] hover:text-[#C7CCD2]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>03. Frameworks Checked</span>
        </button>
      </div>

      {/* Interactive Tab Body */}
      <div className="p-3.5 sm:p-5 md:p-6 bg-[#080A0E]/90 relative z-10 min-h-0 sm:min-h-[220px] flex flex-col justify-between">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Compliance Score</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#76937F] mt-1">94 / 100</div>
                <span className="text-[10px] sm:text-[11px] text-[#C7CCD2] mt-0.5 block">High statutory adherence</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Checkpoints Verified</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#FAF9F5] mt-1">18 / 20</div>
                <span className="text-[10px] sm:text-[11px] text-[#76937F] mt-0.5 block">18 passed &bull; 2 need attention</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Surveillance Status</span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-[#BCA77B] mt-1">Active</div>
                <span className="text-[10px] sm:text-[11px] text-[#C7CCD2] mt-0.5 block">Continuous automated monitoring</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg bg-[#171C23] border border-[rgba(199,204,210,0.10)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#BCA77B]/20 text-[#BCA77B] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FAF9F5]">1 Actionable Priority Item Found</div>
                  <div className="text-[11px] text-[#969DA6]">Missing HTTP Strict Transport Security (HSTS) header. Instant drop-in patch ready.</div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('remediation')}
                className="text-xs font-mono font-medium text-[#BCA77B] hover:text-[#FAF9F5] flex items-center gap-1 cursor-pointer shrink-0 self-end sm:self-auto py-1"
              >
                <span>View Fix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Actionable Fix */}
        {activeTab === 'remediation' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#30232F] text-[#BCA77B] border border-[rgba(188,167,123,0.35)] shrink-0">
                  HIGH ATTENTION
                </span>
                <span className="text-xs font-bold text-[#FAF9F5]">Enforce HSTS (Strict Transport Security)</span>
              </div>

              <div className="flex items-center gap-1 bg-[#12161C] border border-[rgba(199,204,210,0.10)] p-0.5 rounded-md text-xs font-mono self-start sm:self-auto">
                <button
                  onClick={() => setActiveCodeTab('nextjs')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    activeCodeTab === 'nextjs'
                      ? 'bg-[#171C23] text-[#FAF9F5] font-semibold border border-[rgba(199,204,210,0.14)]'
                      : 'text-[#969DA6] hover:text-[#C7CCD2]'
                  }`}
                >
                  Next.js
                </button>
                <button
                  onClick={() => setActiveCodeTab('nginx')}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    activeCodeTab === 'nginx'
                      ? 'bg-[#171C23] text-[#FAF9F5] font-semibold border border-[rgba(199,204,210,0.14)]'
                      : 'text-[#969DA6] hover:text-[#C7CCD2]'
                  }`}
                >
                  Nginx
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.10)] overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0C0F14] border-b border-[rgba(199,204,210,0.08)] text-[11px] text-[#969DA6]">
                <span className="truncate pr-2">Drop-in Fix: {activeCodeTab === 'nextjs' ? 'next.config.ts' : '/etc/nginx/conf.d/security.conf'}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[#969DA6] hover:text-[#FAF9F5] transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#76937F]" />
                      <span className="text-[#76937F]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[#F3F4F2] overflow-x-auto leading-relaxed text-[11px] bg-[#0C0F14] max-w-full">
                <code>
                  {activeCodeTab === 'nextjs'
                    ? `// next.config.ts\nexport default {\n  headers: async () => [{\n    source: '/:path*',\n    headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }],\n  }],\n};`
                    : `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`}
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Frameworks Checked */}
        {activeTab === 'frameworks' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              { name: 'GDPR / ePrivacy', status: 'Compliant', icon: ShieldCheck, color: 'text-[#76937F]' },
              { name: 'SOC 2 & ISO 27001', status: 'Compliant', icon: ShieldCheck, color: 'text-[#76937F]' },
              { name: 'WCAG 2.1 AA', status: 'Compliant', icon: ShieldCheck, color: 'text-[#76937F]' },
              { name: 'DORA & PCI-DSS', status: '1 Item Attention', icon: AlertCircle, color: 'text-[#BCA77B]' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.name} className="p-3 sm:p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <Icon className={`w-4 h-4 ${f.color} mb-1.5 sm:mb-2`} />
                  <div className="text-xs font-bold text-[#FAF9F5] leading-snug">{f.name}</div>
                  <div className={`text-[10px] sm:text-[11px] font-mono mt-1 ${f.color}`}>{f.status}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA Footnote */}
        <div className="mt-3.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[rgba(199,204,210,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-xs">
          <span className="text-[#969DA6]">Want to see how your own website scores?</span>
          <button
            onClick={scrollToAuditor}
            className="text-[#BCA77B] hover:text-[#FAF9F5] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Run Free Live Audit Below</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
