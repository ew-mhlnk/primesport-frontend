'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import TelegramWidget from '@/components/TelegramWidget';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { WPPost } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Donation Modal ─── */
function DonationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Фон (затемнение) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Само окно */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-[32px] p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white text-[18px] font-bold">Поддержать трансляцию</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="text-[#666] text-[14px] leading-relaxed">
          Ваша поддержка помогает нам делать качественные трансляции. Выберите способ:
        </p>

        <a
          href="https://tips.tips/000457848"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white text-[15px] font-semibold">TipsTips</div>
            <div className="text-[#555] text-[13px] truncate">tips.tips/000457848</div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#444] group-hover:text-red-400 transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <a
          href="https://www.donationalerts.com/r/tvprimesport"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white text-[15px] font-semibold">Сообщение на экран</div>
            <div className="text-[#555] text-[13px] truncate">donationalerts.com/r/tvprimesport</div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#444] group-hover:text-red-400 transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </motion.div>
    </div>
  );
}

/* ─── Donate Button ─── */
function DonateButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        .donate-btn {
          --db:#0a0a0a;--dp:#dc2626;--ds:#ef4444;--da:#b91c1c;
          font-family:inherit;font-size:15px;font-weight:700;
          width:100%;padding:.85em 1.6em;border-radius:100px;border:none;
          background:var(--db);position:relative;cursor:pointer;
          overflow:hidden;z-index:1;display:inline-flex;
          align-items:center;justify-content:center;
          transition:transform .2s cubic-bezier(.25,.46,.45,.94);
        }
        .donate-btn:active{transform:scale(.96)}
        .donate-btn__content{
          display:flex;align-items:center;gap:.5em;
          position:relative;z-index:2;color:#fff;
          letter-spacing:.06em;text-transform:uppercase;
        }
        .donate-btn::before{
          content:"";position:absolute;inset:-4px;z-index:0;
          background:conic-gradient(from 0deg,var(--db) 0deg,var(--dp) 60deg,var(--ds) 120deg,var(--db) 180deg,var(--da) 240deg,var(--dp) 300deg,var(--db) 360deg);
          border-radius:100px;animation:db-spin 4s linear infinite;
          filter:blur(8px);opacity:.7;transition:opacity .3s ease;
        }
        .donate-btn:hover::before{opacity:1;animation-duration:1.8s}
        .donate-btn::after{
          content:"";position:absolute;inset:2px;
          background:var(--db);border-radius:100px;z-index:1;
        }
        .donate-btn__icon{width:1.1em;height:1.1em;fill:#fff;transition:transform .35s ease;flex-shrink:0}
        .donate-btn:hover .donate-btn__icon{transform:scale(1.2)}
        @keyframes db-spin{to{transform:rotate(360deg)}}
      `}</style>
      <button className="donate-btn" onClick={onClick}>
        <span className="donate-btn__content">
          <svg className="donate-btn__icon" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Задонатить</span>
        </span>
      </button>
    </>
  );
}

/* ─── Donation Widget (Изолирует состояние!) ─── */
function DonationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <DonateButton onClick={() => setIsOpen(true)} />
      <AnimatePresence>
        {isOpen && <DonationModal onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── Main MatchLayout ─── */
export default function MatchLayout({ post }: { post: WPPost }) {
  const isLive      = post.acf?.match_status === 'live' || post.acf?.is_live;
  const matchTitle  = post.acf?.match_subtitle || post.title.rendered;
  const tournament  = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;
  
  const telegramPostUrl = post.acf?.match_telegram_discussion;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <div className="pt-20 lg:pt-24">
        {/* Кнопка назад */}
        <div className="px-4 sm:px-6 lg:px-10 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[#555] hover:text-white text-[14px] font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Link>
        </div>

        {/* Основной контент */}
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

              {/* Левая колонка: плеер + мета */}
              <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4 lg:gap-6">

                {/* Плеер - ИСПРАВЛЕННЫЙ РАЗМЕР */}
                <div className="w-full aspect-video bg-[#0a0a0a] rounded-2xl lg:rounded-4xl overflow-hidden border border-white/6 relative">
                  {post.acf?.match_embed ? (
                    <div
                      className="absolute inset-0 w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:border-0"
                      dangerouslySetInnerHTML={{ __html: post.acf.match_embed }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#333] text-[15px] font-medium">Плеер недоступен</span>
                    </div>
                  )}
                </div>

                {/* Мета */}
                <div className="flex flex-col gap-2">
                  {isLive && (
                    <div className="inline-flex items-center gap-2 w-fit">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-500 text-[12px] font-bold tracking-widest uppercase">Live</span>
                    </div>
                  )}
                  <h1
                    className="text-white font-bold text-[28px] sm:text-[36px] lg:text-[48px] leading-[1.1] tracking-tight"
                    dangerouslySetInnerHTML={{ __html: matchTitle }}
                  />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {tournament && (
                      <span className="text-[#727272] text-[16px] sm:text-[18px] lg:text-[22px] font-medium">
                        {tournament}
                      </span>
                    )}
                    {tournament && commentator && (
                      <span className="text-[#333] select-none text-[18px]">·</span>
                    )}
                    {commentator && (
                      <span className="text-[#727272] text-[16px] sm:text-[18px] lg:text-[22px] font-medium">
                        {commentator}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Правая колонка: чат + донат */}
              <div className="w-full lg:w-96 xl:w-[420px] shrink-0 flex flex-col gap-4">
                <h2 className="text-white text-[16px] font-bold lg:hidden">
                  Обсуждение матча
                </h2>
                
                {/* ✅ Убрали жесткие рамки, overflow-hidden и фиксированную высоту */}
                <div className="w-full">
                  {telegramPostUrl ? (
                    <TelegramWidget postUrl={telegramPostUrl} />
                  ) : (
                    // Заглушка, если чат не подключен (оставляем её визуально аккуратной)
                    <div className="w-full h-32 rounded-2xl border border-white/6 bg-[#0a0a0a] flex items-center justify-center p-4 text-center">
                      <span className="text-zinc-600 text-sm font-medium">Обсуждение для этого матча не подключено</span>
                    </div>
                  )}
                </div>

                {/* Теперь виджет доната изолирован и не перезагружает плеер! */}
                <DonationWidget />
              </div>

            </div>
          </div>
        </div>

        <div className="h-16 lg:h-24" />
      </div>
    </main>
  );
}