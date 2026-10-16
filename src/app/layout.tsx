import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { siteConfig } from '@/data/config';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import SmoothCursor from '@/components/SmoothCursor';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'ToolGhor – Everyday tools, now on one platform',
  description: `${siteConfig.taglineEn}. 27+ everyday productivity, document, image, and media tools processed 100% in your browser.`,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: [
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/favicon.png', type: 'image/png' },
      { url: '/assets/logo-icon.png', type: 'image/png' },
    ],
    apple: '/assets/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'ToolGhor – Everyday tools, now on one platform',
    description: '27+ everyday web tools processed 100% in your browser. Document, Image, Calculator, QR & Media tools without ads or sign-up walls.',
    url: siteConfig.url,
    siteName: 'ToolGhor',
    type: 'website',
    images: [
      {
        url: `${siteConfig.url}/assets/logo-dark.png`,
        width: 1200,
        height: 630,
        alt: 'ToolGhor Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolGhor – Everyday tools, now on one platform',
    description: '27+ everyday web tools processed 100% in your browser. Fast, private and free.',
    images: [`${siteConfig.url}/assets/logo-dark.png`],
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ToolGhor',
    url: siteConfig.url,
    description: 'Everyday productivity tools processed 100% in your browser.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#09130f" />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/assets/logo-icon.png" />
        <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var l = localStorage.getItem('lang') || localStorage.getItem('toolghor_lang') || 'en';
                document.documentElement.lang = l;
                if (window.location.pathname === '/' || window.location.pathname === '') {
                  document.title = (l === 'bn') 
                    ? 'ToolGhor – দৈনন্দিন কাজের সব টুল' 
                    : 'ToolGhor – Everyday tools, now on one platform';
                }
              } catch (e) {}
            `,
          }}
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@500;700;800&family=Hind+Siliguri:wght@400;500;600&display=swap"
        />
        <link rel="stylesheet" href="/assets/style.css" />
        <script src="/assets/config.js" defer></script>
        <script src="/assets/registry.js" defer></script>
        <script src="/assets/icons.js" defer></script>
        <script src="/assets/ui.js" defer></script>
      </head>
      <body className="dark" suppressHydrationWarning>
        <SmoothCursor />
        <BackgroundAnimation />
        <AppProvider>{children}</AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
