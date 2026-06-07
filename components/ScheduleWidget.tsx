'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Tab = 'upcoming' | 'live' | 'finished';

export interface FormattedMatch {
  id:              number;
  time:            string;
  player1:         string;
  player2:         string;
  player1Flag?:    string;
  player2Flag?:    string;
  player1Rank?:    number;
  player2Rank?:    number;
  tournament:      string;
  tournamentCountry?: string;
  court?:          string;
  status:          string;
  score:           string;
  dateLabel:       string;
  rawTimestamp?:   number;
  serving?:        '1' | '2' | null;
  player1Key?:     string;
  player2Key?:     string;
}

interface MatchesState {
  upcoming: FormattedMatch[];
  live:     FormattedMatch[];
  finished: FormattedMatch[];
}

interface ParsedSet {
  p1: string; p2: string;
  tb1?: string; tb2?: string;
  finished: boolean;
}

interface ScoreUpdatePayload {
  event_key:          number;
  scores?:            Array<{ score_first: string; score_second: string }>;
  event_final_result?: string;
  event_game_result?:  string;
  event_status?:       string;
  event_serve?:        string;
  serving?:            '1' | '2' | null;
}

interface H2HMatch {
  event_date:          string;
  event_first_player:  string;
  event_second_player: string;
  event_final_result:  string;
  event_winner:        string;
  tournament_name:     string;
}

interface H2HData {
  h2h:       H2HMatch[];
  p1Results: H2HMatch[];
  p2Results: H2HMatch[];
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

function isDoubles(name: string): boolean { return name.includes('/'); }

function formatDoublesPlayer(name: string): string {
  return name.split('/').map(p => p.trim()).join(' / ');
}

function parseSets(score: string, isLive: boolean): ParsedSet[] {
  if (!score) return [];
  const clean = score.replace(/\s*\([A-Z0-9]+ ?- ?[A-Z0-9]+\)\s*$/, '').trim();
  if (!clean) return [];

  const parts = clean.includes(',')
    ? clean.split(',')
    : (clean.match(/\d+(?:\(\d+\))?-\d+(?:\(\d+\))?/g) ?? []);

  return parts.map((part, idx, arr) => {
    const s = part.trim();

    // "7(4)-6" — тайбрейк внутри счёта первого
    const m1 = s.match(/^(\d+)\((\d+)\)-(\d+)$/);
    if (m1) {
      const [, p1, tb, p2] = m1;
      const p1Won = parseInt(p1) > parseInt(p2);
      return { p1, p2,
        tb1: p1Won ? undefined : tb,
        tb2: p1Won ? tb : undefined,
        finished: isLive ? idx < arr.length - 1 : true };
    }

    // "7-6(4)" — тайбрейк после
    const m2 = s.match(/^(\d+)-(\d+)\s*\((\d+)\)$/);
    if (m2) {
      const [, p1, p2, tb] = m2;
      const p1Won = parseInt(p1) > parseInt(p2);
      return { p1, p2,
        tb1: p1Won ? undefined : tb,
        tb2: p1Won ? tb : undefined,
        finished: isLive ? idx < arr.length - 1 : true };
    }

    const [a, b] = s.split('-');
    return { p1: a?.trim() ?? '0', p2: b?.trim() ?? '0',
      finished: isLive ? idx < arr.length - 1 : true };
  });
}

function extractGameScore(score: string): { p1: string; p2: string } | null {
  const m = score.match(/\(([A-Z0-9]+)\s*-\s*([A-Z0-9]+)\)\s*$/);
  if (!m) return null;
  return { p1: m[1].trim(), p2: m[2].trim() };
}

function FlagImg({ code }: { code?: string }) {
  if (!code || code.length !== 2) return null;
  return (
    <img
      src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/48x36/${code.toLowerCase()}.png 2x`}
      width={24} height={18} alt={code}
      className="rounded-[3px] shrink-0 object-cover"
    />
  );
}

// ─── H2H Modal ────────────────────────────────────────────────────────────────
function H2HModal({ match, onClose }: { match: FormattedMatch; onClose: () => void }) {
  const [data,    setData]    = useState<H2HData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!match.player1Key || !match.player2Key) {
      setError(true); setLoading(false); return;
    }
    fetch(`/api/h2h?p1=${match.player1Key}&p2=${match.player2Key}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [match.player1Key, match.player2Key]);

  const p1Wins = data?.h2h.filter(m => m.event_winner === 'First Player').length ?? 0;
  const p2Wins = data?.h2h.filter(m => m.event_winner === 'Second Player').length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-[#0e0e0f] border border-[#1c1c1e] rounded-3xl overflow-hidden shadow-2xl max-h-[80svh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#161618]">
          <h3 className="text-white text-[16px] font-bold">H2H — {match.player1} vs {match.player2}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#007AFF] animate-spin" />
            </div>
          ) : error || !data ? (
            <p className="text-[#444] text-[14px] text-center py-12">
              {!match.player1Key ? 'Ключи игроков недоступны' : 'Нет данных'}
            </p>
          ) : (
            <div className="p-5 flex flex-col gap-6">
              {/* Счёт встреч */}
              <div>
                <p className="text-[#3a3a3a] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">Личные встречи</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex-1 text-white text-[13px] font-bold text-right truncate">{match.player1}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white text-[24px] font-bold tabular-nums">{p1Wins}</span>
                    <span className="text-[#333] text-[18px]">—</span>
                    <span className="text-white text-[24px] font-bold tabular-nums">{p2Wins}</span>
                  </div>
                  <span className="flex-1 text-white text-[13px] font-bold truncate">{match.player2}</span>
                </div>

                {data.h2h.length === 0 ? (
                  <p className="text-[#444] text-[13px] text-center py-2">Очных встреч не найдено</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {data.h2h.map((m, i) => {
                      const p1Won = m.event_winner === 'First Player';
                      return (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#111] rounded-xl">
                          <span className="text-[#444] text-[11px] font-bold w-14 shrink-0">{m.event_date.slice(0, 7)}</span>
                          <span className={`text-[12px] font-bold flex-1 truncate ${p1Won ? 'text-white' : 'text-[#555]'}`}>{match.player1}</span>
                          <span className="text-[#007AFF] text-[12px] font-bold tabular-nums shrink-0">{m.event_final_result}</span>
                          <span className={`text-[12px] font-bold flex-1 text-right truncate ${!p1Won ? 'text-white' : 'text-[#555]'}`}>{match.player2}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Форма */}
              <div className="grid grid-cols-2 gap-4">
                {([
                  { label: match.player1, results: data.p1Results, winnerKey: 'First Player' },
                  { label: match.player2, results: data.p2Results, winnerKey: 'Second Player' },
                ] as const).map(({ label, results, winnerKey }) => (
                  <div key={label}>
                    <p className="text-[#3a3a3a] text-[10px] font-bold uppercase tracking-[0.15em] mb-2 truncate">{label}</p>
                    <div className="flex flex-col gap-1.5">
                      {results.map((m, i) => {
                        const won = m.event_winner === winnerKey;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${won ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                              {won ? 'W' : 'L'}
                            </span>
                            <span className="text-[#444] text-[11px] truncate">
                              {won ? m.event_second_player : m.event_first_player}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ScheduleWidget() {
  const [tab,        setTab]        = useState<Tab>('upcoming');
  const [matches,    setMatches]    = useState<MatchesState>({ upcoming: [], live: [], finished: [] });
  const [loading,    setLoading]    = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [selDate,    setSelDate]    = useState(getMskDate(0));
  const [showPicker, setShowPicker] = useState(false);
  const [h2hMatch,   setH2hMatch]   = useState<FormattedMatch | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const upcomingDates = [getMskDate(0), getMskDate(1), getMskDate(2)];
  const finishedDates = [getMskDate(-3), getMskDate(-2), getMskDate(-1), getMskDate(0)];
  const availDates    = tab === 'upcoming' ? upcomingDates : finishedDates;
  const hasCalendar   = tab !== 'live';

  const load = async () => {
    try {
      const res = await fetch('/api/tennis');
      if (res.ok) {
        const data = await res.json();
        
        const firstFinished = data.finished?.[0];
        if (firstFinished) console.log('FINISHED SCORE:', firstFinished.score);
        
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

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const channel = supabase.channel('tennis-live-scores');
    channel.on('broadcast', { event: 'score_update' }, ({ payload }) => {
      const updates = (Array.isArray(payload) ? payload : [payload]) as ScoreUpdatePayload[];
      setMatches(prev => {
        const newLive = [...prev.live];
        let modified = false;
        updates.forEach(upd => {
          const idx = newLive.findIndex(m => m.id === upd.event_key);
          if (idx === -1) return;
          let newScore = '';
          if (upd.event_final_result && upd.event_final_result !== '-' && upd.event_final_result !== '0 - 0') {
            newScore = upd.event_final_result;
          } else if (upd.scores?.length) {
            newScore = upd.scores.map(s => `${s.score_first}-${s.score_second}`).join(', ');
          }
          if (upd.event_game_result && upd.event_game_result !== '-' && upd.event_game_result !== '0 - 0') {
            newScore += ` (${upd.event_game_result})`;
          }
          newLive[idx] = {
            ...newLive[idx],
            score: newScore,
            status: upd.event_status || newLive[idx].status,
            serving: upd.serving !== undefined ? upd.serving
              : upd.event_serve === 'First Player' ? '1'
              : upd.event_serve === 'Second Player' ? '2' : null,
          };
          modified = true;
        });
        return modified ? { ...prev, live: newLive } : prev;
      });
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const raw = matches[tab] || [];
  const filtered = tab === 'live' ? raw : raw.filter(m => {
    if (!m.rawTimestamp) return m.dateLabel === dateLabel(selDate);
    const ts = new Date(m.rawTimestamp);
    const d = [ts.getFullYear(), String(ts.getMonth()+1).padStart(2,'0'), String(ts.getDate()).padStart(2,'0')].join('-');
    return d === selDate;
  });

  const groups = new Map<string, FormattedMatch[]>();
  filtered.forEach(m => {
    if (!groups.has(m.tournament)) groups.set(m.tournament, []);
    groups.get(m.tournament)!.push(m);
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => {
    const n = new Set(prev);
    if (n.has(key)) { n.delete(key); } else { n.add(key); }
    return n;
  });

  const dateIdx = availDates.indexOf(selDate);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center bg-[#111] border border-[#1f1f1f] rounded-full p-1 gap-0.5">
          {(['upcoming','live','finished'] as Tab[]).map(t => (
            <TabPill key={t} value={t} active={tab === t} onClick={() => { setTab(t); setSelDate(getMskDate(0)); }} />
          ))}
        </div>

        {hasCalendar && (
          <div className="flex items-center gap-2" ref={pickerRef}>
            <NavBtn disabled={dateIdx <= 0} dir="left" onClick={() => setSelDate(availDates[dateIdx - 1])} />
            <div className="relative">
              <button
                onClick={() => setShowPicker(v => !v)}
                className="flex items-center gap-2.5 h-11 px-5 rounded-full border border-[#2a2a2a] bg-[#111] hover:bg-[#171717] hover:border-[#333] transition-all duration-200 group"
              >
                <svg className="w-4 h-4 text-[#555] group-hover:text-[#777] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span className="text-white text-[14px] font-bold">{dateLabel(selDate)}</span>
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
                      <button key={d} onClick={() => { setSelDate(d); setShowPicker(false); }}
                        className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors ${d === selDate ? 'bg-blue-600 text-white' : 'text-[#777] hover:text-white hover:bg-white/5'}`}>
                        {dateLabel(d)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavBtn disabled={dateIdx >= availDates.length - 1} dir="right" onClick={() => setSelDate(availDates[dateIdx + 1])} />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-24">
            <div className="w-7 h-7 rounded-full border-2 border-white/8 border-t-[#007AFF] animate-spin" />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-20 text-center">
            <p className="text-[#333] text-[15px] font-bold">
              {tab === 'upcoming' ? 'Матчей на эту дату нет' : tab === 'live' ? 'Сейчас нет активных матчей' : 'Завершённых матчей нет'}
            </p>
          </motion.div>
        ) : (
          <motion.div key={`${tab}-${selDate}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-col gap-3">
            {Array.from(groups.entries()).map(([tournament, tMatches]) => {
              const key = `${tab}__${tournament}`;
              return (
                <TournamentCard
                  key={key}
                  tournament={tournament}
                  country={tMatches[0]?.tournamentCountry}
                  matches={tMatches}
                  isOpen={openGroups.has(key)}
                  onToggle={() => toggleGroup(key)}
                  tab={tab}
                  onH2H={setH2hMatch}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* H2H Modal */}
      <AnimatePresence>
        {h2hMatch && <H2HModal match={h2hMatch} onClose={() => setH2hMatch(null)} />}
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
    <button onClick={onClick} className="relative px-5 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 whitespace-nowrap">
      {active && <motion.div layoutId="tab-pill-bg" className="absolute inset-0 bg-[#007AFF] rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
      <span className={`relative z-10 transition-colors duration-200 ${active ? 'text-white' : 'text-[#555] hover:text-[#888]'}`}>{labels[value]}</span>
    </button>
  );
}

// ─── Nav Button ───────────────────────────────────────────────────────────────
function NavBtn({ onClick, disabled, dir }: { onClick: () => void; disabled: boolean; dir: 'left'|'right' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-11 h-11 rounded-full border border-[#2a2a2a] bg-[#111] flex items-center justify-center transition-all duration-200 hover:border-[#333] hover:bg-[#171717] active:scale-95 disabled:opacity-20 disabled:pointer-events-none">
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
      </svg>
    </button>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({ tournament, country, matches, isOpen, onToggle, tab, onH2H }: {
  tournament: string; country?: string; matches: FormattedMatch[];
  isOpen: boolean; onToggle: () => void; tab: Tab;
  onH2H: (m: FormattedMatch) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#1c1c1e] bg-[#0e0e0f] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-white/2 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          {country && <span className="text-lg leading-none shrink-0">{country}</span>}
          <span className="text-white text-[15px] font-bold truncate">{tournament}</span>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {tab === 'live'
            ? <span className="flex items-center gap-1.5 text-red-500 text-[12px] font-bold uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>{matches.length}</span>
            : <span className="text-[#333] text-[13px] font-bold">{matches.length}</span>
          }
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }}>
            <svg className="w-4 h-4 text-[#3a3a3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }} style={{ overflow: 'hidden' }}>
            <div className="border-t border-[#161618]">
              <div className={`grid gap-4 pl-5 sm:pl-6 pt-3 pb-1.5 ${tab === 'finished' ? 'pr-5 sm:pr-6' : 'pr-5 sm:pr-6'}`}
                style={{ gridTemplateColumns: tab === 'upcoming' ? '5rem 1fr auto auto' : '4rem 1fr auto' }}>
                <span className="text-[11px] font-bold text-[#2e2e2e] uppercase tracking-widest">Время</span>
                {tab === 'upcoming' ? <span className="text-[11px] font-bold text-[#2e2e2e] uppercase tracking-widest">Корт</span> : <span/>}
                <span className="text-[11px] font-bold text-[#2e2e2e] uppercase tracking-widest col-start-3 text-left pl-1">Счёт</span>
                {tab === 'upcoming' && <span/>}
              </div>
              {matches.map((m, idx) => (
                <React.Fragment key={m.id}>
                  {idx > 0 && <div className="mx-5 sm:mx-6 h-px bg-[#131315]"/>}
                  <MatchRow match={m} tab={tab} onH2H={onH2H} />
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
function MatchRow({ match, tab, onH2H }: { match: FormattedMatch; tab: Tab; onH2H: (m: FormattedMatch) => void }) {
  const isLive     = tab === 'live';
  const isFinished = tab === 'finished';
  const isUpcoming = tab === 'upcoming';

  const sets      = (isLive || isFinished) ? parseSets(match.score, isLive) : [];
  const gameScore = isLive ? extractGameScore(match.score) : null;

  const p1SetsWon = sets.filter(s => s.finished && parseInt(s.p1) > parseInt(s.p2)).length;
  const p2SetsWon = sets.filter(s => s.finished && parseInt(s.p2) > parseInt(s.p1)).length;

  const doubles1 = isDoubles(match.player1);
  const doubles2 = isDoubles(match.player2);

  return (
    <div className={`pl-5 sm:pl-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-6 pr-5 sm:pr-6`}>
      {/* Время */}
      <div className="shrink-0 w-16 sm:w-20 flex flex-col gap-0.5">
        {isLive
          ? <span className="text-red-500 text-[11px] font-bold tracking-[0.18em] uppercase">Live</span>
          : <>
              <span className="text-[#007AFF] text-[20px] sm:text-[22px] font-bold leading-none tabular-nums tracking-tight">{match.time}</span>
              {isUpcoming && <span className="text-[#333] text-[12px] font-bold leading-none mt-0.5">{match.dateLabel}</span>}
            </>
        }
      </div>

      {/* Корт */}
      {isUpcoming && (
        <div className="hidden sm:block shrink-0 w-40 lg:w-52">
          {match.court && <span className="text-[#3a3a3a] text-[13px] font-bold leading-snug">{match.court}</span>}
        </div>
      )}

      {/* Игроки */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        <PlayerLine name={doubles1 ? formatDoublesPlayer(match.player1) : match.player1}
          code={match.player1Flag} rank={match.player1Rank}
          isServing={isLive && match.serving === '1'}
          setsWon={p1SetsWon} sets={sets} playerIdx={0}
          isLive={isLive} isFinished={isFinished}
          gameScore={gameScore?.p1 ?? null} isDoubles={doubles1} />
        <PlayerLine name={doubles2 ? formatDoublesPlayer(match.player2) : match.player2}
          code={match.player2Flag} rank={match.player2Rank}
          isServing={isLive && match.serving === '2'}
          setsWon={p2SetsWon} sets={sets} playerIdx={1}
          isLive={isLive} isFinished={isFinished}
          gameScore={gameScore?.p2 ?? null} isDoubles={doubles2} />
      </div>

      {/* H2H кнопка */}
      {isUpcoming && (
        <div className="shrink-0">
          <button
            onClick={() => onH2H(match)}
            disabled={!match.player1Key || !match.player2Key}
            className="px-5 sm:px-6 py-2.5 rounded-full bg-[#007AFF] hover:bg-[#0066ee] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 text-white text-[13px] sm:text-[14px] font-bold tracking-wide whitespace-nowrap"
          >
            H2H
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function SetsBadge({ setsWon }: { setsWon: number }) {
  return (
    <div className="relative flex items-center justify-center shrink-0 w-7 h-8.5 sm:w-8 sm:h-10">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 49 59" fill="none" preserveAspectRatio="none">
        <rect x="0.5" y="0.5" width="48" height="58" rx="14.5" stroke="url(#sets-grad)"/>
        <defs>
          <linearGradient id="sets-grad" x1="0" y1="0" x2="49" y2="59" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6D6D6D"/><stop offset="1" stopColor="#D3D3D3"/>
          </linearGradient>
        </defs>
      </svg>
      <span className="relative text-white text-[16px] sm:text-[18px] font-bold tabular-nums leading-none">{setsWon}</span>
    </div>
  );
}

function GameBadge({ score }: { score: string }) {
  return (
    <div className="flex items-center justify-center shrink-0 bg-blue-600 rounded-lg sm:rounded-[10px] w-9 h-7 sm:w-12 sm:h-9">
      <span className="text-white text-[16px] sm:text-[18px] font-bold tabular-nums leading-none">{score}</span>
    </div>
  );
}

// ─── SetScoreBlock — тайбрейк через absolute position ────────────────────────
function SetScoreBlock({ score, playerIdx }: { score: ParsedSet; playerIdx: 0 | 1 }) {
  const my  = playerIdx === 0 ? score.p1 : score.p2;
  const opp = playerIdx === 0 ? score.p2 : score.p1;
  const tb  = playerIdx === 0 ? score.tb1 : score.tb2;

  const won  = score.finished && parseInt(my) > parseInt(opp);
  const lost = score.finished && parseInt(my) < parseInt(opp);
  const color = won ? 'text-white' : lost ? 'text-[#747781]' : 'text-white';

  return (
    <span className="relative shrink-0 inline-block" style={{ paddingRight: tb ? '10px' : '0' }}>
      <span className={`text-[16px] sm:text-[18px] font-bold tabular-nums leading-none ${color}`}>
        {my}
      </span>
      {tb && (
        <span
          className="absolute text-[#747781] font-bold tabular-nums"
          style={{ fontSize: '9px', top: '-1px', left: '100%', marginLeft: '-8px', lineHeight: 1 }}
        >
          {tb}
        </span>
      )}
    </span>
  );
}

// ─── Player Line ──────────────────────────────────────────────────────────────
function PlayerLine({ name, code, rank, isServing, setsWon, sets, playerIdx, isLive, isFinished, gameScore, isDoubles }: {
  name: string; code?: string; rank?: number; isServing: boolean;
  setsWon: number; sets: ParsedSet[]; playerIdx: 0|1;
  isLive: boolean; isFinished: boolean; gameScore: string|null; isDoubles?: boolean;
}) {
  return (
    <div className="flex items-center w-full">
      <div className="flex items-center gap-2 min-w-0 pr-4 flex-1">
        {!isDoubles && <FlagImg code={code} />}
        <span className={`font-bold leading-tight truncate text-white ${isDoubles ? 'text-[14px] sm:text-[15px]' : 'text-[16px] sm:text-[18px]'}`}>
          {name}
        </span>
        {rank != null && <span className="text-[#747781] text-[12px] sm:text-[13px] font-bold shrink-0 tabular-nums">{rank}</span>}
      </div>

      <div className="flex items-center justify-start gap-2 sm:gap-3 shrink-0 w-40 sm:w-55 lg:w-65">
        <div className="w-2 sm:w-2.5 flex justify-center shrink-0">
          {isServing && (
            <span className="relative flex w-2 h-2 sm:w-2.5 sm:h-2.5">
              <span className="animate-ping absolute inset-0 rounded-full bg-[#FF3B30] opacity-50"/>
              <span className="relative block rounded-full bg-[#FF3B30] w-full h-full"/>
            </span>
          )}
        </div>

        {(isLive || isFinished) && (
          <>
            <SetsBadge setsWon={setsWon} />
            {sets.length > 0 && (
              <div className="flex items-center gap-4 sm:gap-5 ml-1 sm:ml-2">
                {sets.map((s, i) => <SetScoreBlock key={i} score={s} playerIdx={playerIdx} />)}
              </div>
            )}
          </>
        )}

        {isLive && (
          <div className="w-9 sm:w-12 shrink-0 ml-2">
            {gameScore != null && gameScore !== '-' && <GameBadge score={gameScore} />}
          </div>
        )}
      </div>
    </div>
  );
}