'use client';

import { useState } from 'react';
import { 
  Code2, 
  ShieldCheck, 
  FileCheck2, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Users 
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface Persona {
  id: string;
  tabLabel: string;
  tag: string;
  icon: typeof Code2;
  title: string;
  problem: string;
  benefit: string;
  keyFeature: string;
  frameworks: string[];
}

const PERSONAS: Persona[] = [
  {
    id: 'developers',
    tabLabel: 'Developers',
    tag: 'SOFTWARE ENGINEERS & ARCHITECTS',
    icon: Code2,
    title: 'Understand compliance requirements without translating legal text manually.',
    problem: 'No more guessing how abstract regulations translate into HTTP headers, cookies, or frontend code.',
    benefit: 'Get copy-paste configuration snippets and headers for Next.js, Nginx, and cloud providers to pass requirements immediately.',
    keyFeature: 'Drop-In Code Remediation',
    frameworks: ['PCI-DSS 4.0', 'DORA Art. 9', 'RFC 9116 security.txt'],
  },
  {
    id: 'security',
    tabLabel: 'Security Teams',
    tag: 'INFOSEC & APPLICATION SECURITY',
    icon: ShieldCheck,
    title: 'Find website and system security gaps before audits.',
    problem: 'Eliminate surprise audit failures caused by misconfigured headers, legacy SSL/TLS ciphers, or cookie leaks.',
    benefit: 'Continuously verify HTTP response headers, transport encryption, and client defenses against global security baselines.',
    keyFeature: 'Continuous Automated Probing',
    frameworks: ['SOC 2 Type II', 'ISO/IEC 27001', 'NIST SP 800-52'],
  },
  {
    id: 'compliance',
    tabLabel: 'Compliance & Legal',
    tag: 'GRC & LEGAL COUNSEL',
    icon: FileCheck2,
    title: 'Turn regulatory requirements into actionable, verifiable checks.',
    problem: 'Stop managing compliance in messy spreadsheets that become obsolete the moment regulations update.',
    benefit: 'Track evolving legal requirements and ensure engineering teams implement verifiable controls with zero ambiguity.',
    keyFeature: 'Defensible Verification Trail',
    frameworks: ['EU AI Act', 'GDPR Art. 7 & 13', 'HIPAA §164.312'],
  },
  {
    id: 'founders',
    tabLabel: 'Founders & SaaS',
    tag: 'STARTUPS & GROWTH COMPANIES',
    icon: Building2,
    title: 'Pass enterprise vendor reviews and close deals faster.',
    problem: 'Prevent enterprise sales cycles from stalling due to compliance doubts or missing security disclosures.',
    benefit: 'Demonstrate bank-grade security headers, cookie privacy adherence, and statutory compliance in minutes.',
    keyFeature: 'Instant Enterprise Credibility',
    frameworks: ['ePrivacy Directive', 'WCAG 2.1 AA', 'SOC 2 Ready'],
  },
];

export function WhoItsForSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('developers');

  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];
  const Icon = selectedPersona.icon;

  return (
    <section 
      id="solutions" 
      className="w-full max-w-5xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative"
    >
      {/* Background Atmosphere */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[360px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 135, 82, 0.12) 0%, rgba(77, 120, 160, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div 
        ref={titleRef} 
        className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-10`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <Users className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>Who It&apos;s For</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Built for teams that need compliance clarity.
        </h2>

        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed max-w-2xl mx-auto">
          Whether you build software, safeguard infrastructure, or manage risk, RegCompiler eliminates manual legal overhead.
        </p>
      </div>

      {/* Interactive Horizontal Tab Selector */}
      <div 
        ref={contentRef} 
        className={`landing-reveal ${contentRevealed ? 'revealed' : ''} space-y-6`}
      >
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.12)] max-w-2xl mx-auto flex-wrap sm:flex-nowrap">
          {PERSONAS.map((p) => {
            const isSelected = selectedPersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPersonaId(p.id)}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer text-center ${
                  isSelected
                    ? 'bg-[#171C23] text-[#FAF9F5] shadow-[0_4px_16px_rgba(9,11,15,0.6)] border border-[rgba(188,167,123,0.35)]'
                    : 'text-[#969DA6] hover:text-[#C7CCD2] hover:bg-[#12161C]'
                }`}
              >
                {p.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Selected Persona Card */}
        <div className="rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] p-6 sm:p-9 shadow-[0_32px_80px_rgba(9,11,15,0.85)] relative overflow-hidden transition-all text-left">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.12)] flex items-center justify-center text-[#BCA77B]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#BCA77B] font-bold uppercase tracking-wider block">
                    {selectedPersona.tag}
                  </span>
                  <span className="text-xs text-[#969DA6]">
                    Optimized Workflow
                  </span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#FAF9F5] leading-snug">
                {selectedPersona.title}
              </h3>

              <p className="text-sm text-[#C7CCD2] leading-relaxed">
                {selectedPersona.benefit}
              </p>

              <div className="p-3.5 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.08)] text-xs text-[#969DA6] leading-relaxed">
                <b className="text-[#FAF9F5]">The Challenge: </b> {selectedPersona.problem}
              </div>
            </div>

            {/* Right Badge Column */}
            <div className="md:w-64 shrink-0 flex flex-col justify-between space-y-4 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-[rgba(199,204,210,0.08)] md:pl-6">
              <div>
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block mb-1">
                  Practical Outcome
                </span>
                <span className="text-sm font-bold text-[#76937F] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{selectedPersona.keyFeature}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block mb-2">
                  Relevant Frameworks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPersona.frameworks.map((fw) => (
                    <span 
                      key={fw}
                      className="px-2 py-0.5 rounded bg-[#12161C] border border-[rgba(199,204,210,0.08)] text-[11px] font-mono text-[#C7CCD2]"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
