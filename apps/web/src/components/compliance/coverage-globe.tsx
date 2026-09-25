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
  Minimize2,
  X
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
          color="#4D8FCC" 
          wireframe={true} 
          transparent={true} 
          opacity={0.12} 
        />
      </Icosahedron>

      {/* Inner subtle core sphere */}
      <mesh>
        <sphereGeometry args={[1.96, 32, 32]} />
        <meshBasicMaterial color="#080A0E" transparent opacity={0.80} />
      </mesh>
    </group>
  );
}

// Animated Sonar Ping Ring
function SonarPing({ position, color = '#4D8FCC' }: { position: THREE.Vector3; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const t = (state.clock.elapsedTime * 1.5) % 2;
      const scale = 1 + t * 1.5;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.4 - t * 0.2);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} lookAt={() => position.clone().multiplyScalar(2)}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
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
  onClose,
  onInspectRegulations
}: { 
  data: MarkerData;
  isSelected: boolean;
  isActiveSignal?: boolean;
  onClick: () => void;
  onClose?: () => void;
  onInspectRegulations: (jurisdiction?: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isFrontFacing, setIsFrontFacing] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera, clock }) => {
    if (meshRef.current) {
      const pulse = isActiveSignal ? Math.sin(clock.elapsedTime * 6) * 0.4 : 0;
      const targetScale = isSelected ? 1.6 : (hovered ? 1.4 : (isActiveSignal ? 1.3 + pulse : 1));
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);

      // Only show 3D HTML tags when marker is facing towards camera (eliminates backface clumping)
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const normal = worldPos.clone().sub(new THREE.Vector3(0, -0.15, 0)).normalize();
      const camDir = camera.position.clone().sub(worldPos).normalize();
      setIsFrontFacing(normal.dot(camDir) > 0.12);
    }
  });

  const markerColor = isSelected 
    ? '#C9B88A' 
    : (isActiveSignal 
        ? '#4D8FCC' 
        : (data.count > 0 ? '#10B981' : '#6B8BA4'));

  return (
    <group position={data.position}>
      {/* Sonar Ping Wave */}
      {(isSelected || hovered || data.count > 0 || isActiveSignal) && (
        <SonarPing 
          position={data.position} 
          color={isActiveSignal ? '#4D8FCC' : markerColor} 
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
        <meshBasicMaterial color={markerColor} transparent opacity={isSelected ? 0.35 : 0.18} />
      </mesh>

      {/* Persistent Sleek Telemetry Badge (Only visible when facing user!) */}
      {isFrontFacing && (
        <Html distanceFactor={4.8} zIndexRange={[18, 0]} center>
          <div 
            onClick={onClick}
            className={`font-sans select-none whitespace-nowrap cursor-pointer px-1.5 py-0.5 rounded-[4px] text-[9px] font-semibold tracking-wide border transition-all duration-200 transform -translate-y-4 flex items-center gap-1 shadow-lg ${
              isSelected
                ? 'bg-[#080A0E]/95 text-[#C9B88A] border-[#C9B88A]/60 ring-1 ring-[#C9B88A]/40 scale-105'
                : (isActiveSignal
                    ? 'bg-[#080A0E]/95 text-[#93C5FD] border-[#4D8FCC]/60'
                    : (data.count > 0
                        ? 'bg-[#080A0E]/95 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                        : 'bg-[#080A0E]/95 text-[#94A3B8] border-white/[0.08] hover:border-white/[0.16] hover:text-[#F4F6F8]'))
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#C9B88A]' : (data.count > 0 ? 'bg-emerald-400' : 'bg-[#4D8FCC]')}`} />
            <span>{data.jurisdiction}</span>
            {data.count > 0 && (
              <span className="ml-0.5 px-1 rounded-[2px] bg-emerald-500/15 text-emerald-400 text-[8px] font-bold">
                {data.count}
              </span>
            )}
          </div>
        </Html>
      )}

      {/* Detailed Card when Hovered or Selected */}
      {(hovered || isSelected) && isFrontFacing && (
        <Html distanceFactor={4.5} zIndexRange={[45, 0]} center>
          <div 
            className={`font-sans bg-[#08090E]/98 border border-zinc-700/90 p-2.5 rounded-xl shadow-2xl backdrop-blur-xl text-left w-48 pointer-events-auto select-none transition-all duration-200 ${
              data.position.y > 0.25 
                ? 'transform translate-y-5' 
                : (data.position.y < -0.25 ? 'transform -translate-y-16' : 'transform -translate-y-10')
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-zinc-800 pb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">{data.flag || '🌐'}</span>
                <div className="truncate">
                  <h4 className="text-[11px] font-bold text-white leading-tight truncate">{data.name}</h4>
                  <span className="text-[9px] text-zinc-400 font-mono">[{data.jurisdiction}]</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  data.count > 0 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {data.count > 0 ? `${data.count} RULES` : 'ACTIVE'}
                </span>
                {isSelected && onClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Close Details"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 text-[10px] text-zinc-300">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px]">Authority:</span>
                <span className="text-zinc-300 font-medium truncate max-w-[100px] text-right" title={data.authority}>
                  {data.authority}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px]">Rulesets:</span>
                <span className="text-white font-bold">{data.count} Framework{data.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[9px]">Health:</span>
                <span className="text-emerald-400 font-bold">{data.complianceScore.toFixed(0)}%</span>
              </div>
            </div>

            {data.regulations && data.regulations.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80">
                <div className="text-[9px] text-zinc-500 uppercase font-semibold mb-0.5">Monitored:</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] px-1.5 py-0.5 bg-zinc-900/90 border border-zinc-800 rounded text-zinc-300 truncate" title={data.regulations[0]}>
                    {data.regulations[0]}
                  </span>
                  {data.regulations.length > 1 && (
                    <span className="text-[8px] text-zinc-500">
                      +{data.regulations.length - 1} more regulation{data.regulations.length > 2 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-white/[0.08]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectRegulations(data.jurisdiction);
                }}
                className="w-full text-center text-[9px] font-semibold py-1 px-2 rounded-[4px] bg-[#4D8FCC] hover:bg-[#3B72A8] text-white transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>Inspect {data.jurisdiction}</span>
                <ExternalLink className="w-2.5 h-2.5" />
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
    const elevatedMidPoint = midPoint.clone().normalize().multiplyScalar(2 + distance * 0.28);
    return new THREE.QuadraticBezierCurve3(start, elevatedMidPoint, end);
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(60), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  
  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = isHighlighted 
        ? 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.2 
        : 0.12 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
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
          color={isHighlighted ? "#C9B88A" : "#6B8BA4"} 
          transparent 
          opacity={0.20} 
          linewidth={isHighlighted ? 2 : 1} 
        />
      </line>

      {/* Traveling Data Signal Particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={isHighlighted ? "#C9B88A" : "#93C5FD"} />
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
  const hqRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (hqRef.current) {
      const worldPos = new THREE.Vector3();
      hqRef.current.getWorldPosition(worldPos);
      const normal = worldPos.clone().sub(new THREE.Vector3(0, -0.15, 0)).normalize();
      const camDir = camera.position.clone().sub(worldPos).normalize();
      setIsHqFrontFacing(normal.dot(camDir) > 0.12);
    }
  });

  return (
    <group position={[0, -0.15, 0]} scale={0.65}>
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
              onClick={() => onSelectJurisdiction(isSelected ? '' : marker.jurisdiction)}
              onClose={() => onSelectJurisdiction('')}
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
      <group ref={hqRef} position={homePosition}>
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.25} />
        </mesh>
        {isHqFrontFacing && (
          <Html distanceFactor={7} zIndexRange={[15, 0]} center>
            <div className="font-sans whitespace-nowrap bg-emerald-950/85 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-[8px] font-semibold tracking-wider backdrop-blur-md pointer-events-none transform -translate-y-4 flex items-center gap-1 shadow-md shadow-emerald-950/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SF · HQ</span>
            </div>
          </Html>
        )}
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
    (regulations || []).forEach(reg => {
      if (!reg) return;
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
    if (jurisdictionsData && Array.isArray(jurisdictionsData) && jurisdictionsData.length > 0) {
      return jurisdictionsData.filter(Boolean).map(jData => {
        const code = (jData.code || '').toUpperCase();
        const coords = JURISDICTION_COORDS[code] || jData.coordinates || [0, 0];
        const dbRegs = regCountsByJurisdiction[code] || { count: 0, names: [] };
        
        // Use greater of backend count or computed regulations count
        const totalCount = Math.max(jData.ruleset_count || 0, dbRegs.count);
        const combinedNames = Array.from(new Set([...(jData.regulations || []), ...(dbRegs.names || [])]));

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
      
      {/* Top Header Overlay: Title, Status, and Controls */}
      <div className="absolute top-4 left-4 right-4 sm:top-5 sm:left-6 sm:right-6 z-30 flex flex-col md:flex-row md:items-start justify-between gap-3 pointer-events-none">
        {/* Left: Title & Live Surveillance Status */}
        <div className="pointer-events-none max-w-md">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Global Jurisdiction Monitoring
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              LIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed hidden sm:block">
            Continuous worldwide regulatory surveillance network. Real-time telemetry, automated jurisdictional compliance tracking.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-blue-400 shadow-sm">
              {markers.length} Global Nodes Active
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-emerald-400 shadow-sm">
              {activeRegionsCount} Active Jurisdictions ({totalActiveRulesets} Rulesets)
            </span>
          </div>
        </div>

        {/* Right: Telemetry & Controls HUD */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0 self-start md:self-auto">
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
      </div>

      {/* Bottom Overlay: Node Legend & Arcs Note (Both in single line separately without overlapping) */}
      <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Node Legend HUD (Single line, strictly no wrapping) */}
        <div className="px-3 py-1.5 rounded-lg bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md text-[10px] text-zinc-400 flex items-center flex-nowrap whitespace-nowrap gap-3 shadow-md shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 shrink-0" />
            <span>HQ Base (SF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Active Rules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            <span>Surveillance Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Selected</span>
          </div>
        </div>

        {/* Arcs Note (Single line, strictly no wrapping) */}
        <div className="text-[10px] text-zinc-500 whitespace-nowrap text-right shrink-0 drop-shadow">
          *Streaming arcs indicate encrypted continuous telemetry reach from HQ
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, -0.15, 5.9], fov: 45 }} 
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
        <pointLight position={[-10, -10, -10]} intensity={0.35} color="#3B72A8" />
        
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
          enableZoom={false}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={5.9}
          maxDistance={5.9}
          autoRotate={autoRotate}
          autoRotateSpeed={0.75}
          target={[0, -0.15, 0]}
        />
      </Canvas>
    </div>
  );
}
