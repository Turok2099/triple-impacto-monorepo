import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }[] = [
    { path: '', changeFrequency: 'weekly', priority: 1 },
    { path: '/ongs', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/faqs', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/politica-de-cookies', changeFrequency: 'yearly', priority: 0.3 },
  ];

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
