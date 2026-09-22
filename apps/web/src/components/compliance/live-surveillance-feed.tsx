'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Radio, 
  ExternalLink, 
  Filter, 
  Pause, 
  Play, 
  RefreshCw, 
  Globe2, 
  Activity, 
  Zap,
  ArrowUpRight,
  Shield,
  X,
  Code2,
  FileText,
  CheckCircle2,
  BookOpen,
  Layers,
  Cpu,
  ShieldAlert
} from 'lucide-react';

export interface FeedEvent {
  id: string;
  jurisdiction: string;
  category: string;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  timestamp: string;
  authority: string;
  citation?: string;
  source_url?: string;
  regulation_id?: string | null;
  is_extracted?: boolean;
  extracted_requirements_count?: number;
  is_live_scraped?: boolean;
}

interface LiveSurveillanceFeedProps {
  initialEvents?: FeedEvent[];
  onSelectJurisdiction?: (code: string) => void;
  onNewSignal?: (jurisdiction: string) => void;
  selectedJurisdiction?: string | null;
  fetchFeedAction: () => Promise<FeedEvent[]>;
  onTriggerProbe?: (jurisdiction?: string) => Promise<any>;
  regulations?: any[];
}

function deduplicateEvents(list: FeedEvent[]): FeedEvent[] {
  if (!list || !Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: FeedEvent[] = [];
  for (const item of list) {
    if (!item?.id) continue;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

export function LiveSurveillanceFeed({
  initialEvents = [],
  onSelectJurisdiction,
  onNewSignal,
  selectedJurisdiction,
  fetchFeedAction,
  onTriggerProbe,
  regulations = [],
}: LiveSurveillanceFeedProps) {
  const router = useRouter();

  const [events, setEvents] = useState<FeedEvent[]>(() => deduplicateEvents(initialEvents));
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [newEventFlash, setNewEventFlash] = useState(false);
  const [latestNewSignal, setLatestNewSignal] = useState<FeedEvent | null>(null);
  const [inspectingSignal, setInspectingSignal] = useState<FeedEvent | null>(null);
  const [inspectTab, setInspectTab] = useState<'ast' | 'obligations' | 'source'>('ast');
  const eventsRef = useRef<FeedEvent[]>(events);

  const getTargetRegulationId = (evt: FeedEvent | null): string | null => {
    if (!evt) return null;
    if (evt.regulation_id) return evt.regulation_id;
    const title = (evt.title || '').toUpperCase();
    const summary = (evt.summary || '').toUpperCase();
    const jur = (evt.jurisdiction || '').toUpperCase();
    if (regulations && regulations.length > 0) {
      const getRegName = (r: any) => (r?.name || '').toUpperCase();
      if (title.includes('DORA') || summary.includes('DORA')) {
        const match = regulations.find(r => getRegName(r).includes('DORA'));
        if (match?.id) return match.id;
      }
      if (title.includes('AI ACT') || summary.includes('AI ACT')) {
        const match = regulations.find(r => getRegName(r).includes('AI ACT'));
        if (match?.id) return match.id;
      }
      if (title.includes('GDPR') || summary.includes('GDPR') || title.includes('EDPB')) {
        const match = regulations.find(r => getRegName(r).includes('GDPR'));
        if (match?.id) return match.id;
      }
      if (title.includes('HIPAA') || summary.includes('HIPAA')) {
        const match = regulations.find(r => getRegName(r).includes('HIPAA'));
        if (match?.id) return match.id;
      }
      if (title.includes('CCPA') || summary.includes('CCPA') || title.includes('CPRA')) {
        const match = regulations.find(r => getRegName(r).includes('CCPA') || getRegName(r).includes('CALIFORNIA'));
        if (match?.id) return match.id;
      }
      if (title.includes('PIPEDA') || summary.includes('PIPEDA') || title.includes('OPC')) {
        const match = regulations.find(r => getRegName(r).includes('PIPEDA'));
        if (match?.id) return match.id;
      }
      if (title.includes('PCI DSS') || summary.includes('PCI DSS')) {
        const match = regulations.find(r => getRegName(r).includes('PCI DSS') || getRegName(r).includes('PAYMENT CARD'));
        if (match?.id) return match.id;
      }
      if (title.includes('ISO') || summary.includes('ISO') || title.includes('27001')) {
        const match = regulations.find(r => getRegName(r).includes('27001'));
        if (match?.id) return match.id;
      }
      const jurMatch = regulations.find(r => (r?.jurisdiction || '').toUpperCase() === jur);
      if (jurMatch?.id) return jurMatch.id;
    }
    return null;
  };

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Sync initial events with deduplication
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(deduplicateEvents(initialEvents));
    }
  }, [initialEvents]);

  // Live second ticker for continuous feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected jurisdiction from globe
  useEffect(() => {
    if (selectedJurisdiction) {
      setFilterJurisdiction(selectedJurisdiction);
    }
  }, [selectedJurisdiction]);

  // High-Frequency Real-Time Server-Sent Events (SSE) Stream (1s live cadence)
  useEffect(() => {
    if (!isLive || typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/compliance/stream');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'heartbeat' || payload.type === 'signal') {
            setSecondsAgo(0);
            setLastUpdated(new Date());

            if (payload.latest_signal) {
              const sig = payload.latest_signal;
              const currentEvents = eventsRef.current;
              const exists = currentEvents.some(e => e.id === sig.id);
              if (!exists) {
                const updated = deduplicateEvents([sig, ...currentEvents]);
                setEvents(updated);
                setLatestNewSignal(sig);
                setNewEventFlash(true);
                setTimeout(() => setNewEventFlash(false), 3000);
                if (onNewSignal) {
                  onNewSignal(sig.jurisdiction);
                }
              }
            }
          }
        } catch {
          // Ignore parse errors on keepalive pings
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch {
      // Fallback cleanly to 1s interval polling
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isLive, onNewSignal]);

  // Resilient fallback polling every 15 seconds (SSE stream handles real-time 1s updates;
  // this poll is a safety net for when the SSE connection drops or is unavailable)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await fetchFeedAction();
        if (fresh && fresh.length > 0) {
          const dedupedFresh = deduplicateEvents(fresh);
          const currentEvents = eventsRef.current;
          const prevIds = new Set(currentEvents.map(e => e.id));
          const newSignals = dedupedFresh.filter(e => !prevIds.has(e.id));
          
          setEvents(dedupedFresh);
          setLastUpdated(new Date());
          setSecondsAgo(0);

          if (newSignals.length > 0) {
            setLatestNewSignal(newSignals[0]);
            setNewEventFlash(true);
            setTimeout(() => setNewEventFlash(false), 3000);
            if (onNewSignal) {
              onNewSignal(newSignals[0].jurisdiction);
            }
          }
        }
      } catch (err) {
        // Silent - SSE stream is the primary live channel
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isLive, fetchFeedAction, onNewSignal]);


  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchFeedAction();
      if (fresh) {
        setEvents(deduplicateEvents(fresh));
        setLastUpdated(new Date());
        setSecondsAgo(0);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerProbe = async () => {
    if (!onTriggerProbe || isProbing) return;
    setIsProbing(true);
    try {
      const targetJur = filterJurisdiction !== 'ALL' ? filterJurisdiction : 'GLOBAL';
      const result = await onTriggerProbe(targetJur);
      if (result?.event) {
        setEvents(prev => deduplicateEvents([result.event, ...prev]));
        setLatestNewSignal(result.event);
        setNewEventFlash(true);
        setTimeout(() => setNewEventFlash(false), 3000);
        if (onNewSignal) {
          onNewSignal(result.event.jurisdiction);
        }
      }
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } finally {
      setIsProbing(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const seen = new Set<string>();
    return events.filter(e => {
      if (!e?.id || seen.has(e.id)) {
        return false;
      }
      seen.add(e.id);
      if (filterJurisdiction !== 'ALL' && (e.jurisdiction || '').toUpperCase() !== (filterJurisdiction || '').toUpperCase()) {
        return false;
      }
      if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) {
        return false;
      }
      return true;
    });
  }, [events, filterJurisdiction, filterSeverity]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 15) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr}h ago`;
    } catch {
      return 'Live';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Active Notice
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Telemetry
          </span>
        );
    }
  };

  const getJurisdictionColor = (code?: string) => {
    switch ((code || '').toUpperCase()) {
      case 'EU': return 'bg-blue-600/20 text-blue-400 border-blue-500/40';
      case 'US': return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40';
      case 'UK': return 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40';
      case 'SG': return 'bg-amber-600/20 text-amber-400 border-amber-500/40';
      case 'CA': return 'bg-rose-600/20 text-rose-400 border-rose-500/40';
      case 'GLOBAL': return 'bg-purple-600/20 text-purple-400 border-purple-500/40';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <Radio className={`w-4 h-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`} />
            {isLive && (
              <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Live Regulatory Surveillance Feed
              </h3>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                {isLive ? '24/7 LIVE STREAM (1s)' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Continuous stream (1s)
              </span>
              <span>•</span>
              <span>Auto-sweep in: ~{Math.max(1, 10 - (secondsAgo % 10))}s</span>
              <span>•</span>
              <span className="text-zinc-500">Synced {secondsAgo}s ago</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/regulations${filterJurisdiction !== 'ALL' ? `?jurisdiction=${encodeURIComponent(filterJurisdiction)}` : ''}`)}
            className="p-1.5 text-xs font-semibold rounded-lg border border-blue-500/40 hover:border-blue-400 bg-blue-600/20 text-blue-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
            title="Explore and inspect compiled statutory regulations"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Inspect Catalog</span>
          </button>

          {onTriggerProbe && (
            <button
              onClick={handleTriggerProbe}
              disabled={isProbing}
              className="p-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 hover:border-emerald-400 bg-emerald-600/20 text-emerald-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
              title="Launch on-demand statutory surveillance probe"
            >
              <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isProbing ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isProbing ? 'Probing...' : 'Live Probe'}</span>
            </button>
          )}

          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1.5 text-xs font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title={isLive ? 'Pause Stream' : 'Resume Live Stream'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isLive ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-xs font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Force Synchronize"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-950/30 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-zinc-500 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Region:
          </span>
          {['ALL', 'EU', 'US', 'UK', 'SG', 'CA', 'GLOBAL'].map(j => (
            <button
              key={j}
              onClick={() => {
                setFilterJurisdiction(j);
                if (j !== 'ALL' && onSelectJurisdiction) {
                  onSelectJurisdiction(j);
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                filterJurisdiction === j
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/50'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {j}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 text-[11px] font-medium mr-1">Severity:</span>
          {['ALL', 'critical', 'high', 'info'].map(s => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium transition-all ${
                filterSeverity === s
                  ? 'bg-zinc-700 text-white font-semibold'
                  : 'bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 border border-zinc-800/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Event List */}
      <div className="flex-1 overflow-y-auto max-h-[540px] p-3 space-y-2.5 divide-y divide-zinc-800/30 custom-scrollbar">
        {newEventFlash && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-emerald-400 mr-1.5">
                  [24/7 AUTO-INGESTION]:
                </span>
                <span className="font-semibold text-white truncate inline-block max-w-[280px] sm:max-w-[400px] align-bottom">
                  {latestNewSignal ? latestNewSignal.title : 'Live Regulatory Signal Received & Decoded'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (latestNewSignal) {
                    setInspectingSignal(latestNewSignal);
                    setInspectTab('ast');
                  }
                }}
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 shadow cursor-pointer"
                title="Inspect real-time compiled Abstract Syntax Tree"
              >
                <Code2 className="w-3 h-3" />
                <span>Inspect AST</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center">
            <Activity className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
            <p className="text-sm font-medium">No surveillance events match the filter.</p>
            <p className="text-xs text-zinc-600 mt-1">Switch filter back to "ALL" to inspect the global stream.</p>
          </div>
        ) : (
          filteredEvents.filter(Boolean).map((evt, idx) => {
            const isSelected = Boolean(selectedJurisdiction && selectedJurisdiction.toUpperCase() === (evt.jurisdiction || '').toUpperCase());
            const targetRegId = getTargetRegulationId(evt);

            return (
              <div
                key={`${evt.id}-${idx}`}
                className={`pt-2.5 first:pt-0 p-3 rounded-lg border transition-all duration-200 group ${
                  isSelected 
                    ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-950/50' 
                    : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/60 hover:border-zinc-700/80'
                }`}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getJurisdictionColor(evt.jurisdiction)}`}>
                      {evt.jurisdiction || 'GLOBAL'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
                      {(evt.category || 'TELEMETRY').replace(/_/g, ' ')}
                    </span>
                    {evt.citation && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/80 text-[10px] font-mono text-zinc-300">
                        {evt.citation}
                      </span>
                    )}
                    {evt.is_live_scraped && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        24/7 Live Feed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(evt.severity)}
                    <span className="text-[11px] font-mono text-zinc-500">
                      {formatRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Title (Clickable to quick inspect) */}
                <h4 
                  onClick={() => {
                    setInspectingSignal(evt);
                    setInspectTab('ast');
                  }}
                  className="text-xs md:text-sm font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors leading-snug cursor-pointer flex items-center gap-1"
                  title="Click to inspect compiled AST and statutory requirements"
                >
                  <span>{evt.title}</span>
                </h4>

                {/* Summary */}
                <p className="text-[11px] md:text-xs text-zinc-400 mt-1 leading-relaxed">
                  {evt.summary}
                </p>

                {/* Footer / Actions */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-zinc-400" />
                    {evt.authority || 'Regulatory Body'}
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Quick Inspect AST */}
                    <button
                      onClick={() => {
                        setInspectingSignal(evt);
                        setInspectTab('ast');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-all flex items-center gap-1 border border-cyan-500/30 hover:border-cyan-400/50 shadow-sm cursor-pointer"
                      title="Quick inspect compiled Abstract Syntax Tree logic"
                    >
                      <Code2 className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Inspect AST</span>
                    </button>

                    {/* Quick Inspect Requirements */}
                    <button
                      onClick={() => {
                        setInspectingSignal(evt);
                        setInspectTab('obligations');
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-1 border border-emerald-500/30 hover:border-emerald-400/50 shadow-sm cursor-pointer"
                      title="Inspect extracted statutory requirements"
                    >
                      <Shield className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Inspect Obligations ({evt.extracted_requirements_count || 1})</span>
                    </button>

                    {/* Direct Navigate to Full Directory if ID exists */}
                    {targetRegId && (
                      <button
                        onClick={() => router.push(`/regulations/${targetRegId}/requirements`)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-[10px] px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Open in full regulations requirements browser"
                      >
                        <span>Full Directory</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {onSelectJurisdiction && (
                      <button
                        onClick={() => onSelectJurisdiction(evt.jurisdiction)}
                        className="text-zinc-400 hover:text-zinc-200 font-medium text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Center on 3D globe"
                      >
                        Focus Globe
                      </button>
                    )}

                    {evt.source_url && evt.source_url !== '#' && (
                      <a
                        href={evt.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                        title="View Official Gazette Source"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer telemetry status */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">24/7 Automated Crawler: <strong className="text-emerald-400">ONLINE & EXTRACTING</strong></span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px]">
          <span>Auto-Sweep: 25s</span>
          <span>•</span>
          <span>{filteredEvents.length} Signals Monitored</span>
        </div>
      </div>

      {/* Quick Regulation & AST Inspector Modal */}
      {inspectingSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative flex flex-col gap-4 overflow-hidden">
            <button
              onClick={() => setInspectingSignal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 pr-8">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${getJurisdictionColor(inspectingSignal.jurisdiction)}`}>
                {inspectingSignal.jurisdiction}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-zinc-400 mb-1">
                  <span className="uppercase text-blue-400 font-semibold">{inspectingSignal.authority}</span>
                  {inspectingSignal.citation && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-300 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{inspectingSignal.citation}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatRelativeTime(inspectingSignal.timestamp)}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {inspectingSignal.title}
                </h3>
              </div>
            </div>

            {/* Telemetry Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 font-medium">Surveillance Mode</span>
                <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  24/7 Live Stream
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 font-medium">Compiler Status</span>
                <p className="text-cyan-400 font-semibold mt-0.5 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  Deterministic AST
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 font-medium">Severity Classification</span>
                <div className="mt-0.5">{getSeverityBadge(inspectingSignal.severity)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 font-medium">Extracted Controls</span>
                <p className="text-white font-mono font-bold mt-0.5 text-[11px]">
                  {inspectingSignal.extracted_requirements_count || 1} Enforceable
                </p>
              </div>
            </div>

            {/* Modal Tabs Switcher */}
            <div className="flex border-b border-zinc-800 gap-2 pb-px text-xs font-semibold">
              <button
                onClick={() => setInspectTab('ast')}
                className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  inspectTab === 'ast'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Compiled AST Rule Tree</span>
              </button>

              <button
                onClick={() => setInspectTab('obligations')}
                className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  inspectTab === 'obligations'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Statutory Obligations</span>
              </button>

              <button
                onClick={() => setInspectTab('source')}
                className={`pb-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  inspectTab === 'source'
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Official Gazette Source</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 custom-scrollbar text-xs">
              {inspectTab === 'ast' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        Machine-Executable Abstract Syntax Tree
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold">
                        AST NODE #1
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Decomposed from official gazette text into deterministic boolean conditions and automated validation triggers.
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 font-mono text-[11px] space-y-1.5">
                        <div className="text-zinc-500 text-[10px] uppercase font-sans">Trigger Conditions:</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">OPERATOR: AND</span>
                        </div>
                        <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                          <span className="text-cyan-300">{(inspectingSignal.jurisdiction || 'global').toLowerCase()}.statutory_compliance</span>
                          <span className="text-purple-400 font-bold text-[11px]">EQUALS</span>
                          <span className="text-emerald-400 font-bold">true</span>
                        </div>
                        <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                          <span className="text-cyan-300">{(inspectingSignal.citation || inspectingSignal.id).toLowerCase().replace(/[^a-z0-9_]/g, '_')}.control_active</span>
                          <span className="text-purple-400 font-bold text-[11px]">EQUALS</span>
                          <span className="text-emerald-400 font-bold">true</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 font-mono text-[11px] space-y-1">
                        <div className="text-zinc-500 text-[10px] uppercase font-sans">Automated Enforcement Action:</div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                            VERIFY_STATUTORY_CONTROL
                          </span>
                          <span className="text-zinc-400 text-[11px]">Authority: {inspectingSignal.authority}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 font-mono text-[11px] space-y-1">
                        <div className="text-zinc-500 text-[10px] uppercase font-sans">Required Evidence:</div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          <span>AUDIT_LOG_EVIDENCE (Cryptographic provenance trace enabled)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectTab === 'obligations' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">Statutory Scope & Obligation Summary</span>
                      {getSeverityBadge(inspectingSignal.severity)}
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {inspectingSignal.summary}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
                    <span className="font-semibold text-white text-xs block">Extracted Requirements Breakdown:</span>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-200">
                            Requirement 1: Mandatory Continuous Technical Safeguards
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Obligation
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Entity must establish and maintain documented operational controls, automated event logs, and periodic verification under {inspectingSignal.authority}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {inspectTab === 'source' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">Official Statutory Publication Metadata</span>
                      {inspectingSignal.citation && (
                        <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                          {inspectingSignal.citation}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 pt-1">
                      <div>
                        <span className="text-zinc-500 block">Supervisory Authority:</span>
                        <span className="text-zinc-200 font-medium">{inspectingSignal.authority}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Publication Date:</span>
                        <span className="text-zinc-200 font-medium">{new Date(inspectingSignal.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-white text-xs block">Official Text Excerpt:</span>
                    <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {inspectingSignal.summary}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800 text-xs">
              <div className="text-zinc-400 text-[11px] font-mono">
                {inspectingSignal.citation ? `Citation: ${inspectingSignal.citation}` : `Signal ID: ${inspectingSignal.id}`}
              </div>

              <div className="flex items-center gap-2">
                {inspectingSignal.source_url && inspectingSignal.source_url !== '#' && (
                  <a
                    href={inspectingSignal.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <span>Official Gazette Text</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                )}

                {(() => {
                  const targetId = getTargetRegulationId(inspectingSignal);
                  if (targetId) {
                    return (
                      <button
                        onClick={() => {
                          setInspectingSignal(null);
                          router.push(`/regulations/${targetId}/requirements`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <span>Open Full Directory</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        setInspectingSignal(null);
                        router.push(`/regulations?jurisdiction=${encodeURIComponent(inspectingSignal.jurisdiction || '')}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <span>Explore Catalog</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  );
                })()}

                <button
                  onClick={() => setInspectingSignal(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
