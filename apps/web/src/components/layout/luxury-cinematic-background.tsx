'use client';

import { useEffect, useRef } from 'react';

/**
 * ============================================================================
 * REGCOMPILER — ULTRA-PREMIUM CINEMATIC ANIMATED BACKGROUND (RICH & LUXURY)
 * ============================================================================
 * 
 * An animation-rich, continuously running, multi-layer visual material simulation:
 *   - Polished obsidian / black titanium / dark bronze luxury foundation
 *   - Layer 1: Obsidian base with ultra-slow tonal undulation (120s macro loop)
 *   - Layer 2: Deep graphite atmospheric field with organic breathing (80s loop)
 *   - Layer 3A: Enormous Primary Golden Light Sweep (56s macro orbit + 14s fluid breathing)
 *   - Layer 3B: Secondary Golden Light Diagonal Sweep (74s macro orbit + 18s morphing)
 *   - Layer 3C: Hero Atmospheric Golden Aura (90s macro breathing halo)
 *   - Layer 4: Warm Amber / Burnt Orange Field (46s independent drift)
 *   - Layer 5A & 5B: Dual Specular Bronze Slabs (black chrome reflections, 62s & 48s)
 *   - Layer 6: Architectural Computational Curves with Traveling Light Pulses (38s loop)
 *   - Layer 7: Champagne Horizon & Edge Highlight Arc (34s loop)
 *   - Layer 8: Micro Golden Dust (16 motes drifting through active light beams)
 *   - Layer 9: Safe Content Zone & Cinematic Vignette (keeps UI crisp & readable)
 *   - Layer 10: Tactile Micro Film Grain (1.5% fractal noise)
 * 
 * DESIGN CONSTRAINTS:
 *   - Completely independent from mouse movement: moves continuously on load.
 *   - Rich contrast between deep dark obsidian zones and luminous warm gold/amber.
 *   - Zero UI interference: pointer-events: none; content sits above; UI is unaffected.
 *   - 60fps performance on Canvas 2D; auto-pauses on document.hidden.
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
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    // LAYER 8: MICRO GOLDEN DUST (Strictly 16 motes drifting in light)
    // ========================================================================
    const particles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
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
      { stop: 0.00, color: { goldR: 185, goldG: 150, goldB: 90, amberR: 169, amberG: 111, amberB: 57, bronzeR: 157, bronzeG: 120, bronzeB: 72, lightPower: 1.15 } },
      { stop: 0.18, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 143, amberG: 95, amberB: 50, bronzeR: 140, bronzeG: 107, bronzeB: 66, lightPower: 0.98 } },
      { stop: 0.35, color: { goldR: 175, goldG: 125, goldB: 68, amberR: 185, amberG: 119, amberB: 61, bronzeR: 130, bronzeG: 100, bronzeB: 62, lightPower: 1.02 } },
      { stop: 0.52, color: { goldR: 208, goldG: 181, goldB: 123, amberR: 155, amberG: 105, amberB: 55, bronzeR: 165, bronzeG: 130, bronzeB: 78, lightPower: 1.10 } },
      { stop: 0.70, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 143, amberG: 95, amberB: 50, bronzeR: 135, bronzeG: 105, bronzeB: 65, lightPower: 0.96 } },
      { stop: 0.85, color: { goldR: 195, goldG: 160, goldB: 98, amberR: 150, amberG: 100, amberB: 52, bronzeR: 148, bronzeG: 115, bronzeB: 70, lightPower: 1.04 } },
      { stop: 1.00, color: { goldR: 185, goldG: 150, goldB: 90, amberR: 175, amberG: 118, amberB: 62, bronzeR: 160, bronzeG: 125, bronzeB: 75, lightPower: 1.18 } },
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
    // RENDER LOOP (60FPS with multi-layer fluid harmonics)
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

      // Multi-scale procedural harmonics for fluid, continuous movement
      const tFast = totalTime * 0.28;   // 3.5s micro wave
      const tMed = totalTime * 0.12;    // 8.5s fluid cycle
      const tSlow = totalTime * 0.045;  // 22s sweep cycle
      const tMacro = totalTime * 0.018; // 55s grand orbit

      // ======================================================================
      // LAYER 1: DEEP OBSIDIAN FOUNDATION (#070706)
      // Tonal drift across polished black titanium
      // ======================================================================
      ctx.fillStyle = '#070706';
      ctx.fillRect(0, 0, width, height);

      const baseGrad = ctx.createLinearGradient(
        width * 0.15 + Math.sin(tSlow) * (width * 0.12),
        0,
        width * 0.85,
        height
      );
      baseGrad.addColorStop(0, '#0B0A08');
      baseGrad.addColorStop(0.32, '#11100D');
      baseGrad.addColorStop(0.68, '#17140F');
      baseGrad.addColorStop(1, '#070706');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ======================================================================
      // LAYER 2: DARK GRAPHITE ATMOSPHERIC FIELD (80s autonomous loop)
      // Wide breathing field shifting slowly across the canvas
      // ======================================================================
      const pAtmos = (totalTime % 80) / 80 * 2 * Math.PI;
      const atmosX = width * 0.50 + Math.sin(pAtmos) * (width * 0.20) + nudgeX * 0.4;
      const atmosY = height * 0.44 + Math.cos(pAtmos * 0.8) * (height * 0.15) + nudgeY * 0.4;
      const atmosRad = Math.max(width, height) * (0.68 + Math.sin(tMed * 0.8) * 0.08);

      const atmosGrad = ctx.createRadialGradient(atmosX, atmosY, 0, atmosX, atmosY, atmosRad);
      atmosGrad.addColorStop(0, 'rgba(41, 32, 23, 0.36)'); // warm graphite
      atmosGrad.addColorStop(0.42, 'rgba(23, 20, 15, 0.22)'); // black titanium
      atmosGrad.addColorStop(0.82, 'rgba(11, 10, 8, 0.08)');
      atmosGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmosGrad;
      ctx.fillRect(0, 0, width, height);

      // Enable screen blend mode for rich luminous reflected light
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // ======================================================================
      // LAYER 3A: ENORMOUS PRIMARY GOLDEN LIGHT SWEEP (56s macro orbit + 14s wave)
      // Rich, warm, luminous gold sweeping smoothly across the upper-right corridor
      // ======================================================================
      const pGoldA = (totalTime % 56) / 56 * 2 * Math.PI;
      // Fluid sweep with secondary harmonic undulation
      const goldAX = width * (0.55 + 0.28 * Math.cos(pGoldA)) + Math.sin(tMed) * 35 + nudgeX;
      const goldAY = height * (0.32 + 0.18 * Math.sin(pGoldA)) + Math.cos(tMed * 1.1) * 25 + nudgeY;

      // Dynamic stretch & deformation
      const goldAStretch = Math.sin(pGoldA * 1.2) * 0.45 + Math.sin(tFast * 0.5) * 0.08;
      const goldARadX = (width * 0.46) * (1 + 0.15 * Math.sin(tMed * 1.2));
      const goldARadY = (height * 0.36) * (1 - 0.10 * Math.sin(tMed * 1.2));
      const goldAAlpha = (0.34 + 0.10 * Math.sin(pGoldA)) * atmos.lightPower;

      ctx.save();
      ctx.translate(goldAX, goldAY);
      ctx.rotate(goldAStretch);
      ctx.scale(1, goldARadY / goldARadX);

      const goldAGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, goldARadX);
      goldAGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldAAlpha})`);
      goldAGrad.addColorStop(0.25, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldAAlpha * 0.78})`);
      goldAGrad.addColorStop(0.55, `rgba(197, 166, 110, ${goldAAlpha * 0.42})`); // warm champagne mid-tone
      goldAGrad.addColorStop(0.82, `rgba(140, 107, 66, ${goldAAlpha * 0.12})`); // antique bronze falloff
      goldAGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = goldAGrad;
      ctx.beginPath();
      ctx.arc(0, 0, goldARadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3B: SECONDARY GOLDEN LIGHT SWEEP (74s macro orbit + 18s wave)
      // Phase-offset diagonal cross-sweep across mid-left and bottom-right
      // ======================================================================
      const pGoldB = ((totalTime + 22) % 74) / 74 * 2 * Math.PI;
      const goldBX = width * (0.42 + 0.30 * Math.sin(pGoldB)) + Math.cos(tMed * 0.9) * 30 + nudgeX * 0.8;
      const goldBY = height * (0.50 + 0.22 * Math.cos(pGoldB)) + Math.sin(tMed * 0.8) * 22 + nudgeY * 0.8;

      const goldBStretch = -0.32 + Math.cos(pGoldB * 1.1) * 0.40;
      const goldBRadX = (width * 0.42) * (1 + 0.14 * Math.cos(tMed * 1.1));
      const goldBRadY = (height * 0.33) * (1 - 0.08 * Math.cos(tMed * 1.1));
      const goldBAlpha = (0.28 + 0.08 * Math.cos(pGoldB)) * atmos.lightPower;

      ctx.save();
      ctx.translate(goldBX, goldBY);
      ctx.rotate(goldBStretch);
      ctx.scale(1, goldBRadY / goldBRadX);

      const goldBGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, goldBRadX);
      goldBGrad.addColorStop(0, `rgba(208, 181, 123, ${goldBAlpha})`); // warm champagne core
      goldBGrad.addColorStop(0.30, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldBAlpha * 0.72})`);
      goldBGrad.addColorStop(0.65, `rgba(157, 120, 72, ${goldBAlpha * 0.32})`); // rich bronze
      goldBGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = goldBGrad;
      ctx.beginPath();
      ctx.arc(0, 0, goldBRadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3C: HERO ATMOSPHERIC GOLDEN AURA (90s loop)
      // Soft breathing halo framed behind the hero content
      // ======================================================================
      const pAura = (totalTime % 90) / 90 * 2 * Math.PI;
      const auraX = width * 0.50 + Math.sin(pAura) * (width * 0.06) + nudgeX * 0.3;
      const auraY = height * 0.28 + Math.cos(pAura * 0.8) * (height * 0.04) + nudgeY * 0.3;
      const auraRadius = (width * 0.48) * (1 + 0.08 * Math.sin(tSlow * 1.4));
      const auraAlpha = (0.18 + 0.05 * Math.sin(pAura * 1.2)) * atmos.lightPower;

      const auraGrad = ctx.createRadialGradient(auraX, auraY, 0, auraX, auraY, auraRadius);
      auraGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${auraAlpha})`);
      auraGrad.addColorStop(0.32, `rgba(208, 181, 123, ${auraAlpha * 0.60})`);
      auraGrad.addColorStop(0.70, `rgba(41, 32, 23, ${auraAlpha * 0.18})`);
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(auraX, auraY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 4: WARM AMBER / BURNT ORANGE SECONDARY FIELD (46s loop)
      // Rich smoked amber warmth drifting independently
      // ======================================================================
      const pAmber = (totalTime % 46) / 46 * 2 * Math.PI;
      const amberX = width * (0.34 + 0.25 * Math.cos(pAmber)) + Math.sin(tMed * 1.3) * 25 - nudgeX * 0.6;
      const amberY = height * (0.62 + 0.16 * Math.sin(pAmber * 1.2)) - (scrollProgress * height * 0.12) - nudgeY * 0.6;
      const amberRadius = (width * 0.40) * (1 + 0.09 * Math.sin(tMed));
      const amberAlpha = (0.24 + 0.08 * Math.sin(pAmber)) * atmos.lightPower;

      const amberGrad = ctx.createRadialGradient(amberX, amberY, 0, amberX, amberY, amberRadius);
      amberGrad.addColorStop(0, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha})`);
      amberGrad.addColorStop(0.36, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha * 0.68})`);
      amberGrad.addColorStop(0.72, `rgba(41, 32, 23, ${amberAlpha * 0.22})`);
      amberGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(amberX, amberY, amberRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 5A & 5B: DUAL BRONZE SPECULAR SLABS (Black Chrome Reflections)
      // Sweeping specular highlights across invisible architectural surfaces
      // ======================================================================
      // Slab A (Primary rotating specular sheen)
      const pBronzeA = (totalTime % 62) / 62 * 2 * Math.PI;
      const bronzeAX = width * (0.64 + 0.18 * Math.sin(pBronzeA)) + nudgeX * 0.7;
      const bronzeAY = height * (0.30 + 0.14 * Math.cos(pBronzeA * 1.1)) + nudgeY * 0.7;
      const bronzeAngleA = -0.32 + Math.sin(pBronzeA * 1.2) * 0.22;
      const bronzeAlphaA = (0.24 + 0.08 * Math.cos(pBronzeA)) * atmos.lightPower;

      ctx.save();
      ctx.translate(bronzeAX, bronzeAY);
      ctx.rotate(bronzeAngleA);

      const specGradA = ctx.createLinearGradient(-450, 0, 450, 0);
      specGradA.addColorStop(0, 'transparent');
      specGradA.addColorStop(0.30, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaA * 0.45})`);
      specGradA.addColorStop(0.50, `rgba(208, 181, 123, ${bronzeAlphaA * 1.20})`); // Soft gold champagne crest
      specGradA.addColorStop(0.70, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaA * 0.40})`);
      specGradA.addColorStop(1, 'transparent');

      ctx.fillStyle = specGradA;
      ctx.fillRect(-520, -26, 1040, 52);
      ctx.restore();

      // Slab B (Secondary counter-angle bronze reflection on lower plane)
      const pBronzeB = ((totalTime + 18) % 48) / 48 * 2 * Math.PI;
      const bronzeBX = width * (0.36 + 0.16 * Math.cos(pBronzeB)) - nudgeX * 0.5;
      const bronzeBY = height * (0.68 + 0.12 * Math.sin(pBronzeB)) - nudgeY * 0.5;
      const bronzeAngleB = 0.28 + Math.cos(pBronzeB * 1.1) * 0.18;
      const bronzeAlphaB = (0.18 + 0.06 * Math.sin(pBronzeB)) * atmos.lightPower;

      ctx.save();
      ctx.translate(bronzeBX, bronzeBY);
      ctx.rotate(bronzeAngleB);

      const specGradB = ctx.createLinearGradient(-380, 0, 380, 0);
      specGradB.addColorStop(0, 'transparent');
      specGradB.addColorStop(0.35, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${bronzeAlphaB * 0.40})`);
      specGradB.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${bronzeAlphaB * 1.05})`);
      specGradB.addColorStop(0.65, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlphaB * 0.35})`);
      specGradB.addColorStop(1, 'transparent');

      ctx.fillStyle = specGradB;
      ctx.fillRect(-420, -20, 840, 40);
      ctx.restore();

      // ======================================================================
      // LAYER 6: ARCHITECTURAL COMPUTATIONAL PATHWAYS (Fluid undulation)
      // Abstract syntax trees, branching logic, engineered fluid contours
      // Plus traveling champagne logic pulses along the pathways!
      // ======================================================================
      const pCurves = (totalTime % 38) / 38 * 2 * Math.PI;

      // Pathway 1: Upper Golden Wave
      const p1Grad = ctx.createLinearGradient(0, height * 0.16, width, height * 0.44);
      p1Grad.addColorStop(0, 'transparent');
      p1Grad.addColorStop(0.20, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.08)`);
      p1Grad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.38 * atmos.lightPower})`);
      p1Grad.addColorStop(0.78, `rgba(208, 181, 123, ${0.30 * atmos.lightPower})`);
      p1Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p1Grad;
      ctx.lineWidth = 1.6 + 0.4 * Math.sin(tFast);
      ctx.beginPath();

      const wave1C1X = width * 0.45 + Math.sin(pCurves) * 85 + nudgeX;
      const wave1C1Y = height * 0.14 + Math.cos(pCurves * 1.2) * 65 + nudgeY;
      const wave1C2X = width * 0.82 + Math.cos(pCurves * 0.9) * 75 + nudgeX;
      const wave1C2Y = height * 0.36 + Math.sin(pCurves * 1.1) * 55 + nudgeY;

      ctx.moveTo(-120, height * 0.25);
      ctx.bezierCurveTo(
        wave1C1X, wave1C1Y,
        wave1C2X, wave1C2Y,
        width + 120, height * 0.18
      );
      ctx.stroke();

      // Pathway 2: Parallel Precision Contour (Statutory dotted guide rail)
      ctx.save();
      ctx.setLineDash([5, 12]);
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${0.24 * atmos.lightPower})`;
      ctx.beginPath();
      ctx.moveTo(-120, height * 0.31);
      ctx.bezierCurveTo(
        wave1C1X + 35, wave1C1Y + 62,
        wave1C2X - 30, wave1C2Y + 52,
        width + 120, height * 0.25
      );
      ctx.stroke();
      ctx.restore();

      // Pathway 3: Branching Computational Flow (Syntax Tree Vector)
      const p3Grad = ctx.createLinearGradient(width * 0.12, height * 0.42, width * 0.88, height * 0.82);
      p3Grad.addColorStop(0, 'transparent');
      p3Grad.addColorStop(0.32, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${0.26 * atmos.lightPower})`);
      p3Grad.addColorStop(0.68, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.30 * atmos.lightPower})`);
      p3Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p3Grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const wave3C1X = width * 0.30 + Math.cos(pCurves * 1.1) * 70 - nudgeX;
      const wave3C1Y = height * 0.68 + Math.sin(pCurves * 0.8) * 50 - nudgeY;
      const wave3C2X = width * 0.75 + Math.sin(pCurves * 1.3) * 80 - nudgeX;
      const wave3C2Y = height * 0.50 + Math.cos(pCurves * 0.9) * 55 - nudgeY;

      ctx.moveTo(-100, height * 0.60);
      ctx.bezierCurveTo(
        wave3C1X, wave3C1Y,
        wave3C2X, wave3C2Y,
        width + 120, height * 0.74
      );
      ctx.stroke();

      // Traveling Computational Logic Pulse (Glides smoothly along Pathway 1)
      const pulseT = (totalTime * 0.10) % 1; // 10s cycle
      // Approximate position along cubic bezier
      const u = pulseT;
      const u2 = u * u;
      const u3 = u2 * u;
      const invU = 1 - u;
      const invU2 = invU * invU;
      const invU3 = invU2 * invU;

      const p0x = -120, p0y = height * 0.25;
      const p1x = wave1C1X, p1y = wave1C1Y;
      const p2x = wave1C2X, p2y = wave1C2Y;
      const p3x = width + 120, p3y = height * 0.18;

      const pulseX = invU3 * p0x + 3 * invU2 * u * p1x + 3 * invU * u2 * p2x + u3 * p3x;
      const pulseY = invU3 * p0y + 3 * invU2 * u * p1y + 3 * invU * u2 * p2y + u3 * p3y;
      const pulseAlpha = Math.sin(pulseT * Math.PI) * 0.35 * atmos.lightPower;

      if (pulseAlpha > 0.05) {
        const pulseGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 70);
        pulseGrad.addColorStop(0, `rgba(208, 181, 123, ${pulseAlpha})`);
        pulseGrad.addColorStop(0.40, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${pulseAlpha * 0.50})`);
        pulseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // Abstract Compiler Intersections (Precision crosshair nodes that softly brighten)
      const crosshairs = [
        { x: width * 0.24 + Math.sin(pCurves * 0.6) * 28, y: height * 0.22 },
        { x: width * 0.78 + Math.cos(pCurves * 0.7) * 30, y: height * 0.29 },
        { x: width * 0.46 + Math.sin(pCurves * 0.9) * 26, y: height * 0.65 },
      ];
      ctx.lineWidth = 0.9;
      crosshairs.forEach((ch) => {
        ctx.strokeStyle = `rgba(208, 181, 123, ${0.28 * atmos.lightPower})`;
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
      // Top edge warm champagne, lower edge bronze, center dark
      // ======================================================================
      const pChamp = (totalTime % 34) / 34 * 2 * Math.PI;
      const orbitCenterX = width * (0.70 + 0.10 * Math.cos(pChamp)) + nudgeX * 0.6;
      const orbitCenterY = height * (0.24 + 0.08 * Math.sin(pChamp)) + nudgeY * 0.6;
      const orbitRadius = Math.min(width, height) * (0.40 + 0.05 * Math.sin(tFast * 0.8));
      const orbitAlpha = (0.28 + 0.08 * Math.sin(pChamp)) * atmos.lightPower;

      ctx.save();
      ctx.lineWidth = 1.2;
      const orbitGrad = ctx.createLinearGradient(
        orbitCenterX - orbitRadius,
        orbitCenterY - orbitRadius,
        orbitCenterX + orbitRadius,
        orbitCenterY + orbitRadius
      );
      orbitGrad.addColorStop(0, `rgba(208, 181, 123, ${orbitAlpha})`); // Warm champagne top edge
      orbitGrad.addColorStop(0.48, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, 0.08)`);
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

        // Proximity to active golden light
        const distA = Math.hypot(p.x - goldAX, p.y - goldAY);
        const lightIntensity = Math.max(0, 1 - distA / (width * 0.46));
        const pulse = 1 + 0.3 * Math.sin(totalTime * p.pulseSpeed + idx);
        const finalAlpha = (p.baseAlpha + lightIntensity * 0.45) * pulse * atmos.lightPower;

        if (finalAlpha > 0.06) {
          ctx.fillStyle = `rgba(208, 181, 123, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore(); // Exit screen composite mode

      // ======================================================================
      // LAYER 9: SAFE CONTENT ZONE & CINEMATIC VIGNETTE
      // Preserves pure text readability and calm stage lighting behind hero
      // ======================================================================
      const safeCenterX = width * 0.50;
      const safeCenterY = height * 0.32;
      const safeRadiusX = width * 0.42;
      const safeRadiusY = height * 0.28;

      ctx.save();
      const safeGrad = ctx.createRadialGradient(safeCenterX, safeCenterY, 0, safeCenterX, safeCenterY, safeRadiusX);
      safeGrad.addColorStop(0, 'rgba(7, 7, 6, 0.32)');
      safeGrad.addColorStop(0.50, 'rgba(7, 7, 6, 0.18)');
      safeGrad.addColorStop(1, 'transparent');

      ctx.translate(safeCenterX, safeCenterY);
      ctx.scale(1, safeRadiusY / safeRadiusX);
      ctx.fillStyle = safeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, safeRadiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer cinematic vignette
      const vignetteGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.40, width * 0.25,
        width * 0.5, height * 0.40, width * 0.78
      );
      vignetteGrad.addColorStop(0, 'transparent');
      vignetteGrad.addColorStop(0.60, 'rgba(7, 7, 6, 0.24)');
      vignetteGrad.addColorStop(0.88, 'rgba(7, 7, 6, 0.68)');
      vignetteGrad.addColorStop(1, '#070706');

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
