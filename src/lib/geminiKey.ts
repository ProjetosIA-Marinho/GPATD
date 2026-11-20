/**
 * Chave pessoal do Gemini do usuário.
 *
 * Segurança:
 *  - Fica SOMENTE no navegador do usuário (nunca vai para o banco do GPATD).
 *  - Por padrão, em sessionStorage (apagada ao fechar o navegador).
 *  - Se o usuário marcar "lembrar neste computador", vai para localStorage.
 *  - É enviada ao servidor apenas no cabeçalho X-Gemini-Key, via HTTPS,
 *    e o servidor a usa na hora sem salvar nem registrar em log.
 */
const STORAGE_KEY = 'gpatd_gemini_key';

// Formato das chaves do Google AI Studio: "AIza" + 35 caracteres.
export const GEMINI_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;

export function getPersonalGeminiKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function isPersonalKeyRemembered(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

export function savePersonalGeminiKey(key: string, remember: boolean) {
  clearPersonalGeminiKey();
  try {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, key.trim());
  } catch { /* ignore */ }
  window.dispatchEvent(new Event('gpatd-gemini-key-changed'));
}

export function clearPersonalGeminiKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event('gpatd-gemini-key-changed'));
}

/** Mostra só o início e o fim da chave. */
export function maskKey(key: string): string {
  return key.length > 10 ? `${key.slice(0, 6)}••••••••${key.slice(-4)}` : '••••';
}
