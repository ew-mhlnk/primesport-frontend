// types/news.ts  — добавить в types/index.ts

export interface NewsPost {
  id: number;
  slug: string;
  date: string;           // ISO 8601
  modified: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text:   string;
      media_details?: {
        sizes?: {
          medium_large?: { source_url: string };
          large?:        { source_url: string };
          full?:         { source_url: string };
        };
      };
    }>;
    author?: Array<{ name: string }>;
  };
  acf?: {
    seo_title?:        string;   // SEO Title из Make.com
    seo_description?:  string;   // SEO Description
    tg_post_url?: string;  // Telegram Post URL для комментариев
  };
}