import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Show, SignInButton } from '@clerk/nextjs';
import { HeroScene } from '@/components/3d/hero-scene-lazy';
import { HowItWorksDiagram } from '@/components/landing/how-it-works-diagram';
import { LandingScrollHUD } from '@/components/landing/landing-scroll-hud';
import { 
  ShieldCheck, 
  Binary, 
  Globe2, 
  Activity, 
  Cpu, 
  ArrowRight, 
  Zap, 
  Scale, 
  GitBranch, 
  Terminal 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      {/* 3D Perspective Cyber Grid Animated Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-70">
        <HeroScene />
      </div>

      {/* Ambient Vignette & Deep Space Atmospheric Fog */}
      <div className="fixed inset-0 -z-[5] pointer-events-none bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(6,7,10,0.45)_55%,rgba(6,7,10,0.95)_100%)]" />

      {/* Floating Scroll HUD & Progress Laser Indicator */}
      <LandingScrollHUD />

      {/* Main Content Container */}
      <div className="relative z-10 w-full min-h-[150vh] pointer-events-none -mt-8 space-y-28 pb-24">
        
        {/* ============================================================ */}
        {/* 1. HERO SECTION */}
        {/* ============================================================ */}
        <section id="hero" className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center pt-8 scroll-mt-24">
          {/* Official Brand Badge with Logo */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-8 backdrop-blur-md shadow-xl shadow-blue-500/10 pointer-events-auto hover:border-blue-500/40 hover:shadow-blue-500/20 transition-all">
            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0">
              <Image 
                src="/logo-icon.png" 
                alt="Regulation Compiler Logo" 
                width={20} 
                height={20}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-white font-medium">Regulation Compiler</span>
            <span className="text-zinc-600">•</span>
            <span className="text-cyan-400 font-mono tracking-wide text-[11px]">FROM REGULATIONS TO ACTION</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter max-w-5xl leading-[1.08] bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-200 to-zinc-500 pointer-events-auto">
            The Future of <br /> Regulation as Code.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-3xl font-medium leading-relaxed pointer-events-auto">
            Transform dense, ambiguous legal text into deterministic Abstract Syntax Trees (AST) and machine-executable verification policies. Automated statutory surveillance running 24/7 across global regulatory gazettes.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all px-8 h-12 flex items-center gap-2 cursor-pointer">
                  <span>Explore Live Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/regulations">
                <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8 h-12 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer">
                  Launch Compiler Studio
                </Button>
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all px-8 h-12 flex items-center gap-2 cursor-pointer">
                  <span>Explore Live Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/regulations">
                <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8 h-12 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer">
                  Launch Compiler Studio
                </Button>
              </SignInButton>
            </Show>
          </div>

          {/* Real-Time Platform Metrics Bar */}
          <div className="mt-14 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto font-sans">
            <div className="p-4 rounded-xl bg-[#090a0f]/85 border border-zinc-800/80 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-md text-left transition-all duration-300">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">39+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium font-sans">Live Regulatory Signals</div>
              <div className="text-[11px] text-emerald-400 font-sans font-medium mt-1">● Federal Register &amp; FCA</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090a0f]/85 border border-zinc-800/80 hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] backdrop-blur-md text-left transition-all duration-300">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">32+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium font-sans">Compiled Frameworks</div>
              <div className="text-[11px] text-blue-400 font-sans font-medium mt-1">● EU AI Act, DORA, GDPR</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090a0f]/85 border border-zinc-800/80 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-md text-left transition-all duration-300">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">95+</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium font-sans">Formal AST Rules</div>
              <div className="text-[11px] text-purple-400 font-sans font-medium mt-1">● Deterministic Trees</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090a0f]/85 border border-zinc-800/80 hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-md text-left transition-all duration-300">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-sans">&lt;50ms</div>
              <div className="text-xs text-zinc-400 mt-1 font-medium font-sans">Evaluation Latency</div>
              <div className="text-[11px] text-amber-400 font-sans font-medium mt-1">● In-Memory Engine</div>
            </div>
          </div>
        </section>

        {/* Glowing Horizon Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

        {/* ============================================================ */}
        {/* 2. ABOUT REGCOMPILER SECTION */}
        {/* ============================================================ */}
        <section id="about" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#090b12]/80 border border-zinc-800/80 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.12)] backdrop-blur-md relative overflow-hidden group transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Binary className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-blue-400/80 uppercase tracking-widest">[SYS::AST_01]</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deterministic AST Parsing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Legal statutes are treated like high-level programming language code. Our compiler parses articles, recitals, and statutory obligations into structured Abstract Syntax Trees with boolean logic and threshold constraints.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090b12]/80 border border-zinc-800/80 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)] backdrop-blur-md relative overflow-hidden group transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">[SYS::SRV_02]</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Autonomous 24/7 Surveillance</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Background daemons continuously scrape official public regulatory gazettes (US Federal Register, UK FCA, Eur-Lex, MAS, Canada Open Gov). As soon as an amendment is published, the compiler updates policies with zero latency.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090b12]/80 border border-zinc-800/80 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.12)] backdrop-blur-md relative overflow-hidden group transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest">[SYS::PRF_03]</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Cryptographic Audit Proofs</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every policy check generates a tamper-evident cryptographic hash, formal pass/fail outcome, and automated audit trail. Generate verifiable regulatory compliance dossiers and executive PDF reports in seconds.
              </p>
            </div>
          </div>
        </section>

        {/* Glowing Horizon Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

        {/* ============================================================ */}
        {/* 3. HOW IT WORKS (GRAPHICAL & DIAGRAMMATICAL PIPELINE) */}
        {/* ============================================================ */}
        <section id="pipeline" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
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

        {/* Glowing Horizon Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

        {/* ============================================================ */}
        {/* 4. CORE CAPABILITIES (CLEAN 4-BOX FEATURE GRID) */}
        {/* ============================================================ */}
        <section id="capabilities" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#090b12]/85 border border-zinc-800/80 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] backdrop-blur-md flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Globe2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Cross-Framework Graph Harmonization</h4>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80">[CAP::GRAPH_01]</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automatically detects overlapping obligations across diverse regulatory bodies. Map an encryption requirement once, and verify compliance simultaneously across GDPR Article 32, DORA Article 9, and HIPAA Security Rule §164.312.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-blue-400 font-mono">
                <span>Multi-Jurisdiction Graph</span>
                <span>Zero Redundant Controls</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090b12]/85 border border-zinc-800/80 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-md flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Zero-Lag In-Memory Evaluation</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80">[CAP::EVAL_02]</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Run compliance evaluations directly inside CI/CD test suites, Kubernetes admission controllers, or cloud event streams. Sub-50ms deterministic execution ensures no operational slowdown.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Sub-50ms Benchmarked</span>
                <span>REST &amp; Streaming Endpoints</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090b12]/85 border border-zinc-800/80 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] backdrop-blur-md flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white">GitOps Policy-as-Code Deployment</h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400/80">[CAP::GITOPS_03]</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Export compiled statutory policies as Open Policy Agent (OPA) Rego rules, JSON Schemas, or executable Python handlers. Version control your compliance policies in Git alongside your application code.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>OPA / Rego Export</span>
                <span>Immutable Version Diffing</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#090b12]/85 border border-zinc-800/80 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md flex flex-col justify-between group transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Automated Remediation Playbooks</h4>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400/80">[CAP::PLAY_04]</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  When a system check detects a non-compliant state, RegCompiler doesn&apos;t just throw an alert. It provides exact technical remediation steps, configuration diffs, and playbook templates to restore compliance.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-purple-400 font-mono">
                <span>Actionable Code Diffs</span>
                <span>Self-Healing Recommendations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Glowing Horizon Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

        {/* ============================================================ */}
        {/* 5. SUPPORTED STATUTORY JURISDICTIONS */}
        {/* ============================================================ */}
        <section id="jurisdictions" className="w-full max-w-6xl mx-auto px-4 md:px-6 pointer-events-auto scroll-mt-24">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#090b14] to-[#06070a] border border-blue-500/20 hover:border-blue-500/40 shadow-xl shadow-blue-500/5 text-center relative overflow-hidden transition-all duration-300">
            <div className="max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Globe2 className="w-3.5 h-3.5" />
                Global Statutory Network
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                Autonomous Regulatory Coverage
              </h3>
              <p className="text-sm text-zinc-400">
                Pre-compiled catalogs and 24/7 automated scrapers actively monitoring major international frameworks:
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇪🇺</span>
                <span>EU AI Act (OJ L 2024/1689)</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇪🇺</span>
                <span>DORA (Digital Operational Resilience Act)</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇪🇺</span>
                <span>GDPR (General Data Protection Reg.)</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇺🇸</span>
                <span>US SEC Cybersecurity Mandates</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇺🇸</span>
                <span>NIST CSF 2.0 &amp; SP 800-53</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇬🇧</span>
                <span>UK FCA Operational Resilience</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇸🇬</span>
                <span>MAS Cyber Hygiene Notice 655</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🇨🇦</span>
                <span>Canada PIPEDA &amp; Bill C-27</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors">
                <span>🌐</span>
                <span>PCI DSS v4.0.1 &amp; ISO/IEC 27001</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. FINAL CALL TO ACTION */}
        {/* ============================================================ */}
        <section className="w-full max-w-4xl mx-auto px-4 text-center pointer-events-auto pt-6">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready to Compile Your First Regulation?
          </h2>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto mb-8">
            Access the live 24/7 surveillance dashboard or upload a statutory document to generate machine-verifiable enforcement code today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold px-8 h-12 shadow-lg shadow-blue-500/30 cursor-pointer">
                Explore Live Dashboard
              </Button>
            </Link>
            <Link href="/regulations">
              <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8 h-12 cursor-pointer border border-zinc-800 hover:border-zinc-700">
                Launch Compiler Studio
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <span>Deterministic AST Engine v2.4</span>
          </div>
        </section>

      </div>
    </>
  );
}
