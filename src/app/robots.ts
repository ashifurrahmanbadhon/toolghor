import { MetadataRoute } from 'next';
import { siteConfig } from '@/data/config';

export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (siteConfig.url || 'https://toolghor.vercel.app').replace(/\/+$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
