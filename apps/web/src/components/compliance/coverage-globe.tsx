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
      {/* Outer skeletal grid in muted dusky sapphire */}
      <Icosahedron ref={meshRef} args={[2, 4]} rotation={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#344D63" 
          wireframe={true} 
          transparent={true} 
          opacity={0.16} 
        />
      </Icosahedron>

      {/* Inner subtle core sphere in deep obsidian */}
      <mesh>
        <sphereGeometry args={[1.96, 32, 32]} />
        <meshBasicMaterial color="#080706" transparent opacity={0.88} />
      </mesh>
    </group>
  );
}

// Animated Sonar Ping Ring
function SonarPing({ position, color = '#AD956C' }: { position: THREE.Vector3; color?: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const t = (state.clock.elapsedTime * 1.5) % 2;
      const scale = 1 + t * 1.5;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.35 - t * 0.18);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef} lookAt={() => position.clone().multiplyScalar(2)}>
        <ringGeometry args={[0.05, 0.07, 32]} />
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
    ? '#AD956C' 
    : (isActiveSignal 
        ? '#607D96' 
        : (data.count > 0 ? '#718A79' : '#58758C'));

  return (
    <group position={data.position}>
      {/* Sonar Ping Wave */}
      {(isSelected || hovered || data.count > 0 || isActiveSignal) && (
        <SonarPing 
          position={data.position} 
          color={isActiveSignal ? '#607D96' : markerColor} 
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
                ? 'bg-[#12161C]/95 text-[#BCA77B] border-[#BCA77B]/60 ring-1 ring-[#BCA77B]/40 scale-105'
                : (isActiveSignal
                    ? 'bg-[#12161C]/95 text-[#7299B4] border-[#4D78A0]/60'
                    : (data.count > 0
                        ? 'bg-[#12161C]/95 text-[#76937F] border-[#76937F]/30 hover:border-[#76937F]/60'
                        : 'bg-[#12161C]/95 text-[#969DA6] border-[#1D232B] hover:border-[#4A2830] hover:text-[#FAF9F5]'))
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#BCA77B]' : (data.count > 0 ? 'bg-[#76937F]' : 'bg-[#7299B4]')}`} />
            <span>{data.jurisdiction}</span>
            {data.count > 0 && (
              <span className="ml-0.5 px-1 rounded-[2px] bg-[#76937F]/15 text-[#76937F] text-[8px] font-bold">
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
            className={`font-sans bg-[#12161C]/98 border border-[#1D232B] p-2.5 rounded-xl shadow-2xl backdrop-blur-xl text-left w-48 pointer-events-auto select-none transition-all duration-200 ${
              data.position.y > 0.25 
                ? 'transform translate-y-5' 
                : (data.position.y < -0.25 ? 'transform -translate-y-16' : 'transform -translate-y-10')
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-[#1D232B] pb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm shrink-0">{data.flag || '🌐'}</span>
                <div className="truncate">
                  <h4 className="text-[11px] font-bold text-[#FAF9F5] leading-tight truncate">{data.name}</h4>
                  <span className="text-[9px] text-[#969DA6] font-mono">[{data.jurisdiction}]</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  data.count > 0 
                    ? 'bg-[#718A79]/20 text-[#718A79] border border-[#718A79]/30' 
                    : 'bg-[#607D96]/20 text-[#607D96] border border-[#607D96]/30'
                }`}>
                  {data.count > 0 ? `${data.count} RULES` : 'ACTIVE'}
                </span>
                {isSelected && onClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-0.5 rounded hover:bg-[#1B1815] text-[#8D8982] hover:text-[#F1EEE7] transition-colors cursor-pointer"
                    title="Close Details"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1 text-[10px] text-[#C9C4BA]">
              <div className="flex justify-between items-center">
                <span className="text-[#8D8982] text-[9px]">Authority:</span>
                <span className="text-[#C9C4BA] font-medium truncate max-w-[100px] text-right" title={data.authority}>
                  {data.authority}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8D8982] text-[9px]">Rulesets:</span>
                <span className="text-[#F7F4EC] font-bold">{data.count} Framework{data.count !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8D8982] text-[9px]">Health:</span>
                <span className="text-[#718A79] font-bold">{data.complianceScore.toFixed(0)}%</span>
              </div>
            </div>

            {data.regulations && data.regulations.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-[#211D19]">
                <div className="text-[9px] text-[#8D8982] uppercase font-semibold mb-0.5">Monitored:</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] px-1.5 py-0.5 bg-[#100E0D] border border-[#211D19] rounded text-[#C9C4BA] truncate" title={data.regulations[0]}>
                    {data.regulations[0]}
                  </span>
                  {data.regulations.length > 1 && (
                    <span className="text-[8px] text-[#8D8982]">
                      +{data.regulations.length - 1} more regulation{data.regulations.length > 2 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2 pt-1.5 border-t border-[#211D19]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectRegulations(data.jurisdiction);
                }}
                className="w-full text-center text-[9px] font-semibold py-1 px-2 rounded-[4px] bg-[#3F5C74] hover:bg-[#344D63] text-[#F1EEE7] transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
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
          color={isHighlighted ? "#AD956C" : "#344D63"} 
          transparent 
          opacity={isHighlighted ? 0.45 : 0.18} 
          linewidth={isHighlighted ? 2 : 1} 
        />
      </line>

      {/* Traveling Data Signal Particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={isHighlighted ? "#AD956C" : "#607D96"} />
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
          <meshBasicMaterial color="#718A79" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#718A79" transparent opacity={0.25} />
        </mesh>
        {isHqFrontFacing && (
          <Html distanceFactor={7} zIndexRange={[15, 0]} center>
            <div className="font-sans whitespace-nowrap bg-[#151311]/90 text-[#718A79] border border-[#718A79]/30 px-1.5 py-0.5 rounded-full text-[8px] font-semibold tracking-wider backdrop-blur-md pointer-events-none transform -translate-y-4 flex items-center gap-1 shadow-md shadow-black/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#718A79] animate-pulse" />
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
    <div className="w-full h-full min-h-[580px] relative rounded-xl border border-[#211D19] bg-[#0B0A09] overflow-hidden shadow-2xl">
      {/* Dynamic Background Glow - Subtle Dusky Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A1512]/40 via-[#100E0D]/80 to-[#080706] pointer-events-none" />
      
      {/* Top Header Overlay: Title, Status, and Controls */}
      <div className="absolute top-4 left-4 right-4 sm:top-5 sm:left-6 sm:right-6 z-30 flex flex-col md:flex-row md:items-start justify-between gap-3 pointer-events-none">
        {/* Left: Title & Live Surveillance Status */}
        <div className="pointer-events-none max-w-md">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base sm:text-lg font-bold text-[#F7F4EC] tracking-tight flex items-center gap-2">
              Global Jurisdiction Monitoring
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#718A79]/15 text-[#718A79] border border-[#718A79]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#76937F] animate-ping inline-block" />
              LIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-[#969DA6] text-xs leading-relaxed hidden sm:block">
            Continuous worldwide regulatory surveillance network. Real-time telemetry, automated jurisdictional compliance tracking.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#12161C] border border-[#1D232B] text-[#7299B4] shadow-sm">
              {markers.length} Global Nodes Active
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#12161C] border border-[#1D232B] text-[#76937F] shadow-sm">
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
                ? 'bg-[#4D78A0]/20 border-[#4D78A0]/40 text-[#FAF9F5] hover:bg-[#4D78A0]/30'
                : 'bg-[#12161C]/80 border-[#1D232B] text-[#969DA6] hover:text-[#FAF9F5]'
            }`}
            title="Toggle Auto Rotation"
          >
            <Compass className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Orbit On' : 'Orbit Paused'}</span>
          </button>

          <button
            onClick={() => router.push('/regulations')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#12161C]/80 hover:bg-[#171C23] border border-[#1D232B] text-[#C7CCD2] hover:text-[#FAF9F5] backdrop-blur-md transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-[#969DA6]" />
            <span>All Regulations</span>
          </button>
        </div>
      </div>

      {/* Bottom Overlay: Node Legend & Arcs Note */}
      <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-5 sm:right-5 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Node Legend HUD */}
        <div className="px-3 py-1.5 rounded-lg bg-[#12161C]/90 border border-[#1D232B] backdrop-blur-md text-[10px] text-[#969DA6] flex items-center flex-nowrap whitespace-nowrap gap-3 shadow-md shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#76937F] shadow-sm shadow-[#76937F]/50 shrink-0" />
            <span>HQ Base (SF)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#76937F] shrink-0" />
            <span>Active Rules</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7299B4] shrink-0" />
            <span>Surveillance Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#BCA77B] shrink-0" />
            <span>Selected</span>
          </div>
        </div>

        {/* Arcs Note */}
        <div className="text-[10px] text-[#625F5A] whitespace-nowrap text-right shrink-0 drop-shadow">
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
