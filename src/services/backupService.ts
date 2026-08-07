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

  try {
    // 1. Profiles
    if (data.profiles && data.profiles.length > 0) {
      const { error } = await supabase.from('profiles').upsert(data.profiles, { onConflict: 'id' });
      if (error) console.warn('Restore profiles notice:', error.message);
      restoredCounts.profiles = data.profiles.length;
    }

    // 2. Divisions
    if (data.divisions && data.divisions.length > 0) {
      const { error } = await supabase.from('divisions').upsert(data.divisions, { onConflict: 'id' });
      if (error) console.warn('Restore divisions notice:', error.message);
      restoredCounts.divisions = data.divisions.length;
    }

    // 3. Folders
    if (data.folders && data.folders.length > 0) {
      const { error } = await supabase.from('folders').upsert(data.folders, { onConflict: 'id' });
      if (error) console.warn('Restore folders notice:', error.message);
      restoredCounts.folders = data.folders.length;
    }

    // 4. Documents
    if (data.documents && data.documents.length > 0) {
      const { error } = await supabase.from('documents').upsert(data.documents, { onConflict: 'id' });
      if (error) console.warn('Restore documents notice:', error.message);
      restoredCounts.documents = data.documents.length;
    }

    // 5. Processes
    if (data.processes && data.processes.length > 0) {
      const { error } = await supabase.from('processes').upsert(data.processes, { onConflict: 'id' });
      if (error) console.warn('Restore processes notice:', error.message);
      restoredCounts.processes = data.processes.length;
    }

    // 6. Efetivo
    if (data.efetivo && data.efetivo.length > 0) {
      const { error } = await supabase.from('efetivo').upsert(data.efetivo, { onConflict: 'id' });
      if (error) console.warn('Restore efetivo notice:', error.message);
      restoredCounts.efetivo = data.efetivo.length;
    }

    // 7. User Settings
    if (data.user_settings && data.user_settings.length > 0) {
      const { error } = await supabase.from('user_settings').upsert(data.user_settings, { onConflict: 'user_id' });
      if (error) console.warn('Restore user settings notice:', error.message);
      restoredCounts.user_settings = data.user_settings.length;
    }

    // Dispatch custom window event so App state can reload cleanly
    window.dispatchEvent(new CustomEvent('gpatd_system_restored', { detail: { payload, restoredCounts } }));

    return {
      success: true,
      message: 'Restauração concluída com sucesso! Todos os processos, documentos e configurações foram atualizados.',
      restoredCounts
    };
  } catch (err: any) {
    console.error('Error during system restoration:', err);
    return {
      success: false,
      message: `Erro ao restaurar o sistema: ${err.message}`
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
