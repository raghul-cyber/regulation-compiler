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
  Server,
  Filter
} from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { Button } from '@/components/ui/button';
import { getBillingStatusAction } from '@/app/actions';
import { PaywallModal } from '@/components/billing/paywall-modal';

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
  advisory?: {
    issues: AuditFinding[];
    warnings: AuditFinding[];
    informational: AuditFinding[];
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

  // Advisory Interactive State (Matches Advisory Dossier)
  const [advisoryOpen, setAdvisoryOpen] = useState({
    issues: true,
    warnings: true,
    informational: true,
  });
  const [expandedAdvisoryId, setExpandedAdvisoryId] = useState<string | null>(null);
  const [advisoryCodeTab, setAdvisoryCodeTab] = useState<Record<string, 'nginx' | 'nextjs' | 'apache' | 'cloudflare'>>({});

  // Billing Entitlement & 3 Free Uses State
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string | undefined>(undefined);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Authoritative Billing Check on Mount & Client Session Verification
  const refreshBilling = async () => {
    try {
      const res = await getBillingStatusAction();
      if (res.success && res.data) {
        setBillingStatus(res.data);
        const remaining = res.data.free_usage?.remaining ?? 3;
        const reached = !res.data.is_admin && !res.data.paid_access && remaining <= 0;
        if (reached) {
          setIsLimitReached(true);
          setIsPaywallOpen(true);
        } else {
          setIsLimitReached(false);
        }
      } else {
        // Check anonymous cookie client-side
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const anonCookie = cookies.find(c => c.trim().startsWith('reg_anon_audits='));
          if (anonCookie) {
            const count = parseInt(anonCookie.split('=')[1] || '0', 10);
            if (count >= 3) {
              setIsLimitReached(true);
              setIsPaywallOpen(true);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not check billing status:", e);
    }
  };

  useEffect(() => {
    refreshBilling();
  }, []);

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
      const withoutAll = (prev || []).filter(Boolean).filter(f => f !== 'ALL');
      if (withoutAll.includes(fw)) {
        const next = withoutAll.filter(f => f !== fw);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...withoutAll, fw];
      }
    });
  };

  const handleRunAudit = async (targetToScan?: string) => {
    if (isLimitReached) {
      setIsPaywallOpen(true);
      return;
    }

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
      `[PRIVACY-DETECT] Inspecting DOM for ePrivacy cookie consent banners & GDPR Art. 13 notices...`,
      `[WCAG-SCAN] Checking HTML lang, page title, viewport scalability, and image alt attributes...`,
      `[STATUTORY-CHECK] Querying RFC 9116 security.txt, robots.txt, and server fingerprint...`,
      `[SUPPLY-CHAIN] Identifying third-party CDNs and verifying Subresource Integrity (SRI)...`,
      `[SYNTHESIS] Calculating compliance penalty matrix & generating remediation AST...`
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < logMilestones.length) {
        const milestone = logMilestones[step];
        if (milestone) {
          setStreamLogs(prev => [...prev, milestone]);
        }
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
        if (resp.status === 402 || errJson.code === 'PAYMENT_REQUIRED') {
          setIsLimitReached(true);
          setPaywallReason(errJson.message || "Your 3 free uses have been used. Continue auditing websites by upgrading your access.");
          setIsPaywallOpen(true);
          throw new Error(errJson.message || "Your 3 free uses have been consumed. Upgrade to Pro to continue auditing.");
        }
        throw new Error(errJson.message || `Audit request failed with HTTP status ${resp.status}`);
      }

      const result: AuditResult = await resp.json();
      setAuditProgress(100);
      const safeLogs = (result.agent_logs && Array.isArray(result.agent_logs))
        ? result.agent_logs.filter(Boolean).map(l => String(l || ''))
        : logMilestones;
      setStreamLogs(safeLogs);
      setAuditResult(result);
      if (result.findings && result.findings.length > 0) {
        const firstFail = result.findings.find(f => f.status === 'FAIL');
        if (firstFail) setExpandedFinding(firstFail.id);
      }

      // Re-query authoritative billing status to update usage telemetry
      refreshBilling();
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
    if (!auditResult?.findings || !Array.isArray(auditResult.findings)) return [];
    return auditResult.findings.filter(f => {
      if (!f) return false;
      // Severity filter
      if (severityFilter === 'PASSED' && f.status !== 'PASS') return false;
      if (severityFilter !== 'ALL' && severityFilter !== 'PASSED') {
        if (f.status !== 'FAIL' || f.severity !== severityFilter) return false;
      }

      // Framework filter
      if (frameworkFilter !== 'ALL') {
        const fwStr = (f.framework || '').toUpperCase();
        const filterStr = (frameworkFilter || '').toUpperCase();
        if (!fwStr.includes(filterStr)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (f.title || '').toLowerCase().includes(q);
        const matchesEvidence = (f.evidence || '').toLowerCase().includes(q);
        const matchesClause = (f.clause || '').toLowerCase().includes(q);
        const matchesAffected = (f.affected || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesEvidence && !matchesClause && !matchesAffected) return false;
      }

      return true;
    });
  }, [auditResult, severityFilter, frameworkFilter, searchQuery]);

  // Advisory Groupings matching compliance advisory specification
  const advisoryItems = useMemo(() => {
    if (auditResult?.advisory) {
      return auditResult.advisory;
    }
    if (!auditResult?.findings) {
      return { issues: [], warnings: [], informational: [] };
    }
    return {
      issues: auditResult.findings.filter(f => f.status === 'FAIL' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')),
      warnings: auditResult.findings.filter(f => f.status === 'FAIL' && (f.severity === 'MEDIUM' || f.severity === 'LOW')),
      informational: auditResult.findings.filter(f => (f.status === 'FAIL' && f.severity === 'INFO') || f.id === 'SEC-INFO-01' || f.id === 'SEC-OCSP-01'),
    };
  }, [auditResult]);

  const getAdvisorySubtitle = (item: AuditFinding) => {
    if (item.id === 'SEC-CSP-01') return 'Set the Content-Security-Policy response header';
    if (item.id === 'DNS-SPF-01') return 'Publish v=spf1 to authorise legitimate mail senders';
    if (item.id === 'DNS-DMARC-01') return 'Publish v=DMARC1 on _dmarc subdomain to prevent spoofing';
    if (item.id === 'SEC-COOP-01') return 'Consider adding the Cross-Origin-Opener-Policy response header';
    if (item.id === 'SEC-CORP-01') return 'Consider adding the Cross-Origin-Resource-Policy response header';
    if (item.id === 'SEC-COEP-01') return 'Consider adding the Cross-Origin-Embedder-Policy response header';
    if (item.id === 'DISC-SECTXT-01') return 'Add /.well-known/security.txt with disclosure contact info';
    if (item.id === 'SEC-WAF-01') return 'Consider Cloudflare, AWS WAF or similar to filter malicious traffic';
    if (item.id === 'DNS-DKIM-01') return 'Publish a DKIM key so receivers can verify message signatures';
    if (item.id === 'META-SOCIAL-01') return 'Add OpenGraph title, OpenGraph description, OpenGraph image, Twitter card type for cleaner share previews';
    if (item.id === 'SEC-INFO-01') return item.evidence || 'Value: Vercel';
    if (item.id === 'SEC-OCSP-01') return 'Enable OCSP stapling to speed up cert revocation checks';

    if (item.evidence) {
      const firstSentence = item.evidence.split(/\. |\.\n/)[0];
      return firstSentence ? `${firstSentence.replace(/\.$/, '')}` : item.evidence;
    }
    return item.remediation?.description || item.clause;
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-[#718A79] border-[#718A79]/30 bg-[#718A79]/10';
      case 'B+':
      case 'B':
        return 'text-[#607D96] border-[#344D63]/30 bg-[#344D63]/10';
      case 'C':
        return 'text-[#AD956C] border-[#AD956C]/30 bg-[#AD956C]/10';
      default:
        return 'text-[#9A5D62] border-[#9A5D62]/30 bg-[#9A5D62]/10';
    }
  };

  const getSeverityBadge = (sev: string, status: string) => {
    if (status === 'PASS') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#718A79]/15 text-[#718A79] border border-[#718A79]/30 flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3 text-[#718A79]" />
          PASSED
        </span>
      );
    }
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#9A5D62]/15 text-[#9A5D62] border border-[#9A5D62]/30 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-[#9A5D62]" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#A48A5C]/15 text-[#A48A5C] border border-[#A48A5C]/30 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 text-[#A48A5C]" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#AD956C]/15 text-[#AD956C] border border-[#AD956C]/30 flex items-center gap-1 font-mono">
            <ShieldAlert className="w-3 h-3 text-[#AD956C]" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#344D63]/15 text-[#607D96] border border-[#344D63]/30 flex items-center gap-1 font-mono">
            <Shield className="w-3 h-3 text-[#607D96]" />
            LOW
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-6 sm:p-8 rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] shadow-[0_24px_64px_rgba(9,11,15,0.85)] text-[#FAF9F5] relative overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(199,204,210,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-[#171C23] border border-[rgba(199,204,210,0.14)] flex items-center justify-center text-[#BCA77B] shadow-sm">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FAF9F5] tracking-tight">
              Automated Website Compliance Auditor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#76937F]/15 text-[#76937F] border border-[#76937F]/35 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76937F]" />
              LIVE PROBE AGENT • STATUTORY AUDIT
            </span>

            {/* Authoritative Usage Entitlement Pill */}
            {billingStatus && !billingStatus.is_admin && !billingStatus.paid_access && (
              <div className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#12161C] border border-[rgba(199,204,210,0.12)] flex items-center gap-1.5">
                <span className="text-[#969DA6]">Free Uses:</span>
                <span className={isLimitReached ? "text-[#A96770] font-extrabold" : "text-[#BCA77B] font-extrabold"}>
                  {billingStatus.free_usage?.used ?? 0} / {billingStatus.free_usage?.limit ?? 3}
                </span>
                {isLimitReached && (
                  <span className="text-[#BCA77B] font-bold">• LOCKED</span>
                )}
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#969DA6] mt-1.5 max-w-3xl leading-relaxed">
            Enter your website URL. Our autonomous auditor agent inspects live transport security, defense headers, cookie configurations, GDPR consent banners, and WCAG accessibility against statutory regulations.
          </p>
        </div>

        {auditResult && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold bg-[#12161C] border-[rgba(199,204,210,0.12)] text-[#C7CCD2] hover:text-[#FAF9F5] flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#BCA77B]" />
              <span>Export Audit (JSON)</span>
            </Button>
            <Button
              onClick={() => {
                if (isLimitReached) {
                  setIsPaywallOpen(true);
                  return;
                }
                handleRunAudit();
              }}
              disabled={isAuditing}
              size="sm"
              className="text-xs font-semibold rc-btn-sapphire-metal text-[#FAF9F5] flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>Re-Scan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Account Action Locked Alert Banner (when 3 free uses are exhausted) */}
      {isLimitReached && (
        <div className="p-4 sm:p-5 rounded-xl bg-[#30232F] border border-[#BCA77B]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[#F3F4F2] text-sm shadow-xl shadow-black/40 animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#171C23] border border-[#BCA77B]/40 flex items-center justify-center shrink-0 text-[#BCA77B]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#FAF9F5] flex items-center gap-2">
                <span>Account Action Locked • 3/3 Free Uses Consumed</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-[#BCA77B]/20 text-[#BCA77B] border border-[#BCA77B]/30">Upgrade Required</span>
              </div>
              <p className="text-xs text-[#C7CCD2] mt-1 leading-relaxed">
                You have reached your limit of 3 free website compliance audits and regulation compilations. All audit actions are locked until you upgrade to the Pro plan.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsPaywallOpen(true)}
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[#BCA77B] hover:bg-[#D0BE91] text-[#090B0F] font-bold text-xs uppercase tracking-wider shrink-0 shadow-lg shadow-black/40 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Upgrade to Pro ($10.02/mo)</span>
          </Button>
        </div>
      )}

      {/* Target URL Input Control Deck */}
      <div className={`p-4 sm:p-5 rounded-xl bg-[#0C0F14] border transition-all flex flex-col gap-4 ${isLimitReached ? 'border-[#BCA77B]/30 opacity-90' : 'border-[rgba(199,204,210,0.12)]'}`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* URL Input Bar */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-[#656C74] font-mono select-none">
              <Lock className={`w-3.5 h-3.5 ${isLimitReached ? 'text-[#BCA77B]' : 'text-[#656C74]'}`} />
              <span>https://</span>
            </div>
            <input
              type="text"
              value={isLimitReached ? '' : urlInput.replace(/^https?:\/\//i, '')}
              onChange={(e) => {
                const val = e.target.value.trim().replace(/^https?:\/\//i, '');
                setUrlInput(val);
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (pasted) {
                  e.preventDefault();
                  const clean = pasted.trim().replace(/^https?:\/\//i, '');
                  setUrlInput(clean);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAuditing) {
                  if (isLimitReached) {
                    setIsPaywallOpen(true);
                  } else {
                    handleRunAudit();
                  }
                }
              }}
              placeholder={isLimitReached ? "Account Action Locked — 3/3 Free Uses Consumed (Upgrade to Pro)" : "example.com or client-portal.org"}
              disabled={isAuditing || isLimitReached}
              className={`w-full pl-22 pr-4 py-2.5 rounded-lg border text-sm font-mono placeholder:text-[#656C74] focus:outline-none transition-all ${
                isLimitReached 
                  ? 'bg-[#12161C] border-[#BCA77B]/30 text-[#BCA77B]/60 cursor-not-allowed' 
                  : 'bg-[#090B0F] border-[rgba(199,204,210,0.12)] text-[#FAF9F5] focus:border-[#BCA77B]'
              }`}
            />
          </div>

          {/* Depth Selector */}
          <div className={`flex items-center gap-1 bg-[#090B0F] border border-[rgba(199,204,210,0.12)] p-1 rounded-lg text-xs font-mono ${isLimitReached ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              onClick={() => setScanDepth('surface')}
              disabled={isAuditing || isLimitReached}
              className={`px-3 py-1.5 rounded transition-colors ${
                scanDepth === 'surface'
                  ? 'bg-[#171C23] text-[#FAF9F5] font-bold border border-[rgba(199,204,210,0.14)]'
                  : 'text-[#969DA6] hover:text-[#FAF9F5]'
              }`}
            >
              Surface
            </button>
            <button
              onClick={() => setScanDepth('deep')}
              disabled={isAuditing || isLimitReached}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                scanDepth === 'deep'
                  ? 'bg-[#4D78A0] text-[#FAF9F5] font-semibold shadow-sm'
                  : 'text-[#969DA6] hover:text-[#C7CCD2]'
              }`}
            >
              <RCIcon name="system-probe" size={13} className="text-[#C7CCD2]" />
              Deep Full-Stack
            </button>
          </div>

          {/* Trigger Scan Button / Locked Pro Button */}
          {isLimitReached ? (
            <Button
              onClick={() => setIsPaywallOpen(true)}
              className="h-10 px-6 font-bold text-xs uppercase tracking-wider bg-[#BCA77B]/20 hover:bg-[#BCA77B]/30 text-[#BCA77B] border border-[#BCA77B]/40 shadow-lg shadow-black/40 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#BCA77B]" />
              <span>3/3 Used • Upgrade to Pro</span>
            </Button>
          ) : (
            <button
              onClick={() => handleRunAudit()}
              disabled={isAuditing}
              className="h-10 px-6 font-medium text-xs uppercase tracking-wider rc-btn-sapphire-metal rounded-[6px] transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C7CCD2]" />
                  <span>Auditing Your Site...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#BCA77B]" />
                  <span>Audit Your Site</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Presets & Framework Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#211D19] text-xs">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#8D8982] text-[11px] font-mono mr-1">Quick Presets:</span>
            {POPULAR_TARGETS.map(target => (
              <button
                key={target.url}
                onClick={() => {
                  if (isLimitReached) {
                    setIsPaywallOpen(true);
                    return;
                  }
                  setUrlInput(target.url);
                  handleRunAudit(target.url);
                }}
                disabled={isAuditing || isLimitReached}
                className={`px-2.5 py-1 rounded bg-[#151311] hover:bg-[#1B1815] border border-[#211D19] text-[11px] font-mono text-[#C9C4BA] hover:text-[#F7F4EC] transition-colors ${isLimitReached ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {target.label}
              </button>
            ))}
          </div>

          {/* Active Framework Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[#8D8982] text-[11px] font-mono mr-1">Regulatory Enforcements:</span>
            {AVAILABLE_FRAMEWORKS.slice(1, 6).map(fw => (
              <span
                key={fw}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#151311] text-[#607D96] border border-[#344D63]/30"
              >
                {fw}
              </span>
            ))}
            <span className="text-[10px] text-[#625F5A] font-mono">+3 more</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#9A5D62]/15 border border-[#9A5D62]/40 text-[#9A5D62] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#9A5D62]" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Real-time Agent Streaming Terminal (During Scan) */}
      {isAuditing && (
        <div className="rounded-xl border border-[#211D19] bg-[#080706] overflow-hidden shadow-2xl space-y-2 p-4">
          <div className="flex items-center justify-between border-b border-[#211D19] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#AD956C]" />
              <span className="font-mono text-[#AD956C] font-bold">
                AUTONOMOUS AGENT ACTIVE // LIVE NETWORK INSPECTION
              </span>
            </div>
            <span className="font-mono text-[#8D8982]">{auditProgress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-[#151311] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#3F5C74] transition-all duration-300"
              style={{ width: `${auditProgress}%` }}
            />
          </div>

          {/* Terminal stream */}
          <div 
            ref={logsContainerRef}
            className="font-mono text-[11px] text-[#C9C4BA] space-y-1 max-h-40 overflow-y-auto pt-2 leading-relaxed"
          >
            {(streamLogs || []).filter(Boolean).map((rawLog, idx) => {
              const log = typeof rawLog === 'string' ? rawLog : String(rawLog || '');
              const isFail = log.includes('FAIL') || log.includes('MISSING');
              const isPass = log.includes('PASS') || log.includes('FOUND');
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#625F5A] select-none">&gt;</span>
                  <span className={isFail ? 'text-[#A48A5C]' : isPass ? 'text-[#718A79]' : 'text-[#C9C4BA]'}>
                    {log}
                  </span>
                </div>
              );
            })}
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
              <span className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
                COMPLIANCE GRADE
              </span>
              <div className="text-6xl sm:text-7xl font-black tracking-tight my-1">
                {auditResult.grade}
              </div>
              <div className="text-lg font-mono font-bold mt-1">
                {auditResult.score} / 100 Score
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2 max-w-[200px]">
                {auditResult.score >= 85 
                  ? 'Strong baseline posture. Minor optimization required.' 
                  : auditResult.score >= 65 
                  ? 'Moderate exposure. Missing critical statutory controls.' 
                  : 'High legal and cybersecurity risk. Immediate remediation required.'}
              </p>
            </div>

            {/* Sub-Score Categorical Gauges */}
            <div className="md:col-span-8 p-6 rounded-2xl bg-[#100E0D] border border-[#211D19] flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#607D96]" />
                    <h4 className="text-sm font-bold text-[#F7F4EC] uppercase tracking-wider">
                      Regulatory Domain Posture
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-[#8D8982]">
                    Host: <span className="text-[#F7F4EC] font-bold">{auditResult.domain}</span> ({auditResult.latency_ms}ms)
                  </span>
                </div>
                <p className="text-xs text-[#8D8982] mt-0.5">
                  Automated full-stack verification against security headers, data privacy, and WCAG accessibility standards.
                </p>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#151311] border border-[#211D19]">
                  <span className="text-[11px] text-[#8D8982] block font-medium">Security Transport</span>
                  <div className="text-xl font-bold font-mono text-[#F7F4EC] mt-1">
                    {auditResult.sub_scores.security}%
                  </div>
                  <div className="w-full h-1 bg-[#211D19] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#3F5C74] rounded-full" style={{ width: `${auditResult.sub_scores.security}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#151311] border border-[#211D19]">
                  <span className="text-[11px] text-[#8D8982] block font-medium">Privacy &amp; GDPR</span>
                  <div className="text-xl font-bold font-mono text-[#F7F4EC] mt-1">
                    {auditResult.sub_scores.privacy}%
                  </div>
                  <div className="w-full h-1 bg-[#211D19] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#718A79] rounded-full" style={{ width: `${auditResult.sub_scores.privacy}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#151311] border border-[#211D19]">
                  <span className="text-[11px] text-[#8D8982] block font-medium">WCAG Accessibility</span>
                  <div className="text-xl font-bold font-mono text-[#F7F4EC] mt-1">
                    {auditResult.sub_scores.accessibility}%
                  </div>
                  <div className="w-full h-1 bg-[#211D19] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#607D96] rounded-full" style={{ width: `${auditResult.sub_scores.accessibility}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#151311] border border-[#211D19]">
                  <span className="text-[11px] text-[#8D8982] block font-medium">RFC 9116 Disclosures</span>
                  <div className="text-xl font-bold font-mono text-[#F7F4EC] mt-1">
                    {auditResult.sub_scores.disclosures}%
                  </div>
                  <div className="w-full h-1 bg-[#211D19] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#AD956C] rounded-full" style={{ width: `${auditResult.sub_scores.disclosures}%` }} />
                  </div>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono pt-3 border-t border-[#211D19]">
                <span className="text-[#8D8982]">
                  Total Checkpoints: <span className="text-[#F7F4EC] font-bold">{auditResult.summary.total_checkpoints}</span>
                </span>
                <span className="text-[#718A79]">
                  Passed: <span className="font-bold">{auditResult.summary.passed}</span>
                </span>
                <span className="text-[#9A5D62]">
                  Critical: <span className="font-bold">{auditResult.summary.critical}</span>
                </span>
                <span className="text-[#A48A5C]">
                  High: <span className="font-bold">{auditResult.summary.high}</span>
                </span>
                <span className="text-[#AD956C]">
                  Medium: <span className="font-bold">{auditResult.summary.medium}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Advisory Dossier */}
          <div className="rounded-2xl border border-[#211D19] bg-[#100E0D] p-5 sm:p-7 shadow-2xl font-mono text-[#C9C4BA] space-y-6">
            {/* Advisory Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#211D19] pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-[#AD956C] tracking-tight">
                  Advisory
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#AD956C]/10 text-[#AD956C] border border-[#AD956C]/30">
                  {advisoryItems.issues.length + advisoryItems.warnings.length + advisoryItems.informational.length} Advisories Active
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setAdvisoryOpen(prev => {
                    const allOpen = prev.issues && prev.warnings && prev.informational;
                    return { issues: !allOpen, warnings: !allOpen, informational: !allOpen };
                  })}
                  className="px-3 py-1 rounded-lg bg-[#151311] hover:bg-[#1B1815] border border-[#211D19] text-[#8D8982] hover:text-[#F7F4EC] transition-colors text-[11px]"
                >
                  {advisoryOpen.issues && advisoryOpen.warnings && advisoryOpen.informational ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>

            {/* Section 1: Issues (e.g. Issues (3)) */}
            <div className="space-y-3">
              <button
                onClick={() => setAdvisoryOpen(prev => ({ ...prev, issues: !prev.issues }))}
                className="flex items-center gap-2 text-[#A48A5C] font-bold text-sm hover:text-[#C5B38B] transition-colors group select-none"
              >
                <span className={`transform transition-transform text-xs ${advisoryOpen.issues ? 'rotate-0' : '-rotate-90'}`}>
                  ▼
                </span>
                <span className="tracking-wide">Issues ({advisoryItems.issues.length})</span>
              </button>

              {advisoryOpen.issues && (
                <div className="space-y-3.5 pl-3 sm:pl-4 border-l-2 border-[#A48A5C]/25">
                  {advisoryItems.issues.length === 0 ? (
                    <div className="text-xs text-[#625F5A] italic pl-3">
                      ✓ No critical or high statutory issues detected.
                    </div>
                  ) : (
                    advisoryItems.issues.map(item => {
                      const isExpanded = expandedAdvisoryId === item.id;
                      const activeTab = advisoryCodeTab[item.id] || (item.remediation?.nginx ? 'nginx' : item.remediation?.nextjs ? 'nextjs' : item.remediation?.cloudflare ? 'cloudflare' : 'apache');

                      return (
                        <div key={item.id} className="space-y-2 group">
                          <div 
                            onClick={() => setExpandedAdvisoryId(isExpanded ? null : item.id)}
                            className="flex items-start gap-2.5 cursor-pointer select-none"
                          >
                            <span className="text-[#A48A5C] font-black text-sm shrink-0 leading-5">!</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[#F7F4EC] font-bold text-sm tracking-tight group-hover:text-[#AD956C] transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[#8D8982] text-xs font-mono leading-relaxed mt-0.5">
                                {getAdvisorySubtitle(item)}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#625F5A] font-mono shrink-0 group-hover:text-[#C9C4BA]">
                              {isExpanded ? '[-]' : '[+]'}
                            </span>
                          </div>

                          {/* Expandable AST Remediation */}
                          {isExpanded && (
                            <div className="ml-5 p-3.5 rounded-xl bg-[#151311] border border-[#211D19] space-y-3 text-xs">
                              <div className="flex items-center justify-between text-[11px] text-[#8D8982]">
                                <span>Affected: <span className="text-[#C9C4BA]">{item.affected}</span></span>
                                <span className="text-[#625F5A]">[{item.framework}]</span>
                              </div>
                              <div className="p-2.5 rounded bg-[#080706] border border-[#211D19] text-[#C9C4BA] text-[11px]">
                                {item.evidence}
                              </div>
                              {item.remediation && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#718A79] font-bold text-[10px] uppercase">Remediation Directive:</span>
                                    <div className="flex items-center gap-1 font-mono text-[10px]">
                                      {item.remediation.nginx && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'nginx' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'nginx' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Nginx
                                        </button>
                                      )}
                                      {item.remediation.nextjs && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'nextjs' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'nextjs' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Next.js
                                        </button>
                                      )}
                                      {item.remediation.cloudflare && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'cloudflare' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'cloudflare' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Cloudflare / DNS
                                        </button>
                                      )}
                                      {item.remediation.apache && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'apache' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'apache' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Apache
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {item.remediation[activeTab] && (
                                    <div className="relative rounded-lg bg-[#080706] border border-[#211D19] p-2.5 font-mono text-[11px] text-[#718A79] overflow-x-auto">
                                      <pre className="select-all">{item.remediation[activeTab]}</pre>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleCopyCode(item.id, item.remediation?.[activeTab] || ''); }}
                                        className="absolute right-2 top-2 p-1.5 rounded bg-[#151311] border border-[#211D19] text-[#C9C4BA] hover:text-[#F7F4EC]"
                                      >
                                        {copiedCodeId === item.id ? <Check className="w-3 h-3 text-[#718A79]" /> : <Copy className="w-3 h-3" />}
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
              )}
            </div>

            {/* Section 2: Warnings (e.g. Warnings (7)) */}
            <div className="space-y-3">
              <button
                onClick={() => setAdvisoryOpen(prev => ({ ...prev, warnings: !prev.warnings }))}
                className="flex items-center gap-2 text-[#AD956C] font-bold text-sm hover:text-[#C5B38B] transition-colors group select-none"
              >
                <span className={`transform transition-transform text-xs ${advisoryOpen.warnings ? 'rotate-0' : '-rotate-90'}`}>
                  ▼
                </span>
                <span className="tracking-wide">Warnings ({advisoryItems.warnings.length})</span>
              </button>

              {advisoryOpen.warnings && (
                <div className="space-y-3.5 pl-3 sm:pl-4 border-l-2 border-[#AD956C]/25">
                  {advisoryItems.warnings.length === 0 ? (
                    <div className="text-xs text-[#625F5A] italic pl-3">
                      ✓ Zero warnings flagged across tested vectors.
                    </div>
                  ) : (
                    advisoryItems.warnings.map(item => {
                      const isExpanded = expandedAdvisoryId === item.id;
                      const activeTab = advisoryCodeTab[item.id] || (item.remediation?.nginx ? 'nginx' : item.remediation?.nextjs ? 'nextjs' : item.remediation?.cloudflare ? 'cloudflare' : 'apache');

                      return (
                        <div key={item.id} className="space-y-2 group">
                          <div 
                            onClick={() => setExpandedAdvisoryId(isExpanded ? null : item.id)}
                            className="flex items-start gap-2.5 cursor-pointer select-none"
                          >
                            <span className="text-[#AD956C] font-bold text-xs shrink-0 leading-5">▲</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[#F7F4EC] font-bold text-sm tracking-tight group-hover:text-[#AD956C] transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[#8D8982] text-xs font-mono leading-relaxed mt-0.5">
                                {getAdvisorySubtitle(item)}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#625F5A] font-mono shrink-0 group-hover:text-[#C9C4BA]">
                              {isExpanded ? '[-]' : '[+]'}
                            </span>
                          </div>

                          {/* Expandable AST Remediation */}
                          {isExpanded && (
                            <div className="ml-5 p-3.5 rounded-xl bg-[#151311] border border-[#211D19] space-y-3 text-xs">
                              <div className="flex items-center justify-between text-[11px] text-[#8D8982]">
                                <span>Affected: <span className="text-[#C9C4BA]">{item.affected}</span></span>
                                <span className="text-[#625F5A]">[{item.framework}]</span>
                              </div>
                              <div className="p-2.5 rounded bg-[#080706] border border-[#211D19] text-[#C9C4BA] text-[11px]">
                                {item.evidence}
                              </div>
                              {item.remediation && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#718A79] font-bold text-[10px] uppercase">Remediation Directive:</span>
                                    <div className="flex items-center gap-1 font-mono text-[10px]">
                                      {item.remediation.nginx && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'nginx' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'nginx' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Nginx
                                        </button>
                                      )}
                                      {item.remediation.nextjs && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'nextjs' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'nextjs' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Next.js
                                        </button>
                                      )}
                                      {item.remediation.cloudflare && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'cloudflare' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'cloudflare' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Cloudflare / DNS
                                        </button>
                                      )}
                                      {item.remediation.apache && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setAdvisoryCodeTab(prev => ({ ...prev, [item.id]: 'apache' })); }}
                                          className={`px-2 py-0.5 rounded ${activeTab === 'apache' ? 'bg-[#211D19] text-[#F7F4EC] font-bold' : 'text-[#8D8982] hover:text-[#F1EEE7]'}`}
                                        >
                                          Apache
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {item.remediation[activeTab] && (
                                    <div className="relative rounded-lg bg-[#080706] border border-[#211D19] p-2.5 font-mono text-[11px] text-[#718A79] overflow-x-auto">
                                      <pre className="select-all">{item.remediation[activeTab]}</pre>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleCopyCode(item.id, item.remediation?.[activeTab] || ''); }}
                                        className="absolute right-2 top-2 p-1.5 rounded bg-[#151311] border border-[#211D19] text-[#C9C4BA] hover:text-[#F7F4EC]"
                                      >
                                        {copiedCodeId === item.id ? <Check className="w-3 h-3 text-[#718A79]" /> : <Copy className="w-3 h-3" />}
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
              )}
            </div>

            {/* Section 3: Informational (e.g. Informational (2)) Styled in restrained graphite box */}
            <div className="rounded-xl border border-[#211D19] bg-[#080706] p-4 transition-all">
              <button
                onClick={() => setAdvisoryOpen(prev => ({ ...prev, informational: !prev.informational }))}
                className="flex items-center gap-2 text-[#607D96] font-bold text-sm hover:text-[#F7F4EC] transition-colors group select-none w-full text-left cursor-pointer"
              >
                <span className={`transform transition-transform text-xs ${advisoryOpen.informational ? 'rotate-0' : '-rotate-90'}`}>
                  ▼
                </span>
                <span className="tracking-wide">Informational ({advisoryItems.informational.length})</span>
              </button>

              {advisoryOpen.informational && (
                <div className="space-y-3.5 mt-3 pl-2 sm:pl-3">
                  {advisoryItems.informational.length === 0 ? (
                    <div className="text-xs text-[#625F5A] italic pl-3">
                      ✓ No informational disclosures discovered.
                    </div>
                  ) : (
                    advisoryItems.informational.map(item => {
                      const isExpanded = expandedAdvisoryId === item.id;
                      const activeTab = advisoryCodeTab[item.id] || (item.remediation?.nginx ? 'nginx' : item.remediation?.nextjs ? 'nextjs' : item.remediation?.cloudflare ? 'cloudflare' : 'apache');

                      return (
                        <div key={item.id} className="space-y-2 group">
                          <div 
                            onClick={() => setExpandedAdvisoryId(isExpanded ? null : item.id)}
                            className="flex items-start gap-2.5 cursor-pointer select-none"
                          >
                            <span className="text-[#607D96] font-bold text-xs shrink-0 leading-5">ⓘ</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[#F7F4EC] font-bold text-sm tracking-tight group-hover:text-[#AD956C] transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[#8D8982] text-xs font-mono leading-relaxed mt-0.5">
                                {getAdvisorySubtitle(item)}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#625F5A] font-mono shrink-0 group-hover:text-[#C9C4BA]">
                              {isExpanded ? '[-]' : '[+]'}
                            </span>
                          </div>

                          {/* Expandable Details */}
                          {isExpanded && (
                            <div className="ml-5 p-3 rounded-lg bg-[#151311] border border-[#211D19] space-y-2.5 text-xs">
                              <div className="text-[11px] text-[#607D96]">
                                {item.evidence}
                              </div>
                              {item.remediation && (
                                <div className="space-y-1.5 pt-1 border-t border-[#211D19]">
                                  <span className="text-[#718A79] font-bold text-[10px] uppercase block">Suggested Configuration:</span>
                                  <p className="text-[#C9C4BA] text-[11px]">{item.remediation.description}</p>
                                  {item.remediation[activeTab] && (
                                    <div className="relative rounded bg-[#080706] border border-[#211D19] p-2 font-mono text-[10px] text-[#718A79] overflow-x-auto mt-1">
                                      <pre className="select-all">{item.remediation[activeTab]}</pre>
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
              )}
            </div>
          </div>

          {/* Interactive Findings Explorer */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#F7F4EC] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#607D96]" />
                  Detailed Compliance Findings &amp; Statutory AST Remediations
                </h3>
                <p className="text-xs text-[#8D8982] mt-0.5 font-sans">
                  Showing {displayedFindings.length} evaluated checkpoints matching current filters
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#625F5A]" />
                  <input
                    type="text"
                    placeholder="Search findings, clauses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg bg-[#151311] border border-[#211D19] text-xs text-[#F1EEE7] placeholder:text-[#625F5A] focus:outline-none focus:border-[#AD956C] w-44 sm:w-56 transition-colors"
                  />
                </div>

                {/* Severity Filter Pills */}
                <div className="flex items-center rounded-lg bg-[#151311] border border-[#211D19] p-0.5 text-xs">
                  {['ALL', 'CRITICAL', 'HIGH', 'PASSED'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                        severityFilter === sev 
                          ? 'bg-[#211D19] text-[#F7F4EC]' 
                          : 'text-[#8D8982] hover:text-[#C9C4BA]'
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
                <div className="p-8 rounded-xl bg-[#100E0D] border border-[#211D19] text-center text-[#8D8982] text-xs">
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
                              ? 'bg-[#181215] border-[#9A5D62]/40 hover:border-[#9A5D62]/60'
                              : finding.severity === 'HIGH'
                              ? 'bg-[#1A1512] border-[#A48A5C]/40 hover:border-[#A48A5C]/60'
                              : 'bg-[#100E0D] border-[#211D19] hover:border-[#2A241F]')
                          : 'bg-[#100E0D] border-[#718A79]/20 hover:border-[#718A79]/40'
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
                              <h4 className="text-sm font-semibold text-[#F7F4EC] truncate">
                                {finding.title}
                              </h4>
                              <span className="text-[10px] font-mono text-[#8D8982]">
                                [{finding.clause}]
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#8D8982] mt-0.5">
                              <span className="text-[#625F5A] font-mono text-[11px]">{finding.affected}</span>
                              <span>•</span>
                              <span className="text-[#8D8982] text-[11px]">{finding.framework}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#BCA77B] font-medium hidden sm:inline">
                            {isExpanded ? 'Hide Details' : 'Inspect Evidence'}
                          </span>
                          <span className={`transform transition-transform text-[#969DA6] text-xs ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details & Remediation AST */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-[#1D232B] bg-[#0C0F14]/60 space-y-4 text-xs">
                          {/* Evidence Block */}
                          <div className="space-y-1">
                            <span className="text-[#969DA6] font-semibold uppercase text-[10px] tracking-wider block">
                              Cryptographic / Telemetry Evidence:
                            </span>
                            <div className="p-3 rounded-lg bg-[#090B0F] border border-[#1D232B] font-mono text-[11px] text-[#C7CCD2] break-all select-all">
                              {finding.evidence}
                            </div>
                          </div>

                          {/* Remediation Block */}
                          {finding.remediation && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[#76937F] font-semibold uppercase text-[10px] tracking-wider block">
                                  Recommended AST Remediation:
                                </span>
                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                  {finding.remediation.nginx && (
                                    <button
                                      onClick={() => setSelectedCodeTab(prev => ({ ...prev, [finding.id]: 'nginx' }))}
                                      className={`px-2 py-0.5 rounded transition-colors ${currentCodeTab === 'nginx' ? 'bg-[#211D19] text-[#F7F4EC] font-semibold' : 'text-[#8D8982] hover:text-[#C9C4BA]'}`}
                                    >
                                      Nginx
                                    </button>
                                  )}
                                  {finding.remediation.nextjs && (
                                    <button
                                      onClick={() => setSelectedCodeTab(prev => ({ ...prev, [finding.id]: 'nextjs' }))}
                                      className={`px-2 py-0.5 rounded transition-colors ${currentCodeTab === 'nextjs' ? 'bg-[#211D19] text-[#F7F4EC] font-semibold' : 'text-[#8D8982] hover:text-[#C9C4BA]'}`}
                                    >
                                      Next.js / Node
                                    </button>
                                  )}
                                </div>
                              </div>

                              <p className="text-[#C9C4BA] leading-relaxed">
                                {finding.remediation.description}
                              </p>

                              {/* Copyable Code Block */}
                              {((currentCodeTab === 'nginx' && finding.remediation.nginx) ||
                                (currentCodeTab === 'nextjs' && finding.remediation.nextjs)) && (
                                <div className="relative rounded-lg bg-[#080706] border border-[#211D19] p-3 font-mono text-[11px] text-[#718A79] overflow-x-auto">
                                  <pre className="select-all">
                                    {currentCodeTab === 'nginx' ? finding.remediation.nginx : finding.remediation.nextjs}
                                  </pre>
                                  <button
                                    onClick={() => handleCopyCode(
                                      finding.id, 
                                      (currentCodeTab === 'nginx' ? finding.remediation?.nginx : finding.remediation?.nextjs) || ''
                                    )}
                                    className="absolute right-2 top-2 p-1.5 rounded bg-[#151311] border border-[#211D19] text-[#C9C4BA] hover:text-[#F7F4EC] hover:bg-[#1B1815] transition-colors flex items-center gap-1"
                                    title="Copy Code Snippet"
                                  >
                                    {copiedCodeId === finding.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-[#718A79]" />
                                        <span className="text-[10px] text-[#718A79]">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 text-[#8D8982]" />
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

      {/* Authoritative Blocking Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        freeUsesUsed={billingStatus?.free_usage?.used ?? 3}
        freeUsesLimit={billingStatus?.free_usage?.limit ?? 3}
        reason={paywallReason}
        isBlocking={isLimitReached}
      />
    </div>
  );
}
