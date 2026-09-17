'use client';

import * as THREE from 'three';

export function Atmosphere() {
  return (
    <>
      {/* Deep technical space atmospheric fog */}
      <fogExp2 attach="fog" args={['#05070A', 0.028]} />

      {/* Subtle ambient lighting */}
      <ambientLight intensity={0.35} color="#0c1929" />

      {/* Directional technical blue rim light */}
      <directionalLight 
        position={[15, 20, 10]} 
        intensity={0.65} 
        color="#5CC8FF" 
      />

      {/* Subtle under-fill light for elevation relief */}
      <directionalLight 
        position={[-15, -10, -20]} 
        intensity={0.25} 
        color="#2D718F" 
      />
    </>
  );
}
