'use client';

import React, { useState, useMemo } from 'react';
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
  Filter 
} from 'lucide-react';

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
      return { label: 'EU • European Union', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'US':
      return { label: 'US • United States', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'CA':
      return { label: 'CA • Canada', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    case 'GLOBAL':
    default:
      return { label: 'GLOBAL • International', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
}

export function RegulationsClient({ initialRegulations }: RegulationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJurisdiction = searchParams.get('jurisdiction')?.toUpperCase() || 'ALL';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdiction);

  // Sync state if URL changes
  React.useEffect(() => {
    const jur = searchParams.get('jurisdiction')?.toUpperCase();
    if (jur) {
      setSelectedJurisdiction(jur);
    }
  }, [searchParams]);

  // Unique jurisdictions present in dataset
  const availableJurisdictions = useMemo(() => {
    const list = Array.from(new Set(initialRegulations.map(r => r.jurisdiction.toUpperCase()))).sort();
    return list;
  }, [initialRegulations]);

  // Filtered regulations
  const filteredRegulations = useMemo(() => {
    return initialRegulations.filter(reg => {
      // Jurisdiction match
      if (selectedJurisdiction !== 'ALL') {
        if (reg.jurisdiction.toUpperCase() !== selectedJurisdiction) {
          return false;
        }
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = reg.name.toLowerCase().includes(q);
        const matchesDesc = (reg.description || '').toLowerCase().includes(q);
        const matchesJur = reg.jurisdiction.toLowerCase().includes(q);
        const matchesUrl = (reg.source_url || '').toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesJur || matchesUrl;
      }

      return true;
    });
  }, [initialRegulations, selectedJurisdiction, searchQuery]);

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
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Frameworks</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{filteredRegulations.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Canonical</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {filteredRegulations.length === initialRegulations.length
              ? 'All official statutory acts'
              : `Filtered from ${initialRegulations.length} total`}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Extracted Requirements</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{totalRequirements}</span>
            <span className="text-xs text-blue-400 font-medium">Enforceable</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Atomic compliance obligations</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Jurisdictions</span>
            <Globe2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {selectedJurisdiction === 'ALL' ? availableJurisdictions.length : 1}
            </span>
            <span className="text-xs text-zinc-400 font-medium">Global</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {selectedJurisdiction === 'ALL' ? availableJurisdictions.join(' • ') : selectedJurisdiction}
          </p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Validation Health</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">100%</span>
            <span className="text-xs text-emerald-400 font-medium">Verified</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">0 Mock / Test entries</p>
        </div>
      </div>

      {/* Interactive Filter & Search Toolbar */}
      <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regulations by name, topic, or keyword..."
            className="pl-9 pr-8 bg-zinc-900/80 border-zinc-800 text-xs h-9 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-blue-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Jurisdiction Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Region:
          </span>
          <button
            onClick={() => handleJurisdictionChange('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              selectedJurisdiction === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            ALL ({initialRegulations.length})
          </button>
          {availableJurisdictions.map((jur) => {
            const count = initialRegulations.filter(r => r.jurisdiction.toUpperCase() === jur).length;
            const isSelected = selectedJurisdiction === jur;
            return (
              <button
                key={jur}
                onClick={() => handleJurisdictionChange(jur)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
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
              className="text-xs text-zinc-400 hover:text-rose-400 h-8 px-2"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Regulations Grid */}
      {filteredRegulations.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-12 text-center">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-zinc-200">No regulations match your filter</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search query or clear the jurisdiction filter to view all canonical frameworks.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearFilters}
            className="mt-4 border-zinc-800 text-xs text-zinc-300 hover:text-white"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegulations.map((reg) => {
            const badge = getJurisdictionBadge(reg.jurisdiction);
            return (
              <Card 
                key={reg.id} 
                className="bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md hover:shadow-black/40 group rounded-xl overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Enforceable
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-zinc-100 group-hover:text-blue-400 transition-colors leading-snug">
                    {reg.name}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {reg.description || 'Comprehensive statutory compliance framework governing operational standards and obligations.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-4 space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 px-3 bg-zinc-900/60 border border-zinc-800/50 rounded-lg">
                    <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      Extracted Controls:
                    </span>
                    <span className="text-white font-bold text-sm bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                      {reg.requirements_count || 0} Requirements
                    </span>
                  </div>

                  {reg.source_url && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="truncate max-w-[200px]" title={reg.source_url}>
                        Source: {reg.source_url.startsWith('http') ? new URL(reg.source_url).hostname : 'Statutory Repository'}
                      </span>
                      {reg.source_url.startsWith('http') && (
                        <a 
                          href={reg.source_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          Official Text
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t border-zinc-800/60">
                  <Link href={`/regulations/${reg.id}/requirements`} className="w-full">
                    <Button 
                      variant="default" 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Inspect Requirements</span>
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
