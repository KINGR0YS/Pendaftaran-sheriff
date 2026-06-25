import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gcmrspogwppcuynmmwkd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p1VpNGh_CtKO-ZmWin6cNw_l0Arp0uX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
