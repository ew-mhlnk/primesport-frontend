'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { animate, motion, AnimatePresence, useMotionValue } from 'framer-motion';
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

const CARD_W   = 280;
const CARD_GAP = 16;

export default function HeroLive({ post, relatedPosts = [] }: HeroLiveProps) {
  const router = useRouter();
  const [slideIdx,  setSlideIdx]  = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [visible,   setVisible]   = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

  const carouselPosts = relatedPosts.filter(p => p.id !== post?.id);

  const measure = useCallback(() => {
    if (!containerRef.current || window.innerWidth < 1024) return;
    const totalW   = containerRef.current.offsetWidth;
    // Правая часть = всё кроме левого инфо-блока (~42%) и стрелок (2×44px) и гапов
    const infoW    = slideIdx === 0 ? totalW * 0.42 : 0;
    const available = totalW - infoW - 88 - 48; // 88=2стрелки, 48=гапы
    const count    = Math.max(1, Math.floor((available + CARD_GAP) / (CARD_W + CARD_GAP)));
    setVisible(count);
  }, [slideIdx]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  if (!post) {
    return (
      <div className="w-full flex items-center justify-center bg-black h-64">
        <p className="text-zinc-700 text-sm font-semibold tracking-widest uppercase">
          Нет активных трансляций
        </p>
      </div>
    );
  }

  const isLive   = Boolean(post.acf?.match_status === 'live' || post.acf?.is_live);
  const rawSrc   = post.acf?.match_embed ? extractSrc(post.acf.match_embed) : null;
  const embedSrc = rawSrc ? buildAutoplayUrl(rawSrc) : null;
  const coverUrl = getCoverUrl(post);

  const totalSlides = carouselPosts.length > 0
    ? 1 + Math.ceil(Math.max(0, carouselPosts.length - visible) / visible)
    : 1;

  function cardsForSlide(idx: number): WPPost[] {
    if (idx === 0) return carouselPosts.slice(0, visible);
    const start = visible + (idx - 1) * visible;
    return carouselPosts.slice(start, start + visible);
  }

  function goNext() { setDirection(1);  setSlideIdx(i => (i + 1) % totalSlides); }
  function goPrev() { setDirection(-1); setSlideIdx(i => (i - 1 + totalSlides) % totalSlides); }

  // Spring-вариант: x-only, без opacity
  const slideVariants = {
    enter:  (d: number) => ({ x: d > 0 ? '55%' : '-55%' }),
    center: { x: '0%' },
    exit:   (d: number) => ({ x: d > 0 ? '-55%' : '55%' }),
  };
  const springTransition = {
    type:      'spring' as const,
    stiffness: 300,
    damping:   30,
    mass:      0.9,
  };

  return (
    <div className="flex flex-col lg:block">

      {/* ══ ГЕРОЙ ══ */}
      <div className="relative w-full overflow-hidden bg-black h-[62svh] lg:h-[100svh]">

        {/* Слой 1: Видео / постер */}
        {embedSrc ? (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width:  'max(100vw, calc(100% * 16 / 9))',
                height: 'max(100%, calc(100vw * 9 / 16))',
              }}
            >
              <iframe
                src={embedSrc}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        ) : coverUrl ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
        ) : (
          <div className="absolute inset-0 bg-zinc-950" />
        )}

        {/* Градиенты */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.1) 58%, transparent 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.05) 62%, transparent 100%)' }} />

        {/* Клик-зона */}
        <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => router.push(`/match/${post.id}`)} />

        {/* МОБИЛЕ: только инфо */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-5 pb-6">
          <InfoBlock post={post} isLive={isLive} />
        </div>

        {/* ДЕСКТОП: весь нижний блок */}
        <div
          ref={containerRef}
          className="hidden lg:block absolute bottom-0 left-0 right-0 z-20 pb-14 px-12 overflow-hidden pointer-events-none"
        >
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={slideIdx}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
              className="w-full flex flex-row items-end pointer-events-auto"
              style={{ willChange: 'transform' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Инфо — только на слайде 0 */}
              {slideIdx === 0 && (
                <div className="shrink-0 w-[42%] pr-8">
                  <InfoBlock post={post} isLive={isLive} />
                </div>
              )}

              {/* Карточки + стрелки */}
              {carouselPosts.length > 0 && (
                <div className={[
                  'flex items-center gap-4',
                  slideIdx === 0 ? 'flex-1' : 'w-full justify-center',
                ].join(' ')}>

                  {/* Левая стрелка */}
                  {totalSlides > 1 && (
                    <ArrowBtn dir="left" onClick={goPrev} />
                  )}

                  {/* Карточки */}
                  <div className="flex items-end gap-4 flex-1">
                    {cardsForSlide(slideIdx).map(p => (
                      <div key={p.id} className="flex-1 min-w-0" style={{ maxWidth: CARD_W }}>
                        <CarouselCard post={p} />
                      </div>
                    ))}
                  </div>

                  {/* Правая стрелка */}
                  {totalSlides > 1 && (
                    <ArrowBtn dir="right" onClick={goNext} />
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Точки пагинации */}
          {totalSlides > 1 && (
            <div
              className="flex items-center gap-1.5 mt-5 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > slideIdx ? 1 : -1); setSlideIdx(i); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === slideIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* МОБИЛЕ: карусель под героем */}
      {carouselPosts.length > 0 && (
        <div className="lg:hidden overflow-x-auto scrollbar-hide flex gap-3 px-4 pt-4 pb-2">
          {carouselPosts.map(p => (
            <div key={p.id} className="shrink-0 w-52">
              <CarouselCard post={p} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

/* ── Arrow ── */
function ArrowBtn({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Предыдущий' : 'Следующий'}
      className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-md bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-150 text-white"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

/* ── Info Block ── */
function InfoBlock({ post, isLive }: { post: WPPost; isLive: boolean }) {
  const title       = post.acf?.match_subtitle || post.title.rendered;
  const tournament  = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;

  return (
    <div>
      {isLive && (
        <div className="inline-flex items-center mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold tracking-widest uppercase">
            LIVE
          </span>
        </div>
      )}
      <h1
        className="text-white font-bold leading-[1.05] tracking-tight line-clamp-2"
        style={{ fontSize: 'clamp(1.2rem, 3.2vw, 3.4rem)' }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3">
        {tournament && (
          <span className="text-[#888]" style={{ fontSize: 'clamp(0.72rem, 1.3vw, 1.05rem)' }}>
            {tournament}
          </span>
        )}
        {tournament && commentator && <span className="text-[#444]">·</span>}
        {commentator && (
          <span className="text-[#888]" style={{ fontSize: 'clamp(0.72rem, 1.3vw, 1.05rem)' }}>
            Комментатор: <span className="text-white/80 font-semibold">{commentator}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Carousel Card — 16:9 ── */
function CarouselCard({ post }: { post: WPPost }) {
  const router     = useRouter();
  const coverUrl   = getCoverUrl(post);
  const title      = post.acf?.match_subtitle || post.title.rendered;
  const isLive     = post.acf?.match_status === 'live' || post.acf?.is_live;
  const tournament = post.acf?.match_tournament;

  return (
    <button
      onClick={() => router.push(`/match/${post.id}`)}
      className="group relative w-full aspect-video overflow-hidden bg-zinc-900 rounded-[20px] transition-transform duration-300 hover:scale-[1.04] hover:-translate-y-1 active:scale-[0.97]"
    >
      {coverUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' }}
      />
      {isLive && (
        <div className="absolute top-3 left-3">
          <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase">
            LIVE
          </span>
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-3 lg:p-4">
        <p
          className="text-white font-bold leading-[1.2] line-clamp-2 text-left text-[12px] lg:text-[14px]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {tournament && (
          <p className="text-white/40 text-[10px] lg:text-[11px] font-medium truncate text-left mt-0.5">
            {tournament}
          </p>
        )}
      </div>
    </button>
  );
}