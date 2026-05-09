'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import TelegramWidget from '@/components/TelegramWidget';
import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { WPPost } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Donation Modal ─── */
function DonationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-[32px] p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white text-[18px] font-bold">Поддержать трансляцию</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="text-[#666] text-[14px] leading-relaxed">
          Ваша поддержка помогает нам делать качественные трансляции. Выберите способ:
        </p>
        {[
          { href: 'https://tips.tips/000457848', label: 'TipsTips', sub: 'tips.tips/000457848', from: 'from-blue-500', to: 'to-blue-700', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          { href: 'https://www.donationalerts.com/r/tvprimesport', label: 'Сообщение на экран', sub: 'donationalerts.com/r/tvprimesport', from: 'from-blue-600', to: 'to-indigo-700', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
        ].map(item => (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center shrink-0`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d={item.icon}/></svg>
            </div>
            <div className="min-w-0">
              <div className="text-white text-[15px] font-semibold">{item.label}</div>
              <div className="text-[#555] text-[13px] truncate">{item.sub}</div>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#444] group-hover:text-blue-400 transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Donate Button — СИНЯЯ ─── */
function DonateButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        .donate-btn {
          --db:#0a0a0a;--dp:#2563eb;--ds:#60a5fa;--da:#1d4ed8;
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
          <span>Поддержать</span>
        </span>
      </button>
    </>
  );
}

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

/* ─── Chat Frame с collapse ─── */
function ChatFrame({ telegramPostUrl }: { telegramPostUrl: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-[#0a0a0b]">
      {/* Шапка чата */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {/* Telegram icon */}
          <div className="w-7 h-7 rounded-lg bg-[#229ED9]/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.92.44l-2.56-1.88-1.23 1.18c-.14.14-.26.26-.52.26l.18-2.6 4.72-4.26c.2-.18-.04-.28-.32-.1L7.46 14.4l-2.5-.78c-.54-.17-.55-.54.12-.8l9.76-3.76c.45-.16.84.11.8.74z"/>
            </svg>
          </div>
          <span className="text-white text-[13px] font-bold">Чат матча</span>
        </div>
        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="w-4 h-4 text-[#444]" />
        </motion.div>
      </button>

      {/* Разделитель */}
      <div className="h-px bg-white/[0.05]" />

      {/* Содержимое */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <TelegramWidget postUrl={telegramPostUrl} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── PlayerEmbed: извлекаем src → рендерим свой чистый iframe ─── */
function PlayerEmbed({ html }: { html: string }) {
  const src = html.match(/src=["']([^"']+)["']/)?.[1];

  if (!src) {
    // Fallback — src не нашли, рендерим raw с минимальным CSS-фиксом
    return (
      <>
        <style>{`.pfb,.pfb *:not(iframe){background:transparent!important}.pfb iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;display:block!important}`}</style>
        <div className="pfb absolute inset-0" dangerouslySetInnerHTML={{ __html: html }} />
      </>
    );
  }

  // Рендерим свой iframe — без wrapper-элементов, без scrollbar, без белого фона
  return (
    <iframe
      src={src}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
      allowFullScreen
      scrolling="no"
      className="absolute inset-0 w-full h-full border-0 block"
      style={{ background: '#000', colorScheme: 'normal' }}
    />
  );
}

/* ─── Main MatchLayout ─── */
export default function MatchLayout({ post }: { post: WPPost }) {
  const searchParams   = useSearchParams();
  const backUrl        = searchParams.get('from') || '/';
  const backLabel      = backUrl.startsWith('/tennis/') ? 'К турниру' : 'Назад';

  const isLive      = post.acf?.match_status === 'live' || post.acf?.is_live;
  const matchTitle  = post.acf?.match_subtitle || post.title.rendered;
  const tournament  = post.acf?.match_tournament || post.acf?.tournament;
  const commentator = post.acf?.match_commentator || post.acf?.commentator;
  const telegramPostUrl = post.acf?.match_telegram_discussion;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <div className="pt-20 lg:pt-24">
        <div className="px-4 sm:px-6 lg:px-10 py-4">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1 text-[#555] hover:text-white text-[14px] font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 xl:px-16">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

              {/* ── Левая колонка: плеер + мета ── */}
              <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4 lg:gap-5">

                {/* Плеер */}
                <div className="w-full aspect-video bg-black rounded-2xl lg:rounded-3xl overflow-hidden relative">
                  {post.acf?.match_embed ? (
                    <PlayerEmbed html={post.acf.match_embed} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#333] text-[15px] font-medium">Плеер недоступен</span>
                    </div>
                  )}
                </div>

                {/* Мета под плеером */}
                <div className="flex flex-col gap-1.5">
                  {isLive && (
                    <div className="inline-flex items-center gap-2 w-fit">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-500 text-[12px] font-bold tracking-widest uppercase">Live</span>
                    </div>
                  )}
                  <h1
                    className="text-white font-bold text-[24px] sm:text-[32px] lg:text-[44px] leading-[1.1] tracking-tight"
                    dangerouslySetInnerHTML={{ __html: matchTitle }}
                  />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                    {tournament && (
                      <span className="text-[#555] text-[15px] sm:text-[17px] lg:text-[20px] font-medium">
                        {tournament}
                      </span>
                    )}
                    {tournament && commentator && (
                      <span className="text-[#2a2a2a] select-none">·</span>
                    )}
                    {commentator && (
                      <span className="text-[#555] text-[15px] sm:text-[17px] lg:text-[20px] font-medium">
                        {commentator}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Правая колонка: чат + донат ── */}
              <div className="w-full lg:w-[380px] xl:w-[400px] shrink-0 flex flex-col gap-3">

                {telegramPostUrl ? (
                  <ChatFrame telegramPostUrl={telegramPostUrl} />
                ) : (
                  <div className="w-full rounded-2xl border border-white/[0.06] bg-[#0a0a0b] flex items-center justify-center p-5 text-center min-h-[80px]">
                    <span className="text-[#2a2a2a] text-[13px] font-medium">Чат для этой трансляции не подключён</span>
                  </div>
                )}

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