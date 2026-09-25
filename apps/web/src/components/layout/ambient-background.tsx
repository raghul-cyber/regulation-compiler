'use client';

import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050608]"
    >
      {/* LAYER 1: Deep Blackened Titanium Foundation (#050608 with subtle tonal variation) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080A0D] via-[#060709] to-[#050608]" />

      {/* LAYER 2: Studio Top-Down Directional Illumination (Simulates soft directional studio key light) */}
      <div 
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1500px] h-[850px] bg-[radial-gradient(ellipse_at_top,rgba(216,208,191,0.035)_0%,rgba(142,165,188,0.04)_35%,rgba(9,11,15,0.01)_70%,transparent_85%)] blur-[140px] rc-ambient-glow-1" 
      />

      {/* LAYER 3: Soft Lateral Ambient Bounce Light (Steel Blue & Muted Champagne reflections) */}
      <div 
        className="absolute top-[35%] -left-[15%] w-[1100px] h-[750px] bg-[radial-gradient(ellipse_at_center,rgba(102,139,174,0.03)_0%,rgba(7,8,10,0.01)_60%,transparent_80%)] blur-[150px] rc-ambient-glow-2" 
      />
      {isLanding && (
        <div 
          className="absolute top-[65%] -right-[15%] w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(199,181,138,0.02)_0%,rgba(5,6,8,0.01)_60%,transparent_80%)] blur-[140px]" 
        />
      )}

      {/* LAYER 4: Micro-Grain Stipple (Physical blackened titanium surface texture, 2.5% opacity) */}
      <div 
        className="absolute inset-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* LAYER 5: Architectural Technical Drafting Lines & Micro-Grid */}
      <div className="absolute inset-0 rc-grid-background opacity-35 [mask-image:radial-gradient(ellipse_85%_70%_at_50%_30%,black_40%,transparent_90%)]" />

      {/* LAYER 6: Subtle Edge Vignette (Natural falloff focusing eye on the architectural center) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_50%,rgba(5,6,8,0.65)_85%,#050608_100%)]" />
    </div>
  );
}
