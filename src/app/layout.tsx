import type { Metadata, Viewport } from 'next';
import { Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { siteConfig, ASSET_VERSION } from '@/data/config';
import FloatingAdminPanel from '@/components/FloatingAdminPanel';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import SmoothCursor from '@/components/SmoothCursor';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  display: 'swap',
  variable: '--font-hind-siliguri',
});

export const viewport: Viewport = {
  themeColor: '#09130f',
};

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ToolGhor',
  },
  title: 'Free Online Tools — PDF, Image, QR, Video | ToolGhor',
  description: `${siteConfig.taglineEn}. Everyday productivity and file tools in your browser.`,
  metadataBase: new URL(siteConfig.url),
  verification: {
    google: 'HA3zZE7sqmr2f-OW02PChHvJ-DAEa2QGWe1TIJK1rPA',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: 'ToolGhor',
    title: 'ToolGhor – Everyday tools, now on one platform',
    description: `${siteConfig.taglineEn}. Everyday productivity and file tools in your browser.`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ToolGhor – Everyday tools, now on one platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolGhor – Everyday tools, now on one platform',
    description: `${siteConfig.taglineEn}. Everyday productivity and file tools in your browser.`,
    images: ['/og-image.png'],
  },
  facebook: {
    appId: process.env.NEXT_PUBLIC_FB_APP_ID || '966242223397117',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/logo-icon.png', type: 'image/png' },
      { url: '/assets/favicon.png', type: 'image/png' },
    ],
    apple: '/assets/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
};

import VersionUpdateChecker from '@/components/VersionUpdateChecker';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${hindSiliguri.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#09130f" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ToolGhor" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1290-2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179-2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <meta property="fb:app_id" content="966242223397117" />
        <meta name="fb:app_id" content="966242223397117" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/assets/logo-icon.png" />
        <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var l = localStorage.getItem('lang') || localStorage.getItem('toolghor_lang') || 'en';
                document.documentElement.lang = l;
                if (window.location.pathname === '/' || window.location.pathname === '') {
                  document.title = (l === 'bn') 
                    ? 'ToolGhor – দৈনন্দিন কাজের সব টুল' 
                    : 'Free Online Tools — PDF, Image, QR, Video | ToolGhor';
                }
              } catch (e) {}
            `,
          }}
        />
        <link rel="stylesheet" href={`/assets/style.css?v=${ASSET_VERSION}`} />
        <script src={`/assets/config.js?v=${ASSET_VERSION}`} defer></script>
        <script src={`/assets/registry.js?v=${ASSET_VERSION}`} defer></script>
        <script src={`/assets/icons.js?v=${ASSET_VERSION}`} defer></script>
        <script src={`/assets/ui.js?v=${ASSET_VERSION}`} defer></script>
      </head>
      <body className={`${inter.className} dark`} suppressHydrationWarning>
        <SmoothCursor />
        <BackgroundAnimation />
        <AppProvider>
          <ServiceWorkerRegister />
          <VersionUpdateChecker />
          <FloatingAdminPanel />
          {children}
        </AppProvider>
        <Analytics />
      </body>
    </html>
  );
}
