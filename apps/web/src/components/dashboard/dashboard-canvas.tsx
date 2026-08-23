'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 40;

function PipelineLogic({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: THREE.MathUtils.randFloat(-10, -8),
      y: THREE.MathUtils.randFloat(-0.5, 0.5),
      z: THREE.MathUtils.randFloat(-0.5, 0.5),
      speed: THREE.MathUtils.randFloat(0.05, 0.15),
      phase: 0 // 0: Ingestion -> Ext, 1: Ext -> Policy
    }));
  }, []);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('pointermove', handleMouseMove);
    return () => window.removeEventListener('pointermove', handleMouseMove);
  }, [prefersReducedMotion]);

  // Initial setup for reduced motion
  useEffect(() => {
    if (prefersReducedMotion && particlesRef.current) {
      particles.forEach((p, i) => {
        dummy.position.set(p.x, p.y + Math.sin(p.x) * 0.5, p.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
        const color = new THREE.Color(p.phase === 0 ? "#94a3b8" : "#38bdf8");
        particlesRef.current!.setColorAt(i, color);
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
      if (particlesRef.current.instanceColor) {
        particlesRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [prefersReducedMotion, dummy, particles]);

  useFrame((state) => {
    if (prefersReducedMotion) return;

    // Mouse Parallax
    state.camera.position.lerp(new THREE.Vector3(mouse.x * 1, 5 + mouse.y * 1, 15), 0.05);
    state.camera.lookAt(0, 0, 0);

    // Flow Logic
    if (particlesRef.current) {
      particles.forEach((p, i) => {
        p.x += p.speed;
        if (p.x > 0 && p.phase === 0) p.phase = 1;
        if (p.x > 10) {
          p.x = THREE.MathUtils.randFloat(-10, -8);
          p.y = THREE.MathUtils.randFloat(-0.5, 0.5);
          p.z = THREE.MathUtils.randFloat(-0.5, 0.5);
          p.phase = 0;
        }

        dummy.position.set(p.x, p.y + Math.sin(p.x) * 0.5, p.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
        
        const color = new THREE.Color(p.phase === 0 ? "#94a3b8" : "#38bdf8");
        particlesRef.current!.setColorAt(i, color);
      });
      particlesRef.current.instanceMatrix.needsUpdate = true;
      if (particlesRef.current.instanceColor) {
        particlesRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#4f46e5" />
      <directionalLight position={[-5, 5, -5]} intensity={1} color="#06b6d4" />
      <pointLight position={[0, 0, 2]} intensity={2} color="#ffffff" distance={10} />

      {/* 1. Ingestion Node */}
      <Float speed={prefersReducedMotion ? 0 : 2} floatIntensity={prefersReducedMotion ? 0 : 0.5}>
        <mesh position={[-8, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.2} clearcoat={1.0} />
        </mesh>
      </Float>

      {/* 2. AI Extraction Engine Node (Center) */}
      <Float speed={prefersReducedMotion ? 0 : 1.5} floatIntensity={prefersReducedMotion ? 0 : 1} rotationIntensity={prefersReducedMotion ? 0 : 0.5}>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshPhysicalMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} wireframe={true} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[1.2, 0]} />
          <meshPhysicalMaterial color="#60a5fa" metalness={1} roughness={0} transmission={0.9} thickness={0.5} />
        </mesh>
      </Float>

      {/* 3. Policy Node */}
      <Float speed={prefersReducedMotion ? 0 : 2.5} floatIntensity={prefersReducedMotion ? 0 : 0.5}>
        <mesh position={[8, 0, 0]}>
          <cylinderGeometry args={[1, 1, 2, 32]} />
          <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} clearcoat={1.0} />
        </mesh>
      </Float>

      {/* Connecting Beams */}
      <mesh position={[-4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.5} />
      </mesh>
      <mesh position={[4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>

      {/* Flow Particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial />
      </instancedMesh>
    </>
  );
}

export default function DashboardCanvas() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] overflow-hidden shadow-md h-[250px] relative">
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-80" />
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
          Data Flow
          {prefersReducedMotion && <span className="text-[10px] uppercase font-bold text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">Reduced Motion</span>}
        </h3>
        <p className="text-xs text-zinc-500">Live processing pipeline</p>
      </div>
      <Canvas camera={{ position: [0, 5, 15], fov: 45 }} onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0a0a0c'), 0);
      }}>
        <PipelineLogic prefersReducedMotion={prefersReducedMotion} />
        {!prefersReducedMotion && (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            enableZoom={false} 
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 4}
          />
        )}
      </Canvas>
    </div>
  );
}
