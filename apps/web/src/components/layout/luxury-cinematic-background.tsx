'use client';

import { useEffect, useRef } from 'react';

/**
 * ============================================================================
 * REGCOMPILER — ULTRA-LUXURY CINEMATIC INTERACTIVE ANIMATED BACKGROUND
 * ============================================================================
 * 
 * High-performance, zero-re-render Canvas 2D engine simulating:
 *   - Polished obsidian / black titanium luxury material foundation
 *   - Autonomous flowing golden light fields (spotlight on dark marble)
 *   - Secondary warm amber / smoked orange reflection
 *   - Liquid metal / black chrome specular highlights
 *   - Architectural computational pathways (AST syntax tree geometry & curves)
 *   - 10-14 micro golden dust motes drifting exclusively inside light fields
 *   - Cursor physics with physical inertia, spring lag, velocity damping & drag
 *   - 100-400ms settling time when cursor stops
 *   - Dynamic section-based scroll atmosphere interpolation
 *   - Central calm safe zone behind hero headline / CTA
 *   - Strict 60fps target with document.hidden pause & prefers-reduced-motion support
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

    // Check accessibility: prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
    // CURSOR PHYSICS & INERTIA SYSTEM
    // ========================================================================
    // Mouse target and spring-lag tracking
    const mouse = {
      targetX: width * 0.5,
      targetY: height * 0.35,
      currentX: width * 0.5,
      currentY: height * 0.35,
      vx: 0,
      vy: 0,
      active: false,
      lastMoveTime: 0,
    };

    // Normalized coordinates (-1 to 1) with spring lag
    const norm = {
      currentX: 0,
      currentY: 0,
      vx: 0,
      vy: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
      mouse.lastMoveTime = performance.now();
    };

    const handleMouseLeave = () => {
      // Soft drift back to upper center
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.35;
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // ========================================================================
    // SCROLL TRACKING WITH SMOOTH LAG
    // ========================================================================
    let targetScroll = window.scrollY;
    let scrollLag = targetScroll;

    const handleScroll = () => {
      targetScroll = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ========================================================================
    // LAYER 7: MICRO GOLDEN DUST (Strictly 12 particles, drifting in light)
    // ========================================================================
    const PARTICLES_COUNT = 12;
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLES_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.25,
        size: 0.8 + Math.random() * 0.9,
        baseAlpha: 0.12 + Math.random() * 0.22,
        seed: Math.random() * 100,
      });
    }

    // ========================================================================
    // SECTION-BASED COLOR & ATMOSPHERE INTERPOLATION
    // Evolving luxury states along page scroll depth
    // ========================================================================
    interface ColorStop {
      goldR: number; goldG: number; goldB: number;
      amberR: number; amberG: number; amberB: number;
      bronzeR: number; bronzeG: number; bronzeB: number;
      lightPower: number; // overall luminosity multiplier
    }

    // Palette targets:
    // Section 1 (Hero): Richest Golden (#A88752 / #C5A66E) + Warm Amber (#8F5F32)
    // Section 2 (Capability): Dark Graphite (#11100D) + Bronze (#8C6B42)
    // Section 3 (Auditor / Problem): Deep Amber (#A96F39) + Smoked Obsidian
    // Section 4 (Transformation): Dark Champagne Reflection (#C5A66E / #D0B57B)
    // Section 5 (How it Works / Architecture): Deep Bronze Atmosphere (#765C3A / #9D7848)
    // Section 6 (Security / Use Cases): Warmer Graphite (#292017) + Muted Gold
    // Section 7 (Final CTA): Dark Golden Environment (#A88752)
    const sectionProfiles: { stop: number; color: ColorStop }[] = [
      { stop: 0.00, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 143, amberG: 95, amberB: 50, bronzeR: 140, bronzeG: 107, bronzeB: 66, lightPower: 1.0 } },
      { stop: 0.18, color: { goldR: 140, goldG: 107, goldB: 66, amberR: 120, amberG: 80, amberB: 42, bronzeR: 118, bronzeG: 92, bronzeB: 58, lightPower: 0.82 } },
      { stop: 0.35, color: { goldR: 169, goldG: 111, goldB: 57, amberR: 185, amberG: 119, amberB: 61, bronzeR: 118, bronzeG: 92, bronzeB: 58, lightPower: 0.88 } },
      { stop: 0.52, color: { goldR: 197, goldG: 166, goldB: 110, amberR: 143, amberG: 95, amberB: 50, bronzeR: 157, bronzeG: 120, bronzeB: 72, lightPower: 0.95 } },
      { stop: 0.70, color: { goldR: 157, goldG: 120, goldB: 72, amberR: 143, amberG: 95, amberB: 50, bronzeR: 118, bronzeG: 92, bronzeB: 58, lightPower: 0.85 } },
      { stop: 0.85, color: { goldR: 185, goldG: 150, goldB: 90, amberR: 143, amberG: 95, amberB: 50, bronzeR: 140, bronzeG: 107, bronzeB: 66, lightPower: 0.90 } },
      { stop: 1.00, color: { goldR: 168, goldG: 135, goldB: 82, amberR: 169, amberG: 111, amberB: 57, bronzeR: 157, bronzeG: 120, bronzeB: 72, lightPower: 1.05 } },
    ];

    const getInterpolatedAtmosphere = (progress: number): ColorStop => {
      const p = Math.max(0, Math.min(1, progress));
      let idx = 0;
      for (let i = 0; i < sectionProfiles.length - 1; i++) {
        if (p >= sectionProfiles[i].stop && p <= sectionProfiles[i + 1].stop) {
          idx = i;
          break;
        }
      }
      const s0 = sectionProfiles[idx];
      const s1 = sectionProfiles[idx + 1] || s0;
      const t = (p - s0.stop) / ((s1.stop - s0.stop) || 1);
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
    // RENDER LOOP (60FPS with spring inertia & procedural harmonics)
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

      // 1. Spring Physics for cursor tracking (Authentic Heavy Luxury Material Inertia)
      const springStiffness = isTouch ? 0.02 : 0.045;
      const damping = 0.82;

      const dx = mouse.targetX - mouse.currentX;
      const dy = mouse.targetY - mouse.currentY;
      mouse.vx = (mouse.vx + dx * springStiffness) * damping;
      mouse.vy = (mouse.vy + dy * springStiffness) * damping;
      mouse.currentX += mouse.vx;
      mouse.currentY += mouse.vy;

      // Normalized coordinates (-1 to 1)
      const targetNormX = (mouse.targetX / width) * 2 - 1;
      const targetNormY = (mouse.targetY / height) * 2 - 1;
      const ndx = targetNormX - norm.currentX;
      const ndy = targetNormY - norm.currentY;
      norm.vx = (norm.vx + ndx * 0.04) * 0.84;
      norm.vy = (norm.vy + ndy * 0.04) * 0.84;
      norm.currentX += norm.vx;
      norm.currentY += norm.vy;

      // Cursor velocity magnitude for dynamic light stretching
      const cursorVelocity = Math.hypot(mouse.vx, mouse.vy);

      // Smooth scroll lag
      scrollLag += (targetScroll - scrollLag) * Math.min(dt * 4.5, 0.16);
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = scrollLag / maxScroll;

      // Current section atmosphere profile
      const atmos = getInterpolatedAtmosphere(scrollProgress);

      // Procedural multi-scale time harmonics (no repetitive cycles)
      const tSlow = totalTime * 0.04;   // 25s cycle
      const tMed = totalTime * 0.09;    // 11s cycle
      const tFast = totalTime * 0.18;   // 5.5s cycle
      const tBreath = totalTime * 0.025;// 40s cycle

      // ======================================================================
      // LAYER 1: DEEP OBSIDIAN FOUNDATION (#070706)
      // ======================================================================
      ctx.fillStyle = '#070706';
      ctx.fillRect(0, 0, width, height);

      // Base graphite/titanium gradient field
      const baseGrad = ctx.createLinearGradient(0, 0, width * 0.8, height);
      baseGrad.addColorStop(0, '#0B0A08');
      baseGrad.addColorStop(0.35, '#11100D');
      baseGrad.addColorStop(0.70, '#17140F');
      baseGrad.addColorStop(1, '#070706');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // ======================================================================
      // LAYER 2: DARK GRAPHITE ATMOSPHERIC FIELD (Slow Organic Undulation)
      // ======================================================================
      const atmosX = width * 0.5 + Math.sin(tSlow) * (width * 0.15) + norm.currentX * 18;
      const atmosY = height * 0.45 + Math.cos(tSlow * 0.8) * (height * 0.12) + norm.currentY * 14;
      const atmosRad = Math.max(width, height) * (0.65 + Math.sin(tBreath) * 0.05);

      const atmosGrad = ctx.createRadialGradient(atmosX, atmosY, 0, atmosX, atmosY, atmosRad);
      atmosGrad.addColorStop(0, 'rgba(41, 32, 23, 0.28)'); // warm graphite
      atmosGrad.addColorStop(0.45, 'rgba(23, 20, 15, 0.18)'); // black titanium
      atmosGrad.addColorStop(0.85, 'rgba(11, 10, 8, 0.06)');
      atmosGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmosGrad;
      ctx.fillRect(0, 0, width, height);

      // Enable screen blend mode for luminous, non-clipping reflected light
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // ======================================================================
      // LAYER 3: ENORMOUS SOFT GOLDEN ILLUMINATION (Hero Spotlight on Black Marble)
      // Autonomous drifting light field that gently bends toward cursor
      // ======================================================================
      // Calculate autonomous primary light path:
      // An organic figure-eight / lissajous trajectory with cursor spring influence
      const lightDriftX = width * 0.58 + Math.sin(tSlow * 1.2) * (width * 0.22) + Math.cos(tMed * 0.6) * (width * 0.08);
      const lightDriftY = height * 0.30 + Math.cos(tSlow * 0.9) * (height * 0.14) + Math.sin(tMed * 0.5) * (height * 0.06);

      // Cursor shifts the light with inertia (100–250px influence)
      const primaryLightX = lightDriftX + (mouse.currentX - lightDriftX) * 0.24 + norm.currentX * 32;
      const primaryLightY = lightDriftY + (mouse.currentY - lightDriftY) * 0.20 + norm.currentY * 26;

      // Dynamic stretch influenced by velocity and harmonics
      const stretchAngle = Math.sin(tMed) * 0.4 + (mouse.vx * 0.015);
      const radiusX = (width * 0.42) * (1 + Math.sin(tBreath) * 0.08 + Math.min(cursorVelocity * 0.005, 0.12));
      const radiusY = (height * 0.36) * (1 - Math.sin(tBreath) * 0.06);

      ctx.save();
      ctx.translate(primaryLightX, primaryLightY);
      ctx.rotate(stretchAngle);
      ctx.scale(1, radiusY / radiusX);

      const goldRad = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
      const pR = atmos.goldR;
      const pG = atmos.goldG;
      const pB = atmos.goldB;
      const pAlpha = 0.22 * atmos.lightPower;

      goldRad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${pAlpha})`);
      goldRad.addColorStop(0.25, `rgba(${pR}, ${pG}, ${pB}, ${pAlpha * 0.72})`);
      goldRad.addColorStop(0.55, `rgba(${Math.round(pR * 0.85)}, ${Math.round(pG * 0.8)}, ${Math.round(pB * 0.7)}, ${pAlpha * 0.32})`);
      goldRad.addColorStop(0.85, `rgba(33, 24, 15, ${pAlpha * 0.10})`);
      goldRad.addColorStop(1, 'transparent');

      ctx.fillStyle = goldRad;
      ctx.beginPath();
      ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ======================================================================
      // LAYER 4: SECONDARY WARM AMBER ILLUMINATION (Counter-Phase Warmth)
      // Smoked orange sunset warmth in black metal (5–10% warmth, NOT neon)
      // ======================================================================
      const amberDriftX = width * 0.32 + Math.cos(tSlow * 0.8 + 1.8) * (width * 0.18);
      const amberDriftY = height * 0.62 + Math.sin(tSlow * 1.1 + 0.9) * (height * 0.15) - (scrollProgress * height * 0.15);
      const amberX = amberDriftX + (mouse.currentX - amberDriftX) * 0.14 - norm.currentX * 22;
      const amberY = amberDriftY + (mouse.currentY - amberDriftY) * 0.12 - norm.currentY * 18;
      const amberRadius = width * 0.38;

      const amberGrad = ctx.createRadialGradient(amberX, amberY, 0, amberX, amberY, amberRadius);
      const aR = atmos.amberR;
      const aG = atmos.amberG;
      const aB = atmos.amberB;
      const aAlpha = 0.14 * atmos.lightPower;

      amberGrad.addColorStop(0, `rgba(${aR}, ${aG}, ${aB}, ${aAlpha})`);
      amberGrad.addColorStop(0.35, `rgba(${aR}, ${aG}, ${aB}, ${aAlpha * 0.60})`);
      amberGrad.addColorStop(0.70, `rgba(41, 32, 23, ${aAlpha * 0.20})`);
      amberGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(amberX, amberY, amberRadius, 0, Math.PI * 2);
      ctx.fill();

      // ======================================================================
      // LAYER 5: LIQUID GOLD SPECULAR REFLECTIONS / BLACK CHROME HIGHLIGHTS
      // Sweeping specular highlights across unseen architectural planes
      // ======================================================================
      const chromeX = width * 0.65 + Math.sin(tMed * 1.3) * (width * 0.14) + norm.currentX * 16;
      const chromeY = height * 0.28 + Math.cos(tMed * 0.9) * (height * 0.10) + norm.currentY * 14;
      const chromeAngle = -0.32 + Math.sin(tSlow * 0.7) * 0.12;

      ctx.save();
      ctx.translate(chromeX, chromeY);
      ctx.rotate(chromeAngle);

      const specGrad = ctx.createLinearGradient(-350, 0, 350, 0);
      specGrad.addColorStop(0, 'transparent');
      specGrad.addColorStop(0.35, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.08)`);
      specGrad.addColorStop(0.50, `rgba(208, 181, 123, ${0.16 * atmos.lightPower})`); // Soft gold champagne crest
      specGrad.addColorStop(0.65, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.07)`);
      specGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = specGrad;
      ctx.fillRect(-450, -18, 900, 36);
      ctx.restore();

      // ======================================================================
      // LAYER 6: FLOWING ABSTRACT ARCHITECTURAL CURVES & COMPUTATIONAL PATHWAYS
      // Syntax trees, branching logic, engineered fluid contours
      // Bends gently with cursor influence field (100–250px)
      // ======================================================================
      ctx.lineWidth = 1.2;

      // Pathway 1: Upper Golden Computational Wave
      const p1Grad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.4);
      p1Grad.addColorStop(0, 'transparent');
      p1Grad.addColorStop(0.20, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, 0.04)`);
      p1Grad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.26 * atmos.lightPower})`);
      p1Grad.addColorStop(0.80, `rgba(197, 166, 110, ${0.22 * atmos.lightPower})`);
      p1Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p1Grad;
      ctx.beginPath();

      const wave1CtrlX = width * 0.48 + Math.sin(tSlow) * 60 + norm.currentX * 24;
      const wave1CtrlY = height * 0.16 + Math.cos(tSlow * 1.1) * 45 + norm.currentY * 20;
      const wave1Ctrl2X = width * 0.78 + Math.cos(tMed) * 50 + norm.currentX * 18;
      const wave1Ctrl2Y = height * 0.38 + Math.sin(tMed * 0.8) * 40 + norm.currentY * 16;

      ctx.moveTo(-100, height * 0.28);
      ctx.bezierCurveTo(
        wave1CtrlX, wave1CtrlY,
        wave1Ctrl2X, wave1Ctrl2Y,
        width + 120, height * 0.22
      );
      ctx.stroke();

      // Pathway 2: Parallel Precision Contour (Subtle dotted statutory guide rail)
      ctx.save();
      ctx.setLineDash([4, 10]);
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${0.16 * atmos.lightPower})`;
      ctx.beginPath();
      ctx.moveTo(-100, height * 0.34);
      ctx.bezierCurveTo(
        wave1CtrlX + 25, wave1CtrlY + 55,
        wave1Ctrl2X - 20, wave1Ctrl2Y + 45,
        width + 120, height * 0.29
      );
      ctx.stroke();
      ctx.restore();

      // Pathway 3: Lower Amber/Bronze Sweeping Arc
      const p3Grad = ctx.createLinearGradient(0, height * 0.55, width, height * 0.85);
      p3Grad.addColorStop(0, 'transparent');
      p3Grad.addColorStop(0.30, `rgba(${atmos.amberR}, ${atmos.amberG}, ${atmos.amberB}, ${0.18 * atmos.lightPower})`);
      p3Grad.addColorStop(0.70, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, ${0.20 * atmos.lightPower})`);
      p3Grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = p3Grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();

      const wave3CtrlX = width * 0.35 + Math.cos(tSlow * 0.9) * 50 - norm.currentX * 22;
      const wave3CtrlY = height * 0.72 + Math.sin(tSlow * 0.8) * 35 - norm.currentY * 18;
      const wave3Ctrl2X = width * 0.72 + Math.sin(tMed * 1.1) * 60 - norm.currentX * 20;
      const wave3Ctrl2Y = height * 0.54 + Math.cos(tMed * 0.7) * 45 - norm.currentY * 16;

      ctx.moveTo(-80, height * 0.65);
      ctx.bezierCurveTo(
        wave3CtrlX, wave3CtrlY,
        wave3Ctrl2X, wave3Ctrl2Y,
        width + 100, height * 0.78
      );
      ctx.stroke();

      // Abstract Compiler Intersections (Micro crosshairs at vector nodes)
      const crosshairs = [
        { x: width * 0.22 + Math.sin(tSlow * 0.5) * 20, y: height * 0.24 },
        { x: width * 0.76 + Math.cos(tSlow * 0.6) * 22, y: height * 0.32 },
        { x: width * 0.45 + Math.sin(tMed * 0.7) * 18, y: height * 0.68 },
      ];
      ctx.lineWidth = 0.8;
      crosshairs.forEach((ch) => {
        ctx.strokeStyle = `rgba(197, 166, 110, ${0.18 * atmos.lightPower})`;
        ctx.beginPath();
        ctx.moveTo(ch.x - 5, ch.y);
        ctx.lineTo(ch.x + 5, ch.y);
        ctx.moveTo(ch.x, ch.y - 5);
        ctx.lineTo(ch.x, ch.y + 5);
        ctx.stroke();
      });

      // ======================================================================
      // LAYER 7: MICRO GOLDEN DUST (Strictly 12 particles, drifting in light)
      // Drift slowly, glowing only when inside strong light fields
      // ======================================================================
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Proximity to primary golden light field center
        const distToLight = Math.hypot(p.x - primaryLightX, p.y - primaryLightY);
        const lightIntensity = Math.max(0, 1 - distToLight / (width * 0.45));
        const finalAlpha = (p.baseAlpha + lightIntensity * 0.35) * atmos.lightPower;

        if (finalAlpha > 0.05) {
          ctx.fillStyle = `rgba(208, 181, 123, ${finalAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ======================================================================
      // LAYER 8: INTERACTIVE LIGHT ORBIT & ARCHITECTURAL EDGE ILLUMINATION
      // Large signature curved light path influenced by cursor
      // Top edge warm champagne, lower edge bronze, center dark
      // ======================================================================
      const orbitCenterX = width * 0.72 + norm.currentX * 40;
      const orbitCenterY = height * 0.22 + norm.currentY * 30;
      const orbitRadius = Math.min(width, height) * 0.38;

      ctx.save();
      ctx.lineWidth = 1;
      const orbitGrad = ctx.createLinearGradient(orbitCenterX - orbitRadius, orbitCenterY - orbitRadius, orbitCenterX + orbitRadius, orbitCenterY + orbitRadius);
      orbitGrad.addColorStop(0, `rgba(208, 181, 123, ${0.20 * atmos.lightPower})`); // Warm champagne top edge
      orbitGrad.addColorStop(0.50, `rgba(${atmos.goldR}, ${atmos.goldG}, ${atmos.goldB}, 0.04)`);
      orbitGrad.addColorStop(1, `rgba(${atmos.bronzeR}, ${atmos.bronzeG}, ${atmos.bronzeB}, ${0.18 * atmos.lightPower})`); // Bronze lower edge

      ctx.strokeStyle = orbitGrad;
      ctx.beginPath();
      ctx.arc(orbitCenterX, orbitCenterY, orbitRadius, 0.4 * Math.PI, 1.6 * Math.PI);
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // Exit screen composite mode

      // ======================================================================
      // LAYER 9: SAFE CONTENT ZONE & CINEMATIC VIGNETTE
      // Calm center behind hero headline & CTA, smooth dark falloff at edges
      // ======================================================================
      const safeCenterX = width * 0.5;
      const safeCenterY = height * 0.34;
      const safeRadiusX = width * 0.40;
      const safeRadiusY = height * 0.30;

      // Soft center calm mask
      ctx.save();
      const safeGrad = ctx.createRadialGradient(safeCenterX, safeCenterY, 0, safeCenterX, safeCenterY, safeRadiusX);
      safeGrad.addColorStop(0, 'rgba(7, 7, 6, 0.38)');
      safeGrad.addColorStop(0.50, 'rgba(7, 7, 6, 0.22)');
      safeGrad.addColorStop(1, 'transparent');

      ctx.translate(safeCenterX, safeCenterY);
      ctx.scale(1, safeRadiusY / safeRadiusX);
      ctx.fillStyle = safeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, safeRadiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Outer cinematic vignette
      const vignetteGrad = ctx.createRadialGradient(width * 0.5, height * 0.42, width * 0.25, width * 0.5, height * 0.42, width * 0.75);
      vignetteGrad.addColorStop(0, 'transparent');
      vignetteGrad.addColorStop(0.60, 'rgba(7, 7, 6, 0.28)');
      vignetteGrad.addColorStop(0.88, 'rgba(7, 7, 6, 0.72)');
      vignetteGrad.addColorStop(1, '#070706');

      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);

      // Loop RAF unless user prefers reduced motion
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    // Initial render
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
          SVG noise filter overlay giving authentic blackened titanium texture
          ==================================================================== */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
