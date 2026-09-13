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
  Shield
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

  const [events, setEvents] = useState<FeedEvent[]>(initialEvents);
  const [isLive, setIsLive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [newEventFlash, setNewEventFlash] = useState(false);
  const [latestNewSignal, setLatestNewSignal] = useState<FeedEvent | null>(null);
  const eventsRef = useRef<FeedEvent[]>(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Sync initial events
  useEffect(() => {
    if (initialEvents.length > 0) {
      setEvents(initialEvents);
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

  // Continuous 24/7 automatic live stream polling every 3 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await fetchFeedAction();
        if (fresh && fresh.length > 0) {
          const currentEvents = eventsRef.current;
          const prevIds = new Set(currentEvents.map(e => e.id));
          const newSignals = fresh.filter(e => !prevIds.has(e.id));
          
          setEvents(fresh);
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
        console.warn("Live 24/7 feed sync check:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, fetchFeedAction, onNewSignal]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchFeedAction();
      if (fresh) {
        setEvents(fresh);
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
        setEvents(prev => [result.event, ...prev]);
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
    return events.filter(e => {
      if (filterJurisdiction !== 'ALL' && e.jurisdiction.toUpperCase() !== filterJurisdiction.toUpperCase()) {
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

  const getJurisdictionColor = (code: string) => {
    switch (code.toUpperCase()) {
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
                {isLive ? '24/7 AUTO-UPDATE ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Continuous stream (3s)
              </span>
              <span>•</span>
              <span>Auto-sweep in: ~{Math.max(1, 25 - (secondsAgo % 25))}s</span>
              <span>•</span>
              <span className="text-zinc-500">Synced {secondsAgo}s ago</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {onTriggerProbe && (
            <button
              onClick={handleTriggerProbe}
              disabled={isProbing}
              className="p-1.5 text-xs font-semibold rounded-lg border border-blue-500/40 hover:border-blue-400 bg-blue-600/20 text-blue-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              title="Launch on-demand statutory surveillance probe"
            >
              <Zap className={`w-3.5 h-3.5 text-blue-400 ${isProbing ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isProbing ? 'Probing...' : 'Live Probe'}</span>
            </button>
          )}

          <button
            onClick={() => setIsLive(!isLive)}
            className="p-1.5 text-xs font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            title={isLive ? 'Pause Stream' : 'Resume Live Stream'}
          >
            {isLive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isLive ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-xs font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
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
            {latestNewSignal?.regulation_id ? (
              <button
                onClick={() => router.push(`/regulations/${latestNewSignal.regulation_id}/requirements`)}
                className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 shadow"
              >
                Inspect AST
                <ArrowUpRight className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">Extracted</span>
            )}
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center">
            <Activity className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
            <p className="text-sm font-medium">No surveillance events match the filter.</p>
            <p className="text-xs text-zinc-600 mt-1">Switch filter back to "ALL" to inspect the global stream.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = selectedJurisdiction && selectedJurisdiction.toUpperCase() === evt.jurisdiction.toUpperCase();
            return (
              <div
                key={evt.id}
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
                      {evt.jurisdiction}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
                      {evt.category.replace(/_/g, ' ')}
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

                {/* Title */}
                <h4 className="text-xs md:text-sm font-semibold text-zinc-100 group-hover:text-blue-300 transition-colors leading-snug">
                  {evt.title}
                </h4>

                {/* Summary */}
                <p className="text-[11px] md:text-xs text-zinc-400 mt-1 leading-relaxed">
                  {evt.summary}
                </p>

                {/* Footer / Actions */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Globe2 className="w-3 h-3 text-zinc-400" />
                    {evt.authority}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {(() => {
                      if (evt.regulation_id) {
                        return (
                          <button
                            onClick={() => router.push(`/regulations/${evt.regulation_id}/requirements`)}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold text-[10px] px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 border border-emerald-500/40 hover:border-emerald-400/60 shadow-sm"
                            title="Inspect automatically extracted statutory requirements in the compiler"
                          >
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span>Inspect Requirements ({evt.extracted_requirements_count || 1})</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        );
                      }

                      const title = (evt.title || '').toUpperCase();
                      const summary = (evt.summary || '').toUpperCase();
                      const jur = (evt.jurisdiction || '').toUpperCase();
                      
                      let match = null;
                      if (regulations && regulations.length > 0) {
                        if (title.includes('DORA') || summary.includes('DORA')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('DORA'));
                        } else if (title.includes('GDPR') || summary.includes('GDPR') || title.includes('EDPB') || summary.includes('EDPB')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('GDPR'));
                        } else if (title.includes('HIPAA') || summary.includes('HIPAA')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('HIPAA'));
                        } else if (title.includes('CCPA') || summary.includes('CCPA') || title.includes('CPRA') || title.includes('CPPA')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('CCPA') || r.name.toUpperCase().includes('CALIFORNIA'));
                        } else if (title.includes('PIPEDA') || summary.includes('PIPEDA') || title.includes('OPC')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('PIPEDA'));
                        } else if (title.includes('PCI DSS') || summary.includes('PCI DSS') || title.includes('PCI SSC') || title.includes('PAYMENT CARD')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('PCI DSS') || r.name.toUpperCase().includes('PAYMENT CARD'));
                        } else if (title.includes('ISO') || summary.includes('ISO') || title.includes('27001')) {
                          match = regulations.find(r => r.name.toUpperCase().includes('27001'));
                        }
                        if (!match) {
                          match = regulations.find(r => r.jurisdiction.toUpperCase() === jur);
                        }
                      }

                      const label = match 
                        ? (match.name.includes('(') ? match.name.split('(')[1].replace(')', '') : match.name.split(' ')[0])
                        : `${evt.jurisdiction} Regulation`;

                      return (
                        <button
                          onClick={() => {
                            if (match?.id) {
                              router.push(`/regulations/${match.id}/requirements`);
                            } else {
                              router.push(`/regulations?jurisdiction=${encodeURIComponent(evt.jurisdiction)}`);
                            }
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-1 border border-emerald-500/30 hover:border-emerald-400/50 shadow-sm"
                          title={match ? `Inspect extracted requirements for ${match.name}` : `Inspect ${evt.jurisdiction} regulations`}
                        >
                          <Shield className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Inspect {label}</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </button>
                      );
                    })()}

                    {onSelectJurisdiction && (
                      <button
                        onClick={() => onSelectJurisdiction(evt.jurisdiction)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-[10px] px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      >
                        Focus Globe
                        <ArrowUpRight className="w-2.5 h-2.5" />
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
    </div>
  );
}
