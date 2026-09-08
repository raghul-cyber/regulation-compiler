'use client';

import { useEffect } from 'react';

/**
 * ConsoleGuard filters out benign internal third-party warnings from dev server forwarding:
 * 1. Three.js r185 deprecation warning emitted inside @react-three/fiber core:
 *    "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead."
 * 2. Benign WebGL context loss messages during page unmounts and client route transitions.
 */
export function ConsoleGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : '';
      if (firstArg.includes('THREE.Clock: This module has been deprecated')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : '';
      if (firstArg.includes('WebGLRenderer: Context Lost')) {
        return;
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  return null;
}
