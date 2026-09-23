import type { Metadata } from 'next';
import GuideDetailClient, { GuideItem } from './GuideDetailClient';

const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://safnexbd.com';
const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || `${getBaseUrl()}/api/v1`;

async function fetchGuide(slug: string): Promise<GuideItem | null> {
  try {
    const res = await fetch(`${getApiUrl()}/guides/${slug}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ? data : data?.data?.data || data?.data || null;
  } catch (err) {
    return null;
  }
}

async function fetchOtherGuides(currentSlug: string): Promise<GuideItem[]> {
  try {
    const res = await fetch(`${getApiUrl()}/guides`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list: GuideItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : data?.data?.data || [];
    return list.filter((g) => g.slug !== currentSlug).slice(0, 4);
  } catch (err) {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  const baseUrl = getBaseUrl();

  if (!guide) {
    return {
      title: 'Guide Not Found | SafnexBD Official',
      description: 'The requested safe trading tutorial could not be found.',
    };
  }

  // Strip html for clean description
  const cleanDescription = guide.description
    ? guide.description
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160)
    : 'SafnexBD Official Safe Trading Guide & Tutorial.';

  const imageUrl = guide.coverImage
    ? guide.coverImage.startsWith('http')
      ? guide.coverImage
      : `${baseUrl}${guide.coverImage.startsWith('/') ? '' : '/'}${guide.coverImage}`
    : `${baseUrl}/icon-512.png`;

  return {
    title: `${guide.title} | SafnexBD Official Guide`,
    description: cleanDescription,
    alternates: {
      canonical: `${baseUrl}/guides/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: cleanDescription,
      url: `${baseUrl}/guides/${guide.slug}`,
      siteName: 'SafnexBD',
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await fetchGuide(slug);
  const otherGuides = await fetchOtherGuides(slug);
  const baseUrl = getBaseUrl();

  // Generate Article JSON-LD Schema for rich search results
  const jsonLd = guide
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        description: guide.description
          ? guide.description
              .replace(/<[^>]*>?/gm, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 200)
          : guide.title,
        image: guide.coverImage || `${baseUrl}/icon-512.png`,
        datePublished: guide.createdAt,
        dateModified: guide.updatedAt || guide.createdAt,
        author: {
          '@type': 'Organization',
          name: 'SafnexBD',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'SafnexBD',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/icon-192.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}/guides/${guide.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <GuideDetailClient
        slug={slug}
        initialGuide={guide}
        initialOthers={otherGuides}
      />
    </>
  );
}
