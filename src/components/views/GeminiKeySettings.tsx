import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, Trash2, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import {
  GEMINI_KEY_PATTERN, getPersonalGeminiKey, savePersonalGeminiKey, clearPersonalGeminiKey,
  isPersonalKeyRemembered, maskKey,
} from '../../lib/geminiKey';
import { testGeminiKey } from '../../services/legislacaoService';

/** Seção "Chave do Gemini" das Configurações (chave pessoal opcional). */
export default function GeminiKeySettings() {
  const [current, setCurrent] = useState<string | null>(getPersonalGeminiKey());
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(isPersonalKeyRemembered());
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const sync = () => setCurrent(getPersonalGeminiKey());
    window.addEventListener('gpatd-gemini-key-changed', sync);
    return () => window.removeEventListener('gpatd-gemini-key-changed', sync);
  }, []);

  const handleSave = async () => {
    const key = input.trim();
    setStatus(null);
    if (!GEMINI_KEY_PATTERN.test(key)) {
      setStatus({ type: 'error', text: 'Formato inválido. A chave do AI Studio começa com "AIza" e tem 39 caracteres.' });
      return;
    }
    setTesting(true);
    try {
      const result = await testGeminiKey(key);
      if (!result.ok) {
        setStatus({ type: 'error', text: result.error || 'O Google recusou esta chave.' });
        return;
      }
      savePersonalGeminiKey(key, remember);
      setInput('');
      setShow(false);
      setStatus({ type: 'ok', text: 'Chave validada e salva neste navegador. O Chat GPATD passará a usá-la.' });
    } catch {
      setStatus({ type: 'error', text: 'Não foi possível testar a chave agora. Tente novamente.' });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = () => {
    clearPersonalGeminiKey();
    setStatus({ type: 'ok', text: 'Chave pessoal removida. O Chat GPATD voltará a usar a chave institucional.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Chave do Gemini</h3>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Opcional: use sua própria cota no Chat GPATD</p>
      </div>

      {/* Situação atual */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${current
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20'
        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
        <KeyRound size={20} className={current ? 'text-emerald-600' : 'text-slate-400'} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {current ? 'Usando sua chave pessoal' : 'Usando a chave institucional do GPATD'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {current
              ? `${maskKey(current)} · ${isPersonalKeyRemembered() ? 'lembrada neste computador' : 'apagada ao fechar o navegador'}`
              : 'Nenhuma chave pessoal cadastrada neste navegador.'}
          </p>
        </div>
        {current && (
          <button onClick={handleRemove}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <Trash2 size={14} /> Remover
          </button>
        )}
      </div>

      {/* Cadastro */}
      <div className="max-w-xl space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {current ? 'Substituir chave' : 'Sua chave de API do Gemini'}
          </label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={show ? 'text' : 'password'}
              value={input}
              autoComplete="off"
              spellCheck={false}
              onChange={e => { setInput(e.target.value); setStatus(null); }}
              placeholder="AIza..."
              className="w-full h-11 pl-10 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="mt-1 accent-indigo-600" />
          <span>
            Lembrar neste computador
            <span className="block text-xs text-slate-400">Não marque em computadores compartilhados. Sem esta opção, a chave é apagada ao fechar o navegador.</span>
          </span>
        </label>

        {status && (
          <div className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs ${status.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'}`}>
            {status.type === 'ok' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
            <span>{status.text}</span>
          </div>
        )}

        <button onClick={handleSave} disabled={!input.trim() || testing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
          {testing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          {testing ? 'Validando...' : 'Validar e salvar'}
        </button>
      </div>

      {/* Instruções e segurança */}
      <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Como obter sua chave</p>
          <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <li>Acesse o Google AI Studio com sua conta Google.</li>
            <li>Clique em <strong>Create API key</strong> (Criar chave).</li>
            <li>Copie a chave (começa com <code>AIza</code>) e cole acima.</li>
          </ol>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
            Abrir Google AI Studio <ExternalLink size={12} />
          </a>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-900/10 p-5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Segurança e privacidade</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <li>A chave fica <strong>somente neste navegador</strong>; o GPATD não a grava no banco de dados.</li>
            <li>Ela é usada apenas para as suas consultas e não aparece nos registros do servidor.</li>
            <li>No plano gratuito do Google, as perguntas podem ser usadas para treinar modelos. <strong>Não insira nomes, SARAM ou CPF.</strong></li>
            <li>Se suspeitar de vazamento, apague a chave no AI Studio e gere outra.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
