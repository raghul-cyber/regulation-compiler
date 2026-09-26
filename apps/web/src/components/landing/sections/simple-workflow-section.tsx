'use client';

import { useState } from 'react';
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ArrowRight, 
  Copy, 
  Check, 
  FileCode2, 
  ShieldCheck 
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface StepData {
  step: string;
  tag: string;
  title: string;
  description: string;
}

const STEPS: StepData[] = [
  {
    step: '01',
    tag: 'INPUT',
    title: 'Choose what you want to check',
    description: 'Enter your website URL or select the regulations that apply to your industry — from GDPR and HIPAA to SOC 2 and WCAG.',
  },
  {
    step: '02',
    tag: 'RESULT',
    title: 'Run the automated analysis',
    description: 'RegCompiler verifies your live defense headers, cookie policies, transport protocols, and statutory requirements in seconds.',
  },
  {
    step: '03',
    tag: 'ACTION',
    title: 'Understand what needs attention',
    description: 'Review prioritized findings with plain-English summaries and copy-paste remediation snippets ready for immediate deployment.',
  },
];

export function SimpleWorkflowSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section 
      id="how-it-works" 
      className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative"
    >
      {/* Environmental Glow */}
      <div 
        className="absolute top-1/2 right-1/4 w-[600px] h-[360px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(188, 167, 123, 0.10) 0%, rgba(36, 43, 51, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div 
        ref={titleRef} 
        className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-12`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>How It Helps</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          From regulation to resolution in three steps.
        </h2>

        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed max-w-2xl mx-auto">
          No months of consulting or manual policy reviews. See what needs attention and how to fix it in minutes.
        </p>
      </div>

      {/* Interactive 3-Step Container */}
      <div 
        ref={contentRef} 
        className={`landing-reveal ${contentRevealed ? 'revealed' : ''} grid grid-cols-1 lg:grid-cols-12 gap-8 items-center`}
      >
        {/* Left Column: Interactive Step Selector */}
        <div className="lg:col-span-5 space-y-4">
          {STEPS.map((s, idx) => {
            const isActive = activeStep === idx;

            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(idx)}
                onMouseEnter={() => setActiveStep(idx)}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'rc-glass-smoked-elevated border-[rgba(188,167,123,0.45)] bg-[#171C23] shadow-[0_12px_32px_rgba(9,11,15,0.7)]'
                    : 'rc-glass-smoked border-[rgba(199,204,210,0.10)] hover:border-[rgba(188,167,123,0.25)] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#BCA77B]' : 'text-[#969DA6]'
                  }`}>
                    {s.step} &bull; {s.tag}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#BCA77B] shadow-[0_0_8px_rgba(188,167,123,0.6)]" />
                  )}
                </div>

                <h3 className={`text-base font-bold mb-1.5 transition-colors ${
                  isActive ? 'text-[#FAF9F5]' : 'text-[#C7CCD2]'
                }`}>
                  {s.title}
                </h3>

                <p className="text-xs text-[#969DA6] leading-relaxed">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Visual Stage (INPUT -> RESULT -> ACTION) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] p-6 sm:p-8 shadow-[0_32px_80px_rgba(9,11,15,0.85)] min-h-[380px] flex flex-col justify-between relative overflow-hidden text-left">
            {/* Window chrome header */}
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(199,204,210,0.08)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(199,204,210,0.22)]" />
                <span className="ml-3 font-mono text-[11px] text-[#969DA6]">
                  {activeStep === 0 && 'STEP 01 // SELECT_TARGET'}
                  {activeStep === 1 && 'STEP 02 // AUTOMATED_ANALYSIS'}
                  {activeStep === 2 && 'STEP 03 // ACTIONABLE_FIX'}
                </span>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12161C] border border-[rgba(199,204,210,0.10)] text-[#BCA77B]">
                {STEPS[activeStep].tag}
              </span>
            </div>

            {/* Step 1 Visual: Input Selection */}
            {activeStep === 0 && (
              <div className="py-6 space-y-4">
                <div className="p-4 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] space-y-3">
                  <span className="text-[11px] font-mono text-[#969DA6] uppercase block">Target Digital Asset</span>
                  <div className="flex items-center gap-2.5 text-sm text-[#FAF9F5] font-mono">
                    <Globe className="w-4 h-4 text-[#BCA77B]" />
                    <span>https://production.yourcompany.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#969DA6] uppercase block">Selected Statutory Baselines</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['EU GDPR', 'SOC 2 Type II', 'HIPAA Security', 'WCAG 2.1 AA'].map((f) => (
                      <div key={f} className="p-2.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)] text-xs text-[#FAF9F5] flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F] shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#76937F] font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#76937F] animate-pulse" />
                  <span>Ready for instant autonomous scan &bull; Sub-second initialization</span>
                </div>
              </div>
            )}

            {/* Step 2 Visual: Automated Analysis Output */}
            {activeStep === 1 && (
              <div className="py-6 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)]">
                  <div>
                    <span className="text-[10px] font-mono text-[#969DA6] uppercase block">Analysis Progress</span>
                    <span className="text-sm font-bold text-[#FAF9F5]">20 Checkpoints Evaluated in 420ms</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#76937F] bg-[#76937F]/15 px-2.5 py-1 rounded border border-[#76937F]/30">
                    GRADE A &bull; 94/100
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Transport Layer Security (TLS 1.3)', status: 'PASS', color: 'text-[#76937F]' },
                    { label: 'ePrivacy Cookie Consent Platform', status: 'PASS', color: 'text-[#76937F]' },
                    { label: 'HTTP Strict Transport Security (HSTS)', status: 'ATTENTION', color: 'text-[#BCA77B]' },
                    { label: 'WCAG Image Contrast & Navigation Attributes', status: 'PASS', color: 'text-[#76937F]' },
                  ].map((chk) => (
                    <div key={chk.label} className="flex items-center justify-between p-2.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)] text-xs">
                      <span className="text-[#C7CCD2]">{chk.label}</span>
                      <span className={`font-mono font-bold ${chk.color}`}>{chk.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 Visual: Actionable Fix */}
            {activeStep === 2 && (
              <div className="py-6 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#171C23] border border-[rgba(199,204,210,0.12)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#30232F] text-[#BCA77B] border border-[rgba(188,167,123,0.35)]">
                      HIGH ATTENTION
                    </span>
                    <span className="text-xs font-bold text-[#FAF9F5]">Add HSTS Header</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#969DA6]">PCI-DSS &amp; NIST SC-8</span>
                </div>

                <div className="rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgba(199,204,210,0.08)] text-[11px] text-[#969DA6]">
                    <span>Drop-In Fix: next.config.ts / Nginx</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[#969DA6] hover:text-[#FAF9F5] transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-[#76937F]" />
                          <span className="text-[#76937F]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-[#F3F4F2] overflow-x-auto text-[11px] leading-relaxed">
                    <code>
                      {`// Instant Deployment Header Patch\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Bottom step switcher footer */}
            <div className="pt-3 border-t border-[rgba(199,204,210,0.08)] flex items-center justify-between text-xs text-[#969DA6]">
              <span>Step {activeStep + 1} of 3</span>
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) % 3)}
                className="text-[#BCA77B] hover:text-[#FAF9F5] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
