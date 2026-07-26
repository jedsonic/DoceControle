import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

// Helper function to get Supabase config
export function getSupabaseConfig() {
  return StorageService.getSupabaseConfig();
}

// Lazy initialization of Supabase client to prevent crashes if config is invalid
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  const config = getSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    supabaseInstance = null;
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.error('Falha ao inicializar cliente Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
}

// Reset instance when config changes
export function resetSupabaseInstance() {
  supabaseInstance = null;
}
