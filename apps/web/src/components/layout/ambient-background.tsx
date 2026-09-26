'use client';

import { usePathname } from 'next/navigation';
import { LuxuryCinematicBackground } from '@/components/layout/luxury-cinematic-background';

/**
 * ============================================================================
 * AMBIENT BACKGROUND CONTROLLER
 * ============================================================================
 * - Landing Page ('/'): Mounts the signature Ultra-Luxury Cinematic Interactive
 *   Animated Background (Canvas 2D engine with spring inertia, light flow,
 *   computational pathways, and dynamic scroll atmosphere).
 * - Application / Dashboard / Sub-pages: Mounts a calm, zero-overhead static
 *   obsidian / dark bronze ambient field with micro-texture, preserving peak
 *   application performance and focus.
 * ============================================================================
 */
export function AmbientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <LuxuryCinematicBackground />;
  }

  // Calm, static, low-motion luxury atmosphere for dashboard and inner app pages
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070706] select-none"
    >
      {/* Deep Obsidian & Warm Graphite Material Base */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#0B0A08] via-[#11100D] to-[#070706]" 
      />

      {/* Single Faint Warm Bronze / Champagne Ambient Glow (Upper Right) */}
      <div 
        className="absolute -top-[15%] -right-[10%] w-[900px] h-[750px] rounded-full blur-[140px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168, 135, 82, 0.12) 0%, rgba(140, 107, 66, 0.06) 45%, transparent 75%)',
        }}
      />

      {/* Subtle Dark Bronze Depth Reflection (Lower Left) */}
      <div 
        className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[650px] rounded-full blur-[150px] opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(118, 92, 58, 0.08) 0%, rgba(41, 32, 23, 0.05) 50%, transparent 80%)',
        }}
      />

      {/* Precision Micro-Texture (1.8% Tactile Grain) */}
      <div 
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Soft Vignette Falloff */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, transparent 50%, rgba(7, 7, 6, 0.50) 85%, #070706 100%)',
        }}
      />
    </div>
  );
}
