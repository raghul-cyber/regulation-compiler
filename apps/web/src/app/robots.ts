import type { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.regcompiler.app').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/regulations',
          '/regulations/*',
          '/compliance-check',
          '/billing',
          '/privacy',
          '/terms',
          '/sitemap.xml',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/settings',
          '/settings/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/_next/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/regulations',
          '/regulations/*',
          '/compliance-check',
          '/billing',
          '/privacy',
          '/terms',
          '/sitemap.xml',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/settings',
          '/settings/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/_next/*',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
