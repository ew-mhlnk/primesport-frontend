// app/news/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { getNewsPosts, getPostImage, getPostImageAlt, stripHtml, formatDate } from '@/lib/news';
import type { NewsPost } from '@/types/news';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Новости тенниса | PrimeSport',
  description: 'Последние новости тенниса: результаты матчей, трансферы, аналитика от PrimeSport',
  openGraph: {
    title: 'Новости тенниса | PrimeSport',
    description: 'Последние новости тенниса: результаты матчей, трансферы, аналитика от PrimeSport',
    type: 'website',
  },
  alternates: {
    canonical: '/news',
  },
};

export default async function NewsPage() {
  const posts = await getNewsPosts(20);
  const [hero, ...rest] = posts;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <div className="pt-18">

        {/* Page header */}
        <div className="px-4 lg:px-18.75 pt-10 pb-8">
          <h1 className="text-white text-[13px] font-bold uppercase tracking-[0.22em] flex items-center gap-3">
            <span className="w-1 h-4 bg-[#007AFF] rounded-full inline-block" />
            Новости
          </h1>
        </div>

        {/* Hero + sidebar grid */}
        {hero && (
          <div className="px-4 lg:px-18.75 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-6">
              <HeroCard post={hero} />
              <aside className="flex flex-col gap-0">
                <p className="text-[#3a3a3a] text-[11px] font-bold uppercase tracking-[0.2em] px-1 pb-3">
                  Читай ещё
                </p>
                {rest.slice(0, 3).map((post, i) => (
                  <SidebarCard key={post.id} post={post} index={i} total={3} />
                ))}
              </aside>
            </div>
          </div>
        )}

        {/* All posts grid */}
        {rest.length > 3 && (
          <div className="px-4 lg:px-18.75 pb-20">
            <div className="border-t border-[#161618] pt-8 mb-6">
              <p className="text-[#3a3a3a] text-[11px] font-bold uppercase tracking-[0.2em]">
                Все новости
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rest.slice(3).map((post) => (
                <GridCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Hero Card ── */
function HeroCard({ post }: { post: NewsPost }) {
  const img     = getPostImage(post, 'large');
  const alt     = getPostImageAlt(post);
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 120);

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group relative block w-full overflow-hidden rounded-[28px] lg:rounded-[40px] bg-zinc-900"
      style={{ aspectRatio: '1 / 1', maxHeight: 640 }}
    >
      {img && (
        <Image
          src={img} alt={alt} fill
          sizes="(max-width: 1024px) 100vw, 65vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
        <h2
          className="text-white font-bold leading-[1.1] tracking-tight line-clamp-3"
          style={{ fontSize: 'clamp(1.3rem, 2.8vw, 2.2rem)' }}
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        {excerpt && (
          <p className="text-white/55 text-[14px] sm:text-[15px] mt-2 line-clamp-2 hidden sm:block">
            {excerpt}
          </p>
        )}
        <div className="mt-3 text-white/35 text-[12px] font-medium">{formatDate(post.date)}</div>
      </div>
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/4 transition-colors duration-300" />
    </Link>
  );
}

/* ── Sidebar Card ── */
function SidebarCard({ post, index, total }: { post: NewsPost; index: number; total: number }) {
  const img = getPostImage(post, 'medium_large');
  const alt = getPostImageAlt(post);

  return (
    <Link
      href={`/news/${post.slug}`}
      className={[
        'group flex items-center gap-4 py-4 transition-colors duration-150',
        'hover:bg-white/3 rounded-2xl px-2 -mx-2',
        index < total - 1 ? 'border-b border-[#161618]' : '',
      ].join(' ')}
    >
      <div className="relative shrink-0 w-22 h-22 sm:w-25 sm:h-25 rounded-[18px] sm:rounded-[22px] overflow-hidden bg-zinc-800">
        {img && (
          <Image
            src={img} alt={alt} fill sizes="100px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className="text-white text-[14px] sm:text-[15px] font-bold leading-[1.3] line-clamp-3 group-hover:text-white/90 transition-colors"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        <span className="text-[#3a3a3a] text-[11px] font-medium mt-1.5 block">{formatDate(post.date)}</span>
      </div>
      <svg className="w-4 h-4 text-[#2a2a2a] group-hover:text-[#555] transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

/* ── Grid Card ── */
function GridCard({ post }: { post: NewsPost }) {
  const img     = getPostImage(post, 'medium_large');
  const alt     = getPostImageAlt(post);
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 90);

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[22px] bg-[#0e0e0f] border border-[#1c1c1e] hover:border-[#2a2a2a] transition-colors duration-200"
    >
      <div className="relative w-full overflow-hidden bg-zinc-900" style={{ aspectRatio: '16/9' }}>
        {img && (
          <Image
            src={img} alt={alt} fill sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          className="text-white text-[14px] font-bold leading-[1.35] line-clamp-3 group-hover:text-white/85 transition-colors"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        {excerpt && (
          <p className="text-[#444] text-[12px] leading-relaxed line-clamp-2">{excerpt}</p>
        )}
        <div className="text-[#2a2a2a] text-[11px] font-medium mt-auto pt-2">{formatDate(post.date)}</div>
      </div>
    </Link>
  );
}