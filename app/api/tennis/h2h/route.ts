// app/api/h2h/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CACHE_TTL_DAYS = 7; // обновляем раз в неделю

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Нормализуем пару — меньший ключ всегда первый
// чтобы (A,B) и (B,A) хранились в одной записи
function normalizeKeys(p1: string, p2: string): [string, string] {
  return p1 < p2 ? [p1, p2] : [p2, p1];
}

function isStale(fetchedAt: string): boolean {
  const diff = Date.now() - new Date(fetchedAt).getTime();
  return diff > CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawP1 = searchParams.get('p1');
  const rawP2 = searchParams.get('p2');

  if (!rawP1 || !rawP2) {
    return NextResponse.json({ error: 'Player keys required' }, { status: 400 });
  }

  const [p1, p2] = normalizeKeys(rawP1, rawP2);
  const supabase = getSupabase();

  // ── 1. Проверяем Supabase кеш ──────────────────────────────────────────
  const { data: cached } = await supabase
    .from('h2h_cache')
    .select('data, fetched_at')
    .eq('player1_key', p1)
    .eq('player2_key', p2)
    .single();

  if (cached && !isStale(cached.fetched_at)) {
    // Свежие данные есть — возвращаем из Supabase, API не трогаем
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  // ── 2. Нет кеша или устарел — идём в API ──────────────────────────────
  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) {
    // Если вдруг нет API ключа но есть старый кеш — вернём его
    if (cached) return NextResponse.json(cached.data, { headers: { 'X-Cache': 'STALE' } });
    return NextResponse.json({ error: 'No API key' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.api-tennis.com/tennis/?method=get_H2H&APIkey=${apiKey}&first_player_key=${rawP1}&second_player_key=${rawP2}`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error('API error');

    const json = await res.json();
    const result = json.result ?? {};

    const payload = {
      h2h:       (result.H2H ?? []).slice(0, 10),
      p1Results: (result.firstPlayerResults  ?? []).slice(0, 5),
      p2Results: (result.secondPlayerResults ?? []).slice(0, 5),
    };

    // ── 3. Сохраняем в Supabase (upsert) ──────────────────────────────
    await supabase.from('h2h_cache').upsert({
      player1_key: p1,
      player2_key: p2,
      data:        payload,
      fetched_at:  new Date().toISOString(),
    }, {
      onConflict: 'player1_key,player2_key',
    });

    return NextResponse.json(payload, {
      headers: { 'X-Cache': 'MISS' },
    });

  } catch {
    // Если API упал — отдаём старый кеш если есть
    if (cached) return NextResponse.json(cached.data, { headers: { 'X-Cache': 'STALE' } });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}