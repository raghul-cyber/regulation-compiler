'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  // Desktop interactive mouse parallax for physical light response
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const targetPosRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if device supports mouse hover & screen is desktop size
    const checkDesktop = () => {
      const isLarge = window.innerWidth >= 1024;
      const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsDesktop(isLarge && hasHover && !prefersReducedMotion);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalize from -1 to 1
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      targetPosRef.current = { x: normX, y: normY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth lerp loop for physical inertia
    const updateParallax = () => {
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * 0.05;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * 0.05;
      setMousePos({
        x: Math.round(currentPosRef.current.x * 100) / 100,
        y: Math.round(currentPosRef.current.y * 100) / 100,
      });
      rafIdRef.current = requestAnimationFrame(updateParallax);
    };

    rafIdRef.current = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const parallaxX = isDesktop ? mousePos.x * 15 : 0;
  const parallaxY = isDesktop ? mousePos.y * 12 : 0;
  const parallaxOppositeX = isDesktop ? mousePos.x * -12 : 0;
  const parallaxOppositeY = isDesktop ? mousePos.y * -10 : 0;

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080706] select-none"
    >
      {/* ========================================================================
          LAYER 1: DEEP OBSIDIAN & GRAPHITE BASE FOUNDATION
          Rich dark tonal gradient (#080706 -> #10100F -> #080706)
          ======================================================================== */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0A09] via-[#10100F] to-[#080706]" />

      {/* ========================================================================
          LAYER 2: UPPER-RIGHT CHAMPAGNE / WARM GOLD ARCHITECTURAL LIGHT
          Enormous soft atmospheric light field (8–15% visible influence)
          ======================================================================== */}
      <div 
        className="absolute -top-[15%] right-[-10%] w-[1200px] h-[950px] rounded-full blur-[140px] rc-ambient-drift-champagne"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(199, 175, 123, 0.16) 0%, rgba(185, 164, 122, 0.10) 35%, rgba(33, 25, 21, 0.06) 65%, transparent 85%)',
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* ========================================================================
          LAYER 3: DEEP SAPPHIRE REFLECTION (LEFT / UPPER-LEFT)
          Brushed titanium cool reflection reflecting computational precision
          ======================================================================== */}
      <div 
        className="absolute top-[18%] -left-[15%] w-[1250px] h-[900px] rounded-full blur-[150px] rc-ambient-drift-sapphire"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(38, 62, 85, 0.28) 0%, rgba(72, 105, 132, 0.14) 40%, rgba(20, 28, 36, 0.06) 70%, transparent 88%)',
          transform: `translate3d(${parallaxOppositeX}px, ${parallaxOppositeY}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* ========================================================================
          LAYER 4: SMOKED PLUM & DEEP BURGUNDY VELVET ATMOSPHERE (LOWER HERO)
          Frames the hero typography and central content from below
          ======================================================================== */}
      <div 
        className="absolute top-[48%] left-[10%] w-[1300px] h-[750px] rounded-full blur-[160px] rc-ambient-drift-plum"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(50, 29, 36, 0.22) 0%, rgba(36, 25, 31, 0.12) 45%, rgba(16, 14, 13, 0.05) 75%, transparent 90%)',
          transform: `translate3d(${parallaxX * 0.7}px, ${parallaxY * 0.7}px, 0)`,
          willChange: 'transform',
        }}
      />

      {/* ========================================================================
          LAYER 5: SECONDARY SAPPHIRE METALLIC ACCENT (MID-RIGHT)
          Gives visual richness to the right specification and preview rails
          ======================================================================== */}
      {isLanding && (
        <div 
          className="absolute top-[55%] -right-[8%] w-[900px] h-[700px] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(49, 75, 99, 0.18) 0%, rgba(33, 49, 64, 0.08) 50%, transparent 80%)',
            transform: `translate3d(${parallaxOppositeX * 0.6}px, ${parallaxOppositeY * 0.6}px, 0)`,
          }}
        />
      )}

      {/* ========================================================================
          LAYER 6: LIQUID METAL FLOW & ABSTRACT ARCHITECTURAL CURVATURE
          Flowing metallic contours: black chrome, smoked titanium, champagne edge
          ======================================================================== */}
      <div className="absolute inset-0 overflow-hidden opacity-40 mix-blend-screen pointer-events-none">
        <svg 
          viewBox="0 0 1600 1000" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Liquid Metal Specular Gradient */}
            <linearGradient id="liquidMetal1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#486984" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#C7AF7B" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#24191F" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#171716" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="liquidMetal2" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#B9A47A" stopOpacity="0.20" />
              <stop offset="50%" stopColor="#263E55" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#080706" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="champagneContour" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#C7AF7B" stopOpacity="0" />
              <stop offset="30%" stopColor="#C7AF7B" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#B9A47A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#B9A47A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Flowing Architectural Band 1 */}
          <path 
            d="M-200,300 C300,150 700,500 1200,280 C1500,150 1700,350 1900,200" 
            stroke="url(#liquidMetal1)" 
            strokeWidth="1.5" 
            fill="none"
          />

          {/* Flowing Architectural Band 2 (Parallel Contour) */}
          <path 
            d="M-150,380 C350,230 750,570 1250,350 C1550,220 1750,420 1950,270" 
            stroke="url(#liquidMetal2)" 
            strokeWidth="1" 
            strokeDasharray="4 8"
            fill="none"
          />

          {/* Sweeping Champagne Highlight Band */}
          <path 
            d="M-100,550 C400,450 850,750 1350,500 C1650,350 1850,550 2000,400" 
            stroke="url(#champagneContour)" 
            strokeWidth="1.2" 
            fill="none"
          />
        </svg>
      </div>

      {/* ========================================================================
          LAYER 7: ABSTRACT COMPILER FLOW GEOMETRY & ARCHITECTURAL GRID
          Precision concentric arcs, coordinates, and compiler pathway motifs (4–8%)
          ======================================================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg 
          viewBox="0 0 1600 1000" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Concentric Precision Arcs centered on upper right */}
          <circle cx="1200" cy="220" r="280" stroke="rgba(199, 175, 123, 0.05)" strokeWidth="1" />
          <circle cx="1200" cy="220" r="420" stroke="rgba(199, 175, 123, 0.04)" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="1200" cy="220" r="600" stroke="rgba(72, 105, 132, 0.04)" strokeWidth="1" />
          <circle cx="1200" cy="220" r="820" stroke="rgba(72, 105, 132, 0.03)" strokeWidth="1" strokeDasharray="2 12" />

          {/* Sapphire Precision Arcs centered on lower left */}
          <circle cx="200" cy="750" r="350" stroke="rgba(38, 62, 85, 0.06)" strokeWidth="1" />
          <circle cx="200" cy="750" r="520" stroke="rgba(72, 105, 132, 0.04)" strokeWidth="1" strokeDasharray="4 8" />

          {/* Abstract Compiler Pathway Vectors (Legal Text → AST → Policy → Verification) */}
          <g opacity="0.07">
            {/* Horizontal Guide Rails */}
            <line x1="120" y1="180" x2="1480" y2="180" stroke="#C7AF7B" strokeWidth="1" strokeDasharray="1 15" />
            <line x1="120" y1="480" x2="1480" y2="480" stroke="#486984" strokeWidth="1" strokeDasharray="1 20" />
            <line x1="120" y1="780" x2="1480" y2="780" stroke="#C7AF7B" strokeWidth="1" strokeDasharray="1 15" />

            {/* Vertical Dimension Lines */}
            <line x1="280" y1="100" x2="280" y2="900" stroke="#486984" strokeWidth="1" strokeDasharray="2 10" />
            <line x1="800" y1="100" x2="800" y2="900" stroke="#C7AF7B" strokeWidth="1" strokeDasharray="2 12" />
            <line x1="1320" y1="100" x2="1320" y2="900" stroke="#486984" strokeWidth="1" strokeDasharray="2 10" />

            {/* Crosshair Intersections */}
            <path d="M276,180 L284,180 M280,176 L280,184" stroke="#C7AF7B" strokeWidth="1" />
            <path d="M800,180 L808,180 M804,176 L804,184" stroke="#C7AF7B" strokeWidth="1" />
            <path d="M1316,180 L1324,180 M1320,176 L1320,184" stroke="#C7AF7B" strokeWidth="1" />

            <path d="M276,480 L284,480 M280,476 L280,484" stroke="#486984" strokeWidth="1" />
            <path d="M800,480 L808,480 M804,476 L804,484" stroke="#486984" strokeWidth="1" />
            <path d="M1316,480 L1324,480 M1320,476 L1320,484" stroke="#486984" strokeWidth="1" />

            <path d="M276,780 L284,780 M280,776 L280,784" stroke="#C7AF7B" strokeWidth="1" />
            <path d="M800,780 L808,780 M804,776 L804,784" stroke="#C7AF7B" strokeWidth="1" />
            <path d="M1316,780 L1324,780 M1320,776 L1320,784" stroke="#C7AF7B" strokeWidth="1" />
          </g>

          {/* Technical Engineering Metadata Stamps (Monospace micro typography in geometry) */}
          <g fill="#A9A8A4" opacity="0.06" fontFamily="var(--font-mono, monospace)" fontSize="8" letterSpacing="0.1em">
            <text x="290" y="172">RC.SYS.SPEC // 2026.04</text>
            <text x="810" y="172">COORD // LAT 51.5074 N</text>
            <text x="1330" y="172">PIPELINE.AST // 0x4D8F</text>
            <text x="290" y="472">KERNEL // INGESTION.LIVE</text>
            <text x="1330" y="472">VERIFY // CIPHER.BLAKE3</text>
            <text x="290" y="772">JURISDICTION // GLOBAL.CANONICAL</text>
            <text x="1330" y="772">TELEMETRY // LATENCY &lt;50MS</text>
          </g>
        </svg>
      </div>

      {/* ========================================================================
          LAYER 8: ARCHITECTURAL MICRO-GRID (Subtle precision background)
          ======================================================================== */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(199, 175, 123, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(72, 105, 132, 0.20) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 90%)',
        }}
      />

      {/* ========================================================================
          LAYER 9: TACTILE MICROSCOPIC FILM GRAIN (1.8% Opacity)
          Eliminates banding and imparts physical digital titanium texture
          ======================================================================== */}
      <div 
        className="absolute inset-0 opacity-[0.024] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ========================================================================
          LAYER 10: CINEMATIC VIGNETTE & DEPTH FALLOFF
          Rich illuminated center, deep titanium edges, darkest obsidian corners
          ======================================================================== */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(16, 16, 15, 0.45) 75%, rgba(8, 7, 6, 0.88) 95%, #080706 100%)',
        }}
      />
    </div>
  );
}
