'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Static Jurisdiction -> Coordinates (Lat, Lng) Mapping
const JURISDICTION_COORDS: Record<string, [number, number]> = {
  'EU': [48.8566, 2.3522],      // Paris
  'US': [38.8951, -77.0364],    // Washington DC
  'UK': [51.5074, -0.1278],     // London
  'CA': [45.4215, -75.6972],    // Ottawa
  'AU': [-35.2809, 149.1300],   // Canberra
  'JP': [35.6762, 139.6503],    // Tokyo
  'SG': [1.3521, 103.8198],     // Singapore
  'GLOBAL': [46.2044, 6.1432],  // Geneva (UN HQ)
};

const HOME_COORD: [number, number] = [37.7749, -122.4194]; // San Francisco as Home Base

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// ----------------------------------------------------
// COMPONENTS
// ----------------------------------------------------

function GlobeGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subtle auto-rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[2, 4]} rotation={[0, 0, 0]}>
      <meshBasicMaterial 
        color="#3b82f6" 
        wireframe={true} 
        transparent={true} 
        opacity={0.15} 
      />
    </Icosahedron>
  );
}

function Marker({ 
  position, 
  jurisdiction, 
  count,
  onClick 
}: { 
  position: THREE.Vector3; 
  jurisdiction: string; 
  count: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse scale when hovered
      const targetScale = hovered ? 1.5 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#60a5fa" : "#3b82f6"} />
      </mesh>
      
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>

      {hovered && (
        <Html distanceFactor={10} zIndexRange={[100, 0]} center>
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-lg shadow-xl backdrop-blur-sm whitespace-nowrap text-sm pointer-events-none transform -translate-y-full mt-[-10px]">
            <div className="font-bold text-white mb-1">{jurisdiction}</div>
            <div className="text-zinc-400">{count} Active Regulation{count !== 1 ? 's' : ''}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function AnimatedArc({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const lineRef = useRef<THREE.Line>(null);
  
  const curve = useMemo(() => {
    // Determine a control point slightly elevated from the midpoint to create an arc
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    const elevatedMidPoint = midPoint.clone().normalize().multiplyScalar(2 + distance * 0.3); // Raise above globe surface
    
    return new THREE.QuadraticBezierCurve3(start, elevatedMidPoint, end);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  
  // Animate the line drawing / pulsing
  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    // @ts-ignore: R3F and SVG intrinsic elements collision
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#60a5fa" transparent opacity={0.3} linewidth={1} />
    </line>
  );
}

function GlobeScene({ regulations }: { regulations: any[] }) {
  const router = useRouter();
  // Aggregate regulations by jurisdiction
  const jurisdictionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    regulations.forEach(reg => {
      const j = reg.jurisdiction || 'Unknown';
      counts[j] = (counts[j] || 0) + 1;
    });
    return counts;
  }, [regulations]);

  // Generate markers based on aggregated data
  const markers = useMemo(() => {
    return Object.entries(jurisdictionCounts).map(([jurisdiction, count]) => {
      const coords = JURISDICTION_COORDS[jurisdiction.toUpperCase()];
      if (!coords) return null; // Skip if we don't have static coords
      
      return {
        jurisdiction,
        count,
        position: latLongToVector3(coords[0], coords[1], 2), // Radius 2
      };
    }).filter(Boolean) as { jurisdiction: string, count: number, position: THREE.Vector3 }[];
  }, [jurisdictionCounts]);

  const homePosition = useMemo(() => latLongToVector3(HOME_COORD[0], HOME_COORD[1], 2), []);

  return (
    <group>
      <GlobeGeometry />
      
      {markers.map((marker, idx) => (
        <group key={idx}>
          <Marker 
            position={marker.position} 
            jurisdiction={marker.jurisdiction} 
            count={marker.count}
            onClick={() => router.push(`/regulations`)}
          />
          {/* Deliberate stylistic representation of monitoring reach */}
          <AnimatedArc start={marker.position} end={homePosition} />
        </group>
      ))}

      {/* Home Base Marker */}
      <group position={homePosition}>
         <mesh>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <Html distanceFactor={10} zIndexRange={[100, 0]} center>
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm pointer-events-none transform -translate-y-full mt-[-8px]">
            HQ
          </div>
        </Html>
      </group>
    </group>
  );
}

export function CoverageGlobe({ regulations }: { regulations: any[] }) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="w-full h-full min-h-[600px] relative rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-xl font-bold text-white mb-2">Global Monitoring</h3>
        <p className="text-zinc-400 text-sm max-w-sm">
          Interactive map visualizing active compliance jurisdictions and monitoring reach. 
          <br/>
          <span className="text-blue-400 mt-2 block">Monitoring {Object.keys(regulations.reduce((acc, r) => ({...acc, [r.jurisdiction]: true}), {})).length} Jurisdictions</span>
        </p>
      </div>

      <div className="absolute bottom-6 right-6 z-10 text-xs text-zinc-500 pointer-events-none">
        *Arcs represent stylistic monitoring reach from HQ
      </div>

      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {!prefersReducedMotion ? (
          <GlobeScene regulations={regulations} />
        ) : (
          <GlobeGeometry />
        )}
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
