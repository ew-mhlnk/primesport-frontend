// components/TournamentsWidget.tsx
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedTournaments, countryToFlag, Tournament } from '@/lib/tournaments';

const CATEGORY_COLOR: Record<string, string> = {
  'grand slam':       '#c9a227',
  'atp masters 1000': '#007AFF',
  'atp-1000':         '#007AFF',
  'wta 1000':         '#e040fb',
  'wta-1000':         '#e040fb',
  'atp 500':          '#6366f1',
  'atp-500':          '#6366f1',
  'wta 500':          '#a78bfa',
  'wta-500':          '#a78bfa',
  'atp 250':          '#22c55e',
  'atp-250':          '#22c55e',
  'wta 250':          '#86efac',
  'wta-250':          '#86efac',
};

function getCategoryColor(category?: string) {
  if (!category) return '#555';
  return CATEGORY_COLOR[category.toLowerCase()] ?? '#555';
}

export default async function TournamentsWidget() {
  const all         = await getFeaturedTournaments();
  const visible     = all.slice(0, 3);   // Показываем только первые 3
  const totalCount  = all.length;

  if (all.length === 0) return null;

  return (
    <section className="py-10 px-4 lg:px-18.75">
      {/* Заголовок */}
      <h2 className="text-white text-[13px] font-bold uppercase tracking-[0.22em] flex items-center gap-3 mb-6">
        <span className="w-1 h-4 bg-[#007AFF] rounded-full inline-block" />
        Турниры
      </h2>

      {/* Грид: 3 карточки + счётчик */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">

        {visible.map(t => (
          <TournamentCard key={t.id} tournament={t} />
        ))}

        {/* 4-я ячейка — счётчик со ссылкой */}
        <Link
          href="/tennis"
          className="group relative flex flex-col items-center justify-center rounded-[22px] lg:rounded-[28px] bg-[#0e0e0f] border border-[#1c1c1e] hover:border-[#2a2a2a] transition-colors duration-200"
          style={{ aspectRatio: '3/2' }}
        >
          <span
            className="text-white font-bold leading-none"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            +{totalCount}
          </span>
          <span className="text-[#444] text-[12px] lg:text-[13px] font-bold text-center mt-2 px-4 leading-snug">
            Плейлистов<br />турниров
          </span>
          <span className="flex items-center gap-1 text-[#333] group-hover:text-[#555] text-[11px] font-bold mt-4 transition-colors">
            Смотреть все
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </Link>

      </div>
    </section>
  );
}

function TournamentCard({ tournament: t }: { tournament: Tournament }) {
  const flag  = countryToFlag(t.country);
  const color = getCategoryColor(t.category);

  return (
    <Link
      href={`/tennis/${t.slug}`}
      className="group relative block overflow-hidden rounded-[22px] lg:rounded-[28px] bg-zinc-900"
      style={{ aspectRatio: '3/2' }}
    >
      {t.cover_url ? (
        <Image
          src={t.cover_url}
          alt={t.name_ru}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-zinc-900" />
      )}

      {/* Градиент */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }}
      />

      {/* Hover */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-300" />

      {/* Категория */}
      {t.category && (
        <div className="absolute top-2.5 left-2.5 lg:top-3 lg:left-3">
          <span
            className="text-[9px] lg:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
            style={{
              background: `${color}1a`,
              color,
              border: `1px solid ${color}33`,
            }}
          >
            {t.category}
          </span>
        </div>
      )}

      {/* Название */}
      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4">
        <div className="flex items-center gap-1.5 min-w-0">
          {flag && <span className="text-sm lg:text-base leading-none shrink-0">{flag}</span>}
          <span className="text-white text-[13px] lg:text-[15px] font-bold leading-tight truncate">
            {t.city || t.name_ru}
          </span>
        </div>
        {t.surface && (
          <p className="text-white/30 text-[10px] font-medium mt-0.5">{t.surface}</p>
        )}
      </div>
    </Link>
  );
}