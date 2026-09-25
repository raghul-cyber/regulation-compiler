'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  ExternalLink,
  Layers,
  FileCode2,
  FileCheck2,
  Zap,
  Copy,
  Check,
  Code2,
  ShieldAlert,
  Cpu,
  Server,
  Lock
} from 'lucide-react';
import { RCIcon } from '@/components/ui/rc-icon';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface RemediationSample {
  id: string;
  rule_id: string;
  title: string;
  category: 'SECURITY' | 'PRIVACY' | 'ACCESSIBILITY' | 'DISCLOSURE';
  framework: string;
  clause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affected: string;
  evidence: string;
  description: string;
  code: {
    nginx: string;
    nextjs: string;
    apache: string;
    cloudflare: string;
  };
}

const SAMPLE_FINDINGS: RemediationSample[] = [
  {
    id: 'SEC-HSTS-01',
    rule_id: 'RULE_HSTS_PRELOAD_ENFORCE',
    title: 'Missing HTTP Strict Transport Security (HSTS)',
    category: 'SECURITY',
    framework: 'PCI-DSS 4.0 / NIST SC-8 / ISO 27001',
    clause: 'PCI-DSS v4.0 Req 4.1.2 & NIST SP 800-52 Rev 2',
    severity: 'HIGH',
    affected: 'HTTP Response Headers',
    evidence: 'No Strict-Transport-Security header returned on port 443. Downstream clients susceptible to SSL-stripping MitM attacks.',
    description: 'Enforce HSTS with a minimum max-age of 1 year (31536000 seconds) including subdomains and HSTS preload directive.',
    code: {
      nginx: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
      nextjs: `// next.config.ts\nexport default {\n  headers: async () => [{\n    source: '/:path*',\n    headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }],\n  }],\n};`,
      apache: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
      cloudflare: '# Cloudflare Transform Rule / SSL/TLS Settings\n# Enable "HTTP Strict Transport Security (HSTS)" -> Max-Age: 12 months, Include Subdomains, Preload',
    }
  },
  {
    id: 'SEC-CSP-01',
    rule_id: 'RULE_CSP_STRICT_DIRECTIVES',
    title: 'Content Security Policy (CSP) Lacks Cryptographic Nonces',
    category: 'SECURITY',
    framework: 'DORA Regulation / OWASP Top 10 / NIST SI-10',
    clause: 'EU DORA Regulation 2022/2554 Art. 9 & OWASP A03:2021',
    severity: 'CRITICAL',
    affected: 'HTTP Response Headers',
    evidence: "CSP includes unsafe-inline in script-src. Attackers can execute reflected and stored Cross-Site Scripting (XSS).",
    description: 'Replace unsafe-inline with dynamic SHA-256 script nonces and enforce strict script, style, and frame isolation.',
    code: {
      nginx: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'nonce-$request_id'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self';\" always;",
      nextjs: `// middleware.ts\nconst nonce = Buffer.from(crypto.randomUUID()).toString('base64');\nconst csp = \`default-src 'self'; script-src 'self' 'nonce-\${nonce}'; object-src 'none';\`;\nresponse.headers.set('Content-Security-Policy', csp);`,
      apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\"",
      cloudflare: '# Cloudflare Rules -> Response Header Modification\nContent-Security-Policy = "default-src \'self\'; script-src \'self\'; object-src \'none\'; frame-ancestors \'none\';"',
    }
  },
  {
    id: 'PRIV-COOKIE-01',
    rule_id: 'RULE_EPRIVACY_CONSENT_CMP',
    title: 'Cookie Consent Platform Missing Prior to Tracking Storage',
    category: 'PRIVACY',
    framework: 'ePrivacy Directive / GDPR Art. 7',
    clause: 'Directive 2002/58/EC (ePrivacy) Art. 5(3) & GDPR Art. 7',
    severity: 'HIGH',
    affected: 'Client Frontend DOM',
    evidence: 'Analytics and marketing cookies initialized before verifiable user opt-in consent recorded in client state.',
    description: 'Implement a prior-consent cookie consent banner that halts non-essential scripts until affirmative affirmative opt-in.',
    code: {
      nginx: '# Mitigate third-party cookie leakage on edge\nproxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";',
      nextjs: `// components/privacy/cookie-consent.tsx\nexport function CookieConsent() {\n  return <ConsentBanner requiredPurposes={['essential', 'analytics']} onConsent={(consented) => initializeTelemetry(consented)} />;\n}`,
      apache: 'Header edit Set-Cookie ^(.*)$ "$1; Secure; HttpOnly; SameSite=Lax"',
      cloudflare: '# Cloudflare Zaraz / Cookie Management Platform\n# Enforce "Consent Management" -> Block marketing triggers until user opt-in affirmative action.',
    }
  },
  {
    id: 'DISC-SECTXT-01',
    rule_id: 'RULE_RFC_9116_SECURITY_TXT',
    title: 'Missing RFC 9116 Statutory Disclosure (security.txt)',
    category: 'DISCLOSURE',
    framework: 'RFC 9116 / ISO 29147 / CISA BOD 20-01',
    clause: 'IETF RFC 9116 & ISO/IEC 29147 Vulnerability Disclosure',
    severity: 'MEDIUM',
    affected: '/.well-known/security.txt',
    evidence: 'HTTP 404 returned for /.well-known/security.txt. Security researchers lack designated PGP encryption & reporting channels.',
    description: 'Publish a standardized RFC 9116 vulnerability disclosure file declaring verified Contact, Canonical, and Expires timestamps.',
    code: {
      nginx: 'location = /.well-known/security.txt {\n  default_type text/plain;\n  return 200 "Contact: mailto:security@yourcompany.com\\nExpires: 2027-01-01T00:00:00.000Z\\nPreferred-Languages: en\\nCanonical: https://yourcompany.com/.well-known/security.txt\\n";\n}',
      nextjs: `// public/.well-known/security.txt\nContact: mailto:security@yourcompany.com\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: en\nCanonical: https://yourcompany.com/.well-known/security.txt`,
      apache: '<Location "/.well-known/security.txt">\n  ForceType text/plain\n  Header set Access-Control-Allow-Origin "*"\n</Location>',
      cloudflare: '# Cloudflare Workers / Snippet\nexport default {\n  fetch(request) {\n    return new Response("Contact: mailto:security@domain.com\\nExpires: 2027-12-31T23:59:59Z", { headers: { "content-type": "text/plain" } });\n  }\n}',
    }
  }
];

const COMPLIANCE_FRAMEWORKS = [
  { name: 'GDPR / ePrivacy', count: '14 Rules', desc: 'Consent CMPs, Art. 13 Privacy Notice, Secure cookie flags' },
  { name: 'WCAG 2.1 AA', count: '8 Checks', desc: 'Alt tags, html lang markers, viewport user scalability' },
  { name: 'HIPAA & NIST', count: '12 Audits', desc: 'Transport encryption, HSTS preload, zero cleartext transmission' },
  { name: 'SOC 2 & ISO 27001', count: '16 Tests', desc: 'RFC 9116 security.txt, CSP nonces, X-Frame defenses' },
  { name: 'PCI-DSS 4.0 & DORA', count: '10 Tests', desc: 'Cookie SameSite/HttpOnly, SRI external script integrity' },
];

export function WebsiteAuditorSection() {
  const { ref: titleRef, isRevealed: titleRevealed } = useScrollReveal();
  const { ref: contentRef, isRevealed: contentRevealed } = useScrollReveal({ threshold: 0.1 });

  const [activeFindingId, setActiveFindingId] = useState<string>(SAMPLE_FINDINGS[0].id);
  const [activeCodeTab, setActiveCodeTab] = useState<'nginx' | 'nextjs' | 'apache' | 'cloudflare'>('nextjs');
  const [copied, setCopied] = useState(false);

  const selectedFinding = SAMPLE_FINDINGS.find(f => f.id === activeFindingId) || SAMPLE_FINDINGS[0];

  const handleCopyCode = () => {
    const snippet = selectedFinding.code[activeCodeTab];
    if (snippet && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="website-auditor" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24 relative">
      {/* Environmental Lighting for Audit Room (Sapphire & Titanium Depth) */}
      <div 
        className="absolute -top-12 -right-8 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(77, 120, 160, 0.22) 0%, rgba(48, 35, 47, 0.12) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      {/* Section Eyebrow & Hero Callout */}
      <div ref={titleRef} className={`landing-reveal ${titleRevealed ? 'revealed' : ''} text-center max-w-4xl mx-auto mb-14`}>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171C23] border border-[rgba(199,204,210,0.14)] text-[#BCA77B] text-xs font-mono font-medium uppercase tracking-wider mb-5 shadow-[0_4px_16px_rgba(9,11,15,0.6)] backdrop-blur-md">
          <RCIcon name="system-probe" size={14} className="text-[#BCA77B]" />
          <span>Autonomous Regulatory Auditor</span>
          <span className="text-[#656C74]">•</span>
          <span className="text-[#FAF9F5] font-bold">Live Verification</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FAF9F5] tracking-tight leading-tight">
          Automated Website Compliance Auditor
        </h2>

        <p className="mt-5 text-base md:text-xl text-[#C7CCD2] leading-relaxed max-w-3xl mx-auto">
          Our autonomous auditor probes live transport protocols, defense headers, ePrivacy cookie banners, and WCAG accessibility against statutory regulations — compiling deterministic AST code fixes in real time.
        </p>
      </div>

      {/* Feature Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        <div className="p-6 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] hover:border-[rgba(188,167,123,0.35)] transition-all flex flex-col justify-between shadow-[0_8px_28px_rgba(9,11,15,0.6)]">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#4D78A0]/25 border border-[#4D78A0]/45 flex items-center justify-center text-[#7299B4] mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF9F5] mb-2">Live Autonomous Probe</h3>
            <p className="text-sm text-[#C7CCD2] leading-relaxed">
              Dispatches a headless agent that inspects transport TLS ciphers, response headers, Subresource Integrity (SRI), and rendered DOM trees with sub-500ms latency.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(199,204,210,0.08)] text-xs font-mono text-[#969DA6] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#BCA77B]" />
            <span>Multi-Hop Traversal &amp; Loop Guard</span>
          </div>
        </div>

        <div className="p-6 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] hover:border-[rgba(188,167,123,0.35)] transition-all flex flex-col justify-between shadow-[0_8px_28px_rgba(9,11,15,0.6)]">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#BCA77B]/20 border border-[#BCA77B]/45 flex items-center justify-center text-[#BCA77B] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF9F5] mb-2">8+ Statutory Frameworks</h3>
            <p className="text-sm text-[#C7CCD2] leading-relaxed">
              Simultaneously audits against GDPR, HIPAA, SOC 2, WCAG 2.1 AA, PCI-DSS 4.0, ISO 27001, DORA, and RFC 9116 — identifying non-compliant attributes and legal gaps.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(199,204,210,0.08)] text-xs font-mono text-[#969DA6] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#BCA77B]" />
            <span>Cross-Regulation Compliance Matrix</span>
          </div>
        </div>

        <div className="p-6 rounded-xl rc-glass-smoked border border-[rgba(199,204,210,0.12)] hover:border-[rgba(188,167,123,0.35)] transition-all flex flex-col justify-between shadow-[0_8px_28px_rgba(9,11,15,0.6)]">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#76937F]/22 border border-[#76937F]/45 flex items-center justify-center text-[#76937F] mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF9F5] mb-2">Instant AST Code Remediations</h3>
            <p className="text-sm text-[#C7CCD2] leading-relaxed">
              Every flagged violation includes an automated remediation snippet ready to copy into Next.js, Nginx, Apache, or Cloudflare edge transform rules.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(199,204,210,0.08)] text-xs font-mono text-[#969DA6] flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-[#76937F]" />
            <span>Syntactic Drop-In Patches</span>
          </div>
        </div>
      </div>

      {/* Enterprise Compliance Inspection Showcase Container */}
      <div 
        ref={contentRef} 
        className={`landing-reveal ${contentRevealed ? 'revealed' : ''} rounded-2xl rc-glass-smoked-elevated border border-[rgba(199,204,210,0.14)] p-6 sm:p-8 shadow-[0_32px_80px_rgba(9,11,15,0.85)] relative overflow-hidden`}
      >
        <div className="relative z-10 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(199,204,210,0.08)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#76937F]"></span>
                </span>
                <h4 className="text-xl font-bold text-[#FAF9F5]">Live Regulatory Inspection Dossier</h4>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#BCA77B]/15 text-[#BCA77B] border border-[#BCA77B]/30 rounded">
                  Statutory Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#C7CCD2] mt-1">
                Sample production inspection report for <code className="text-[#BCA77B] font-mono">production.cloud-portal.io</code> evaluated against statutory mandates.
              </p>
            </div>

            <Link 
              href="/dashboard?tab=website_auditor" 
              className="rc-btn-sapphire-metal inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] font-medium text-xs uppercase tracking-wider whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>Launch Auditor in Studio</span>
              <ArrowRight className="w-4 h-4 text-[#BCA77B]" />
            </Link>
          </div>

          {/* Telemetry Summary & Score Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Grade Card */}
            <div className="lg:col-span-4 p-6 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] flex flex-col items-center justify-center text-center relative overflow-hidden">
              <span className="text-xs font-mono uppercase tracking-widest text-[#969DA6] font-bold mb-1">
                COMPLIANCE VERDICT
              </span>
              <div className="text-6xl sm:text-7xl font-black text-[#76937F] tracking-tight my-1">
                A
              </div>
              <div className="text-lg font-mono font-bold text-[#FAF9F5] mt-1">
                94 / 100 Overall Score
              </div>
              <p className="text-xs text-[#C7CCD2] mt-2 max-w-[220px]">
                High statutory compliance posture. 18 Passed • 2 Remediations Required.
              </p>
              <div className="mt-4 pt-3 border-t border-[rgba(199,204,210,0.08)] w-full flex items-center justify-around text-[11px] font-mono text-[#969DA6]">
                <span>Latency: <b className="text-[#FAF9F5]">420ms</b></span>
                <span>•</span>
                <span>Checkpoints: <b className="text-[#FAF9F5]">20 Active</b></span>
              </div>
            </div>

            {/* Categorical Domain Gauges */}
            <div className="lg:col-span-8 p-6 rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <RCIcon name="system-probe" size={16} className="text-[#BCA77B]" />
                  <span className="text-xs font-mono font-bold text-[#FAF9F5] uppercase tracking-wider">
                    Categorical Regulatory Performance
                  </span>
                </div>
                <span className="text-xs font-mono text-[#969DA6]">Autonomous Probe v2.4</span>
              </div>

              {/* Progress Gauges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>Transport Security</span>
                    <span className="text-[#76937F] font-bold font-mono">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#76937F] rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">TLS 1.3 / Strict HTTPS</span>
                </div>

                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>Defense Headers</span>
                    <span className="text-[#6689A5] font-bold font-mono">95%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#4D78A0] rounded-full" style={{ width: '95%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">CSP / X-Frame DENY</span>
                </div>

                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>ePrivacy &amp; Cookies</span>
                    <span className="text-[#B39863] font-bold font-mono">85%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#B39863] rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">SameSite / HttpOnly</span>
                </div>

                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>WCAG 2.1 AA</span>
                    <span className="text-[#6689A5] font-bold font-mono">100%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#4D78A0] rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">Lang / Alt / Viewport</span>
                </div>

                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>Disclosures (RFC 9116)</span>
                    <span className="text-[#BCA77B] font-bold font-mono">90%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#BCA77B] rounded-full" style={{ width: '90%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">security.txt / robots.txt</span>
                </div>

                <div className="p-3 rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.08)]">
                  <div className="flex items-center justify-between text-xs text-[#C7CCD2]">
                    <span>Supply Chain (SRI)</span>
                    <span className="text-[#969DA6] font-bold font-mono">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#090B0F] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#242B33] rounded-full" style={{ width: '92%' }} />
                  </div>
                  <span className="text-[10px] text-[#969DA6] font-mono mt-1 block">Cryptographic Checksums</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Findings & AST Remediation Panel */}
          <div className="rounded-xl bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(199,204,210,0.08)]">
              <div>
                <h5 className="text-sm font-bold text-[#FAF9F5] flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#BCA77B]" />
                  <span>Interactive Finding Inspector &amp; AST Remediation Code Generator</span>
                </h5>
                <p className="text-xs text-[#969DA6] mt-0.5">
                  Select an audit observation to inspect statutory citation, cryptographic evidence, and drop-in configuration patches.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {SAMPLE_FINDINGS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFindingId(f.id)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all cursor-pointer ${
                      activeFindingId === f.id
                        ? 'rc-btn-sapphire-metal font-bold shadow-[0_4px_16px_rgba(9,11,15,0.7)]'
                        : 'rc-btn-graphite-metal text-[#969DA6] hover:text-[#FAF9F5]'
                    }`}
                  >
                    {f.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Finding Detail Box */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#171C23] border border-[rgba(199,204,210,0.12)] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedFinding.severity === 'CRITICAL' ? 'bg-[#4A2830] text-[#BCA77B] border border-[#4A2830]' :
                      selectedFinding.severity === 'HIGH' ? 'bg-[#30232F] text-[#BCA77B] border border-[rgba(188,167,123,0.35)]' :
                      'bg-[#4D78A0]/25 text-[#7299B4] border border-[#4D78A0]/40'
                    }`}>
                      {selectedFinding.severity} FAIL
                    </span>
                    <h6 className="text-sm font-bold text-[#FAF9F5]">{selectedFinding.title}</h6>
                  </div>
                  <span className="text-xs font-mono text-[#969DA6]">{selectedFinding.framework}</span>
                </div>

                <div className="text-xs text-[#969DA6] font-mono pt-1">
                  <b>Statutory Clause:</b> <span className="text-[#C7CCD2]">{selectedFinding.clause}</span>
                </div>
                <div className="text-xs text-[#969DA6]">
                  <b>Evidence:</b> <span className="text-[#C7CCD2] font-mono text-[11px]">{selectedFinding.evidence}</span>
                </div>
              </div>

              {/* Code Remediation Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#969DA6] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#BCA77B]" />
                    <span>Instant Remediation Patch</span>
                  </span>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-[#12161C] border border-[rgba(199,204,210,0.10)] p-0.5 rounded-lg text-xs font-mono">
                    {(['nextjs', 'nginx', 'apache', 'cloudflare'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-2.5 py-1 rounded capitalize transition-all cursor-pointer ${
                          activeCodeTab === tab
                            ? 'bg-[#171C23] text-[#FAF9F5] font-medium border border-[rgba(199,204,210,0.14)]'
                            : 'text-[#969DA6] hover:text-[#C7CCD2]'
                        }`}
                      >
                        {tab === 'nextjs' ? 'Next.js' : tab === 'cloudflare' ? 'Cloudflare WAF' : tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Box */}
                <div className="relative rounded-lg bg-[#12161C] border border-[rgba(199,204,210,0.10)] overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0C0F14] border-b border-[rgba(199,204,210,0.08)] text-[11px] text-[#969DA6]">
                    <span>Target Deployment: {activeCodeTab.toUpperCase()}</span>
                    <button
                      onClick={handleCopyCode}
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
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[#F3F4F2] overflow-x-auto leading-relaxed bg-[#0C0F14]">
                    <code>{selectedFinding.code[activeCodeTab]}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Frameworks Badge Grid */}
          <div className="pt-4 border-t border-[rgba(199,204,210,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#969DA6] font-mono mr-1">Evaluated Frameworks:</span>
              {COMPLIANCE_FRAMEWORKS.map(fw => (
                <div
                  key={fw.name}
                  className="px-2.5 py-1 rounded-md bg-[#0C0F14] border border-[rgba(199,204,210,0.10)] text-[#C7CCD2] text-xs font-mono flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#76937F]" />
                  <span>{fw.name}</span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard?tab=website_auditor"
              className="text-xs text-[#BCA77B] hover:text-[#D0BE91] font-mono font-medium flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Explore full audit capabilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
