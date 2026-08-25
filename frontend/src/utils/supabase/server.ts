import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://jfrurdcuexcejihbgqru.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    'sb_publishable_ocvj_KqM3xzm1U0ZGOArXQ_lFbhykmr';

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
