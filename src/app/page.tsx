import { Metadata } from 'next';
import { getPublicSiteData } from '@/lib/siteData';
import { SEO_TITLES } from '@/data/seoData';
import { siteConfig } from '@/data/config';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const homeDescription =
  'Free online tools for everyday tasks — merge & compress PDF, edit images, make QR codes, convert currency, build resumes. No sign-up, in your browser.';

export const metadata: Metadata = {
  title: SEO_TITLES['home'],
  description: homeDescription,
  openGraph: {
    title: SEO_TITLES['home'],
    description: homeDescription,
  },
  twitter: {
    title: SEO_TITLES['home'],
    description: homeDescription,
  },
  alternates: {
    canonical: `${siteConfig.url}/`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
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
