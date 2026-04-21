import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,        // https://abcdefghijk.supabase.co
  process.env.SUPABASE_ANON_KEY!    // sb_publishable_iQ4cRe8AC5m3DDWKUaS-1w_yKHrJQFE
);