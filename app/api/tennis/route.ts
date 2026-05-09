import { NextResponse } from 'next/server';
import { getPlayersMap }     from '@/lib/playersCache';
import { getTournamentsMap } from '@/lib/tournamentsCache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface FormattedMatch {
  id:                number;
  time:              string;
  player1:           string;
  player2:           string;
  player1Flag:       string;
  player2Flag:       string;
  player1Rank?:      number;
  player2Rank?:      number;
  tournament:        string;
  tournamentCountry?: string;
  tournamentMeta?: {
    surface?:  string;
    category?: string;
    city?:     string;
  };
  court?:            string;
  status:            string;
  score:             string;
  dateLabel:         string;
  rawTimestamp:      number;
  serving?:          '1' | '2' | null;
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
  event_game_result?:  string;
  event_serve?:        string | null;
  event_winner?:       string | null;
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
  if (name.includes('/')) return name.trim();
  if (name.includes('.')) return name;
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
  }
  return name;
}

function getMskDate(offsetDays: number) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  d.setDate(d.getDate() + offsetDays);
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isEliteMatch(typeStr: string): boolean {
  const t = typeStr.toLowerCase();
  if (t.includes('doubles'))    return false;
  if (t.includes('itf'))        return false;
  if (t.includes('challenger')) return false;
  if (t.includes('exhibition')) return false;
  if (t.includes('boys'))       return false;
  if (t.includes('girls'))      return false;
  if (t.includes('atp') || t.includes('wta') || t.includes('grand slam')) return true;
  return false;
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.SPORTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API ключ не найден' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get('date');

    const today     = getMskDate(0);
    const yesterday = getMskDate(-1);
    const tomorrow  = getMskDate(1);

    const datesToFetch = requestedDate
      ? [requestedDate]
      : [getMskDate(-1), getMskDate(0), getMskDate(1)];

    const [players, tournaments, liveRes] = await Promise.all([
      getPlayersMap(),
      getTournamentsMap(),
      fetch(
        `https://api.api-tennis.com/tennis/?method=get_livescore&APIkey=${apiKey}`,
        { cache: 'no-store' }
      ),
    ]);

    const fetchDay = async (dateStr: string): Promise<RawMatch[]> => {
      const url = `https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiKey}&date_start=${dateStr}&date_stop=${dateStr}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      if (data.error && data.error !== 0 && data.error !== '0') return [];
      return (data.result || []) as RawMatch[];
    };

    const [fixtureResults, liveData] = await Promise.all([
      Promise.all(datesToFetch.map(fetchDay)),
      liveRes.ok ? liveRes.json() : Promise.resolve({ result: [] }),
    ]);

    const fixtureMatches: RawMatch[] = fixtureResults.flat();
    const liveMatches:    RawMatch[] = (liveData.result || []) as RawMatch[];

    const liveKeys = new Set(liveMatches.map(m => String(m.event_key)));

    const lookupPlayer = (raw: string) => players[raw.toLowerCase().trim()] ?? null;

    const normalizeType = (type?: string): string | null => {
      if (!type) return null;
      const t = type.toLowerCase().trim();
      if (t.includes('wta')) return 'wta';
      if (t.includes('atp')) return 'atp';
      return t;
    };

    const makeDateLabel = (eventDate: string): string => {
      if (eventDate === yesterday) return 'Вчера';
      if (eventDate === today)     return 'Сегодня';
      if (eventDate === tomorrow)  return 'Завтра';
      const parts  = eventDate.split('-');
      const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
      return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
    };

    const formatMatch = (match: RawMatch, forceLive = false): FormattedMatch | null => {
      const typeStr = match.event_type_type || '';
      if (!isEliteMatch(typeStr)) return null;

      const p1raw = formatName(match.event_first_player);
      const p2raw = formatName(match.event_second_player);
      const p1    = lookupPlayer(p1raw);
      const p2    = lookupPlayer(p2raw);

      const apiName  = match.tournament_name?.toLowerCase().trim() || '';
      const typeNorm = normalizeType(match.event_type_type);
      const matchedDbKey = Object.keys(tournaments).find(dbKey => {
        const [dbName, dbType] = dbKey.split('__');
        return apiName.includes(dbName) && (!dbType || dbType === typeNorm);
      });
      const tour = matchedDbKey ? tournaments[matchedDbKey] : null;

      let finalScore = '';
      if (match.scores && Array.isArray(match.scores) && match.scores.length > 0) {
        finalScore = match.scores
          .map(s => `${s.score_first}-${s.score_second}`)
          .join(', ');
      } else {
        finalScore = match.event_final_result || '';
      }

      const gameResult = match.event_game_result;
      if (
        forceLive &&
        gameResult &&
        gameResult !== '-' &&
        gameResult !== '0 - 0' &&
        gameResult !== '0-0'
      ) {
        finalScore += ` (${gameResult})`;
      }

      let serving: '1' | '2' | null = null;
      if (match.event_serve === 'First Player')  serving = '1';
      if (match.event_serve === 'Second Player') serving = '2';

      return {
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
        dateLabel:     makeDateLabel(match.event_date),
        rawTimestamp:  new Date(`${match.event_date}T${match.event_time}`).getTime(),
        serving,
      };
    };

    const upcoming: FormattedMatch[] = [];
    const live:     FormattedMatch[] = [];
    const finished: FormattedMatch[] = [];

    liveMatches.forEach(match => {
      const fm = formatMatch(match, true);
      if (fm) live.push(fm);
    });

    const uniqueFixtures = Array.from(
      new Map(fixtureMatches.map(m => [m.event_key, m])).values()
    );

    uniqueFixtures.forEach(match => {
      if (liveKeys.has(String(match.event_key))) return;

      const isFinished =
        match.event_status === 'Finished' ||
        match.event_status === 'Ended'    ||
        match.event_status === 'Retired'  ||
        match.event_status === 'Walkover';

      const fm = formatMatch(match, false);
      if (!fm) return;

      if (isFinished) {
        finished.push(fm);
      } else {
        upcoming.push(fm);
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