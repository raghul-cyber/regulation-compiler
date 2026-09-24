'use client';

import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    // On the landing page, the 3D ComplianceField WebGL canvas is active.
    // We provide subtle non-intrusive edge vignette & atmospheric depth without occluding the 3D scene.
    return (
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Soft Radial Edge Vignette to frame 3D WebGL computational field */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,12,0.35)_75%,rgba(3,7,12,0.85)_100%)]" />
        {/* Subtle Top Ambient Horizon */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#03070C] via-[#03070C]/60 to-transparent opacity-80" />
        {/* Subtle Bottom Grounding Horizon */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#03070C] via-[#03070C]/70 to-transparent" />
      </div>
    );
  }

  // On ALL application pages (/dashboard, /regulations, /compliance-check, /billing, /admin, etc.)
  // Render the bespoke AETHER-STITCH Cyber-Statutory atmosphere.
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#03070C]"
    >
      {/* 1. Tactical Micro-Grid Matrix with Radial Masking */}
      <div 
        className="absolute inset-0 stitch-grid-mesh opacity-70 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,black_40%,transparent_100%)]" 
      />

      {/* 2. Top-Left Luminescent Cyan Optical Flare */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,rgba(0,240,255,0.02)_45%,transparent_70%)] blur-2xl" />

      {/* 3. Top-Right Deep Tactical Blue Atmospheric Well */}
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.07)_0%,rgba(59,130,246,0.015)_50%,transparent_70%)] blur-3xl" />

      {/* 4. Center-Bottom Statutory Emerald Surveillance Well */}
      <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.045)_0%,rgba(16,185,129,0.01)_50%,transparent_70%)] blur-3xl" />

      {/* 5. Precision Tactical Corner HUD Markers */}
      <div className="absolute top-20 left-6 hidden xl:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-600/70 select-none">
        <span className="text-[#00F0FF]/60">+</span>
        <span>LAT: 52.3676°N / STAT-AST-NODE</span>
        <span className="text-[#00F0FF]/60">+</span>
      </div>

      <div className="absolute top-20 right-6 hidden xl:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-600/70 select-none">
        <span className="text-emerald-500/60">+</span>
        <span>SURVEILLANCE: CONTINUOUS</span>
        <span className="text-emerald-500/60">+</span>
      </div>

      <div className="absolute bottom-16 left-6 hidden xl:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-600/70 select-none">
        <span className="text-blue-500/60">+</span>
        <span>CRYPTOGRAPHIC SHA-256 VERIFIED</span>
        <span className="text-blue-500/60">+</span>
      </div>

      <div className="absolute bottom-16 right-6 hidden xl:flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-600/70 select-none">
        <span className="text-[#00F0FF]/60">+</span>
        <span>AETHER-STITCH PROTOCOL v2.4</span>
        <span className="text-[#00F0FF]/60">+</span>
      </div>
    </div>
  );
}
