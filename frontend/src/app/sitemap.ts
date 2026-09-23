import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://safnexbd.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
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
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
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

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://safnexbd.com/api/v1';
    const res = await fetch(`${backendUrl}/guides`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const raw = await res.json();
      const guides = Array.isArray(raw) ? raw : raw?.data?.data || raw?.data || [];
      const guideRoutes: MetadataRoute.Sitemap = guides
        .filter((g: any) => g.slug)
        .map((g: any) => ({
          url: `${baseUrl}/guides/${g.slug}`,
          lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      return [...staticRoutes, ...guideRoutes];
    }
  } catch (_) {}

  return staticRoutes;
}

