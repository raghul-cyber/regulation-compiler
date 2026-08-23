import os

os.makedirs("src/components/3d", exist_ok=True)

hero_scene_code = """'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NUM_NODES = 150;

export function HeroScene() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Parallax scroll state
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize node data exactly like SvelteKit logic
  const nodes = useMemo(() => {
    return Array.from({ length: NUM_NODES }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 10 - 5,
      speed: Math.random() * 0.2 + 0.1,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state, delta) => {
    // Parallax Camera Logic
    const camZ = 5 + (scrollY * 0.005);
    const camY = -(scrollY * 0.002);
    
    // Smoothly interpolate camera position
    state.camera.position.lerp(new THREE.Vector3(0, camY, camZ), 0.1);
    state.camera.lookAt(0, 0, 0);

    // Node Animation Logic
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      
      nodes.forEach((node, i) => {
        const x = node.x + Math.sin(time * node.speed + node.offset) * 2;
        const y = node.y + Math.cos(time * node.speed + node.offset) * 2;
        const z = node.z;
        const scale = Math.sin(time + node.offset) * 0.5 + 0.8;
        
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
      <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
      <ambientLight intensity={0.2} />
      
      <instancedMesh ref={meshRef} args={[undefined, undefined, NUM_NODES]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshPhysicalMaterial 
          color="#3b82f6" 
          emissive="#1d4ed8"
          emissiveIntensity={0.5}
          roughness={0.2} 
          metalness={0.8} 
          transmission={0.5}
        />
      </instancedMesh>
    </>
  );
}
"""

with open("src/components/3d/hero-scene.tsx", "w", encoding="utf-8") as f:
    f.write(hero_scene_code)
