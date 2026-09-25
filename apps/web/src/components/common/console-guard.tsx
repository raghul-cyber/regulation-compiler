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
      if (
        firstArg.includes('THREE.Clock: This module has been deprecated') ||
        firstArg.includes('Clerk: Clerk has been loaded with development keys') ||
        firstArg.includes('was preloaded using link preload but not used')
      ) {
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

    const originalError = console.error;
    console.error = (...args: any[]) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : '';
      if (firstArg.includes('ERR_NAME_NOT_RESOLVED') && firstArg.includes('clerk')) {
        return;
      }
      originalError.apply(console, args);
    };

    // Global native alert override: completely silences raw browser alerts and routes to intra-app system
    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      const msg = String(message ?? '');
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('intra-app-alert', { detail: { message: msg } }));
        }, 0);
      }
    };

    return () => {
      console.warn = originalWarn;
      console.log = originalLog;
      console.error = originalError;
      window.alert = originalAlert;
    };
  }, []);

  return null;
}
