// app/tennis/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { getTournamentBySlug, countryToFlag } from '@/lib/tournaments';
import { WPPost } from '@/types';
import { ChevronLeft } from 'lucide-react';

export const revalidate = 60;

const WP_API      = process.env.NEXT_PUBLIC_WP_API!;
const TENNIS_CAT  = 224; // id рубрики Теннис из lib/news.ts

async function getTournamentPosts(wpTagName: string): Promise<WPPost[]> {
  try {
    const res = await fetch(
      `${WP_API}/posts?_embed&per_page=50&orderby=date&order=desc&categories=${TENNIS_CAT}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const all: WPPost[] = await res.json();
    // Фильтруем по wp_tag_name — точное совпадение с acf.match_tournament
    return all.filter(p =>
      p.acf?.match_tournament?.trim().toLowerCase() === wpTagName.trim().toLowerCase()
    );
  } catch {
    return [];
  }
}

/* ── generateMetadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTournamentBySlug(slug);
  if (!t) return {};

  const title = `${t.name_ru} — трансляции матчей | PrimeSport`;
  return {
    title,
    description: `Смотрите все матчи турнира ${t.name_ru}${t.city ? ` в ${t.city}` : ''}. Онлайн трансляции на PrimeSport.`,
    alternates: { canonical: `/tennis/${slug}` },
    openGraph: {
      title,
      type: 'website',
      ...(t.cover_url && { images: [{ url: t.cover_url, width: 1280, height: 720 }] }),
    },
  };
}

/* ── Page ── */
export default async function TournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tournament, posts] = await Promise.all([
    getTournamentBySlug(slug),
    getTournamentBySlug(slug).then(t => t ? getTournamentPosts(t.wp_tag_name) : []),
  ]);

  if (!tournament) notFound();

  const flag    = countryToFlag(tournament.country);
  const isLive  = posts.some(p => p.acf?.match_status === 'live' || p.acf?.is_live);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <div className="pt-[72px]">
        {/* Хедер турнира */}
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(180px, 28vw, 340px)' }}>
          {tournament.cover_url ? (
            <Image
              src={tournament.cover_url}
              alt={tournament.name_ru}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}

          {/* Градиент */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #0a0a0b 0%, rgba(10,10,11,0.7) 45%, rgba(10,10,11,0.1) 80%, transparent 100%)' }}
          />

          {/* Назад */}
          <div className="absolute top-0 left-0 right-0 pt-5 px-4 lg:px-[75px]">
            <Link
              href="/tennis"
              className="inline-flex items-center gap-1 text-white/50 hover:text-white text-[13px] font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Турниры
            </Link>
          </div>

          {/* Инфо */}
          <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-[75px] pb-6">
            <div className="flex items-center gap-2 mb-1.5">
              {tournament.category && (
                <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wider">
                  {tournament.category}
                </span>
              )}
              {tournament.surface && (
                <>
                  <span className="text-[#333]">·</span>
                  <span className="text-[10px] font-bold text-[#444] uppercase tracking-wider">
                    {tournament.surface}
                  </span>
                </>
              )}
              {isLive && (
                <>
                  <span className="text-[#333]">·</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Live
                  </span>
                </>
              )}
            </div>
            <h1 className="text-white font-bold leading-tight" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.6rem)' }}>
              {flag && <span className="mr-2">{flag}</span>}
              {tournament.name_ru}
            </h1>
            <p className="text-white/35 text-[13px] font-medium mt-1">
              {posts.length} {posts.length === 1 ? 'трансляция' : posts.length < 5 ? 'трансляции' : 'трансляций'}
            </p>
          </div>
        </div>

        {/* Список матчей */}
        <div className="px-4 lg:px-[75px] py-8 pb-20">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[#333] text-[15px] font-bold">Трансляции появятся здесь</p>
              <p className="text-[#222] text-[13px] mt-2">
                Убедись что в поле «Турнир» поста указано: <code className="text-[#444]">{tournament.wp_tag_name}</code>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {posts.map((post, i) => (
                <MatchCard key={post.id} post={post} index={i + 1} tournamentSlug={slug} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ── Match card ── */
function MatchCard({ post, index, tournamentSlug }: { post: WPPost; index: number; tournamentSlug: string }) {
  const isLive  = post.acf?.match_status === 'live' || post.acf?.is_live;
  const title   = post.acf?.match_subtitle || post.title.rendered;
  const thumb   = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const comment = post.acf?.match_commentator;

  return (
    <Link
      href={`/match/${post.id}?from=/tennis/${tournamentSlug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-[#0e0e0f] border border-[#1c1c1e] hover:border-[#2a2a2a] transition-colors duration-200"
    >
      {/* Обложка 16:9 */}
      <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }}
        />

        {/* Номер */}
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
          <span className="text-white/50 text-[10px] font-bold">{index}</span>
        </div>

        {/* LIVE badge */}
        {isLive && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase">
              LIVE
            </span>
          </div>
        )}

        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Текст */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3
          className="text-white text-[13px] font-bold leading-[1.3] line-clamp-2 group-hover:text-white/85 transition-colors"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {comment && (
          <p className="text-[#3a3a3a] text-[11px] font-medium mt-auto pt-1">
            {comment}
          </p>
        )}
      </div>
    </Link>
  );
}