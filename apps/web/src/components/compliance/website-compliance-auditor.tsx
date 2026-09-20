'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Globe, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Terminal, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Zap, 
  Lock, 
  Eye, 
  FileText, 
  Layers, 
  Code2, 
  ArrowUpRight, 
  Sparkles,
  Server,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AuditRemediation {
  description: string;
  nginx?: string | null;
  nextjs?: string | null;
  apache?: string | null;
  cloudflare?: string | null;
}

export interface AuditFinding {
  id: string;
  title: string;
  category: 'SECURITY' | 'PRIVACY' | 'ACCESSIBILITY' | 'DISCLOSURE' | 'SUPPLY_CHAIN';
  framework: string;
  clause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'PASS' | 'FAIL';
  affected: string;
  evidence: string;
  remediation: AuditRemediation | null;
}

export interface AuditResult {
  status: string;
  target_url: string;
  final_url: string;
  domain: string;
  scanned_at: string;
  execution_time_ms: number;
  latency_ms?: number;
  http_status: number;
  html_bytes: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
  score: number;
  sub_scores: {
    security: number;
    privacy: number;
    accessibility: number;
    disclosures: number;
    supply_chain: number;
  };
  summary: {
    total_checkpoints: number;
    passed: number;
    failed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: AuditFinding[];
  raw_headers: { key: string; value: string }[];
  agent_logs: string[];
}

const POPULAR_TARGETS = [
  { label: 'GitHub', url: 'github.com' },
  { label: 'Stripe', url: 'stripe.com' },
  { label: 'Cloudflare', url: 'cloudflare.com' },
  { label: 'Vercel', url: 'vercel.com' },
  { label: 'Google', url: 'google.com' },
];

const AVAILABLE_FRAMEWORKS = [
  'ALL',
  'GDPR',
  'HIPAA',
  'SOC 2',
  'WCAG 2.1',
  'PCI-DSS',
  'ISO 27001',
  'DORA',
  'NIST',
];

export function WebsiteComplianceAuditor({ initialUrl = '' }: { initialUrl?: string }) {
  const [urlInput, setUrlInput] = useState(initialUrl || 'github.com');
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['ALL']);
  const [scanDepth, setScanDepth] = useState<'surface' | 'deep'>('deep');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [streamLogs, setStreamLogs] = useState<string[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [selectedCodeTab, setSelectedCodeTab] = useState<Record<string, 'nginx' | 'nextjs' | 'apache'>>({});

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [streamLogs]);

  const toggleFramework = (fw: string) => {
    if (fw === 'ALL') {
      setSelectedFrameworks(['ALL']);
      return;
    }
    setSelectedFrameworks(prev => {
      const withoutAll = prev.filter(f => f !== 'ALL');
      if (withoutAll.includes(fw)) {
        const next = withoutAll.filter(f => f !== fw);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...withoutAll, fw];
      }
    });
  };

  const handleRunAudit = async (targetToScan?: string) => {
    const rawTarget = (targetToScan || urlInput || '').trim();
    if (!rawTarget) {
      setError('Please enter a target domain or website URL.');
      return;
    }

    setError(null);
    setIsAuditing(true);
    setAuditProgress(5);
    setStreamLogs([
      `[AGENT-DEPLOY] Initiating autonomous regulatory audit against: ${rawTarget}`,
      `[PROBE-STAGE-1] Initializing secure network worker and DNS resolution...`
    ]);

    // Simulated streaming milestone interval while real network probe runs
    const logMilestones = [
      `[HANDSHAKE] Negotiating TLS/HTTPS transport and querying cipher suite...`,
      `[SECURITY-HEADERS] Analyzing Strict-Transport-Security, CSP, X-Frame-Options, MIME protection...`,
      `[COOKIE-PROBE] Evaluating Set-Cookie headers for Secure, HttpOnly, and SameSite flags...`,
      `[PRIVACY-DETECT] Crawling DOM for ePrivacy cookie consent banners & GDPR Art. 13 notices...`,
      `[WCAG-SCAN] Checking HTML lang, page title, viewport scalability, and image alt attributes...`,
      `[STATUTORY-CHECK] Querying RFC 9116 security.txt, robots.txt, and server fingerprint...`,
      `[SUPPLY-CHAIN] Identifying third-party CDNs and verifying Subresource Integrity (SRI)...`,
      `[SYNTHESIS] Calculating compliance penalty matrix & generating remediation AST...`
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < logMilestones.length) {
        setStreamLogs(prev => [...prev, logMilestones[step]]);
        setAuditProgress(prev => Math.min(92, prev + 12));
        step++;
      }
    }, 450);

    try {
      const resp = await fetch('/api/audit/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: rawTarget,
          frameworks: selectedFrameworks,
          scan_depth: scanDepth,
        }),
      });

      clearInterval(interval);

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.message || `Audit request failed with HTTP status ${resp.status}`);
      }

      const result: AuditResult = await resp.json();
      setAuditProgress(100);
      setStreamLogs(result.agent_logs || logMilestones);
      setAuditResult(result);
      if (result.findings && result.findings.length > 0) {
        const firstFail = result.findings.find(f => f.status === 'FAIL');
        if (firstFail) setExpandedFinding(firstFail.id);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error('Audit execution failed:', err);
      setError(err?.message || 'Failed to complete website compliance audit. Please verify the URL.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopyCode = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDownloadReport = () => {
    if (!auditResult) return;
    const blob = new Blob([JSON.stringify(auditResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-${auditResult.domain}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered findings list
  const displayedFindings = useMemo(() => {
    if (!auditResult?.findings) return [];
    return auditResult.findings.filter(f => {
      // Severity filter
      if (severityFilter === 'PASSED' && f.status !== 'PASS') return false;
      if (severityFilter !== 'ALL' && severityFilter !== 'PASSED') {
        if (f.status !== 'FAIL' || f.severity !== severityFilter) return false;
      }

      // Framework filter
      if (frameworkFilter !== 'ALL') {
        if (!f.framework.toUpperCase().includes(frameworkFilter.toUpperCase())) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesEvidence = f.evidence.toLowerCase().includes(q);
        const matchesClause = f.clause.toLowerCase().includes(q);
        const matchesAffected = f.affected.toLowerCase().includes(q);
        if (!matchesTitle && !matchesEvidence && !matchesClause && !matchesAffected) return false;
      }

      return true;
    });
  }, [auditResult, severityFilter, frameworkFilter, searchQuery]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/20';
      case 'B+':
      case 'B':
        return 'text-blue-400 border-blue-500/50 bg-blue-500/10 shadow-blue-500/20';
      case 'C':
        return 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-amber-500/20';
      default:
        return 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-rose-500/20';
    }
  };

  const getSeverityBadge = (sev: string, status: string) => {
    if (status === 'PASS') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          PASSED
        </span>
      );
    }
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-yellow-400" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" />
            LOW
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 sm:p-8 rounded-2xl bg-[#080D13]/95 border border-[#17222C] shadow-2xl backdrop-blur-xl text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#17222C] pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Automated Website Compliance Auditor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE PROBE AGENT • ZERO MOCKS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
            Enter your website URL. Our autonomous auditor agent inspects live transport security, defense headers, cookie configurations, GDPR consent banners, and WCAG accessibility against statutory regulations.
          </p>
        </div>

        {auditResult && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Audit (JSON)</span>
            </Button>
            <Button
              onClick={() => handleRunAudit()}
              disabled={isAuditing}
              size="sm"
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>Re-Scan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Target URL Input Control Deck */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#0C131B] border border-[#17222C] flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* URL Input Bar */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-zinc-500 font-mono select-none">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>https://</span>
            </div>
            <input
              type="text"
              value={urlInput.replace(/^https?:\/\//i, '')}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAuditing && handleRunAudit()}
              placeholder="example.com or client-portal.org"
              disabled={isAuditing}
              className="w-full pl-22 pr-4 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-700/80 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Depth Selector */}
          <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 p-1 rounded-lg text-xs font-mono">
            <button
              onClick={() => setScanDepth('surface')}
              disabled={isAuditing}
              className={`px-3 py-1.5 rounded transition-colors ${
                scanDepth === 'surface'
                  ? 'bg-zinc-800 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Surface
            </button>
            <button
              onClick={() => setScanDepth('deep')}
              disabled={isAuditing}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${
                scanDepth === 'deep'
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              Deep Full-Stack
            </button>
          </div>

          {/* Trigger Scan Button */}
          <Button
            onClick={() => handleRunAudit()}
            disabled={isAuditing}
            className="h-10 px-6 font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-900/30 transition-all shrink-0 flex items-center justify-center gap-2"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Crawling Website...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>Deploy Audit Agent</span>
              </>
            )}
          </Button>
        </div>

        {/* Quick Presets & Framework Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#17222C]/80 text-xs">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 text-[11px] font-mono mr-1">Quick Presets:</span>
            {POPULAR_TARGETS.map(target => (
              <button
                key={target.url}
                onClick={() => {
                  setUrlInput(target.url);
                  handleRunAudit(target.url);
                }}
                disabled={isAuditing}
                className="px-2.5 py-1 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
              >
                {target.label}
              </button>
            ))}
          </div>

          {/* Active Framework Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-zinc-500 text-[11px] font-mono mr-1">Regulatory Enforcements:</span>
            {AVAILABLE_FRAMEWORKS.slice(1, 6).map(fw => (
              <span
                key={fw}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-blue-400 border border-blue-500/20"
              >
                {fw}
              </span>
            ))}
            <span className="text-[10px] text-zinc-500 font-mono">+3 more</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Real-time Agent Streaming Terminal (During Scan) */}
      {isAuditing && (
        <div className="rounded-xl border border-blue-500/30 bg-[#05090F] overflow-hidden shadow-2xl space-y-2 p-4">
          <div className="flex items-center justify-between border-b border-[#17222C] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-cyan-300 font-bold">
                AUTONOMOUS AGENT ACTIVE // LIVE NETWORK INSPECTION
              </span>
            </div>
            <span className="font-mono text-zinc-400">{auditProgress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${auditProgress}%` }}
            />
          </div>

          {/* Terminal stream */}
          <div 
            ref={logsContainerRef}
            className="font-mono text-[11px] text-zinc-300 space-y-1 max-h-40 overflow-y-auto pt-2 leading-relaxed"
          >
            {streamLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span className={log.includes('FAIL') || log.includes('MISSING') ? 'text-amber-300' : log.includes('PASS') || log.includes('FOUND') ? 'text-emerald-300' : 'text-zinc-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Results Dashboard */}
      {auditResult && !isAuditing && (
        <div className="space-y-6">
          {/* Executive Score & Telemetry Deck */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Grade Card */}
            <div className={`md:col-span-4 p-6 rounded-2xl border shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden ${getGradeColor(auditResult.grade)}`}>
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold mb-1">
                COMPLIANCE GRADE
              </span>
              <div className="text-6xl sm:text-7xl font-black tracking-tight my-1">
                {auditResult.grade}
              </div>
              <div className="text-lg font-mono font-bold mt-1">
                {auditResult.score} / 100 Score
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 max-w-[200px]">
                {auditResult.score >= 85 
                  ? 'Strong baseline posture. Minor optimization required.' 
                  : auditResult.score >= 65 
                  ? 'Moderate exposure. Missing critical statutory controls.' 
                  : 'High legal and cybersecurity risk. Immediate remediation required.'}
              </p>
            </div>

            {/* Sub-Score Categorical Gauges */}
            <div className="md:col-span-8 p-6 rounded-2xl bg-[#0C131B] border border-[#17222C] flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Regulatory Domain Posture
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    Host: <span className="text-white font-bold">{auditResult.domain}</span> ({auditResult.latency_ms}ms)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Automated full-stack verification against security headers, data privacy, and WCAG accessibility standards.
                </p>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block font-medium">Security Transport</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {auditResult.sub_scores.security}%
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${auditResult.sub_scores.security}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block font-medium">Privacy &amp; GDPR</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {auditResult.sub_scores.privacy}%
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${auditResult.sub_scores.privacy}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block font-medium">WCAG Accessibility</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {auditResult.sub_scores.accessibility}%
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${auditResult.sub_scores.accessibility}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 block font-medium">RFC 9116 Disclosures</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {auditResult.sub_scores.disclosures}%
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${auditResult.sub_scores.disclosures}%` }} />
                  </div>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono pt-3 border-t border-zinc-800/60">
                <span className="text-zinc-400">
                  Total Checkpoints: <span className="text-white font-bold">{auditResult.summary.total_checkpoints}</span>
                </span>
                <span className="text-emerald-400">
                  Passed: <span className="font-bold">{auditResult.summary.passed}</span>
                </span>
                <span className="text-rose-400">
                  Critical: <span className="font-bold">{auditResult.summary.critical}</span>
                </span>
                <span className="text-amber-400">
                  High: <span className="font-bold">{auditResult.summary.high}</span>
                </span>
                <span className="text-yellow-400">
                  Medium: <span className="font-bold">{auditResult.summary.medium}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Findings Explorer */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Detailed Compliance Findings &amp; Statutory AST Remediations
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Showing {displayedFindings.length} evaluated checkpoints matching current filters
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search findings, clauses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
                  />
                </div>

                {/* Severity Filter Pills */}
                <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
                  {['ALL', 'CRITICAL', 'HIGH', 'PASSED'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2.5 py-1 rounded transition-colors text-[11px] font-semibold ${
                        severityFilter === sev 
                          ? 'bg-zinc-800 text-white' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Findings Accordion Deck */}
            <div className="space-y-3">
              {displayedFindings.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/30 border border-zinc-800 text-center text-zinc-500 text-xs">
                  No findings match the active search or severity filter.
                </div>
              ) : (
                displayedFindings.map(finding => {
                  const isExpanded = expandedFinding === finding.id;
                  const currentCodeTab = selectedCodeTab[finding.id] || 'nginx';

                  return (
                    <div
                      key={finding.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        finding.status === 'FAIL'
                          ? (finding.severity === 'CRITICAL'
                              ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                              : finding.severity === 'HIGH'
                              ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                              : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700')
                          : 'bg-emerald-950/[0.04] border-emerald-500/20 hover:border-emerald-500/40'
                      }`}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {getSeverityBadge(finding.severity, finding.status)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-white truncate">
                                {finding.title}
                              </h4>
                              <span className="text-[10px] font-mono text-zinc-500">
                                [{finding.clause}]
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                              <span className="text-zinc-500 font-mono text-[11px]">{finding.affected}</span>
                              <span>•</span>
                              <span className="text-zinc-400 text-[11px]">{finding.framework}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-blue-400 font-medium hidden sm:inline">
                            {isExpanded ? 'Hide Details' : 'Inspect Evidence'}
                          </span>
                          <span className={`transform transition-transform text-zinc-400 text-xs ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details & Remediation AST */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-zinc-800/60 bg-black/30 space-y-4 text-xs">
                          {/* Evidence Block */}
                          <div className="space-y-1">
                            <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider block">
                              Cryptographic / Telemetry Evidence:
                            </span>
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 break-all select-all">
                              {finding.evidence}
                            </div>
                          </div>

                          {/* Remediation Block */}
                          {finding.remediation && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">
                                  Recommended AST Remediation:
                                </span>
                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                  {finding.remediation.nginx && (
                                    <button
                                      onClick={() => setSelectedCodeTab(prev => ({ ...prev, [finding.id]: 'nginx' }))}
                                      className={`px-2 py-0.5 rounded ${currentCodeTab === 'nginx' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                      Nginx
                                    </button>
                                  )}
                                  {finding.remediation.nextjs && (
                                    <button
                                      onClick={() => setSelectedCodeTab(prev => ({ ...prev, [finding.id]: 'nextjs' }))}
                                      className={`px-2 py-0.5 rounded ${currentCodeTab === 'nextjs' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                      Next.js / Node
                                    </button>
                                  )}
                                </div>
                              </div>

                              <p className="text-zinc-300 leading-relaxed">
                                {finding.remediation.description}
                              </p>

                              {/* Copyable Code Block */}
                              {((currentCodeTab === 'nginx' && finding.remediation.nginx) ||
                                (currentCodeTab === 'nextjs' && finding.remediation.nextjs)) && (
                                <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                                  <pre className="select-all">
                                    {currentCodeTab === 'nginx' ? finding.remediation.nginx : finding.remediation.nextjs}
                                  </pre>
                                  <button
                                    onClick={() => handleCopyCode(
                                      finding.id, 
                                      (currentCodeTab === 'nginx' ? finding.remediation?.nginx : finding.remediation?.nextjs) || ''
                                    )}
                                    className="absolute right-2 top-2 p-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                                    title="Copy Code Snippet"
                                  >
                                    {copiedCodeId === finding.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[10px] text-emerald-400">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span className="text-[10px]">Copy Fix</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
