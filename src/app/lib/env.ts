const requiredEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const SUPABASE_URL = requiredEnv('VITE_SUPABASE_URL').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = requiredEnv('VITE_SUPABASE_ANON_KEY');

// Defaults to the typed Supabase Edge Function included in this project.
// Override with VITE_API_BASE only if you rename the function or proxy it elsewhere.
export const API_BASE = (
  import.meta.env.VITE_API_BASE || `${SUPABASE_URL}/functions/v1/server`
).replace(/\/$/, '');
