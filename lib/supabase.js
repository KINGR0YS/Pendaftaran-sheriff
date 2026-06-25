import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ienxifiqzjcgnxwewyhm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbnhpZmlxempjZ254d2V3eWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjk3MzEsImV4cCI6MjA5NzkwNTczMX0.yJFfgaTV_JYLSYq2N6rRmd10OlPUF08oDsbBX1dbaig';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
