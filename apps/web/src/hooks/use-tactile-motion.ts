'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Tactile Magnetic CTA Hook
 * Subtly attracts the button 1–3px towards the pointer with smooth spring damping.
 * Returns ref and inline style for transform.
 */
export function useMagneticCTA(maxOffset: number = 3) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const moveX = Math.max(-maxOffset, Math.min(maxOffset, deltaX * maxOffset));
    const moveY = Math.max(-maxOffset, Math.min(maxOffset, deltaY * maxOffset));

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setStyle({
        transform: `translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0)`,
        transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
      });
    });
  }, [maxOffset]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setStyle({
        transform: 'translate3d(0px, 0px, 0)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      });
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    el.addEventListener('mousemove', handleMouseMove as any, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove as any);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, style };
}

/**
 * Luxury Card Tilt & Glass Reflection Hook
 * Applies 1–2 degree subtle perspective tilt and shifts light reflections.
 */
export function useLuxuryTilt(maxTiltDeg: number = 1.5) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1;

    const tiltX = -normY * maxTiltDeg;
    const tiltY = normX * maxTiltDeg;

    const pctX = Math.round((x / rect.width) * 100);
    const pctY = Math.round((y / rect.height) * 100);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`,
        transition: 'transform 0.15s ease-out',
      });
      setReflectionPos({ x: pctX, y: pctY });
    });
  }, [maxTiltDeg]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      });
      setReflectionPos({ x: 50, y: 50 });
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, tiltStyle, reflectionPos };
}
