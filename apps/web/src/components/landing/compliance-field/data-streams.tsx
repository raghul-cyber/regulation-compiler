'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StreamPath {
  points: THREE.Vector3[];
  speed: number;
  progress: number;
  waitTimer: number;
  active: boolean;
}

export function DataStreams({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const streamCount = 5;

  // 5 discrete statutory compilation paths (e.g. Ingestion -> Parser -> AST -> Validation -> Compiled Logic)
  const paths = useMemo<StreamPath[]>(() => {
    return [
      {
        points: [
          new THREE.Vector3(-10, -1.9, -15),
          new THREE.Vector3(-8, -1.7, -13),
          new THREE.Vector3(-4, -1.5, -14),
          new THREE.Vector3(0, -1.2, -15),
        ],
        speed: 0.35,
        progress: 0,
        waitTimer: 0.5,
        active: true,
      },
      {
        points: [
          new THREE.Vector3(9, -1.9, -13),
          new THREE.Vector3(6, -1.6, -12),
          new THREE.Vector3(2, -1.4, -14),
          new THREE.Vector3(0, -1.2, -15),
        ],
        speed: 0.28,
        progress: 0.4,
        waitTimer: 1.2,
        active: true,
      },
      {
        points: [
          new THREE.Vector3(-5, -1.8, -24),
          new THREE.Vector3(-3, -1.6, -20),
          new THREE.Vector3(-1, -1.3, -17),
          new THREE.Vector3(0, -1.2, -15),
        ],
        speed: 0.30,
        progress: 0.8,
        waitTimer: 2.0,
        active: true,
      },
      {
        points: [
          new THREE.Vector3(8, -1.8, -23),
          new THREE.Vector3(5, -1.5, -19),
          new THREE.Vector3(1, -1.3, -16),
          new THREE.Vector3(0, -1.2, -15),
        ],
        speed: 0.32,
        progress: 0.2,
        waitTimer: 1.8,
        active: true,
      },
      {
        points: [
          new THREE.Vector3(-12, -2.0, -10),
          new THREE.Vector3(-6, -1.7, -11),
          new THREE.Vector3(-2, -1.4, -13),
          new THREE.Vector3(0, -1.2, -15),
        ],
        speed: 0.40,
        progress: 0.6,
        waitTimer: 3.0,
        active: true,
      },
    ];
  }, []);

  const positions = useMemo(() => new Float32Array(streamCount * 3), [streamCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current || prefersReducedMotion) return;

    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    paths.forEach((stream, i) => {
      if (stream.waitTimer > 0) {
        stream.waitTimer -= delta;
        // Hide packet while waiting (move below ground)
        posArray[i * 3 + 1] = -50;
        return;
      }

      stream.progress += delta * stream.speed;

      if (stream.progress >= 1.0) {
        stream.progress = 0;
        stream.waitTimer = 2.0 + Math.random() * 3.5; // Restrained frequency
        posArray[i * 3 + 1] = -50;
        return;
      }

      // Calculate position along multi-segment path
      const totalSegments = stream.points.length - 1;
      const segmentProgress = stream.progress * totalSegments;
      const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
      const t = segmentProgress - currentSegment;

      const p0 = stream.points[currentSegment];
      const p1 = stream.points[currentSegment + 1];

      posArray[i * 3] = p0.x + (p1.x - p0.x) * t;
      posArray[i * 3 + 1] = p0.y + (p1.y - p0.y) * t + 0.04; // Sits slightly above nodes
      posArray[i * 3 + 2] = p0.z + (p1.z - p0.z) * t;
    });

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#5CC8FF"
        transparent={true}
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
