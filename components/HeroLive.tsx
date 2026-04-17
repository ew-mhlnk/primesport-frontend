'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { WPPost } from '@/types';

export default function HeroLive({ post }: { post?: WPPost | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
  },[]);

  if (!post) {
    return (
      <div className="w-full h-[40svh] lg:h-svh bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-lg font-sans font-bold tracking-wide">Нет активных трансляций</p>
      </div>
    );
  }

  const videoUrl = post.acf?.video_url;
  const featuredImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const coverUrl = featuredImageUrl 
    || (typeof post.acf?.match_cover === 'string' ? post.acf.match_cover : undefined)
    || post.acf?.cover_image 
    || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2000&auto=format&fit=crop';

  const isLive = post.acf?.match_status === 'live' || post.acf?.is_live;
  const matchTitle = post.acf?.match_subtitle || post.title.rendered;
  const tournament = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;

  return (
    <Link 
      href={`/match/${post.id}`} 
      // Адаптивная высота: 40svh (около трети) на мобилках/планшетах, 100svh на ПК
      className="group relative block w-full h-[45svh] md:h-[50svh] lg:h-svh min-h-87.5 lg:min-h-screen overflow-hidden bg-black cursor-pointer"
    >
      {/* ── Media layer ── */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      )}

      {/* ── Gradient overlay ── */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* ── Content Wrapper ── */}
      <div className="absolute bottom-5 md:bottom-10 lg:bottom-20 left-5 lg:left-18.75 right-5 lg:right-18.75 flex flex-col justify-end z-10">
        
        <div className="max-w-350">
          {/* Плашка LIVE */}
          {isLive && (
            <div className="w-11 h-6 lg:w-13.5 lg:h-7.5 rounded-[5px] lg:rounded-[7px] bg-[#FF0000] flex items-center justify-center mb-3 lg:mb-7.5">
              <span className="text-white text-[14px] lg:text-[20px] font-sans font-bold leading-none tracking-wide relative top-px">
                LIVE
              </span>
            </div>
          )}

          {/* Match Title (адаптивный размер шрифта) */}
          <h1 
            className="text-white font-sans font-bold text-[28px] md:text-[42px] lg:text-[75px] leading-[1.1] lg:leading-[1.05] tracking-tight drop-shadow-xl"
            dangerouslySetInnerHTML={{ __html: matchTitle }}
          />

          {/* Bottom Row (адаптивный размер шрифта) */}
          <div className="flex flex-wrap items-center gap-x-3 lg:gap-x-7.5 mt-2 lg:mt-4 text-[#727272] font-sans font-bold text-[14px] md:text-[18px] lg:text-[25px]">
            {tournament && (
              <span className="drop-shadow-md">{tournament}</span>
            )}
            {commentator && (
              <span className="drop-shadow-md">{commentator}</span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}