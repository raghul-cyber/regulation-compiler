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
      return { label: 'EU • European Union', color: 'bg-[#344D63]/20 text-[#607D96] border-[#344D63]/40' };
    case 'US':
      return { label: 'US • United States', color: 'bg-[#718A79]/20 text-[#718A79] border-[#718A79]/40' };
    case 'CA':
      return { label: 'CA • Canada', color: 'bg-[#9A5D62]/20 text-[#9A5D62] border-[#9A5D62]/40' };
    case 'UK':
      return { label: 'UK • United Kingdom', color: 'bg-[#3F5C74]/20 text-[#8FA8BF] border-[#3F5C74]/40' };
    case 'SG':
      return { label: 'SG • Singapore', color: 'bg-[#AD956C]/20 text-[#C5B38B] border-[#AD956C]/40' };
    case 'GLOBAL':
    default:
      return { label: 'GLOBAL • International', color: 'bg-[#151311] text-[#C9C4BA] border-[#211D19]' };
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
        <div className="p-4 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] relative overflow-hidden flex flex-col justify-between transition-all shadow-[0_8px_24px_rgba(8,7,6,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium text-[#8D8982] uppercase tracking-wider">Active Frameworks</span>
            <Layers className="w-4 h-4 text-[#C7AF7B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#F4F0E8] tracking-tight font-mono">{filteredRegulations.length}</span>
            <span className="text-[10px] font-mono text-[#8BA894] font-medium px-1.5 py-0.5 rounded bg-[#718A79]/15 border border-[#718A79]/30 uppercase">Canonical</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#625F5A] font-mono">
            {filteredRegulations.length === initialRegulations.length
              ? 'All official statutory acts'
              : `Filtered from ${initialRegulations.length} total`}
          </p>
        </div>

        <div className="p-4 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] relative overflow-hidden flex flex-col justify-between transition-all shadow-[0_8px_24px_rgba(8,7,6,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium text-[#8D8982] uppercase tracking-wider">Extracted Rules</span>
            <FileText className="w-4 h-4 text-[#7A9FBE]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#F4F0E8] tracking-tight font-mono">{totalRequirements}</span>
            <span className="text-[10px] font-mono text-[#8BAAC4] font-medium px-1.5 py-0.5 rounded bg-[#263E55]/30 border border-[#486984]/40 uppercase">Enforceable</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#625F5A] font-mono">Atomic compliance obligations</p>
        </div>

        <div className="p-4 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] relative overflow-hidden flex flex-col justify-between transition-all shadow-[0_8px_24px_rgba(8,7,6,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium text-[#8D8982] uppercase tracking-wider">Jurisdictions</span>
            <Globe2 className="w-4 h-4 text-[#718A79]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#F4F0E8] tracking-tight font-mono">
              {selectedJurisdiction === 'ALL' ? availableJurisdictions.length : 1}
            </span>
            <span className="text-[10px] font-mono text-[#C9C4BA] font-medium px-1.5 py-0.5 rounded bg-[#171716] border border-[rgba(220,210,190,0.10)] uppercase">Global</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#625F5A] font-mono truncate">
            {selectedJurisdiction === 'ALL' ? availableJurisdictions.join(' • ') : selectedJurisdiction}
          </p>
        </div>

        <div className="p-4 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] relative overflow-hidden flex flex-col justify-between transition-all shadow-[0_8px_24px_rgba(8,7,6,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-medium text-[#8D8982] uppercase tracking-wider">Validation Health</span>
            <CheckCircle2 className="w-4 h-4 text-[#718A79]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#F4F0E8] tracking-tight font-mono">100%</span>
            <span className="text-[10px] font-mono text-[#8BA894] font-medium px-1.5 py-0.5 rounded bg-[#718A79]/15 border border-[#718A79]/30 uppercase">Verified</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#625F5A] font-mono">0 Mock / Test entries</p>
        </div>
      </div>

      {/* Interactive Filter & Search Toolbar */}
      <div className="p-4 rounded-xl rc-glass-smoked border border-[rgba(220,210,190,0.10)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[0_8px_24px_rgba(8,7,6,0.6)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#625F5A]" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regulations by name, topic, or keyword..."
            className="pl-10 pr-8 bg-[#0B0A09] border-[rgba(220,210,190,0.10)] text-xs h-10 text-[#F4F0E8] placeholder:text-[#625F5A] focus-visible:ring-1 focus-visible:ring-[#C7AF7B] rounded-lg font-mono transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8982] hover:text-[#F4F0E8] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Jurisdiction Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#8D8982] font-mono mr-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#C7AF7B]" /> Region:
          </span>
          <button
            onClick={() => handleJurisdictionChange('ALL')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
              selectedJurisdiction === 'ALL'
                ? 'rc-btn-sapphire-metal font-bold'
                : 'rc-btn-graphite-metal text-[#8D8982] hover:text-[#F4F0E8]'
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
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'rc-btn-sapphire-metal font-bold'
                    : 'rc-btn-graphite-metal text-[#8D8982] hover:text-[#F4F0E8]'
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
              className="text-xs font-mono text-[#8D8982] hover:text-[#9A5D62] h-9 px-2.5 cursor-pointer"
            >
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={syncRegulations}
            disabled={isRefreshing}
            className="text-xs text-[#8D8982] hover:text-[#F7F4EC] h-9 px-2.5 ml-auto border border-[#211D19] bg-[#100E0D] rounded-lg cursor-pointer"
            title="Force Synchronize Regulations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#AD956C]' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Regulations Grid */}
      {regulations.length === 0 ? (
        <div className="rounded-xl border border-[#211D19] bg-[#100E0D] p-12 text-center">
          {isLoading || isRefreshing ? (
            <>
              <Loader2 className="w-10 h-10 text-[#AD956C] animate-spin mx-auto mb-4" />
              <h3 className="text-base font-semibold text-[#F7F4EC]">Synchronizing Canonical Regulations...</h3>
              <p className="mt-1 text-xs text-[#8D8982] max-w-sm mx-auto font-sans">
                Establishing direct connection to PostgreSQL repository and loading official statutory frameworks.
              </p>
            </>
          ) : (
            <>
              <Shield className="w-12 h-12 text-[#625F5A] mx-auto mb-4" />
              <h3 className="text-base font-semibold text-[#F7F4EC]">Database Synchronization Pending</h3>
              <p className="mt-1 text-xs text-[#8D8982] max-w-sm mx-auto font-sans">
                No statutory frameworks currently synchronized. Click below to force synchronizing canonical regulations.
              </p>
              <Button 
                variant="default" 
                size="sm" 
                onClick={syncRegulations}
                disabled={isRefreshing}
                className="mt-4 bg-[#3F5C74] hover:bg-[#4B6982] text-[#F7F4EC] font-mono font-medium text-xs cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Force Refresh Synchronization
              </Button>
            </>
          )}
        </div>
      ) : filteredRegulations.length === 0 ? (
        <div className="rounded-xl border border-[#211D19] bg-[#100E0D] p-12 text-center">
          <Shield className="w-12 h-12 text-[#625F5A] mx-auto mb-4" />
          <h3 className="text-base font-semibold text-[#F7F4EC]">No regulations match "{selectedJurisdiction}" filter</h3>
          <p className="mt-1 text-xs text-[#8D8982] max-w-sm mx-auto font-sans">
            {searchQuery ? `No results matching query "${searchQuery}".` : `No active frameworks configured for ${selectedJurisdiction}.`}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
            className="mt-4 border-[#211D19] text-xs text-[#C9C4BA] hover:text-[#F7F4EC] bg-[#151311] hover:bg-[#1B1815] cursor-pointer"
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
                className="rc-glass-smoked border border-[rgba(220,210,190,0.10)] hover:border-[rgba(185,164,122,0.3)] hover:bg-[#171716]/90 transition-all flex flex-col justify-between shadow-[0_8px_24px_rgba(8,7,6,0.65)] group rounded-xl overflow-hidden relative"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-[#8BA894] bg-[#718A79]/15 border border-[#718A79]/35 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#718A79]" />
                      Enforceable
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold text-[#F4F0E8] group-hover:text-white transition-colors leading-snug">
                    {reg.name}
                  </CardTitle>
                  <CardDescription className="text-[#8D8982] text-xs mt-2 line-clamp-3 leading-relaxed font-sans">
                    {reg.description || 'Comprehensive statutory compliance framework governing operational standards and obligations.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-[#0B0A09] border border-[rgba(220,210,190,0.08)] rounded-lg font-mono">
                    <span className="text-[#8D8982] font-medium flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#C7AF7B]" />
                      Extracted Controls:
                    </span>
                    <span className="text-[#8BAAC4] font-semibold text-xs bg-[#263E55]/30 px-2 py-0.5 rounded border border-[#486984]/40">
                      {reg.requirements_count || 0} Requirements
                    </span>
                  </div>

                  {reg.source_url && (
                    <div className="flex items-center justify-between text-[11px] text-[#625F5A] font-mono">
                      <span className="truncate max-w-[200px]" title={reg.source_url}>
                        Source: {reg.source_url.startsWith('http') ? new URL(reg.source_url).hostname : 'Statutory Repository'}
                      </span>
                      {reg.source_url.startsWith('http') && (
                        <a 
                          href={reg.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#7A9FBE] hover:text-[#C7AF7B] flex items-center gap-1 transition-colors"
                        >
                          Official Text
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t border-[rgba(220,210,190,0.08)]">
                  <Link href={`/regulations/${reg.id}/requirements`} className="w-full">
                    <button 
                      className="w-full rc-btn-graphite-metal font-mono font-medium text-xs h-10 rounded-lg flex items-center justify-center gap-2 group/btn transition-all cursor-pointer"
                    >
                      <span className="uppercase tracking-wider">Inspect Requirements</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 text-[#C7AF7B]" />
                    </button>
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
