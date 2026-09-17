'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TerrainShader = {
  vertexShader: `
    varying vec3 vWorldPos;
    varying vec2 vUv;
    varying float vElevation;

    uniform float uTime;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Computational pseudo-noise displacement (barely perceptible, low amplitude)
      float wave1 = sin(pos.x * 0.08 + uTime * 0.12) * cos(pos.y * 0.06 + uTime * 0.09);
      float wave2 = sin(pos.x * 0.16 - uTime * 0.08) * sin(pos.y * 0.12 + uTime * 0.07) * 0.5;
      float elevation = (wave1 + wave2) * 0.45; // Low amplitude computational surface

      pos.z += elevation;
      vElevation = elevation;

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPos;
    varying vec2 vUv;
    varying float vElevation;

    uniform vec3 uCameraPos;

    void main() {
      // Subtle technical dark surface (#080D13 to #05070A)
      vec3 deepBg = vec3(0.012, 0.020, 0.027); // #030507
      vec3 surface = vec3(0.031, 0.051, 0.075); // #080D13
      vec3 subtleBlue = vec3(0.05, 0.12, 0.18);

      vec3 col = mix(deepBg, surface, clamp(vElevation * 0.8 + 0.5, 0.0, 1.0));
      col += subtleBlue * clamp(vElevation * 0.3, 0.0, 0.2);

      // Distance fog to horizon
      float dist = length(vWorldPos - uCameraPos);
      float alpha = 1.0 - smoothstep(10.0, 48.0, dist);

      gl_FragColor = vec4(col, clamp(alpha * 0.65, 0.0, 0.85));
    }
  `
};

export function ProceduralTerrain({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = prefersReducedMotion ? 0 : state.clock.elapsedTime;
      materialRef.current.uniforms.uCameraPos.value.copy(state.camera.position);
    }
  });

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2.6, -14]}
    >
      <planeGeometry args={[75, 75, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={TerrainShader.vertexShader}
        fragmentShader={TerrainShader.fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
