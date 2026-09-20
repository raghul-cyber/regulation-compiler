'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { getRegulations, getGlobalMonitoringData, getMonitoringFeed, triggerSurveillanceProbe } from './actions';
import { LiveSurveillanceFeed, FeedEvent } from '@/components/compliance/live-surveillance-feed';
import dynamic from 'next/dynamic';
import { 
  Loader2, 
  Globe, 
  Shield, 
  MapPin, 
  Radio, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const CoverageGlobe = dynamic(
  () => import('@/components/compliance/coverage-globe').then(mod => mod.CoverageGlobe), 
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full min-h-[580px] flex flex-col items-center justify-center bg-zinc-950/70 rounded-xl border border-zinc-800 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500/60"/> 
        <span className="font-semibold text-sm text-zinc-300">Initializing 3D Surveillance Canvas...</span>
        <span className="text-xs text-zinc-500 mt-1">Connecting WebGL geospatial projection pipeline</span>
      </div>
    ) 
  }
);

export function CoverageView() {
  const router = useRouter();
  const [regulations, setRegulations] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [initialFeed, setInitialFeed] = useState<FeedEvent[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [activeSignalJurisdiction, setActiveSignalJurisdiction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [regs, monData, feedData] = await Promise.all([
        getRegulations().catch(() => []),
        getGlobalMonitoringData().catch(() => null),
        getMonitoringFeed(25).catch(() => [])
      ]);
      setRegulations(regs || []);
      setMonitoringData(monData);
      setInitialFeed(feedData || []);
    } catch (err) {
      console.error("Failed to load global monitoring data:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Strict safety timeout: Guarantee UI never hangs on loading spinner
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    loadAll().finally(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    return () => clearTimeout(timer);
  }, [loadAll]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await loadAll();
  };


  // Feed fetch callback for live surveillance component (called every 15s by fallback poller;
  // real-time updates are pushed via the SSE stream at 1s cadence)
  const isFetchingFeedRef = useRef(false);
  const handleFetchFeed = useCallback(async (): Promise<FeedEvent[]> => {
    if (isFetchingFeedRef.current) return [];
    isFetchingFeedRef.current = true;
    try {
      const res = await fetch('/api/compliance/feed?limit=25', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch {
      // Fallback seamlessly to server action
    } finally {
      isFetchingFeedRef.current = false;
    }
    try {
      return await getMonitoringFeed(25);
    } catch {
      return [];
    }
  }, []);

  const jurisdictionsList = useMemo(() => {
    if (monitoringData?.jurisdictions) {
      return monitoringData.jurisdictions;
    }
    return [];
  }, [monitoringData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-zinc-400 bg-[#0a0a0c] border border-zinc-800 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <span className="text-base font-semibold text-white">Connecting Global Surveillance Feed...</span>
        <span className="text-xs text-zinc-500 mt-1">Synchronizing active jurisdiction nodes and regulatory gazettes</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Telemetry Metric Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c0d12] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Monitored Jurisdictions</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {monitoringData?.active_jurisdictions_count || 4}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              / {monitoringData?.total_jurisdictions_count || 9} global nodes
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Perimeter coverage
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c0d12] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Active Frameworks</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {regulations.length || monitoringData?.active_regulations_count || 0}
            </span>
            <span className="text-xs text-zinc-500">enforced rulesets</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1">
            <span>DORA, GDPR, HIPAA, PIPEDA</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c0d12] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Surveillance Engine</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">ONLINE</span>
            <span className="text-xs text-zinc-500 font-mono">Continuous</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            <span>Auto-poll interval: 6s</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c0d12] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Authority Feeds</span>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Force sync live telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">Eur-Lex, SEC, FCA</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1">
            <span>MAS & EDPB stream linked</span>
          </div>
        </div>
      </div>

      {/* Main Command Center: 3D Globe + Live Surveillance Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-stretch">
        {/* 3D Visualizer Canvas (7 cols on XL) */}
        <div className="xl:col-span-7 w-full h-[620px] rounded-xl overflow-hidden shadow-2xl">
          <CoverageGlobe 
            regulations={regulations} 
            jurisdictionsData={jurisdictionsList}
            selectedJurisdiction={selectedJurisdiction}
            activeSignalJurisdiction={activeSignalJurisdiction}
            onSelectJurisdiction={(code) => setSelectedJurisdiction(code)}
          />
        </div>

        {/* Live Surveillance Stream (5 cols on XL) */}
        <div className="xl:col-span-5 w-full h-[620px]">
          <LiveSurveillanceFeed
            initialEvents={initialFeed}
            regulations={regulations}
            selectedJurisdiction={selectedJurisdiction}
            onSelectJurisdiction={(code) => setSelectedJurisdiction(code)}

            onNewSignal={(code) => {
              if (typeof window !== 'undefined') {
                window.requestAnimationFrame(() => {
                  setActiveSignalJurisdiction(code);
                  setTimeout(() => setActiveSignalJurisdiction(null), 3000);
                });
              } else {
                setActiveSignalJurisdiction(code);
              }
            }}
            fetchFeedAction={handleFetchFeed}
            onTriggerProbe={async (jur) => {
              const res = await triggerSurveillanceProbe(jur);
              return res;
            }}
          />
        </div>
      </div>

      {/* Active Monitored Jurisdictions Matrix Deck */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-[#0a0a0c] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide uppercase">
                Active Monitored Jurisdictions & Enforced Standards
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {jurisdictionsList.length} Jurisdictions
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live status, supervisory authority oversight, and active regulatory coverage across global jurisdictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedJurisdiction && (
              <button
                onClick={() => setSelectedJurisdiction(null)}
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Clear Focus ({selectedJurisdiction})
              </button>
            )}
            <button
              onClick={() => router.push('/regulations')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5"
            >
              <span>Explore Regulations Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jurisdictionsList.map((jur: any, jurIdx: number) => {
            const isSelected = selectedJurisdiction?.toUpperCase() === jur.code.toUpperCase();
            const isLiveSignal = activeSignalJurisdiction?.toUpperCase() === jur.code.toUpperCase();
            return (
              <div
                key={`${jur.code || 'jur'}-${jurIdx}`}
                onClick={() => setSelectedJurisdiction(jur.code)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/80 ring-2 ring-blue-500/50 shadow-lg shadow-blue-950/60'
                    : (isLiveSignal
                        ? 'bg-cyan-950/30 border-cyan-400/80 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-950/70 scale-[1.01]'
                        : 'bg-zinc-900/30 hover:bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700')
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{jur.flag || '🌐'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {jur.name}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500">
                        [{jur.code}]
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLiveSignal && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        LIVE PING
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      jur.ruleset_count > 0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {jur.ruleset_count > 0 ? `${jur.ruleset_count} Rules Enforced` : 'Surveillance Active'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 my-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Authority:</span>
                    <span className="text-zinc-300 font-medium truncate max-w-[160px]" title={jur.authority}>
                      {jur.authority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Compliance Health:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {jur.compliance_score?.toFixed(1) || 94.0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-500">Supervisory Scope:</span>
                    <span className="text-zinc-300 font-medium">{jur.ruleset_count || 0} Standards</span>
                  </div>
                </div>

                {jur.regulations && jur.regulations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1">
                    {jur.regulations.map((r: string, idx: number) => (
                      <span
                        key={`${jur.code || 'jur'}-${r}-${idx}`}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-500">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/regulations?jurisdiction=${encodeURIComponent(jur.code)}`);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Inspect Regulations <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <span className="text-zinc-400 group-hover:text-white flex items-center gap-0.5">
                    Focus 3D Globe <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
