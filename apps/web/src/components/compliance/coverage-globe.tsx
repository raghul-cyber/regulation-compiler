'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  ShieldCheck, 
  ExternalLink, 
  Radio, 
  Compass, 
  Layers, 
  Activity,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Static Jurisdiction -> Coordinates (Lat, Lng) Mapping
export const JURISDICTION_COORDS: Record<string, [number, number]> = {
  'EU': [48.8566, 2.3522],      // Brussels / Paris (European Union)
  'US': [38.8951, -77.0364],    // Washington DC (United States)
  'UK': [51.5074, -0.1278],     // London (United Kingdom)
  'SG': [1.3521, 103.8198],     // Singapore (APAC Hub)
  'CA': [45.4215, -75.6972],    // Ottawa (Canada)
  'JP': [35.6762, 139.6503],    // Tokyo (Japan)
  'AU': [-35.2809, 149.1300],   // Sydney / Canberra (Australia)
  'CH': [46.9480, 7.4474],      // Zurich / Bern (Switzerland)
  'GLOBAL': [46.2044, 6.1432],  // Geneva (International Standards / UN)
};

const HOME_COORD: [number, number] = [37.7749, -122.4194]; // San Francisco HQ

export function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// ----------------------------------------------------
// 3D SCENE COMPONENTS
// ----------------------------------------------------

function GlobeWireframe() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.02;
    }
  });

  return (
    <group>
      {/* Outer skeletal grid */}
      <Icosahedron ref={meshRef} args={[2, 4]} rotation={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#2563eb" 
          wireframe={true} 
          transparent={true} 
          opacity={0.18} 
        />
      </Icosahedron>

      {/* Inner subtle glow sphere */}
      <mesh>
        <sphereGeometry args={[1.96, 32, 32]} />
        <meshBasicMaterial color="#0b132b" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// Elegant subtle pinpoint node wave (calm, non-distracting)
function SubtleGlowRing({ position, color = '#38bdf8' }: { position: THREE.Vector3; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const t = (state.clock.elapsedTime * 0.8) % 2;
      const scale = 1 + t * 0.8;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.35 - t * 0.18);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} lookAt={() => position.clone().multiplyScalar(2)}>
        <ringGeometry args={[0.045, 0.058, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface MarkerData {
  jurisdiction: string;
  name: string;
  authority: string;
  count: number;
  complianceScore: number;
  regulations: string[];
  status: string;
  position: THREE.Vector3;
  flag?: string;
}

function JurisdictionMarker({ 
  data,
  isSelected,
  isActiveSignal = false,
  onClick,
  onInspectRegulations
}: { 
  data: MarkerData;
  isSelected: boolean;
  isActiveSignal?: boolean;
  onClick: () => void;
  onInspectRegulations: (jurisdiction?: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isFrontFacing, setIsFrontFacing] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera, clock }) => {
    if (meshRef.current) {
      const pulse = isActiveSignal ? Math.sin(clock.elapsedTime * 4) * 0.2 : 0;
      const targetScale = isSelected ? 1.5 : (hovered ? 1.35 : (isActiveSignal ? 1.2 + pulse : 1));
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
    // Only show tooltip when node faces towards camera (eliminates backface clumping)
    const normal = data.position.clone().normalize();
    const camDir = camera.position.clone().sub(data.position).normalize();
    setIsFrontFacing(normal.dot(camDir) > 0.15);
  });

  const markerColor = isSelected 
    ? '#f59e0b' 
    : (isActiveSignal 
        ? '#38bdf8' 
        : (data.count > 0 ? '#10b981' : '#60a5fa'));

  return (
    <group position={data.position}>
      {/* Subtle pulse wave on active / selected */}
      {(isSelected || isActiveSignal) && (
        <SubtleGlowRing 
          position={data.position} 
          color={isActiveSignal ? '#38bdf8' : markerColor} 
        />
      )}

      {/* Main Core Pinpoint Node */}
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>
      
      {/* Outer Halo */}
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={markerColor} transparent opacity={isSelected ? 0.35 : (hovered ? 0.25 : 0.15)} />
      </mesh>

      {/* Minimal, Sleek Tooltip — Only visible on deliberate hover or selection */}
      {(hovered || isSelected) && isFrontFacing && (
        <Html distanceFactor={11} zIndexRange={[30, 0]} center>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="font-sans bg-zinc-950/95 border border-zinc-700/80 py-2.5 px-3 rounded-xl shadow-2xl backdrop-blur-xl text-left w-52 transform -translate-y-16 pointer-events-auto select-none transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">{data.flag || '🌐'}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-tight truncate leading-tight">{data.name}</h4>
                  <span className="text-[10px] text-zinc-400 font-mono">[{data.jurisdiction}]</span>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${data.count > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                {data.count > 0 ? `${data.count} RULES` : 'ACTIVE'}
              </span>
            </div>

            <div className="mt-1.5 space-y-1 text-[10px] text-zinc-400">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Authority:</span>
                <span className="text-zinc-300 font-medium truncate max-w-[110px]" title={data.authority}>
                  {data.authority}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Compliance:</span>
                <span className="text-emerald-400 font-bold font-mono">{data.complianceScore.toFixed(1)}%</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectRegulations(data.jurisdiction);
              }}
              className="mt-2 w-full text-center text-[10px] font-medium py-1 px-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Inspect {data.jurisdiction} Rules</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

// Elegant, anti-aliased quadratic bezier streaming arc with calm traveling photon
function StreamingArc({ 
  start, 
  end, 
  isHighlighted = false 
}: { 
  start: THREE.Vector3; 
  end: THREE.Vector3; 
  isHighlighted?: boolean;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  
  const curve = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    const elevatedMidPoint = midPoint.clone().normalize().multiplyScalar(2 + distance * 0.28);
    return new THREE.QuadraticBezierCurve3(start, elevatedMidPoint, end);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(50), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  
  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = isHighlighted 
        ? 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.15 
        : 0.12;
    }

    if (particleRef.current) {
      const progress = (state.clock.elapsedTime * 0.25) % 1;
      const point = curve.getPoint(progress);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial 
          color={isHighlighted ? "#fbbf24" : "#3b82f6"} 
          transparent 
          opacity={0.15} 
          linewidth={1} 
        />
      </line>

      {/* Traveling Data Signal Photon */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color={isHighlighted ? "#fbbf24" : "#60a5fa"} />
      </mesh>
    </group>
  );
}

function GlobeScene({ 
  markers,
  selectedJurisdiction,
  activeSignalJurisdiction,
  onSelectJurisdiction,
  onInspectRegulations
}: { 
  markers: MarkerData[];
  selectedJurisdiction: string | null;
  activeSignalJurisdiction?: string | null;
  onSelectJurisdiction: (code: string) => void;
  onInspectRegulations: (jurisdiction?: string) => void;
}) {
  const homePosition = useMemo(() => latLongToVector3(HOME_COORD[0], HOME_COORD[1], 2), []);
  const [isHqFrontFacing, setIsHqFrontFacing] = useState(true);

  useFrame(({ camera }) => {
    const normal = homePosition.clone().normalize();
    const camDir = camera.position.clone().sub(homePosition).normalize();
    setIsHqFrontFacing(normal.dot(camDir) > 0.12);
  });

  return (
    <group position={[0, -0.25, 0]}>
      <GlobeWireframe />
      
      {/* All Monitored Jurisdiction Markers */}
      {markers.map((marker) => {
        const isSelected = selectedJurisdiction?.toUpperCase() === marker.jurisdiction.toUpperCase();
        const isActiveSignal = activeSignalJurisdiction?.toUpperCase() === marker.jurisdiction.toUpperCase();
        return (
          <group key={marker.jurisdiction}>
            <JurisdictionMarker 
              data={marker}
              isSelected={isSelected}
              isActiveSignal={isActiveSignal}
              onClick={() => onSelectJurisdiction(marker.jurisdiction)}
              onInspectRegulations={onInspectRegulations}
            />
            {/* Real-time Streaming Arc connecting HQ to this Jurisdiction */}
            <StreamingArc 
              start={marker.position} 
              end={homePosition} 
              isHighlighted={isSelected || isActiveSignal}
            />
          </group>
        );
      })}

      {/* Central HQ Base (San Francisco) */}
      <group position={homePosition}>
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.25} />
        </mesh>
        {/* Clean HQ pinpoint marker */}
        <mesh>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// MAIN EXPORTED COMPONENT
// ----------------------------------------------------

interface CoverageGlobeProps {
  regulations?: any[];
  jurisdictionsData?: any[];
  selectedJurisdiction?: string | null;
  activeSignalJurisdiction?: string | null;
  onSelectJurisdiction?: (code: string) => void;
}

export function CoverageGlobe({ 
  regulations = [],
  jurisdictionsData = [],
  selectedJurisdiction = null,
  activeSignalJurisdiction = null,
  onSelectJurisdiction
}: CoverageGlobeProps) {
  const router = useRouter();
  const [autoRotate, setAutoRotate] = useState(true);

  // Aggregate regulations count per jurisdiction
  const regCountsByJurisdiction = useMemo(() => {
    const counts: Record<string, { count: number; names: string[] }> = {};
    regulations.forEach(reg => {
      const j = (reg.jurisdiction || 'GLOBAL').trim().toUpperCase();
      if (!counts[j]) {
        counts[j] = { count: 0, names: [] };
      }
      counts[j].count += 1;
      if (reg.name && !counts[j].names.includes(reg.name)) {
        counts[j].names.push(reg.name);
      }
    });
    return counts;
  }, [regulations]);

  // Construct comprehensive worldwide markers
  const markers = useMemo<MarkerData[]>(() => {
    // If backend provided rich jurisdiction metadata, combine it with regulations
    if (jurisdictionsData && jurisdictionsData.length > 0) {
      return jurisdictionsData.map(jData => {
        const code = jData.code.toUpperCase();
        const coords = JURISDICTION_COORDS[code] || jData.coordinates || [0, 0];
        const dbRegs = regCountsByJurisdiction[code] || { count: 0, names: [] };
        
        // Use greater of backend count or computed regulations count
        const totalCount = Math.max(jData.ruleset_count || 0, dbRegs.count);
        const combinedNames = Array.from(new Set([...(jData.regulations || []), ...dbRegs.names]));

        return {
          jurisdiction: code,
          name: jData.name || code,
          authority: jData.authority || 'Regulatory Authority',
          count: totalCount,
          complianceScore: jData.compliance_score || 92.5,
          regulations: combinedNames,
          status: jData.status || (totalCount > 0 ? 'active' : 'surveillance'),
          position: latLongToVector3(coords[0], coords[1], 2),
          flag: jData.flag
        };
      });
    }

    // Fallback: derive from JURISDICTION_COORDS & regulations
    return Object.entries(JURISDICTION_COORDS).map(([code, coords]) => {
      const regData = regCountsByJurisdiction[code] || { count: 0, names: [] };
      return {
        jurisdiction: code,
        name: code === 'EU' ? 'European Union' : code === 'US' ? 'United States' : code === 'UK' ? 'United Kingdom' : code === 'SG' ? 'Singapore' : code === 'CA' ? 'Canada' : 'International Standards',
        authority: code === 'EU' ? 'European Commission / Eur-Lex' : code === 'US' ? 'SEC / NIST / Federal Register' : 'National Regulatory Body',
        count: regData.count,
        complianceScore: 94.0,
        regulations: regData.names,
        status: regData.count > 0 ? 'active' : 'surveillance',
        position: latLongToVector3(coords[0], coords[1], 2),
        flag: code === 'EU' ? '🇪🇺' : code === 'US' ? '🇺🇸' : code === 'UK' ? '🇬🇧' : code === 'SG' ? '🇸🇬' : code === 'CA' ? '🇨🇦' : '🌐'
      };
    });
  }, [jurisdictionsData, regCountsByJurisdiction]);

  const totalActiveRulesets = useMemo(() => {
    return markers.reduce((acc, m) => acc + m.count, 0);
  }, [markers]);

  const activeRegionsCount = useMemo(() => {
    return markers.filter(m => m.count > 0).length;
  }, [markers]);

  const handleSelect = (code: string) => {
    if (onSelectJurisdiction) {
      onSelectJurisdiction(code);
    }
  };

  return (
    <div className="w-full h-full min-h-[580px] relative rounded-xl border border-zinc-800 bg-[#070709] overflow-hidden shadow-2xl">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950/80 to-[#070709] pointer-events-none" />
      
      {/* Top Left: Title & Live Surveillance Status */}
      <div className="absolute top-5 left-6 z-30 pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Global Jurisdiction Monitoring
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            LIVE SURVEILLANCE
          </span>
        </div>
        <p className="text-zinc-400 text-xs max-w-sm leading-relaxed">
          Continuous worldwide regulatory surveillance network. Real-time telemetry, automated jurisdictional compliance tracking.
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-blue-400 shadow-sm">
            {markers.length} Global Nodes Active
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-emerald-400 shadow-sm">
            {activeRegionsCount} Active Jurisdictions ({totalActiveRulesets} Rulesets)
          </span>
        </div>
      </div>

      {/* Top Right: Telemetry & Controls HUD */}
      <div className="absolute top-5 right-6 z-30 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm ${
            autoRotate
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          <Compass className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>{autoRotate ? 'Orbit On' : 'Orbit Paused'}</span>
        </button>

        <button
          onClick={() => router.push('/regulations')}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>All Regulations</span>
        </button>
      </div>

      {/* Bottom Left: Node Legend HUD */}
      <div className="absolute bottom-5 left-6 z-30 p-2 rounded-lg bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-md text-[11px] text-zinc-400 flex flex-wrap items-center gap-3.5 pointer-events-none shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span>HQ Base (SF)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active Rules</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Surveillance Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Selected</span>
        </div>
      </div>

      {/* Bottom Right: Arcs Note */}
      <div className="absolute bottom-5 right-6 z-30 text-[11px] text-zinc-500 pointer-events-none">
        *Streaming arcs indicate encrypted continuous telemetry reach from HQ
      </div>

      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, -0.2, 5.9], fov: 45 }} 
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
          }, false);
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#1d4ed8" />
        
        <GlobeScene 
          markers={markers}
          selectedJurisdiction={selectedJurisdiction}
          activeSignalJurisdiction={activeSignalJurisdiction}
          onSelectJurisdiction={handleSelect}
          onInspectRegulations={(code) => {
            if (code) {
              router.push(`/regulations?jurisdiction=${encodeURIComponent(code)}`);
            } else {
              router.push('/regulations');
            }
          }}
        />

        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={3.2}
          maxDistance={9.5}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          target={[0, -0.2, 0]}
        />
      </Canvas>
    </div>
  );
}
