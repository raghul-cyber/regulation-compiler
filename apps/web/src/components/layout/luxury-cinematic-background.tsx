'use client';

import { useEffect, useRef } from 'react';

/**
 * ============================================================================
 * REGCOMPILER — CONTINUOUS CINEMATIC LUXURY BACKGROUND LOOP
 * ============================================================================
 * 
 * An autonomous, continuous, seamlessly looping visual material simulation:
 *   - Polished obsidian / black titanium / dark bronze luxury foundation
 *   - 90-Second Master Choreographed Loop:
 *       • 00s: Dark obsidian + rich golden reflection blooming on upper-right
 *       • 15s: Golden reflection gracefully curves across center corridor
 *       • 30s: Warm smoked amber enters from lower-left, enriching the metal
 *       • 45s: Bronze specular architecture & reflections become visible
 *       • 60s: Golden light expands and glides toward upper-left
 *       • 75s: Amber fades, secondary golden reflection blooms diagonally
 *       • 90s: Seamless crossfade back to 00s with zero visible jump or reset
 *   - Continuous Multi-Frequency Wave Harmonics:
 *       • Fluid 8s–14s wave undulation ensures VISIBLE MOTION every single second
 *       • Liquid gold reflection on curved black chrome surfaces
 *       • Abstract computational pathways (syntax tree vectors, statutory guide rails)
 *       • Traveling champagne logic compilation pulses
 *       • Micro golden dust motes drifting in active light fields
 *   - Strict UI Stability:
 *       • UI content remains 100% stable, legible, and clickable above it
 *       • Safe central reading zone protects hero headline & CTA contrast
 *       • Pointer events: none on background
 * ============================================================================
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
}

export function LuxuryCinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const isMobile = width < 768;
      // On mobile viewports, 1x DPR cuts pixel rendering operations by 75%, preserving 60fps and saving battery
      dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ========================================================================
    // SECONDARY GENTLE CURSOR DEFLECTION (Subtle physical nudge)
    // The animation NEVER depends on cursor movement.
    // ========================================================================
    const cursor = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      vx: 0,
      vy: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      cursor.targetX = (e.clientX / width) * 2 - 1;
      cursor.targetY = (e.clientY / height) * 2 - 1;
    };

    const handleMouseLeave = () => {
      cursor.targetX = 0;
      cursor.targetY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // ========================================================================
    // SCROLL PARALLAX WITH SMOOTH LAG
    // ========================================================================
    let targetScroll = window.scrollY;
    let scrollLag = targetScroll;

    const handleScroll = () => {
      targetScroll = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ========================================================================
    // LAYER 8: MICRO GOLDEN DUST (Strictly 16 motes on desktop, 8 on mobile)
    // ========================================================================
    const isMobileViewport = width < 768;
    const particleCount = isMobileViewport ? 8 : 16;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.12 - Math.random() * 0.24,
        size: 0.85 + Math.random() * 1.0,
        baseAlpha: 0.12 + Math.random() * 0.24,
        pulseSpeed: 1.5 + Math.random() * 2.0,
      });
    }

    // ========================================================================
    // SECTION-BASED COLOR ADAPTATION ALONG SCROLL DEPTH
    // ========================================================================
    interface ColorStop {
      goldR: number; goldG: number; goldB: number;
      amberR: number; amberG: number; amberB: number;
      bronzeR: number; bronzeG: number; bronzeB: number;
      lightPower: number;
    }

    const sectionProfiles: { stop: number; color: ColorStop }[] = [
      { stop: 0.00, color: { goldR: 195, goldG: 160, goldB: 98, amberR: 175, amberG: 115, amberB: 58, bronzeR: 160, bronzeG: 125, bronzeB: 75, lightPower: 1.20 } },
      { stop: 0.18, color: { goldR: 175, goldG: 140, goldB: 86, amberR: 150, amberG: 100, amberB: 52, bronzeR: 145, bronzeG: 112, bronzeB: 68, lightPower: 1.05 } },
      { stop: 0.35, color: { goldR: 185, goldG: 135, goldB: 72, amberR: 195, amberG: 125, amberB: 65, bronzeR: 135, bronzeG: 105, bronzeB: 65, lightPower: 1.10 } },
      { stop: 0.52, color: { goldR: 215, goldG: 188, goldB: 130, amberR: 165, amberG: 110, amberB: 58, bronzeR: 170, bronzeG: 135, bronzeB: 82, lightPower: 1.18 } },
      { stop: 0.70, color: { goldR: 175, goldG: 140, goldB: 86, amberR: 150, amberG: 100, amberB: 52, bronzeR: 140, bronzeG: 110, bronzeB: 68, lightPower: 1.02 } },
      { stop: 0.85, color: { goldR: 205, goldG: 168, goldB: 105, amberR: 160, amberG: 105, amberB: 55, bronzeR: 155, bronzeG: 120, bronzeB: 72, lightPower: 1.12 } },
      { stop: 1.00, color: { goldR: 195, goldG: 160, goldB: 98, amberR: 180, amberG: 122, amberB: 65, bronzeR: 165, bronzeG: 130, bronzeB: 78, lightPower: 1.22 } },
    ];

    const getInterpolatedAtmosphere = (p: number): ColorStop => {
      const clamped = Math.max(0, Math.min(1, p));
      let idx = 0;
      for (let i = 0; i < sectionProfiles.length - 1; i++) {
        if (clamped >= sectionProfiles[i].stop && clamped <= sectionProfiles[i + 1].stop) {
          idx = i;
          break;
        }
      }
      const s0 = sectionProfiles[idx];
      const s1 = sectionProfiles[idx + 1] || s0;
      const t = (clamped - s0.stop) / ((s1.stop - s0.stop) || 1);
      const lerp = (a: number, b: number) => a + (b - a) * t;

      return {
        goldR: Math.round(lerp(s0.color.goldR, s1.color.goldR)),
        goldG: Math.round(lerp(s0.color.goldG, s1.color.goldG)),
        goldB: Math.round(lerp(s0.color.goldB, s1.color.goldB)),
        amberR: Math.round(lerp(s0.color.amberR, s1.color.amberR)),
        amberG: Math.round(lerp(s0.color.amberG, s1.color.amberB)),
        amberB: Math.round(lerp(s0.color.amberB, s1.color.amberB)),
        bronzeR: Math.round(lerp(s0.color.bronzeR, s1.color.bronzeR)),
        bronzeG: Math.round(lerp(s0.color.bronzeG, s1.color.bronzeG)),
        bronzeB: Math.round(lerp(s0.color.bronzeB, s1.color.bronzeB)),
        lightPower: lerp(s0.color.lightPower, s1.color.lightPower),
      };
    };

    // ========================================================================
    // RENDER LOOP (60FPS with 90s master loop & fluid harmonics)
    // ========================================================================
    let rafId: number | null = null;
    let lastTime = performance.now();
    let totalTime = 0;
    let isHidden = false;

    const onVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden) {
        lastTime = performance.now();
        if (!rafId && !prefersReducedMotion) {
          rafId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const render = (now: number) => {
      if (isHidden) return;

      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;
      totalTime += dt;

      // 1. Spring physics for secondary cursor deflection (heavy lag)
      const cdx = cursor.targetX - cursor.currentX;
      const cdy = cursor.targetY - cursor.currentY;
      cursor.vx = (cursor.vx + cdx * 0.04) * 0.85;
      cursor.vy = (cursor.vy + cdy * 0.04) * 0.85;
      cursor.currentX += cursor.vx;
      cursor.currentY += cursor.vy;

      // Subtle cursor nudge (capped at ±16px so it never overrides autonomous flow)
      const nudgeX = cursor.currentX * 16;
      const nudgeY = cursor.currentY * 12;

      // Smooth scroll parallax lag
      scrollLag += (targetScroll - scrollLag) * Math.min(dt * 4.5, 0.16);
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = scrollLag / maxScroll;
      const atmos = getInterpolatedAtmosphere(scrollProgress);

      // ======================================================================
      // 90-SECOND MASTER CHOREOGRAPHY LOOP (Section 41 Target Loop Experience)
      // Cycle: 90 seconds, perfectly continuous without any reset or jump
      // ======================================================================
      const CYCLE = 90;
      const t = totalTime % CYCLE;
      const phase = (t / CYCLE) * 2 * Math.PI;

      // Short fluid harmonics for noticeable organic motion every second
      const tFluid = totalTime * 0.45; // 14s fluid wave
      const tMicro = totalTime * 0.80; // 7.8s micro wave
      const waveOffset1X = Math.sin(tFluid) * 42;
      const waveOffset1Y = Math.cos(tFluid * 0.85) * 32;

      // ======================================================================
      // LAYER 1: DEEP OBSIDIAN FOUNDATION (#070706)
      // Tonal drift across polished black titanium
      // ======================================================================
      ctx.fillStyle = '#070706';
      ctx.fillRect(0, 0, width, height);

      const baseGrad = ctx.createLinearGradient(
        width * 0.15 + Math.sin(phase) * (width * 0.14),
        0,
        width * 0.85,
        height
      );
      baseGrad.addColorStop(0, '#0B0A08');
      baseGrad.addColorStop(0.30, '#11100D');
      baseGrad.addColorStop(0.65, '#17140F');
      baseGrad.addColorStop(1, '#070706');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ======================================================================
      // LAYER 2: DARK GRAPHITE ATMOSPHERIC FIELD (Slow Organic Undulation)
      // ======================================================================
      const atmosX = width * 0.50 + Math.sin(phase) * (width * 0.22) + nudgeX * 0.4;
      const atmosY = height * 0.44 + Math.cos(phase * 0.8) * (height * 0.16) + nudgeY * 0.4;
      const atmosRad = Math.max(width, height) * (0.72 + Math.sin(tFluid * 0.5) * 0.08);

      const atmosGrad = ctx.createRadialGradient(atmosX, atmosY, 0, atmosX, atmosY, atmosRad);
      atmosGrad.addColorStop(0, 'rgba(41, 32, 23, 0.42)'); // warm graphite
      atmosGrad.addColorStop(0.42, 'rgba(23, 20, 15, 0.25)'); // black titanium
      atmosGrad.addColorStop(0.80, 'rgba(11, 10, 8, 0.08)');
      atmosGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmosGrad;
      ctx.fillRect(0, 0, width, height);

      // Enable screen blend mode for rich luminous reflected light
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // ======================================================================
      // LAYER 3A: GOLDEN LIGHT WAVE 1 (The 90s Master Trajectory)
      // 00s: Upper right (bloom)
      // 15s: Curves across center corridor
      // 30s: Mid/lower left
      // 45s: Expands toward left edge
      // 60s: Moves toward upper left
      // 75s: Softens & diffuses across top, fading as Wave 2 dominates
      // 90s: Seamless return to upper right
      // ======================================================================
      // Parametric trajectory:
      // Using closed trigonometric harmonics matching the exact prompt path
      const p1 = phase;
      const gold1X = width * (0.50 + 0.28 * Math.cos(p1) + 0.10 * Math.sin(p1 * 2)) + waveOffset1X + nudgeX;
      const gold1Y = height * (0.36 + 0.18 * Math.sin(p1) - 0.08 * Math.cos(p1 * 2)) + waveOffset1Y + nudgeY;

      // Dynamic stretch & deformation (reflection on curved material)
      const gold1Stretch = Math.sin(p1 * 1.5) * 0.48 + Math.sin(tMicro * 0.5) * 0.10;
      const gold1RadX = (width * 0.48) * (1 + 0.16 * Math.sin(tFluid));
      const gold1RadY = (height * 0.38) * (1 - 0.12 * Math.sin(tFluid));

      // Luminous envelope: peaks at 00s-30s, diffuses at 45s-60s, softly recedes at 75s
      const gold1Alpha = (0.38 + 0.12 * Math.cos(p1)) * atmos.lightPower;

      ctx.save();
      ctx.translate(gold1X, gold1Y);
      ctx.rotate(gold1Stretch);
      ctx.scale(1, gold1RadY / gold1RadX);

      const gold1Grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gold1RadX);
      gold1Grad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${gold1Alpha})`);
      gold1Grad.addColorStop(0.24, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${gold1Alpha * 0.82})`);
      gold1Grad.addColorStop(0.52, `rgba(208, 181, 123, ${gold1Alpha * 0.45})`); // warm champagne mid-tone
      gold1Grad.addColorStop(0.80, `rgba(140, 107, 66, ${gold1Alpha * 0.15})`); // antique bronze edge
      gold1Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = gold1Grad;
      ctx.beginPath();
      ctx.arc(0, 0, gold1RadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3B: GOLDEN LIGHT WAVE 2 (The Diagonal Counter-Sweep, 45s offset)
      // Begins upper-left -> moves diagonally -> curves toward bottom-right
      // In full bloom between 50s and 85s when Wave 1 is softened
      // ======================================================================
      const p2 = phase + Math.PI; // 45-second phase shift
      const gold2X = width * (0.48 + 0.30 * Math.sin(p2) - 0.08 * Math.cos(p2 * 2)) - waveOffset1X * 0.7 + nudgeX * 0.8;
      const gold2Y = height * (0.48 + 0.22 * Math.cos(p2) + 0.06 * Math.sin(p2 * 2)) - waveOffset1Y * 0.7 + nudgeY * 0.8;

      const gold2Stretch = -0.36 + Math.cos(p2 * 1.2) * 0.42;
      const gold2RadX = (width * 0.44) * (1 + 0.14 * Math.cos(tFluid * 0.9));
      const gold2RadY = (height * 0.35) * (1 - 0.10 * Math.cos(tFluid * 0.9));
      const gold2Alpha = (0.34 + 0.12 * Math.cos(p2)) * atmos.lightPower;

      ctx.save();
      ctx.translate(gold2X, gold2Y);
      ctx.rotate(gold2Stretch);
      ctx.scale(1, gold2RadY / gold2RadX);

      const gold2Grad = ctx.createRadialGradient(0, 0, 0, 0, 0, gold2RadX);
      gold2Grad.addColorStop(0, `rgba(215, 188, 130, ${gold2Alpha})`); // warm champagne core
      gold2Grad.addColorStop(0.28, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${gold2Alpha * 0.76})`);
      gold2Grad.addColorStop(0.62, `rgba(160, 125, 75, ${gold2Alpha * 0.36})`); // rich bronze
      gold2Grad.addColorStop(1, 'transparent');

      ctx.fillStyle = gold2Grad;
      ctx.beginPath();
      ctx.arc(0, 0, gold2RadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3C: HERO ATMOSPHERIC GOLDEN AURA (Framing behind hero content)
      // Continuously breathes, expands, and contracts gently
      // ======================================================================
      const auraX = width * 0.50 + Math.sin(phase * 0.8) * (width * 0.06) + nudgeX * 0.3;
      const auraY = height * 0.28 + Math.cos(phase * 0.6) * (height * 0.05) + nudgeY * 0.3;
      const auraRadius = (width * 0.48) * (1 + 0.08 * Math.sin(tFluid * 0.6));
      const auraAlpha = (0.22 + 0.06 * Math.sin(phase)) * atmos.lightPower;

      const auraGrad = ctx.createRadialGradient(auraX, auraY, 0, auraX, auraY, auraRadius);
      auraGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${auraAlpha})`);
      auraGrad.addColorStop(0.32, `rgba(208, 181, 123, ${auraAlpha * 0.62})`);
      auraGrad.addColorStop(0.68, `rgba(41, 32, 23, ${auraAlpha * 0.18})`);
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(auraX, auraY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 4: WARM AMBER / BURNT ORANGE FIELD (30s peak, 75s fade)
      // Enters from lower-left around 30s, swells into rich burnt amber,
      // fades around 75s (Section 41)
      // ======================================================================
      // Amber envelope peaks around t = 30s to 50s (sin(phase - 0.7))
      const amberWave = Math.sin(phase - 0.7);
      const amberAlpha = Math.max(0.12, (0.28 + 0.14 * amberWave)) * atmos.lightPower;
      const amberX = width * (0.28 + 0.22 * Math.cos(phase * 0.9)) + Math.sin(tFluid * 1.1) * 28 - nudgeX * 0.6;
      const amberY = height * (0.64 + 0.14 * Math.sin(phase * 0.8)) - (scrollProgress * height * 0.12) - nudgeY * 0.6;
      const amberRadius = (width * 0.42) * (1 + 0.10 * Math.sin(tFluid * 0.8));

      const amberGrad = ctx.createRadialGradient(amberX, amberY, 0, amberX, amberY, amberRadius);
      amberGrad.addColorStop(0, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha})`);
      amberGrad.addColorStop(0.35, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha * 0.70})`);
      amberGrad.addColorStop(0.70, `rgba(41, 32, 23, ${amberAlpha * 0.24})`);
      amberGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(amberX, amberY, amberRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 5A & 5B: BRONZE SPECULAR SLABS (Black Chrome Reflections)
      // Peaks around 45s (Section 41), sweeping across invisible architectural planes
      // ======================================================================
      // Bronze envelope peaks at t = 45s (sin(phase - 1.5))
      const bronzeBloom = Math.sin(phase - 1.5);
      const bronzeAlphaA = Math.max(0.16, (0.30 + 0.14 * bronzeBloom)) * atmos.lightPower;

      const bronzeAX = width * (0.64 + 0.16 * Math.sin(phase * 1.1)) + nudgeX * 0.7;
      const bronzeAY = height * (0.32 + 0.12 * Math.cos(phase * 0.9)) + nudgeY * 0.7;
      const bronzeAngleA = -0.32 + Math.sin(tFluid * 0.6) * 0.22;

      ctx.save();
      ctx.translate(bronzeAX, bronzeAY);
      ctx.rotate(bronzeAngleA);

      const specGradA = ctx.createLinearGradient(-480, 0, 480, 0);
      specGradA.addColorStop(0, 'transparent');
      specGradA.addColorStop(0.28, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaA * 0.45})`);
      specGradA.addColorStop(0.50, `rgba(215, 188, 130, ${bronzeAlphaA * 1.25})`); // Soft gold champagne crest
      specGradA.addColorStop(0.72, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaA * 0.40})`);
      specGradA.addColorStop(1, 'transparent');

      ctx.fillStyle = specGradA;
      ctx.fillRect(-560, -28, 1120, 56);
      ctx.restore();

      // Slab B (Counter-angle bronze reflection on lower plane)
      const bronzeAlphaB = (0.22 + 0.08 * Math.cos(phase * 1.2)) * atmos.lightPower;
      const bronzeBX = width * (0.35 + 0.18 * Math.cos(phase * 0.8)) - nudgeX * 0.5;
      const bronzeBY = height * (0.68 + 0.12 * Math.sin(phase * 0.7)) - nudgeY * 0.5;
      const bronzeAngleB = 0.26 + Math.cos(tFluid * 0.5) * 0.16;

      ctx.save();
      ctx.translate(bronzeBX, bronzeBY);
      ctx.rotate(bronzeAngleB);

      const specGradB = ctx.createLinearGradient(-400, 0, 400, 0);
      specGradB.addColorStop(0, 'transparent');
      specGradB.addColorStop(0.32, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${bronzeAlphaB * 0.45})`);
      specGradB.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${bronzeAlphaB * 1.10})`);
      specGradB.addColorStop(0.68, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaB * 0.38})`);
      specGradB.addColorStop(1, 'transparent');

      ctx.fillStyle = specGradB;
      ctx.fillRect(-450, -22, 900, 44);
      ctx.restore();

      // ======================================================================
      // LAYER 6: ARCHITECTURAL COMPUTATIONAL PATHWAYS (Fluid undulation)
      // Abstract syntax trees, branching logic, engineered fluid contours
      // Plus traveling champagne logic pulses along the pathways!
      // ======================================================================
      // Control points undulating on short fluid harmonic waves (noticeable motion every second)
      const wave1C1X = width * 0.45 + Math.sin(tFluid) * 85 + nudgeX;
      const wave1C1Y = height * 0.14 + Math.cos(tFluid * 1.1) * 60 + nudgeY;
      const wave1C2X = width * 0.82 + Math.cos(tFluid * 0.85) * 75 + nudgeX;
      const wave1C2Y = height * 0.35 + Math.sin(tFluid * 0.95) * 50 + nudgeY;

      // Pathway 1: Upper Golden Wave
      const p1Grad = ctx.createLinearGradient(0, height * 0.15, width, height * 0.45);
      p1Grad.addColorStop(0, 'transparent');
      p1Grad.addColorStop(0.18, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.10)`);
      p1Grad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.44 * atmos.lightPower})`);
      p1Grad.addColorStop(0.80, `rgba(215, 188, 130, ${0.34 * atmos.lightPower})`);
      p1Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p1Grad;
      ctx.lineWidth = 1.6 + 0.4 * Math.sin(tMicro);
      ctx.beginPath();
      ctx.moveTo(-120, height * 0.25);
      ctx.bezierCurveTo(wave1C1X, wave1C1Y, wave1C2X, wave1C2Y, width + 120, height * 0.18);
      ctx.stroke();

      // Pathway 2: Parallel Precision Contour (Statutory dotted guide rail)
      ctx.save();
      ctx.setLineDash([5, 12]);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${0.28 * atmos.lightPower})`;
      ctx.beginPath();
      ctx.moveTo(-120, height * 0.31);
      ctx.bezierCurveTo(
        wave1C1X + 35, wave1C1Y + 60,
        wave1C2X - 30, wave1C2Y + 50,
        width + 120, height * 0.25
      );
      ctx.stroke();
      ctx.restore();

      // Pathway 3: Branching Computational Flow (Syntax Tree Vector)
      const wave3C1X = width * 0.30 + Math.cos(tFluid * 0.9) * 70 - nudgeX;
      const wave3C1Y = height * 0.68 + Math.sin(tFluid * 0.75) * 45 - nudgeY;
      const wave3C2X = width * 0.75 + Math.sin(tFluid * 1.1) * 75 - nudgeX;
      const wave3C2Y = height * 0.50 + Math.cos(tFluid * 0.8) * 48 - nudgeY;

      const p3Grad = ctx.createLinearGradient(width * 0.12, height * 0.40, width * 0.88, height * 0.82);
      p3Grad.addColorStop(0, 'transparent');
      p3Grad.addColorStop(0.30, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${0.30 * atmos.lightPower})`);
      p3Grad.addColorStop(0.68, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.34 * atmos.lightPower})`);
      p3Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p3Grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-100, height * 0.60);
      ctx.bezierCurveTo(wave3C1X, wave3C1Y, wave3C2X, wave3C2Y, width + 120, height * 0.74);
      ctx.stroke();

      // Traveling Computational Logic Pulse (Glides smoothly along Pathway 1 every 8 seconds)
      const pulseT = (totalTime * 0.125) % 1;
      const u = pulseT;
      const invU = 1 - u;
      const pulseX = invU * invU * invU * (-120) + 3 * invU * invU * u * wave1C1X + 3 * invU * u * u * wave1C2X + u * u * u * (width + 120);
      const pulseY = invU * invU * invU * (height * 0.25) + 3 * invU * invU * u * wave1C1Y + 3 * invU * u * u * wave1C2Y + u * u * u * (height * 0.18);
      const pulseAlpha = Math.sin(pulseT * Math.PI) * 0.42 * atmos.lightPower;

      if (pulseAlpha > 0.05) {
        const pulseGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 80);
        pulseGrad.addColorStop(0, `rgba(220, 195, 140, ${pulseAlpha})`);
        pulseGrad.addColorStop(0.40, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${pulseAlpha * 0.55})`);
        pulseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      // Abstract Compiler Intersections (Precision crosshairs that softly illuminate)
      const crosshairs = [
        { x: width * 0.24 + Math.sin(tFluid * 0.6) * 28, y: height * 0.22 },
        { x: width * 0.78 + Math.cos(tFluid * 0.7) * 30, y: height * 0.29 },
        { x: width * 0.46 + Math.sin(tFluid * 0.8) * 26, y: height * 0.65 },
      ];
      ctx.lineWidth = 0.9;
      crosshairs.forEach((ch) => {
        ctx.strokeStyle = `rgba(215, 188, 130, ${0.32 * atmos.lightPower})`;
        ctx.beginPath();
        ctx.moveTo(ch.x - 6, ch.y);
        ctx.lineTo(ch.x + 6, ch.y);
        ctx.moveTo(ch.x, ch.y - 6);
        ctx.lineTo(ch.x, ch.y + 6);
        ctx.stroke();
      });

      // ======================================================================
      // LAYER 7: CHAMPAGNE HORIZON & EDGE HIGHLIGHT ARC (34s loop)
      // Architectural curved light horizon
      // ======================================================================
      const pChamp = (totalTime % 34) / 34 * 2 * Math.PI;
      const orbitCenterX = width * (0.70 + 0.10 * Math.cos(pChamp)) + nudgeX * 0.6;
      const orbitCenterY = height * (0.24 + 0.08 * Math.sin(pChamp)) + nudgeY * 0.6;
      const orbitRadius = Math.min(width, height) * (0.42 + 0.05 * Math.sin(tMicro * 0.8));
      const orbitAlpha = (0.32 + 0.08 * Math.sin(pChamp)) * atmos.lightPower;

      ctx.save();
      ctx.lineWidth = 1.2;
      const orbitGrad = ctx.createLinearGradient(
        orbitCenterX - orbitRadius, orbitCenterY - orbitRadius,
        orbitCenterX + orbitRadius, orbitCenterY + orbitRadius
      );
      orbitGrad.addColorStop(0, `rgba(215, 188, 130, ${orbitAlpha})`); // Warm champagne top edge
      orbitGrad.addColorStop(0.48, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, 0.10)`);
      orbitGrad.addColorStop(1, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${orbitAlpha * 0.85})`); // Bronze lower edge

      ctx.strokeStyle = orbitGrad;
      ctx.beginPath();
      ctx.arc(orbitCenterX, orbitCenterY, orbitRadius, 0.40 * Math.PI, 1.60 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // ======================================================================
      // LAYER 8: MICRO GOLDEN DUST (16 particles, drifting in light fields)
      // ======================================================================
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dist1 = Math.hypot(p.x - gold1X, p.y - gold1Y);
        const dist2 = Math.hypot(p.x - gold2X, p.y - gold2Y);
        const lightIntensity = Math.max(0, 1 - Math.min(dist1, dist2) / (width * 0.46));
        const pulse = 1 + 0.3 * Math.sin(totalTime * p.pulseSpeed + idx);
        const finalAlpha = (p.baseAlpha + lightIntensity * 0.50) * pulse * atmos.lightPower;

        if (finalAlpha > 0.06) {
          ctx.fillStyle = `rgba(215, 188, 130, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore(); // Exit screen composite mode

      // ======================================================================
      // LAYER 9: SAFE CONTENT ZONE & SMOOTH CINEMATIC VIGNETTE
      // Gently preserves headline readability while leaving the outer 70% open
      // for the rich golden light fields to shine!
      // ======================================================================
      const safeCenterX = width * 0.50;
      const safeCenterY = height * 0.32;
      const safeRadiusX = width * 0.38;
      const safeRadiusY = height * 0.24;

      // Soft center calm mask (transparent falloff)
      ctx.save();
      const safeGrad = ctx.createRadialGradient(safeCenterX, safeCenterY, 0, safeCenterX, safeCenterY, safeRadiusX);
      safeGrad.addColorStop(0, 'rgba(7, 7, 6, 0.26)');
      safeGrad.addColorStop(0.55, 'rgba(7, 7, 6, 0.12)');
      safeGrad.addColorStop(1, 'transparent');

      ctx.translate(safeCenterX, safeCenterY);
      ctx.scale(1, safeRadiusY / safeRadiusX);
      ctx.fillStyle = safeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, safeRadiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Smooth outer vignette (only darkens the extreme edges/corners)
      const vignetteGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.40, width * 0.40,
        width * 0.5, height * 0.40, width * 0.95
      );
      vignetteGrad.addColorStop(0, 'transparent');
      vignetteGrad.addColorStop(0.65, 'transparent');
      vignetteGrad.addColorStop(0.85, 'rgba(7, 7, 6, 0.30)');
      vignetteGrad.addColorStop(1, 'rgba(7, 7, 6, 0.70)');

      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);

      // Loop requestAnimationFrame unless user prefers reduced motion
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    // Initial launch
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070706] select-none"
    >
      {/* ====================================================================
          HTML5 HIGH-PERFORMANCE 2D CANVAS ENGINE
          Direct GPU-accelerated drawing with DPR scaling & zero DOM re-renders
          ==================================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* ====================================================================
          LAYER 10: TACTILE MICRO FILM GRAIN (1.5% Opacity)
          Authentic blackened titanium texture; eliminates gradient banding
          ==================================================================== */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
