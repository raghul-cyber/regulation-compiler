'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  ExternalLink,
  Lock,
  Layers,
  FileCode2,
  FileCheck2,
  Eye,
  Zap
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { PaywallModal } from '@/components/billing/paywall-modal';

interface LiveScanPreview {
  target_url: string;
  overall_score: number;
  grade: string;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  categories: Record<string, { score: number; findings_count: number }>;
  execution_time_ms: number;
  timestamp: string;
  findings: Array<{
    id: string;
    rule_id: string;
    framework: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    description: string;
    affected_resource: string;
    remediation_guidance: string;
  }>;
}

const PRESET_URLS = [
  'https://stripe.com',
  'https://github.com',
  'https://cloudflare.com',
  'https://vercel.com',
];

const COMPLIANCE_FRAMEWORKS = [
  { name: 'GDPR / ePrivacy', count: '14 Rules', desc: 'Consent CMPs, Art. 13 Privacy Policy, Cookie flags' },
  { name: 'WCAG 2.1 AA', count: '8 Checks', desc: 'Alt tags, html lang markers, viewport zoomability' },
  { name: 'HIPAA & NIST', count: '12 Audits', desc: 'Transport encryption, HSTS preload, zero leaks' },
  { name: 'SOC 2 & ISO 27001', count: '16 Tests', desc: 'RFC 9116 security.txt, CSP, X-Frame defenses' },
  { name: 'PCI-DSS & DORA', count: '10 Tests', desc: 'Cookie SameSite/HttpOnly, SRI script integrity' },
];

export function WebsiteAuditorSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  const [inputUrl, setInputUrl] = useState('https://stripe.com');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LiveScanPreview | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const handleRunScan = async (targetUrl?: string) => {
    const urlToTest = targetUrl || inputUrl;
    if (!urlToTest.trim()) return;

    setIsScanning(true);
    setScanError(null);
    setTerminalLog([
      `[INIT] Booting autonomous crawler agent...`,
      `[AGENT] Resolving target: ${urlToTest}`,
      `[PROBE] Inspecting HTTP/3, TLS, and response header security flags...`,
      `[CRAWL] Parsing DOM tree for WCAG 2.1 AA markers and RFC 9116 statutory disclosures...`,
    ]);

    try {
      const res = await fetch('/api/audit/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest, depth: 'surface' }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 402 || errJson.code === 'PAYMENT_REQUIRED') {
          setIsPaywallOpen(true);
          setScanError('Complimentary free tier quota (3/3 actions) exhausted. Upgrade to Pro to unlock unlimited audits.');
          setTerminalLog((prev) => [
            ...prev,
            `[PAYWALL] 3 Free Actions quota exhausted. Upgrade required to continue.`
          ]);
          return;
        }
        throw new Error(errJson.error || errJson.message || `HTTP ${res.status}: Failed to execute live website audit`);
      }

      const data: LiveScanPreview = await res.json();
      setScanResult(data);
      setTerminalLog((prev) => [
        ...prev,
        `[AUDIT] Analysis complete in ${data.execution_time_ms}ms. Overall Grade: ${data.grade} (${data.overall_score}%).`,
        `[REPORT] Identified ${data.total_findings} compliance observations across ${Object.keys(data.categories || {}).length} domains.`,
      ]);
    } catch (err: any) {
      setScanError(err.message || 'Audit execution failed. Ensure target domain is publicly accessible.');
      setTerminalLog((prev) => [
        ...prev,
        `[ERROR] Audit halted: ${err.message || 'Network error'}`,
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <section id="website-auditor" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
      {/* Section Eyebrow & Hero Callout */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-4xl mx-auto mb-16`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#17222C]/70 border border-[#5CC8FF]/30 text-[#5CC8FF] text-xs font-mono font-medium uppercase tracking-wider mb-5 shadow-lg shadow-blue-500/10">
          <Sparkles className="w-3.5 h-3.5 text-[#5CC8FF]" />
          <span>New Release: Autonomous Compliance Crawler</span>
          <span className="text-[#62717C]">•</span>
          <span className="text-white font-bold">Zero Mocks</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F2F6F8] tracking-tight leading-tight">
          Concept: Automated Website Compliance Auditor
        </h2>

        <p className="mt-5 text-base md:text-xl text-[#9AA9B5] leading-relaxed max-w-3xl mx-auto">
          A company enters its website URL, and our platform deploys an automated agent that crawls and audits the entire website and its accessible frontend/backend systems.
        </p>

        <p className="mt-3 text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          The goal is to provide an instant, automated compliance audit of a full-stack website — identifying violations, missing requirements, and generating verifiable remediation ASTs.
        </p>
      </div>

      {/* Feature Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        <div className="p-6 rounded-2xl bg-[#080D13]/80 border border-[#17222C] hover:border-[#5CC8FF]/40 transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Agent Crawler</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Deploys an autonomous verification bot that inspects transport protocols, SSL/TLS, live headers, RFC 9116 disclosures, and DOM accessibility anchors in real-time.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous URL Traversal</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#080D13]/80 border border-[#17222C] hover:border-purple-500/40 transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Framework Audit</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Analyzes against GDPR, HIPAA, SOC 2, WCAG 2.1 AA, PCI-DSS, ISO 27001, DORA, and NIST. Identifies violations, missing requirements, risky implementations, and compliance gaps.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>8+ Frameworks Evaluated</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#080D13]/80 border border-[#17222C] hover:border-emerald-500/40 transition-all shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Remediation Report</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Within minutes, generates a detailed compliance report showing each issue, its regulation, severity, affected page, cryptographic evidence, and actionable code fixes.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500 flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nginx / Next.js / Apache Fixes</span>
          </div>
        </div>
      </div>

      {/* Live Zero-Mock Interactive Crawler Card */}
      <div 
        ref={contentRef} 
        className={`landing-reveal ${contentRevealed ? 'revealed' : ''} rounded-3xl bg-gradient-to-b from-[#0B131D] to-[#060A0E] border border-[#1E2C38] p-6 sm:p-8 shadow-2xl relative overflow-hidden`}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h4 className="text-xl font-bold text-white">Live URL Compliance Scanner</h4>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                  Live Network Engine
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Enter your production domain or try a verified public preset to test live crawl & compliance parsing.
              </p>
            </div>

            <Link 
              href="/dashboard?tab=website_auditor" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-all text-xs font-semibold whitespace-nowrap"
            >
              <span>Launch in Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive URL Input */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isScanning) {
                    handleRunScan();
                  }
                }}
                placeholder="https://your-company.com"
                className="w-full bg-[#080D13] border border-zinc-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleRunScan()}
              disabled={isScanning}
              className="px-6 py-3 rounded-xl bg-[#5CC8FF] hover:bg-[#4bb3e6] disabled:opacity-50 text-[#05070A] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer whitespace-nowrap"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Auditing Live...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Run Live Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">Presets:</span>
            {PRESET_URLS.map((url) => (
              <button
                key={url}
                onClick={() => {
                  setInputUrl(url);
                  handleRunScan(url);
                }}
                disabled={isScanning}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 transition-colors font-mono cursor-pointer"
              >
                {url.replace('https://', '')}
              </button>
            ))}
          </div>

          {/* Terminal stream log during / after scan */}
          {terminalLog.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-[#040609] border border-zinc-800 font-mono text-xs text-zinc-300">
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800/60 text-zinc-500 text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Autonomous Agent Stream // Live Telemetry</span>
              </div>
              <div className="space-y-1">
                {(terminalLog || []).filter(Boolean).map((rawLog, idx) => {
                  const log = typeof rawLog === 'string' ? rawLog : String(rawLog || '');
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 select-none">&gt;</span>
                      <span className={log.includes('[ERROR]') ? 'text-red-400' : log.includes('[REPORT]') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                        {log}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scanError && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Live Scan Results Overview Card */}
          {scanResult && (
            <div className="mt-6 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-2xl border shadow-lg ${
                    scanResult.grade.startsWith('A') 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                      : scanResult.grade.startsWith('B')
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-blue-500/10'
                      : scanResult.grade.startsWith('C')
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10'
                      : 'bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10'
                  }`}>
                    {scanResult.grade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{scanResult.target_url}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {scanResult.overall_score}% Compliance
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>Crawl Time: <b className="text-white font-mono">{scanResult.execution_time_ms}ms</b></span>
                      <span>Total Findings: <b className="text-white font-mono">{scanResult.total_findings}</b></span>
                      <span>High Severity: <b className="text-amber-400 font-mono">{scanResult.high_findings}</b></span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard?tab=website_auditor`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
                >
                  <span>Inspect Detailed Report in Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Sample findings highlight */}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  Sample Identified Findings & Regulations:
                </div>
                {scanResult.findings.slice(0, 3).map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          f.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {f.severity}
                        </span>
                        <span className="font-semibold text-zinc-200">{f.title}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">• {f.framework}</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] line-clamp-1">{f.description}</p>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono shrink-0 hidden sm:block">
                      {f.affected_resource}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Framework coverage chips */}
          <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono mr-1">Evaluated Frameworks:</span>
              {COMPLIANCE_FRAMEWORKS.map((fw) => (
                <div key={fw.name} className="px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/60 text-xs text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  <span className="font-medium">{fw.name}</span>
                </div>
              ))}
            </div>

            <span className="text-xs text-zinc-500 font-mono">
              Live crawler • Pure Deterministic AST • 0 Mocks
            </span>
          </div>
        </div>
      </div>

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        freeUsesUsed={3}
        freeUsesLimit={3}
        isBlocking={false}
        reason="Your 3 free tier audits have been used. Upgrade to Pro to unlock unlimited website compliance crawling."
      />
    </section>
  );
}
