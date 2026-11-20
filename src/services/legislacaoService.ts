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

/** Lista os documentos das pastas de categoria "Legislação". */
export async function listLegislationSources(): Promise<LegisSource[]> {
  const { data: folders, error: fErr } = await supabase
    .from('folders')
    .select('id, name, category')
    .ilike('category', 'legisla%');
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha ao consultar a legislação.');
  return data as { text: string; usedSources: LegisMessage['usedSources']; skipped: LegisMessage['skipped'] };
}
