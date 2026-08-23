'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function RotatingBox(props: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

export default function R3FTestPage() {
  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-8">React Three Fiber Test</h1>
      <div className="w-[600px] h-[400px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        <Canvas>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
          <RotatingBox position={[-1.2, 0, 0]} />
          <RotatingBox position={[1.2, 0, 0]} />
        </Canvas>
      </div>
    </div>
  );
}
