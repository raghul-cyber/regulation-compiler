import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { HeroScene } from '@/components/3d/hero-scene-lazy';
import { HowItWorksDiagram } from '@/components/landing/how-it-works-diagram';
import { InteractiveGlobeShowcase } from '@/components/landing/interactive-globe-showcase';
import { 
  ShieldCheck, 
  Binary, 
  Globe2, 
  Activity, 
  Cpu, 
  Lock, 
  FileCode2, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Zap,
  Scale,
  GitBranch,
  Terminal,
  Database
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* Background 3D Ambient Constellation */}
      <div className="fixed inset-0 -z-10 pointer-events-auto opacity-35">
        <HeroScene />
      </div>

      {/* Main Content Container with Generous Spacing Scale */}
      <div className="relative z-10 w-full min-h-[150vh] pointer-events-none -mt-4 space-y-28 md:space-y-36 pb-24">
        
        {/* ============================================================ */}
        {/* 1. HERO SECTION */}
        {/* ============================================================ */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center pt-12 md:pt-16 max-w-5xl mx-auto px-4">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-xs font-semibold text-zinc-300 mb-8 backdrop-blur-md shadow-sm pointer-events-auto hover:border-zinc-700 transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-zinc-200 font-mono text-[11px] uppercase tracking-wider">Regulatory Infrastructure</span>
            <span className="text-zinc-600">•</span>
            <span className="text-blue-400 font-mono text-[11px]">Zero-Lag Enforcement</span>
          </div>

          {/* Restrained, Crisp Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl leading-[1.06] bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-400 pointer-events-auto">
            Compile regulatory requirements into structured, actionable rules.
          </h1>

          {/* Technical Supporting Copy */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl font-normal leading-relaxed pointer-events-auto">
            Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees (AST) and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all px-8 h-12 flex items-center gap-2 cursor-pointer btn-tactile">
                  <span>Explore Live Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/regulations">
                <Button size="lg" variant="secondary" className="rounded-lg font-semibold px-8 h-12 bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all cursor-pointer btn-tactile">
                  Launch Compiler Studio
                </Button>
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all px-8 h-12 flex items-center gap-2 cursor-pointer btn-tactile">
                  <span>Explore Live Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <Button size="lg" variant="secondary" className="rounded-lg font-semibold px-8 h-12 bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-all cursor-pointer btn-tactile">
                  Launch Compiler Studio
                </Button>
              </SignInButton>
            </Show>
          </div>

          {/* Real-Time Platform Metrics Bar (Spacious 4-Box Grid) */}
          <div className="mt-16 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto">
            <div className="p-5 rounded-2xl bg-[#090b10]/80 border border-zinc-800/80 backdrop-blur-md text-left transition-all hover:border-zinc-700">
              <div className="text-3xl md:text-4xl font-black text-white tracking-tight">39+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium">Live Regulatory Signals</div>
              <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Federal Register &amp; FCA
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090b10]/80 border border-zinc-800/80 backdrop-blur-md text-left transition-all hover:border-zinc-700">
              <div className="text-3xl md:text-4xl font-black text-white tracking-tight">32+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium">Compiled Frameworks</div>
              <div className="text-[11px] text-blue-400 font-mono mt-2">
                EU AI Act, DORA, GDPR
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090b10]/80 border border-zinc-800/80 backdrop-blur-md text-left transition-all hover:border-zinc-700">
              <div className="text-3xl md:text-4xl font-black text-white tracking-tight">95+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium">Formal AST Rules</div>
              <div className="text-[11px] text-purple-400 font-mono mt-2">
                Boolean Condition Trees
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090b10]/80 border border-zinc-800/80 backdrop-blur-md text-left transition-all hover:border-zinc-700">
              <div className="text-3xl md:text-4xl font-black text-white tracking-tight">&lt;50ms</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium">Evaluation Latency</div>
              <div className="text-[11px] text-amber-400 font-mono mt-2">
                In-Memory Zero-Lag Engine
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. 3D GLOBE SURVEILLANCE CENTERPIECE */}
        {/* ============================================================ */}
        <section className="w-full">
          <InteractiveGlobeShowcase />
        </section>

        {/* ============================================================ */}
        {/* 3. ABOUT REGCOMPILER / THE PARADIGM SHIFT */}
        {/* ============================================================ */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5" />
              The Paradigm Shift
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              About Regulation Compiler
            </h2>
            <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
              Traditional compliance relies on manual PDF audits, subjective checklists, and periodic spreadsheets. RegCompiler replaces human ambiguity with deterministic engineering rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Binary className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic AST Parsing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Legal statutes are treated like high-level programming language code. Our compiler parses articles, recitals, and statutory obligations into structured Abstract Syntax Trees with boolean logic and threshold constraints.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Autonomous 24/7 Surveillance</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Background daemons continuously scrape official public regulatory gazettes (US Federal Register, UK FCA, Eur-Lex, MAS, Canada Open Gov). As soon as an amendment is published, the compiler updates policies with zero latency.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cryptographic Audit Proofs</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every policy check generates a tamper-evident cryptographic hash, formal pass/fail outcome, and automated audit trail. Generate verifiable regulatory compliance dossiers and executive PDF reports in seconds.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. HOW IT WORKS (GRAPHICAL & DIAGRAMMATICAL PIPELINE) */}
        {/* ============================================================ */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Cpu className="w-3.5 h-3.5" />
              Compiler Architecture
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              How RegCompiler Works
            </h2>
            <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
              Explore the four-stage end-to-end statutory compilation lifecycle. From raw governmental gazettes to real-time machine policy enforcement.
            </p>
          </div>

          {/* Interactive Graphical Diagram Component */}
          <HowItWorksDiagram />
        </section>

        {/* ============================================================ */}
        {/* 5. CORE CAPABILITIES (SPACIOUS 4-BOX FEATURE GRID) */}
        {/* ============================================================ */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" />
              Engineering Rigor
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Platform Capabilities
            </h2>
            <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
              Engineered for financial institutions, AI infrastructure builders, and cloud platforms requiring continuous, provable regulatory adherence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Cross-Framework Graph Harmonization</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automatically detects overlapping obligations across diverse regulatory bodies. Map an encryption requirement once, and verify compliance simultaneously across GDPR Article 32, DORA Article 9, and HIPAA Security Rule §164.312.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-blue-400 font-mono">
                <span>Multi-Jurisdiction Graph</span>
                <span>Zero Redundant Controls</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Zero-Lag In-Memory Evaluation</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Run compliance evaluations directly inside CI/CD test suites, Kubernetes admission controllers, or cloud event streams. Sub-50ms deterministic execution ensures no operational slowdown.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Sub-50ms Benchmarked</span>
                <span>REST &amp; Streaming Endpoints</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white">GitOps Policy-as-Code Deployment</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Export compiled statutory policies as Open Policy Agent (OPA) Rego rules, JSON Schemas, or executable Python handlers. Version control your compliance policies in Git alongside your application code.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>OPA / Rego Export</span>
                <span>Immutable Version Diffing</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Automated Remediation Playbooks</h4>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  When a system check detects a non-compliant state, RegCompiler doesn&apos;t just throw an alert. It provides exact technical remediation steps, configuration diffs, and playbook templates to restore compliance.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-purple-400 font-mono">
                <span>Actionable Code Diffs</span>
                <span>Self-Healing Recommendations</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. SUPPORTED STATUTORY JURISDICTIONS */}
        {/* ============================================================ */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-b from-[#090b12] to-[#06070a] border border-zinc-800/90 text-center relative overflow-hidden">
            <div className="max-w-3xl mx-auto mb-10">
              <h3 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                Global Regulatory Framework Directory
              </h3>
              <p className="text-sm md:text-base text-zinc-400">
                Pre-compiled catalogs and 24/7 automated scrapers actively monitoring major international frameworks:
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3.5 max-w-4xl mx-auto">
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇪🇺</span>
                <span>EU AI Act (OJ L 2024/1689)</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇪🇺</span>
                <span>DORA (Digital Operational Resilience Act)</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇪🇺</span>
                <span>GDPR (General Data Protection Reg.)</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇺🇸</span>
                <span>US SEC Cybersecurity Mandates</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇺🇸</span>
                <span>NIST CSF 2.0 &amp; SP 800-53</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇬🇧</span>
                <span>UK FCA Operational Resilience</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇸🇬</span>
                <span>MAS Cyber Hygiene Notice 655</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🇨🇦</span>
                <span>Canada PIPEDA &amp; Bill C-27</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 hover:border-zinc-700 transition-colors">
                <span>🌐</span>
                <span>PCI DSS v4.0.1 &amp; ISO/IEC 27001</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. FINAL CALL TO ACTION */}
        {/* ============================================================ */}
        <section className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready to Compile Your First Regulation?
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto mb-8">
            Access the live 24/7 surveillance dashboard or upload a statutory document to generate machine-verifiable enforcement code today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold px-8 h-12 shadow-lg shadow-blue-500/25 cursor-pointer btn-tactile">
                Explore Live Dashboard
              </Button>
            </Link>
            <Link href="/regulations">
              <Button size="lg" variant="secondary" className="rounded-lg font-semibold px-8 h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 cursor-pointer btn-tactile">
                Launch Compiler
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span className="font-mono">Deterministic AST Engine v2.4</span>
          </div>
        </section>

      </div>
    </>
  );
}

