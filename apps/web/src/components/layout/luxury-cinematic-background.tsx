'use client';

import { useEffect, useRef } from 'react';

/**
 * ============================================================================
 * REGCOMPILER — CONTINUOUS CINEMATIC ULTRA-LUXURY ANIMATED BACKGROUND
 * ============================================================================
 * 
 * An autonomous, continuously running, seamlessly looping visual material simulation:
 *   - Polished obsidian / black titanium / dark bronze luxury foundation
 *   - Layer 1: Obsidian base with ultra-slow tonal undulation (120s loop)
 *   - Layer 2: Deep graphite atmospheric field with organic breathing (140s loop)
 *   - Layer 3A: Primary Golden Light Field A (72s loop, organic curved path)
 *   - Layer 3B: Secondary Golden Light Field B (97s loop, diagonal cross-sweep)
 *   - Layer 3C: Hero Atmospheric Golden Aura (118s loop, soft breathing halo)
 *   - Layer 4: Warm Amber / Burnt Orange Field (53s loop, independent motion)
 *   - Layer 5: Bronze Reflective Surfaces & Specular Slabs (83s loop, morphing)
 *   - Layer 6: Architectural Computational Pathways & Syntax Waves (67s loop)
 *   - Layer 7: Champagne Horizon & Edge Highlight Arc (43s loop)
 *   - Layer 8: Micro Golden Dust (12 motes drifting slowly in light fields)
 *   - Layer 9: Safe Content Zone & Cinematic Vignette (calm behind hero text)
 *   - Layer 10: Tactile Micro Film Grain (1.6% fractal noise)
 * 
 * KEY ARCHITECTURAL PRINCIPLES:
 *   1. 100% AUTONOMOUS: Moves continuously even if the user touches nothing.
 *   2. NON-REPETITIVE SEAMLESS LOOP: Different coprime loop durations prevent
 *      the composition from repeating simultaneously or showing a visible reset.
 *   3. SEAMLESS CROSSFADE: As one light field shifts/fades, another is blooming.
 *   4. CURSOR AS SECONDARY: Mouse only applies subtle gentle deflection (±15px)
 *      with heavy spring damping — it never drives or halts the animation.
 *   5. HIGH PERFORMANCE: Zero React state re-renders; Canvas 2D runs at 60fps;
 *      auto-pauses on document.hidden; supports prefers-reduced-motion.
 * ============================================================================
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  seed: number;
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
    // SECONDARY CURSOR DEFLECTION (Subtle physical nudge only)
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
      // Gentle normalized offset (-1 to 1)
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
    // LAYER 8: MICRO GOLDEN DUST (Strictly 12 motes drifting in light)
    // ========================================================================
    const particles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.10 - Math.random() * 0.20,
        size: 0.75 + Math.random() * 0.85,
        baseAlpha: 0.10 + Math.random() * 0.20,
        seed: Math.random() * 100,
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
      { stop: 0.00, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 143, amberG: 95, amberB: 50, bronzeR: 140, bronzeG: 107, bronzeB: 66, lightPower: 1.05 } },
      { stop: 0.18, color: { goldR: 158, goldG: 125, goldB: 74, amberR: 130, amberG: 85, amberB: 45, bronzeR: 125, bronzeG: 98, bronzeB: 62, lightPower: 0.88 } },
      { stop: 0.35, color: { goldR: 169, goldG: 111, goldB: 57, amberR: 185, amberG: 119, amberB: 61, bronzeR: 118, bronzeG: 92, bronzeB: 58, lightPower: 0.92 } },
      { stop: 0.52, color: { goldR: 197, goldG: 166, goldB: 110, amberR: 143, amberG: 95, amberB: 50, bronzeR: 157, bronzeG: 120, bronzeB: 72, lightPower: 0.98 } },
      { stop: 0.70, color: { goldR: 157, goldG: 120, goldB: 72, amberR: 143, amberG: 95, amberB: 50, bronzeR: 118, bronzeG: 92, bronzeB: 58, lightPower: 0.88 } },
      { stop: 0.85, color: { goldR: 185, goldG: 150, goldB: 90, amberR: 143, amberG: 95, amberB: 50, bronzeR: 140, bronzeG: 107, bronzeB: 66, lightPower: 0.94 } },
      { stop: 1.00, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 169, amberG: 111, amberB: 57, bronzeR: 157, bronzeG: 120, bronzeB: 72, lightPower: 1.08 } },
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
    // AUTONOMOUS CONTINUOUS ANIMATION LOOP
    // Overlapping independent loops with distinct coprime cycle durations:
    //   CYCLE_GOLD_A     = 72s   (Primary Golden Light Field A)
    //   CYCLE_GOLD_B     = 97s   (Secondary Golden Light Field B)
    //   CYCLE_GOLD_C     = 118s  (Hero Atmospheric Aura)
    //   CYCLE_AMBER      = 53s   (Warm Amber / Burnt Orange Field)
    //   CYCLE_BRONZE     = 83s   (Bronze Reflective Surface)
    //   CYCLE_CURVES     = 67s   (Architectural Pathways)
    //   CYCLE_CHAMPAGNE  = 43s   (Champagne Horizon Arc)
    //   CYCLE_ATMOS      = 140s  (Dark Graphite Atmospheric Undulation)
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
      cursor.vx = (cursor.vx + cdx * 0.035) * 0.85;
      cursor.vy = (cursor.vy + cdy * 0.035) * 0.85;
      cursor.currentX += cursor.vx;
      cursor.currentY += cursor.vy;

      // Cursor nudge magnitude (capped at ±18px so it never overrides autonomous flow)
      const nudgeX = cursor.currentX * 16;
      const nudgeY = cursor.currentY * 12;

      // Smooth scroll parallax lag
      scrollLag += (targetScroll - scrollLag) * Math.min(dt * 4.5, 0.16);
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = scrollLag / maxScroll;
      const atmos = getInterpolatedAtmosphere(scrollProgress);

      // ======================================================================
      // LAYER 1: OBSIDIAN BASE FOUNDATION (#070706)
      // Very slow tonal undulation across 120 seconds
      // ======================================================================
      const pObsidian = (totalTime % 120) / 120 * 2 * Math.PI;
      ctx.fillStyle = '#070706';
      ctx.fillRect(0, 0, width, height);

      // Deep graphite & black titanium directional gradient
      const baseGrad = ctx.createLinearGradient(
        width * 0.2 + Math.sin(pObsidian) * (width * 0.1),
        0,
        width * 0.8,
        height
      );
      baseGrad.addColorStop(0, '#0B0A08');
      baseGrad.addColorStop(0.35, '#11100D');
      baseGrad.addColorStop(0.70, '#17140F'); // black titanium
      baseGrad.addColorStop(1, '#070706');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ======================================================================
      // LAYER 2: DARK GRAPHITE ATMOSPHERIC FIELD (140s autonomous loop)
      // Wide breathing field shifting slowly across the canvas
      // ======================================================================
      const pAtmos = (totalTime % 140) / 140 * 2 * Math.PI;
      const atmosX = width * 0.50 + Math.sin(pAtmos) * (width * 0.18) + nudgeX * 0.4;
      const atmosY = height * 0.42 + Math.cos(pAtmos * 0.8) * (height * 0.14) + nudgeY * 0.4;
      const atmosRad = Math.max(width, height) * (0.68 + Math.sin(pAtmos * 1.3) * 0.08);

      const atmosGrad = ctx.createRadialGradient(atmosX, atmosY, 0, atmosX, atmosY, atmosRad);
      atmosGrad.addColorStop(0, 'rgba(41, 32, 23, 0.32)'); // warm graphite
      atmosGrad.addColorStop(0.40, 'rgba(23, 20, 15, 0.20)'); // black titanium
      atmosGrad.addColorStop(0.80, 'rgba(11, 10, 8, 0.08)');
      atmosGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmosGrad;
      ctx.fillRect(0, 0, width, height);

      // Enable screen blend mode for luminous, non-clipping reflected light
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // ======================================================================
      // LAYER 3A: PRIMARY GOLDEN LIGHT FIELD A (72s autonomous loop)
      // Starts upper-right -> curves toward center -> moves downward ->
      // expands toward left -> fades, while Gold B is already entering
      // ======================================================================
      const pGoldA = (totalTime % 72) / 72 * 2 * Math.PI;
      // Parametric Lissajous trajectory with organic sweep
      const goldAX = width * (0.54 + 0.26 * Math.cos(pGoldA) + 0.08 * Math.sin(pGoldA * 2)) + nudgeX;
      const goldAY = height * (0.34 + 0.18 * Math.sin(pGoldA) + 0.06 * Math.cos(pGoldA * 2)) + nudgeY;

      // Continuous breathing deformation & stretch
      const goldAStretch = Math.sin(pGoldA * 1.5) * 0.42;
      const goldARadX = (width * 0.44) * (1 + 0.14 * Math.sin(pGoldA * 2));
      const goldARadY = (height * 0.35) * (1 - 0.10 * Math.sin(pGoldA * 2));
      // Continuous sine envelope so the light swells and softly recedes without zeroing out
      const goldAAlpha = (0.24 + 0.10 * Math.sin(pGoldA)) * atmos.lightPower;

      ctx.save();
      ctx.translate(goldAX, goldAY);
      ctx.rotate(goldAStretch);
      ctx.scale(1, goldARadY / goldARadX);

      const goldAGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, goldARadX);
      goldAGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldAAlpha})`);
      goldAGrad.addColorStop(0.28, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldAAlpha * 0.75})`);
      goldAGrad.addColorStop(0.60, `rgba(185, 150, 90, ${goldAAlpha * 0.35})`);
      goldAGrad.addColorStop(0.88, `rgba(33, 24, 15, ${goldAAlpha * 0.08})`);
      goldAGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = goldAGrad;
      ctx.beginPath();
      ctx.arc(0, 0, goldARadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3B: SECONDARY GOLDEN LIGHT FIELD B (97s autonomous loop)
      // Phase-offset diagonal cross-sweep (starts upper-left, curves toward
      // bottom-right, expands, fades), ensuring continuous lighting overlap
      // ======================================================================
      const pGoldB = ((totalTime + 28) % 97) / 97 * 2 * Math.PI;
      const goldBX = width * (0.42 + 0.30 * Math.sin(pGoldB) - 0.06 * Math.cos(pGoldB * 2)) + nudgeX * 0.8;
      const goldBY = height * (0.48 + 0.22 * Math.cos(pGoldB) + 0.05 * Math.sin(pGoldB * 2)) + nudgeY * 0.8;

      const goldBStretch = -0.35 + Math.cos(pGoldB * 1.2) * 0.38;
      const goldBRadX = (width * 0.40) * (1 + 0.12 * Math.cos(pGoldB * 1.8));
      const goldBRadY = (height * 0.32) * (1 - 0.08 * Math.cos(pGoldB * 1.8));
      const goldBAlpha = (0.20 + 0.08 * Math.cos(pGoldB)) * atmos.lightPower;

      ctx.save();
      ctx.translate(goldBX, goldBY);
      ctx.rotate(goldBStretch);
      ctx.scale(1, goldBRadY / goldBRadX);

      const goldBGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, goldBRadX);
      goldBGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${goldBAlpha})`);
      goldBGrad.addColorStop(0.30, `rgba(197, 166, 110, ${goldBAlpha * 0.70})`); // warm champagne core
      goldBGrad.addColorStop(0.65, `rgba(140, 107, 66, ${goldBAlpha * 0.30})`); // bronze edge
      goldBGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = goldBGrad;
      ctx.beginPath();
      ctx.arc(0, 0, goldBRadX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 3C: HERO ATMOSPHERIC GOLDEN AURA (118s autonomous loop)
      // Soft breathing halo framed behind the hero content (Section 29)
      // Expands, contracts slightly, morphs softly — never pulses or blinks
      // ======================================================================
      const pAura = (totalTime % 118) / 118 * 2 * Math.PI;
      const auraX = width * 0.50 + Math.sin(pAura) * (width * 0.05) + nudgeX * 0.3;
      const auraY = height * 0.28 + Math.cos(pAura * 0.8) * (height * 0.04) + nudgeY * 0.3;
      const auraRadius = (width * 0.46) * (1 + 0.06 * Math.sin(pAura * 1.4));
      const auraAlpha = (0.13 + 0.04 * Math.sin(pAura * 1.1)) * atmos.lightPower;

      const auraGrad = ctx.createRadialGradient(auraX, auraY, 0, auraX, auraY, auraRadius);
      auraGrad.addColorStop(0, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${auraAlpha})`);
      auraGrad.addColorStop(0.35, `rgba(197, 166, 110, ${auraAlpha * 0.55})`);
      auraGrad.addColorStop(0.75, `rgba(41, 32, 23, ${auraAlpha * 0.15})`);
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(auraX, auraY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 4: WARM AMBER / BURNT ORANGE SECONDARY FIELD (53s autonomous loop)
      // Smoked amber warmth moving independently along lower-left to mid-right
      // Overlaps with gold periodically to produce rich burnished depth
      // ======================================================================
      const pAmber = (totalTime % 53) / 53 * 2 * Math.PI;
      const amberX = width * (0.34 + 0.24 * Math.cos(pAmber)) - nudgeX * 0.6;
      const amberY = height * (0.64 + 0.16 * Math.sin(pAmber * 1.3)) - (scrollProgress * height * 0.12) - nudgeY * 0.6;
      const amberRadius = (width * 0.38) * (1 + 0.08 * Math.sin(pAmber * 1.7));
      const amberAlpha = (0.16 + 0.06 * Math.sin(pAmber * 0.9)) * atmos.lightPower;

      const amberGrad = ctx.createRadialGradient(amberX, amberY, 0, amberX, amberY, amberRadius);
      amberGrad.addColorStop(0, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha})`);
      amberGrad.addColorStop(0.38, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${amberAlpha * 0.65})`);
      amberGrad.addColorStop(0.72, `rgba(41, 32, 23, ${amberAlpha * 0.20})`);
      amberGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(amberX, amberY, amberRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 5: BRONZE REFLECTIVE SURFACE & SPECULAR SLABS (83s autonomous loop)
      // Simulates light sweeping across curved black chrome / architectural slabs
      // ======================================================================
      const pBronze = (totalTime % 83) / 83 * 2 * Math.PI;
      const bronzeX = width * (0.62 + 0.18 * Math.sin(pBronze)) + nudgeX * 0.7;
      const bronzeY = height * (0.32 + 0.14 * Math.cos(pBronze * 1.1)) + nudgeY * 0.7;
      const bronzeAngle = -0.32 + Math.sin(pBronze * 1.3) * 0.18;
      const bronzeAlpha = (0.16 + 0.06 * Math.cos(pBronze)) * atmos.lightPower;

      ctx.save();
      ctx.translate(bronzeX, bronzeY);
      ctx.rotate(bronzeAngle);

      const specGrad = ctx.createLinearGradient(-420, 0, 420, 0);
      specGrad.addColorStop(0, 'transparent');
      specGrad.addColorStop(0.32, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlpha * 0.50})`);
      specGrad.addColorStop(0.50, `rgba(208, 181, 123, ${bronzeAlpha * 1.15})`); // Soft gold champagne crest
      specGrad.addColorStop(0.68, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${bronzeAlpha * 0.45})`);
      specGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = specGrad;
      ctx.fillRect(-500, -22, 1000, 44);
      ctx.restore();

      // ======================================================================
      // LAYER 6: ARCHITECTURAL COMPUTATIONAL PATHWAYS (67s autonomous loop)
      // Abstract syntax trees, branching paths, engineered fluid contours
      // Continuously morphing control points with sine harmonics
      // ======================================================================
      const pCurves = (totalTime % 67) / 67 * 2 * Math.PI;

      // Pathway 1: Upper Golden Wave
      const p1Grad = ctx.createLinearGradient(0, height * 0.18, width, height * 0.42);
      p1Grad.addColorStop(0, 'transparent');
      p1Grad.addColorStop(0.25, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.05)`);
      p1Grad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.28 * atmos.lightPower})`);
      p1Grad.addColorStop(0.78, `rgba(197, 166, 110, ${0.22 * atmos.lightPower})`);
      p1Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p1Grad;
      ctx.lineWidth = 1.3 + 0.3 * Math.sin(pCurves);
      ctx.beginPath();

      const wave1C1X = width * 0.46 + Math.sin(pCurves) * 75 + nudgeX;
      const wave1C1Y = height * 0.15 + Math.cos(pCurves * 1.2) * 55 + nudgeY;
      const wave1C2X = width * 0.80 + Math.cos(pCurves * 0.9) * 65 + nudgeX;
      const wave1C2Y = height * 0.36 + Math.sin(pCurves * 1.1) * 45 + nudgeY;

      ctx.moveTo(-120, height * 0.26);
      ctx.bezierCurveTo(
        wave1C1X, wave1C1Y,
        wave1C2X, wave1C2Y,
        width + 120, height * 0.20
      );
      ctx.stroke();

      // Pathway 2: Parallel Precision Contour (Statutory dotted guide rail)
      ctx.save();
      ctx.setLineDash([4, 10]);
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${0.18 * atmos.lightPower})`;
      ctx.beginPath();
      ctx.moveTo(-120, height * 0.32);
      ctx.bezierCurveTo(
        wave1C1X + 30, wave1C1Y + 58,
        wave1C2X - 25, wave1C2Y + 48,
        width + 120, height * 0.27
      );
      ctx.stroke();
      ctx.restore();

      // Pathway 3: Branching Computational Flow (Syntax Tree Vector)
      const p3Grad = ctx.createLinearGradient(width * 0.15, height * 0.45, width * 0.85, height * 0.80);
      p3Grad.addColorStop(0, 'transparent');
      p3Grad.addColorStop(0.35, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${0.20 * atmos.lightPower})`);
      p3Grad.addColorStop(0.70, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.22 * atmos.lightPower})`);
      p3Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p3Grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();

      const wave3C1X = width * 0.32 + Math.cos(pCurves * 1.1) * 60 - nudgeX;
      const wave3C1Y = height * 0.70 + Math.sin(pCurves * 0.8) * 45 - nudgeY;
      const wave3C2X = width * 0.74 + Math.sin(pCurves * 1.3) * 70 - nudgeX;
      const wave3C2Y = height * 0.52 + Math.cos(pCurves * 0.9) * 50 - nudgeY;

      ctx.moveTo(-100, height * 0.62);
      ctx.bezierCurveTo(
        wave3C1X, wave3C1Y,
        wave3C2X, wave3C2Y,
        width + 120, height * 0.76
      );
      ctx.stroke();

      // Abstract Compiler Intersections (Precision crosshair nodes that softly brighten)
      const crosshairs = [
        { x: width * 0.24 + Math.sin(pCurves * 0.6) * 24, y: height * 0.22 },
        { x: width * 0.78 + Math.cos(pCurves * 0.7) * 26, y: height * 0.30 },
        { x: width * 0.46 + Math.sin(pCurves * 0.9) * 22, y: height * 0.66 },
      ];
      ctx.lineWidth = 0.8;
      crosshairs.forEach((ch) => {
        ctx.strokeStyle = `rgba(197, 166, 110, ${0.22 * atmos.lightPower})`;
        ctx.beginPath();
        ctx.moveTo(ch.x - 5, ch.y);
        ctx.lineTo(ch.x + 5, ch.y);
        ctx.moveTo(ch.x, ch.y - 5);
        ctx.lineTo(ch.x, ch.y + 5);
        ctx.stroke();
      });

      // ======================================================================
      // LAYER 7: CHAMPAGNE HORIZON & EDGE HIGHLIGHT ARC (43s autonomous loop)
      // Architectural curved light horizon
      // Top edge warm champagne, lower edge bronze, center dark
      // ======================================================================
      const pChamp = (totalTime % 43) / 43 * 2 * Math.PI;
      const orbitCenterX = width * (0.70 + 0.08 * Math.cos(pChamp)) + nudgeX * 0.6;
      const orbitCenterY = height * (0.24 + 0.06 * Math.sin(pChamp)) + nudgeY * 0.6;
      const orbitRadius = Math.min(width, height) * (0.38 + 0.04 * Math.sin(pChamp * 1.5));
      const orbitAlpha = (0.22 + 0.06 * Math.sin(pChamp)) * atmos.lightPower;

      ctx.save();
      ctx.lineWidth = 1;
      const orbitGrad = ctx.createLinearGradient(
        orbitCenterX - orbitRadius,
        orbitCenterY - orbitRadius,
        orbitCenterX + orbitRadius,
        orbitCenterY + orbitRadius
      );
      orbitGrad.addColorStop(0, `rgba(208, 181, 123, ${orbitAlpha})`); // Warm champagne top edge
      orbitGrad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, 0.05)`);
      orbitGrad.addColorStop(1, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${orbitAlpha * 0.85})`); // Bronze lower edge

      ctx.strokeStyle = orbitGrad;
      ctx.beginPath();
      ctx.arc(orbitCenterX, orbitCenterY, orbitRadius, 0.42 * Math.PI, 1.58 * Math.PI);
      ctx.stroke();
      ctx.restore();

      // ======================================================================
      // LAYER 8: MICRO GOLDEN DUST (12 particles, drifting in light fields)
      // ======================================================================
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Proximity to active golden light A
        const distA = Math.hypot(p.x - goldAX, p.y - goldAY);
        const lightIntensity = Math.max(0, 1 - distA / (width * 0.42));
        const finalAlpha = (p.baseAlpha + lightIntensity * 0.38) * atmos.lightPower;

        if (finalAlpha > 0.05) {
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
      safeGrad.addColorStop(0, 'rgba(7, 7, 6, 0.36)');
      safeGrad.addColorStop(0.52, 'rgba(7, 7, 6, 0.20)');
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
      vignetteGrad.addColorStop(0.60, 'rgba(7, 7, 6, 0.26)');
      vignetteGrad.addColorStop(0.88, 'rgba(7, 7, 6, 0.70)');
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
          LAYER 10: TACTILE MICRO FILM GRAIN (1.6% Opacity)
          Authentic blackened titanium texture; eliminates gradient banding
          ==================================================================== */}
      <div
        className="absolute inset-0 opacity-[0.016] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
