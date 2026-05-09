// ✅ Матч от API-Tennis WebSocket
interface WsTennisMatch {
  event_key: string | number;
  event_type_type?: string;
  event_serve?: string;
  scores?: Array<{ score_first: string; score_second: string; }>;
  event_final_result?: string;
  event_game_result?: string;
  event_status?: string;
}

// ✅ Payload для Supabase Broadcast
interface ScoreUpdatePayload {
  event_key: number;
  scores: Array<{ score_first: string; score_second: string; }>;
  event_final_result?: string;
  event_game_result?: string;
  event_status?: string;
  event_serve?: string;
  serving: '1' | '2' | null;
}