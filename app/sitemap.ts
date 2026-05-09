// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getNewsPosts } from '@/lib/news';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://primesport.tv';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getNewsPosts(100);

  const newsUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url:              `${SITE_URL}/news/${post.slug}`,
    lastModified:     new Date(post.modified),
    changeFrequency:  'weekly',
    priority:         0.7,
  }));

  return [
    {
      url:             SITE_URL,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        1,
    },
    {
      url:             `${SITE_URL}/news`,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        0.9,
    },
    {
      url:             `${SITE_URL}/tennis`,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        0.85,
    },
    ...newsUrls,
  ];
}