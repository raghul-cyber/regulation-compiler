import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ShieldCheck, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/70 bg-[#06070a] pt-16 pb-12 transition-colors">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800/60">
          
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                <Image 
                  src="/logo-icon.png" 
                  alt="Regulation Compiler Logo" 
                  width={24} 
                  height={24}
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Regulation Compiler
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-400 max-w-sm leading-relaxed">
              Transforming ambiguous governmental statutes into deterministic Abstract Syntax Trees and automated 24/7 machine compliance policies.
            </p>
            
            {/* Live Operational Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All 8 Gazette Scrapers Operational</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-sans text-[11px]">99.99% Uptime</span>
            </div>
          </div>

          {/* Col 3: Product Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
              Product
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-zinc-400">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Compliance Hub
                </Link>
              </li>
              <li>
                <Link href="/regulations" className="hover:text-white transition-colors">
                  Compiler Studio
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=actions_24_7" className="hover:text-white transition-colors">
                  24/7 Actions Engine
                </Link>
              </li>
              <li>
                <Link href="/compliance-check" className="hover:text-white transition-colors">
                  Payload Simulator
                </Link>
              </li>
              <li>
                <Link href="/regulations/new" className="hover:text-white transition-colors">
                  Statute Ingestion
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Statutory Frameworks */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
              Coverage
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-zinc-400">
              <li>
                <span className="text-zinc-300">EU AI Act (OJ L 2024/1689)</span>
              </li>
              <li>
                <span className="text-zinc-300">DORA (Digital Resilience)</span>
              </li>
              <li>
                <span className="text-zinc-300">GDPR (EU Data Protection)</span>
              </li>
              <li>
                <span className="text-zinc-300">US SEC Cybersecurity 8-K</span>
              </li>
              <li>
                <span className="text-zinc-300">NIST SP 800-53 &amp; CSF 2.0</span>
              </li>
              <li>
                <span className="text-zinc-300">UK FCA Operational Rules</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Governance & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
              Governance
            </h4>
            <ul className="space-y-2 text-xs md:text-sm text-zinc-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-zinc-500 font-mono text-xs">AST Engine v2.4.0</span>
              </li>
              <li>
                <span className="text-zinc-500 font-mono text-xs">Deterministic Verification</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Regulation Compiler Inc. All rights reserved. Deterministic Statutory Enforcement.
          </div>
          <div className="flex items-center gap-6">
            <span>Built for High-Assurance Infrastructure</span>
            <span>•</span>
            <span className="font-mono text-zinc-400">Zero-Lag In-Memory Engine</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
