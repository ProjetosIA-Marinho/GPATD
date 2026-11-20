import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Loader2, Scale, Library, FileText, RotateCcw, CheckSquare, Square,
  AlertTriangle, User, Sparkles, ChevronDown, ChevronRight, Copy, Check, ShieldAlert,
} from 'lucide-react';
import { askLegislation, listLegislationSources, LegisMessage, LegisSource } from '../../services/legislacaoService';

const STORAGE_KEY = 'chat_gpatd_conversa';

const SUGGESTIONS = [
  'Quais são as etapas do PATD e os prazos de cada uma?',
  'Quais circunstâncias atenuantes e agravantes estão previstas?',
  'Um militar chegou atrasado ao expediente sem justificativa. Qual o possível enquadramento e punição?',
  'Como devo garantir o contraditório e a ampla defesa na apuração?',
];

/* ---------- Proteção de dados pessoais ---------- */

// CPF (000.000.000-00 ou 11 dígitos) e SARAM (000.000-0 ou 7 dígitos).
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
const SARAM_RE = /\b\d{3}\.?\d{3}-?\d\b/;

function detectPersonalData(text: string): string | null {
  if (CPF_RE.test(text)) return 'um número que parece ser CPF';
  if (SARAM_RE.test(text)) return 'um número que parece ser SARAM';
  if (/\b(cpf|saram|identidade|rg)\s*(n[ºo°.]*)?\s*:?\s*\d/i.test(text)) return 'um documento de identificação';
  return null;
}

/* ---------- Renderização de markdown simples (sem HTML injetado) ---------- */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\(Fonte:[^)]+\))|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (match[1]) {
      nodes.push(
        <span key={key} className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold align-middle">
          <FileText size={11} />{token.slice(1, -1).replace(/^Fonte:\s*/, '')}
        </span>
      );
    } else if (match[2]) {
      nodes.push(<strong key={key} className="font-bold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(<code key={key} className="px-1 rounded bg-slate-200/60 dark:bg-slate-700 text-[12px]">{token.slice(1, -1)}</code>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`${list.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1 my-2`}>
        {list.items.map((it, j) => <li key={j}>{renderInline(it, `li${blocks.length}-${j}`)}</li>)}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (heading) {
      flush();
      blocks.push(
        <h4 key={`h${idx}`} className="mt-4 mb-1 first:mt-0 text-[13px] font-black uppercase tracking-wide text-slate-900 dark:text-white">
          {renderInline(heading[1], `h${idx}`)}
        </h4>
      );
    } else if (bullet || ordered) {
      const isOrdered = !!ordered;
      if (!list || list.ordered !== isOrdered) { flush(); list = { ordered: isOrdered, items: [] }; }
      list.items.push((bullet || ordered)![1]);
    } else if (!line.trim()) {
      flush();
    } else {
      flush();
      blocks.push(<p key={`p${idx}`} className="my-1.5">{renderInline(line, `p${idx}`)}</p>);
    }
  });
  flush();
  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

/* ------------------------------- Componente ------------------------------- */

export default function LegislacaoChat({ currentUser }: { currentUser: any }) {
  const [sources, setSources] = useState<LegisSource[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourcesError, setSourcesError] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const [messages, setMessages] = useState<LegisMessage[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [privacyError, setPrivacyError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await listLegislationSources();
        setSources(list);
        setSelected(new Set(list.map(s => s.id)));
      } catch (err) {
        console.error(err);
        setSourcesError('Não foi possível carregar as legislações.');
      } finally {
        setLoadingSources(false);
      }
    })();
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch { /* ignore */ }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const grouped = useMemo(() => {
    const map = new Map<string, LegisSource[]>();
    sources.forEach(s => {
      if (!map.has(s.folderName)) map.set(s.folderName, []);
      map.get(s.folderName)!.push(s);
    });
    return Array.from(map.entries());
  }, [sources]);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleFolder = (docs: LegisSource[]) => setSelected(prev => {
    const next = new Set(prev);
    const allOn = docs.every(d => next.has(d.id));
    docs.forEach(d => (allOn ? next.delete(d.id) : next.add(d.id)));
    return next;
  });

  const allSelected = sources.length > 0 && selected.size === sources.length;

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || isLoading) return;
    const personal = detectPersonalData(question);
    if (personal) {
      setPrivacyError(`Sua pergunta contém ${personal}. Remova os dados pessoais e descreva apenas os fatos (ex.: "um 3S", "o militar").`);
      return;
    }
    setPrivacyError('');
    if (selected.size === 0) {
      setMessages(prev => [...prev, { role: 'model', text: 'Selecione ao menos uma fonte no painel **Fontes** para que eu possa responder.', isError: true }]);
      return;
    }
    setInput('');
    const history = messages;
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsLoading(true);
    try {
      const res = await askLegislation(question, history, Array.from(selected));
      setMessages(prev => [...prev, { role: 'model', text: res.text, usedSources: res.usedSources, skipped: res.skipped }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: err?.message || 'Ocorreu um erro. Tente novamente.', isError: true }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch { /* ignore */ }
  };

  const firstName = String(currentUser?.name || '').split(' ')[0];

  return (
    <div className="flex h-full gap-6 min-h-0">
      {/* ---------------- Painel de Fontes ---------------- */}
      <aside className="hidden lg:flex w-80 shrink-0 flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Library size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Fontes</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {selected.size} de {sources.length} selecionada(s)
              </p>
            </div>
          </div>
          {sources.length > 0 && (
            <button
              onClick={() => setSelected(allSelected ? new Set() : new Set(sources.map(s => s.id)))}
              className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {allSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
              {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {loadingSources ? (
            <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
          ) : sourcesError ? (
            <p className="p-4 text-xs text-rose-500 font-semibold">{sourcesError}</p>
          ) : sources.length === 0 ? (
            <div className="p-4 text-center">
              <AlertTriangle size={22} className="mx-auto text-amber-500 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nenhuma norma encontrada. Cadastre as normas em <strong>Documentos</strong>, na pasta <strong>Legislações</strong>.
              </p>
            </div>
          ) : (
            grouped.map(([folder, docs]) => {
              const collapsed = collapsedFolders.has(folder);
              const allOn = docs.every(d => selected.has(d.id));
              return (
                <div key={folder} className="mb-2">
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <button
                      onClick={() => setCollapsedFolders(prev => {
                        const n = new Set(prev); n.has(folder) ? n.delete(folder) : n.add(folder); return n;
                      })}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <span className="flex-1 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{folder}</span>
                    <button onClick={() => toggleFolder(docs)} className="text-slate-400 hover:text-indigo-600" title="Marcar/desmarcar pasta">
                      {allOn ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} />}
                    </button>
                  </div>
                  {!collapsed && docs.map(doc => {
                    const on = selected.has(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => toggle(doc.id)}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${on ? 'bg-indigo-50/70 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                      >
                        {on ? <CheckSquare size={16} className="mt-0.5 shrink-0 text-indigo-600" /> : <Square size={16} className="mt-0.5 shrink-0 text-slate-400" />}
                        <span className={`text-xs leading-snug break-words ${on ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>{doc.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <p className="px-5 py-3 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
          As fontes vêm da pasta <strong>Documentos › Legislações</strong>. O assistente responde apenas com base nas fontes marcadas.
        </p>
      </aside>

      {/* ---------------- Chat ---------------- */}
      <section className="flex flex-1 min-w-0 flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Assistente Normativo</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Procedimentos e enquadramentos com base na legislação cadastrada</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <RotateCcw size={14} /> Nova conversa
            </button>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Sparkles size={30} />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">
                {firstName ? `Olá, ${firstName}. ` : ''}Qual é a sua dúvida?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mt-2">
                Pergunte sobre procedimentos do PATD, prazos, direito de defesa ou descreva os fatos para receber uma orientação de enquadramento e punição — sempre com a indicação do artigo da norma.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loadingSources || sources.length === 0}
                    className="text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : msg.isError ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : msg.isError ? <AlertTriangle size={18} /> : <Scale size={18} />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                }`}>
                  {msg.role === 'user'
                    ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                    : <MarkdownLite text={msg.text} />}

                  {msg.role === 'model' && !msg.isError && (
                    <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center gap-2">
                      {msg.usedSources && msg.usedSources.length > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Consultadas {msg.usedSources.length} fonte(s)
                        </span>
                      )}
                      {msg.skipped && msg.skipped.length > 0 && (
                        <span className="text-[10px] font-semibold text-amber-600" title={msg.skipped.map(s => `${s.name}: ${s.reason}`).join('\n')}>
                          • {msg.skipped.length} ignorada(s)
                        </span>
                      )}
                      <button
                        onClick={() => copy(msg.text, idx)}
                        className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-600"
                      >
                        {copiedIdx === idx ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600"><Scale size={18} /></div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} /> Consultando a legislação…
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className={`mb-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12px] leading-snug ${
            privacyError
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300'
          }`}>
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>
              {privacyError || (
                <>
                  <strong>Não insira dados pessoais</strong> como nome, SARAM, CPF, identidade, telefone ou endereço.
                  Descreva apenas os fatos, usando termos genéricos como "o militar" ou "um 3S".
                </>
              )}
            </span>
          </div>
          <div className="lg:hidden mb-2 text-[11px] text-slate-500">
            Fontes: {selected.size} de {sources.length} legislação(ões)
          </div>
          <div className="flex items-end gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/30 focus-within:border-indigo-400 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={4000}
              onChange={e => {
                setInput(e.target.value);
                if (privacyError) setPrivacyError('');
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Descreva os fatos ou faça sua pergunta sobre o procedimento…"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-hidden text-slate-800 dark:text-slate-200 placeholder:text-slate-400 max-h-40"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 transition-colors"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            Orientação gerada por IA com base nas normas cadastradas. Confira sempre o texto da norma; a decisão cabe à autoridade competente.
          </p>
        </div>
      </section>
    </div>
  );
}
