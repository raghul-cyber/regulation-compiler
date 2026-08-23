'use client';

import { useEffect, useState, useMemo } from 'react';
import { getRegulations } from './actions';
import dynamic from 'next/dynamic';
import { Loader2, Globe, Shield, MapPin } from 'lucide-react';

const CoverageGlobe = dynamic(() => import('@/components/compliance/coverage-globe').then(mod => mod.CoverageGlobe), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-zinc-950/50 rounded-xl border border-zinc-800 text-zinc-500">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500/50"/> 
      <span className="font-medium text-sm">Initializing 3D WebGL Engine...</span>
    </div>
  ) 
});

export function CoverageView() {
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRegulations();
        setRegulations(data || []);
      } catch (err) {
        console.error("Failed to load regulations", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeJurisdictions = useMemo(() => {
    const map = new Map<string, number>();
    regulations.forEach(r => {
      const j = (r.jurisdiction || 'Unknown').toUpperCase();
      map.set(j, (map.get(j) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [regulations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-[#0a0a0c] border border-zinc-800 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <span className="text-sm font-medium">Loading coverage map...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
      
      <div className="lg:col-span-3 w-full h-[600px] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
        <CoverageGlobe regulations={regulations} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c]">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> How it Works
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This 3D skeletal globe visualizes your active compliance perimeter based on the regulations loaded into the system.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500"><strong className="text-zinc-300">Nodes:</strong> Each plotted point represents a jurisdiction where you have actively parsed and mapped regulatory rules.</p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-500"><strong className="text-zinc-300">Arcs:</strong> Flowing arcs represent a stylistic indication of continuous monitoring reach from your central HQ node.</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] flex-1">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Active Regions ({activeJurisdictions.length})
          </h3>
          {activeJurisdictions.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No jurisdictions mapped yet.</p>
          ) : (
            <ul className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {activeJurisdictions.map(([jur, count]) => (
                <li key={jur} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <span className="font-medium text-zinc-200 text-sm">{jur}</span>
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">{count} Ruleset{count !== 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
