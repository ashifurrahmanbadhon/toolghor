import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GUIDES, GUIDES_BY_SLUG } from '@/data/guides';
import { siteConfig } from '@/data/config';
import GuideArticle from '@/components/GuideArticle';
import { getGuideBySlug } from '@/lib/guidesData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = (await getGuideBySlug(slug)) || GUIDES_BY_SLUG[slug];

  if (!guide) {
    return {
      title: 'Guide Not Found | ToolGhor',
    };
  }

  const title = guide.metaTitle;
  const description = guide.metaDescription;
  const canonicalUrl = `${siteConfig.url}/guides/${guide.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${guide.title.en} - ToolGhor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = (await getGuideBySlug(slug)) || GUIDES_BY_SLUG[slug];

  if (!guide) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title.en,
    description: guide.metaDescription,
    datePublished: guide.datePublished,
    author: {
      '@type': 'Organization',
      name: 'ToolGhor',
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ToolGhor',
      url: siteConfig.url,
    },
    mainEntityOfPage: `${siteConfig.url}/guides/${guide.slug}`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((f) => ({
      '@type': 'Question',
      name: f.en.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.en.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <GuideArticle guide={guide} />
    </>
  );
}
