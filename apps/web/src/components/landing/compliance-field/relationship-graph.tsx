'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NodePos {
  x: number;
  y: number;
  z: number;
  id: number;
}

export function RelationshipGraph({
  nodes,
  prefersReducedMotion,
}: {
  nodes?: NodePos[];
  prefersReducedMotion: boolean;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Compute sparse, structured graph edges
  const { positions, lineCount } = useMemo(() => {
    if (!nodes || nodes.length < 2) {
      // Default fallback sparse structure
      const fallbackNodes = [
        [-8, -1.8, -14], [-7, -1.6, -13], [-9, -1.9, -15], [-6.5, -1.5, -14.5],
        [7, -1.8, -12], [8, -1.7, -11.5], [6, -1.9, -13], [7.5, -1.5, -12.8],
        [-4, -1.8, -22], [-3, -1.7, -21], [-5, -1.9, -23], [-4.2, -1.6, -21.5],
        [0, -1.5, -16], [1, -1.4, -15.5], [-1, -1.6, -16.8], [0, -1.2, -15]
      ];
      const pos: number[] = [];
      for (let i = 0; i < fallbackNodes.length - 1; i += 2) {
        pos.push(...fallbackNodes[i], ...fallbackNodes[i + 1]);
      }
      return { positions: new Float32Array(pos), lineCount: pos.length / 6 };
    }

    const pos: number[] = [];
    const maxConnectionsPerNode = 2; // Strict limit to keep it sparse, never a spider web
    const maxDist = 3.8;
    const connectionCounts = new Uint8Array(nodes.length);

    // Prioritize connecting nearby nodes within clustered sectors
    for (let i = 0; i < nodes.length; i++) {
      if (connectionCounts[i] >= maxConnectionsPerNode) continue;
      const n1 = nodes[i];

      for (let j = i + 1; j < nodes.length; j++) {
        if (connectionCounts[j] >= maxConnectionsPerNode) continue;
        const n2 = nodes[j];

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < maxDist * maxDist) {
          pos.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
          connectionCounts[i]++;
          connectionCounts[j]++;
          if (connectionCounts[i] >= maxConnectionsPerNode) break;
        }
      }
    }

    return { positions: new Float32Array(pos), lineCount: pos.length / 6 };
  }, [nodes]);

  useFrame((state) => {
    if (materialRef.current && !prefersReducedMotion) {
      // Subtle ambient breathing in line opacity (0.18 - 0.32)
      const t = state.clock.elapsedTime;
      const pulse = Math.sin(t * 0.8) * 0.07 + 0.25;
      materialRef.current.opacity = pulse;
    }
  });

  if (lineCount === 0) return null;

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={materialRef}
        color="#2D718F"
        transparent={true}
        opacity={0.25}
        depthWrite={false}
      />
    </lineSegments>
  );
}
