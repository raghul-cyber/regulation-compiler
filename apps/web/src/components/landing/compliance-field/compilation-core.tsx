'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CompilationCore({ 
  prefersReducedMotion,
  scrollY 
}: { 
  prefersReducedMotion: boolean;
  scrollY: number;
}) {
  const outerRingRef = useRef<THREE.Group>(null);
  const midFrameRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const latticeRef = useRef<THREE.LineSegments>(null);

  const [coreIntensity, setCoreIntensity] = useState(0.3);
  const eventTimer = useRef(4.0);
  const isCompiling = useRef(false);
  const compileProgress = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Slow, stately rotation (counter-rotations)
    if (!prefersReducedMotion) {
      if (outerRingRef.current) {
        outerRingRef.current.rotation.z = t * 0.04;
        outerRingRef.current.rotation.x = Math.PI / 6 + Math.sin(t * 0.05) * 0.05;
      }
      if (midFrameRef.current) {
        midFrameRef.current.rotation.z = -t * 0.06;
        midFrameRef.current.rotation.y = t * 0.05;
      }
      if (innerCoreRef.current) {
        innerCoreRef.current.rotation.x = t * 0.08;
        innerCoreRef.current.rotation.y = t * 0.10;
      }
      if (latticeRef.current) {
        latticeRef.current.rotation.x = -t * 0.05;
        latticeRef.current.rotation.z = t * 0.07;
      }
    }

    // Periodic compilation event trigger (every 6-9s, duration ~2.2s)
    eventTimer.current -= delta;
    if (eventTimer.current <= 0 && !isCompiling.current) {
      isCompiling.current = true;
      compileProgress.current = 0;
      eventTimer.current = 6.5 + Math.random() * 4.0;
    }

    if (isCompiling.current) {
      compileProgress.current += delta * 0.65; // ~1.5 - 2s event
      if (compileProgress.current >= 1.0) {
        isCompiling.current = false;
        setCoreIntensity(0.3);
      } else {
        // Bell curve illumination: smooth ease in and out
        const p = compileProgress.current;
        const curve = Math.sin(p * Math.PI);
        setCoreIntensity(0.3 + curve * 0.55);
      }
    }
  });

  return (
    <group position={[0, -0.2, -15]}>
      {/* 1. Outer Computational Coordinate Ring with fine geometry */}
      <group ref={outerRingRef}>
        <mesh>
          <ringGeometry args={[4.2, 4.24, 64]} />
          <meshBasicMaterial 
            color="#2D718F" 
            transparent={true} 
            opacity={0.35} 
            side={THREE.DoubleSide} 
          />
        </mesh>
        <mesh>
          <ringGeometry args={[3.8, 3.82, 32]} />
          <meshBasicMaterial 
            color="#5CC8FF" 
            transparent={true} 
            opacity={0.20} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>

      {/* 2. Mid Nested Hexagonal / Octagonal Wireframe Frame */}
      <group ref={midFrameRef}>
        <mesh>
          <cylinderGeometry args={[2.8, 2.8, 0.08, 6, 1, true]} />
          <meshBasicMaterial 
            color="#2D718F" 
            wireframe={true} 
            transparent={true} 
            opacity={0.38} 
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 6, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.06, 6, 1, true]} />
          <meshBasicMaterial 
            color="#5CC8FF" 
            wireframe={true} 
            transparent={true} 
            opacity={0.25} 
          />
        </mesh>
      </group>

      {/* 3. Inner Compiled Logic Lattice (Faceted geometric core) */}
      <mesh ref={innerCoreRef} scale={1.0 + coreIntensity * 0.15}>
        <octahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial 
          color="#5CC8FF" 
          wireframe={true} 
          transparent={true} 
          opacity={coreIntensity} 
        />
      </mesh>

      {/* 4. Central Verification Anchor Point */}
      <mesh scale={0.4}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color="#67D6A0" 
          wireframe={true} 
          transparent={true} 
          opacity={coreIntensity * 0.8} 
        />
      </mesh>
    </group>
  );
}
