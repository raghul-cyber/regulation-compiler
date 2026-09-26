'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Copy, 
  Check, 
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import type { AuditResult, AuditFinding } from '@/components/compliance/website-compliance-auditor';

const POPULAR_TARGETS = [
  'github.com',
  'stripe.com',
  'vercel.com',
];

export function WebsiteAuditorSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  const [urlInput, setUrlInput] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs' | 'nginx'>('nextjs');

  const handleRunAudit = async (targetToScan?: string) => {
    const rawTarget = (targetToScan || urlInput || '').trim();
    if (!rawTarget) {
      setError('Please enter a website URL or domain name (e.g. stripe.com).');
      return;
    }

    setError(null);
    setIsAuditing(true);

    try {
      const resp = await fetch('/api/audit/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: rawTarget,
          frameworks: ['ALL'],
          scan_depth: 'surface',
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.message || `Audit request failed (${resp.status}). Please verify the domain and try again.`);
      }

      const data: AuditResult = await resp.json();
      setAuditResult(data);
    } catch (err: any) {
      setError(err?.message || 'Could not complete audit. Please check the URL and try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyCode = (snippet: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find priority issue needing attention if results exist
  const priorityIssue: AuditFinding | undefined = auditResult?.findings?.find(
    f => f.status === 'FAIL' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')
  ) || auditResult?.findings?.find(f => f.status === 'FAIL');

  return (
    <section 
      id="website-auditor" 
      className="w-full max-w-5xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative"
    >
      {/* Background Framing Atmosphere */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 135, 82, 0.12) 0%, rgba(77, 120, 160, 0.08) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Section Header */}
      <div 
        ref={titleRef} 
        className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-3xl mx-auto mb-10`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-4 shadow-[0_4px_16px_rgba(9,11,15,0.5)] backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-[#BCA77B]" />
          <span>Live Compliance Auditor</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Check your website before someone else does.
        </h2>

        <p className="mt-4 text-base md:text-lg text-[#C7CCD2] leading-relaxed max-w-2xl mx-auto">
          Enter your website URL and get a clear compliance overview in minutes. Check security headers, cookie directives, and statutory standards automatically.
        </p>
      </div>

      {/* Interactive Audit Input & Results Card */}
      <div 
        ref={contentRef} 
        className={`landing-reveal ${contentRevealed ? 'revealed' : ''} rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] p-6 sm:p-8 shadow-[0_32px_80px_rgba(9,11,15,0.85)] relative overflow-hidden`}
      >
        {/* Interactive URL Input Bar */}
        <div className="space-y-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleRunAudit();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969DA6]" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter any website URL or domain (e.g. yourcompany.com)"
                className="w-full h-12 pl-11 pr-4 rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.14)] text-[#FAF9F5] placeholder-[#656C74] text-sm focus:outline-none focus:border-[#BCA77B] transition-colors"
                disabled={isAuditing}
              />
            </div>

            <button
              type="submit"
              disabled={isAuditing}
              className="w-full sm:w-auto h-12 px-7 rounded-lg rc-btn-sapphire-metal font-medium text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(9,11,15,0.7)] shrink-0 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#BCA77B]" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <span>Run Audit</span>
                  <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
                </>
              )}
            </button>
          </form>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#969DA6]">Try a popular example:</span>
            {POPULAR_TARGETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setUrlInput(t);
                  handleRunAudit(t);
                }}
                disabled={isAuditing}
                className="px-2.5 py-1 rounded bg-[#12161C] border border-[rgba(199,204,210,0.10)] text-[#C7CCD2] hover:text-[#FAF9F5] hover:border-[#BCA77B]/40 transition-colors font-mono text-[11px] cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-[#30232F]/80 border border-[#BCA77B]/40 text-[#FAF9F5] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#BCA77B] shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Loading State */}
        {isAuditing && (
          <div className="mt-8 pt-8 border-t border-[rgba(199,204,210,0.08)] text-center py-10 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#BCA77B] mx-auto" />
            <div className="text-base font-bold text-[#FAF9F5]">
              Auditing {urlInput || 'website'}...
            </div>
            <p className="text-xs text-[#969DA6] max-w-md mx-auto leading-relaxed">
              Inspecting transport encryption, HTTP defense headers, cookie privacy policies, and accessibility standards.
            </p>
          </div>
        )}

        {/* Real Results Display (User-First Outcome Presentation) */}
        {!isAuditing && auditResult && (
          <div className="mt-8 pt-8 border-t border-[rgba(199,204,210,0.08)] space-y-6">
            {/* Top Verdict Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)]">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-2xl font-mono ${
                  auditResult.grade.startsWith('A') 
                    ? 'bg-[#76937F]/20 text-[#76937F] border border-[#76937F]/40' 
                    : auditResult.grade.startsWith('B')
                    ? 'bg-[#4D78A0]/20 text-[#7299B4] border border-[#4D78A0]/40'
                    : 'bg-[#BCA77B]/20 text-[#BCA77B] border border-[#BCA77B]/40'
                }`}>
                  {auditResult.grade}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#FAF9F5]">{auditResult.domain}</span>
                    <span className="font-mono text-xs text-[#76937F] bg-[#76937F]/15 px-2 py-0.5 rounded border border-[#76937F]/30 font-semibold">
                      {auditResult.score}/100 Score
                    </span>
                  </div>
                  <p className="text-xs text-[#969DA6] mt-1">
                    Evaluated against GDPR, SOC 2, HIPAA, WCAG, and DORA standards in {auditResult.execution_time_ms}ms.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard?tab=website_auditor"
                className="rc-btn-sapphire-metal px-4 py-2 rounded-[6px] text-xs font-mono font-medium flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Full Audit in Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#BCA77B]" />
              </Link>
            </div>

            {/* Checkpoint Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Total Checks</span>
                <div className="text-xl font-bold font-mono text-[#FAF9F5] mt-1">
                  {auditResult.summary.total_checkpoints}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Passed</span>
                <div className="text-xl font-bold font-mono text-[#76937F] mt-1">
                  {auditResult.summary.passed}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">High Attention</span>
                <div className="text-xl font-bold font-mono text-[#BCA77B] mt-1">
                  {auditResult.summary.critical + auditResult.summary.high}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                <span className="text-[10px] font-mono text-[#969DA6] uppercase tracking-wider block">Low / Info</span>
                <div className="text-xl font-bold font-mono text-[#969DA6] mt-1">
                  {auditResult.summary.medium + auditResult.summary.low}
                </div>
              </div>
            </div>

            {/* Priority Finding & Actionable Next Step */}
            {priorityIssue && (
              <div className="p-5 rounded-xl bg-[#12161C] border border-[rgba(199,204,210,0.10)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#30232F] text-[#BCA77B] border border-[rgba(188,167,123,0.35)]">
                      {priorityIssue.severity} ATTENTION
                    </span>
                    <h4 className="text-sm font-bold text-[#FAF9F5]">{priorityIssue.title}</h4>
                  </div>
                  <span className="text-xs font-mono text-[#969DA6]">{priorityIssue.framework}</span>
                </div>

                <p className="text-xs text-[#C7CCD2] leading-relaxed">
                  {priorityIssue.evidence || 'This configuration item does not satisfy current statutory baselines.'}
                </p>

                {/* Drop-in Remediation Code If Available */}
                {priorityIssue.remediation && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#969DA6] flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-[#BCA77B]" />
                        <span>Suggested Next Step &bull; Drop-In Code Fix</span>
                      </span>

                      <div className="flex items-center gap-1 bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] p-0.5 rounded-md font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveCodeTab('nextjs')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            activeCodeTab === 'nextjs' ? 'bg-[#171C23] text-[#FAF9F5] font-semibold' : 'text-[#969DA6]'
                          }`}
                        >
                          Next.js
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCodeTab('nginx')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            activeCodeTab === 'nginx' ? 'bg-[#171C23] text-[#FAF9F5] font-semibold' : 'text-[#969DA6]'
                          }`}
                        >
                          Nginx
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] overflow-hidden font-mono text-xs">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[rgba(199,204,210,0.08)] text-[11px] text-[#969DA6]">
                        <span>Configuration Snippet</span>
                        <button
                          type="button"
                          onClick={() => {
                            const code = activeCodeTab === 'nextjs' 
                              ? (priorityIssue.remediation?.nextjs || priorityIssue.remediation?.description || '')
                              : (priorityIssue.remediation?.nginx || priorityIssue.remediation?.description || '');
                            handleCopyCode(code);
                          }}
                          className="flex items-center gap-1 text-[#969DA6] hover:text-[#FAF9F5] transition-colors cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#76937F]" />
                              <span className="text-[#76937F]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 text-[#F3F4F2] overflow-x-auto text-[11px] leading-relaxed">
                        <code>
                          {activeCodeTab === 'nextjs'
                            ? (priorityIssue.remediation.nextjs || priorityIssue.remediation.description)
                            : (priorityIssue.remediation.nginx || priorityIssue.remediation.description)}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit Again Footnote */}
            <div className="flex items-center justify-between pt-2 text-xs text-[#969DA6]">
              <button
                type="button"
                onClick={() => {
                  setAuditResult(null);
                  setUrlInput('');
                }}
                className="hover:text-[#FAF9F5] flex items-center gap-1 cursor-pointer font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Run another scan</span>
              </button>

              <Link
                href="/dashboard?tab=website_auditor"
                className="text-[#BCA77B] hover:text-[#FAF9F5] font-mono flex items-center gap-1"
              >
                <span>Export PDF compliance report</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Pre-Run Explanatory Strip (When user hasn't run yet) */}
        {!isAuditing && !auditResult && (
          <div className="mt-8 pt-6 border-t border-[rgba(199,204,210,0.08)] flex flex-wrap items-center justify-between gap-4 text-xs text-[#969DA6]">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#C7CCD2]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
                <span>SSL/TLS &amp; Transport Security</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#C7CCD2]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
                <span>Cookie Banners &amp; Privacy Policies</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#C7CCD2]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#76937F]" />
                <span>WCAG Accessibility Standards</span>
              </span>
            </div>

            <span className="font-mono text-[#BCA77B]">
              Real-time &bull; No agent installation needed
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
