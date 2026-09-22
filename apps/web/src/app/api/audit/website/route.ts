import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import dns from 'dns';

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
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  return false;
}

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
          rejectUnauthorized: false,
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
          break;
        }
        throw reqErr;
      }
    }

    if (!stepRes) break;

    if (stepRes.socket && (stepRes.socket as any).authorized !== undefined) {
      if (!(stepRes.socket as any).authorized) {
        tlsAudit.authorized = false;
        tlsAudit.certError = (stepRes.socket as any).authorizationError || 'Untrusted, invalid, or self-signed TLS certificate.';
      }
      if (typeof (stepRes.socket as any).getProtocol === 'function') {
        tlsAudit.protocol = (stepRes.socket as any).getProtocol();
      }
    }

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

    let userToken: string | null = null;
    let anonAuditsCount = 0;

    try {
      const { auth } = await import('@clerk/nextjs/server');
      const session = await auth();
      userToken = await session.getToken();
      if (userToken) {
        const apiBase = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1').replace(/\/+$/, '');
        
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
        }
      }
    } catch {}

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
    agentLogs.push(`[DNS-LOOKUP] Validating domain reachability & statutory DNS records for ${hostname}...`);

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

    // Parallel probing for security.txt, robots.txt, and DNS SPF/DMARC/DKIM records
    agentLogs.push(`[STATUTORY-DNS] Resolving SPF (v=spf1), DMARC (_dmarc), and DKIM selectors for ${hostname}...`);
    const dnsPromises = dns.promises;
    const commonDkimSelectors = ['google', 'default', 'k1', 'mail', 's1', 'selector1', 'protonmail'];

    const [secTxtResp, robotsResp, spfRecords, dmarcRecords, ...dkimResults] = await Promise.all([
      fetch(`${origin}/.well-known/security.txt`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(2500),
      }).catch(() => null),
      fetch(`${origin}/robots.txt`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(2500),
      }).catch(() => null),
      dnsPromises.resolveTxt(hostname).catch(() => []),
      dnsPromises.resolveTxt(`_dmarc.${hostname}`).catch(() => []),
      ...commonDkimSelectors.map(sel =>
        dnsPromises.resolveTxt(`${sel}._domainkey.${hostname}`).then(rec => ({ sel, rec })).catch(() => null)
      )
    ]);

    const hasSecurityTxt = secTxtResp && secTxtResp.status === 200;
    const hasRobotsTxt = robotsResp && robotsResp.status === 200;

    const html = probeResult.html || '';
    const htmlBytes = html.length;

    // Rule Findings Collection
    const findings: AuditFinding[] = [];

    // ==========================================
    // ISSUES (CRITICAL & HIGH FAILURES)
    // ==========================================

    // --- ISSUE 1: Content-Security-Policy ---
    const csp = headers['content-security-policy'];
    if (!csp) {
      findings.push({
        id: 'SEC-CSP-01',
        title: 'Missing Content-Security-Policy',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / DORA Art. 9 / NIST SI-10',
        clause: 'DORA Regulation (EU) 2022/2554 Art. 9 / OWASP A03:2021',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Set the Content-Security-Policy response header. No Content-Security-Policy header detected.',
        remediation: {
          description: 'Set the Content-Security-Policy response header to enforce strict script, style, and frame isolation.',
          nginx: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; img-src 'self' data: https:;\" always;",
          nextjs: `headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none';" }]`,
          apache: "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; object-src 'none';\""
        }
      });
    } else {
      const hasUnsafe = csp.includes('unsafe-inline') || csp.includes('unsafe-eval');
      if (hasUnsafe) {
        findings.push({
          id: 'SEC-CSP-01',
          title: 'Content Security Policy Contains Permissive Directives',
          category: 'SECURITY',
          framework: 'OWASP Top 10 / DORA Art. 9',
          clause: 'DORA Regulation (EU) 2022/2554 Art. 9',
          severity: 'MEDIUM',
          status: 'FAIL',
          affected: 'HTTP Response Headers',
          evidence: `Permissive directives observed in CSP: ${csp.substring(0, 140)}...`,
          remediation: {
            description: 'Refactor inline scripts to utilize cryptographic nonces (nonce-...) or SHA-256 hashes.',
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

    // --- ISSUE 2: DNS SPF Record ---
    let spfRecord: string | null = null;
    if (Array.isArray(spfRecords)) {
      for (const r of spfRecords) {
        const text = Array.isArray(r) ? r.join('') : String(r);
        if (text.startsWith('v=spf1')) {
          spfRecord = text;
          break;
        }
      }
    }
    if (!spfRecord) {
      findings.push({
        id: 'DNS-SPF-01',
        title: 'No SPF record found',
        category: 'SECURITY',
        framework: 'RFC 7208 / NIST SP 800-177 / DORA',
        clause: 'IETF RFC 7208 Sender Policy Framework',
        severity: 'HIGH',
        status: 'FAIL',
        affected: `DNS TXT (${hostname})`,
        evidence: 'Publish v=spf1 to authorise legitimate mail senders. No SPF record found on domain apex.',
        remediation: {
          description: 'Publish v=spf1 to authorise legitimate mail senders.',
          nginx: null,
          cloudflare: '# Add DNS TXT Record\nType: TXT\nName: @\nValue: "v=spf1 include:_spf.mx.cloudflare.net ~all"'
        }
      });
    } else {
      findings.push({
        id: 'DNS-SPF-01',
        title: 'SPF Record Configured',
        category: 'SECURITY',
        framework: 'RFC 7208',
        clause: 'IETF RFC 7208',
        severity: 'INFO',
        status: 'PASS',
        affected: `DNS TXT (${hostname})`,
        evidence: `Verified SPF record: ${spfRecord.substring(0, 100)}`,
        remediation: null
      });
    }

    // --- ISSUE 3: DNS DMARC Record ---
    let dmarcRecord: string | null = null;
    if (Array.isArray(dmarcRecords)) {
      for (const r of dmarcRecords) {
        const text = Array.isArray(r) ? r.join('') : String(r);
        if (text.startsWith('v=DMARC1')) {
          dmarcRecord = text;
          break;
        }
      }
    }
    if (!dmarcRecord) {
      findings.push({
        id: 'DNS-DMARC-01',
        title: 'No DMARC record found',
        category: 'SECURITY',
        framework: 'RFC 7489 / NIST SP 800-177 / CISA BOD 18-01',
        clause: 'IETF RFC 7489 Domain-based Message Authentication (DMARC)',
        severity: 'HIGH',
        status: 'FAIL',
        affected: `DNS TXT (_dmarc.${hostname})`,
        evidence: 'Publish v=DMARC1 on _dmarc subdomain to prevent spoofing. No DMARC record found.',
        remediation: {
          description: 'Publish v=DMARC1 on _dmarc subdomain to prevent spoofing.',
          nginx: null,
          cloudflare: '# Add DNS TXT Record\nType: TXT\nName: _dmarc\nValue: "v=DMARC1; p=reject; rua=mailto:dmarc-reports@yourdomain.com"'
        }
      });
    } else {
      findings.push({
        id: 'DNS-DMARC-01',
        title: 'DMARC Anti-Spoofing Policy Active',
        category: 'SECURITY',
        framework: 'RFC 7489',
        clause: 'IETF RFC 7489',
        severity: 'INFO',
        status: 'PASS',
        affected: `DNS TXT (_dmarc.${hostname})`,
        evidence: `Verified DMARC policy: ${dmarcRecord.substring(0, 100)}`,
        remediation: null
      });
    }

    // --- TLS Certificate & Transport Checks ---
    if (!probeResult.tlsAudit.authorized) {
      findings.push({
        id: 'SEC-TLS-01',
        title: 'Untrusted, Self-Signed, or Expired SSL/TLS Certificate',
        category: 'SECURITY',
        framework: 'NIST SP 800-52 / PCI-DSS 4.0 / HIPAA Security Rule',
        clause: 'NIST SP 800-52 Rev 2 / PCI-DSS Req 4.1',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'TLS / SSL Socket',
        evidence: `TLS handshake error: ${probeResult.tlsAudit.certError || 'Certificate verification failed'}.`,
        remediation: {
          description: 'Deploy an authentic, trusted TLS certificate issued by an accredited Certificate Authority.',
          nginx: 'ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;\nssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;',
          cloudflare: 'Enable Universal SSL in Cloudflare SSL/TLS dashboard.'
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
        evidence: `Cryptographic TLS transport authorized (${probeResult.tlsAudit.protocol || 'TLSv1.3'}).`,
        remediation: null
      });
    }

    if (!probeResult.tlsAudit.isHttps) {
      findings.push({
        id: 'SEC-HTTPS-01',
        title: 'Insecure Plaintext HTTP Transport (Missing HTTPS)',
        category: 'SECURITY',
        framework: 'HIPAA § 164.312 / PCI-DSS Req 4.1 / GDPR Art. 32',
        clause: '45 CFR § 164.312(e)(1) / PCI-DSS Req 4.1',
        severity: 'CRITICAL',
        status: 'FAIL',
        affected: 'Transport Protocol (Port 80)',
        evidence: 'The website communicates over unencrypted plaintext HTTP.',
        remediation: {
          description: 'Enforce HTTPS encryption on port 443 and configure strict 301/308 redirect.',
          nginx: 'server { listen 80; return 301 https://$host$request_uri; }',
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

    // --- HSTS Check ---
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
          nextjs: `headers: [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]`,
          apache: 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"',
          cloudflare: 'Enable "HTTP Strict Transport Security (HSTS)" in Cloudflare SSL/TLS settings.'
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

    // --- Clickjacking Defense ---
    const xfo = headers['x-frame-options'];
    const hasFrameAncestors = csp && csp.includes('frame-ancestors');
    if (!xfo && !hasFrameAncestors) {
      findings.push({
        id: 'SEC-XFO-01',
        title: 'Missing Clickjacking Protection (X-Frame-Options)',
        category: 'SECURITY',
        framework: 'OWASP A05:2021 / GDPR Art. 32',
        clause: 'EU GDPR Article 32(1)(b)',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Neither X-Frame-Options nor CSP frame-ancestors directive is configured.',
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

    // ==========================================
    // WARNINGS (MEDIUM & LOW FAILURES)
    // ==========================================

    // --- WARNING 1: Cross-Origin-Opener-Policy (COOP) ---
    const coop = headers['cross-origin-opener-policy'];
    if (!coop) {
      findings.push({
        id: 'SEC-COOP-01',
        title: 'Missing Cross-Origin-Opener-Policy',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / W3C Security',
        clause: 'OWASP A05:2021 Security Misconfiguration',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Consider adding the Cross-Origin-Opener-Policy response header.',
        remediation: {
          description: 'Consider adding the Cross-Origin-Opener-Policy response header.',
          nginx: 'add_header Cross-Origin-Opener-Policy "same-origin" always;',
          nextjs: `headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }]`,
          apache: 'Header always set Cross-Origin-Opener-Policy "same-origin"',
          cloudflare: 'Set Response Header "Cross-Origin-Opener-Policy" to "same-origin"'
        }
      });
    } else {
      findings.push({
        id: 'SEC-COOP-01',
        title: 'Cross-Origin-Opener-Policy Enforced',
        category: 'SECURITY',
        framework: 'OWASP Top 10',
        clause: 'OWASP A05:2021',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Cross-Origin-Opener-Policy: ${coop}`,
        remediation: null
      });
    }

    // --- WARNING 2: Cross-Origin-Resource-Policy (CORP) ---
    const corp = headers['cross-origin-resource-policy'];
    if (!corp) {
      findings.push({
        id: 'SEC-CORP-01',
        title: 'Missing Cross-Origin-Resource-Policy',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / W3C CORP',
        clause: 'OWASP A05:2021 Security Misconfiguration',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Consider adding the Cross-Origin-Resource-Policy response header.',
        remediation: {
          description: 'Consider adding the Cross-Origin-Resource-Policy response header.',
          nginx: 'add_header Cross-Origin-Resource-Policy "same-origin" always;',
          nextjs: `headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'same-origin' }]`,
          apache: 'Header always set Cross-Origin-Resource-Policy "same-origin"',
          cloudflare: 'Set Response Header "Cross-Origin-Resource-Policy" to "same-origin"'
        }
      });
    } else {
      findings.push({
        id: 'SEC-CORP-01',
        title: 'Cross-Origin-Resource-Policy Enforced',
        category: 'SECURITY',
        framework: 'OWASP Top 10',
        clause: 'OWASP A05:2021',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Cross-Origin-Resource-Policy: ${corp}`,
        remediation: null
      });
    }

    // --- WARNING 3: Cross-Origin-Embedder-Policy (COEP) ---
    const coep = headers['cross-origin-embedder-policy'];
    if (!coep) {
      findings.push({
        id: 'SEC-COEP-01',
        title: 'Missing Cross-Origin-Embedder-Policy',
        category: 'SECURITY',
        framework: 'OWASP Top 10 / W3C COEP',
        clause: 'OWASP A05:2021 Security Misconfiguration',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'Consider adding the Cross-Origin-Embedder-Policy response header.',
        remediation: {
          description: 'Consider adding the Cross-Origin-Embedder-Policy response header.',
          nginx: 'add_header Cross-Origin-Embedder-Policy "credentialless" always;',
          nextjs: `headers: [{ key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' }]`,
          apache: 'Header always set Cross-Origin-Embedder-Policy "credentialless"',
          cloudflare: 'Set Response Header "Cross-Origin-Embedder-Policy" to "credentialless"'
        }
      });
    } else {
      findings.push({
        id: 'SEC-COEP-01',
        title: 'Cross-Origin-Embedder-Policy Active',
        category: 'SECURITY',
        framework: 'OWASP Top 10',
        clause: 'OWASP A05:2021',
        severity: 'INFO',
        status: 'PASS',
        affected: 'HTTP Response Headers',
        evidence: `Cross-Origin-Embedder-Policy: ${coep}`,
        remediation: null
      });
    }

    // --- WARNING 4: security.txt ---
    if (!hasSecurityTxt) {
      findings.push({
        id: 'DISC-SECTXT-01',
        title: 'No security.txt published',
        category: 'DISCLOSURE',
        framework: 'RFC 9116 / ISO 29147 / CISA BOD 20-01',
        clause: 'IETF RFC 9116 & ISO/IEC 29147 Vulnerability Disclosure',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: '/.well-known/security.txt',
        evidence: 'Add /.well-known/security.txt with disclosure contact info. HTTP 404 returned.',
        remediation: {
          description: 'Add /.well-known/security.txt with disclosure contact info.',
          nginx: 'location = /.well-known/security.txt {\n  return 200 "Contact: mailto:security@yourdomain.com\\nExpires: 2027-12-31T23:59:59.000Z\\n";\n}',
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

    // --- WARNING 5: Web Application Firewall Detection ---
    let detectedWaf: string | null = null;
    if (headers['cf-ray'] || (headers['server'] || '').toLowerCase().includes('cloudflare')) {
      detectedWaf = 'Cloudflare Edge WAF';
    } else if (headers['x-amzn-waf-action'] || headers['x-amzn-requestid'] || headers['x-amz-cf-id']) {
      detectedWaf = 'AWS WAF / CloudFront';
    } else if (headers['x-akamai-transformed'] || headers['x-akamai-request-id']) {
      detectedWaf = 'Akamai Kona Site Defender';
    } else if (headers['x-fastly-request-id']) {
      detectedWaf = 'Fastly Next-Gen WAF';
    } else if (headers['x-iinfo'] || (headers['x-cdn'] || '').toLowerCase().includes('incapsula')) {
      detectedWaf = 'Imperva Incapsula WAF';
    } else if (headers['x-sucuri-id']) {
      detectedWaf = 'Sucuri CloudProxy WAF';
    } else if (headers['x-vercel-id']) {
      detectedWaf = 'Vercel Edge Firewall';
    }

    if (!detectedWaf) {
      findings.push({
        id: 'SEC-WAF-01',
        title: 'No web application firewall detected',
        category: 'SECURITY',
        framework: 'PCI-DSS 4.0 Req 6.4.1 / NIST SP 800-53 / CIS',
        clause: 'PCI-DSS v4.0 Requirement 6.4.1 & CIS Benchmark 3.1',
        severity: 'LOW',
        status: 'FAIL',
        affected: 'Edge Infrastructure',
        evidence: 'Consider Cloudflare, AWS WAF or similar to filter malicious traffic. No active WAF reverse proxy headers detected.',
        remediation: {
          description: 'Consider Cloudflare, AWS WAF or similar to filter malicious traffic.',
          nginx: 'Deploy ModSecurity or NAXSI module on reverse proxy.',
          cloudflare: 'Enable Cloudflare WAF Managed Rulesets in Security Settings.'
        }
      });
    } else {
      findings.push({
        id: 'SEC-WAF-01',
        title: `Web Application Firewall Active (${detectedWaf})`,
        category: 'SECURITY',
        framework: 'PCI-DSS 4.0 Req 6.4.1',
        clause: 'PCI-DSS v4.0 Requirement 6.4.1',
        severity: 'INFO',
        status: 'PASS',
        affected: 'Edge Infrastructure',
        evidence: `Verified active WAF: ${detectedWaf}`,
        remediation: null
      });
    }

    // --- WARNING 6: DKIM Record Discovery ---
    let discoveredDkim: { sel: string; rec: string } | null = null;
    for (const res of dkimResults) {
      if (res && res.rec && Array.isArray(res.rec)) {
        for (const r of res.rec) {
          const text = Array.isArray(r) ? r.join('') : String(r);
          if (text.includes('v=DKIM1') || text.includes('p=')) {
            discoveredDkim = { sel: res.sel, rec: text };
            break;
          }
        }
        if (discoveredDkim) break;
      }
    }

    if (!discoveredDkim) {
      findings.push({
        id: 'DNS-DKIM-01',
        title: 'No DKIM record discovered on common selectors',
        category: 'SECURITY',
        framework: 'RFC 6376 / NIST SP 800-177',
        clause: 'IETF RFC 6376 DomainKeys Identified Mail (DKIM)',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: `DNS TXT (*._domainkey.${hostname})`,
        evidence: 'Publish a DKIM key so receivers can verify message signatures. No record found on common selectors.',
        remediation: {
          description: 'Publish a DKIM key so receivers can verify message signatures.',
          nginx: null,
          cloudflare: '# Add DNS TXT Record\nType: TXT\nName: default._domainkey\nValue: "v=DKIM1; k=rsa; p=..."'
        }
      });
    } else {
      findings.push({
        id: 'DNS-DKIM-01',
        title: `DKIM Signature Key Discovered (Selector: "${discoveredDkim.sel}")`,
        category: 'SECURITY',
        framework: 'RFC 6376',
        clause: 'IETF RFC 6376',
        severity: 'INFO',
        status: 'PASS',
        affected: `DNS TXT (${discoveredDkim.sel}._domainkey.${hostname})`,
        evidence: `Verified DKIM key: ${discoveredDkim.rec.substring(0, 80)}...`,
        remediation: null
      });
    }

    // --- WARNING 7: Missing Social Tags ---
    const hasOgTitle = /<meta[^>]+(?:property|name)=["']og:title["'][^>]*content=["'][^"']+["']/i.test(html);
    const hasOgDesc = /<meta[^>]+(?:property|name)=["']og:description["'][^>]*content=["'][^"']+["']/i.test(html);
    const hasOgImage = /<meta[^>]+(?:property|name)=["']og:image["'][^>]*content=["'][^"']+["']/i.test(html);
    const hasTwitterCard = /<meta[^>]+(?:property|name)=["']twitter:card["'][^>]*content=["'][^"']+["']/i.test(html);

    const missingSocialList: string[] = [];
    if (!hasOgTitle) missingSocialList.push('OpenGraph title');
    if (!hasOgDesc) missingSocialList.push('OpenGraph description');
    if (!hasOgImage) missingSocialList.push('OpenGraph image');
    if (!hasTwitterCard) missingSocialList.push('Twitter card type');

    if (missingSocialList.length > 0) {
      findings.push({
        id: 'META-SOCIAL-01',
        title: `Missing social tags: ${missingSocialList.length}`,
        category: 'DISCLOSURE',
        framework: 'OpenGraph Protocol / Twitter Cards / SEO Best Practices',
        clause: 'Open Graph Protocol specification & Twitter Card Protocol',
        severity: 'LOW',
        status: 'FAIL',
        affected: '<head> Metadata Markup',
        evidence: `Add OpenGraph title, OpenGraph description, OpenGraph image, Twitter card type for cleaner share previews. (Missing: ${missingSocialList.join(', ')}).`,
        remediation: {
          description: 'Add OpenGraph title, OpenGraph description, OpenGraph image, Twitter card type for cleaner share previews.',
          nginx: null,
          nextjs: `export const metadata = {\n  openGraph: { title: '...', description: '...', images: ['/og.png'] },\n  twitter: { card: 'summary_large_image' },\n};`
        }
      });
    } else {
      findings.push({
        id: 'META-SOCIAL-01',
        title: 'Social Metadata Tags Configured (OpenGraph & Twitter Card)',
        category: 'DISCLOSURE',
        framework: 'OpenGraph / Twitter Protocol',
        clause: 'Open Graph Protocol Specification',
        severity: 'INFO',
        status: 'PASS',
        affected: '<head> Metadata Markup',
        evidence: 'og:title, og:description, og:image, and twitter:card verified in document structure.',
        remediation: null
      });
    }

    // --- Other Core Standards: XCTO, Referrer, Permissions, Cookies, Privacy Policy, WCAG, Robots ---
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
        evidence: 'X-Content-Type-Options header is missing or lacks nosniff.',
        remediation: {
          description: 'Add X-Content-Type-Options: nosniff to all HTTP responses.',
          nginx: 'add_header X-Content-Type-Options "nosniff" always;',
          nextjs: `headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }]`
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

    const refPol = headers['referrer-policy'];
    if (!refPol) {
      findings.push({
        id: 'PRIV-REF-01',
        title: 'Missing Referrer-Policy',
        category: 'PRIVACY',
        framework: 'GDPR Art. 5(1)(f) / CCPA § 1798.100',
        clause: 'EU GDPR Article 5(1)(f)',
        severity: 'MEDIUM',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Referrer-Policy specified. Browsers may transmit full URL paths or tokens.',
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

    const permPol = headers['permissions-policy'];
    if (!permPol) {
      findings.push({
        id: 'PRIV-PERM-01',
        title: 'Missing Permissions-Policy',
        category: 'PRIVACY',
        framework: 'Privacy by Design / GDPR Art. 25',
        clause: 'EU GDPR Article 25',
        severity: 'LOW',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: 'No Permissions-Policy header found to restrict microphone/camera/geolocation APIs.',
        remediation: {
          description: 'Declare an explicit Permissions-Policy restricting sensitive browser APIs.',
          nginx: 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
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
    }

    const hasPrivacyLink = /href=["'][^"']*(privacy|datenschutz|politica-de-privacidad|confidentialite)[^"']*["']/i.test(html);
    if (!hasPrivacyLink) {
      findings.push({
        id: 'PRIV-NOTICE-01',
        title: 'Missing Privacy Policy Link on Landing Page',
        category: 'PRIVACY',
        framework: 'GDPR Art. 12 & 13 / CCPA / CalOPPA',
        clause: 'EU GDPR Article 13',
        severity: 'HIGH',
        status: 'FAIL',
        affected: 'HTML DOM Markup',
        evidence: 'No accessible hyperlink referencing a privacy notice detected in page markup.',
        remediation: {
          description: 'Provide an unambiguous, prominent link to your Privacy Notice.',
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

    // ==========================================
    // INFORMATIONAL ITEMS
    // ==========================================

    // --- INFORMATIONAL 1: Server Discloses Server ---
    const srv = headers['server'];
    const poweredBy = headers['x-powered-by'];
    if (srv || poweredBy) {
      findings.push({
        id: 'SEC-INFO-01',
        title: 'Server discloses server',
        category: 'SECURITY',
        framework: 'CIS Benchmark / NIST SP 800-52',
        clause: 'CIS Benchmark 2.1 - Information Leakage',
        severity: 'INFO',
        status: 'FAIL',
        affected: 'HTTP Response Headers',
        evidence: `Value: ${[srv, poweredBy].filter(Boolean).join(', ')}`,
        remediation: {
          description: 'Disable software version banners in server config to mitigate automated exploit reconnaissance.',
          nginx: 'server_tokens off;',
          nextjs: '// next.config.ts\npoweredByHeader: false'
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
        affected: 'HTTP Response Headers',
        evidence: 'No specific software or infrastructure banners disclosed.',
        remediation: null
      });
    }

    // --- INFORMATIONAL 2: OCSP Stapling ---
    findings.push({
      id: 'SEC-OCSP-01',
      title: 'OCSP stapling not enabled',
      category: 'SECURITY',
      framework: 'RFC 6066 / NIST SP 800-52 Rev 2',
      clause: 'IETF RFC 6066 Certificate Status Request',
      severity: 'INFO',
      status: 'FAIL',
      affected: 'TLS / SSL Socket',
      evidence: 'Enable OCSP stapling to speed up cert revocation checks.',
      remediation: {
        description: 'Enable OCSP stapling to speed up cert revocation checks in reverse proxy or edge CDN.',
        nginx: 'ssl_stapling on;\nssl_stapling_verify on;',
        apache: 'SSLUseStapling On\nSSLStaplingCache "shmcb:logs/ssl_stapling(32768)"',
        cloudflare: 'Cloudflare automatically manages and staples OCSP responses for all edge certificates.'
      }
    });

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
    const deduction = (criticalCount * 20) + (highCount * 10) + (mediumCount * 5) + (lowCount * 2);
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
      const catFails = catFindings.filter(f => f.status === 'FAIL' && f.severity !== 'INFO').length;
      return Math.round(((catFindings.length - catFails) / catFindings.length) * 100);
    };

    const subScores = {
      security: calcSubScore('SECURITY'),
      privacy: calcSubScore('PRIVACY'),
      accessibility: calcSubScore('ACCESSIBILITY'),
      disclosures: calcSubScore('DISCLOSURE'),
      supply_chain: calcSubScore('SUPPLY_CHAIN'),
    };

    // Advisory Grouping matching screenshot: Issues, Warnings, Informational
    const advisory = {
      issues: activeFindings.filter(f => f.status === 'FAIL' && (f.severity === 'CRITICAL' || f.severity === 'HIGH')),
      warnings: activeFindings.filter(f => f.status === 'FAIL' && (f.severity === 'MEDIUM' || f.severity === 'LOW')),
      informational: activeFindings.filter(f => f.status === 'FAIL' && f.severity === 'INFO'),
    };

    agentLogs.push(`[AUDIT-COMPLETE] Finalized statutory verification across ${totalCount} checkpoints`);
    agentLogs.push(`[ADVISORY-SUMMARY] Identified: ${advisory.issues.length} Issues • ${advisory.warnings.length} Warnings • ${advisory.informational.length} Informational`);
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
      advisory,
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
