import { supabase } from '../lib/supabase';

export type BackupFrequency = 'desativado' | 'semanal' | 'mensal' | 'semestral';

export interface BackupMetadata {
  id: string;
  version: string;
  timestamp: string;
  createdBy: {
    id?: string;
    name?: string;
    email?: string;
  };
  scheduleFrequency: BackupFrequency;
  summary: {
    processesCount: number;
    profilesCount: number;
    divisionsCount: number;
    foldersCount: number;
    documentsCount: number;
    efetivoCount: number;
    userSettingsCount: number;
  };
}

export interface BackupPayload {
  gpatd_backup_marker: string;
  metadata: BackupMetadata;
  data: {
    processes: any[];
    profiles: any[];
    divisions: any[];
    folders: any[];
    documents: any[];
    efetivo: any[];
    user_settings: any[];
    system_settings?: any[];
  };
}

export interface SavedBackupRecord {
  id: string;
  timestamp: string;
  createdBy: string;
  frequency: BackupFrequency;
  summary: BackupMetadata['summary'];
  payload: BackupPayload;
}

const BACKUP_MARKER = 'GPATD_BACKUP_V1';
const SCHEDULE_KEY = 'gpatd_backup_schedule';
const LAST_AUTO_BACKUP_KEY = 'gpatd_last_scheduled_backup';
const LOCAL_BACKUPS_KEY = 'gpatd_system_backups_history';

/**
 * Get current scheduled backup frequency from localStorage / default
 */
export function getBackupSchedule(): BackupFrequency {
  try {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved && ['desativado', 'semanal', 'mensal', 'semestral'].includes(saved)) {
      return saved as BackupFrequency;
    }
  } catch (e) {
    console.error('Error reading backup schedule:', e);
  }
  return 'desativado';
}

/**
 * Save backup schedule preference
 */
export async function saveBackupSchedule(frequency: BackupFrequency, userId?: string): Promise<void> {
  try {
    localStorage.setItem(SCHEDULE_KEY, frequency);
    if (userId) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          backup_frequency: frequency,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      if (error) {
        console.warn('Could not save frequency to user_settings table:', error.message);
      }
    }
  } catch (e) {
    console.error('Error saving backup schedule:', e);
  }
}

/**
 * Safely fetch table data from Supabase, returning empty array if error occurs
 */
async function fetchTableSafely(tableName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`Warning fetching table ${tableName}:`, error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn(`Exception fetching table ${tableName}:`, err);
    return [];
  }
}

/**
 * Create a full system backup payload
 */
export async function createBackupPayload(
  currentUser: any,
  scheduleFrequency: BackupFrequency = getBackupSchedule()
): Promise<BackupPayload> {
  const [processes, profiles, divisions, folders, documents, efetivo, user_settings] = await Promise.all([
    fetchTableSafely('processes'),
    fetchTableSafely('profiles'),
    fetchTableSafely('divisions'),
    fetchTableSafely('folders'),
    fetchTableSafely('documents'),
    fetchTableSafely('efetivo'),
    fetchTableSafely('user_settings')
  ]);

  const timestamp = new Date().toISOString();
  const backupId = `backup_${Date.now()}`;

  const summary = {
    processesCount: processes.length,
    profilesCount: profiles.length,
    divisionsCount: divisions.length,
    foldersCount: folders.length,
    documentsCount: documents.length,
    efetivoCount: efetivo.length,
    userSettingsCount: user_settings.length
  };

  const payload: BackupPayload = {
    gpatd_backup_marker: BACKUP_MARKER,
    metadata: {
      id: backupId,
      version: '1.0',
      timestamp,
      createdBy: {
        id: currentUser?.id,
        name: currentUser?.name || 'Administrador',
        email: currentUser?.email
      },
      scheduleFrequency,
      summary
    },
    data: {
      processes,
      profiles,
      divisions,
      folders,
      documents,
      efetivo,
      user_settings
    }
  };

  return payload;
}

/**
 * Save backup snapshot to local history
 */
export function saveBackupToHistory(payload: BackupPayload): SavedBackupRecord {
  const record: SavedBackupRecord = {
    id: payload.metadata.id,
    timestamp: payload.metadata.timestamp,
    createdBy: payload.metadata.createdBy.name || 'Administrador',
    frequency: payload.metadata.scheduleFrequency,
    summary: payload.metadata.summary,
    payload
  };

  try {
    const history = getSavedBackupsHistory();
    // Keep top 15 backups to avoid localStorage overflow
    const updated = [record, ...history.filter(h => h.id !== record.id)].slice(0, 15);
    localStorage.setItem(LOCAL_BACKUPS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving backup to history:', e);
  }

  return record;
}

/**
 * Retrieve saved backup history from local storage
 */
export function getSavedBackupsHistory(): SavedBackupRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error retrieving backup history:', e);
  }
  return [];
}

/**
 * Delete a specific backup record from history
 */
export function deleteSavedBackup(id: string): void {
  try {
    const history = getSavedBackupsHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(LOCAL_BACKUPS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting backup:', e);
  }
}

/**
 * Trigger download of backup file in user's browser
 */
export function downloadBackupFile(payload: BackupPayload): void {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date(payload.metadata.timestamp)
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-');
  const filename = `gpatd_backup_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate a backup JSON string or object
 */
export function validateBackupFile(fileContent: string): { valid: boolean; payload?: BackupPayload; error?: string } {
  try {
    const payload = JSON.parse(fileContent);

    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Arquivo inválido ou corrompido (JSON inválido).' };
    }

    if (payload.gpatd_backup_marker !== BACKUP_MARKER && !payload.data) {
      return { valid: false, error: 'Formato de arquivo incompatível. O arquivo não é um backup válido do GPATD.' };
    }

    if (!payload.data || typeof payload.data !== 'object') {
      return { valid: false, error: 'O arquivo de backup não contém a estrutura de dados esperada.' };
    }

    // Ensure data properties are arrays
    const processes = Array.isArray(payload.data.processes) ? payload.data.processes : [];
    const profiles = Array.isArray(payload.data.profiles) ? payload.data.profiles : [];
    const divisions = Array.isArray(payload.data.divisions) ? payload.data.divisions : [];
    const folders = Array.isArray(payload.data.folders) ? payload.data.folders : [];
    const documents = Array.isArray(payload.data.documents) ? payload.data.documents : [];
    const efetivo = Array.isArray(payload.data.efetivo) ? payload.data.efetivo : [];
    const user_settings = Array.isArray(payload.data.user_settings) ? payload.data.user_settings : [];

    const summary = payload.metadata?.summary || {
      processesCount: processes.length,
      profilesCount: profiles.length,
      divisionsCount: divisions.length,
      foldersCount: folders.length,
      documentsCount: documents.length,
      efetivoCount: efetivo.length,
      userSettingsCount: user_settings.length
    };

    const sanitizedPayload: BackupPayload = {
      gpatd_backup_marker: BACKUP_MARKER,
      metadata: {
        id: payload.metadata?.id || `backup_${Date.now()}`,
        version: payload.metadata?.version || '1.0',
        timestamp: payload.metadata?.timestamp || new Date().toISOString(),
        createdBy: payload.metadata?.createdBy || { name: 'Desconhecido' },
        scheduleFrequency: payload.metadata?.scheduleFrequency || 'desativado',
        summary
      },
      data: {
        processes,
        profiles,
        divisions,
        folders,
        documents,
        efetivo,
        user_settings
      }
    };

    return { valid: true, payload: sanitizedPayload };
  } catch (err: any) {
    return { valid: false, error: `Falha ao processar arquivo: ${err.message}` };
  }
}

/**
 * Restore system data from backup payload without bugs or glitches
 */
export async function restoreSystemData(payload: BackupPayload): Promise<{ success: boolean; message: string; restoredCounts?: any }> {
  const { data } = payload;
  const restoredCounts = {
    processes: 0,
    profiles: 0,
    divisions: 0,
    folders: 0,
    documents: 0,
    efetivo: 0,
    user_settings: 0
  };

  // Autorização: apenas Administrador pode restaurar (verdade do servidor,
  // não apenas a checagem visual do front-end).
  try {
    const { data: role, error: roleError } = await supabase.rpc('get_current_user_role');
    if (roleError) {
      console.warn('Restore auth check error:', roleError.message);
      return { success: false, message: 'Não foi possível verificar sua permissão. Tente novamente.' };
    }
    if (role !== 'Administrador') {
      return { success: false, message: 'Apenas administradores podem restaurar o sistema.' };
    }
  } catch (err) {
    console.error('Restore auth check exception:', err);
    return { success: false, message: 'Não foi possível verificar sua permissão.' };
  }

  const failed: string[] = [];

  const restoreTable = async (
    table: string,
    rows: any[] | undefined,
    conflict: string,
    countKey: keyof typeof restoredCounts
  ) => {
    if (!rows || rows.length === 0) return;
    const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
    if (error) {
      console.warn(`Restore ${table} error:`, error.message);
      failed.push(table);
    } else {
      restoredCounts[countKey] = rows.length;
    }
  };

  try {
    await restoreTable('profiles', data.profiles, 'id', 'profiles');
    await restoreTable('divisions', data.divisions, 'id', 'divisions');
    await restoreTable('folders', data.folders, 'id', 'folders');
    await restoreTable('documents', data.documents, 'id', 'documents');
    await restoreTable('processes', data.processes, 'id', 'processes');
    await restoreTable('efetivo', data.efetivo, 'id', 'efetivo');
    await restoreTable('user_settings', data.user_settings, 'user_id', 'user_settings');

    // Dispatch custom window event so App state can reload cleanly
    window.dispatchEvent(new CustomEvent('gpatd_system_restored', { detail: { payload, restoredCounts } }));

    if (failed.length > 0) {
      return {
        success: false,
        message: `Restauração parcial: falha ao gravar em ${failed.join(', ')}. Verifique suas permissões e tente novamente.`,
        restoredCounts
      };
    }

    return {
      success: true,
      message: 'Restauração concluída com sucesso! Todos os processos, documentos e configurações foram atualizados.',
      restoredCounts
    };
  } catch (err: any) {
    console.error('Error during system restoration:', err);
    return {
      success: false,
      message: 'Erro ao restaurar o sistema.'
    };
  }
}

/**
 * Check if automated scheduled backup is due and run it
 */
export async function checkAndRunScheduledBackup(currentUser: any): Promise<boolean> {
  const frequency = getBackupSchedule();
  if (frequency === 'desativado') return false;

  const daysMap: Record<BackupFrequency, number> = {
    desativado: Infinity,
    semanal: 7,
    mensal: 30,
    semestral: 180
  };

  const requiredIntervalDays = daysMap[frequency];
  const lastAutoBackupStr = localStorage.getItem(LAST_AUTO_BACKUP_KEY);

  let isDue = false;
  if (!lastAutoBackupStr) {
    isDue = true;
  } else {
    const lastDate = new Date(lastAutoBackupStr).getTime();
    const now = new Date().getTime();
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
    if (diffDays >= requiredIntervalDays) {
      isDue = true;
    }
  }

  if (isDue && currentUser) {
    try {
      console.log(`[Auto Backup] Running scheduled backup (${frequency})...`);
      const payload = await createBackupPayload(currentUser, frequency);
      saveBackupToHistory(payload);
      localStorage.setItem(LAST_AUTO_BACKUP_KEY, new Date().toISOString());
      console.log('[Auto Backup] Scheduled backup completed successfully.');
      return true;
    } catch (e) {
      console.error('[Auto Backup] Failed to run scheduled backup:', e);
    }
  }

  return false;
}
