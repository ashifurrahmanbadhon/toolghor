import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { siteConfig } from '@/data/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
    <html lang="bn" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="/assets/style.css" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
