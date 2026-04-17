'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

const NAV_LINKS =[
  { name: 'Сейчас в эфире', href: '#',          icon: 'live' },
  { name: 'Расписание',      href: '#schedule',  icon: 'schedule' },
  { name: 'Новости',         href: '#news',       icon: 'news' },
  { name: 'Теннис',          href: '/tennis',     icon: 'tennis' },
  { name: 'Футбол',          href: '/football',   icon: 'football' },
];

export default function Header() {
  const [activeIdx, setActiveIdx]   = useState(0);
  const[mobileOpen, setMobileOpen] = useState(false);
  const[indicator, setIndicator]   = useState({ left: 0, width: 0 });

  const navRef   = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  const moveIndicator = useCallback((idx: number) => {
    const nav = navRef.current;
    const el  = itemsRef.current[idx];
    if (!nav || !el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect  = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - navRect.left, width: elRect.width });
  },[]);

  useEffect(() => {
    moveIndicator(activeIdx);
  },[activeIdx, moveIndicator]);

  useEffect(() => {
    const onResize = () => moveIndicator(activeIdx);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  },[activeIdx, moveIndicator]);

  return (
    // lg:pt-8 — это 32px от верха на ПК. Боковые отступы lg:px-18.75 (75px) сохранены для выравнивания с текстом.
    <header className="fixed top-0 left-0 w-full z-50 pt-4 lg:pt-8 px-4 lg:px-18.75 transition-all duration-300 pointer-events-none">
      <div className="max-w-480 mx-auto flex items-center justify-between w-full pointer-events-auto">

        {/* Logo */}
        <Link href="/" className="shrink-0 transition-transform hover:scale-105">
          <Image src="/Logo.png" alt="PrimeSport" width={198} height={28} priority className="h-5 md:h-7 w-auto" />
        </Link>

        {/* ТЕМНЫЙ Glassmorphism Pill Nav — Desktop */}
        <nav className="hidden lg:flex justify-center flex-1 mx-8">
          <div
            ref={navRef}
            className="relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[100px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {/* Sliding indicator */}
            <span
              aria-hidden
              className="absolute top-1.5 h-[calc(100%-12px)] bg-white/15 border border-white/5 rounded-[100px] transition-all duration-300 ease-out pointer-events-none"
              style={{ left: indicator.left, width: indicator.width }}
            />

            {NAV_LINKS.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                ref={el => { itemsRef.current[idx] = el; }}
                onClick={() => setActiveIdx(idx)}
                className={[
                  'relative z-10 flex items-center gap-2 px-6 py-3',
                  'text-[15px] font-sans font-bold tracking-wide rounded-[100px]',
                  'transition-colors duration-200 whitespace-nowrap select-none',
                  activeIdx === idx ? 'text-white' : 'text-white/50 hover:text-white',
                ].join(' ')}
              >
                <NavIcon type={link.icon} active={activeIdx === idx} />
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Контейнер справа */}
        <div className="flex items-center shrink-0">
          
          {/* Жестко скрываем кнопку Фентези на мобилках с помощью обертки */}
          <div className="hidden lg:block">
            <GalaxyButton />
          </div>

          {/* Burger for Mobile */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2.5 flex flex-col gap-1.5 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10"
            aria-label="Меню"
          >
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-transform duration-300 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-4 h-0.5 bg-white rounded-full transition-transform duration-300 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile drawer (ТЕМНЫЙ Glassmorphism) */}
      <div className={[
        'lg:hidden overflow-hidden transition-all duration-300 ease-in-out absolute top-18 left-4 right-4 rounded-3xl pointer-events-auto',
        mobileOpen ? 'max-h-125 opacity-100 mt-2' : 'max-h-0 opacity-0',
      ].join(' ')}>
        <div className="bg-black/70 backdrop-blur-3xl p-3 flex flex-col gap-1.5 border border-white/10 rounded-3xl shadow-2xl">
          {NAV_LINKS.map((link, idx) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => { setActiveIdx(idx); setMobileOpen(false); }}
              className={[
                'flex items-center gap-3 py-3.5 px-5 rounded-2xl text-[16px] font-sans font-bold transition-colors',
                activeIdx === idx
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              <NavIcon type={link.icon} active={activeIdx === idx} />
              {link.name}
            </Link>
          ))}
          {/* Кнопка Фентези внутри меню на мобильных */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <GalaxyButton className="w-full justify-center" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Nav Icons ── */
function NavIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-4 h-4 shrink-0 transition-colors duration-200 ${active ? 'text-white' : 'text-white/50'}`;
  if (type === 'live') {
    return (
      <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
        <span className="absolute inline-flex w-3 h-3 rounded-full bg-red-500 opacity-60 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
      </span>
    );
  }
  if (type === 'schedule') return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  if (type === 'news') return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z" /><path d="M17 20v-8H7M7 8h3" /></svg>;
  if (type === 'tennis') return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3.5 9C5.5 9 7 7 7 4.5" /><path d="M20.5 9C18.5 9 17 7 17 4.5" /><path d="M3.5 15C5.5 15 7 17 7 19.5" /><path d="M20.5 15C18.5 15 17 17 17 19.5" /></svg>;
  if (type === 'football') return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3l2.5 3.5-2.5 2-2.5-2L12 3z" /><path d="M12 21l-2.5-3.5 2.5-2 2.5 2L12 21z" /><path d="M3 12l3.5-2.5 2 2.5-2 2.5L3 12z" /><path d="M21 12l-3.5 2.5-2-2.5 2-2.5L21 12z" /></svg>;
  return null;
}

/* ── Galaxy Fantasy Button ── */
function GalaxyButton({ className = '' }: { className?: string }) {
  return (
    <>
      <style>{`
        .galaxy-btn {
          --btn-bg: #0c0c14;
          --btn-primary: #8553f4;
          --btn-secondary: #3b82f6;
          --btn-accent: #f43f5e;
          font-family: inherit;
          font-size: 15px;
          padding: 0.8em 1.8em;
          border-radius: 100px;
          border: none;
          background: var(--btn-bg);
          position: relative;
          cursor: pointer;
          overflow: hidden;
          z-index: 1;
          transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          white-space: nowrap;
          display: inline-flex;
        }
        .galaxy-btn:active { transform: scale(0.96); }
        .galaxy-btn__content {
          display: flex; align-items: center; gap: 0.5em;
          position: relative; z-index: 2;
          color: #fff; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .galaxy-btn__icon { width: 1.2em; height: 1.2em; transition: transform 0.3s ease; fill: #fff; }
        .galaxy-btn:hover .galaxy-btn__icon { transform: translateX(0.2em) rotate(-10deg); }
        .galaxy-btn::before {
          content: ""; position: absolute; inset: -4px; z-index: 0;
          background: conic-gradient(from 0deg, var(--btn-bg) 0deg, var(--btn-primary) 60deg, var(--btn-secondary) 120deg, var(--btn-bg) 180deg, var(--btn-accent) 240deg, var(--btn-primary) 300deg, var(--btn-bg) 360deg);
          border-radius: 100px;
          animation: galaxy-rotate 4s linear infinite; filter: blur(8px); opacity: 0.7; transition: opacity 0.3s ease;
        }
        .galaxy-btn:hover::before { opacity: 1; animation-duration: 2s; }
        .galaxy-btn::after {
          content: ""; position: absolute; inset: 2px;
          background: var(--btn-bg); border-radius: 100px; z-index: 1;
        }
        .galaxy-btn__stars {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: radial-gradient(circle at 20% 30%, white 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, white 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, white 0.5px, transparent 1px);
          background-size: 120% 120%; opacity: 0.3; transition: opacity 0.3s ease;
        }
        .galaxy-btn:hover .galaxy-btn__stars { opacity: 0.8; animation: galaxy-star-drift 5s linear infinite alternate; }
        @keyframes galaxy-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes galaxy-star-drift { 0% { transform: scale(1); } 100% { transform: scale(1.1) translate(-2%,-2%); } }
      `}</style>

      <Link href="/fantasy" className={`galaxy-btn ${className}`}>
        <span className="galaxy-btn__content">
          <span>Фентези</span>
          <svg className="galaxy-btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M13 14h-2a8.999 8.999 0 0 0-7.968 4.81A10.136 10.136 0 0 1 3 18C3 12.477 7.477 8 13 8V3l10 8-10 8v-5z" />
          </svg>
        </span>
        <span className="galaxy-btn__stars" />
      </Link>
    </>
  );
}