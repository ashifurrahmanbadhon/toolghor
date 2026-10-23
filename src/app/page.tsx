import { Metadata } from 'next';
import { getPublicSiteData } from '@/lib/siteData';
import { SEO_TITLES, HOME_FAQ } from '@/data/seoData';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: SEO_TITLES['home'],
  openGraph: {
    title: SEO_TITLES['home'],
  },
  twitter: {
    title: SEO_TITLES['home'],
  },
};

export default async function Page() {
  const initialData = await getPublicSiteData();

  // Safely inject initial creator & API config for window globals
  const creatorConfigScript = initialData?.creatorAbout
    ? `window.CREATOR_CONFIG = ${JSON.stringify(initialData.creatorAbout)};`
    : '';

  // Structured Data (JSON-LD)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ToolGhor',
    url: 'https://toolghor.vercel.app',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map((f) => ({
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
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      {creatorConfigScript && (
        <script
          dangerouslySetInnerHTML={{
            __html: creatorConfigScript,
          }}
        />
      )}
      <HomeClient initialData={initialData} />
    </>
  );
}
