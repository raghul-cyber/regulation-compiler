'use client';

import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080706]"
    >
      {/* LAYER 1: Deep Warm Obsidian Foundation (#080706 -> #0B0A09 -> #080706) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0A09] via-[#080706] to-[#060504]" />

      {/* LAYER 2: Smoked Espresso Warmth (Subtle deep warm undertone preventing sterile coldness) */}
      <div 
        className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1400px] h-[900px] bg-[radial-gradient(ellipse_at_top,rgba(26,21,18,0.45)_0%,rgba(16,14,13,0.2)_50%,transparent_80%)] blur-[160px] rc-ambient-glow-1" 
      />

      {/* LAYER 3: Dusky Plum Velvet Atmosphere (Upper-Right hemisphere smoked plum depth) */}
      <div 
        className="absolute top-[15%] -right-[15%] w-[1100px] h-[850px] bg-[radial-gradient(ellipse_at_center,rgba(32,23,28,0.30)_0%,rgba(24,18,21,0.12)_45%,transparent_75%)] blur-[170px]" 
      />

      {/* LAYER 4: Muted Sapphire Reflection (Left side cool brushed metal reflection) */}
      <div 
        className="absolute top-[35%] -left-[12%] w-[1100px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(52,77,99,0.22)_0%,rgba(31,43,54,0.08)_50%,transparent_75%)] blur-[160px] rc-ambient-glow-2" 
      />

      {/* LAYER 5: Antique Bronze Warmth (Lower regional luxury highlight) */}
      {isLanding && (
        <div 
          className="absolute top-[65%] right-[10%] w-[1000px] h-[750px] bg-[radial-gradient(ellipse_at_center,rgba(173,149,108,0.08)_0%,rgba(154,131,94,0.03)_40%,transparent_70%)] blur-[150px]" 
        />
      )}

      {/* LAYER 6: Directional Warm Ivory Key Light (Simulates soft architectural ceiling illumination) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(247,244,236,0.025)_0%,transparent_70%)] blur-[120px]" 
      />

      {/* LAYER 7: Microscopic Tactile Film Grain (1.8% opacity physical material texture) */}
      <div 
        className="absolute inset-0 opacity-[0.022] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* LAYER 8: Architectural Technical Drafting Lines & Micro-Grid (Warm ivory hairline) */}
      <div className="absolute inset-0 rc-grid-background opacity-25 [mask-image:radial-gradient(ellipse_85%_70%_at_50%_35%,black_40%,transparent_90%)]" />

      {/* LAYER 9: Soft Cinematic Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_50%,rgba(8,7,6,0.75)_85%,#080706_100%)]" />
    </div>
  );
}
