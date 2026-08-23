import os

files = {
    "src/components/dashboard/dashboard-canvas.tsx": """'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Float } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function FlowNodes() {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      ] as [number, number, number],
      color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#eab308' : '#22c55e',
      scale: Math.random() * 0.2 + 0.1
    }));
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Sphere position={node.position} scale={node.scale}>
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.5} />
          </Sphere>
        </Float>
      ))}
      {/* Connecting lines could go here */}
    </group>
  );
}

export function DashboardCanvas() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] overflow-hidden shadow-md h-[250px] relative">
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-80" />
      <div className="absolute top-4 left-4 z-20">
        <h3 className="text-zinc-100 font-semibold">Data Flow</h3>
        <p className="text-xs text-zinc-500">Live processing pipeline</p>
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <FlowNodes />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
""",

    "src/components/dashboard/command-palette.tsx": """'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search } from 'lucide-react';

export function CommandPalette({ regulations }: { regulations: any[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-700"
      >
        <Search className="w-4 h-4" />
        <span>Search commands...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Jump to Regulation">
            {regulations?.map((reg) => (
              <CommandItem
                key={reg.id}
                onSelect={() => runCommand(() => router.push(`/dashboard`))}
              >
                {reg.name}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => router.push('/regulations/upload'))}>
              Upload New Regulation
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/settings/api-keys'))}>
              Manage API Keys
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

