'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { WPPost } from '@/types';

interface HeroLiveProps {
  post?: WPPost | null;
  relatedPosts?: WPPost[];
}

function extractSrc(html: string): string | null {
  const m = html.match(/src=["']([^"']+)["']/);
  return m ? m[1] : null;
}

function getCoverUrl(p: WPPost): string {
  return (
    p._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    (typeof p.acf?.match_cover === 'string' ? p.acf.match_cover : '') ||
    ''
  );
}

function buildAutoplayUrl(src: string): string {
  try {
    const u = new URL(src.startsWith('//') ? `https:${src}` : src);
    u.searchParams.set('autoplay', '1');
    u.searchParams.set('mute', '1');
    u.searchParams.set('muted', '1');
    u.searchParams.set('controls', '0');
    u.searchParams.set('playsinline', '1');
    u.searchParams.set('loop', '1');
    u.searchParams.set('rel', '0');
    return u.toString();
  } catch {
    return src;
  }
}

/* ─── Card dimensions (must match Tailwind classes below) ─── */
const CARD_W = { mobile: 168, sm: 224, lg: 384 } as const;
const GAP    = { mobile: 16,  sm: 16,  lg: 24  } as const;

export default function HeroLive({ post, relatedPosts = [] }: HeroLiveProps) {
  const router = useRouter();
  const[slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [cardsVisible, setCardsVisible] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

  const carouselPosts = relatedPosts.filter(p => p.id !== post?.id);

  // Вычисляем, сколько карточек влезает на экран, с учетом увеличенных отступов
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const totalW = containerRef.current.offsetWidth;
      const w = window.innerWidth;

      const infoW = w >= 1024 && slideIdx === 0
        ? Math.min(totalW * 0.45, 540)
        : 0;

      const arrowsW = w >= 640 ? 120 : 100; 
      const available = totalW - infoW - arrowsW - (w >= 1024 ? 40 : 20);

      const cardW = w >= 1024 ? CARD_W.lg + GAP.lg
                  : w >= 640  ? CARD_W.sm + GAP.sm
                  : CARD_W.mobile + GAP.mobile;

      const count = Math.max(1, Math.floor(available / cardW));
      setCardsVisible(count);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [slideIdx]);

  if (!post) {
    return (
      <div className="w-full flex items-center justify-center bg-black" style={{ height: '100svh' }}>
        <p className="text-zinc-700 text-sm font-semibold tracking-widest uppercase">
          Нет активных трансляций
        </p>
      </div>
    );
  }

  // ✅ Принудительно приводим к boolean, чтобы удовлетворить строгий TS (Ошибка 2322)
  const isLive = Boolean(post.acf?.match_status === 'live' || post.acf?.is_live);
  
  const embedCode = post.acf?.match_embed;
  const rawSrc    = embedCode ? extractSrc(embedCode) : null;
  const embedSrc  = rawSrc ? buildAutoplayUrl(rawSrc) : null;
  const coverUrl  = getCoverUrl(post);

  const totalSlides = carouselPosts.length > 0
    ? 1 + Math.ceil(Math.max(0, carouselPosts.length - cardsVisible) / cardsVisible)
    : 1;

  function cardsForSlide(idx: number): WPPost[] {
    if (idx === 0) return carouselPosts.slice(0, cardsVisible);
    const start = cardsVisible + (idx - 1) * cardsVisible;
    return carouselPosts.slice(start, start + cardsVisible);
  }

  const canNext = slideIdx < totalSlides - 1;
  const canPrev = slideIdx > 0;

  function goNext() {
    if (!canNext) return;
    setDirection(1);
    setSlideIdx(i => i + 1);
  }
  function goPrev() {
    if (!canPrev) return;
    setDirection(-1);
    setSlideIdx(i => i - 1);
  }

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: '100svh' }}
    >
      {/* ══ СЛОЙ 1: ВИДЕО / ПОСТЕР ══════════════════════════════ */}
      {embedSrc ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width:  'max(100vw, calc(100svh * 16 / 9))',
              height: 'max(100svh, calc(100vw * 9 / 16))',
            }}
          >
            <iframe
              src={embedSrc}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      ) : coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-950" />
      )}

      {/* ══ СЛОЙ 2: ГРАДИЕНТЫ ════════════════════════════════════ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.1) 58%, transparent 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.05) 62%, transparent 100%)' }}
      />

      {/* ══ СЛОЙ 3: КЛИК ЗОНА ════════════════════════════════════ */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={() => router.push(`/match/${post.id}`)}
      />

      {/* ══ СЛОЙ 4: КОНТЕНТ ══════════════════════════════════════ */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-20 flex flex-col justify-end pb-8 sm:pb-12 lg:pb-16 px-5 sm:px-8 lg:px-12 pointer-events-none"
      >
        <div className="w-full">
          <div className="overflow-hidden w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={slideIdx}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease:[0.22, 1, 0.36, 1] }}
                className="w-full flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-0"
              >
                {/* Левый блок инфо — только на 1-м слайде */}
                {slideIdx === 0 && (
                  <div
                    className="shrink-0 lg:w-[45%] lg:pr-8 pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    <InfoBlock post={post} isLive={isLive} />
                  </div>
                )}

                {/* Блок карусели */}
                {carouselPosts.length > 0 && (
                  <div
                    className={[
                      'flex items-center gap-3 sm:gap-4 lg:gap-6 pointer-events-auto',
                      slideIdx === 0 ? 'lg:flex-1 lg:justify-end' : 'w-full justify-center',
                    ].join(' ')}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Появляется только если есть куда листать назад */}
                    {canPrev && <ArrowBtn dir="left" onClick={goPrev} />}

                    {/* Карточки */}
                    <div className="flex items-end gap-4 lg:gap-6">
                      {cardsForSlide(slideIdx).map(p => (
                        <CarouselCard key={p.id} post={p} />
                      ))}
                    </div>

                    {/* Появляется только если есть куда листать вперед */}
                    {canNext && <ArrowBtn dir="right" onClick={goNext} />}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Пагинация (точки) */}
          {totalSlides > 1 && (
            <div
              className="flex items-center gap-1.5 mt-4 sm:mt-5 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > slideIdx ? 1 : -1); setSlideIdx(i); }}
                  className={`rounded-full transition-all duration-300 ${
                    i === slideIdx
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Слайд ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Arrow button ───────────────────────────────────────────── */
function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Предыдущий' : 'Следующий'}
      className="
        shrink-0 self-center
        w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full
        flex items-center justify-center
        border border-white/15 backdrop-blur-md
        transition-all duration-200 active:scale-95
        bg-white/10 hover:bg-white/20 cursor-pointer text-white
      "
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dir === 'left'
          ? <path d="M15 18l-6-6 6-6" />
          : <path d="M9 18l6-6-6-6" />
        }
      </svg>
    </button>
  );
}

/* ── Info Block ─────────────────────────────────────────────── */
function InfoBlock({ post, isLive }: { post: WPPost; isLive: boolean }) {
  const title       = post.acf?.match_subtitle || post.title.rendered;
  const tournament  = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;

  return (
    <div>
      {isLive && (
        <div className="inline-flex items-center mb-3 sm:mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold tracking-widest uppercase">
            LIVE
          </span>
        </div>
      )}
      <h1
        className="text-white font-bold leading-[1.05] tracking-tight line-clamp-2"
        style={{ fontSize: 'clamp(1.6rem, 3.8vw, 3.8rem)' }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3">
        {tournament && (
          <span className="text-[#888]" style={{ fontSize: 'clamp(0.78rem, 1.3vw, 1.05rem)' }}>
            {tournament}
          </span>
        )}
        {tournament && commentator && <span className="text-[#444]">·</span>}
        {commentator && (
          <span className="text-[#888]" style={{ fontSize: 'clamp(0.78rem, 1.3vw, 1.05rem)' }}>
            Комментатор:{' '}
            <span className="text-white/80 font-semibold">{commentator}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Carousel Card ────────────────────────────────────────────── */
function CarouselCard({ post }: { post: WPPost }) {
  const router     = useRouter();
  const coverUrl   = getCoverUrl(post);
  const title      = post.acf?.match_subtitle || post.title.rendered;
  const isLive     = post.acf?.match_status === 'live' || post.acf?.is_live;
  const tournament = post.acf?.match_tournament;

  return (
    <motion.button
      onClick={() => router.push(`/match/${post.id}`)}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="
        group relative shrink-0 overflow-hidden bg-zinc-900
        rounded-3xl sm:rounded-4xl lg:rounded-[40px]
        w-42 h-28
        sm:w-56 sm:h-37.25
        lg:w-96 lg:h-64
      "
    >
      {/* 1. Cover */}
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}

      {/* 2. Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.05) 77%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 55%)' }}
      />

      {/* 3. LIVE badge */}
      {isLive && (
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 lg:top-4 lg:left-4">
          <div className="relative">
            <svg
              viewBox="0 0 54 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-4.5 sm:w-10 sm:h-5.5 lg:w-13.5 lg:h-7.5"
            >
              <rect width="54" height="30" rx="7" fill="#FF0000" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold tracking-widest uppercase text-[7px] sm:text-[8px] lg:text-[10px]">
              LIVE
            </span>
          </div>
        </div>
      )}

      {/* 4+5. Text content */}
      <div className="absolute inset-0 flex flex-col justify-end p-2.5 sm:p-3 lg:p-5">
        <p
          className="text-white font-bold leading-[1.15] line-clamp-3 text-left mb-1"
          style={{ fontSize: 'clamp(0.6rem, 1.5vw, 1.15rem)' }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {tournament && (
          <p
            className="text-[#727272] font-normal leading-tight truncate text-left"
            style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.75rem)' }}
          >
            {tournament}
          </p>
        )}
      </div>
    </motion.button>
  );
}