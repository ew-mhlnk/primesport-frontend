// types/news.ts
export interface NewsPost {
  id:       number;
  slug:     string;
  date:     string;
  modified: string;
  title:    { rendered: string };
  content:  { rendered: string };
  excerpt:  { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url:  string;
      alt_text:    string;
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
    seo_title?:          string;
    seo_description?:    string;
    tg_post_url?:        string;  // старое название
    telegram_post_url?:  string;  // новое название
  };
}