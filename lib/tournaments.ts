// lib/tournaments.ts
import { createClient } from '@supabase/supabase-js';

// Отдельный клиент для серверных запросов — без кеша Next.js
// Без этого Next.js кеширует fetch-запросы Supabase и не видит изменений в БД
function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}

export type Tournament = {
  id:           number;
  slug:         string;
  name_ru:      string;
  name_en:      string;
  cover_url?:   string;
  surface?:     string;
  category?:    string;
  city?:        string;
  country?:     string;       // код страны для флага, напр. "ES"
  wp_tag_name:  string;       // точное совпадение с acf.match_tournament
  is_featured:  boolean;
};

/* Турниры для виджета на главной */
export async function getFeaturedTournaments(): Promise<Tournament[]> {
  const { data, error } = await getServerClient()
    .from('tournaments')
    .select('id, slug, name_ru, name_en, cover_url, surface, category, city, country, wp_tag_name, is_featured')
    .eq('is_featured', true)
    .order('name_ru');

  if (error || !data) {
    console.error('tournaments fetch error:', error);
    return [];
  }
  return data as Tournament[];
}

/* Все турниры для страницы /tennis */
export async function getAllTournaments(): Promise<Tournament[]> {
  const { data, error } = await getServerClient()
    .from('tournaments')
    .select('id, slug, name_ru, name_en, cover_url, surface, category, city, country, wp_tag_name, is_featured')
    .order('name_ru');

  if (error || !data) return [];
  return data as Tournament[];
}

/* Один турнир по slug */
export async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  const { data, error } = await getServerClient()
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Tournament;
}

/* Утилита: код страны → эмодзи флага */
export function countryToFlag(code?: string): string {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + 127397,
    code.toUpperCase().charCodeAt(1) + 127397,
  );
}