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
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
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

// Animated Sonar Ping Ring
function SonarPing({ position, color = '#38bdf8' }: { position: THREE.Vector3; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const t = (state.clock.elapsedTime * 1.5) % 2;
      const scale = 1 + t * 1.6;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.6 - t * 0.3);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} lookAt={() => position.clone().multiplyScalar(2)}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
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
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = isActiveSignal ? Math.sin(state.clock.elapsedTime * 6) * 0.4 : 0;
      const targetScale = isSelected ? 1.8 : (hovered ? 1.5 : (isActiveSignal ? 1.4 + pulse : 1));
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
    }
  });

  const markerColor = isSelected 
    ? '#f59e0b' 
    : (isActiveSignal 
        ? '#38bdf8' 
        : (data.count > 0 ? '#10b981' : '#38bdf8'));

  return (
    <group position={data.position}>
      {/* Sonar Ping Wave */}
      {(isSelected || hovered || data.count > 0 || isActiveSignal) && (
        <SonarPing 
          position={data.position} 
          color={isActiveSignal ? '#38bdf8' : markerColor} 
        />
      )}

      {/* Main Core Node */}
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>
      
      {/* Outer Halo */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={markerColor} transparent opacity={isSelected ? 0.45 : 0.25} />
      </mesh>

      {/* Persistent Badge */}
      <Html distanceFactor={10} zIndexRange={[100, 0]} center>
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase backdrop-blur-md border transition-all transform -translate-y-6 ${
            isSelected
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50 scale-110'
              : (data.count > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/90'
                  : 'bg-blue-950/70 text-blue-300 border-blue-500/30 hover:bg-blue-900/80')
          }`}
        >
          {data.jurisdiction} {data.count > 0 ? `(${data.count})` : ''}
        </div>
      </Html>

      {/* Detailed Card when Hovered or Selected */}
      {(hovered || isSelected) && (
        <Html distanceFactor={9} zIndexRange={[120, 0]} center>
          <div className="bg-zinc-950/95 border border-zinc-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl text-left w-64 transform -translate-y-24 pointer-events-auto">
            <div className="flex items-center justify-between mb-1.5 border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{data.flag || '🌐'}</span>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{data.name}</h4>
                  <span className="text-[10px] text-zinc-400 font-mono">[{data.jurisdiction}]</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${data.count > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {data.count > 0 ? 'ACTIVE RULES' : 'SURVEILLANCE'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-300 mt-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Authority:</span>
                <span className="text-zinc-300 font-medium truncate max-w-[140px] text-right" title={data.authority}>
                  {data.authority}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Rulesets:</span>
                <span className="text-white font-bold">{data.count} Framework{data.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Compliance Health:</span>
                <span className="text-emerald-400 font-bold">{data.complianceScore.toFixed(1)}%</span>
              </div>
            </div>

            {data.regulations && data.regulations.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Monitored In System:</div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                  {data.regulations.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 truncate max-w-[200px]">
                      {r}
                    </span>
                  ))}
                  {data.regulations.length > 3 && (
                    <span className="text-[9px] text-zinc-500 self-center">+{data.regulations.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectRegulations(data.jurisdiction);
                }}
                className="w-full text-center text-[10px] font-semibold py-1 px-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-1"
              >
                Inspect {data.jurisdiction} Regulations
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Arc with traveling pulse animation
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
    const elevatedMidPoint = midPoint.clone().normalize().multiplyScalar(2 + distance * 0.32);
    return new THREE.QuadraticBezierCurve3(start, elevatedMidPoint, end);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(60), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  
  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = isHighlighted 
        ? 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.3 
        : 0.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }

    if (particleRef.current) {
      const progress = (state.clock.elapsedTime * 0.4) % 1;
      const point = curve.getPoint(progress);
      particleRef.current.position.copy(point);
    }
  });

  return (
    <group>
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial 
          color={isHighlighted ? "#fbbf24" : "#60a5fa"} 
          transparent 
          opacity={0.25} 
          linewidth={isHighlighted ? 2 : 1} 
        />
      </line>

      {/* Traveling Data Signal Particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={isHighlighted ? "#f59e0b" : "#93c5fd"} />
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

  return (
    <group>
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
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
        <Html distanceFactor={9} zIndexRange={[100, 0]} center>
          <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest backdrop-blur-md pointer-events-none transform -translate-y-5">
            HQ BASE
          </div>
        </Html>
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-zinc-950/80 to-[#070709] pointer-events-none" />
      
      {/* Top Left: Title & Live Surveillance Status */}
      <div className="absolute top-5 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Global Jurisdiction Monitoring
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            LIVE SURVEILLANCE
          </span>
        </div>
        <p className="text-zinc-400 text-xs max-w-md leading-relaxed">
          Continuous worldwide regulatory surveillance network. Real-time telemetry, automated jurisdictional compliance tracking, and active control reach.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-blue-400">
            {markers.length} Global Nodes Active
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-800 text-emerald-400">
            {activeRegionsCount} Active Jurisdictions ({totalActiveRulesets} Rulesets)
          </span>
        </div>
      </div>

      {/* Top Right: Telemetry & Controls HUD */}
      <div className="absolute top-5 right-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-all flex items-center gap-1.5 ${
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
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>All Regulations</span>
        </button>
      </div>

      {/* Bottom Left: Node Legend HUD */}
      <div className="absolute bottom-5 left-6 z-10 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md text-[11px] text-zinc-400 flex flex-wrap items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span>HQ Base (SF)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Active Compliance Rules</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span>Surveillance Node</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Selected / Focused</span>
        </div>
      </div>

      {/* Bottom Right: Arcs Note */}
      <div className="absolute bottom-5 right-6 z-10 text-[11px] text-zinc-500 pointer-events-none">
        *Streaming arcs indicate encrypted continuous telemetry reach from HQ
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5.8], fov: 45 }} dpr={[1, 2]}>
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
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}
