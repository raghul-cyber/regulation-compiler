'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Waypoint {
  t: number; // scroll ratio (0 to 1)
  pos: [number, number, number];
  lookAt: [number, number, number];
}

const STORY_WAYPOINTS: Waypoint[] = [
  { t: 0.00, pos: [0, 0.85, 6.8],   lookAt: [0, 0, -15] },       // 01 Hero: Far perspective view
  { t: 0.16, pos: [0.3, 0.35, 4.8], lookAt: [0, -0.4, -13] },     // 02 Problem: Moving closer
  { t: 0.32, pos: [-0.4, -0.3, 3.2], lookAt: [0, -0.7, -11] },    // 03 Transformation: Entering node field
  { t: 0.50, pos: [0.4, -0.65, 1.9], lookAt: [0, -1.0, -9] },     // 04 How It Works: Through clusters
  { t: 0.68, pos: [0, 0.15, 0.9],   lookAt: [0, -0.2, -7] },      // 05 Compilation: Approaching core
  { t: 0.84, pos: [-0.2, 0.55, 3.8], lookAt: [0, 0, -12] },      // 06 Architecture & Security: Wider network
  { t: 1.00, pos: [0, 1.05, 7.2],   lookAt: [0, 0, -15] },       // 07 Final CTA: Pulls back calmly
];

export function CameraController({ 
  prefersReducedMotion,
  scrollY 
}: { 
  prefersReducedMotion: boolean;
  scrollY: number;
}) {
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const currentPos = useRef(new THREE.Vector3(0, 0.85, 6.8));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, -15));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Damped pointer coordinates in [-1, 1]
      mouse.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    // 1. Mouse parallax interpolation (max 1.2 degrees, smooth damping)
    const damping = Math.min(delta * 4.0, 0.15);
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * damping;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * damping;

    // 2. Compute normalized scroll ratio
    const docHeight = typeof document !== 'undefined' 
      ? Math.max(document.documentElement.scrollHeight - window.innerHeight, 1) 
      : 1;
    const ratio = Math.min(Math.max(scrollY / docHeight, 0), 1);

    // 3. Interpolate between waypoints along the scroll narrative
    let p0 = STORY_WAYPOINTS[0];
    let p1 = STORY_WAYPOINTS[1];

    for (let i = 0; i < STORY_WAYPOINTS.length - 1; i++) {
      if (ratio >= STORY_WAYPOINTS[i].t && ratio <= STORY_WAYPOINTS[i + 1].t) {
        p0 = STORY_WAYPOINTS[i];
        p1 = STORY_WAYPOINTS[i + 1];
        break;
      }
    }

    const segRatio = (ratio - p0.t) / (p1.t - p0.t || 1);
    // Smooth cubic easing for waypoint transition
    const smoothT = segRatio * segRatio * (3 - 2 * segRatio);

    const targetX = p0.pos[0] + (p1.pos[0] - p0.pos[0]) * smoothT + (prefersReducedMotion ? 0 : mouse.current.x * 0.45);
    const targetY = p0.pos[1] + (p1.pos[1] - p0.pos[1]) * smoothT + (prefersReducedMotion ? 0 : mouse.current.y * 0.30);
    const targetZ = p0.pos[2] + (p1.pos[2] - p0.pos[2]) * smoothT;

    const lookX = p0.lookAt[0] + (p1.lookAt[0] - p0.lookAt[0]) * smoothT + (prefersReducedMotion ? 0 : mouse.current.x * 0.20);
    const lookY = p0.lookAt[1] + (p1.lookAt[1] - p0.lookAt[1]) * smoothT;
    const lookZ = p0.lookAt[2] + (p1.lookAt[2] - p0.lookAt[2]) * smoothT;

    // Smooth camera tracking
    currentPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.08);
    currentLookAt.current.lerp(new THREE.Vector3(lookX, lookY, lookZ), 0.08);

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
}
