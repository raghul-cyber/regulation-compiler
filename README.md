<div align="center">
  <img src="apps/web/public/logo.png" width="240" alt="RegCompiler Logo" style="border-radius: 12px; margin-bottom: 12px;" />
  <br />
  <img src="https://readme-typing-svg.demolab.com?font=Inter&size=24&pause=1000&color=3B82F6&center=true&vCenter=true&width=600&lines=Regulation-as-Code+Compiler;Turning+Regulatory+Text+Into+Enforceable+Policy;GDPR+%E2%86%92+Structured+JSON+%E2%86%92+Enforceable+API;Compliance+in+Minutes%2C+Not+Months" alt="Typing SVG" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://github.com/raghul-cyber/regulation-compiler/actions/workflows/ci.yml/badge.svg" alt="Build Status" />
  <img src="https://img.shields.io/github/v/release/raghul-cyber/regulation-compiler" alt="Latest Release" />
  <img src="https://img.shields.io/github/issues/raghul-cyber/regulation-compiler" alt="Open Issues" />
  <img src="https://img.shields.io/github/stars/raghul-cyber/regulation-compiler" alt="Stars" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
</div>

<div align="center">
  <br />
  <img src="https://skillicons.dev/icons?i=nextjs,ts,tailwind,threejs,python,fastapi,postgres,redis,docker" alt="Tech Stack" />
</div>

<div align="center">
  <h3><em>An autonomous AI pipeline that translates raw legal text into programmatic, enforceable compliance rules.</em></h3>
</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0f1115&height=120&section=header" width="100%" />

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Website Compliance Audits](#website-compliance-audits)
  - [Auditor Architecture](#auditor-architecture)
  - [End-to-End Audit Workflow](#end-to-end-audit-workflow)
  - [Compliance Checkpoints & Regulatory Framework Matrix](#compliance-checkpoints--regulatory-framework-matrix)
  - [Multi-Platform Automated Remediation Engine](#multi-platform-automated-remediation-engine)
  - [Scoring & Executive Grading Engine](#scoring--executive-grading-engine)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Usage Limits & Monetization (Dodo Payments)](#usage-limits--monetization-dodo-payments)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Security & Compliance Posture](#security--compliance-posture)
- [Contributing](#contributing)
- [License](#license)

## Overview

Modern software teams spend countless hours mapping ambiguous legal text (GDPR, SOC 2, HIPAA) to engineering constraints. This manual translation chain—from lawyers to product managers to engineers—is slow, error-prone, and impossible to scale. When regulations update, the entire mapping process restarts.

The **Regulation-as-Code Compiler** eliminates this translation layer. It ingests official regulatory documents (PDFs, URLs), utilizes advanced NLP and Large Language Models to extract specific obligations, and compiles them into a structured, enforceable **Policy AST (Abstract Syntax Tree)**. 

> *"Stop reading PDFs. Start querying policies. We turn the law into an API so your engineering team can build compliant software by default."*

## Architecture

### System Flow
```mermaid
flowchart TD
    A[Official Regulations] --> B[Document Ingestion]
    B --> C[OCR/Text Extraction]
    C --> D[Legal NLP Pipeline]
    D --> E[Requirement Extraction]
    E --> F[Knowledge Graph]
    F --> G[Rule Compiler]
    G --> H[Policy AST]
    H --> I[Validation Engine]
    I --> J[(Policy Database)]
    J --> K[Developer API]
    K --> L[Enterprise Integrations]
```

### Layered Architecture
```mermaid
flowchart TB
    subgraph Client [Client Layer]
        UI[Next.js Web App]
    end

    subgraph API [API Layer]
        FastAPI[FastAPI Gateway]
    end

    subgraph Background [Background Workers]
        Celery[Celery Task Queue]
    end

    subgraph Data [Data Layer]
        PG[(PostgreSQL + pgvector)]
        Redis[(Redis Cache/Broker)]
    end

    subgraph External [External Services]
        LLM[Google Gemini LLM]
    end

    UI -- "Upload PDF" --> FastAPI
    FastAPI -- "Enqueue Job" --> Redis
    Redis -- "Consume" --> Celery
    Celery -- "Extract Policies" --> LLM
    Celery -- "Store Embeddings/Rules" --> PG
```

### Data Model ER Diagram
```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ regulations : "manages"
    regulations ||--o{ regulation_versions : "has"
    regulation_versions ||--o{ source_documents : "derived from"
    source_documents ||--o{ document_sections : "contains"
    document_sections ||--o{ requirements : "generates"
    requirements ||--o{ policies : "mapped to"
    requirements ||--o{ requirement_embeddings : "vectorizes"
    policies ||--o{ compliance_checks : "validates"
    system_mappings }|--|| requirements : "links to"
```

**How a document flows:**
1. A user uploads a regulation via the **Client Layer** (`source_documents`).
2. The **API Layer** enqueues a parsing job to the **Background Workers**.
3. PyMuPDF extracts `document_sections`. The **LLM** extracts `requirements`.
4. The system compiles `policies` and generates `requirement_embeddings`.
5. Developers hit the API to run `compliance_checks` against their system configurations.

## Website Compliance Audits

The **Autonomous Website Compliance Auditor** evaluates live external web surfaces against global regulatory frameworks and security baselines. Entering any public domain (e.g., `stripe.com`, `github.com`) triggers an agentic probing sequence that analyzes transport encryption, cryptographic response headers, cookie privacy directives, statutory security files, DNS perimeter defenses, and accessibility attributes.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client & User Interface"]
        UI["Next.js Auditor Dashboard"]
        Terminal["Live Agent Console"]
        Dossier["Advisory Dossier & Code Tabs"]
        ReportDL["JSON Audit Exporter"]
    end

    subgraph Gatekeeping ["Security & Gatekeeping"]
        SSRF["Anti-SSRF & DNS Guard (Filter RFC 1918 / Loopback)"]
        Quota["Clerk JWT & Atomic Quota Gate (PostgreSQL Row Lock)"]
        Paywall{"Free Uses <= 3?"}
        DodoPay["Dodo Payments Paywall (HTTP 402 Payment Required)"]
    end

    subgraph ProbingEngine ["Autonomous Probing Engine"]
        direction TB
        Socket["Network & TLS Socket Inspector (Cipher Suites, CA, Expiry)"]
        Headers["HTTP Header Harvester (CSP, HSTS, XFO, XCTO, COOP)"]
        CookieJar["Cookie Jar & Flag Inspector (Secure, HttpOnly, SameSite)"]
        DNS["Statutory DNS Resolver (SPF, DMARC, DKIM Selectors)"]
        WellKnown["Well-Known Protocol Prober (security.txt, robots.txt)"]
        DOMScan["DOM & Semantic Markup Scanner (Privacy Links, OpenGraph)"]
    end

    subgraph EvaluationEngine ["Compliance & Remediation Engine"]
        RulesMatrix["Statutory Policy Matrix (GDPR, HIPAA, SOC 2, PCI-DSS, DORA, NIST)"]
        PenaltyCalc["Weighted Deduction Engine (Score 15-100%, Grade A+ to F)"]
        Advisory["Advisory Categorizer (Issues, Warnings, Informational)"]
        RemediationGen["Multi-Platform Remediation Generator (Nginx, Next.js, Apache, Cloudflare)"]
    end

    UI --> SSRF
    SSRF --> Quota
    Quota --> Paywall
    Paywall -- "Exhausted" --> DodoPay
    Paywall -- "Granted" --> Socket

    Socket --> Headers
    Socket --> CookieJar
    Socket --> DNS
    Socket --> WellKnown
    Socket --> DOMScan

    Headers --> RulesMatrix
    CookieJar --> RulesMatrix
    DNS --> RulesMatrix
    WellKnown --> RulesMatrix
    DOMScan --> RulesMatrix

    RulesMatrix --> PenaltyCalc
    PenaltyCalc --> Advisory
    Advisory --> RemediationGen

    RemediationGen --> Terminal
    RemediationGen --> Dossier
    RemediationGen --> ReportDL
```

---

### Auditor Architecture

The Website Compliance Auditor combines high-performance network probing with statutory rule validation:

1. **Anti-SSRF & Network Boundary Protection**:
   - Every input URL undergoes strict RFC 3986 syntax normalization.
   - Hostnames are resolved and evaluated against private, loopback, and internal subnet masks (`127.0.0.1`, `0.0.0.0`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `.internal`, `.local`). Requests targeting internal networks are immediately halted.

2. **Atomic Entitlement & Metered Ledger Integration**:
   - Integrates with the backend billing system via `operation_type="website_audit"`.
   - Authenticated requests verify quotas via atomic PostgreSQL row-locks (`SELECT ... FOR UPDATE`), reserving an operation before execution.
   - Anonymous requests are tracked via secure HTTP cookies capped at 3 complimentary scans. Exhausted quotas return HTTP `402 Payment Required`, triggering the hosted **Dodo Payments** paywall modal.

3. **Multi-Hop Traversal & Socket Inspection (`robustWebsiteProbe`)**:
   - Executes non-blocking HTTP/HTTPS handshakes using Chromium user agents.
   - Automatically follows up to 8 HTTP 301/302/307/308 redirects while accumulating cookie jars and intermediate header states.
   - Inspects the underlying TLS socket for certificate validity, trusted Certificate Authority (CA) chain, handshake errors, and negotiated protocol versions (TLSv1.2, TLSv1.3).

4. **Parallel Statutory & DNS Probing**:
   - Utilizes `Promise.all` for non-blocking concurrent resolution:
     - **DNS TXT Records**: Resolves domain apex for Sender Policy Framework (`v=spf1`), `_dmarc.<domain>` for DMARC anti-spoofing policies (`v=DMARC1`), and tests common DKIM selectors (`google`, `default`, `k1`, `mail`, `s1`, `selector1`, `protonmail`) on `*._domainkey.<domain>`.
     - **Well-Known Files**: Probes `/.well-known/security.txt` (RFC 9116 / ISO 29147) and `/robots.txt`.
     - **DOM Markup Inspection**: Analyzes the HTML body for accessible GDPR Article 13 privacy policy hyperlinks, OpenGraph tags (`og:title`, `og:description`, `og:image`), and Twitter Card metadata.

5. **Multi-Platform Automated Remediation Generator**:
   - Generates drop-in server configuration blocks across 4 targets:
     - **Nginx**: `add_header`, `proxy_cookie_path`, `ssl_stapling`, `server_tokens off`.
     - **Next.js**: Security headers in `next.config.ts`, metadata API configuration, and cookie options.
     - **Apache HTTPD**: `Header always set`, `SSLUseStapling`.
     - **Cloudflare**: DNS TXT records, WAF managed rules, and Edge Certificate toggles.

---

### End-to-End Audit Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Auditor as Security Engineer / Auditor
    participant UI as Next.js Web Auditor UI
    participant API as Audit API Route (/api/audit/website)
    participant DB as PostgreSQL Billing Ledger
    participant Target as Target Host & TLS Socket
    participant DNS as Statutory DNS Resolver
    participant Engine as Policy & Scoring Engine

    Auditor->>UI: Enters URL (e.g., https://stripe.com) & selects frameworks
    UI->>API: POST /api/audit/website { url, frameworks, scan_depth }
    API->>API: Anti-SSRF check: validate public hostname & protocol

    alt Authenticated Session
        API->>DB: POST /billing/reserve-usage (operation_type: website_audit)
        DB-->>API: Quota confirmed (or HTTP 402 Paywall)
    else Anonymous Session
        API->>API: Validate reg_anon_audits cookie (<= 3 Free Scans)
    end

    par Parallel Inspection Pipeline
        API->>Target: Probe TLS handshake & follow redirects (up to 8 hops)
        Target-->>API: TLS socket, HTTP status, response headers, cookie jar, HTML DOM
    and Parallel DNS Resolution
        API->>DNS: Resolve SPF (TXT @), DMARC (TXT _dmarc), DKIM selectors
        DNS-->>API: DNS Resource Records
    and Statutory Resource Fetch
        API->>Target: GET /.well-known/security.txt & /robots.txt
        Target-->>API: Statutory file status & contents
    end

    API->>Engine: Evaluate 21+ compliance checkpoints against gathered telemetry
    Engine->>Engine: Calculate weighted penalty score (15-100%) & assign grade (A+ to F)
    Engine->>Engine: Group findings into Advisory Dossier (Issues, Warnings, Informational)
    Engine->>Engine: Synthesize code remediation snippets (Nginx, Next.js, Apache, Cloudflare)
    Engine-->>API: Complete audit artifact payload
    API-->>UI: HTTP 200 JSON Response
    UI->>Auditor: Render interactive grade badge, advisory tabs, code blocks, and JSON export
```

#### Detailed Workflow Stages:
1. **Target Ingestion & Normalization**: User inputs a target domain or URL. The frontend normalizes the protocol scheme and framework filters (`ALL`, `GDPR`, `HIPAA`, `SOC 2`, `PCI-DSS`, `ISO 27001`, `DORA`, `NIST`, `WCAG 2.1`).
2. **Entitlement & Quota Verification**: Before dispatching external network calls, the API invokes the organization quota manager. Organizations with active Pro plans or remaining free credits proceed; expired free tiers trigger an upgrade paywall.
3. **Autonomous Socket & Network Probing**: The prober initiates an HTTP/HTTPS handshake, verifies SSL/TLS authenticity, captures protocol versions, follows redirects, and records latency.
4. **Concurrent Statutory Probing**: Simultaneously executes DNS lookups for SPF, DMARC, and DKIM, while testing standard paths (`/.well-known/security.txt`, `/robots.txt`).
5. **Rule Compilation & Verification**: The collected evidence is evaluated against statutory checkpoints. Each check produces an `AuditFinding` containing rule ID, category, legal clause, evidence string, severity, and status (`PASS` or `FAIL`).
6. **Executive Scoring & Advisory Sorting**: Weighted deductions are applied to establish the overall compliance score (15–100%) and letter grade (A+ to F). Findings are organized into an **Advisory Dossier**:
   - **Issues**: Critical and High severity violations requiring immediate remediation.
   - **Warnings**: Medium and Low severity items affecting defense-in-depth posture.
   - **Informational**: Hardening recommendations and verified best practices.
7. **Multi-Platform Code Remediation**: The engine synthesizes ready-to-paste configuration directives for the user's infrastructure stack (Nginx, Next.js, Apache, Cloudflare).
8. **Export & Report Delivery**: The interactive dashboard renders the full report with copyable code snippets, live agent console logs, and instant download of the complete JSON audit dossier.

---

### Compliance Checkpoints & Regulatory Framework Matrix

The auditor evaluates 21 primary compliance checkpoints across 5 categories:

| Checkpoint ID | Capability / Inspection | Category | Severity | Statutory Frameworks & Legal Clauses | Verification Logic & Evidence | Supported Remediations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-CSP-01` | Content-Security-Policy | Security | Critical / Med | OWASP A03:2021, DORA Art. 9, NIST SI-10 | Validates presence of `Content-Security-Policy`; flags missing policy or `unsafe-inline` / `unsafe-eval` directives | Nginx, Next.js, Apache |
| `SEC-HTTPS-01` | Plaintext HTTP Transport | Security | Critical | GDPR Art. 32(1)(a), HIPAA § 164.312, PCI-DSS Req 4.1 | Verifies port 443 HTTPS enforcement and 301/308 redirect from plaintext HTTP | Nginx, Cloudflare |
| `SEC-TLS-01` | SSL/TLS Certificate Validity | Security | Critical | NIST SP 800-52 Rev 2, PCI-DSS 4.0 | Evaluates socket authorization, CA chain trust, certificate expiration, and cipher protocol version | Nginx, Cloudflare |
| `SEC-HSTS-01` | Strict Transport Security | Security | High | PCI-DSS v4.0 Req 4.1.2, NIST SC-8, ISO 27001 A.10.1 | Verifies `Strict-Transport-Security` header with `max-age >= 31536000`, `includeSubDomains`, and `preload` | Nginx, Next.js, Apache, Cloudflare |
| `SEC-XFO-01` | Clickjacking Protection | Security | High | OWASP A05:2021, GDPR Art. 32(1)(b) | Verifies `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` | Nginx, Next.js, Apache |
| `SEC-XCTO-01` | MIME-Sniffing Prevention | Security | Medium | ISO/IEC 27001 Control A.14.1.2, OWASP A05:2021 | Verifies `X-Content-Type-Options: nosniff` header | Nginx, Next.js, Apache |
| `DNS-SPF-01` | Sender Policy Framework (SPF) | Security | High | IETF RFC 7208, NIST SP 800-177, DORA | Resolves apex DNS TXT records for valid `v=spf1` mail authorization policy | Cloudflare DNS |
| `DNS-DMARC-01` | DMARC Anti-Spoofing Policy | Security | High | IETF RFC 7489, CISA BOD 18-01, NIST SP 800-177 | Queries `_dmarc.<domain>` for valid `v=DMARC1` policy and enforcement mode | Cloudflare DNS |
| `DNS-DKIM-01` | DKIM Cryptographic Key | Security | Medium | IETF RFC 6376, NIST SP 800-177 | Tests 7 common DKIM selectors on `*._domainkey.<domain>` for public signing keys | Cloudflare DNS |
| `PRIV-REF-01` | Referrer Policy | Privacy | Medium | EU GDPR Art. 5(1)(f), CCPA § 1798.100 | Verifies `Referrer-Policy: strict-origin-when-cross-origin` or `no-referrer` | Nginx, Next.js, Apache |
| `PRIV-PERM-01` | Permissions Policy | Privacy | Low | EU GDPR Art. 25 (Privacy by Design) | Checks restriction of sensitive device APIs (`camera`, `microphone`, `geolocation`) | Nginx, Next.js, Apache |
| `PRIV-COOKIE-FLAGS-01` | Cookie Security Flags | Privacy | High | PCI-DSS 4.0 Req 6.4.3, OWASP A01:2021, GDPR Art. 32 | Inspects all `Set-Cookie` directives for `Secure`, `HttpOnly`, and `SameSite` flags | Nginx, Next.js |
| `PRIV-NOTICE-01` | Statutory Privacy Notice | Privacy | High | EU GDPR Art. 12 & 13, CCPA, CalOPPA | Crawls HTML DOM for accessible, prominent privacy policy hyperlinks | Next.js Markup |
| `DISC-SECTXT-01` | Vulnerability Disclosure | Disclosure | Medium | IETF RFC 9116, ISO/IEC 29147, CISA BOD 20-01 | Probes `/.well-known/security.txt` for security contact and PGP key directives | Nginx, Next.js, Apache |
| `SEC-WAF-01` | Web Application Firewall | Security | Low / Info | PCI-DSS 4.0 Req 6.4.1, CIS Benchmark 3.1 | Identifies active edge WAFs (Cloudflare, AWS WAF, Akamai, Fastly, Imperva, Vercel) | Cloudflare, ModSecurity |
| `SEC-COOP-01` | Cross-Origin-Opener-Policy | Security | Medium | OWASP A05:2021, W3C HTML Security | Verifies `Cross-Origin-Opener-Policy: same-origin` to isolate browsing context | Nginx, Next.js, Apache, Cloudflare |
| `SEC-CORP-01` | Cross-Origin-Resource-Policy | Security | Medium | OWASP A05:2021, W3C CORP | Verifies `Cross-Origin-Resource-Policy: same-origin` to prevent side-channel leaks | Nginx, Next.js, Apache, Cloudflare |
| `SEC-COEP-01` | Cross-Origin-Embedder-Policy | Security | Medium | OWASP A05:2021, W3C COEP | Verifies `Cross-Origin-Embedder-Policy: credentialless` | Nginx, Next.js, Apache, Cloudflare |
| `META-SOCIAL-01` | Social Metadata Disclosures | Disclosure | Low | OpenGraph Protocol, Twitter Cards | Verifies `og:title`, `og:description`, `og:image`, and `twitter:card` tags | Next.js Metadata API |
| `SEC-INFO-01` | Server Banner Suppression | Security | Info | CIS Benchmark 2.1 (Information Leakage) | Flags software version banners in `Server` and `X-Powered-By` headers | Nginx, Next.js |
| `SEC-OCSP-01` | OCSP Stapling | Security | Info | IETF RFC 6066, NIST SP 800-52 Rev 2 | Checks TLS handshake for stapled certificate revocation status | Nginx, Apache, Cloudflare |

---

### Multi-Platform Automated Remediation Engine

For every identified non-compliance issue, the auditor automatically generates ready-to-deploy configuration code tailored to the operator's infrastructure:

#### 1. Nginx Reverse Proxy
```nginx
# /etc/nginx/conf.d/security.conf
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL & Transport Hardening (NIST SP 800-52 / PCI-DSS)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Suppress Server Fingerprint (CIS 2.1)
    server_tokens off;

    # Statutory Security Headers (DORA Art. 9 / OWASP Top 10)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Cookie Security Flags (PCI-DSS Req 6.4.3 / GDPR Art. 32)
    proxy_cookie_path / "/; Secure; HttpOnly; SameSite=Lax";
}
```

#### 2. Next.js Application (`next.config.ts`)
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false, // Suppress X-Powered-By header
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### 3. Apache HTTPD (`.htaccess` / `httpd.conf`)
```apache
# Transport & Cryptographic Headers
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# OCSP Stapling (RFC 6066)
SSLUseStapling On
SSLStaplingCache "shmcb:logs/ssl_stapling(32768)"
```

#### 4. Cloudflare DNS & Edge Rules
```ini
# Statutory Anti-Spoofing DNS Records (RFC 7208 / RFC 7489)
Type: TXT | Name: @      | Value: "v=spf1 include:_spf.mx.cloudflare.net ~all"
Type: TXT | Name: _dmarc | Value: "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com"

# Edge SSL/TLS Settings
Always Use HTTPS: Enabled
Minimum TLS Version: TLS 1.2
HTTP Strict Transport Security (HSTS): Enabled (max-age 12 months, subdomains, preload)
```

---

### Scoring & Executive Grading Engine

The auditor applies a deterministic, weighted penalty formula across all active checkpoints:

$$\text{Deduction} = (20 \times C) + (10 \times H) + (5 \times M) + (2 \times L)$$

$$\text{Final Score} = \max\left(15, \min\left(100, 100 - \text{Deduction}\right)\right)$$

*Where $C$ = Critical violations, $H$ = High violations, $M$ = Medium violations, and $L$ = Low violations.*

| Final Score Bracket | Compliance Grade | Posture Definition | Regulatory Impact |
| :--- | :---: | :--- | :--- |
| **95% – 100%** | **A+** | **Exemplary** | Zero high-severity findings; all statutory headers, DNS defenses, and privacy controls enforced. |
| **85% – 94%** | **A** | **Compliant** | Minor defense-in-depth suggestions; meets standard legal baselines. |
| **75% – 84%** | **B+** | **Substantial** | Acceptable posture; moderate hardening recommended for full audit readiness. |
| **65% – 74%** | **B** | **Moderate Risk** | Missing core headers (e.g., CSP or DMARC); vulnerable to targeted spoofing or framing attacks. |
| **50% – 64%** | **C** | **Non-Compliant** | Multiple high-severity compliance gaps; immediate remediation required under DORA / GDPR. |
| **< 50%** | **F** | **Critical Deficit** | Critical transport or cryptographic failures (e.g., plaintext HTTP or expired/untrusted TLS). |


## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js, TypeScript, TailwindCSS, React Three Fiber |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | PostgreSQL, pgvector (Semantic Search), SQLAlchemy, Alembic |
| **Workers** | Celery, Redis |
| **AI / NLP** | Google Gemini (via SDK), PyMuPDF |
| **Hosting** | Vercel (Frontend), Docker/Railway (Backend) |
| **Observability** | Sentry, Python JSON Logger |

### Deployment Tiers

| Component | Free Tier Path | Self-Hosted / Paid Path |
| :--- | :--- | :--- |
| **Database** | Supabase Free (PG15 + pgvector) | AWS RDS PostgreSQL |
| **Redis** | Upstash Free Tier | ElastiCache / Redis Enterprise |
| **Hosting (API)** | Render / Railway Free Tier | AWS ECS / Fargate |
| **Hosting (Web)** | Vercel Hobby | Vercel Pro / Self-hosted Node |
| **LLM Provider** | Gemini API (Free Tier) | Gemini Advanced / Anthropic |

## Features

### MVP Scope (Phase 1)
- [x] **Project Scaffolding**: Monorepo setup with Next.js & FastAPI.
- [x] **Database & ORM**: PostgreSQL schemas, Alembic migrations, pgvector setup.
- [x] **Authentication**: NextAuth/Clerk integration with JWT validation.
- [x] **Document Upload**: S3-compatible presigned uploads for PDFs.
- [x] **Parsing Pipeline**: Synchronous text extraction using PyMuPDF.
- [x] **NLP Extraction**: Basic chunking and LLM-driven requirement isolation.
- [x] **Semantic Search**: Vector indexing of requirements for "similar rules" lookups.
- [x] **API Endpoints**: CRUD endpoints for regulations and requirements.
- [x] **Dashboard UI**: Next.js dashboard for viewing processed text.
- [x] **Compliance Checker**: Simple POST endpoint to validate JSON payloads against rules.

### Roadmap Features (Phase 2+)
- [x] **Async Workers**: Moved heavy NLP pipelines into Celery.
- [x] **Webhooks**: Event-driven architecture for rule updates.
- [x] **Observability**: Sentry and correlation IDs.
- [x] **3D Premium UI**: React Three Fiber data-pipeline visualization.
- [x] **Website Compliance Audits**: Real-time statutory scanning of public websites and APIs across GDPR, HIPAA, SOC 2, PCI-DSS, ISO 27001, DORA, NIST, and WCAG 2.1.
- [x] **Multi-Platform Auto-Remediation**: Instant generation of production-ready configuration fixes for Nginx, Next.js, Apache, and Cloudflare.
- [x] **Statutory DNS & Protocol Probing**: Integrated SPF, DMARC, DKIM, RFC 9116 security.txt, robots.txt, and TLS handshake inspection.
- [x] **CI/CD**: Fully automated Vercel & Docker GHCR deployments. Environment-mapped deployment secrets are securely configured for the Next.js frontend pipeline to resolve strict IDE schema validations.

## Data Model

The compiler outputs highly structured JSON designed to be programmatically validated by software systems.

```json
{
  "rule_id": "REQ-104",
  "source_text": "Personal data cannot be retained longer than necessary.",
  "category": "Data Retention",
  "severity": "HIGH",
  "policy_ast": {
    "condition": "MAX_RETENTION",
    "operator": "LESS_THAN_OR_EQUAL",
    "value": 30,
    "unit": "DAYS"
  }
}
```

<details>
<summary><b>Click to expand full Database Schema</b></summary>

- `organizations`: Tenant isolation.
- `users`: Clerk-synced profiles.
- `regulations`: High-level policies (e.g., GDPR).
- `regulation_versions`: Immutable version snapshots.
- `document_sections`: Chunked PDF text.
- `requirements`: LLM-extracted legal obligations.
- `requirement_embeddings`: `pgvector` arrays.
- `compliance_checks`: Audit logs of validation runs.
- `webhooks`: Outbound event destinations.

</details>

## API Reference

The Developer API exposes the compiled rules engine.

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/audit/website` | Optional | Run autonomous statutory compliance audit on any public website URL. |
| `POST` | `/api/v1/regulations/upload` | Yes | Upload raw regulatory documents (metered: 3 free). |
| `GET` | `/api/v1/regulations/{id}` | Yes | Fetch regulation details. |
| `GET` | `/api/v1/regulations/{id}/requirements` | Yes | List extracted requirements. |
| `GET` | `/api/v1/regulations/{id}/diff` | Yes | Compare two regulation versions. |
| `POST` | `/api/v1/check-compliance` | Yes | Validate a JSON payload against rules. |
| `GET` | `/api/v1/reports` | Yes | Generate compliance impact reports. |
| `POST` | `/api/v1/webhooks` | Yes | Register endpoints for rule-change events. |
| `GET` | `/api/v1/billing/status` | Yes | Get organization billing plan & free usage quota. |
| `POST` | `/api/v1/billing/checkout` | Yes | Create real Dodo Payments checkout session. |
| `POST` | `/api/v1/billing/portal` | Yes | Create Dodo Payments customer portal session. |
| `POST` | `/api/v1/billing/webhooks/dodo` | Sig | Cryptographic HMAC SHA-256 Webhook handler. |

### Quickstart cURL

**Audit a Public Website for Regulatory Compliance:**
```bash
curl -X POST "https://api.antigravity-rac.com/api/audit/website" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://stripe.com",
    "frameworks": ["ALL"],
    "scan_depth": "deep"
  }'
```
```json
{
  "status": "success",
  "domain": "stripe.com",
  "grade": "A+",
  "score": 96,
  "summary": { "total_checkpoints": 21, "passed": 19, "failed": 2, "critical": 0, "high": 0 },
  "advisory": {
    "issues": [],
    "warnings": [
      {
        "id": "SEC-COOP-01",
        "title": "Missing Cross-Origin-Opener-Policy",
        "framework": "OWASP Top 10 / W3C Security",
        "severity": "MEDIUM",
        "remediation": {
          "nginx": "add_header Cross-Origin-Opener-Policy \"same-origin\" always;",
          "nextjs": "headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }]"
        }
      }
    ],
    "informational": []
  }
}
```

**Get Policy Requirements:**
```bash
curl -X GET "https://api.antigravity-rac.com/api/v1/regulations/reg_123/requirements" \
  -H "Authorization: Bearer <YOUR_API_KEY>"
```

**Validate a System Configuration:**
```bash
curl -X POST "https://api.antigravity-rac.com/api/v1/check-compliance" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "regulation_id": "reg_123",
    "payload": {
      "encryption": "AES-256",
      "retention_days": 15
    }
  }'
```
```json
{
  "status": "PASS",
  "violations": []
}
```

## Usage Limits & Monetization (Dodo Payments)

RegCompiler implements a server-enforced monetization architecture using **Dodo Payments**:

- **3 Free Metered Operations**: Every new organization receives 3 complimentary operations across regulation parsing and autonomous website compliance audits (`operation_type: website_audit`).
- **Enforced Server-Side**: Entitlement decisions are executed atomically via PostgreSQL row-locks (`SELECT ... FOR UPDATE`), guaranteeing zero race conditions or bypasses via browser refresh, incognito windows, or localStorage manipulation.
- **Paywall & Upgrade**: Upon consuming the 3rd free usage, subsequent expensive operations return HTTP `402 Payment Required`, automatically prompting the user to upgrade via a hosted Dodo Payments checkout session.
- **Admin Exemption**: Super-administrators and platform admins enjoy unlimited compilations without paywalls or countdowns.
- **Cryptographic Webhook Verification**: The backend verifies Dodo Payments webhooks using HMAC SHA-256 (Standard Webhooks specification) and enforces idempotency via the `webhook_events` table.
- **Full Documentation**: Complete setup instructions, dashboard configuration, test vs. live mode instructions, and schema details are available in [docs/billing.md](docs/billing.md).

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose

### 1. Clone & Infrastructure
```bash
git clone https://github.com/raghul-cyber/regulation-compiler.git
cd regulation-compiler

# Start Postgres (with pgvector) and Redis
cd infra
docker-compose up -d
```

### 2. Backend Setup
```bash
cd ../apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate | Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Run migrations to initialize the database
alembic upgrade head

# Start the API server
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

### 3. Frontend Setup
```bash
cd ../../apps/web
npm install
npm run dev -- --port 3000
```

### 4. Environment Variables
Create `.env` files based on `.env.example`. Required keys:
- `DATABASE_URL`: `postgresql+asyncpg://postgres:postgres@localhost:5432/rac_dev`
- `REDIS_URL`: `redis://localhost:6379/0`
- `GEMINI_API_KEY`: Your Google Gemini API Key
- `PUBLIC_API_URL`: `http://localhost:8080`
- `CLERK_SECRET_KEY` & `PUBLIC_CLERK_PUBLISHABLE_KEY`: From your Clerk dashboard.

## Project Structure

```text
regulation-compiler/
├── apps/
│   ├── api/                 # FastAPI Backend & Celery Workers
│   │   ├── alembic/         # Database migrations
│   │   ├── app/             # Application source (routers, services, pipelines)
│   │   └── requirements.txt
│   └── web/                 # Next.js Frontend
│       ├── src/
│       │   ├── lib/         # React UI & 3D Components
│       │   └── routes/      # Next.js App Router
│       └── next.config.ts
├── infra/                   # Docker & Deployment configuration
│   ├── docker-compose.yml   
│   ├── Dockerfile.api
│   └── Dockerfile.worker
├── packages/
│   └── shared/              # Shared types/schemas (Future expansion)
├── .github/
│   └── workflows/           # CI/CD Pipelines
└── README.md
```

## Roadmap

```mermaid
gantt
    title Regulation-as-Code Evolution
    dateFormat  YYYY-MM-DD
    section MVP
    Phase 1 (Data & UI) :done, 2026-07-01, 30d
    section Advanced
    Phase 2 (Async Pipelines) :done, 2026-08-01, 15d
    Phase 3 (Webhooks & Search) :done, 2026-08-15, 15d
    section Production
    Phase 4 (Observability) :active, 2026-09-01, 10d
    Phase 5 (Autonomous Agents) :2026-09-10, 30d
```

## Security & Compliance Posture

- **Row-Level Security (RLS)**: PostgreSQL RLS policies guarantee strict multi-tenant data isolation by `organization_id` at the database layer.
- **Encryption**: Enforced TLS in transit. Sensitive fields are hashed or encrypted at rest.
- **Audit Logging**: Every mutating action (`POST`, `PATCH`, `DELETE`) is immutably written to an `audit_logs` table.
- **Dependency Scanning**: Integrated Dependabot CI for continuous vulnerability scanning.
- **Zero-Downtime**: Expand/Contract migration patterns ensure backward compatibility during deployments.

## Contributing

We welcome contributions! Please follow the standard flow:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Ensure the CI pipeline passes (Lint → Type-Check → Unit Tests → Build).
5. Open a Pull Request.

*(Note: We will be adding a full `CONTRIBUTING.md` shortly).*

## License

This project is licensed under the **MIT License**.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0f1115&height=120&section=footer" width="100%" />

<div align="center">
  <sub>Built by <a href="https://github.com/raghul-cyber">AhixLight / Raghul RC</a></sub>
</div>
