'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'upcoming' | 'live' | 'finished';

export interface FormattedMatch {
  id: number;
  time: string;
  player1: string;
  player2: string;
  player1Country?: string;
  player2Country?: string;
  player1Rank?: number;
  player2Rank?: number;
  tournament: string;
  tournamentCountry?: string;
  court?: string;
  status: string;
  score: string;
  dateLabel: string;
  rawTimestamp?: number;
  serving?: '1' | '2' | null;
}

interface MatchesState {
  upcoming: FormattedMatch[];
  live:     FormattedMatch[];
  finished: FormattedMatch[];
}

interface SetScore {
  p1: string;
  p2: string;
  finished: boolean;
}

// ✅ Тип для лайв-обновлений от Supabase
interface ScoreUpdatePayload {
  event_key: number;
  scores?: Array<{
    score_first: string;
    score_second: string;
  }>;
  event_final_result?: string;
  event_game_result?: string;
  event_status?: string;
  event_serve?: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function getMskDate(offset = 0): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  d.setDate(d.getDate() + offset);
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}

function dateLabel(dateStr: string): string {
  const map: Record<string,string> = {
    [getMskDate(-1)]: 'Вчера',
    [getMskDate(0)]:  'Сегодня',
    [getMskDate(1)]:  'Завтра',
    [getMskDate(2)]:  'Послезавтра',
  };
  if (map[dateStr]) return map[dateStr];
  const [y,m,d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function parseSets(score: string, isLive: boolean): SetScore[] {
  if (!score) return [];
  const parts = score.split(',');
  return parts.map((part, idx) => {
    const [a, b] = part.trim().split('-');
    return { p1: a ?? '0', p2: b ?? '0', finished: isLive ? idx < parts.length - 1 : true };
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScheduleWidget() {
  const [tab, setTab]           = useState<Tab>('upcoming');
  const [matches, setMatches]   = useState<MatchesState>({ upcoming: [], live: [], finished: [] });
  const [loading, setLoading]   = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selDate, setSelDate]   = useState(getMskDate(0));
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const upcomingDates = [getMskDate(0), getMskDate(1), getMskDate(2)];
  const finishedDates = [getMskDate(-3), getMskDate(-2), getMskDate(-1), getMskDate(0)];
  const availDates    = tab === 'upcoming' ? upcomingDates : finishedDates;
  const hasCalendar   = tab !== 'live';

  // fetch
  const load = async () => {
    try {
      const res = await fetch('/api/tennis');
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
        const keys = new Set<string>();
        (['upcoming','live','finished'] as Tab[]).forEach(t =>
          (data[t] as FormattedMatch[] || []).forEach(m => keys.add(`${t}__${m.tournament}`))
        );
        setOpenGroups(keys);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ✅ Подписка на лайв-обновления через Supabase Broadcast
  useEffect(() => {
    const channel = supabase.channel('tennis-live-scores');

    channel
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        const updates = Array.isArray(payload) ? payload : [payload] as ScoreUpdatePayload[];
        
        setMatches((prev) => {
          const newLive = [...prev.live];
          let modified = false;

          updates.forEach((upd: ScoreUpdatePayload) => {
            const idx = newLive.findIndex((m) => m.id === upd.event_key);
            if (idx !== -1) {
              // 1. Формируем счет
              let newScore = '';
              if (upd.scores && Array.isArray(upd.scores) && upd.scores.length > 0) {
                newScore = upd.scores.map((s) => `${s.score_first}-${s.score_second}`).join(', ');
              } else {
                newScore = upd.event_final_result || '';
              }
              
              // Добавляем счет в текущем гейме (например "15 - 30")
              if (upd.event_game_result && upd.event_game_result !== '-' && upd.event_game_result !== '0 - 0') {
                 newScore += ` (${upd.event_game_result})`;
              }

              // 2. Обновляем статус
              newLive[idx].score = newScore;
              newLive[idx].status = upd.event_status || newLive[idx].status;
              
              // 3. Обновляем того, кто подает
              if (upd.event_serve === 'First Player') newLive[idx].serving = '1';
              else if (upd.event_serve === 'Second Player') newLive[idx].serving = '2';
              else newLive[idx].serving = null;
              
              modified = true;
            }
          });

          return modified ? { ...prev, live: newLive } : prev;
        });
      })
      .subscribe();

    // Отписываемся при уходе со страницы
    return () => {
      void supabase.removeChannel(channel); // ✅ ИСПРАВЛЕНО: void для unused expression
    };
  }, []);

  // filter by date
  const raw = matches[tab] || [];
  const filtered = tab === 'live' ? raw : raw.filter(m => {
    if (!m.rawTimestamp) return m.dateLabel === dateLabel(selDate);
    const ts = new Date(m.rawTimestamp);
    const d = [ts.getFullYear(), String(ts.getMonth()+1).padStart(2,'0'), String(ts.getDate()).padStart(2,'0')].join('-');
    return d === selDate;
  });

  // group by tournament
  const groups = new Map<string, FormattedMatch[]>();
  filtered.forEach(m => {
    if (!groups.has(m.tournament)) groups.set(m.tournament, []);
    groups.get(m.tournament)!.push(m);
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });

  const dateIdx   = availDates.indexOf(selDate);
  const canPrev   = dateIdx > 0;
  const canNext   = dateIdx < availDates.length - 1;

  return (
    <section className="w-full">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">

        {/* Pill tabs */}
        <div className="flex items-center bg-[#111] border border-[#1f1f1f] rounded-full p-1 gap-0.5">
          {(['upcoming','live','finished'] as Tab[]).map(t => (
            <TabPill key={t} value={t} active={tab === t} onClick={() => { setTab(t); setSelDate(getMskDate(0)); }} />
          ))}
        </div>

        {/* Date nav */}
        {hasCalendar && (
          <div className="flex items-center gap-2" ref={pickerRef}>
            <NavBtn disabled={!canPrev} dir="left"  onClick={() => setSelDate(availDates[dateIdx - 1])} />

            {/* Date pill */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(v => !v)}
                className="flex items-center gap-2.5 h-11 px-5 rounded-full border border-[#2a2a2a] bg-[#111] hover:bg-[#171717] hover:border-[#333] transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-[#555] group-hover:text-[#777] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="text-white text-[14px] font-semibold tracking-tight">{dateLabel(selDate)}</span>
                <svg className={`w-3.5 h-3.5 text-[#444] transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16,1,0.3,1] }}
                    className="absolute right-0 top-[calc(100%+8px)] bg-[#111] border border-[#222] rounded-2xl overflow-hidden z-50 shadow-2xl min-w-40"
                    onClick={e => e.stopPropagation()}
                  >
                    {availDates.map(d => (
                      <button
                        key={d}
                        onClick={() => { setSelDate(d); setShowPicker(false); }}
                        className={`w-full text-left px-4 py-3 text-[13px] font-semibold transition-colors ${
                          d === selDate ? 'bg-blue-600 text-white' : 'text-[#777] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {dateLabel(d)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavBtn disabled={!canNext} dir="right" onClick={() => setSelDate(availDates[dateIdx + 1])} />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex justify-center py-24">
            <div className="w-7 h-7 rounded-full border-2 border-white/8 border-t-[#007AFF] animate-spin" />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="py-20 text-center">
            <p className="text-[#333] text-[15px] font-medium">
              {tab === 'upcoming' && 'Матчей на эту дату нет'}
              {tab === 'live'     && 'Сейчас нет активных матчей'}
              {tab === 'finished' && 'Завершённых матчей нет'}
            </p>
          </motion.div>
        ) : (
          <motion.div key={`${tab}-${selDate}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
            className="flex flex-col gap-3"
          >
            {Array.from(groups.entries()).map(([tournament, tMatches]) => {
              const key  = `${tab}__${tournament}`;
              const open = openGroups.has(key);
              return (
                <TournamentCard
                  key={key}
                  tournament={tournament}
                  country={tMatches[0]?.tournamentCountry}
                  matches={tMatches}
                  isOpen={open}
                  onToggle={() => toggleGroup(key)}
                  tab={tab}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Tab Pill ─────────────────────────────────────────────────────────────────
function TabPill({ value, active, onClick }: { value: Tab; active: boolean; onClick: () => void }) {
  const labels: Record<Tab, React.ReactNode> = {
    upcoming: 'Расписание',
    live: <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/><span>Лайв</span></span>,
    finished: 'Завершённые',
  };
  return (
    <button onClick={onClick} className="relative px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-200 whitespace-nowrap">
      {active && (
        <motion.div layoutId="tab-pill-bg"
          className="absolute inset-0 bg-[#007AFF] rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className={`relative z-10 transition-colors duration-200 ${active ? 'text-white' : 'text-[#555] hover:text-[#888]'}`}>
        {labels[value]}
      </span>
    </button>
  );
}

// ─── Nav Button ───────────────────────────────────────────────────────────────
function NavBtn({ onClick, disabled, dir }: { onClick: () => void; disabled: boolean; dir: 'left'|'right' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-11 h-11 rounded-full border border-[#2a2a2a] bg-[#111] flex items-center justify-center transition-all duration-200 hover:border-[#333] hover:bg-[#171717] active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
    >
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
      </svg>
    </button>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({ tournament, country, matches, isOpen, onToggle, tab }: {
  tournament: string;
  country?: string;
  matches: FormattedMatch[];
  isOpen: boolean;
  onToggle: () => void;
  tab: Tab;
}) {
  return (
    <div className="rounded-2xl border border-[#1c1c1e] bg-[#0e0e0f] overflow-hidden">

      {/* Tournament header */}
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-white/2 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {country && <span className="text-lg leading-none shrink-0">{country}</span>}
          <span className="text-white text-[15px] font-semibold truncate">{tournament}</span>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {tab === 'live' && matches.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-500 text-[12px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
              {matches.length}
            </span>
          )}
          {tab !== 'live' && (
            <span className="text-[#333] text-[13px] font-medium">{matches.length}</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}>
            <svg className="w-4 h-4 text-[#3a3a3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Match rows */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[#161618]">
              {/* Column headers */}
              <div className="grid gap-4 px-5 sm:px-6 pt-3 pb-1.5"
                style={{ gridTemplateColumns: tab === 'upcoming' ? '5rem 1fr auto auto' : '4rem 1fr auto' }}
              >
                <span className="text-[11px] font-semibold text-[#2e2e2e] uppercase tracking-widest">Время</span>
                {tab === 'upcoming' && <span className="text-[11px] font-semibold text-[#2e2e2e] uppercase tracking-widest">Стадион</span>}
                {tab !== 'upcoming' && <span/>}
                <span className="text-[11px] font-semibold text-[#2e2e2e] uppercase tracking-widest col-start-3">Счёт</span>
                {tab === 'upcoming' && <span/>}
              </div>

              {matches.map((m, idx) => (
                <React.Fragment key={m.id}>
                  {idx > 0 && <div className="mx-5 sm:mx-6 h-px bg-[#131315]"/>}
                  <MatchRow match={m} tab={tab} />
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Match Row ────────────────────────────────────────────────────────────────
function MatchRow({ match, tab }: { match: FormattedMatch; tab: Tab }) {
  const isLive     = tab === 'live';
  const isFinished = tab === 'finished';
  const isUpcoming = tab === 'upcoming';
  const sets = parseSets(match.score, isLive);
  const p1Won = sets.filter(s => s.finished && +s.p1 > +s.p2).length;
  const p2Won = sets.filter(s => s.finished && +s.p2 > +s.p1).length;

  return (
    <div className="px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4">

      {/* Time */}
      <div className="shrink-0 w-16 sm:w-20 flex flex-col gap-1">
        {isLive ? (
          <span className="text-red-500 text-[11px] font-bold tracking-[0.18em] uppercase">Live</span>
        ) : (
          <>
            <span className="text-[#007AFF] text-[20px] sm:text-[22px] font-bold leading-none tabular-nums tracking-tight">
              {match.time}
            </span>
            {isUpcoming && (
              <span className="text-[#333] text-[12px] font-medium leading-none mt-0.5">
                {match.dateLabel}
              </span>
            )}
          </>
        )}
      </div>

      {/* Court (upcoming only) */}
      {isUpcoming && (
        <div className="hidden sm:block shrink-0 w-40 lg:w-52">
          {match.court && (
            <span className="text-[#3a3a3a] text-[13px] font-medium leading-snug">
              {match.court}
            </span>
          )}
        </div>
      )}

      {/* Players */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <PlayerLine
          name={match.player1}
          country={match.player1Country}
          rank={match.player1Rank}
          isServing={isLive && match.serving === '1'}
          isWinner={isFinished && p1Won > p2Won}
          isFinished={isFinished}
          sets={sets}
          playerIdx={0}
          isLive={isLive}
        />
        <PlayerLine
          name={match.player2}
          country={match.player2Country}
          rank={match.player2Rank}
          isServing={isLive && match.serving === '2'}
          isWinner={isFinished && p2Won > p1Won}
          isFinished={isFinished}
          sets={sets}
          playerIdx={1}
          isLive={isLive}
        />
      </div>

      {/* H2H (upcoming only) */}
      {isUpcoming && (
        <div className="shrink-0">
          <button className="px-5 sm:px-6 py-2.5 rounded-full bg-[#007AFF] hover:bg-[#0066ee] active:scale-95 transition-all duration-150 text-white text-[13px] sm:text-[14px] font-bold tracking-wide whitespace-nowrap">
            H2H
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Player Line ──────────────────────────────────────────────────────────────
function PlayerLine({ name, country, rank, isServing, isWinner, isFinished, sets, playerIdx, isLive }: {
  name: string;
  country?: string;
  rank?: number;
  isServing: boolean;
  isWinner: boolean;
  isFinished: boolean;
  sets: SetScore[];
  playerIdx: 0 | 1;
  isLive: boolean;
}) {
  const nameColor = isFinished
    ? isWinner ? 'text-white' : 'text-[#747781]'
    : 'text-white';

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">

      {/* Serving indicator */}
      <div className="w-3 shrink-0 flex items-center justify-center">
        {isServing && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50"/>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"/>
          </span>
        )}
      </div>

      {/* Flag */}
      {country && <span className="text-base leading-none shrink-0">{country}</span>}

      {/* Name */}
      <span className={`text-[16px] sm:text-[17px] font-semibold leading-none truncate flex-1 transition-colors ${nameColor}`}>
        {name}
      </span>

      {/* Rank */}
      {rank && (
        <span className="text-[#747781] text-[12px] font-medium shrink-0 tabular-nums">
          {rank}
        </span>
      )}

      {/* Score */}
      {(isLive || isFinished) && sets.length > 0 && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {sets.map((set, i) => {
            const my  = playerIdx === 0 ? set.p1 : set.p2;
            const opp = playerIdx === 0 ? set.p2 : set.p1;
            const won  = set.finished && +my > +opp;
            const lost = set.finished && +my < +opp;
            const isCurrent = !set.finished && isLive;

            if (isCurrent) {
              return (
                <div key={i} className="flex items-center justify-center w-8 h-7 rounded-lg bg-[#007AFF]">
                  <span className="text-white text-[13px] font-bold leading-none tabular-nums">{my}</span>
                </div>
              );
            }

            return (
              <span key={i} className={`text-[15px] sm:text-[16px] font-bold tabular-nums w-5 text-center leading-none ${
                won ? 'text-white' : lost ? 'text-[#747781]' : 'text-white'
              }`}>
                {my}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}