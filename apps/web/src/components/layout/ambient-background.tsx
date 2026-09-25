'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  // Desktop interactive mouse parallax for physical light response
  const [isDesktop, setIsDesktop] = useState(false);
  const [offsets, setOffsets] = useState({
    layer1: { x: 0, y: 0 },
    layer2: { x: 0, y: 0 },
    layer3: { x: 0, y: 0 },
    layer4: { x: 0, y: 0 },
  });
  const [cursorLight, setCursorLight] = useState({ x: -1000, y: -1000, active: false });

  // Spring & inertia physics references
  const targetPosRef = useRef({ x: 0, y: 0 }); // normalized -1 to 1
  const currentPosRef = useRef({ x: 0, y: 0 });
  const mouseScreenRef = useRef({ x: -1000, y: -1000 });
  const cursorLagRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);
  const scrollLagRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if device supports fine pointer & hover (desktop) & prefers motion
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
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;
      targetPosRef.current = { x: normX, y: normY };
      mouseScreenRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Smooth inertia and spring interpolation loop
    let lastTime = performance.now();
    const updatePhysics = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Spring lerp for mouse parallax
      const lerpFactor = Math.min(dt * 3.5, 0.12);
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * lerpFactor;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * lerpFactor;

      // Smooth lag for scroll
      scrollLagRef.current += (scrollRef.current - scrollLagRef.current) * Math.min(dt * 4, 0.15);

      // Smooth studio light cursor follow
      if (mouseScreenRef.current.x > 0) {
        if (cursorLagRef.current.x < 0) {
          cursorLagRef.current = { ...mouseScreenRef.current };
        } else {
          cursorLagRef.current.x += (mouseScreenRef.current.x - cursorLagRef.current.x) * Math.min(dt * 5, 0.18);
          cursorLagRef.current.y += (mouseScreenRef.current.y - cursorLagRef.current.y) * Math.min(dt * 5, 0.18);
        }
      }

      const mx = currentPosRef.current.x;
      const my = currentPosRef.current.y;
      const sy = scrollLagRef.current;

      setOffsets({
        // Layer 1 (Background): 1–3px
        layer1: {
          x: Math.round(mx * 2.5 * 10) / 10,
          y: Math.round((my * 2.0 - sy * 0.015) * 10) / 10,
        },
        // Layer 2 (Atmosphere): 3–6px
        layer2: {
          x: Math.round(mx * 5.5 * 10) / 10,
          y: Math.round((my * 4.5 - sy * 0.035) * 10) / 10,
        },
        // Layer 3 (Geometry): 5–10px
        layer3: {
          x: Math.round(mx * -8.0 * 10) / 10,
          y: Math.round((my * -7.0 - sy * 0.06) * 10) / 10,
        },
        // Layer 4 (Foreground highlights & liquid lines): 8–15px
        layer4: {
          x: Math.round(mx * 12.0 * 10) / 10,
          y: Math.round((my * 10.0 - sy * 0.09) * 10) / 10,
        },
      });

      if (cursorLagRef.current.x > 0) {
        setCursorLight({
          x: Math.round(cursorLagRef.current.x),
          y: Math.round(cursorLagRef.current.y),
          active: true,
        });
      }

      rafIdRef.current = requestAnimationFrame(updatePhysics);
    };

    rafIdRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#090B0F] select-none"
    >
      {/* ========================================================================
          LAYER 1: DEEP OBSIDIAN & GRAPHITE FOUNDATION (1–3px subtle inertia)
          Rich slate gradient (#090B0F -> #0C0F14 -> #12161C -> #090B0F)
          ======================================================================== */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#090B0F] via-[#0C0F14] to-[#090B0F] transition-transform duration-300 ease-out"
        style={{
          transform: isDesktop ? `translate3d(${offsets.layer1.x}px, ${offsets.layer1.y}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      />

      {/* ========================================================================
          LAYER 2A: TOP-RIGHT WARM CHAMPAGNE LIGHT FIELD (3–6px inertia)
          Rich warm metallic glow (#BCA77B / #D0BE91), 12–16% visual influence
          ======================================================================== */}
      <div 
        className="absolute -top-[12%] -right-[8%] w-[1200px] h-[950px] rounded-full blur-[140px] rc-ambient-drift-champagne"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(188, 167, 123, 0.18) 0%, rgba(205, 185, 139, 0.12) 35%, rgba(48, 35, 47, 0.08) 65%, transparent 85%)',
          transform: isDesktop ? `translate3d(${offsets.layer2.x}px, ${offsets.layer2.y}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      />

      {/* ========================================================================
          LAYER 2B: TOP-LEFT COOL DEEP SAPPHIRE FIELD (3–6px counter inertia)
          Brushed blue steel sapphire illumination (#4D78A0 / #587F9F)
          ======================================================================== */}
      <div 
        className="absolute top-[12%] -left-[14%] w-[1300px] h-[920px] rounded-full blur-[150px] rc-ambient-drift-sapphire"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(77, 120, 160, 0.28) 0%, rgba(88, 127, 159, 0.16) 40%, rgba(23, 36, 51, 0.08) 70%, transparent 88%)',
          transform: isDesktop ? `translate3d(${-offsets.layer2.x * 1.1}px, ${-offsets.layer2.y * 1.1}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      />

      {/* ========================================================================
          LAYER 2C: LOWER CENTER DUSKY PLUM & BURGUNDY DEPTH (3–6px inertia)
          Rich atmospheric velvet warmth (#30232F / #4A2830)
          ======================================================================== */}
      <div 
        className="absolute top-[48%] left-[8%] w-[1350px] h-[800px] rounded-full blur-[160px] rc-ambient-drift-plum"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(74, 40, 48, 0.22) 0%, rgba(48, 35, 47, 0.14) 45%, rgba(18, 22, 28, 0.06) 75%, transparent 90%)',
          transform: isDesktop ? `translate3d(${offsets.layer2.x * 0.8}px, ${offsets.layer2.y * 0.8}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      />

      {/* ========================================================================
          LAYER 2D: HERO WARM IVORY STUDIO AURA (CENTER)
          Very soft diffuse center glow behind hero headline
          ======================================================================== */}
      {isLanding && (
        <div 
          className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full blur-[130px] opacity-70"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(243, 244, 242, 0.06) 0%, rgba(188, 167, 123, 0.05) 50%, transparent 80%)',
            transform: isDesktop ? `translate3d(${offsets.layer1.x}px, ${offsets.layer1.y}px, 0)` : undefined,
          }}
        />
      )}

      {/* ========================================================================
          LAYER 3: FLUID LIGHT CURSOR FOLLOW (Studio Light with Smooth Delay)
          Soft diffuse studio light floating over surfaces (No visible circle)
          ======================================================================== */}
      {isDesktop && cursorLight.active && (
        <div 
          className="absolute w-[720px] h-[720px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700"
          style={{
            left: `${cursorLight.x - 360}px`,
            top: `${cursorLight.y - 360}px`,
            background: 'radial-gradient(circle at center, rgba(77, 120, 160, 0.12) 0%, rgba(188, 167, 123, 0.06) 45%, transparent 75%)',
            opacity: 0.85,
            willChange: 'left, top',
          }}
        />
      )}

      {/* ========================================================================
          LAYER 4: LIQUID SURFACE MOTION & METALLIC CONTOURS (8–15px inertia)
          Light traveling over liquid metal: sapphire steel, champagne contour
          ======================================================================== */}
      <div 
        className="absolute inset-0 overflow-hidden opacity-45 mix-blend-screen pointer-events-none"
        style={{
          transform: isDesktop ? `translate3d(${offsets.layer4.x}px, ${offsets.layer4.y}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      >
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
              <stop offset="0%" stopColor="#4D78A0" stopOpacity="0.32" />
              <stop offset="35%" stopColor="#7299B4" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#BCA77B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#12161C" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="liquidMetal2" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#D0BE91" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#4D78A0" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#30232F" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#090B0F" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="champagneContour" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#BCA77B" stopOpacity="0" />
              <stop offset="30%" stopColor="#CDB98B" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#BCA77B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#BCA77B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Flowing Architectural Band 1 */}
          <path 
            d="M-200,300 C300,150 700,500 1200,280 C1500,150 1700,350 1900,200" 
            stroke="url(#liquidMetal1)" 
            strokeWidth="1.6" 
            fill="none"
          />

          {/* Flowing Architectural Band 2 (Parallel Contour) */}
          <path 
            d="M-150,380 C350,230 750,570 1250,350 C1550,220 1750,420 1950,270" 
            stroke="url(#liquidMetal2)" 
            strokeWidth="1.2" 
            strokeDasharray="4 8"
            fill="none"
          />

          {/* Sweeping Champagne Highlight Band */}
          <path 
            d="M-100,550 C400,450 850,750 1350,500 C1650,350 1850,550 2000,400" 
            stroke="url(#champagneContour)" 
            strokeWidth="1.4" 
            fill="none"
          />
        </svg>
      </div>

      {/* ========================================================================
          LAYER 5: ABSTRACT COMPILER PIPELINE & SYNTAX TREE GEOMETRY (5–10px inertia)
          Precision concentric arcs, AST vectors, and technical metadata stamps
          ======================================================================== */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          transform: isDesktop ? `translate3d(${offsets.layer3.x}px, ${offsets.layer3.y}px, 0)` : undefined,
          willChange: isDesktop ? 'transform' : undefined,
        }}
      >
        <svg 
          viewBox="0 0 1600 1000" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Concentric Precision Arcs centered on upper right */}
          <circle cx="1200" cy="220" r="280" stroke="rgba(188, 167, 123, 0.08)" strokeWidth="1" />
          <circle cx="1200" cy="220" r="420" stroke="rgba(188, 167, 123, 0.06)" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="1200" cy="220" r="620" stroke="rgba(77, 120, 160, 0.06)" strokeWidth="1" />
          <circle cx="1200" cy="220" r="840" stroke="rgba(77, 120, 160, 0.04)" strokeWidth="1" strokeDasharray="2 12" />

          {/* Sapphire Precision Arcs centered on lower left */}
          <circle cx="200" cy="750" r="350" stroke="rgba(77, 120, 160, 0.08)" strokeWidth="1" />
          <circle cx="200" cy="750" r="540" stroke="rgba(114, 153, 180, 0.05)" strokeWidth="1" strokeDasharray="4 8" />

          {/* Abstract Compiler Pathway Vectors (Legal Text -> AST -> Policy -> Verification) */}
          <g opacity="0.10">
            {/* Horizontal Guide Rails */}
            <line x1="120" y1="180" x2="1480" y2="180" stroke="#BCA77B" strokeWidth="1" strokeDasharray="1 15" />
            <line x1="120" y1="480" x2="1480" y2="480" stroke="#4D78A0" strokeWidth="1" strokeDasharray="1 20" />
            <line x1="120" y1="780" x2="1480" y2="780" stroke="#BCA77B" strokeWidth="1" strokeDasharray="1 15" />

            {/* Vertical Dimension Lines */}
            <line x1="280" y1="100" x2="280" y2="900" stroke="#4D78A0" strokeWidth="1" strokeDasharray="2 10" />
            <line x1="800" y1="100" x2="800" y2="900" stroke="#BCA77B" strokeWidth="1" strokeDasharray="2 12" />
            <line x1="1320" y1="100" x2="1320" y2="900" stroke="#4D78A0" strokeWidth="1" strokeDasharray="2 10" />

            {/* Crosshair Intersections */}
            <path d="M276,180 L284,180 M280,176 L280,184" stroke="#BCA77B" strokeWidth="1" />
            <path d="M800,180 L808,180 M804,176 L804,184" stroke="#BCA77B" strokeWidth="1" />
            <path d="M1316,180 L1324,180 M1320,176 L1320,184" stroke="#BCA77B" strokeWidth="1" />

            <path d="M276,480 L284,480 M280,476 L280,484" stroke="#4D78A0" strokeWidth="1" />
            <path d="M800,480 L808,480 M804,476 L804,484" stroke="#4D78A0" strokeWidth="1" />
            <path d="M1316,480 L1324,480 M1320,476 L1320,484" stroke="#4D78A0" strokeWidth="1" />

            <path d="M276,780 L284,780 M280,776 L280,784" stroke="#BCA77B" strokeWidth="1" />
            <path d="M800,780 L808,780 M804,776 L804,784" stroke="#BCA77B" strokeWidth="1" />
            <path d="M1316,780 L1324,780 M1320,776 L1320,784" stroke="#BCA77B" strokeWidth="1" />
          </g>

          {/* Technical Engineering Metadata Stamps */}
          <g fill="#AAB1BA" opacity="0.10" fontFamily="var(--font-mono, monospace)" fontSize="8" letterSpacing="0.1em">
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
          LAYER 6: ARCHITECTURAL MICRO-GRID (Hairline precision grid)
          ======================================================================== */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(188, 167, 123, 0.28) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(77, 120, 160, 0.24) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 35%, black 45%, transparent 90%)',
        }}
      />

      {/* ========================================================================
          LAYER 7: TACTILE MICROSCOPIC FILM GRAIN (1.8% Opacity)
          Eliminates banding and gives authentic tactile digital titanium texture
          ======================================================================== */}
      <div 
        className="absolute inset-0 opacity-[0.022] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ========================================================================
          LAYER 8: CINEMATIC VIGNETTE & DEPTH FALLOFF
          Rich illuminated center corridor, deep graphite edges, obsidian corners
          ======================================================================== */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(18, 22, 28, 0.40) 75%, rgba(12, 15, 20, 0.85) 95%, #090B0F 100%)',
        }}
      />
    </div>
  );
}
