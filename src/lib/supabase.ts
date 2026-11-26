import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Chave de sessão exclusiva por aba.
 *
 * A sessão fica no sessionStorage (cada aba tem a sua e ela some ao fechar o
 * navegador). Porém o Supabase também usa um BroadcastChannel com o nome da
 * storageKey para avisar as OUTRAS abas sobre login/renovação de token — e essas
 * abas aceitavam o aviso, entrando com o usuário logado em outra aba sem pedir
 * senha. Com uma storageKey única por aba, o canal também fica isolado.
 */
function getTabStorageKey(): string {
  const TAB_ID_KEY = 'gpatd_tab_id';
  let tabId = window.sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return `sb-gpatd-auth-${tabId}`;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: getTabStorageKey(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
