import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.regcompiler.app';

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
