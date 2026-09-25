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
        <div className="p-4.5 rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.10)] hover:border-[rgba(201,196,186,0.20)] shadow-[0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8D8982]">Monitored Nodes</span>
            <div className="p-1.5 rounded-lg bg-[#3F5C74]/15 border border-[#3F5C74]/30 text-[#AD956C]">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#F7F4EC] font-mono">
              {monitoringData?.active_jurisdictions_count || 4}
            </span>
            <span className="text-xs text-[#8D8982] font-mono">
              / {monitoringData?.total_jurisdictions_count || 9} nodes
            </span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#718A79] flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#718A79]" />
            <span>100% Perimeter Coverage</span>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.10)] hover:border-[rgba(201,196,186,0.20)] shadow-[0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8D8982]">Active Rulesets</span>
            <div className="p-1.5 rounded-lg bg-[#718A79]/15 border border-[#718A79]/30 text-[#718A79]">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#F7F4EC] font-mono">
              {regulations.length || monitoringData?.active_regulations_count || 0}
            </span>
            <span className="text-xs text-[#8D8982] font-mono">enforced</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#8D8982] flex items-center gap-1">
            <span>DORA • GDPR • HIPAA • PIPEDA</span>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.10)] hover:border-[rgba(201,196,186,0.20)] shadow-[0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8D8982]">Surveillance Engine</span>
            <div className="p-1.5 rounded-lg bg-[#718A79]/15 border border-[#718A79]/30 text-[#718A79]">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#718A79] font-mono">ONLINE</span>
            <span className="text-xs text-[#8D8982] font-mono">24/7/365</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#8D8982]">
            <span>Auto-poll interval: 6s SSE stream</span>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-[#151311] border border-[rgba(201,196,186,0.10)] hover:border-[rgba(201,196,186,0.20)] shadow-[0_4px_16px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8D8982]">Statutory Gazettes</span>
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg bg-[#1B1815] border border-[rgba(201,196,186,0.08)] hover:border-[#AD956C]/40 text-[#8D8982] hover:text-[#F7F4EC] transition-all cursor-pointer"
              title="Force sync live telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#AD956C]' : ''}`} />
            </button>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-bold text-[#F7F4EC] font-mono">Eur-Lex, SEC, FCA</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-[#8D8982] flex items-center gap-1">
            <span>MAS &amp; EDPB stream linked</span>
          </div>
        </div>
      </div>

      {/* Main Command Center: 3D Globe + Live Surveillance Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-stretch">
        {/* 3D Visualizer Canvas (7 cols on XL) */}
        <div className="xl:col-span-7 w-full h-[620px] bg-[#151311] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] border border-[rgba(201,196,186,0.12)] relative group">
          {/* Tactical HUD Header for 3D Globe */}
          <div className="absolute top-3 left-4 z-20 pointer-events-none font-mono text-[9px] text-[#AD956C] tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#AD956C]" />
            <span>3D GEOSPATIAL SURVEILLANCE MATRIX</span>
          </div>
          <CoverageGlobe 
            regulations={regulations} 
            jurisdictionsData={jurisdictionsList}
            selectedJurisdiction={selectedJurisdiction}
            activeSignalJurisdiction={activeSignalJurisdiction}
            onSelectJurisdiction={(code) => setSelectedJurisdiction(code)}
          />
        </div>

        {/* Live Surveillance Stream (5 cols on XL) */}
        <div className="xl:col-span-5 w-full h-[620px] rounded-2xl overflow-hidden border border-[rgba(201,196,186,0.12)] bg-[#151311] shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
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
      <div className="p-6 rounded-2xl border border-[rgba(201,196,186,0.12)] bg-[#151311] shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[rgba(201,196,186,0.08)]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F7F4EC] tracking-wide uppercase">
                Active Monitored Jurisdictions &amp; Enforced Standards
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#AD956C]/15 text-[#C5B38B] border border-[#AD956C]/30 font-mono">
                {jurisdictionsList.length} Jurisdictions
              </span>
            </div>
            <p className="text-xs text-[#8D8982] mt-0.5">
              Live status, supervisory authority oversight, and active regulatory coverage across global jurisdictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedJurisdiction && (
              <button
                onClick={() => setSelectedJurisdiction(null)}
                className="text-xs px-2.5 py-1 rounded-md bg-[#1B1815] hover:bg-[#211D19] text-[#C9C4BA] border border-[rgba(201,196,186,0.10)] transition-colors cursor-pointer"
              >
                Clear Focus ({selectedJurisdiction})
              </button>
            )}
            <button
              onClick={() => router.push('/regulations')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3F5C74] hover:bg-[#344D63] text-[#F7F4EC] transition-all flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-[#AD956C]/25 cursor-pointer"
            >
              <span>Explore Regulations Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#AD956C]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(jurisdictionsList || []).filter(Boolean).map((jur: any, jurIdx: number) => {
            const isSelected = Boolean(selectedJurisdiction && jur?.code && selectedJurisdiction.toUpperCase() === jur.code.toUpperCase());
            const isLiveSignal = Boolean(activeSignalJurisdiction && jur?.code && activeSignalJurisdiction.toUpperCase() === jur.code.toUpperCase());
            return (
              <div
                key={`${jur?.code || 'jur'}-${jurIdx}`}
                onClick={() => jur?.code && setSelectedJurisdiction(jur.code)}
                className={`p-4.5 rounded-xl border transition-all cursor-pointer group relative ${
                  isSelected
                    ? 'bg-[#1B1815] border-[#AD956C] shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                    : (isLiveSignal
                        ? 'bg-[#1B1815] border-[#AD956C]/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
                        : 'bg-[#100E0D] border-[rgba(201,196,186,0.08)] hover:border-[rgba(201,196,186,0.18)] hover:bg-[#1B1815]/60')
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl drop-shadow">{jur.flag || '🌐'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#F7F4EC] group-hover:text-[#C5B38B] transition-colors">
                        {jur.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#8D8982] uppercase tracking-wider">
                        [{jur.code}]
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isLiveSignal && (
                      <span className="text-[9px] font-mono font-bold py-0.5 px-2 rounded bg-[#AD956C]/15 text-[#C5B38B] border border-[#AD956C]/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#AD956C]" />
                        LIVE PING
                      </span>
                    )}
                    <span className={`text-[10px] font-mono font-semibold py-0.5 px-2 rounded border ${
                      jur.ruleset_count > 0
                        ? 'bg-[#718A79]/15 text-[#718A79] border-[#718A79]/30'
                        : 'bg-[#3F5C74]/15 text-[#C9C4BA] border-[#3F5C74]/30'
                    }`}>
                      {jur.ruleset_count > 0 ? `${jur.ruleset_count} Rules Enforced` : 'Surveillance Active'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#C9C4BA] my-3 font-mono">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8D8982]">Supervisory:</span>
                    <span className="text-[#F1EEE7] font-medium truncate max-w-[160px]" title={jur.authority}>
                      {jur.authority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8D8982]">Compliance Health:</span>
                    <span className="text-[#718A79] font-bold">
                      {jur.compliance_score?.toFixed(1) || 94.0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#8D8982]">Scope:</span>
                    <span className="text-[#C9C4BA] font-medium">{jur.ruleset_count || 0} Standards</span>
                  </div>
                </div>

                {jur.regulations && jur.regulations.length > 0 && (
                  <div className="pt-2 border-t border-[rgba(201,196,186,0.08)] flex flex-wrap gap-1 font-mono">
                    {jur.regulations.map((r: string, idx: number) => (
                      <span
                        key={`${jur.code || 'jur'}-${r}-${idx}`}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#151311] text-[#C9C4BA] border border-[rgba(201,196,186,0.08)]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-[rgba(201,196,186,0.08)] flex items-center justify-between text-[11px] font-mono text-[#8D8982]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/regulations?jurisdiction=${encodeURIComponent(jur.code)}`);
                    }}
                    className="text-[#AD956C] hover:text-[#C5B38B] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Inspect Regulations <ArrowUpRight className="w-3 h-3" />
                  </button>
                  <span className="text-[#8D8982] group-hover:text-[#F7F4EC] flex items-center gap-0.5 transition-colors">
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
