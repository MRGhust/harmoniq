import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqrxapycbygydholzbxa.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxcnhhcHljYnlneWRob2x6YnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MDg4ODgsImV4cCI6MjEwOTM4NDg4OH0.j04VeWBv0RmV2mAvuLqqenzdpAEgfq9_P4DC6_oTag4';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!client && supabaseUrl && supabaseAnonKey) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      });
    } catch (err) {
      console.warn('Supabase initialization warning:', err);
    }
  }
  return client;
}
