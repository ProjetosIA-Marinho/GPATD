import { supabase } from './supabase';

/**
 * Extrai { bucket, path } de uma URL de Storage do Supabase
 * (formato público  .../object/public/<bucket>/<path>
 *  ou assinado      .../object/sign/<bucket>/<path>).
 * Retorna null se não reconhecer o formato.
 */
export function parseStorageRef(value?: string | null): { bucket: string; path: string } | null {
  if (!value) return null;
  const m = value.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/([^?]+)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

/**
 * Gera uma URL assinada e temporária para um arquivo do Storage, a partir
 * da URL (pública) que já está salva no banco. Serve tanto para registros
 * antigos (URL pública completa) quanto novos.
 *
 * Se o valor não for uma URL de Storage reconhecida, ou se a assinatura
 * falhar, devolve o valor original — assim nada quebra durante a transição.
 *
 * @param stored     URL salva (ex.: doc.drive_link, doc.url, delegacaoDoc.url)
 * @param expiresIn  validade do link em segundos (padrão: 1 hora)
 */
export async function getSignedUrl(stored?: string | null, expiresIn = 3600): Promise<string> {
  if (!stored) return '';
  const ref = parseStorageRef(stored);
  if (!ref) return stored;
  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, expiresIn);
  if (error || !data?.signedUrl) return stored;
  return data.signedUrl;
}
