'use client';

// components/NewsSection.tsx
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { NewsPost } from '@/types/news';
import { getPostImage, getPostImageAlt, stripHtml, formatDate } from '@/lib/news';

interface Props {
  posts: NewsPost[];
}

export default function NewsSection({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  const [hero, ...rest] = posts;
  const sidebar = rest.slice(0, 3);

  return (
    <section id="news" className="py-12 px-4 lg:px-18.75 max-w-480 mx-auto">
      {/* Заголовок раздела */}
      <h2 className="text-white text-[13px] font-bold uppercase tracking-[0.22em] mb-6 flex items-center gap-3">
        <span className="w-1 h-4 bg-[#007AFF] rounded-full inline-block" />
        Новости
      </h2>

      {/* Grid: hero (слева) + sidebar (справа) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-6">
        {/* ── Hero card ── */}
        <HeroCard post={hero} />

        {/* ── Sidebar ── */}
        <aside className="flex flex-col gap-0">
          <p className="text-[#3a3a3a] text-[11px] font-bold uppercase tracking-[0.2em] px-1 pb-3">
            Читай ещё
          </p>
          {sidebar.map((post, i) => (
            <SidebarCard key={post.id} post={post} index={i} total={sidebar.length} />
          ))}
        </aside>
      </div>
    </section>
  );
}

/* ── Hero Card ──────────────────────────────────────────────────────── */
function HeroCard({ post }: { post: NewsPost }) {
  const img     = getPostImage(post, 'large');
  const alt     = getPostImageAlt(post);
  const title   = post.title.rendered;
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 120);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/news/${post.slug}`}
        className="group relative block w-full overflow-hidden rounded-[28px] lg:rounded-[40px] bg-zinc-900"
        style={{ aspectRatio: '1 / 1', maxHeight: 640 }}
      >
        {/* Image */}
        {img && (
          <Image
            src={img}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 65vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
          />
        )}

        {/* Bottom gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)',
          }}
        />

        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
          <h3
            className="text-white font-bold leading-[1.1] tracking-tight line-clamp-3"
            style={{ fontSize: 'clamp(1.3rem, 2.8vw, 2.2rem)' }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          {excerpt && (
            <p className="text-white/55 text-[14px] sm:text-[15px] mt-2 line-clamp-2 hidden sm:block">
              {excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-[12px] text-white/35 font-medium">
            <span>{formatDate(post.date)}</span>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/4 transition-colors duration-300 rounded-[inherit]" />
      </Link>
    </motion.div>
  );
}

/* ── Sidebar Card ───────────────────────────────────────────────────── */
function SidebarCard({ post, index, total }: { post: NewsPost; index: number; total: number }) {
  const img   = getPostImage(post, 'medium_large');
  const alt   = getPostImageAlt(post);
  const title = post.title.rendered;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/news/${post.slug}`}
        className={[
          'group flex items-center gap-4 py-4 transition-colors duration-150',
          'hover:bg-white/3 rounded-2xl px-2 -mx-2',
          index < total - 1 ? 'border-b border-[#161618]' : '',
        ].join(' ')}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-22 h-22 sm:w-25 sm:h-25 rounded-[18px] sm:rounded-[22px] overflow-hidden bg-zinc-800">
          {img && (
            <Image
              src={img}
              alt={alt}
              fill
              sizes="100px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-white text-[14px] sm:text-[15px] font-bold leading-[1.3] line-clamp-3 group-hover:text-white/90 transition-colors"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <span className="text-[#3a3a3a] text-[11px] font-medium mt-1.5 block">
            {formatDate(post.date)}
          </span>
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-[#2a2a2a] group-hover:text-[#555] transition-colors shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    </motion.div>
  );
}