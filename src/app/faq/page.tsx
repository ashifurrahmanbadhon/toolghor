import { Metadata } from 'next';
import { GENERAL_FAQ } from '@/data/seoData';
import { siteConfig } from '@/data/config';
import FaqClient from './FaqClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | ToolGhor',
  description:
    'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  openGraph: {
    title: 'Frequently Asked Questions | ToolGhor',
    description:
      'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  },
  twitter: {
    title: 'Frequently Asked Questions | ToolGhor',
    description:
      'Answers to common questions about ToolGhor — free online PDF, image, QR, video tools, calculators and resume builder. ToolGhor সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  },
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
};

export default function FaqPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GENERAL_FAQ.map((f) => ({
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
          __html: JSON.stringify(faqSchema),
        }}
      />
      <FaqClient />
    </>
  );
}
