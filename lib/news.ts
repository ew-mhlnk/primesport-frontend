// lib/news.ts
import type { NewsPost } from '@/types/news';

export type { NewsPost };

const WP_API = process.env.NEXT_PUBLIC_WP_API!;

// ── Category IDs — задай свои из WordPress ──────────────────────────
// Узнать: WP Admin → Рубрики → навести мышь → в статус-баре будет ?tag_ID=X
export const WP_CATEGORY = {
  NEWS:   73,     // рубрика "News"
  TENNIS: 224,  // рубрика "Теннис" (поставь правильный ID)
} as const;

// ── News posts (только рубрика News) ───────────────────────────────
export async function getNewsPosts(count = 10): Promise<NewsPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?_embed&per_page=${count}&orderby=date&order=desc&categories=${WP_CATEGORY.NEWS}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Single news post by slug ────────────────────────────────────────
export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  try {
    const res = await fetch(
      `${WP_API}/posts?slug=${slug}&_embed&categories=${WP_CATEGORY.NEWS}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data: NewsPost[] = await res.json();
    return data[0] ?? null;
  } catch {
    return null;
  }
}

// ── Broadcast posts (только рубрика Теннис / Трансляции) ───────────
// Используется в HeroLive и BroadcastCarousel вместо getPosts()
export async function getBroadcastPosts(count = 20): Promise<NewsPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?_embed&per_page=${count}&orderby=date&order=desc&categories=${WP_CATEGORY.TENNIS}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
export function getPostImage(
  post: NewsPost,
  size: 'full' | 'large' | 'medium_large' = 'full'
): string {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  return (
    media?.media_details?.sizes?.[size]?.source_url ??
    media?.source_url ??
    ''
  );
}

export function getPostImageAlt(post: NewsPost): string {
  return post._embedded?.['wp:featuredmedia']?.[0]?.alt_text ?? post.title.rendered;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}