/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { getPlayersMap }     from '@/lib/playersCache';
import { getTournamentsMap } from '@/lib/tournamentsCache';
import { initTennisWs }      from '@/lib/tennisWs';

// 👇 ДОБАВЛЕНЫ ДВЕ СТРОЧКИ — ОТКЛЮЧАЕМ КЭШ РОУТА:
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 0 означает полное отключение кэша роута

export interface FormattedMatch {
  id:             number;
  time:           string;
  player1:        string;
  player2:        string;
  player1Flag:    string;
  player2Flag:    string;
  tournament:     string;
  tournamentMeta?: {
    surface?:  string;
    category?: string;
    city?:     string;
  };
  status:         string;
  score:          string;
  dateLabel:      string;
  rawTimestamp:   number;
}

interface RawMatch {
  event_key:           string | number;
  event_time:          string;
  event_date:          string;
  event_first_player:  string;
  event_second_player: string;
  tournament_name:     string;
  event_type_type?:    string;
  event_status:        string;
  event_live:          string;
  event_final_result?: string;
  event_game_result?: string;
  scores?: Array<{
    score_first: string;
    score_second: string;
  }>;
}

function translateStatus(status: string) {
  if (!status) return 'Ожидается';
  const s = status.toLowerCase();
  
  if (s.includes('finished') || s.includes('ended')) return 'Завершен';
  if (s.includes('set 1')) return '1-й сет';
  if (s.includes('set 2')) return '2-й сет';
  if (s.includes('set 3')) return '3-й сет';
  if (s.includes('set 4')) return '4-й сет';
  if (s.includes('set 5')) return '5-й сет';
  if (s.includes('retired')) return 'Отказ';
  if (s.includes('walkover')) return 'Техн. поражение';
  if (s.includes('interrupted') || s.includes('suspended')) return 'Прерван';
  if (s.includes('delayed')) return 'Задержан';
  if (s.includes('cancelled')) return 'Отменен';
  if (s.includes('live')) return 'В игре';
  return status; 
}

function formatName(name: string) {
  if (!name) return '';
  if (name.includes('.')) return name; 
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return name;
}

function getMskDate(offsetDays: number) {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  // 🔥 Запускаем фоновый вебсокет (запустится только 1 раз благодаря global)
  initTennisWs();

  try {
    const apiKey = process.env.SPORTS_API_KEY;
    
    if (!apiKey) {
      console.error("❌ ОШИБКА: Переменная SPORTS_API_KEY пустая!");
      return NextResponse.json({ error: 'API ключ не найден' }, { status: 500 });
    }

    // Читаем ?date= из URL
    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get('date');

    // Определяем какие даты фетчить
    const datesToFetch = requestedDate
      ? [requestedDate]
      : [getMskDate(-1), getMskDate(0), getMskDate(1)];

    // Загружаем справочники параллельно
    const [players, tournaments] = await Promise.all([
      getPlayersMap(),
      getTournamentsMap(),
    ]);

    // Хелпер матчинга игроков
    const lookupPlayer = (raw: string) =>
      players[raw.toLowerCase().trim()] ?? null;

    // ✅ Нормализация типа турнира (WTA/ATP)
    const normalizeType = (type?: string): string | null => {
      if (!type) return null;
      const t = type.toLowerCase().trim();
      if (t.includes('wta')) return 'wta';
      if (t.includes('atp')) return 'atp';
      return t;
    };

    const today = getMskDate(0);

    const fetchDay = async (dateStr: string): Promise<RawMatch[]> => {
      const url = `https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiKey}&date_start=${dateStr}&date_stop=${dateStr}`;
      
      // ✅ ИЗМЕНЕНО: убрали next: { revalidate: 15 }, теперь всегда свежие данные
      const res = await fetch(url, { cache: 'no-store' });
      
      if (!res.ok) {
        console.error(`❌ Ошибка HTTP ${res.status} при запросе за ${dateStr}`);
        return [];
      }
      
      const data = await res.json();

      if (data.error && data.error !== 0 && data.error !== "0") {
        console.error(`❌ Ошибка от API-Tennis:`, JSON.stringify(data.result));
        return [];
      }

      console.log(`✅ Найдено матчей за ${dateStr}:`, data.result?.length || 0);

      return (data.result || []) as RawMatch[];
    };

    // Фетчим все нужные даты параллельно
    const results = await Promise.all(datesToFetch.map(fetchDay));
    const rawMatches: RawMatch[] = results.flat();

    const upcoming: FormattedMatch[] = [];
    const live: FormattedMatch[] = [];
    const finished: FormattedMatch[] = [];

    // Убираем дубли по event_key
    const uniqueMatches = Array.from(new Map(rawMatches.map(m => [m.event_key, m])).values());

    console.log('🔑 Tournament keys in cache:', Object.keys(tournaments));
    console.log('📋 Sample match:', JSON.stringify({
      tournament_name: uniqueMatches[0]?.tournament_name,
      event_type_type: uniqueMatches[0]?.event_type_type,
    }, null, 2));

    // ✅ УМНАЯ ФИЛЬТРАЦИЯ (Частичное совпадение)
    uniqueMatches
      .filter((m: any) => {
        const apiName = m.tournament_name?.toLowerCase().trim() || '';
        const typeNorm = normalizeType(m.event_type_type);
        
        // Ищем, есть ли в нашей БД турнир, название которого СОДЕРЖИТСЯ в названии из API
        // Например: в БД "madrid", а API прислал "mutua madrid open"
        const matchedDbKey = Object.keys(tournaments).find(dbKey => {
          const [dbName, dbType] = dbKey.split('__'); // Разбиваем составной ключ
          
          // Проверяем, что английское название из БД есть внутри названия из API
          const nameMatches = apiName.includes(dbName);
          // Если в БД указан тип (atp/wta), проверяем и его
          const typeMatches = !dbType || dbType === typeNorm;

          return nameMatches && typeMatches;
        });

        // ВРЕМЕННЫЙ ЛОГ для дебага: раскомментируйте, если хотите увидеть, что отсекается
        // if (apiName.includes('madrid')) {
        //   console.log(`🎾 Дебаг Мадрида -> API: "${apiName}", Найдено в БД: ${!!matchedDbKey}`);
        // }

        return !!matchedDbKey; // Если нашли совпадение - пропускаем матч
      })
      .forEach((match: RawMatch) => {
        const isLive = match.event_live === "1";
        const isFinished = match.event_status === "Finished" 
                        || match.event_status === "Ended" 
                        || match.event_status === "Retired" 
                        || match.event_status === "Walkover";
        
        // Умный dateLabel в зависимости от режима
        let dateLabel: string;
        
        if (requestedDate) {
          if (match.event_date === today) {
            dateLabel = 'Сегодня';
          } else if (match.event_date === getMskDate(-1)) {
            dateLabel = 'Вчера';
          } else if (match.event_date === getMskDate(1)) {
            dateLabel = 'Завтра';
          } else {
            const parts = match.event_date.split('-');
            const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 
                           'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
            dateLabel = `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
          }
        } else {
          const yesterday = getMskDate(-1);
          const tomorrow = getMskDate(1);
          
          if (match.event_date === yesterday) dateLabel = 'Вчера';
          else if (match.event_date === today) dateLabel = 'Сегодня';
          else if (match.event_date === tomorrow) dateLabel = 'Завтра';
          else dateLabel = match.event_date.split('-').reverse().join('.');
        }

        // Блок форматирования со справочниками
        const p1raw = formatName(match.event_first_player);
        const p2raw = formatName(match.event_second_player);
        const p1    = lookupPlayer(p1raw);
        const p2    = lookupPlayer(p2raw);
        
        // ✅ ОБНОВЛЕННЫЙ ПОИСК ТУРНИРА (для перевода на русский)
        const apiName = match.tournament_name?.toLowerCase().trim() || '';
        const typeNorm = normalizeType(match.event_type_type);
        const matchedDbKey = Object.keys(tournaments).find(dbKey => {
          const [dbName, dbType] = dbKey.split('__');
          return apiName.includes(dbName) && (!dbType || dbType === typeNorm);
        });
        const tour = matchedDbKey ? tournaments[matchedDbKey] : null;

        // Логируем незнакомых игроков
        if (!p1) console.warn(`⚠️ Игрок не в БД: "${p1raw}"`);
        if (!p2) console.warn(`⚠️ Игрок не в БД: "${p2raw}"`);

        // ✅ ИСПРАВЛЕНИЕ: Парсим массив `scores`, если он есть
        let finalScore = match.event_final_result || match.event_game_result || '';
        if (match.scores && Array.isArray(match.scores) && match.scores.length > 0) {
          finalScore = match.scores
            .map(s => `${s.score_first}-${s.score_second}`)
            .join(', ');
        }

        const formattedMatch: FormattedMatch = {
          id:            Number(match.event_key),
          time:          match.event_time,
          player1:       p1?.displayRu  ?? p1raw,
          player2:       p2?.displayRu  ?? p2raw,
          player1Flag:   p1?.flag       ?? '',
          player2Flag:   p2?.flag       ?? '',
          tournament:    tour?.nameRu   ?? match.tournament_name,
          tournamentMeta: tour ? {
            surface:  tour.surface,
            category: tour.category,
            city:     tour.city,
          } : undefined,
          status:        translateStatus(match.event_status),
          score:         finalScore,
          dateLabel,
          rawTimestamp:  new Date(`${match.event_date}T${match.event_time}`).getTime(),
        };

        if (isLive) {
          live.push(formattedMatch);
        } else if (isFinished) {
          finished.push(formattedMatch);
        } else {
          upcoming.push(formattedMatch);
        }
      });

    upcoming.sort((a, b) => a.rawTimestamp - b.rawTimestamp);
    finished.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

    return NextResponse.json({ upcoming, live, finished });

  } catch (error) {
    console.error('❌ Критическая ошибка в роутере тенниса:', error);
    return NextResponse.json(
      { upcoming: [], live: [], finished: [] },
      { status: 500 }
    );
  }
}