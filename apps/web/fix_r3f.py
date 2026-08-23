import sys

# 1. Update hero-scene.tsx
with open("src/components/3d/hero-scene.tsx", "r", encoding="utf-8") as f:
    scene_text = f.read()

scene_text = scene_text.replace("import { useFrame } from '@react-three/fiber';", "import { useFrame, Canvas } from '@react-three/fiber';")

# We need to extract the actual scene logic into a sub-component so useFrame works
# useFrame must be called inside a <Canvas>

new_scene_code = """'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const NUM_NODES = 150;

function SceneLogic() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Parallax scroll state
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const camZ = 5 + (scrollY * 0.005);
    const camY = -(scrollY * 0.002);
    
    state.camera.position.lerp(new THREE.Vector3(0, camY, camZ), 0.1);
    state.camera.lookAt(0, 0, 0);

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

export function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <SceneLogic />
    </Canvas>
  );
}
"""

with open("src/components/3d/hero-scene.tsx", "w", encoding="utf-8") as f:
    f.write(new_scene_code)

# 2. Update page.tsx
with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    page_text = f.read()

page_text = page_text.replace("import { Canvas } from '@react-three/fiber';", "")
page_text = page_text.replace("<Canvas camera={{ position: [0, 0, 5], fov: 60 }}>\n          <HeroScene />\n        </Canvas>", "<HeroScene />")

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_text)

