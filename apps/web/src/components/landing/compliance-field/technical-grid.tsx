'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GridShader = {
  vertexShader: `
    varying vec3 vWorldPos;
    varying vec2 vUv;

    uniform float uTime;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Extremely subtle wave deformation matching terrain
      float wave = sin(pos.x * 0.08 + uTime * 0.12) * cos(pos.y * 0.06 + uTime * 0.09) * 0.45;
      pos.z += wave + 0.02; // Sits just above terrain

      vec4 worldPos = modelMatrix * vec4(pos, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPos;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uScroll;
    uniform vec3 uCameraPos;

    // Analytic antialiased grid line using fwidth
    float getLine(vec2 coord, float width) {
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      float line = min(grid.x, grid.y);
      return 1.0 - min(line / width, 1.0);
    }

    void main() {
      // Coordinate with subtle drift + scroll progression
      vec2 coord = vec2(vWorldPos.x, vWorldPos.z + uTime * 0.4 + uScroll * 0.015);

      // Micro differential distortion across sectors
      float sectorSpeed = sin(vWorldPos.x * 0.05 + vWorldPos.z * 0.04) * 0.1;
      coord.y += sin(uTime * 0.2 + sectorSpeed) * 0.15;

      // Minor grid lines (step 0.5, very thin, low opacity)
      float minor = getLine(coord * 0.5, 0.85);

      // Major grid lines (step 0.125, slightly brighter)
      float major = getLine(coord * 0.125, 1.2);

      // Technical Blue palette: #2D718F (subtle) to #5CC8FF (technical highlight)
      vec3 subtleBlue = vec3(0.176, 0.443, 0.561); // #2D718F
      vec3 techBlue = vec3(0.361, 0.784, 1.0);     // #5CC8FF

      vec3 col = subtleBlue * minor * 0.6 + techBlue * major * 1.1;

      // Distance fade & horizon atmospheric fade
      float dist = length(vWorldPos - uCameraPos);
      float alpha = (minor * 0.35 + major * 0.55);
      
      // Near and far atmospheric attenuation
      float fadeNear = smoothstep(0.8, 3.0, dist);
      float fadeFar = 1.0 - smoothstep(12.0, 48.0, dist);
      alpha *= fadeNear * fadeFar;

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.75));
    }
  `
};

export function TechnicalGrid({ 
  prefersReducedMotion,
  scrollY 
}: { 
  prefersReducedMotion: boolean;
  scrollY: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = prefersReducedMotion ? 0 : state.clock.elapsedTime;
      materialRef.current.uniforms.uScroll.value = scrollY;
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
        vertexShader={GridShader.vertexShader}
        fragmentShader={GridShader.fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
