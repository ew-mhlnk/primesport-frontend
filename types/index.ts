export interface WPRendered {
  rendered: string;
}

export interface WPPost {
  id:             number;
  title:          WPRendered;
  content?:       WPRendered;
  slug:           string;
  date:           string;   // ISO 8601 — дата публикации поста
  modified?:      string;
  featured_media?: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url:   string;
      alt_text?:    string;
      media_details?: {
        sizes?: {
          medium_large?: { source_url: string };
          large?:        { source_url: string };
          full?:         { source_url: string };
        };
      };
    }>;
  };
  acf?: {
    match_subtitle?:              string;
    match_cover?:                 number | string;
    match_embed?:                 string;
    match_sport?:                 string;
    match_status?:                string;
    match_tournament?:            string;
    match_commentator?:           string;
    match_telegram_discussion?:   string;
    video_url?:                   string;
    cover_image?:                 string;
    is_live?:                     boolean;
    tournament?:                  string;
    commentator?:                 string;
  };
}

export interface FormattedMatch {
  id:             number;
  time:           string;
  player1:        string;
  player2:        string;
  player1Flag:    string;
  player2Flag:    string;
  tournament:     string;
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