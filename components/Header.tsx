'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';

const NAV_LINKS = [
  { name: 'Сейчас в эфире', href: '#',         icon: 'live'     },
  { name: 'Расписание',     href: '#schedule',  icon: 'schedule' },
  { name: 'Новости',        href: '#news',       icon: 'news'     },
  { name: 'Теннис',         href: '/tennis',     icon: 'tennis'   },
  { name: 'Футбол',         href: '/football',   icon: 'football' },
];

export default function Header() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  const headerRef = useRef<HTMLElement>(null);
  const itemsRef  = useRef<(HTMLAnchorElement | null)[]>([]);

  const moveUnderline = useCallback((idx: number) => {
    const header = headerRef.current;
    const el     = itemsRef.current[idx];
    if (!header || !el) return;
    const hRect = header.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setUnderline({ left: eRect.left - hRect.left, width: eRect.width });
  }, []);

  useEffect(() => { moveUnderline(activeIdx); }, [activeIdx, moveUnderline]);

  useEffect(() => {
    const onResize = () => moveUnderline(activeIdx);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIdx, moveUnderline]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 w-full z-50 bg-black border-b border-[#2D3039] pointer-events-none"
    >
      {/* ── Main row ── */}
      <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 pointer-events-auto">

        {/* Logo — максимально влево */}
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-75">
          <Image
            src="/Logo.png"
            alt="PrimeSport"
            width={198}
            height={28}
            priority
            className="h-5 md:h-7 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex justify-center flex-1 mx-6 h-full items-center">
          <div className="flex items-center h-full">
            {NAV_LINKS.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                ref={el => { itemsRef.current[idx] = el; }}
                onClick={() => setActiveIdx(idx)}
                className={[
                  'flex items-center gap-2 px-5 h-full',
                  'text-[15px] font-semibold tracking-wide',
                  'transition-colors duration-200 whitespace-nowrap select-none',
                  activeIdx === idx ? 'text-white' : 'text-[#747781] hover:text-white',
                ].join(' ')}
              >
                <NavIcon type={link.icon} active={activeIdx === idx} />
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right: Fantasy + Burger */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:block">
            <GalaxyButton />
          </div>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-full border border-[#2D3039] bg-neutral-900"
            aria-label="Меню"
          >
            <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Blue underline — прилипает к нижней границе хедера ── */}
      <span
        aria-hidden
        className="hidden lg:block absolute bottom-0 h-0,75px bg-blue-600 transition-all duration-300 ease-out pointer-events-none"
        style={{ left: underline.left, width: underline.width }}
      />

      {/* ── Mobile drawer ── */}
      <div className={[
        'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
        'border-t border-[#2D3039] bg-black pointer-events-auto',
        mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
      ].join(' ')}>
        <div className="px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link, idx) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => { setActiveIdx(idx); setMobileOpen(false); }}
              className={[
                'flex items-center gap-3 py-3 px-4 rounded-xl text-[15px] font-semibold transition-colors',
                activeIdx === idx
                  ? 'text-white bg-white/5 border-l-2 border-blue-600'
                  : 'text-[#747781] hover:text-white hover:bg-white/5',
              ].join(' ')}
            >
              <NavIcon type={link.icon} active={activeIdx === idx} />
              {link.name}
            </Link>
          ))}
          <div className="mt-2 pt-3 border-t border-[#2D3039]">
            <GalaxyButton className="w-full justify-center" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Nav Icons ── */
function NavIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-4 h-4 shrink-0 transition-colors duration-200 ${active ? 'text-white' : 'text-[#747781]'}`;

  if (type === 'live') return (
    <span className="relative flex items-center justify-center w-4 h-4 shrink-0">
      <span className="absolute inline-flex w-3 h-3 rounded-full bg-red-500 opacity-60 animate-ping" />
      <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
    </span>
  );
  if (type === 'schedule') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
  if (type === 'news') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z" />
      <path d="M17 20v-8H7M7 8h3" />
    </svg>
  );
  if (type === 'tennis') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9C5.5 9 7 7 7 4.5M20.5 9C18.5 9 17 7 17 4.5M3.5 15C5.5 15 7 17 7 19.5M20.5 15C18.5 15 17 17 17 19.5" />
    </svg>
  );
  if (type === 'football') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3l2.5 3.5-2.5 2-2.5-2L12 3zM12 21l-2.5-3.5 2.5-2 2.5 2L12 21zM3 12l3.5-2.5 2 2.5-2 2.5L3 12zM21 12l-3.5 2.5-2-2.5 2-2.5L21 12z" />
    </svg>
  );
  return null;
}

/* ── Galaxy Fantasy Button — blue stars ── */
function GalaxyButton({ className = '' }: { className?: string }) {
  return (
    <>
      <style>{`
        .galaxy-btn {
          --gb:#080810;--gp:#2563eb;--gs:#60a5fa;--ga:#3b82f6;
          font-family:inherit;font-size:15px;font-weight:700;
          padding:.7em 1.6em;border-radius:100px;border:none;
          background:var(--gb);position:relative;cursor:pointer;
          overflow:hidden;z-index:1;display:inline-flex;align-items:center;
          white-space:nowrap;text-decoration:none;
          transition:transform .2s cubic-bezier(.25,.46,.45,.94);
        }
        .galaxy-btn:active{transform:scale(.96)}
        .galaxy-btn__content{
          display:flex;align-items:center;gap:.45em;
          position:relative;z-index:2;color:#fff;
          letter-spacing:.06em;text-transform:uppercase;
        }
        .galaxy-btn::before{
          content:"";position:absolute;inset:-4px;z-index:0;
          background:conic-gradient(from 0deg,var(--gb) 0deg,var(--gp) 60deg,var(--gs) 120deg,var(--gb) 180deg,var(--ga) 240deg,var(--gp) 300deg,var(--gb) 360deg);
          border-radius:100px;animation:gb-spin 4s linear infinite;
          filter:blur(8px);opacity:.65;transition:opacity .3s ease;
        }
        .galaxy-btn:hover::before{opacity:1;animation-duration:1.8s}
        .galaxy-btn::after{
          content:"";position:absolute;inset:2px;
          background:var(--gb);border-radius:100px;z-index:1;
        }
        .galaxy-btn__stars{
          position:absolute;inset:0;z-index:1;pointer-events:none;
          background-image:
            radial-gradient(circle at 15% 25%,#93c5fd 1px,transparent 1.5px),
            radial-gradient(circle at 75% 65%,#bfdbfe 1px,transparent 1.5px),
            radial-gradient(circle at 50% 80%,#dbeafe .5px,transparent 1px),
            radial-gradient(circle at 85% 20%,#60a5fa .8px,transparent 1px),
            radial-gradient(circle at 30% 60%,#93c5fd .6px,transparent 1px);
          opacity:.25;transition:opacity .3s ease;
        }
        .galaxy-btn:hover .galaxy-btn__stars{opacity:.9;animation:gb-drift 4s linear infinite alternate}
        .galaxy-btn__icon{width:1.1em;height:1.1em;fill:#fff;transition:transform .35s ease;flex-shrink:0}
        .galaxy-btn:hover .galaxy-btn__icon{transform:rotate(20deg) scale(1.2)}
        @keyframes gb-spin{to{transform:rotate(360deg)}}
        @keyframes gb-drift{100%{transform:scale(1.12) translate(-2%,-2%)}}
      `}</style>
      <Link href="/fantasy" className={`galaxy-btn ${className}`}>
        <span className="galaxy-btn__content">
          <svg className="galaxy-btn__icon" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Фентези</span>
        </span>
        <span className="galaxy-btn__stars" />
      </Link>
    </>
  );
}