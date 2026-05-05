import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

import { logger } from './logger';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'smart-travel-hacks-auth',
  },
});

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

export async function getAccessToken() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    logger.error('Error getting session:', error.message);
    return null;
  }
  return session?.access_token ?? null;
}
