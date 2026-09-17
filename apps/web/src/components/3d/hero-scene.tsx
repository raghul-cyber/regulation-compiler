'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader for the Infinite Cyber Perspective Grid
const GridShaderMaterial = {
  vertexShader: `
    varying vec3 vWorldPos;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
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
    uniform vec2 uMouse;

    // Analytic antialiased grid lines using fwidth
    float getGridLine(vec2 coord, float lineWidth) {
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      float line = min(grid.x, grid.y);
      return 1.0 - min(line / lineWidth, 1.0);
    }

    void main() {
      // Advance grid along Z based on continuous time + scroll acceleration
      vec2 pos = vec2(vWorldPos.x, vWorldPos.z + uTime * 2.8 + uScroll * 0.035);

      // Minor grid (density 0.6, crisp thin lines)
      float minor = getGridLine(pos * 0.6, 1.0);

      // Major grid lines (every 4 units, brighter and wider)
      float major = getGridLine(pos * 0.15, 1.4);

      // Intersection node beacons
      vec2 nodeCoord = fract(pos * 0.6 - 0.5) - 0.5;
      float nodeDist = length(nodeCoord);
      float nodes = smoothstep(0.10, 0.0, nodeDist);

      // Laser energy pulses travelling across regulatory lanes along Z
      float pulse1 = sin(pos.y * 0.18 - uTime * 3.2 - uScroll * 0.02);
      pulse1 = pow(clamp(pulse1, 0.0, 1.0), 10.0) * 2.2;

      float pulse2 = cos(pos.x * 0.15 + uTime * 1.5);
      pulse2 = pow(clamp(pulse2, 0.0, 1.0), 6.0) * 0.9;

      // Mouse interactive radial glow
      float mouseDist = length(vWorldPos.xz - vec2(uMouse.x * 8.0, uCameraPos.z - 10.0));
      float mouseGlow = exp(-mouseDist * 0.12) * 0.35;

      // Premium Color Palette: Deep Space Navy, Electric Blue & Cyber Cyan
      vec3 darkBase = vec3(0.02, 0.06, 0.14);
      vec3 minorColor = vec3(0.08, 0.28, 0.65);
      vec3 majorColor = vec3(0.20, 0.60, 1.0);
      vec3 pulseColor = vec3(0.38, 0.92, 1.0);

      // Composite color calculation
      vec3 col = darkBase * 0.4;
      col += minorColor * minor * 0.7;
      col += majorColor * major * 1.5;
      col += pulseColor * (pulse1 + pulse2) * (minor * 0.9 + major * 1.6 + 0.12);
      col += pulseColor * nodes * 1.6;
      col += vec3(0.15, 0.5, 0.95) * mouseGlow;

      // Distance fog towards horizon (seamless blend into dark background)
      float dist = length(vWorldPos - uCameraPos);
      float alpha = (minor * 0.55 + major * 0.85 + (pulse1 + pulse2) * 0.45 + nodes * 0.6);
      
      float fadeNear = smoothstep(0.5, 2.5, dist);
      float fadeFar = 1.0 - smoothstep(14.0, 52.0, dist);
      alpha *= fadeNear * fadeFar;

      gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
    }
  `
};

function CyberGridScene({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [scrollY, setScrollY] = useState(0);
  const mouse = useRef({ x: 0, y: 0 });

  // Floating ambient cyber dust particles
  const particleCount = 100;
  const [particlesPos] = useState(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 35;       // X
      arr[i * 3 + 1] = -1.8 + Math.random() * 4.5;    // Y (just above floor grid)
      arr[i * 3 + 2] = -40 + Math.random() * 45;     // Z (stretching towards horizon)
    }
    return arr;
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Smooth camera pitch & translation linked to scroll
    const targetCamY = 0.5 - Math.min(scrollY * 0.0018, 0.9);
    const targetCamZ = 5.2 - Math.min(scrollY * 0.0025, 2.5);
    const targetCamX = mouse.current.x * 0.4;

    state.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.08);
    state.camera.lookAt(targetCamX * 0.2, -0.6, -18);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = prefersReducedMotion ? 0 : time;
      materialRef.current.uniforms.uScroll.value = scrollY;
      materialRef.current.uniforms.uCameraPos.value.copy(state.camera.position);
      materialRef.current.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    }

    // Gentle motion for cyber dust particles
    if (pointsRef.current && !prefersReducedMotion) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      const speed = 0.04 + (scrollY * 0.0001);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] += speed;
        if (positions[i * 3 + 2] > 6) {
          positions[i * 3 + 2] = -42;
          positions[i * 3] = (Math.random() - 0.5) * 35;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Floor Perspective Cyber Grid */}
      <mesh 
        ref={meshRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2.1, -12]}
      >
        <planeGeometry args={[70, 70, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={GridShaderMaterial.vertexShader}
          fragmentShader={GridShaderMaterial.fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cyber Dust Stream */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlesPos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38bdf8"
          transparent={true}
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

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
      camera={{ position: [0, 0.5, 5], fov: 60 }} 
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
        alpha: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#06070a'), 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
        }, false);
      }}
    >
      <CyberGridScene prefersReducedMotion={prefersReducedMotion} />
    </Canvas>
  );
}
