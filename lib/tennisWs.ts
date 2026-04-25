// lib/tennisWs.ts
import WebSocket from 'ws';
import { supabase } from './supabase';

// Используем глобальную переменную, чтобы в режиме разработки (next dev) 
// при Hot Reload не плодились сотни подключений
const globalForWs = global as unknown as { isTennisWsConnected?: boolean };

export function initTennisWs() {
  if (globalForWs.isTennisWsConnected) return;
  globalForWs.isTennisWsConnected = true;

  const apiKey = process.env.SPORTS_API_KEY;
  if (!apiKey) {
    console.error('❌ SPORTS_API_KEY не найден. WebSocket не запущен.');
    return;
  }

  // Создаем канал Supabase на сервере
  const channel = supabase.channel('tennis-live-scores');

  // Сервер должен подписаться на канал, чтобы иметь право рассылать Broadcast
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Сервер Next.js готов к рассылке Broadcast (Supabase)');
      connectToTennisAPI();
    }
  });

  function connectToTennisAPI() {
    console.log('🔄 Подключение сервера к API-Tennis WS...');
    const ws = new WebSocket(`wss://wss.api-tennis.com/live?APIkey=${apiKey}&timezone=+03:00`);

    ws.on('open', () => {
      console.log('✅ Сервер успешно подключился к API-Tennis (Ровно 1 соединение!)');
    });

    ws.on('message', (data) => {
      try {
        const matchData = JSON.parse(data.toString());
        
        // Как только сервер получает счет, он рассылает его ВСЕМ посетителям сайта
        channel.send({
          type: 'broadcast',
          event: 'score_update',
          payload: matchData,
        });
      } catch (err) {
        console.error('❌ Ошибка парсинга WS:', err);
      }
    });

    ws.on('close', () => {
      console.log('⚠️ Соединение с API-Tennis закрыто. Реконнект через 5 сек...');
      globalForWs.isTennisWsConnected = false;
      setTimeout(initTennisWs, 5000);
    });

    ws.on('error', (err) => {
      console.error('❌ Ошибка WebSocket API-Tennis:', err.message);
    });
  }
}