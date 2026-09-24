'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Strategic global regulatory jurisdictions
const JURISDICTION_MARKERS: { name: string; lat: number; lng: number }[] = [
  { name: 'EU', lat: 50.8503, lng: 4.3517 },    // Brussels (EU AI Act, GDPR, DORA)
  { name: 'US', lat: 38.9072, lng: -77.0369 },  // Washington (NIST, SEC Cyber, HIPAA)
  { name: 'UK', lat: 51.5074, lng: -0.1278 },   // London (FCA, UK GDPR)
  { name: 'SG', lat: 1.3521, lng: 103.8198 },   // Singapore (MAS Cyber, PDPA)
  { name: 'CH', lat: 46.2044, lng: 6.1432 },    // Geneva (ISO/IEC Standards)
  { name: 'JP', lat: 35.6762, lng: 139.6503 },  // Tokyo (APPI)
];

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function RegulatoryGlobe({
  prefersReducedMotion,
  isMobile,
}: {
  prefersReducedMotion: boolean;
  isMobile: boolean;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const radius = isMobile ? 3.0 : 4.4;

  const nodePositions = useMemo(() => {
    return JURISDICTION_MARKERS.map((m) => ({
      ...m,
      pos: latLngToVec3(m.lat, m.lng, radius * 1.01),
    }));
  }, [radius]);

  // Subtle connecting compliance routes between regulatory capitals
  const routeCurves = useMemo(() => {
    const curves: THREE.Vector3[][] = [];
    const pairs: [number, number][] = [
      [0, 1], // EU <-> US
      [0, 2], // EU <-> UK
      [0, 3], // EU <-> SG
      [0, 4], // EU <-> CH
      [1, 5], // US <-> JP
      [3, 5], // SG <-> JP
    ];

    pairs.forEach(([i, j]) => {
      const p1 = nodePositions[i].pos;
      const p2 = nodePositions[j].pos;
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      // Elevate midpoint outward to create an elegant great-circle arc
      mid.normalize().multiplyScalar(radius * 1.14);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      curves.push(curve.getPoints(24));
    });

    return curves;
  }, [nodePositions, radius]);

  useFrame((_, delta) => {
    if (!prefersReducedMotion && globeRef.current) {
      // Stately, deliberate slow rotation (~0.012 rad/s)
      globeRef.current.rotation.y += delta * 0.018;
      globeRef.current.rotation.x = Math.sin(Date.now() * 0.00015) * 0.04;
    }
    if (!prefersReducedMotion && ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.008;
    }
  });

  // Memoized Three.js Line objects for compliance arcs to prevent re-allocation in render loops
  const routeLines = useMemo(() => {
    return routeCurves.map((pts) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: '#3B82F6',
        transparent: true,
        opacity: 0.22,
      });
      return new THREE.Line(geo, mat);
    });
  }, [routeCurves]);

  // Position: Large partial globe entering from upper-right behind hero
  const globePosition: [number, number, number] = isMobile
    ? [0.8, 0.4, -9.5]
    : [3.4, 0.5, -8.2];

  return (
    <group position={globePosition}>
      <group ref={globeRef}>
        {/* 1. Outer Geodesic Wireframe Matrix */}
        <mesh>
          <icosahedronGeometry args={[radius, 3]} />
          <meshBasicMaterial
            color="#2563EB"
            wireframe={true}
            transparent={true}
            opacity={isMobile ? 0.07 : 0.14}
          />
        </mesh>

        {/* 2. Inner Deep Obsidian Spherical Core */}
        <mesh>
          <sphereGeometry args={[radius * 0.985, 32, 32]} />
          <meshBasicMaterial
            color="#080C14"
            transparent={true}
            opacity={0.88}
          />
        </mesh>

        {/* 3. Subtle Latitude / Longitude Guidance Rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.002, radius * 1.006, 64]} />
          <meshBasicMaterial
            color="#3B82F6"
            transparent={true}
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[radius * 1.002, radius * 1.005, 48]} />
          <meshBasicMaterial
            color="#1D4ED8"
            transparent={true}
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 4. Strategic Regulatory Jurisdiction Nodes */}
        {nodePositions.map((node, idx) => (
          <group key={idx} position={node.pos}>
            <mesh>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial
                color="#60A5FA"
                transparent={true}
                opacity={0.85}
              />
            </mesh>
            {/* Outer precision beacon marker */}
            <mesh>
              <ringGeometry args={[0.09, 0.11, 16]} />
              <meshBasicMaterial
                color="#2563EB"
                transparent={true}
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* 5. Geodesic Compliance Policy Arcs */}
        {routeLines.map((lineObj, idx) => (
          <primitive key={idx} object={lineObj} />
        ))}
      </group>

      {/* 6. External Planetary Orbital System Boundary Ring */}
      <group ref={ringsRef} rotation={[Math.PI / 5, Math.PI / 8, 0]}>
        <mesh>
          <ringGeometry args={[radius * 1.32, radius * 1.326, 64]} />
          <meshBasicMaterial
            color="#1E293B"
            transparent={true}
            opacity={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
