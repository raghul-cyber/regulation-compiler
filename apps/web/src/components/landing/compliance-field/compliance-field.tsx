'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import { Atmosphere } from './atmosphere';
import { ProceduralTerrain } from './terrain';
import { TechnicalGrid } from './technical-grid';
import { RegulatoryNodes } from './regulatory-nodes';
import { RelationshipGraph } from './relationship-graph';
import { DataStreams } from './data-streams';
import { CompilationCore } from './compilation-core';
import { CameraController } from './camera-controller';

interface NodePos {
  x: number;
  y: number;
  z: number;
  id: number;
}

export function ComplianceField() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [nodePositions, setNodePositions] = useState<NodePos[]>([]);

  useEffect(() => {
    // 1. WebGL capability check
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }

    // 2. Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionHandler);

    // 3. Mobile breakpoint check
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    // 4. Scroll listener
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 5. Visibility state listener (pause rendering when tab hidden)
    const handleVisibility = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mediaQuery.removeEventListener('change', motionHandler);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleNodePositions = useCallback((nodes: NodePos[]) => {
    setNodePositions(nodes);
  }, []);

  // WebGL Graceful Fallback
  if (!hasWebGL) {
    return (
      <div 
        aria-hidden="true" 
        className="fixed inset-0 -z-10 bg-[#05070A] pointer-events-none"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#17222C08_1px,transparent_1px),linear-gradient(to_bottom,#17222C08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-radial-[at_50%_20%] from-[#5CC8FF08] via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div 
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      <Canvas
        camera={{ position: [0, 0.85, 6.8], fov: 55 }}
        dpr={[1, 1.5]} // Capped Device Pixel Ratio for battery & 60fps performance
        frameloop={isTabVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          alpha: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#05070A'), 0);
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
          }, false);
        }}
      >
        <Suspense fallback={null}>
          <Atmosphere />
          
          <ProceduralTerrain 
            prefersReducedMotion={prefersReducedMotion} 
          />
          
          <TechnicalGrid 
            prefersReducedMotion={prefersReducedMotion}
            scrollY={scrollY}
          />
          
          <RegulatoryNodes 
            nodeCount={isMobile ? 120 : 360}
            prefersReducedMotion={prefersReducedMotion}
            onNodePositionsReady={handleNodePositions}
          />
          
          <RelationshipGraph 
            nodes={nodePositions}
            prefersReducedMotion={prefersReducedMotion}
          />
          
          <DataStreams 
            prefersReducedMotion={prefersReducedMotion}
          />
          
          <CompilationCore 
            prefersReducedMotion={prefersReducedMotion}
            scrollY={scrollY}
          />
          
          <CameraController 
            prefersReducedMotion={prefersReducedMotion}
            scrollY={scrollY}
          />
        </Suspense>
      </Canvas>

      {/* Atmospheric Vignette & Deep Space Vignette Layer */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(5,7,10,0.4)_50%,rgba(5,7,10,0.95)_100%)]" />
    </div>
  );
}
