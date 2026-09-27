import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabaseUrl = environment.supabase.url;
const supabaseAnonKey = environment.supabase.anonKey;
let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  return (client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }));
}

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>(
  'SUPABASE_CLIENT',
  { providedIn: 'root', factory: getSupabaseClient },
);
