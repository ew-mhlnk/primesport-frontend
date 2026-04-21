'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ❌ Image больше не нужен — удалён
import { countryCodeToEmoji } from '@/lib/flagUtils'; // ✅ Добавлен

type Tab = 'upcoming' | 'live' | 'finished';

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
  rawTimestamp?:  number;
}

interface MatchesState {
  upcoming: FormattedMatch[];
  live:     FormattedMatch[];
  finished: FormattedMatch[];
}

const todayMsk = (): string => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function ScheduleWidget() {
  const [activeTab, setActiveTab]   = useState<Tab>('upcoming');
  const [selectedDate, setSelectedDate] = useState<string>(todayMsk());
  const [matches, setMatches]       = useState<MatchesState>({ upcoming: [], live: [], finished: [] });
  const [isLoading, setIsLoading]   = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const fetchMatches = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/tennis?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
        const keys = new Set<string>();
        ['upcoming','live','finished'].forEach(tab => {
          const arr: FormattedMatch[] = data[tab] || [];
          arr.forEach(m => keys.add(`${tab}__${m.tournament}`));
        });
        setOpenGroups(keys);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    setIsLoading(true);
    fetchMatches(date);
  }, [fetchMatches]);

  useEffect(() => {
    fetchMatches(selectedDate);
    const iv = setInterval(() => fetchMatches(selectedDate), 15000);
    return () => clearInterval(iv);
  }, [selectedDate, fetchMatches]);

  const currentMatches = matches[activeTab] || [];

  const byTournament = new Map<string, FormattedMatch[]>();
  currentMatches.forEach(m => {
    if (!byTournament.has(m.tournament)) byTournament.set(m.tournament, []);
    byTournament.get(m.tournament)!.push(m);
  });
  const tournamentGroups = Array.from(byTournament.entries());

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* DateSelector */}
      <div className="mb-4">
        <DateSelector 
          selectedDate={selectedDate} 
          onDateChange={handleDateChange} 
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1a1a1a]">
        {(['upcoming','live','finished'] as Tab[]).map(tab => (
          <TabBtn
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            tab={tab}
          />
        ))}
      </div>

      {/* Content */}
      <div className="min-h-64">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
          </div>
        ) : currentMatches.length === 0 ? (
          <div className="py-16 text-center text-[#555] text-[15px] font-medium">
            {activeTab === 'upcoming' && 'Нет запланированных матчей'}
            {activeTab === 'live'     && 'Нет активных матчей'}
            {activeTab === 'finished' && 'Нет завершённых матчей'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tournamentGroups.map(([tournament, tMatches]) => {
              const key   = `${activeTab}__${tournament}`;
              const open  = openGroups.has(key);
              return (
                <TournamentGroup
                  key={key}
                  tournament={tournament}
                  matches={tMatches}
                  isOpen={open}
                  onToggle={() => toggleGroup(key)}
                  isLive={activeTab === 'live'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── DateSelector ─── */
function DateSelector({ selectedDate, onDateChange }: { 
  selectedDate: string; 
  onDateChange: (date: string) => void;
}) {
  // Генерируем массив дат
  const dates: Array<{ value: string; label: string }> = [];
  
  for (let offset = -1; offset <= 7; offset++) {
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    d.setDate(d.getDate() + offset);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    let label = '';
    if (offset === -1) label = 'Вчера';
    else if (offset === 0) label = 'Сегодня';
    else if (offset === 1) label = 'Завтра';
    else if (offset === 2) label = 'Послезавтра';
    else {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      label = `${days[d.getDay()]}, ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    
    dates.push({ value: str, label });
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Кнопка "назад" */}
      <button
        onClick={() => {
          const idx = dates.findIndex(d => d.value === selectedDate);
          if (idx > 0) onDateChange(dates[idx - 1].value);
        }}
        disabled={dates[0]?.value === selectedDate}
        className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Даты */}
      {dates.map(({ value, label }) => {
        const isActive = value === selectedDate;
        
        return (
          <button
            key={value}
            onClick={() => onDateChange(value)}
            className={[
              'shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 whitespace-nowrap',
              isActive
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}

      {/* Кнопка "вперёд" */}
      <button
        onClick={() => {
          const idx = dates.findIndex(d => d.value === selectedDate);
          if (idx < dates.length - 1) onDateChange(dates[idx + 1].value);
        }}
        disabled={dates[dates.length - 1]?.value === selectedDate}
        className="shrink-0 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Tab Button ─── */
function TabBtn({ active, onClick, tab }: { active: boolean; onClick: () => void; tab: Tab }) {
  const labels: Record<Tab, React.ReactNode> = {
    upcoming: 'Расписание',
    live: (
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Лайв
      </span>
    ),
    finished: 'Завершённые',
  };
  return (
    <button
      onClick={onClick}
      className={[
        'relative px-4 py-3 text-[14px] font-semibold transition-colors duration-200 whitespace-nowrap',
        active ? 'text-white' : 'text-[#555] hover:text-[#999]',
      ].join(' ')}
    >
      {labels[tab]}
      {active && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
}

/* ─── Tournament Group ─── */
function TournamentGroup({
  tournament, matches, isOpen, onToggle, isLive
}: {
  tournament: string;
  matches: FormattedMatch[];
  isOpen: boolean;
  onToggle: () => void;
  isLive: boolean;
}) {
  const meta = matches[0]?.tournamentMeta;

  return (
    <div className="rounded-2xl border border-[#1e1e1e] bg-[#111] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="text-white text-[15px] font-semibold leading-tight truncate">
            {tournament}
          </span>
          {meta && (
            <div className="flex items-center gap-1.5 shrink-0">
              {meta.surface && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#888]">
                  {meta.surface === 'clay' ? 'Грунт' 
                   : meta.surface === 'hard' ? 'Хард' 
                   : meta.surface === 'grass' ? 'Трава' 
                   : meta.surface}
                </span>
              )}
              {meta.category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">
                  {meta.category}
                </span>
              )}
              {meta.city && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-[#555]">
                  📍 {meta.city}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-[#444] text-[13px]">{matches.length} матч{declension(matches.length)}</span>
          <svg
            className={`w-4 h-4 text-[#444] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[#1e1e1e]">
              {matches.map((match, idx) => (
                <React.Fragment key={match.id}>
                  <MatchRow match={match} isLive={isLive} />
                  {idx < matches.length - 1 && (
                    <div className="mx-5 border-b border-[#1a1a1a]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Match Row ─── */
function MatchRow({ match, isLive }: { match: FormattedMatch; isLive: boolean }) {
  const scoreParts = match.score ? match.score.split(',') : [];

  return (
    <div className="flex items-center gap-3 sm:gap-5 px-5 py-4 hover:bg-white/2.5 transition-colors duration-150">
      <div className="shrink-0 w-14 sm:w-16 flex flex-col items-start gap-0.5">
        <span className="text-[#007AFF] text-[16px] sm:text-[18px] font-bold leading-none tabular-nums">
          {match.time}
        </span>
        {!isLive && (
          <span className="text-[#3a3a3a] text-[11px] font-medium leading-none mt-1">
            {match.dateLabel}
          </span>
        )}
        {isLive && (
          <span className="text-red-500 text-[11px] font-bold leading-none mt-1 uppercase tracking-wide">
            live
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <PlayerRow 
          name={match.player1} 
          flag={match.player1Flag}
          score={scoreParts[0]} 
          isLive={isLive} 
        />
        <PlayerRow 
          name={match.player2} 
          flag={match.player2Flag}
          score={scoreParts[1]} 
          isLive={isLive} 
        />
      </div>

      <div className="shrink-0">
        <button className="px-3 sm:px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all duration-150 text-white text-[12px] sm:text-[13px] font-bold tracking-wide whitespace-nowrap">
          H2H
        </button>
      </div>
    </div>
  );
}

/* ─── Player Row ─── ✅ ИЗМЕНЁН — теперь с эмодзи */
function PlayerRow({ name, flag, score, isLive }: { 
  name: string; 
  flag?: string;
  score?: string; 
  isLive: boolean 
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Флаг — эмодзи вместо img */}
        {flag ? (
          <span className="text-base leading-none shrink-0">
            {countryCodeToEmoji(flag)}
          </span>
        ) : (
          <div className="w-6 h-4 rounded-sm bg-white/5 shrink-0" />
        )}
        
        <span className="text-white text-[14px] sm:text-[15px] font-semibold leading-none truncate">
          {name}
        </span>
      </div>
      
      {(isLive || score) && score && (
        <span className="text-white text-[14px] sm:text-[16px] font-bold leading-none tabular-nums shrink-0">
          {score}
        </span>
      )}
    </div>
  );
}

/* ─── Helpers ─── */
function declension(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ей';
}