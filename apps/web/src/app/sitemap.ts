import type { MetadataRoute } from 'next';
import canonicalRegulations from '@/lib/canonical-regulations.json';

// Cache on Vercel Edge for fast Googlebot retrieval
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 24 hours

// Canonical domain matching Google Search Console property exactly (https://www.regcompiler.app)
const BASE_URL = 'https://www.regcompiler.app';

interface RawRegulation {
  id: string;
  name: string;
  jurisdiction?: string;
  created_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use verified canonical statutory regulations (154 real frameworks from Supabase)
  let regulations: RawRegulation[] = canonicalRegulations as RawRegulation[];

  // Optional: only fetch remote production API if explicitly configured with HTTPS
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl && apiUrl.startsWith('https://')) {
    try {
      const res = await fetch(`${apiUrl}/regulations`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(1000),
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.data || data?.items || [];
        if (Array.isArray(items) && items.length > 0) {
          regulations = items;
        }
      }
    } catch {
      // Fall back seamlessly to canonicalRegulations
    }
  }

  // Strict Filter: Nomocks - zero test/dummy/mock items
  const cleanRegulations = regulations.filter((reg) => {
    if (!reg?.id || !reg?.name) return false;
    const lowerName = reg.name.toLowerCase();
    return !lowerName.startsWith('test reg') && !lowerName.startsWith('mock');
  });

  const now = new Date().toISOString();

  // 1. Core Static Product Pages with Calibrated Google Search Priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/regulations`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/compliance-check`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/billing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/sign-up`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // 2. Canonical Statutory Regulation Detail Pages (Zero Mocks, 100% Matching GSC Domain)
  const regulationRoutes: MetadataRoute.Sitemap = cleanRegulations.flatMap((reg) => {
    const regDate = reg.created_at ? new Date(reg.created_at).toISOString() : now;
    return [
      {
        url: `${BASE_URL}/regulations/${reg.id}`,
        lastModified: regDate,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/regulations/${reg.id}/requirements`,
        lastModified: regDate,
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${BASE_URL}/regulations/${reg.id}/diff`,
        lastModified: regDate,
        changeFrequency: 'weekly',
        priority: 0.6,
      },
      {
        url: `${BASE_URL}/regulations/${reg.id}/reports`,
        lastModified: regDate,
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ];
  });

  return [...staticRoutes, ...regulationRoutes];
}
