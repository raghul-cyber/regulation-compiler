import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';

const MONITORED_FRAMEWORKS = [
  { name: 'EU AI Act', jurisdiction: 'EU' },
  { name: 'SEC 17 CFR', jurisdiction: 'US' },
  { name: 'DORA', jurisdiction: 'EU' },
  { name: 'MAS TRM', jurisdiction: 'SG' },
  { name: 'FCA SYSC', jurisdiction: 'UK' },
  { name: 'HIPAA Security', jurisdiction: 'US' },
  { name: 'EU GDPR', jurisdiction: 'EU' },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#05080E]/90 backdrop-blur-2xl pt-8 pb-10 transition-colors relative z-10">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
        
        {/* Top: Monitored Statutory Authorities Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Continuous Statutory Surveillance:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MONITORED_FRAMEWORKS.map((fw) => (
              <span
                key={fw.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-[#00F0FF]/30 transition-colors font-mono text-[10px] text-zinc-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]/70" />
                <span className="font-semibold text-zinc-400">{fw.jurisdiction}:</span>
                <span>{fw.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Middle: Brand, Cryptographic Assurance & Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#0E1520] border border-white/[0.12] p-1 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.15)]">
                <Image 
                  src="/logo-icon.png" 
                  alt="RegCompiler Logo" 
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white">
                  RegCompiler
                </span>
                <span className="font-mono text-[9px] text-[#9AA9B5] uppercase tracking-widest">
                  AETHER-STITCH STATUTORY KERNEL
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-px h-6 bg-white/[0.08]" />

            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Systems Nominal • Latency 14ms</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-zinc-400">
            <Link href="/dashboard" className="hover:text-[#00F0FF] transition-colors">
              Surveillance
            </Link>
            <Link href="/regulations" className="hover:text-[#00F0FF] transition-colors">
              Directory
            </Link>
            <Link href="/compliance-check" className="hover:text-[#00F0FF] transition-colors">
              Simulator
            </Link>
            <Link href="/billing" className="hover:text-[#00F0FF] transition-colors">
              Entitlements
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Bottom Micro-Bar: Cryptographic Guarantee */}
        <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>&copy; {new Date().getFullYear()} RegCompiler. Deterministic Statutory Enforcement & AST Compilation.</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-600">
            <span>SHA-256 HASH VERIFIED</span>
            <span>•</span>
            <span>ZERO HALLUCINATION PROTOCOL</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
