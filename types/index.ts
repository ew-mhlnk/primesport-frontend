export interface WPRendered {
  rendered: string;
}

export interface WPPost {
  id: number;
  title: WPRendered;
  content?: WPRendered;
  slug: string;
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
  acf?: {
    match_subtitle?: string;
    match_cover?: number | string; 
    match_embed?: string;
    match_sport?: string;
    match_status?: string; // "live", "finished" и т.д.
    match_tournament?: string;
    match_commentator?: string;
    match_telegram_discussion?: string; // ✅ НОВОЕ ПОЛЕ — ссылка на Telegram-чат

    // Оставим старые поля на случай, если какие-то посты еще не переведены:
    video_url?: string;
    cover_image?: string;
    is_live?: boolean;
    tournament?: string;
    commentator?: string;
  };
}

// ✅ Шаг 8 — Обновлённый FormattedMatch
export interface FormattedMatch {
  id:             number;
  time:           string;
  player1:        string;   // уже по-русски
  player2:        string;
  player1Flag:    string;   // "AU"
  player2Flag:    string;
  tournament:     string;   // уже по-русски
  tournamentMeta?: {
    surface?:  string;
    category?: string;
    city?:     string;
  };
  status:         string;
  score:          string;
  dateLabel:      string;
  rawTimestamp:   number;
}