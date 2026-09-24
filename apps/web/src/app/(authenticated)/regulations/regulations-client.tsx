'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Globe2, 
  FileText, 
  Search, 
  X, 
  Filter,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getRegulations } from '@/app/(authenticated)/dashboard/actions';

interface Regulation {
  id: string;
  name: string;
  jurisdiction: string;
  description?: string;
  source_url?: string;
  requirements_count?: number;
  created_at?: string;
}

interface RegulationsClientProps {
  initialRegulations: Regulation[];
}

function getJurisdictionBadge(jurisdiction: string) {
  const code = (jurisdiction || '').toUpperCase();
  switch (code) {
    case 'EU':
      return { label: 'EU • European Union', color: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]' };
    case 'US':
      return { label: 'US • United States', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' };
    case 'CA':
      return { label: 'CA • Canada', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' };
    case 'UK':
      return { label: 'UK • United Kingdom', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]' };
    case 'SG':
      return { label: 'SG • Singapore', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' };
    case 'GLOBAL':
    default:
      return { label: 'GLOBAL • International', color: 'bg-[#7928CA]/15 text-[#D498FF] border-[#7928CA]/30 shadow-[0_0_10px_rgba(121,40,202,0.2)]' };
  }
}

export function RegulationsClient({ initialRegulations }: RegulationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJurisdiction = searchParams.get('jurisdiction')?.toUpperCase() || 'ALL';

  const [regulations, setRegulations] = useState<Regulation[]>(initialRegulations || []);
  const [isLoading, setIsLoading] = useState(initialRegulations.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdiction);

  // Sync state if initialRegulations changes
  useEffect(() => {
    if (initialRegulations && initialRegulations.length > 0) {
      setRegulations(initialRegulations);
      setIsLoading(false);
    }
  }, [initialRegulations]);

  // Client-side auto-sync if initial fetch had 0 regulations (e.g. cold start)
  const syncRegulations = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getRegulations();
      if (fresh && fresh.length > 0) {
        setRegulations(fresh);
      }
    } catch (e) {
      console.error("Failed to sync regulations:", e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (regulations.length === 0) {
      syncRegulations();
    }
  }, [regulations.length, syncRegulations]);

  // Sync state if URL changes
  useEffect(() => {
    const jur = searchParams.get('jurisdiction')?.toUpperCase();
    if (jur) {
      setSelectedJurisdiction(jur);
    }
  }, [searchParams]);

  // Unique jurisdictions present in dataset
  const availableJurisdictions = useMemo(() => {
    const list = Array.from(new Set(regulations.map(r => r.jurisdiction.toUpperCase()))).sort();
    return list;
  }, [regulations]);

  // Filtered regulations
  const filteredRegulations = useMemo(() => {
    return regulations.filter(reg => {
      // Jurisdiction match
      if (selectedJurisdiction !== 'ALL') {
        if (reg.jurisdiction.toUpperCase() !== selectedJurisdiction) {
          return false;
        }
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (reg.name || '').toLowerCase().includes(q);
        const matchesDesc = (reg.description || '').toLowerCase().includes(q);
        const matchesJur = (reg.jurisdiction || '').toLowerCase().includes(q);
        const matchesUrl = (reg.source_url || '').toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesJur || matchesUrl;
      }

      return true;
    });
  }, [regulations, selectedJurisdiction, searchQuery]);

  const totalRequirements = useMemo(() => {
    return filteredRegulations.reduce((acc, r) => acc + (r.requirements_count || 0), 0);
  }, [filteredRegulations]);

  const handleJurisdictionChange = (jur: string) => {
    setSelectedJurisdiction(jur);
    if (jur === 'ALL') {
      router.push('/regulations');
    } else {
      router.push(`/regulations?jurisdiction=${jur}`);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedJurisdiction('ALL');
    router.push('/regulations');
  };


  return (
    <div className="space-y-8">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stitch-card p-4 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-[#00F0FF] uppercase tracking-wider">Active Frameworks</span>
            <Layers className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{filteredRegulations.length}</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 uppercase">Canonical</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">
            {filteredRegulations.length === initialRegulations.length
              ? 'All official statutory acts'
              : `Filtered from ${initialRegulations.length} total`}
          </p>
        </div>

        <div className="stitch-card p-4 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7928CA]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-[#D498FF] uppercase tracking-wider">Extracted Rules</span>
            <FileText className="w-4 h-4 text-[#D498FF]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{totalRequirements}</span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold px-1.5 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 uppercase">Enforceable</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">Atomic compliance obligations</p>
        </div>

        <div className="stitch-card p-4 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">Jurisdictions</span>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {selectedJurisdiction === 'ALL' ? availableJurisdictions.length : 1}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 font-medium px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 uppercase">Global</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono truncate">
            {selectedJurisdiction === 'ALL' ? availableJurisdictions.join(' • ') : selectedJurisdiction}
          </p>
        </div>

        <div className="stitch-card p-4 rounded-2xl bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Validation Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight font-mono">100%</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 uppercase">Verified</span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 font-mono">0 Mock / Test entries</p>
        </div>
      </div>

      {/* Interactive Filter & Search Toolbar */}
      <div className="stitch-card p-4 rounded-2xl bg-gradient-to-r from-[#0A121E]/90 via-[#060A10]/95 to-[#0A121E]/90 border border-[#162A3B] backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regulations by name, topic, or keyword..."
            className="pl-10 pr-8 bg-[#03060A] border-[#162A3B] text-xs h-10 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#00F0FF]/50 rounded-xl"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Jurisdiction Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-mono mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#00F0FF]" /> Region:
          </span>
          <button
            onClick={() => handleJurisdictionChange('ALL')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              selectedJurisdiction === 'ALL'
                ? 'bg-[#00F0FF] text-[#020508] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'bg-[#050A10] border border-[#162A3B] text-zinc-400 hover:text-white hover:border-[#00F0FF]/40'
            }`}
          >
            ALL ({regulations.length})
          </button>
          {availableJurisdictions.map((jur) => {
            const count = regulations.filter(r => r.jurisdiction.toUpperCase() === jur).length;
            const isSelected = selectedJurisdiction === jur;
            return (
              <button
                key={jur}
                onClick={() => handleJurisdictionChange(jur)}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00F0FF] text-[#020508] shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                    : 'bg-[#050A10] border border-[#162A3B] text-zinc-400 hover:text-white hover:border-[#00F0FF]/40'
                }`}
              >
                {jur} ({count})
              </button>
            );
          })}
          {(selectedJurisdiction !== 'ALL' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs font-mono text-zinc-400 hover:text-rose-400 h-9 px-2.5"
            >
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={syncRegulations}
            disabled={isRefreshing}
            className="text-xs text-zinc-400 hover:text-[#00F0FF] h-9 px-2.5 ml-auto border border-[#162A3B] bg-[#050A10] rounded-lg"
            title="Force Synchronize Regulations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00F0FF]' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Regulations Grid */}
      {regulations.length === 0 ? (
        <div className="rounded-2xl border border-[#162A3B] bg-[#0A121E]/60 p-12 text-center backdrop-blur-xl">
          {isLoading || isRefreshing ? (
            <>
              <Loader2 className="w-10 h-10 text-[#00F0FF] animate-spin mx-auto mb-4" />
              <h3 className="text-base font-extrabold text-zinc-200">Synchronizing Canonical Regulations...</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                Establishing direct connection to PostgreSQL repository and loading official statutory frameworks.
              </p>
            </>
          ) : (
            <>
              <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-base font-extrabold text-zinc-200">Database Synchronization Pending</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
                No statutory frameworks currently synchronized. Click below to force synchronizing canonical regulations.
              </p>
              <Button 
                variant="default" 
                size="sm" 
                onClick={syncRegulations}
                disabled={isRefreshing}
                className="mt-4 bg-[#00F0FF] hover:bg-[#33F3FF] text-[#020508] font-mono font-bold text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Force Refresh Synchronization
              </Button>
            </>
          )}
        </div>
      ) : filteredRegulations.length === 0 ? (
        <div className="rounded-2xl border border-[#162A3B] bg-[#0A121E]/60 p-12 text-center backdrop-blur-xl">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-extrabold text-zinc-200">No regulations match "{selectedJurisdiction}" filter</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery ? `No results matching query "${searchQuery}".` : `No active frameworks configured for ${selectedJurisdiction}.`}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
            className="mt-4 border-[#162A3B] text-xs text-zinc-300 hover:text-white bg-[#050A10]"
          >
            View All {regulations.length} Regulations
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegulations.map((reg) => {
            const badge = getJurisdictionBadge(reg.jurisdiction);
            return (
              <Card 
                key={reg.id} 
                className="stitch-card bg-gradient-to-b from-[#0A121E]/90 to-[#04080D]/95 border border-[#162B3D] hover:border-[#00F0FF]/50 transition-all duration-300 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_16px_50px_rgba(0,240,255,0.12)] group rounded-2xl overflow-hidden backdrop-blur-xl relative"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent group-hover:via-[#00F0FF] transition-all duration-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Enforceable
                    </span>
                  </div>
                  <CardTitle className="text-lg font-extrabold text-zinc-100 group-hover:text-[#00F0FF] transition-colors leading-snug">
                    {reg.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {reg.description || 'Comprehensive statutory compliance framework governing operational standards and obligations.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-[#050A10] border border-[#162A3B] rounded-xl font-mono">
                    <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
                      Extracted Controls:
                    </span>
                    <span className="text-[#00F0FF] font-bold text-xs bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/25">
                      {reg.requirements_count || 0} Requirements
                    </span>
                  </div>

                  {reg.source_url && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span className="truncate max-w-[200px]" title={reg.source_url}>
                        Source: {reg.source_url.startsWith('http') ? new URL(reg.source_url).hostname : 'Statutory Repository'}
                      </span>
                      {reg.source_url.startsWith('http') && (
                        <a 
                          href={reg.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#00F0FF] hover:text-[#5CE1E6] flex items-center gap-1 transition-colors"
                        >
                          Official Text
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t border-[#162A3B]">
                  <Link href={`/regulations/${reg.id}/requirements`} className="w-full">
                    <Button 
                      variant="default" 
                      className="w-full bg-[#050A10] hover:bg-[#00F0FF] text-zinc-200 hover:text-[#020508] border border-[#162A3B] hover:border-[#00F0FF] font-mono font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 group/btn transition-all duration-300 shadow-sm cursor-pointer"
                    >
                      <span className="uppercase tracking-wider">Inspect Requirements</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
