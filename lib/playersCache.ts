import { supabase } from './supabase';

export type PlayerInfo = {
  displayRu: string;
  flag:      string;
  photoUrl?: string;
  ranking?:  number;
};

// Кэш в памяти — не долбим БД на каждый запрос
let cache: { map: Record<string, PlayerInfo>; ts: number } | null = null;
const TTL = 10 * 60 * 1000; // 10 минут

export async function getPlayersMap(): Promise<Record<string, PlayerInfo>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.map;

  const { data, error } = await supabase
    .from('players')
    .select('display_en, display_ru, flag, photo_url, ranking');

  if (error || !data) {
    console.error('❌ Supabase players error:', error);
    return cache?.map ?? {};
  }

  const map: Record<string, PlayerInfo> = {};
  for (const row of data) {
    if (row.display_en) {
      map[row.display_en.toLowerCase().trim()] = {
        displayRu: row.display_ru || row.display_en,
        flag:      row.flag || '',
        photoUrl:  row.photo_url,
        ranking:   row.ranking,
      };
    }
  }

  cache = { map, ts: Date.now() };
  return cache.map;
}