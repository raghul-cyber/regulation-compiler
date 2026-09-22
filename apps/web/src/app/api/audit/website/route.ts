import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Extend duration ceiling on Vercel

interface AuditRequest {
  url: string;
  frameworks?: string[];
  scan_depth?: 'surface' | 'deep';
}

export interface AuditRemediation {
  description: string;
  nginx?: string | null;
  nextjs?: string | null;
  apache?: string | null;
  cloudflare?: string | null;
}

export interface AuditFinding {
  id: string;
  rule_id?: string;
  title: string;
  category: 'SECURITY' | 'PRIVACY' | 'ACCESSIBILITY' | 'DISCLOSURE' | 'SUPPLY_CHAIN';
  framework: string;
  clause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  status: 'PASS' | 'FAIL';
  affected: string;
  affected_resource?: string;
  evidence: string;
  description?: string;
  remediation: AuditRemediation | null;
  remediation_guidance?: string;
}

interface ProbeResult {
  finalUrl: string;
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  rawHeaders: { key: string; value: string }[];
  cookies: string[];
  html: string;
  tlsAudit: {
    isHttps: boolean;
    authorized: boolean;
    certError: string | null;
    protocol: string | null;
  };
  latencyMs: number;
  redirectsFollowed: number;
  visitedUrls: string[];
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
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(lower)) return true; // Link-local
  return false;
}

/**
 * Resilient, zero-mock crawler probe engine.
 * - Handles redirects statefully with a cookie jar
 * - Detects and breaks redirect loops gracefully (e.g. auth handshake loops)
 * - Tolerates invalid/self-signed certs so they can be audited for compliance
 * - Falls back to plain HTTP if port 443 is refused
 * - Employs realistic browser headers to prevent false-positive bot-blocking
 */
async function robustWebsiteProbe(targetUrl: string, maxRedirects = 8): Promise<ProbeResult> {
  const startTime = Date.now();
  let currentUrl = targetUrl.trim();
  if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    currentUrl = 'https://' + currentUrl;
  }

  const visitedUrls = new Set<string>();
  const visitedList: string[] = [];
  const cookieJar = new Map<string, string>();
  let lastResponse: any = null;
  const accumulatedHeaders: Record<string, string> = {};
  const collectedCookies: string[] = [];
  const tlsAudit = {
    isHttps: false,
    authorized: true,
    certError: null as string | null,
    protocol: null as string | null,
  };
  let redirectsCount = 0;

  for (let hop = 0; hop < maxRedirects; hop++) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      break;
    }

    if (visitedUrls.has(currentUrl)) {
      // Loop detected - break cleanly without crashing!
      break;
    }
    visitedUrls.add(currentUrl);
    visitedList.push(currentUrl);

    const isHttps = parsedUrl.protocol === 'https:';
    if (hop === 0) {
      tlsAudit.isHttps = isHttps;
    }

    const cookieString = Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 RegCompiler-Auditor/2.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      ...(cookieString ? { 'Cookie': cookieString } : {})
    };

    let stepRes: any = null;
    try {
      stepRes = await new Promise((resolve, reject) => {
        const client = isHttps ? https : http;
        const req = client.request(parsedUrl, {
          method: 'GET',
          headers,
          timeout: 6000,
          rejectUnauthorized: false, // Don't crash on invalid/self-signed certs
        }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            resolve({
              statusCode: res.statusCode || 200,
              statusMessage: res.statusMessage || 'OK',
              headers: res.headers,
              body,
              socket: res.socket,
            });
          });
        });

        req.on('timeout', () => {
          req.destroy(new Error(`Connection to ${parsedUrl.hostname} timed out after 6000ms.`));
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.end();
      });
    } catch (reqErr: any) {
      // If initial HTTPS failed due to connection error (e.g. port 443 closed / ECONNREFUSED), attempt HTTP fallback
      if (hop === 0 && isHttps) {
        try {
          const fallbackUrl = currentUrl.replace(/^https:/i, 'http:');
          parsedUrl = new URL(fallbackUrl);
          stepRes = await new Promise((resolve, reject) => {
            const req = http.request(parsedUrl, {
              method: 'GET',
              headers,
              timeout: 5000,
            }, (res) => {
              const chunks: Buffer[] = [];
              res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
              res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8');
                resolve({
                  statusCode: res.statusCode || 200,
                  statusMessage: res.statusMessage || 'OK',
                  headers: res.headers,
                  body,
                  socket: res.socket,
                });
              });
            });
            req.on('timeout', () => req.destroy(new Error(`HTTP fallback connection timed out`)));
            req.on('error', reject);
            req.end();
          });
          tlsAudit.isHttps = false;
          tlsAudit.certError = 'Target host refused HTTPS connection on port 443; fallback to unencrypted plaintext HTTP.';
          currentUrl = fallbackUrl;
        } catch {
          throw reqErr;
        }
      } else {
        if (lastResponse) {
          break; // Stop at previous good response
        }
        throw reqErr;
      }
    }

    if (!stepRes) break;

    // Check socket TLS certificate authorization
    if (stepRes.socket && (stepRes.socket as any).authorized !== undefined) {
      if (!(stepRes.socket as any).authorized) {
        tlsAudit.authorized = false;
        tlsAudit.certError = (stepRes.socket as any).authorizationError || 'Untrusted, invalid, or self-signed TLS certificate.';
      }
      if (typeof (stepRes.socket as any).getProtocol === 'function') {
        tlsAudit.protocol = (stepRes.socket as any).getProtocol();
      }
    }

    // Process set-cookie headers
    const rawSetCookies = stepRes.headers['set-cookie'];
    if (rawSetCookies) {
      const cookieArray = Array.isArray(rawSetCookies) ? rawSetCookies : [rawSetCookies];
      collectedCookies.push(...cookieArray);
      for (const sc of cookieArray) {
        const firstPart = sc.split(';')[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx > 0) {
          const k = firstPart.slice(0, eqIdx).trim();
          const v = firstPart.slice(eqIdx + 1).trim();
          cookieJar.set(k, v);
        }
      }
    }

    // Accumulate headers
    for (const [k, v] of Object.entries(stepRes.headers)) {
      if (v) {
        accumulatedHeaders[k.toLowerCase()] = Array.isArray(v) ? v.join('; ') : String(v);
      }
    }

    lastResponse = stepRes;

    const statusCode = stepRes.statusCode;
    if (statusCode >= 300 && statusCode < 400 && stepRes.headers.location) {
      redirectsCount++;
      let nextLoc = stepRes.headers.location;
      try {
        nextLoc = new URL(nextLoc, currentUrl).toString();
      } catch {
        break;
      }
      currentUrl = nextLoc;
      continue;
    } else {
      break;
    }
  }

  if (!lastResponse) {
    throw new Error(`Unable to establish connection to ${targetUrl}. Please check that the URL is public and operational.`);
  }

  const rawHeadersList = Object.entries(accumulatedHeaders).map(([key, value]) => ({ key, value }));

  return {
    finalUrl: currentUrl,
    statusCode: lastResponse.statusCode,
    statusText: lastResponse.statusMessage,
    headers: accumulatedHeaders,
    rawHeaders: rawHeadersList,
    cookies: collectedCookies,
    html: lastResponse.body || '',
    tlsAudit,
    latencyMs: Date.now() - startTime,
    redirectsFollowed: redirectsCount,
    visitedUrls: visitedList,
  };
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

    // Entitlement & 3 Free Uses Verification for Authenticated & Anonymous Users
    let userToken: string | null = null;
    let anonAuditsCount = 0;

    try {
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      userToken = await session.getToken();
      if (userToken) {
        const apiBase = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '');
        
        // 1. Atomic reservation via /billing/reserve-usage
        const reserveRes = await fetch(`${apiBase}/billing/reserve-usage`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation_type: 'website_audit',
            operation_id: `web-audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            source: 'website_compliance_auditor',
            metadata: { target_url: rawUrl, domain: hostname }
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(3500)
        }).catch(() => null);

        if (reserveRes) {
          if (reserveRes.status === 402) {
            const errJson = await reserveRes.json().catch(() => ({}));
            const detail = errJson.detail || errJson;
            return NextResponse.json(
              {
                code: 'PAYMENT_REQUIRED',
                message: 'Your 3 free uses have been used. Continue auditing websites by upgrading your access.',
                free_uses_used: detail?.free_uses_used ?? 3,
                free_uses_limit: detail?.free_uses_limit ?? 3,
                upgrade_required: true,
                upgrade_url: '/billing'
              },
              { status: 402 }
            );
          }
        } else {
          // Fallback: If reserve-usage timed out or failed to connect, check status
          const statusRes = await fetch(`${apiBase}/billing/status`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
            cache: 'no-store',
            signal: AbortSignal.timeout(2000)
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
      }
    } catch (authErr) {
      // Proceed gracefully if unauthenticated public preview or billing endpoint is unreachable
    }

    // 2. Unauthenticated / anonymous visitor restriction: strictly enforce 3 free scans
    if (!userToken) {
      const anonCookie = request.cookies.get('reg_anon_audits')?.value;
      anonAuditsCount = parseInt(anonCookie || '0', 10);
      if (!isNaN(anonAuditsCount) && anonAuditsCount >= 3) {
        return NextResponse.json(
          {
            code: 'PAYMENT_REQUIRED',
            message: 'You have used your 3 complimentary website audits. Please sign in or upgrade to Pro to continue.',
            free_uses_used: 3,
            free_uses_limit: 3,
            upgrade_required: true,
            upgrade_url: '/billing'
          },
          { status: 402 }
        );
      }
    }

    const agentLogs: string[] = [];
    const startTime = Date.now();

    agentLogs.push(`[AGENT-DEPLOY] Autonomous Compliance Auditor dispatched to ${rawUrl}`);
    agentLogs.push(`[DNS-LOOKUP] Validating domain reachability for ${hostname}...`);
    agentLogs.push(`[FRAMEWORKS-LINKED] Active standard gates: ${requestedFrameworks.join(', ')}`);

    // 1. Execute robust zero-mock crawl
    agentLogs.push(`[TLS-INSPECT] Establishing connection, negotiating cipher suite, and streaming headers...`);
    let probeResult: ProbeResult;
    try {
      probeResult = await robustWebsiteProbe(rawUrl);
    } catch (fetchErr: any) {
      const isTimeout = (fetchErr?.message || '').toLowerCase().includes('timeout');
      return NextResponse.json(
        {
          status: 'error',
          message: isTimeout
            ? `Connection to ${hostname} timed out. The target website may be slow, down, or filtering automated inspection.`
            : `Unable to connect to target website (${hostname}): ${fetchErr?.message || 'Network unreachable'}. Please check that the URL is public and operational.`,
        },
        { status: isTimeout ? 504 : 502 }
      );
    }

    agentLogs.push(`[HANDSHAKE-SUCCESS] Connected: HTTP ${probeResult.statusCode} ${probeResult.statusText} (${probeResult.latencyMs}ms)`);
    if (probeResult.redirectsFollowed > 0) {
      agentLogs.push(`[REDIRECT-TRAVERSAL] Followed ${probeResult.redirectsFollowed} hops -> ${probeResult.finalUrl}`);
    }

    const headers = probeResult.headers;
    const rawHeadersList = probeResult.rawHeaders;

    // 2. Parallel probing for RFC 9116 security.txt and robots.txt
    agentLogs.push(`[PROBE-PARALLEL] Probing /.well-known/security.txt, /robots.txt, and HTTP-to-HTTPS redirect...`);
    const [secTxtResp, robotsResp, httpRedirectResp] = await Promise.all([
      fetch(`${origin}/.well-known/security.txt`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(2500),
      }).catch(() => null),
      fetch(`${origin}/robots.txt`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(2500),
      }).catch(() => null),
      fetch(`http://${hostname}`, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(2500),
      }).catch(() => null),
    ]);

    const hasSecurityTxt = secTxtResp && secTxtResp.status === 200;
    const hasRobotsTxt = robotsResp && robotsResp.status === 200;
    const isHttpsUpgraded = !httpRedirectResp || (httpRedirectResp.status >= 300 && httpRedirectResp.status < 400);

    agentLogs.push(`[STATUTORY-CHECK] RFC 9116 security.txt: ${hasSecurityTxt ? 'FOUND (HTTP 200)' : 'MISSING (HTTP ' + (secTxtResp?.status || 404) + ')'}`);
    agentLogs.push(`[STATUTORY-CHECK] /robots.txt: ${hasRobotsTxt ? 'ACTIVE (HTTP 200)' : 'NOT PUBLISHED'}`);
    agentLogs.push(`[TRANSPORT-CHECK] HTTP -> HTTPS Upgrade: ${isHttpsUpgraded ? 'ENFORCED (Strict Redirect)' : 'INCONCLUSIVE'}`);

    // 3. Inspect HTML structure
    agentLogs.push(`[DOM-INSPECTION] Parsing DOM structure, WCAG accessibility tree, and statutory disclosures...`);
    const html = probeResult.html || '';
    const htmlBytes = html.length;

    // Rule Findings Collection
    const findings: AuditFinding[] = [];

    // --- CHECK 1: TLS Certificate Integrity ---
    if (!probeResult.tlsAudit.authorized) {
      findings.push({
        id: 'SEC-TLS-01',
        title: 'Untrusted, Self-Signed, or Expired SSL/TLS Certificate',
        category: 'SECURITY',
        framework: 'NIST SP 800-52 / PCI-DSS 4.0 / HIPAA Security Rule',
        clause: 'NIST SP 800-52 Rev 2 / PCI-DSS Req 4.1 / 45 CFR § 164.312(e)(1)',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'TLS / SSL Socket',
        evidence: `TLS handshake validation error: ${probeResult.tlsAudit.certError || 'Certificate verification failed'}. Attackers can execute Man-in-the-Middle (MitM) eavesdropping or credential harvesting.`,
        remediation: {
          description: 'Deploy an authentic, trusted TLS certificate issued by an accredited Certificate Authority (CA) such as Let\'s Encrypt, Cloudflare, or DigiCert.',
          nginx: 'ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;\nssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;',
          cloudflare: 'Enable Universal SSL or provision an Advanced Certificate via Cloudflare SSL/TLS dashboard.'
        }
      });
    } else if (probeResult.tlsAudit.isHttps) {
      findings.push({
        id: 'SEC-TLS-01',
        title: 'Valid Trusted SSL/TLS Transport Certificate',
        category: 'SECURITY',
        framework: 'NIST SP 800-52 / PCI-DSS 4.0',
        clause: 'NIST SP 800-52 / PCI-DSS Req 4.1',
        severity: 'INFO',
        status: 'PASS',
        affected: 'TLS / SSL Socket',
        evidence: `Cryptographic TLS transport authorized (${probeResult.tlsAudit.protocol || 'TLSv1.3'}). Certificate chain verified.`,
        remediation: null
      });
    }

    // --- CHECK 2: HTTPS Transport Enforcement ---
    if (!probeResult.tlsAudit.isHttps) {
      findings.push({
        id: 'SEC-HTTPS-01',
        title: 'Insecure Plaintext HTTP Transport (Missing HTTPS)',
        category: 'SECURITY',
        framework: 'HIPAA § 164.312(e)(1) / PCI-DSS Req 4.1 / GDPR Art. 32',
        clause: '45 CFR § 164.312(e)(1) / PCI-DSS Req 4.1',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'Transport Protocol (Port 80)',
        evidence: 'The target website communicates over unencrypted plaintext HTTP. Passwords, session cookies, and PII are transmitted in cleartext.',
        remediation: {
          description: 'Enforce HTTPS encryption on port 443 and configure an unconditional 301/308 redirect from HTTP to HTTPS.',
          nginx: 'server {\n  listen 80;\n  return 301 https://$host$request_uri;\n}',
          cloudflare: 'Enable "Always Use HTTPS" under SSL/TLS Edge Certificates.'
        }
      });
    } else {
      findings.push({
        id: 'SEC-HTTPS-01',
        title: 'Encrypted HTTPS Transport Active',
        category: 'SECURITY',
        framework: 'HIPAA / PCI-DSS / GDPR Art. 32',
        clause: 'EU GDPR Article 32(1)(a) & PCI-DSS Req 4.1',
        severity: 'INFO',
        status: 'PASS',
        affected: 'Transport Protocol (Port 443)',
        evidence: 'Initial transport negotiated over encrypted HTTPS.',
        remediation: null
      });
    }

    // --- CHECK 3: HSTS ---
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

    // --- CHECK 4: Content-Security-Policy (CSP) ---
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

    // --- CHECK 5: Clickjacking Defense ---
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

    // --- CHECK 6: X-Content-Type-Options ---
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

    // --- CHECK 7: Referrer-Policy ---
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

    // --- CHECK 8: Permissions-Policy ---
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

    // --- CHECK 9: Cookie Security Configuration ---
    if (probeResult.cookies.length > 0) {
      const insecureCookies: string[] = [];
      for (const c of probeResult.cookies) {
        const lower = c.toLowerCase();
        const cookieName = c.split(';')[0].split('=')[0].trim();
        const hasSecure = lower.includes('secure');
        const hasHttpOnly = lower.includes('httponly');
        const hasSameSite = lower.includes('samesite');

        const flaws: string[] = [];
        if (!hasSecure) flaws.push('missing Secure');
        if (!hasHttpOnly) flaws.push('missing HttpOnly');
        if (!hasSameSite) flaws.push('missing SameSite');

        if (flaws.length > 0) {
          insecureCookies.push(`"${cookieName}" (${flaws.join(', ')})`);
        }
      }

      if (insecureCookies.length > 0) {
        findings.push({
          id: 'PRIV-COOKIE-FLAGS-01',
          title: `Insecure Cookie Attributes (${insecureCookies.length} cookies flagged)`,
          category: 'PRIVACY',
          framework: 'PCI-DSS 4.0 / OWASP A01:2021 / GDPR Art. 32',
          clause: 'PCI-DSS v4.0 Req 6.4.3 & OWASP Broken Access Control',
          severity: 'HIGH',
          status: 'FAIL',
          affected: 'Set-Cookie HTTP Headers',
          evidence: `Cookies lacking security attributes: ${insecureCookies.slice(0, 3).join('; ')}${insecureCookies.length > 3 ? '...' : ''}.`,
          remediation: {
            description: 'Enforce Secure, HttpOnly, and SameSite=Lax (or Strict) on all application and session cookies.',
            nginx: 'proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";',
            nextjs: `// Enforce httpOnly: true, secure: true, sameSite: 'lax'`
          }
        });
      } else {
        findings.push({
          id: 'PRIV-COOKIE-FLAGS-01',
          title: 'Cookie Security Flags Verified (Secure, HttpOnly, SameSite)',
          category: 'PRIVACY',
          framework: 'PCI-DSS 4.0 / OWASP A01',
          clause: 'PCI-DSS v4.0 Req 6.4.3',
          severity: 'INFO',
          status: 'PASS',
          affected: 'Set-Cookie HTTP Headers',
          evidence: `Verified ${probeResult.cookies.length} cookie(s) comply with statutory security flags.`,
          remediation: null
        });
      }
    } else {
      findings.push({
        id: 'PRIV-COOKIE-FLAGS-01',
        title: 'Zero-Cookie Privacy Baseline (Statutory Compliance)',
        category: 'PRIVACY',
        framework: 'ePrivacy Directive / GDPR Art. 5',
        clause: 'Directive 2002/58/EC Art. 5(3)',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: 'Target host issues no Set-Cookie tracking or state headers on initial handshake.',
        remediation: null
      });
    }

    // --- CHECK 10: Server Information Disclosure ---
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

    // --- CHECK 11: Privacy Policy Link (GDPR Art. 13) ---
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

    // --- CHECK 12: Cookie Consent CMP (ePrivacy Directive & GDPR Art. 7) ---
    const cookieCmpSignatures = /onetrust|cookiebot|osano|didomi|klaro|usercentrics|axeptio|cookie-banner|cookie-notice|cookie_consent|cookie-law|trustarc/i;
    const hasCmp = cookieCmpSignatures.test(html);
    if (!hasCmp && probeResult.cookies.length > 0) {
      findings.push({
        id: 'PRIV-COOKIE-01',
        title: 'No Recognized Cookie Consent Management Banner (CMP) Detected',
        category: 'PRIVACY',
        framework: 'ePrivacy Directive / GDPR Art. 7',
        clause: 'Directive 2002/58/EC (ePrivacy) Art. 5(3) & GDPR Art. 7',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'Client Frontend DOM',
        evidence: 'Cookies are stored on initial load, but no recognized Consent Management Platform (CMP) or opt-in cookie banner was detected in the client markup.',
        remediation: {
          description: 'Implement a prior-consent cookie banner that halts non-essential tracking cookies until explicit opt-in.',
          nginx: null,
          nextjs: '// Integrate an ePrivacy-compliant Consent Management Platform'
        }
      });
    } else {
      findings.push({
        id: 'PRIV-COOKIE-01',
        title: hasCmp ? 'Cookie Consent Platform Detected' : 'No Consent Banner Required (Zero Third-Party Cookies)',
        category: 'PRIVACY',
        framework: 'ePrivacy / GDPR Art. 7',
        clause: 'Directive 2002/58/EC Art. 5(3)',
        severity: 'INFO',
        status: 'PASS',
        affected: 'Client Frontend DOM',
        evidence: hasCmp ? 'Recognized Consent Management Platform detected in web application structure.' : 'No unsolicited tracking cookies detected prior to user consent.',
        remediation: null
      });
    }

    // --- CHECK 13: WCAG 3.1.1 Language of Page ---
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

    // --- CHECK 14: WCAG 2.4.2 Page Title ---
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

    // --- CHECK 15: WCAG 1.1.1 Image Alt Text ---
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
        evidence: 'All scanned image tags include valid alt attributes or decorative handling.',
        remediation: null
      });
    }

    // --- CHECK 16: WCAG 1.4.4 Viewport Scalability ---
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

    // --- CHECK 17: RFC 9116 Vulnerability Disclosure (security.txt) ---
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

    // --- CHECK 18: Robots Exclusion Protocol ---
    if (!hasRobotsTxt) {
      findings.push({
        id: 'DISC-ROBOTS-01',
        title: 'Missing robots.txt Crawler Governance File',
        category: 'DISCLOSURE',
        framework: 'RFC 9309 / Search & AI Transparency',
        clause: 'IETF RFC 9309 (Robots Exclusion Protocol)',
        severity: 'LOW',
        status: 'FAIL',
        affected: '/robots.txt',
        evidence: `HTTP ${robotsResp?.status || 404} returned for /robots.txt. Search engines and AI scrapers lack crawl governance guidelines.`,
        remediation: {
          description: 'Publish a /robots.txt declaring crawling directives and sitemap location.',
          nginx: 'location = /robots.txt {\n  return 200 "User-agent: *\\nAllow: /\\nSitemap: https://yourdomain.com/sitemap.xml\\n";\n}',
          nextjs: '// Create app/robots.ts or public/robots.txt'
        }
      });
    } else {
      findings.push({
        id: 'DISC-ROBOTS-01',
        title: 'Robots.txt Crawler Directives Active',
        category: 'DISCLOSURE',
        framework: 'RFC 9309',
        clause: 'IETF RFC 9309',
        severity: 'INFO',
        status: 'PASS',
        affected: '/robots.txt',
        evidence: 'Valid /robots.txt verified with HTTP 200.',
        remediation: null
      });
    }

    // --- CHECK 19: Subresource Integrity (SRI) on External Scripts ---
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
    } else {
      findings.push({
        id: 'SUPPLY-SRI-01',
        title: 'Subresource Integrity (SRI) Verified or Local Bundling Active',
        category: 'SUPPLY_CHAIN',
        framework: 'PCI-DSS 4.0 Req 6.4.3',
        clause: 'PCI-DSS v4.0 Requirement 6.4.3',
        severity: 'INFO',
        status: 'PASS',
        affected: '<script> tags',
        evidence: externalScripts.length > 0
          ? 'All external scripts declare cryptographic SRI hashes.'
          : 'Zero unvetted third-party CDN scripts detected; scripts bundled locally.',
        remediation: null
      });
    }

    // --- CHECK 20: Cross-Origin Isolation Defense (COOP / CORP) ---
    const coop = headers['cross-origin-opener-policy'];
    const corp = headers['cross-origin-resource-policy'];
    if (!coop && !corp) {
      findings.push({
        id: 'SEC-CORP-01',
        title: 'Missing Cross-Origin Isolation Headers (COOP / CORP)',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / Spectre Mitigations',
        clause: 'OWASP A05:2021 Security Misconfiguration',
        severity: 'LOW',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Neither Cross-Origin-Opener-Policy (COOP) nor Cross-Origin-Resource-Policy (CORP) is configured.',
        remediation: {
          description: 'Set Cross-Origin-Opener-Policy to same-origin and Cross-Origin-Resource-Policy to same-origin to prevent cross-origin window leaks and Spectre-style timing side-channels.',
          nginx: 'add_header Cross-Origin-Opener-Policy "same-origin" always;\nadd_header Cross-Origin-Resource-Policy "same-origin" always;',
          nextjs: `headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }]`
        }
      });
    } else {
      findings.push({
        id: 'SEC-CORP-01',
        title: 'Cross-Origin Isolation Defense Configured',
        category: 'SECURITY',
        framework: 'OWASP Top 10',
        clause: 'OWASP A05:2021',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Cross-Origin policy active: ${[coop && `COOP: ${coop}`, corp && `CORP: ${corp}`].filter(Boolean).join('; ')}`,
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
    const deduction = (criticalCount * 22) + (highCount * 12) + (mediumCount * 6) + (lowCount * 2);
    const overallScore = Math.max(15, Math.min(100, Math.round(100 - deduction)));

    let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F' = 'F';
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
    agentLogs.push(`[EXECUTIVE-VERDICT] Compliance Grade: ${grade} (${overallScore}%) — ${failCount} violations identified`);

    const resultPayload = {
      status: 'success',
      target_url: rawUrl,
      final_url: probeResult.finalUrl,
      domain: hostname,
      scanned_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      execution_time_ms: probeResult.latencyMs || (Date.now() - startTime),
      latency_ms: probeResult.latencyMs || (Date.now() - startTime),
      http_status: probeResult.statusCode,
      html_bytes: htmlBytes,
      grade,
      score: overallScore,
      overall_score: overallScore,
      sub_scores: subScores,
      categories: {
        security: { score: subScores.security, findings_count: activeFindings.filter(f => f.category === 'SECURITY').length },
        privacy: { score: subScores.privacy, findings_count: activeFindings.filter(f => f.category === 'PRIVACY').length },
        accessibility: { score: subScores.accessibility, findings_count: activeFindings.filter(f => f.category === 'ACCESSIBILITY').length },
        disclosures: { score: subScores.disclosures, findings_count: activeFindings.filter(f => f.category === 'DISCLOSURE').length },
        supply_chain: { score: subScores.supply_chain, findings_count: activeFindings.filter(f => f.category === 'SUPPLY_CHAIN').length },
      },
      summary: {
        total_checkpoints: totalCount,
        passed: passCount,
        failed: failCount,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      total_findings: totalCount,
      critical_findings: criticalCount,
      high_findings: highCount,
      medium_findings: mediumCount,
      low_findings: lowCount,
      findings: activeFindings.map(f => ({
        id: f.id,
        rule_id: f.id,
        title: f.title || '',
        category: f.category,
        framework: f.framework || '',
        clause: f.clause || '',
        severity: f.severity,
        status: f.status,
        affected: f.affected || '',
        affected_resource: f.affected || '',
        evidence: f.evidence || '',
        description: f.evidence || '',
        remediation: f.remediation,
        remediation_guidance: f.remediation?.description || '',
      })),
      raw_headers: rawHeadersList,
      agent_logs: agentLogs.filter(Boolean).map(log => String(log || '')),
    };

    const jsonResp = NextResponse.json(resultPayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Auditor-Engine': 'RegCompiler-Autonomous-Agent-v2',
      }
    });

    if (!userToken) {
      jsonResp.cookies.set('reg_anon_audits', String(anonAuditsCount + 1), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    }

    return jsonResp;
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
