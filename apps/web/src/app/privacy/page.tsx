import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Database, EyeOff, Server, Globe2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Privacy Policy | RegCompiler',
  description: 'How RegCompiler collects, processes, and protects your enterprise statutory and audit data.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 md:px-6">
      {/* Top Breadcrumb / Back Link */}
      <div className="mb-8 flex items-center justify-between">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="mb-12 border-b border-zinc-800/80 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Data Protection Standards
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-zinc-400 leading-relaxed max-w-2xl">
          We are committed to safeguarding your proprietary infrastructure payloads, architectural telemetry, and compliance audit records with enterprise-grade cryptographic guarantees.
        </p>
      </div>

      {/* Privacy Guarantee Grid */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <EyeOff className="w-5 h-5 text-emerald-400 mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">Zero-Retention Payloads</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            System evaluation payloads are verified in-memory and discarded immediately unless audit persistence is explicitly toggled.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <Lock className="w-5 h-5 text-blue-400 mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">AES-256 &amp; TLS 1.3</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All stored AST policies and vector embeddings are encrypted at rest with AES-256 and transmitted via TLS 1.3.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
          <Globe2 className="w-5 h-5 text-purple-400 mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">Multi-Jurisdiction Scope</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Engineered to adhere to GDPR (EU), CCPA/CPRA (California), PIPEDA (Canada), and MAS 655 (Singapore).
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-10 text-zinc-300 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">1.</span>
            Information We Collect
          </h2>
          <p className="text-zinc-400">
            RegCompiler processes information strictly necessary to operate our statutory compilation and policy evaluation services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
            <li><strong>Account &amp; Identity Information:</strong> Name, professional email address, organization identifier, and role privileges managed securely via Clerk.</li>
            <li><strong>Regulatory Documentation:</strong> Legal text, statutory PDFs, regulatory amendments, and agency guidelines uploaded for compilation.</li>
            <li><strong>System Evaluation Payloads:</strong> JSON, YAML, or architectural state payloads submitted to the <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded font-mono text-blue-300">/compliance/evaluate</code> API for automated verification against compiled policies.</li>
            <li><strong>Telemetry &amp; Audit Logs:</strong> Cryptographic check hashes, evaluation timestamps, policy pass/fail metrics, and correlation IDs for troubleshooting.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">2.</span>
            How We Process Customer Payloads (Zero-Retention Guarantee)
          </h2>
          <p className="text-zinc-400">
            Unlike traditional analytics vendors, <strong>we do not sell, monetize, or use your proprietary architectural payloads to train foundation artificial intelligence models</strong>.
          </p>
          <p className="text-zinc-400">
            When you run compliance verification against an active policy, the payload is evaluated against the compiled Abstract Syntax Tree (AST) in an isolated execution sandbox. Once the compliance status (<code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">PASS</code>, <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-rose-400 font-mono">FAIL</code>, or <code className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-amber-400 font-mono">PARTIAL</code>) is registered in your organization&apos;s audit trail, the raw input payload is expunged from memory.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">3.</span>
            Public Statutory Gazettes &amp; Scraped Data
          </h2>
          <p className="text-zinc-400">
            Our 24/7 automated statutory surveillance engine monitors public government gazettes (e.g., FederalRegister.gov, Eur-Lex, FCA RSS, and Canada Open Data). This data is strictly public domain information and does not contain personal or proprietary data. Signals scraped from these sources are compiled into public regulatory catalogs accessible across the platform.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">4.</span>
            Data Storage, Encryption &amp; Security Architecture
          </h2>
          <p className="text-zinc-400">
            We implement comprehensive defense-in-depth security measures to protect your organization&apos;s compliance assets:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
            <li><strong>Encryption at Rest:</strong> All PostgreSQL relational tables, vector embeddings, and policy ASTs are encrypted using AES-256.</li>
            <li><strong>Encryption in Transit:</strong> All HTTP API traffic, webhook dispatches, and Redis Celery broker queues enforce TLS 1.3.</li>
            <li><strong>Multi-Tenant Isolation:</strong> Strict row-level isolation and organization ID scoping prevent cross-tenant data leakage.</li>
            <li><strong>Automated Audit Trails:</strong> Every policy update, probe trigger, and compliance check generates an immutable cryptographic audit record.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">5.</span>
            Sub-Processors &amp; Infrastructure Providers
          </h2>
          <p className="text-zinc-400">
            We partner exclusively with certified, enterprise-grade infrastructure providers:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 border border-zinc-800 rounded-lg">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase font-mono">
                <tr>
                  <th className="p-3 border-b border-zinc-800">Sub-Processor</th>
                  <th className="p-3 border-b border-zinc-800">Purpose</th>
                  <th className="p-3 border-b border-zinc-800">Location</th>
                  <th className="p-3 border-b border-zinc-800">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="p-3 font-semibold text-white">Clerk</td>
                  <td className="p-3">Authentication &amp; User Sessions</td>
                  <td className="p-3">United States</td>
                  <td className="p-3 text-emerald-400 font-mono">SOC 2 Type II, GDPR</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Supabase / PostgreSQL</td>
                  <td className="p-3">Encrypted Relational &amp; Vector Database</td>
                  <td className="p-3">US / EU Regions</td>
                  <td className="p-3 text-emerald-400 font-mono">SOC 2 Type II, ISO 27001</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Vercel &amp; Docker GHCR</td>
                  <td className="p-3">Edge Frontend &amp; Container Hosting</td>
                  <td className="p-3">Global Edge Network</td>
                  <td className="p-3 text-emerald-400 font-mono">ISO 27001, SOC 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">6.</span>
            Your Rights (GDPR, CCPA &amp; Global Privacy)
          </h2>
          <p className="text-zinc-400">
            Depending on your jurisdiction, you possess statutory rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
            <li><strong>Right to Access &amp; Portability:</strong> Export all compiled policies, organization audit logs, and compliance records via JSON or PDF.</li>
            <li><strong>Right to Erasure:</strong> Request permanent purging of your organization&apos;s workspace and associated audit logs.</li>
            <li><strong>Right to Restriction:</strong> Halt automated policy evaluations or modify data retention settings at any time.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base">7.</span>
            Data Protection Officer (DPO) &amp; Contact
          </h2>
          <p className="text-zinc-400">
            For questions regarding this Privacy Policy, data subject access requests, or to exercise your GDPR/CCPA rights, contact our Data Protection Officer:
          </p>
          <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-sm font-mono text-zinc-300">
            Office of the Data Protection Officer<br />
            AhixLight Inc.<br />
            Email:{' '}
            <a href="mailto:contact@ahixlight.com" className="text-emerald-400 hover:underline">
              contact@ahixlight.com
            </a>
            <br />
            Privacy Inquiries:{' '}
            <a href="mailto:contact@ahixlight.com" className="text-emerald-400 hover:underline">
              contact@ahixlight.com
            </a>
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Surveillance Dashboard
          </Link>
          <span>•</span>
          <Link href="/regulations" className="hover:text-white transition-colors">
            Compiler Studio
          </Link>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-full">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
