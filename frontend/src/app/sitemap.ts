import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://safnexbd.com';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://safnexbd.com/api/v1';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/check`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/digital-products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/micro-jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/physical-products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/money-exchange`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dispute-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/partner-api`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  let guideRoutes: MetadataRoute.Sitemap = [];
  let scammerRoutes: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${backendUrl}/guides`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const raw = await res.json();
      const guides = Array.isArray(raw) ? raw : raw?.data?.data || raw?.data || [];
      guideRoutes = guides
        .filter((g: any) => g.slug)
        .map((g: any) => ({
          url: `${baseUrl}/guides/${g.slug}`,
          lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (_) {}

  try {
    const scamRes = await fetch(`${backendUrl}/scammer-reports/public-list?limit=200`, {
      next: { revalidate: 1800 },
    });
    if (scamRes.ok) {
      const raw = await scamRes.json();
      const scammers = Array.isArray(raw) ? raw : raw?.data?.data || raw?.data || [];
      const seenIdentifiers = new Set<string>();
      for (const s of scammers) {
        const identifier = encodeURIComponent((s.phone || s.id || '').trim());
        if (identifier && !seenIdentifiers.has(identifier)) {
          seenIdentifiers.add(identifier);
          scammerRoutes.push({
            url: `${baseUrl}/check/${identifier}`,
            lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.85,
          });
        }
      }
    }
  } catch (_) {}

  return [...staticRoutes, ...guideRoutes, ...scammerRoutes];
}
