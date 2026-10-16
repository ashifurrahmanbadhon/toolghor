import { MetadataRoute } from 'next';
import { TOOLS } from '@/data/registry';
import { siteConfig } from '@/data/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url || 'https://toolghor.vercel.app';
  const lastModified = new Date();

  // Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Tool Pages
  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...routes, ...toolRoutes];
}
