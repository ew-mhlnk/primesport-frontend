'use client';

import { useEffect, useRef } from 'react';

export default function TelegramWidget({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-discussion', postUrl);
    script.setAttribute('data-comments-limit', '5');
    script.setAttribute('data-color', 'E22F38'); // Цвет кнопки
    script.setAttribute('data-dark', '1'); // Темная тема
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [postUrl]);

  // ✅ Убрали все лишние отступы и фоны, оставили только w-full
  return <div ref={containerRef} className="w-full" />;
}