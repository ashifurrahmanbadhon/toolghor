import { MetadataRoute } from 'next';
import { siteConfig } from '@/data/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url || 'https://toolghor.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/login'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
