'use client';

// components/NewsArticle.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { NewsPost } from '@/types/news';
import { getPostImage, getPostImageAlt, formatDate } from '@/lib/news';
import TelegramWidget from '@/components/TelegramWidget';
import Header from '@/components/Header';

interface Props {
  post: NewsPost;
}

export default function NewsArticle({ post }: Props) {
  const img    = getPostImage(post, 'full');
  const alt    = getPostImageAlt(post);
  const title  = post.title.rendered;
  const tgUrl  = post.acf?.telegram_post_url;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      {/* ── Mobile / Tablet: full-width hero image with gradient ── */}
      <div className="lg:hidden">
        <MobileLayout post={post} img={img} alt={alt} title={title} tgUrl={tgUrl} />
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden lg:block">
        <DesktopLayout post={post} img={img} alt={alt} title={title} tgUrl={tgUrl} />
      </div>
    </main>
  );
}

/* ── Mobile Layout ──────────────────────────────────────────────────── */
function MobileLayout({
  post, img, alt, title, tgUrl,
}: { post: NewsPost; img: string; alt: string; title: string; tgUrl?: string }) {
  return (
    <div>
      {/* Hero image with gradient overlay */}
      <div className="relative w-full" style={{ aspectRatio: '3/4', maxHeight: '75svh' }}>
        {img ? (
          <Image
            src={img}
            alt={alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}

        {/* Gradient: transparent top → dark bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #0a0a0b 0%, rgba(10,10,11,0.7) 40%, rgba(10,10,11,0.1) 70%, transparent 100%)',
          }}
        />

        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 pt-20 px-4 flex items-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-[13px] font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Link>
        </div>

        {/* Title overlaid on gradient */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
          <h1
            className="text-white font-bold leading-[1.1] tracking-tight"
            style={{ fontSize: 'clamp(1.4rem, 5.5vw, 2rem)' }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <div className="mt-2 text-white/40 text-[12px] font-medium">
            {formatDate(post.date)}
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="px-4 pt-6 pb-8">
        <NewsContent content={post.content.rendered} />
      </article>

      {/* Telegram comments */}
      {tgUrl && (
        <div className="px-4 pb-12">
          <CommentsBlock tgUrl={tgUrl} />
        </div>
      )}
    </div>
  );
}

/* ── Desktop Layout ─────────────────────────────────────────────────── */
function DesktopLayout({
  post, img, alt, title, tgUrl,
}: { post: NewsPost; img: string; alt: string; title: string; tgUrl?: string }) {
  return (
    <div className="pt-18">
      {/* Back */}
      <div className="px-10 xl:px-16 py-5">
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-[#555] hover:text-white text-[13px] font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Новости
        </Link>
      </div>

      <div className="px-10 xl:px-16 pb-20">
        <div className="max-w-330 mx-auto">
          <div className="flex gap-10 xl:gap-16 items-start">

            {/* LEFT: image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 w-[42%] xl:w-[46%] sticky top-24 self-start"
            >
              <div
                className="relative w-full rounded-4xl overflow-hidden bg-zinc-900"
                style={{ aspectRatio: '3/4' }}
              >
                {img ? (
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    sizes="45vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-900" />
                )}
              </div>
            </motion.div>

            {/* RIGHT: content */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 min-w-0 flex flex-col gap-8 pt-2"
            >
              {/* Title */}
              <div>
                <h1
                  className="text-white font-bold leading-[1.08] tracking-tight"
                  style={{ fontSize: 'clamp(1.8rem, 2.8vw, 3rem)' }}
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                <div className="mt-3 text-[#3a3a3a] text-[13px] font-medium">
                  {formatDate(post.date)}
                </div>
              </div>

              {/* Article text */}
              <article>
                <NewsContent content={post.content.rendered} />
              </article>

              {/* Telegram */}
              {tgUrl && <CommentsBlock tgUrl={tgUrl} />}
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── News Content (styled WP HTML) ─────────────────────────────────── */
function NewsContent({ content }: { content: string }) {
  return (
    <div
      className="news-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

/* ── Comments block ─────────────────────────────────────────────────── */
function CommentsBlock({ tgUrl }: { tgUrl: string }) {
  return (
    <div>
      <h2 className="text-white text-[16px] font-bold mb-4">Комментарии</h2>
      <TelegramWidget postUrl={tgUrl} />
    </div>
  );
}