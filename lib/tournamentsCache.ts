import { supabase } from './supabase';

export type TournamentInfo = {
  nameRu:   string;
  surface?: string;
  category?: string;
  city?:    string;
  country?: string;
};

let cache: { map: Record<string, TournamentInfo>; ts: number } | null = null;
const TTL = 30 * 60 * 1000; // 30 минут — турниры меняются реже

export async function getTournamentsMap(): Promise<Record<string, TournamentInfo>> {
  if (cache && Date.now() - cache.ts < TTL) return cache.map;

  // ✅ Используем event_type_en + фильтр show_in_schedule
  const { data, error } = await supabase
    .from('tournaments')
    .select('name_en, name_ru, surface, category, city, country, event_type_en')
    .eq('show_in_schedule', true);

  if (error || !data) {
    console.error('❌ Supabase tournaments error:', error);
    return cache?.map ?? {};
  }

  // ✅ Составной ключ: name_en__event_type (с нормализацией WTA/ATP)
  const map: Record<string, TournamentInfo> = {};
  for (const row of data) {
    if (row.name_en && row.event_type_en) {
      const typeNorm = row.event_type_en?.toLowerCase().includes('wta') ? 'wta' 
                     : row.event_type_en?.toLowerCase().includes('atp') ? 'atp' 
                     : null;
      const key = `${row.name_en.toLowerCase().trim()}__${typeNorm || row.event_type_en?.toLowerCase().trim()}`;
      map[key] = {
        nameRu:   row.name_ru || row.name_en,
        surface:  row.surface,
        category: row.category,
        city:     row.city,
        country:  row.country,
      };
    }
  }

  cache = { map, ts: Date.now() };
  
  console.log(`✅ Tournaments cache loaded: ${Object.keys(map).length} entries`);
  
  return map;
}