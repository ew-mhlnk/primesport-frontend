'use client';

import { useEffect, useRef } from 'react';

export default function TelegramWidget({ postUrl }: { postUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Очищаем контейнер при ререндере
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-discussion', postUrl); // например 'primesport/123'
    script.setAttribute('data-comments-limit', '5');
    script.setAttribute('data-color', 'E22F38'); // Custom цвет, можешь поменять
    script.setAttribute('data-dark', '1'); // Темная тема
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, [postUrl]);

  return <div ref={containerRef} className="w-full bg-zinc-900 p-4 md:p-8 rounded-[40px]" />;
}