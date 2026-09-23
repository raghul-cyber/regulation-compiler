import type { MetadataRoute } from 'next';
import canonicalRegulations from '@/lib/canonical-regulations.json';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.regcompiler.app').replace(/\/+$/, '');

interface RawRegulation {
  id: string;
  name: string;
  jurisdiction?: string;
  created_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Fetch live regulations if API is accessible, else use verified canonical database snapshot
  let regulations: RawRegulation[] = canonicalRegulations as RawRegulation[];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';
    const res = await fetch(`${apiUrl}/regulations`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.data || data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        regulations = items;
      }
    }
  } catch {
    // Seamless fallback to canonical database snapshot
  }

  // 2. Strict Filter: Nomocks - zero test/dummy/mock items
  const cleanRegulations = regulations.filter((reg) => {
    if (!reg?.id || !reg?.name) return false;
    const lowerName = reg.name.toLowerCase();
    return !lowerName.startsWith('test reg') && !lowerName.startsWith('mock');
  });

  const now = new Date().toISOString();

  // 3. Core Static Product Pages with Calibrated Google Search Priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
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

  // 4. Dynamic Canonical Regulation Pages with Priority Tiering
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
