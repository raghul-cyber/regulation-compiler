'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NUM_NODES = 60;

function SceneLogic({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nodes = useMemo(() => {
    return Array.from({ length: NUM_NODES }, () => ({
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 12,
      z: (Math.random() - 0.5) * 8 - 3,
      speed: Math.random() * 0.08 + 0.04,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Initial render setup for reduced motion
  useEffect(() => {
    if (prefersReducedMotion && meshRef.current) {
      nodes.forEach((node, i) => {
        dummy.position.set(node.x, node.y, node.z);
        dummy.scale.set(0.6, 0.6, 0.6);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [prefersReducedMotion, dummy, nodes]);

  useFrame((state) => {
    if (prefersReducedMotion) return; // Freeze animation
    
    const camZ = 5 + (scrollY * 0.002);
    const camY = -(scrollY * 0.001);
    
    state.camera.position.lerp(new THREE.Vector3(0, camY, camZ), 0.05);
    state.camera.lookAt(0, 0, 0);

    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      nodes.forEach((node, i) => {
        const x = node.x + Math.sin(time * node.speed + node.offset) * 0.4;
        const y = node.y + Math.cos(time * node.speed + node.offset) * 0.4;
        const z = node.z;
        const scale = (Math.sin(time * 0.8 + node.offset) * 0.15 + 0.5);
        
        dummy.position.set(x, y, z);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <directionalLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-10, -10, -10]} intensity={0.6} color="#3b82f6" />
      <ambientLight intensity={0.2} />
      
      <instancedMesh ref={meshRef} args={[undefined, undefined, NUM_NODES]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshPhysicalMaterial 
          color="#3b82f6" 
          emissive="#1e40af"
          emissiveIntensity={0.4}
          roughness={0.3} 
          metalness={0.7} 
          transparent={true}
          opacity={0.65}
        />
      </instancedMesh>
    </>
  );
}

// We dynamically export just the Canvas wrapper from the page, or we can export the component
// However, the page will wrap THIS component in next/dynamic.
// We must also be careful about importing Canvas.
import { Canvas } from '@react-three/fiber';

export function HeroScene() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 60 }} 
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0a0a0c'), 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
        }, false);
      }}
    >
      <SceneLogic prefersReducedMotion={prefersReducedMotion} />
    </Canvas>
  );
}
