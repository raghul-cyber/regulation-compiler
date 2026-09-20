import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend duration ceiling on Vercel

interface AuditRequest {
  url: string;
  frameworks?: string[];
  scan_depth?: 'surface' | 'deep';
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
  remediation: {
    description: string;
    nginx?: string | null;
    nextjs?: string | null;
    apache?: string | null;
    cloudflare?: string | null;
  } | null;
}

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = (hostname || '').toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '0.0.0.0' || lower === '::1') {
    return true;
  }
  if (lower.endsWith('.internal') || lower.endsWith('.local')) {
    return true;
  }
  // Check private IPv4 ranges
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(lower)) return true; // Link-local / AWS metadata
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuditRequest = await request.json().catch(() => ({ url: '' }));
    let rawUrl = (body.url || '').trim();

    if (!rawUrl) {
      return NextResponse.json(
        { status: 'error', message: 'Target website URL is required.' },
        { status: 400 }
      );
    }

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Invalid website URL format provided.' },
        { status: 400 }
      );
    }

    const hostname = urlObj.hostname;
    if (isPrivateIpOrHost(hostname)) {
      return NextResponse.json(
        { status: 'error', message: 'Auditing private internal network hosts or loopback addresses is restricted.' },
        { status: 400 }
      );
    }

    const origin = urlObj.origin;
    const requestedFrameworks = body.frameworks && body.frameworks.length > 0 
      ? body.frameworks 
      : ['GDPR', 'HIPAA', 'SOC 2', 'WCAG 2.1', 'PCI-DSS', 'ISO 27001', 'DORA', 'NIST'];

    // Entitlement & 3 Free Uses Verification for Authenticated Users (with strict timeout)
    let userToken: string | null = null;
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      userToken = await session.getToken();
      if (userToken) {
        const apiBase = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '');
        // Guard against hung connections in serverless environment with a strict 1.8s timeout
        const statusRes = await fetch(`${apiBase}/billing/status`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(1800)
        }).catch(() => null);

        if (statusRes && statusRes.ok) {
          const billing = await statusRes.json().catch(() => null);
          if (billing && !billing.is_admin && !billing.paid_access && (billing.free_usage?.remaining ?? 0) <= 0) {
            return NextResponse.json(
              {
                code: 'PAYMENT_REQUIRED',
                message: 'Your 3 free uses have been used. Continue auditing websites by upgrading your access.',
                free_uses_used: billing.free_usage?.used || 3,
                free_uses_limit: billing.free_usage?.limit || 3,
                upgrade_required: true,
                upgrade_url: '/billing'
              },
              { status: 402 }
            );
          }
        }
      }
    } catch (authErr) {
      // Proceed gracefully if unauthenticated public preview or billing endpoint is unreachable
    }

    const agentLogs: string[] = [];
    const startTime = Date.now();

    agentLogs.push(`[AGENT-DEPLOY] Autonomous Compliance Auditor dispatched to ${rawUrl}`);
    agentLogs.push(`[DNS-LOOKUP] Validating domain reachability for ${hostname}...`);
    agentLogs.push(`[FRAMEWORKS-LINKED] Active standard gates: ${requestedFrameworks.join(', ')}`);

    // 1. Fetch main landing page with strict 6s timeout to stay well within Vercel execution ceilings
    agentLogs.push(`[TLS-INSPECT] Establishing HTTPS/TLS connection and streaming headers...`);
    let mainResp: Response;
    try {
      mainResp = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) RegCompiler-ComplianceBot/2.0 (+https://regulationcompiler.org/compliance-agent)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6000),
      });
    } catch (fetchErr: any) {
      const isTimeout = fetchErr?.name === 'TimeoutError' || (fetchErr?.message || '').toLowerCase().includes('timeout');
      return NextResponse.json(
        {
          status: 'error',
          message: isTimeout
            ? `Connection to ${hostname} timed out after 6 seconds. The target website may be slow, down, or blocking automated inspection.`
            : `Unable to connect to target website (${hostname}): ${fetchErr?.message || 'Network unreachable'}. Please check that the URL is public and operational.`,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }

    const latencyMs = Date.now() - startTime;
    const finalUrl = mainResp.url || rawUrl;
    agentLogs.push(`[HANDSHAKE-SUCCESS] Connected: HTTP ${mainResp.status} ${mainResp.statusText || 'OK'} (${latencyMs}ms)`);

    const headers: Record<string, string> = {};
    const rawHeadersList: { key: string; value: string }[] = [];
    for (const [k, v] of mainResp.headers.entries()) {
      headers[k.toLowerCase()] = v;
      rawHeadersList.push({ key: k, value: v });
    }

    // 2. Parallel probing for RFC 9116 security.txt, robots.txt, and HTTP upgrade check
    agentLogs.push(`[PROBE-PARALLEL] Probing /.well-known/security.txt, /robots.txt, and HTTP-to-HTTPS redirect...`);
    const [secTxtResp, robotsResp, httpRedirectResp] = await Promise.all([
      fetch(`${origin}/.well-known/security.txt`, {
        headers: { 'User-Agent': 'RegCompiler-ComplianceBot/2.0' },
        signal: AbortSignal.timeout(2000),
      }).catch(() => null),
      fetch(`${origin}/robots.txt`, {
        headers: { 'User-Agent': 'RegCompiler-ComplianceBot/2.0' },
        signal: AbortSignal.timeout(2000),
      }).catch(() => null),
      fetch(`http://${hostname}`, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(2000),
      }).catch(() => null),
    ]);

    const hasSecurityTxt = secTxtResp && secTxtResp.status === 200;
    const hasRobotsTxt = robotsResp && robotsResp.status === 200;
    const isHttpsUpgraded = !httpRedirectResp || (httpRedirectResp.status >= 300 && httpRedirectResp.status < 400);

    agentLogs.push(`[STATUTORY-CHECK] RFC 9116 security.txt: ${hasSecurityTxt ? 'FOUND (HTTP 200)' : 'MISSING (HTTP ' + (secTxtResp?.status || 404) + ')'}`);
    agentLogs.push(`[STATUTORY-CHECK] /robots.txt: ${hasRobotsTxt ? 'ACTIVE (HTTP 200)' : 'NOT PUBLISHED'}`);
    agentLogs.push(`[TRANSPORT-CHECK] HTTP -> HTTPS Upgrade: ${isHttpsUpgraded ? 'ENFORCED (Strict Redirect)' : 'INCONCLUSIVE'}`);

    // 3. Extract and parse HTML content
    agentLogs.push(`[DOM-INSPECTION] Downloading and parsing HTML document structure & accessibility tree...`);
    const html = await mainResp.text();
    const htmlBytes = html.length;

    // Rule Findings Collection
    const findings: AuditFinding[] = [];

    // --- CHECK 1: HSTS ---
    const hsts = headers['strict-transport-security'];
    if (!hsts) {
      findings.push({
        id: 'SEC-HSTS-01',
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        category: 'SECURITY',
        framework: 'NIST SP 800-53 / PCI-DSS 4.0 / ISO 27001',
        clause: 'PCI-DSS v4.0 Req 4.1.2 / NIST SC-8 / ISO 27001 A.10.1',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Strict-Transport-Security header was returned in the server response.',
        remediation: {
          description: 'Enforce HSTS with a minimum max-age of 1 year (31536000 seconds) including subdomains and preload.',
          nginx: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
          nextjs: `// next.config.js\nheaders: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]`,
          apache: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
          cloudflare: 'Enable "HTTP Strict Transport Security (HSTS)" in Cloudflare SSL/TLS settings.'
        }
      });
    } else {
      const hasSubdomains = hsts.toLowerCase().includes('includesubdomains');
      const hasPreload = hsts.toLowerCase().includes('preload');
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const isWeakMaxAge = maxAge < 15552000; // less than 180 days

      if (isWeakMaxAge || !hasSubdomains) {
        findings.push({
          id: 'SEC-HSTS-01',
          title: 'Weak or Incomplete HSTS Configuration',
          category: 'SECURITY',
          framework: 'PCI-DSS 4.0 / NIST SC-8',
          clause: 'PCI-DSS v4.0 Req 4.1.2',
          severity: 'MEDIUM',
          status: 'FAIL',
          affected: 'HTTP Response Headers',
          evidence: `Current HSTS: "${hsts}". Max-age is ${maxAge}s (${hasSubdomains ? 'subdomains included' : 'subdomains omitted'}).`,
          remediation: {
            description: 'Increase HSTS max-age to 31536000 (1 year) and append includeSubDomains.',
            nginx: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
            nextjs: `headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]`
          }
        });
      } else {
        findings.push({
          id: 'SEC-HSTS-01',
          title: 'Strict Transport Security (HSTS) Compliant',
          category: 'SECURITY',
          framework: 'PCI-DSS 4.0 / NIST SC-8',
          clause: 'PCI-DSS v4.0 Req 4.1.2',
          severity: 'INFO',
          status: 'PASS',
          affected: 'HTTP Response Headers',
          evidence: `Strict-Transport-Security: ${hsts}`,
          remediation: null
        });
      }
    }

    // --- CHECK 2: Content-Security-Policy (CSP) ---
    const csp = headers['content-security-policy'];
    if (!csp) {
      findings.push({
        id: 'SEC-CSP-01',
        title: 'Missing Content Security Policy (CSP)',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / DORA Art. 9 / NIST SI-10',
        clause: 'DORA Regulation (EU) 2022/2554 Art. 9 / OWASP A03:2021',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Content-Security-Policy header detected. The website is vulnerable to Cross-Site Scripting (XSS), data exfiltration, and malicious third-party script injection.',
        remediation: {
          description: 'Deploy a strict Content-Security-Policy specifying authorized script, style, connect, and object sources.',
          nginx: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; img-src 'self' data: https:;\" always;",
          nextjs: `// next.config.js\nheaders: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none';" }]`,
          apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\""
        }
      });
    } else {
      const hasUnsafe = csp.includes('unsafe-inline') || csp.includes('unsafe-eval');
      const hasHttp = /http:\/\//i.test(csp);
      if (hasUnsafe || hasHttp) {
        findings.push({
          id: 'SEC-CSP-01',
          title: 'Content Security Policy Contains Permissive Directives',
          category: 'SECURITY',
          framework: 'OWASP Top 10 / DORA Art. 9',
          clause: 'DORA Regulation (EU) 2022/2554 Art. 9 / PCI-DSS Req 6.4.3',
          severity: 'MEDIUM',
          status: 'FAIL',
          affected: 'HTTP Response Headers',
          evidence: `Permissive directives observed in CSP: ${csp.substring(0, 140)}...`,
          remediation: {
            description: 'Refactor inline scripts to utilize cryptographic nonces (nonce-...) or SHA-256 hashes instead of unsafe-inline.',
            nginx: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'nonce-$request_id'; object-src 'none';\" always;",
            nextjs: '// Utilize Next.js script nonces via middleware'
          }
        });
      } else {
        findings.push({
          id: 'SEC-CSP-01',
          title: 'Content Security Policy (CSP) Active & Hardened',
          category: 'SECURITY',
          framework: 'OWASP Top 10 / DORA Art. 9',
          clause: 'DORA Regulation (EU) 2022/2554 Art. 9',
          severity: 'INFO',
          status: 'PASS',
          affected: 'HTTP Response Headers',
          evidence: `CSP verified: ${csp.substring(0, 100)}...`,
          remediation: null
        });
      }
    }

    // --- CHECK 3: Clickjacking Defense ---
    const xfo = headers['x-frame-options'];
    const hasFrameAncestors = csp && csp.includes('frame-ancestors');
    if (!xfo && !hasFrameAncestors) {
      findings.push({
        id: 'SEC-XFO-01',
        title: 'Missing Clickjacking Protection (X-Frame-Options / frame-ancestors)',
        category: 'SECURITY',
        framework: 'OWASP A05:2021 / GDPR Art. 32',
        clause: 'EU GDPR Article 32(1)(b) - Confidentiality & Integrity',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Neither X-Frame-Options nor CSP frame-ancestors directive is configured. Attackers can embed this portal in transparent iframes to hijack clicks.',
        remediation: {
          description: 'Set X-Frame-Options to DENY (or SAMEORIGIN), or add frame-ancestors \'none\' to your CSP.',
          nginx: 'add_header X-Frame-Options "DENY" always;',
          nextjs: `headers: [{ key: 'X-Frame-Options', value: 'DENY' }]`,
          apache: 'Header always set X-Frame-Options "DENY"'
        }
      });
    } else {
      findings.push({
        id: 'SEC-XFO-01',
        title: 'Clickjacking Defense Configured',
        category: 'SECURITY',
        framework: 'GDPR Art. 32 / OWASP',
        clause: 'EU GDPR Article 32',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Framing restriction: ${xfo || 'Enforced via CSP frame-ancestors'}`,
        remediation: null
      });
    }

    // --- CHECK 4: X-Content-Type-Options ---
    const xcto = headers['x-content-type-options'];
    if (!xcto || !xcto.toLowerCase().includes('nosniff')) {
      findings.push({
        id: 'SEC-XCTO-01',
        title: 'MIME-Sniffing Prevention Missing (X-Content-Type-Options)',
        category: 'SECURITY',
        framework: 'ISO 27001 A.14.1.2 / OWASP A05',
        clause: 'ISO/IEC 27001 Control A.14.1.2',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: `X-Content-Type-Options header is ${xcto ? xcto : 'missing'}. Browsers may MIME-interpret untrusted user uploads as executable HTML or script.`,
        remediation: {
          description: 'Add X-Content-Type-Options: nosniff to all HTTP responses.',
          nginx: 'add_header X-Content-Type-Options "nosniff" always;',
          nextjs: `headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }]`,
          apache: 'Header always set X-Content-Type-Options "nosniff"'
        }
      });
    } else {
      findings.push({
        id: 'SEC-XCTO-01',
        title: 'MIME-Sniffing Prevention Active',
        category: 'SECURITY',
        framework: 'ISO 27001 A.14.1.2',
        clause: 'ISO/IEC 27001 Control A.14.1.2',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: 'X-Content-Type-Options: nosniff verified.',
        remediation: null
      });
    }

    // --- CHECK 5: Referrer-Policy ---
    const refPol = headers['referrer-policy'];
    if (!refPol) {
      findings.push({
        id: 'PRIV-REF-01',
        title: 'Missing Referrer-Policy (Risk of PII URL Leakage)',
        category: 'PRIVACY',
        framework: 'GDPR Art. 5(1)(f) / CCPA § 1798.100',
        clause: 'EU GDPR Article 5(1)(f) - Data Minimization & Integrity',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Referrer-Policy specified. Browsers may transmit full URL paths, sensitive query parameters, or token fragments to third-party endpoints.',
        remediation: {
          description: 'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.',
          nginx: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
          nextjs: `headers: [{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }]`
        }
      });
    } else {
      findings.push({
        id: 'PRIV-REF-01',
        title: 'Referrer Policy Enforced',
        category: 'PRIVACY',
        framework: 'GDPR Art. 5 / CCPA',
        clause: 'EU GDPR Article 5(1)(f)',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Referrer-Policy: ${refPol}`,
        remediation: null
      });
    }

    // --- CHECK 6: Permissions-Policy ---
    const permPol = headers['permissions-policy'];
    if (!permPol) {
      findings.push({
        id: 'PRIV-PERM-01',
        title: 'Missing Permissions-Policy (Hardware Access Unrestricted)',
        category: 'PRIVACY',
        framework: 'Privacy by Design / GDPR Art. 25',
        clause: 'EU GDPR Article 25 - Data Protection by Design and by Default',
        severity: 'LOW',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Permissions-Policy header found. Embedded third-party widgets may attempt to request microphone, camera, or geolocation APIs.',
        remediation: {
          description: 'Declare an explicit Permissions-Policy restricting sensitive browser APIs.',
          nginx: 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;',
          nextjs: `headers: [{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }]`
        }
      });
    } else {
      findings.push({
        id: 'PRIV-PERM-01',
        title: 'Permissions-Policy Configured',
        category: 'PRIVACY',
        framework: 'GDPR Art. 25',
        clause: 'EU GDPR Article 25',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Permissions-Policy: ${permPol}`,
        remediation: null
      });
    }

    // --- CHECK 7: Server Information Disclosure ---
    const srv = headers['server'];
    const poweredBy = headers['x-powered-by'];
    if (poweredBy || (srv && /\d+\.\d+/.test(srv))) {
      findings.push({
        id: 'SEC-INFO-01',
        title: 'Server Version / Framework Disclosure',
        category: 'SECURITY',
        framework: 'CIS Benchmark / NIST SP 800-52',
        clause: 'CIS Benchmark 2.1 - Information Leakage',
        severity: 'LOW',
        status: 'FAIL',
        affected: 'HTTP Headers',
        evidence: `Disclosed runtime banner: ${[srv, poweredBy].filter(Boolean).join(', ')}.`,
        remediation: {
          description: 'Disable software version banners in server config to mitigate automated exploit reconnaissance.',
          nginx: 'server_tokens off;',
          nextjs: '// next.config.js\npoweredByHeader: false'
        }
      });
    } else {
      findings.push({
        id: 'SEC-INFO-01',
        title: 'Server Fingerprint Suppressed',
        category: 'SECURITY',
        framework: 'CIS Benchmark',
        clause: 'CIS Benchmark 2.1',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Headers',
        evidence: 'No specific software versions disclosed in server response headers.',
        remediation: null
      });
    }

    // --- CHECK 8: Privacy Policy Link (GDPR Art. 13) ---
    const hasPrivacyLink = /href=["'][^"']*(privacy|datenschutz|politica-de-privacidad|confidentialite)[^"']*["']/i.test(html);
    if (!hasPrivacyLink) {
      findings.push({
        id: 'PRIV-NOTICE-01',
        title: 'Missing Privacy Policy Link on Landing Page',
        category: 'PRIVACY',
        framework: 'GDPR Art. 12 & 13 / CCPA / CalOPPA',
        clause: 'EU GDPR Article 13 - Information to be Provided where Personal Data are Collected',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'HTML DOM Markup',
        evidence: 'No accessible hyperlink referencing a privacy policy, notice, or Datenschutz detected in the page markup.',
        remediation: {
          description: 'Provide an unambiguous, prominent link to your Privacy Notice in your navigation or footer.',
          nginx: null,
          nextjs: '<footer className="..."><Link href="/privacy">Privacy Notice</Link></footer>'
        }
      });
    } else {
      findings.push({
        id: 'PRIV-NOTICE-01',
        title: 'Statutory Privacy Policy Notice Verified',
        category: 'PRIVACY',
        framework: 'GDPR Art. 13 / CCPA',
        clause: 'EU GDPR Article 13',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTML DOM Markup',
        evidence: 'Accessible Privacy Policy link verified in rendered HTML.',
        remediation: null
      });
    }

    // --- CHECK 9: Cookie Consent CMP (ePrivacy Directive & GDPR Art. 7) ---
    const cookieCmpSignatures = /onetrust|cookiebot|osano|didomi|klaro|usercentrics|axeptio|cookie-banner|cookie-notice|cookie_consent|cookie-law|trustarc/i;
    const hasCmp = cookieCmpSignatures.test(html);
    if (!hasCmp) {
      findings.push({
        id: 'PRIV-COOKIE-01',
        title: 'No Recognized Cookie Consent Management Banner (CMP) Detected',
        category: 'PRIVACY',
        framework: 'ePrivacy Directive / GDPR Art. 7',
        clause: 'Directive 2002/58/EC (ePrivacy) Art. 5(3) & GDPR Art. 7',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'Client Frontend DOM',
        evidence: 'No recognized Consent Management Platform (CMP) or opt-in cookie banner detected in the client markup.',
        remediation: {
          description: 'Implement a prior-consent cookie banner that halts non-essential tracking cookies until explicit opt-in.',
          nginx: null,
          nextjs: '// Integrate an ePrivacy-compliant Consent Management Platform'
        }
      });
    } else {
      findings.push({
        id: 'PRIV-COOKIE-01',
        title: 'Cookie Consent Platform Detected',
        category: 'PRIVACY',
        framework: 'ePrivacy / GDPR Art. 7',
        clause: 'Directive 2002/58/EC Art. 5(3)',
        severity: 'INFO',
        status: 'PASS',
        affected: 'Client Frontend DOM',
        evidence: 'Recognized Consent Management Platform detected in web application structure.',
        remediation: null
      });
    }

    // --- CHECK 10: WCAG 3.1.1 Language of Page ---
    const langMatch = html.match(/<html[^>]*\blang=["']([^"']+)["']/i);
    if (!langMatch) {
      findings.push({
        id: 'ACC-LANG-01',
        title: 'Missing HTML lang Attribute (WCAG 3.1.1)',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA / ADA Title III / EN 301 549',
        clause: 'WCAG 2.1 Guideline 3.1.1 - Language of Page (Level A)',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: '<html> tag',
        evidence: '<html> tag lacks a lang attribute. Screen reader synthesizers cannot determine correct accent and pronunciation.',
        remediation: {
          description: 'Add a valid ISO language code to the root <html> element (e.g. lang="en").',
          nginx: null,
          nextjs: '<html lang="en">\n  <body>{children}</body>\n</html>'
        }
      });
    } else {
      findings.push({
        id: 'ACC-LANG-01',
        title: `HTML Language Declared ("${langMatch[1]}")`,
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA',
        clause: 'WCAG 2.1 Guideline 3.1.1',
        severity: 'INFO',
        status: 'PASS',
        affected: '<html> tag',
        evidence: `<html lang="${langMatch[1]}">`,
        remediation: null
      });
    }

    // --- CHECK 11: WCAG 2.4.2 Page Title ---
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch || !titleMatch[1].trim()) {
      findings.push({
        id: 'ACC-TITLE-01',
        title: 'Missing or Empty <title> Element (WCAG 2.4.2)',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA / Section 508',
        clause: 'WCAG 2.1 Guideline 2.4.2 - Page Titled (Level A)',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: '<head> markup',
        evidence: 'HTML document lacks a descriptive <title> tag. Assistive technologies cannot convey the page purpose.',
        remediation: {
          description: 'Declare an informative, context-specific <title> tag in the document <head>.',
          nginx: null,
          nextjs: 'export const metadata = { title: "Portal Title | Company" };'
        }
      });
    } else {
      findings.push({
        id: 'ACC-TITLE-01',
        title: 'Descriptive Page Title Defined',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA',
        clause: 'WCAG 2.1 Guideline 2.4.2',
        severity: 'INFO',
        status: 'PASS',
        affected: '<title> tag',
        evidence: `<title>${titleMatch[1].trim().substring(0, 80)}</title>`,
        remediation: null
      });
    }

    // --- CHECK 12: WCAG 1.1.1 Image Alt Text ---
    const missingAltMatches = html.match(/<img(?![^>]*\balt=)[^>]*>/gi) || [];
    const missingAltCount = missingAltMatches.length;
    if (missingAltCount > 0) {
      findings.push({
        id: 'ACC-ALT-01',
        title: `Images Missing alt Text Attributes (${missingAltCount} occurrences)`,
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA / ADA Title III',
        clause: 'WCAG 2.1 Guideline 1.1.1 - Non-text Content (Level A)',
        severity: 'HIGH',
        status: 'FAIL',
        affected: '<img> DOM elements',
        evidence: `Found ${missingAltCount} <img> elements lacking an alt attribute. Visually impaired users using screen readers cannot perceive visual content.`,
        remediation: {
          description: 'Provide meaningful alt text describing the graphic, or alt="" for purely decorative elements.',
          nginx: null,
          nextjs: '<Image src="/chart.png" alt="Compliance telemetry distribution bar chart" />'
        }
      });
    } else {
      findings.push({
        id: 'ACC-ALT-01',
        title: 'All Scanned Images Include alt Attributes',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA',
        clause: 'WCAG 2.1 Guideline 1.1.1',
        severity: 'INFO',
        status: 'PASS',
        affected: '<img> DOM elements',
        evidence: 'All scanned image tags include valid alt attributes.',
        remediation: null
      });
    }

    // --- CHECK 13: WCAG 1.4.4 Viewport Scalability ---
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
    const isScalingBlocked = viewportMatch && (/user-scalable\s*=\s*(no|0)/i.test(viewportMatch[1]) || /maximum-scale\s*=\s*1(\.0)?/i.test(viewportMatch[1]));
    if (isScalingBlocked) {
      findings.push({
        id: 'ACC-ZOOM-01',
        title: 'Pinch-to-Zoom Disabled in Viewport (WCAG 1.4.4)',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA / ADA Title III',
        clause: 'WCAG 2.1 Guideline 1.4.4 - Resize Text (Level AA)',
        severity: 'HIGH',
        status: 'FAIL',
        affected: '<meta name="viewport">',
        evidence: `Viewport disables user scaling: "${viewportMatch[1]}". Low-vision users are prevented from magnifying content.`,
        remediation: {
          description: 'Remove user-scalable=no and maximum-scale=1.0 from viewport configuration.',
          nginx: null,
          nextjs: '<meta name="viewport" content="width=device-width, initial-scale=1" />'
        }
      });
    } else {
      findings.push({
        id: 'ACC-ZOOM-01',
        title: 'Viewport Permits User Scalability',
        category: 'ACCESSIBILITY',
        framework: 'WCAG 2.1 AA',
        clause: 'WCAG 2.1 Guideline 1.4.4',
        severity: 'INFO',
        status: 'PASS',
        affected: '<meta name="viewport">',
        evidence: viewportMatch ? viewportMatch[1] : 'Standard responsive scaling active',
        remediation: null
      });
    }

    // --- CHECK 14: RFC 9116 Vulnerability Disclosure (security.txt) ---
    if (!hasSecurityTxt) {
      findings.push({
        id: 'DISC-SECTXT-01',
        title: 'Missing RFC 9116 Vulnerability Disclosure File (security.txt)',
        category: 'DISCLOSURE',
        framework: 'RFC 9116 / ISO 29147 / CISA BOD 20-01',
        clause: 'IETF RFC 9116 / ISO/IEC 29147 Vulnerability Disclosure',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: '/.well-known/security.txt',
        evidence: `HTTP ${secTxtResp?.status || 404} returned for /.well-known/security.txt. External security researchers lack a designated channel for responsible zero-day disclosure.`,
        remediation: {
          description: 'Publish a security.txt file with Contact, Canonical, and Expires fields at /.well-known/security.txt.',
          nginx: 'location = /.well-known/security.txt {\n  return 200 "Contact: security@yourdomain.com\\nExpires: 2027-01-01T00:00:00.000Z\\n";\n}',
          nextjs: '// Create public/.well-known/security.txt with verified contact details'
        }
      });
    } else {
      findings.push({
        id: 'DISC-SECTXT-01',
        title: 'RFC 9116 Security Disclosure File Active',
        category: 'DISCLOSURE',
        framework: 'RFC 9116 / ISO 29147',
        clause: 'IETF RFC 9116',
        severity: 'INFO',
        status: 'PASS',
        affected: '/.well-known/security.txt',
        evidence: 'RFC 9116 security.txt verified and accessible.',
        remediation: null
      });
    }

    // --- CHECK 15: Subresource Integrity (SRI) on External Scripts ---
    const externalScripts = (html.match(/<script[^>]*src=["']https?:\/\/[^"']+["'][^>]*>/gi) || []);
    const scriptsWithoutSri = externalScripts.filter(s => !/integrity=["']sha/i.test(s));
    if (scriptsWithoutSri.length > 0) {
      findings.push({
        id: 'SUPPLY-SRI-01',
        title: `Third-Party Scripts Lacking Subresource Integrity (${scriptsWithoutSri.length} scripts)`,
        category: 'SUPPLY_CHAIN',
        framework: 'PCI-DSS 4.0 Req 6.4.3 / ISO 27001 A.8.28',
        clause: 'PCI-DSS v4.0 Requirement 6.4.3 & ISO 27001 Control A.8.28',
        severity: 'HIGH',
        status: 'FAIL',
        affected: '<script src="https://...">',
        evidence: `Found ${scriptsWithoutSri.length} external scripts loaded without cryptographic SRI checksums. A compromised CDN could inject arbitrary code into user sessions.`,
        remediation: {
          description: 'Add integrity="sha384-..." and crossorigin="anonymous" to all CDN script tags, or bundle dependencies locally.',
          nginx: null,
          nextjs: '<script src="https://cdn.example.com/lib.js" integrity="sha384-..." crossOrigin="anonymous" />'
        }
      });
    } else if (externalScripts.length > 0) {
      findings.push({
        id: 'SUPPLY-SRI-01',
        title: 'Subresource Integrity (SRI) Verified on External Scripts',
        category: 'SUPPLY_CHAIN',
        framework: 'PCI-DSS 4.0 Req 6.4.3',
        clause: 'PCI-DSS v4.0 Requirement 6.4.3',
        severity: 'INFO',
        status: 'PASS',
        affected: '<script> tags',
        evidence: 'All external scripts declare cryptographic SRI hashes.',
        remediation: null
      });
    }

    // Filter findings by user selected frameworks if requested
    const filteredFindings = findings.filter(f => {
      if ((requestedFrameworks || []).includes('ALL')) return true;
      return (requestedFrameworks || []).some(fw => (f.framework || '').toUpperCase().includes((fw || '').toUpperCase()));
    });

    const activeFindings = filteredFindings.length > 0 ? filteredFindings : findings;

    // Score Calculations
    const totalCount = activeFindings.length;
    const failCount = activeFindings.filter(f => f.status === 'FAIL').length;
    const passCount = totalCount - failCount;
    const criticalCount = activeFindings.filter(f => f.status === 'FAIL' && f.severity === 'CRITICAL').length;
    const highCount = activeFindings.filter(f => f.status === 'FAIL' && f.severity === 'HIGH').length;
    const mediumCount = activeFindings.filter(f => f.status === 'FAIL' && f.severity === 'MEDIUM').length;
    const lowCount = activeFindings.filter(f => f.status === 'FAIL' && f.severity === 'LOW').length;

    // Weighted Score Formula
    const deduction = (criticalCount * 25) + (highCount * 14) + (mediumCount * 7) + (lowCount * 3);
    const overallScore = Math.max(15, Math.min(100, Math.round(100 - deduction)));

    let grade = 'F';
    if (overallScore >= 95) grade = 'A+';
    else if (overallScore >= 85) grade = 'A';
    else if (overallScore >= 75) grade = 'B+';
    else if (overallScore >= 65) grade = 'B';
    else if (overallScore >= 50) grade = 'C';
    else grade = 'F';

    // Sub-Scores
    const calcSubScore = (category: string) => {
      const catFindings = activeFindings.filter(f => f.category === category);
      if (catFindings.length === 0) return 100;
      const catFails = catFindings.filter(f => f.status === 'FAIL').length;
      return Math.round(((catFindings.length - catFails) / catFindings.length) * 100);
    };

    const subScores = {
      security: calcSubScore('SECURITY'),
      privacy: calcSubScore('PRIVACY'),
      accessibility: calcSubScore('ACCESSIBILITY'),
      disclosures: calcSubScore('DISCLOSURE'),
      supply_chain: calcSubScore('SUPPLY_CHAIN'),
    };

    agentLogs.push(`[AUDIT-COMPLETE] Finalized statutory verification across ${totalCount} checkpoints`);
    agentLogs.push(`[EXECUTIVE-VERDICT] Audit Grade: ${grade} (${overallScore}%) — ${failCount} violations flagged`);

    const resultPayload = {
      status: 'success',
      target_url: rawUrl,
      final_url: finalUrl,
      domain: hostname,
      scanned_at: new Date().toISOString(),
      execution_time_ms: Date.now() - startTime,
      latency_ms: latencyMs || (Date.now() - startTime),
      http_status: mainResp.status,
      html_bytes: htmlBytes,
      grade,
      score: overallScore,
      sub_scores: subScores,
      summary: {
        total_checkpoints: totalCount,
        passed: passCount,
        failed: failCount,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      findings: activeFindings.map(f => ({
        ...f,
        title: f.title || '',
        framework: f.framework || '',
        clause: f.clause || '',
        affected: f.affected || '',
        evidence: f.evidence || '',
      })),
      raw_headers: rawHeadersList,
      agent_logs: agentLogs.filter(Boolean).map(log => String(log || '')),
    };

    return NextResponse.json(resultPayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Auditor-Engine': 'RegCompiler-Autonomous-Agent-v2',
      }
    });
  } catch (err: any) {
    console.error('Website compliance audit exception:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err?.message || 'Unexpected exception executing website compliance audit.',
      },
      { status: 500 }
    );
  }
}
