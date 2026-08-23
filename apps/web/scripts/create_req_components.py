import os

files = {
    "src/app/actions.ts": """'use server';

import { updateRequirementStatus } from '@/lib/api';
import { revalidatePath } from 'next/cache';

export async function setRequirementStatus(reqId: string, status: string, note?: string) {
  try {
    await updateRequirementStatus(reqId, status, note);
    // Force Next.js to re-fetch the requirements so the status update is immediately visible
    revalidatePath('/(authenticated)/regulations/[id]/requirements', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
""",

    "src/components/requirements/filter-bar.tsx": """'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(delay);
  }, [search, pathname, router, searchParams]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0a0a0c] p-4 rounded-xl border border-zinc-800 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Semantic search across requirements..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700"
        />
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          value={searchParams.get('severity') || 'all'}
          onChange={(e) => setFilter('severity', e.target.value)}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          value={searchParams.get('status') || 'all'}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
}
""",

    "src/components/requirements/requirement-card.tsx": """'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { setRequirementStatus } from '@/app/actions';

export function RequirementCard({ req }: { req: any }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const handleApprove = async () => {
    setIsUpdating(true);
    await setRequirementStatus(req.id, 'approved');
    setIsUpdating(false);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-6 shadow-md transition-all hover:border-zinc-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3 items-center">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(req.severity)}`}>
            {req.severity ? req.severity.charAt(0).toUpperCase() + req.severity.slice(1) : 'Unknown'}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 uppercase tracking-wider">
            {req.type}
          </span>
          {req.confidence_score && (
            <span className="text-xs text-zinc-500">
              {Math.round(req.confidence_score * 100)}% AI Match
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {req.validation_status === 'approved' ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
            </span>
          ) : (
            <button 
              onClick={handleApprove}
              disabled={isUpdating}
              className="flex items-center gap-1 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <AlertCircle className="w-3.5 h-3.5" /> 
              {isUpdating ? 'Approving...' : 'Approve'}
            </button>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{req.title}</h3>
      <p className="text-sm text-zinc-400 mb-6">{req.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {req.actions?.items && req.actions.items.length > 0 && (
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Required Actions</h4>
            <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5">
              {req.actions.items.map((action: string, i: number) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {req.conditions?.items && req.conditions.items.length > 0 && (
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Trigger Conditions</h4>
            <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1.5">
              {req.conditions.items.map((cond: string, i: number) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-4 mt-2">
        <button 
          onClick={() => setSourceOpen(!sourceOpen)}
          className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          {sourceOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Cross-Reference Original Source Text
        </button>
        
        {sourceOpen && (
          <div className="mt-3 p-4 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-400 border border-zinc-800 whitespace-pre-wrap leading-relaxed">
            {req.source_text || "No source text mapped to this requirement."}
          </div>
        )}
      </div>
    </div>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {path}")

