'use client';

import dynamic from 'next/dynamic';
import { Loader2, Globe2, ShieldCheck, Radio, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const CoverageGlobe = dynamic(
  () => import('@/components/compliance/coverage-globe').then(mod => mod.CoverageGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] flex flex-col items-center justify-center bg-zinc-950/70 rounded-2xl border border-zinc-800/80 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500/70" />
        <span className="font-semibold text-sm text-zinc-300">Initializing 3D Surveillance Grid...</span>
        <span className="text-xs text-zinc-500 mt-1">Projecting geospatial regulatory coordinates</span>
      </div>
    )
  }
);

export function InteractiveGlobeShowcase() {
  return (
    <div className="w-full max-w-6xl mx-auto pointer-events-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Globe2 className="w-3.5 h-3.5" />
          Global Surveillance Centerpiece
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Worldwide Jurisdiction Coverage
        </h2>
        <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
          Autonomous background daemons continuously monitor public regulatory gazettes. Click or hover on any coordinate node to inspect active statutory obligations.
        </p>
      </div>

      {/* 3D Globe Viewport Container */}
      <div className="w-full h-[580px] rounded-2xl border border-zinc-800/80 bg-[#07080c] shadow-2xl relative overflow-hidden">
        <CoverageGlobe />
      </div>

      {/* Micro-Telemetry Bottom Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400 font-medium">8 Gazette Streams Connected</span>
          <span>•</span>
          <span>US Federal Register, UK FCA, EU EUR-Lex, SG MAS, CA Gazette, AU OAIC</span>
        </div>
        <Link 
          href="/dashboard" 
          className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Open Full Surveillance Hub</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
