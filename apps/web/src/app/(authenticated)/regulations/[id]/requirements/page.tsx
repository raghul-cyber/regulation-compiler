import { Suspense } from 'react';
import { getRequirements, getRegulation, getRegulations } from '@/lib/api';
import { RequirementsBrowserView } from '@/components/requirements/requirements-browser-view';

export const metadata = {
  title: 'Requirements Browser | RegCompiler',
  description: 'Search, filter, and review parsed obligations with verifiable source traces.',
};

async function RequirementsContent({ 
  id, 
  searchParams 
}: { 
  id: string, 
  searchParams: Record<string, string | string[]> | undefined 
}) {
  // Normalize search params
  const params: Record<string, string> = {};
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (typeof v === 'string') params[k] = v;
    });
  }

  let [reg, response] = await Promise.all([
    getRegulation(id).catch(() => null),
    getRequirements(id, params).catch(() => null)
  ]);

  let requirements = response?.data || [];

  // Fallback resolution: If regulation was not found or requirements are empty, match against catalog
  if (!reg || requirements.length === 0) {
    try {
      const allRegs = await getRegulations().catch(() => []);
      if (Array.isArray(allRegs) && allRegs.length > 0) {
        const queryLower = id.toLowerCase();
        const matched = allRegs.find((r: any) => 
          r.id === id || 
          r.name?.toLowerCase().includes(queryLower) ||
          queryLower.includes((r.jurisdiction || '').toLowerCase())
        );
        if (matched) {
          if (!reg) reg = matched;
          if (requirements.length === 0 && matched.id !== id) {
            const fallbackResp = await getRequirements(matched.id, params).catch(() => null);
            if (fallbackResp?.data && fallbackResp.data.length > 0) {
              requirements = fallbackResp.data;
            }
          }
        }
      }
    } catch {}
  }

  return (
    <RequirementsBrowserView 
      id={id}
      initialRegulation={reg}
      initialRequirements={requirements}
      searchParams={params}
    />
  );
}

// Next.js 14 Page props include searchParams 
export default async function RequirementsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-zinc-400">
        <p className="text-sm font-semibold text-white animate-pulse">Loading Statutory Framework...</p>
      </div>
    }>
      <RequirementsContent id={resolvedParams.id} searchParams={resolvedSearchParams as Record<string, string>} />
    </Suspense>
  );
}

