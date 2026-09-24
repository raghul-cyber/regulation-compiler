'use client';

import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#090B0E]"
      >
        {/* Layer 1: Restrained dark radial illumination at top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06)_0%,rgba(14,21,32,0.02)_50%,transparent_80%)] blur-3xl" />
        
        {/* Layer 2: Quiet, fine architectural grid */}
        <div className="absolute inset-0 rc-grid-background opacity-60 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_25%,black_40%,transparent_100%)]" />

        {/* Layer 3: Edge vignettes */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(9,11,14,0.7)_85%,#090B0E_100%)]" />
      </div>
    );
  }

  // Application pages: clean, quiet, distraction-free infrastructure backdrop
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#090B0E]"
    >
      {/* Subtle top ambient well */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.035)_0%,transparent_75%)] blur-3xl" />
      
      {/* Precision micro-grid */}
      <div className="absolute inset-0 rc-grid-background opacity-45 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_20%,black_30%,transparent_100%)]" />
    </div>
  );
}
