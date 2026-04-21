'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { WPPost } from '@/types';

export default function HeroLive({ post }: { post?: WPPost | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      const unlock = () => {
        video.play();
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
      };
      document.addEventListener('click', unlock);
      document.addEventListener('touchstart', unlock);
    });
  }, []);

  if (!post) {
    return (
      <div className="w-full h-[40svh] lg:h-svh bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-lg font-bold tracking-wide">
          Нет активных трансляций
        </p>
      </div>
    );
  }

  const isLive      = post.acf?.match_status === 'live' || post.acf?.is_live;
  const embedCode   = post.acf?.match_embed;
  const videoUrl    = post.acf?.video_url;
  const matchTitle  = post.acf?.match_subtitle || post.title.rendered;
  const tournament  = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;

  const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const coverUrl =
    featuredImageUrl ||
    (typeof post.acf?.match_cover === 'string' ? post.acf.match_cover : undefined) ||
    post.acf?.cover_image ||
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop';

  const extractSrc = (html: string): string | null => {
    const m = html.match(/src=["']([^"']+)["']/);
    return m ? m[1] : null;
  };
  const embedSrc    = embedCode ? extractSrc(embedCode) : null;
  const showEmbed   = isLive && embedSrc;

  return (
    <Link
      href={`/match/${post.id}`}
      className="group relative block w-full overflow-hidden bg-black cursor-pointer"
      // Высота блока: на мобилках 45svh, на десктопе 100svh
      style={{ height: 'calc(var(--hero-h, 100svh))' } as React.CSSProperties}
    >
      <style>{`
        :root { --hero-h: 100svh; }
        @media (max-width: 1023px) { :root { --hero-h: 45svh; } }
        @media (min-width: 768px) and (max-width: 1023px) { :root { --hero-h: 55svh; } }
      `}</style>

      {/* ── Обложка — всегда фоном ── */}
      <div
        className={[
          'absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000',
          showEmbed ? 'scale-110 blur-sm brightness-50' : 'group-hover:scale-105',
        ].join(' ')}
        style={{ backgroundImage: `url(${coverUrl})` }}
      />

      {/* ── Видеофайл (не live) ── */}
      {!showEmbed && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          autoPlay muted loop playsInline
        />
      )}

      {/*
        ── Live iframe — кадрируем видео 1080×1920 так, чтобы снизу
           оставалась зона ~350px для текста.

        Идея: iframe абсолютно позиционирован, его высота = ширина контейнера * (1920/1080).
        Это даёт нативный aspect-ratio видео. Затем смещаем его вверх так,
        чтобы нижние ~350px экрана были свободны — сдвиг вычисляется через CSS calc.

        На мобилках iframe скрыт — показываем только обложку (iframe 9:16 на узком экране выглядит плохо).
      ── */}
      {showEmbed && (
        <div className="absolute inset-0 hidden lg:block overflow-hidden z-10">
          {/* Контейнер: ширина 100%, высота = ширина * 1.778 (16:9 → 1080/1920 инвертировано = 9:16) */}
          {/* Видео вертикальное 9:16, значит соотношение высота/ширина = 1920/1080 ≈ 1.778 */}
          <div
            className={[
              'absolute left-1/2 -translate-x-1/2',
              'transition-opacity duration-700',
              iframeReady ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            style={{
              // Ширина: подбираем чтобы видео заняло всю ширину экрана
              // Для вертикального 9:16 видео: width = screenHeight * (9/16)
              // Но мы хотим показать только верхнюю часть → делаем iframe wider
              width: '56.25vh',   // = 100vh * 9/16 — ровно по высоте
              // Чтобы растянуть на всю ширину экрана:
              minWidth: '100%',
              // Высота = полная высота 9:16 видео
              height: 'calc(100vw * 1.7778)',
              minHeight: '100%',
              // Сдвигаем вверх: хотим чтобы нижние 350px были свободны
              // top: 0 → верх видео совпадает с верхом контейнера
              top: 0,
            }}
          >
            <iframe
              src={`${embedSrc}${embedSrc.includes('?') ? '&' : '?'}autoplay=1&muted=1`}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"
              allowFullScreen
              className="w-full h-full border-0"
              onLoad={() => setIframeReady(true)}
            />
          </div>
        </div>
      )}

      {/* ── Градиент — усиленный снизу чтобы текст читался ── */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }}
      />

      {/* ── Контент — прижат к низу, занимает примерно 350px зону ── */}
      <div className="absolute bottom-5 md:bottom-8 lg:bottom-14 left-4 sm:left-6 lg:left-10 right-4 sm:right-6 lg:right-10 z-30">
        <div className="max-w-4xl">

          {/* LIVE badge */}
          {isLive && (
            <div className="inline-flex items-center justify-center px-2.5 h-6 lg:h-7 rounded-md bg-red-600 mb-2 lg:mb-3">
              <span className="text-white text-[12px] lg:text-[14px] font-bold leading-none tracking-widest">
                LIVE
              </span>
            </div>
          )}

          {/* Match title */}
          <h1
            className="text-white font-bold text-[20px] sm:text-[30px] md:text-[42px] lg:text-[64px] leading-[1.08] tracking-tight drop-shadow-xl"
            dangerouslySetInnerHTML={{ __html: matchTitle }}
          />

          {/* Tournament · Commentator */}
          <div className="flex flex-wrap items-center gap-x-2 lg:gap-x-4 mt-1 lg:mt-2 text-[#909090] font-normal text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px]">
            {tournament && <span className="drop-shadow-md">{tournament}</span>}
            {tournament && commentator && <span className="text-[#444] select-none">·</span>}
            {commentator && <span className="drop-shadow-md">{commentator}</span>}
          </div>

        </div>
      </div>
    </Link>
  );
}