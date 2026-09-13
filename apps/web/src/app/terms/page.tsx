import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle, Scale, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Terms of Service | Regulation Compiler',
  description: 'Terms and conditions governing the use of the Regulation-as-Code Compiler platform.',
};

export default function TermsPage() {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Scale className="w-3.5 h-3.5" />
          Legal Framework
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-lg text-zinc-400 leading-relaxed max-w-2xl">
          Please review these Terms of Service carefully before utilizing the Regulation-as-Code Compiler platform, APIs, and continuous statutory surveillance services.
        </p>
      </div>

      {/* Legal Notice Callout */}
      <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex gap-3 text-amber-300 text-sm leading-relaxed">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <strong className="font-semibold block text-amber-200 mb-1">Important Technical Compliance Notice:</strong>
          RegCompiler is an automated software tool that parses statutory text and compiles deterministic Abstract Syntax Trees (AST) and verification policies for computing systems. It does not provide formal legal counsel or guarantee immunity from regulatory sanctions. Organizations should consult certified legal and compliance officers alongside automated enforcement.
        </div>
      </div>

      {/* Terms Content Sections */}
      <div className="space-y-10 text-zinc-300 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">1.</span>
            Acceptance of Terms
          </h2>
          <p className="text-zinc-400">
            By accessing or using the Regulation-as-Code Compiler platform (&quot;RegCompiler&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;the Service&quot;), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company, enterprise, or legal entity, you represent that you possess the authority to bind such entity. If you do not agree to these terms, you must not access or use the Service.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">2.</span>
            Description of Service
          </h2>
          <p className="text-zinc-400">
            RegCompiler provides a deterministic statutory compiler architecture that converts legal, regulatory, and statutory documentation (including GDPR, EU AI Act, DORA, US Federal Register notices, UK FCA guidelines, and MAS directives) into structured Abstract Syntax Trees (AST), machine-executable verification policies, and automated compliance dossiers.
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 pl-2">
            <li><strong>Autonomous Ingestion:</strong> Parsing statutory documents via OCR, PyMuPDF, and natural language semantic extraction.</li>
            <li><strong>Continuous 24/7 Surveillance:</strong> Scheduled statutory scraping across official government gazettes.</li>
            <li><strong>Rule Compilation:</strong> Synthesizing machine-readable condition trees and executable policies.</li>
            <li><strong>Compliance Telemetry:</strong> Evaluating system payloads and producing cryptographic audit trails.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">3.</span>
            User Accounts &amp; Access Controls
          </h2>
          <p className="text-zinc-400">
            Access to compiler workspaces and API endpoints requires authenticated credentials managed through our identity provider (Clerk) and multi-tenant Role-Based Access Control (RBAC). You are responsible for safeguarding your credentials, API secret keys, and webhook endpoints. Any activity executed under your organization&apos;s workspace is your legal responsibility.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">4.</span>
            Customer Data &amp; Intellectual Property
          </h2>
          <p className="text-zinc-400">
            <strong>Your Data:</strong> You retain complete and exclusive ownership of all proprietary architecture data, system payloads, audit telemetry, and private internal policies submitted to RegCompiler. We do not use proprietary customer payloads to train publicly accessible machine learning models.
          </p>
          <p className="text-zinc-400">
            <strong>Platform IP:</strong> The RegCompiler compilation algorithms, semantic extraction engines, 3D telemetry interfaces, AST grammar definitions, and associated software remain the exclusive intellectual property of RegCompiler.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">5.</span>
            Public Statutory Feeds &amp; Accuracy
          </h2>
          <p className="text-zinc-400">
            Our 24/7 live statutory feeds ingest data published by official government repositories (including the United States Office of the Federal Register, the UK Financial Conduct Authority, the Office of the Privacy Commissioner of Canada, the European Union Eur-Lex portal, and the Monetary Authority of Singapore). While we make rigorous efforts to ensure sub-minute scraping accuracy, RegCompiler is not responsible for upstream governmental API latency, gazette publication delays, or legislative drafting errors.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">6.</span>
            Service Availability &amp; SLA
          </h2>
          <p className="text-zinc-400">
            We aim for 99.9% uptime across our compilation clusters, API routers, and 24/7 autonomous surveillance workers. Scheduled maintenance windows, upstream cloud provider outages, or sovereign network interruptions are excluded from standard operational metrics.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">7.</span>
            Limitation of Liability
          </h2>
          <p className="text-zinc-400">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, REGCOMPILER AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS, REGULATORY FINES, OR REPUTATIONAL HARM RESULTING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">8.</span>
            Governing Law &amp; Jurisdiction
          </h2>
          <p className="text-zinc-400">
            These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law principles. Any dispute arising under these Terms shall be resolved exclusively in the state or federal courts located in Wilmington, Delaware.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-blue-400 font-mono text-base">9.</span>
            Contact Information
          </h2>
          <p className="text-zinc-400">
            For inquiries regarding these Terms of Service or regulatory enterprise licensing, please reach out to:
          </p>
          <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-sm font-mono text-zinc-300">
            Regulation Compiler Legal &amp; Compliance Team<br />
            Email: legal@regulation-compiler.internal<br />
            Security Desk: security@regulation-compiler.internal
          </div>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
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
