import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { siteConfig } from '@/data/config';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import SmoothCursor from '@/components/SmoothCursor';

export const metadata: Metadata = {
  title: `${siteConfig.name} – ${siteConfig.tagline}`,
  description: `${siteConfig.taglineEn}. Everyday productivity and file tools in your browser.`,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: '/assets/favicon.png',
    apple: '/assets/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className="dark" suppressHydrationWarning>
      <head>
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
      </body>
    </html>
  );
}
