'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NodeData {
  x: number;
  y: number;
  z: number;
  baseScale: number;
  clusterId: number;
  baseIntensity: number;
  currentIntensity: number;
  targetIntensity: number;
  activationTimer: number;
}

export function RegulatoryNodes({ 
  nodeCount = 380,
  prefersReducedMotion,
  onNodePositionsReady,
}: { 
  nodeCount?: number;
  prefersReducedMotion: boolean;
  onNodePositionsReady?: (nodes: { x: number; y: number; z: number; id: number }[]) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // Base palette
  const dimColor = useMemo(() => new THREE.Color('#2D718F').multiplyScalar(0.4), []);
  const activeColor = useMemo(() => new THREE.Color('#5CC8FF'), []);
  const validatedColor = useMemo(() => new THREE.Color('#67D6A0'), []);

  // Generate clustered regulatory node distributions
  const nodes = useMemo<NodeData[]>(() => {
    const list: NodeData[] = [];
    const clusters = [
      { cx: -8, cz: -14, radius: 4.5 },  // EU AI Act cluster
      { cx: 7, cz: -12, radius: 4.0 },   // DORA cluster
      { cx: -4, cz: -22, radius: 5.5 },  // GDPR & Privacy cluster
      { cx: 9, cz: -24, radius: 5.0 },   // SEC Cyber cluster
      { cx: 0, cz: -16, radius: 3.5 },   // AST Core cluster
    ];

    for (let i = 0; i < nodeCount; i++) {
      let x = 0, y = 0, z = 0;
      const isClustered = Math.random() < 0.65;
      const clusterIdx = Math.floor(Math.random() * clusters.length);

      if (isClustered) {
        const c = clusters[clusterIdx];
        const r = Math.pow(Math.random(), 0.6) * c.radius;
        const theta = Math.random() * Math.PI * 2;
        x = c.cx + Math.cos(theta) * r;
        z = c.cz + Math.sin(theta) * r;
        y = -1.9 + (Math.random() - 0.5) * 1.8;
      } else {
        x = (Math.random() - 0.5) * 36;
        z = -40 + Math.random() * 42;
        y = -2.1 + Math.random() * 2.5;
      }

      const baseIntensity = 0.25 + Math.random() * 0.35;

      list.push({
        x,
        y,
        z,
        baseScale: 0.65 + Math.random() * 0.7,
        clusterId: clusterIdx,
        baseIntensity,
        currentIntensity: baseIntensity,
        targetIntensity: baseIntensity,
        activationTimer: Math.random() * 6.0,
      });
    }
    return list;
  }, [nodeCount]);

  useEffect(() => {
    if (onNodePositionsReady) {
      onNodePositionsReady(nodes.map((n, i) => ({ x: n.x, y: n.y, z: n.z, id: i })));
    }
  }, [nodes, onNodePositionsReady]);

  // Initialize instances
  useEffect(() => {
    if (!meshRef.current) return;
    nodes.forEach((node, i) => {
      dummy.position.set(node.x, node.y, node.z);
      dummy.scale.setScalar(node.baseScale * 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      color.copy(dimColor).multiplyScalar(node.baseIntensity);
      meshRef.current!.setColorAt(i, color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [nodes, dummy, color, dimColor]);

  useFrame((_, delta) => {
    if (!meshRef.current || prefersReducedMotion) return;

    let colorsUpdated = false;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.activationTimer -= delta;

      // Occasional smooth activation trigger
      if (node.activationTimer <= 0) {
        // Toggle activation pulse
        if (node.targetIntensity > node.baseIntensity) {
          node.targetIntensity = node.baseIntensity;
          node.activationTimer = 3.5 + Math.random() * 6.0;
        } else {
          node.targetIntensity = 1.0 + Math.random() * 0.5;
          node.activationTimer = 0.8 + Math.random() * 0.6; // Activation duration 800-1400ms
        }
      }

      // Smooth easing towards target intensity
      const diff = node.targetIntensity - node.currentIntensity;
      if (Math.abs(diff) > 0.01) {
        node.currentIntensity += diff * delta * 3.5;
        colorsUpdated = true;

        // Choose highlight color (validation green for some, technical blue for others)
        const isValidationState = node.clusterId === 4 && node.currentIntensity > 0.9;
        const targetColor = isValidationState ? validatedColor : activeColor;
        
        const alpha = Math.min(Math.max((node.currentIntensity - node.baseIntensity) / 0.8, 0), 1);
        color.lerpColors(dimColor, targetColor, alpha).multiplyScalar(node.currentIntensity);

        meshRef.current.setColorAt(i, color);

        // Subtle scale pulse
        const pulseScale = node.baseScale * (1.0 + alpha * 0.35) * 0.05;
        dummy.position.set(node.x, node.y, node.z);
        dummy.scale.setScalar(pulseScale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (colorsUpdated) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodeCount]}
      frustumCulled={false}
    >
      {/* Octahedron faceted geometry: technical, sharp, non-generic */}
      <octahedronGeometry args={[0.9, 0]} />
      <meshBasicMaterial 
        toneMapped={false}
        transparent={true}
        opacity={0.88}
      />
    </instancedMesh>
  );
}
