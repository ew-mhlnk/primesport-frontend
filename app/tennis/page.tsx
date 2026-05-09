// app/tennis/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { getFeaturedTournaments, countryToFlag, Tournament } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Теннис — турниры и трансляции | PrimeSport',
  description: 'Все теннисные турниры: ATP, WTA, Grand Slam. Смотрите прямые трансляции матчей онлайн на PrimeSport.',
  alternates: { canonical: '/tennis' },
};

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

export default async function TennisPage() {
  const tournaments = await getFeaturedTournaments();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <div className="pt-18">
        <div className="px-4 lg:px-18.75 pt-10 pb-8">
          <h1 className="text-white text-[13px] font-bold uppercase tracking-[0.22em] flex items-center gap-3">
            <span className="w-1 h-4 bg-[#007AFF] rounded-full inline-block" />
            Теннис
          </h1>
          {tournaments.length > 0 && (
            <p className="text-[#2a2a2a] text-[12px] font-medium mt-2">
              {tournaments.length} {plural(tournaments.length)}
            </p>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div className="px-4 lg:px-18.75 py-20 text-center">
            <p className="text-[#333] text-[15px] font-bold">Турниры скоро появятся</p>
          </div>
        ) : (
          <div className="px-4 lg:px-18.75 pb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
              {tournaments.map(t => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'турнир';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'турнира';
  return 'турниров';
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
      {/* Обложка */}
      {t.cover_url ? (
        <Image
          src={t.cover_url}
          alt={t.name_ru}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
            className="text-[9px] lg:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap"
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