'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Навигация ─────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { name: 'Сейчас в эфире', href: '#',        icon: 'live'     },
  { name: 'Расписание',     href: '#schedule', icon: 'schedule' },
  { name: 'Новости',        href: '#news',     icon: 'news'     },
  { name: 'Теннис',         href: '/tennis',   icon: 'tennis'   },
  { name: 'Бокс',           href: '/football', icon: 'football' },
];

/* ─── Модал поддержки ───────────────────────────────────────────────────── */
function SupportModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm border border-white/10 rounded-[32px] p-6 flex flex-col gap-4 shadow-2xl"
        style={{
          background: 'rgba(10, 10, 14, 0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white text-[18px] font-bold">Поддержать трансляцию</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="text-[#555] text-[14px] leading-relaxed">
          Ваша поддержка помогает нам делать качественные трансляции. Выберите способ:
        </p>

        {[
          {
            href: 'https://tips.tips/000457848',
            label: 'TipsTips',
            sub: 'tips.tips/000457848',
            icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
            from: 'from-red-500',
            to: 'to-orange-500',
          },
          {
            href: 'https://www.donationalerts.com/r/tvprimesport',
            label: 'Сообщение на экран',
            sub: 'donationalerts.com/r/tvprimesport',
            icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
            from: 'from-red-600',
            to: 'to-red-800',
          },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center shrink-0`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">{item.icon}</svg>
            </div>
            <div className="min-w-0">
              <div className="text-white text-[15px] font-semibold">{item.label}</div>
              <div className="text-[#555] text-[13px] truncate">{item.sub}</div>
            </div>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#444] group-hover:text-red-400 transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Кнопка поддержки ──────────────────────────────────────────────────── */
function SupportButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <style>{`
        .support-btn {
          --sb-bg: #080810;
          --sb-p: #2563eb;
          --sb-s: #60a5fa;
          --sb-a: #3b82f6;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          padding: .65em 1.5em;
          border-radius: 100px;
          border: none;
          background: var(--sb-bg);
          position: relative;
          cursor: pointer;
          overflow: hidden;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          transition: transform .2s cubic-bezier(.25,.46,.45,.94);
          letter-spacing: .05em;
        }
        .support-btn:active { transform: scale(.96); }
        .support-btn__content {
          display: flex;
          align-items: center;
          gap: .5em;
          position: relative;
          z-index: 2;
          color: #fff;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .support-btn::before {
          content: "";
          position: absolute;
          inset: -4px;
          z-index: 0;
          background: conic-gradient(
            from 0deg,
            var(--sb-bg)  0deg,
            var(--sb-p)  60deg,
            var(--sb-s) 120deg,
            var(--sb-bg) 180deg,
            var(--sb-a) 240deg,
            var(--sb-p) 300deg,
            var(--sb-bg) 360deg
          );
          border-radius: 100px;
          animation: sb-spin 4s linear infinite;
          filter: blur(8px);
          opacity: .7;
          transition: opacity .3s ease;
        }
        .support-btn:hover::before { opacity: 1; animation-duration: 1.8s; }
        .support-btn::after {
          content: "";
          position: absolute;
          inset: 2px;
          background: var(--sb-bg);
          border-radius: 100px;
          z-index: 1;
        }
        .support-btn__icon {
          width: 1.1em;
          height: 1.1em;
          fill: #fff;
          transition: transform .35s ease;
          flex-shrink: 0;
        }
        .support-btn:hover .support-btn__icon { transform: scale(1.2); }
        @keyframes sb-spin { to { transform: rotate(360deg); } }
      `}</style>

      <button className="support-btn" onClick={onClick}>
        <span className="support-btn__content">
          <svg className="support-btn__icon" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Поддержать</span>
        </span>
      </button>
    </>
  );
}

/* ─── Header ────────────────────────────────────────────────────────────── */
export default function Header() {
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [hoverIdx,    setHoverIdx]    = useState<number | null>(null);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [activeLine,  setActiveLine]  = useState({ left: 0, width: 0 });
  const [hoverLine,   setHoverLine]   = useState({ left: 0, width: 0, visible: false });

  const headerRef = useRef<HTMLElement>(null);
  const itemsRef  = useRef<(HTMLAnchorElement | null)[]>([]);

  const getPos = useCallback((idx: number) => {
    const h  = headerRef.current;
    const el = itemsRef.current[idx];
    if (!h || !el) return { left: 0, width: 0 };
    const hr = h.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return { left: er.left - hr.left, width: er.width };
  }, []);

  useEffect(() => { setActiveLine(getPos(activeIdx)); }, [activeIdx, getPos]);

  useEffect(() => {
    const fn = () => setActiveLine(getPos(activeIdx));
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [activeIdx, getPos]);

  useEffect(() => {
    if (hoverIdx === null) {
      setHoverLine(p => ({ ...p, visible: false }));
    } else {
      setHoverLine({ ...getPos(hoverIdx), visible: true });
    }
  }, [hoverIdx, getPos]);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 w-full z-50 border-b border-white/[0.06]"
        style={{
          background: 'rgba(5, 5, 8, 0.72)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        }}
      >
        {/* Shimmer top */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.08) 60%, transparent)' }}
        />

        <div
          className="h-[72px] grid lg:grid-cols-[240px_1fr_240px] grid-cols-[1fr_auto] items-center"
          style={{ paddingLeft: '56px', paddingRight: '56px' }}
        >
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="transition-opacity hover:opacity-70 pointer-events-auto">
              <Image
                src="/Logo.png"
                alt="PrimeSport"
                width={180}
                height={28}
                priority
                className="h-5 md:h-[22px] w-auto"
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center justify-center h-[72px] pointer-events-auto">
            {NAV_LINKS.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                ref={el => { itemsRef.current[idx] = el; }}
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className={[
                  'flex items-center gap-1.5 px-4 h-full',
                  'text-[13px] font-bold tracking-wide whitespace-nowrap select-none',
                  'transition-colors duration-150',
                  activeIdx === idx ? 'text-white' : 'text-[#606370] hover:text-white',
                ].join(' ')}
              >
                <NavIcon type={link.icon} active={activeIdx === idx} />
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center justify-end gap-3 pointer-events-auto">
            <div className="hidden lg:block">
              <SupportButton onClick={() => setSupportOpen(true)} />
            </div>

            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-full border border-white/10 bg-white/5"
              aria-label="Меню"
            >
              <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
              <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center ${mobileOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active underline */}
        <span
          aria-hidden
          className="hidden lg:block absolute bottom-0 h-[3px] bg-blue-500 rounded-t-full transition-all duration-300 ease-out pointer-events-none"
          style={{ left: activeLine.left, width: activeLine.width }}
        />

        {/* Hover underline */}
        <span
          aria-hidden
          className="hidden lg:block absolute bottom-0 h-[3px] rounded-t-full pointer-events-none transition-all duration-150"
          style={{
            left: hoverLine.left,
            width: hoverLine.width,
            background: 'rgba(59,130,246,0.22)',
            opacity: hoverLine.visible ? 1 : 0,
          }}
        />

        {/* Mobile menu */}
        <div
          className={[
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-white/[0.06]',
            mobileOpen ? 'max-h-[440px] opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
          style={{
            background: 'rgba(5, 5, 8, 0.96)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link, idx) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => { setActiveIdx(idx); setMobileOpen(false); }}
                className={[
                  'flex items-center gap-3 py-3 px-4 rounded-xl text-[13px] font-bold transition-colors',
                  activeIdx === idx
                    ? 'text-white bg-white/5 border-l-2 border-blue-500'
                    : 'text-[#606370] hover:text-white hover:bg-white/5',
                ].join(' ')}
              >
                <NavIcon type={link.icon} active={activeIdx === idx} />
                {link.name}
              </Link>
            ))}
            <div className="mt-2 pt-3 border-t border-white/[0.06]">
              <SupportButton onClick={() => { setSupportOpen(true); setMobileOpen(false); }} />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── Nav icons ─────────────────────────────────────────────────────────── */
function NavIcon({ type, active }: { type: string; active: boolean }) {
  const cls = `w-[14px] h-[14px] shrink-0 transition-colors duration-150 ${active ? 'text-white' : 'text-[#606370]'}`;

  if (type === 'live') return (
    <span className="relative flex items-center justify-center w-[14px] h-[14px] shrink-0">
      <span className="absolute inline-flex w-[10px] h-[10px] rounded-full bg-red-500 opacity-50 animate-ping" />
      <span className="relative inline-flex w-[6px] h-[6px] rounded-full bg-red-500" />
    </span>
  );
  if (type === 'schedule') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
  if (type === 'news') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2z"/><path d="M17 20v-8H7M7 8h3"/>
    </svg>
  );
  if (type === 'tennis') return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M3.5 9C5.5 9 7 7 7 4.5M20.5 9C18.5 9 17 7 17 4.5M3.5 15C5.5 15 7 17 7 19.5M20.5 15C18.5 15 17 17 17 19.5"/>
    </svg>
  );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 3l2.5 3.5-2.5 2-2.5-2L12 3zM12 21l-2.5-3.5 2.5-2 2.5 2L12 21zM3 12l3.5-2.5 2 2.5-2 2.5L3 12zM21 12l-3.5 2.5-2-2.5 2-2.5L21 12z"/>
    </svg>
  );
}