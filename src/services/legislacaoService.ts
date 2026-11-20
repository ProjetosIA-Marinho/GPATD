import { supabase } from '../lib/supabase';

export interface LegisMessage {
  role: 'user' | 'model';
  text: string;
  usedSources?: { id: string; name: string }[];
  skipped?: { name: string; reason: string }[];
  isError?: boolean;
}

export interface LegisSource {
  id: string;
  name: string;
  type: string;
  folder_id: string;
  folderName: string;
}

/** Lista os documentos da pasta "Legislações" (únicas fontes do Chat GPATD). */
export async function listLegislationSources(): Promise<LegisSource[]> {
  const { data: folders, error: fErr } = await supabase
    .from('folders')
    .select('id, name, category')
    .ilike('name', 'legisla%'); // somente a pasta "Legislações"
  if (fErr) throw fErr;
  if (!folders || folders.length === 0) return [];

  const folderName = new Map(folders.map((f: any) => [f.id, f.name]));
  const { data: docs, error: dErr } = await supabase
    .from('documents')
    .select('id, name, type, folder_id')
    .in('folder_id', folders.map((f: any) => f.id))
    .order('name');
  if (dErr) throw dErr;

  return (docs || []).map((d: any) => ({ ...d, folderName: folderName.get(d.folder_id) || 'Legislação' }));
}

export async function askLegislation(message: string, history: LegisMessage[], sourceIds: string[]) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch('/api/legislacao-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message,
      sourceIds,
      history: history.filter(m => !m.isError).map(m => ({ role: m.role, text: m.text })),
    }),
  });

  const raw = await response.text();
  let data: any = {};
  try { data = JSON.parse(raw); } catch { /* resposta não-JSON (timeout, crash, rota ausente) */ }

  if (!response.ok || !data.text) {
    if (data.error) throw new Error(data.error);
    const hints: Record<number, string> = {
      404: 'rota /api/legislacao-chat não encontrada no servidor (o deploy incluiu a pasta api?)',
      405: 'o servidor não reconheceu a rota da API (deploy sem o arquivo api/legislacao-chat.ts?)',
      500: 'a função do servidor falhou ao iniciar',
      504: 'tempo esgotado: os documentos demoraram demais para ser processados',
    };
    const hint = hints[response.status] || raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
    throw new Error(`Falha ao consultar a legislação (HTTP ${response.status}): ${hint || 'resposta vazia'}`);
  }
  return data as { text: string; usedSources: LegisMessage['usedSources']; skipped: LegisMessage['skipped'] };
}
