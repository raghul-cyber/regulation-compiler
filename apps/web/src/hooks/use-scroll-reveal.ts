'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollRevealOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.15 */
  threshold?: number;
  /** Root margin for early/late triggering. Default: '0px 0px -60px 0px' */
  rootMargin?: string;
  /** Only trigger once. Default: true */
  once?: boolean;
}

/**
 * Ultra-lightweight scroll reveal hook using IntersectionObserver.
 * Returns a ref to attach to the element and a boolean for whether it's revealed.
 * 
 * Usage:
 *   const { ref, isRevealed } = useScrollReveal();
 *   <div ref={ref} className={`landing-reveal ${isRevealed ? 'revealed' : ''}`}>
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsRevealed(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isRevealed };
}

/**
 * Animated count-up hook for metric numbers.
 * Starts counting when the element enters the viewport.
 * 
 * Usage:
 *   const { ref, displayValue } = useCountUp(39, '+');
 *   <div ref={ref}>{displayValue}</div>
 */
export function useCountUp(
  target: number,
  suffix: string = '',
  duration: number = 1800
) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(`0${suffix}`);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(`${target}${suffix}`);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.unobserve(element);

          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for a satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            setDisplayValue(`${current}${suffix}`);
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, suffix, duration]);

  return { ref, displayValue };
}
