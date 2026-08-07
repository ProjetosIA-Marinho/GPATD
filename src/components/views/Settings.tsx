import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Bell, Shield, Settings as SettingsIcon, Save, Moon, Sun,
  Mail, Phone, Hash, Building2, CheckCircle2, Eye, EyeOff, Lock,
  Database, Upload, Download, RefreshCw, AlertTriangle, Trash2,
  Clock, Calendar, Check, History
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  getBackupSchedule,
  saveBackupSchedule,
  createBackupPayload,
  downloadBackupFile,
  validateBackupFile,
  restoreSystemData,
  getSavedBackupsHistory,
  saveBackupToHistory,
  deleteSavedBackup,
  BackupFrequency,
  BackupPayload,
  SavedBackupRecord
} from '../../services/backupService';

interface SettingsProps {
  currentUser: any;
  onProfileUpdate?: (updated: any) => void;
  onBackupRestored?: () => void;
}

export default function Settings({ currentUser, onProfileUpdate, onBackupRestored }: SettingsProps) {
  const { theme, toggleTheme } = useTheme();
  const { session } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = currentUser?.role === 'Administrador';

  // Profile state
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    posto: currentUser?.posto || '',
    saram: currentUser?.saram || '',
    email: currentUser?.email || session?.user?.email || '',
    telefone: currentUser?.telefone || '',
    ramal: currentUser?.ramal || '',
    divisao: currentUser?.divisao || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  // Notification state
  const [notifications, setNotifications] = useState({
    enabled: true,
    emailNotifications: false,
    criticalAlerts: true,
    processUpdates: true,
  });

  // Workspace state
  const [workspace, setWorkspace] = useState({
    autoSave: true,
    itemsPerPage: 20,
    dateFormat: 'DD/MM/YYYY',
    language: 'pt-BR',
  });

  // Backup state
  const [backupSchedule, setBackupSchedule] = useState<BackupFrequency>(() => getBackupSchedule());
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState<SavedBackupRecord[]>(() => getSavedBackupsHistory());
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupPayload | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');

  // Load settings from Supabase
  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (data) {
        setNotifications(prev => ({
          ...prev,
          enabled: data.notifications_enabled ?? true,
          emailNotifications: data.email_notifications ?? false,
        }));
        setWorkspace(prev => ({
          ...prev,
          autoSave: data.auto_save ?? true,
          itemsPerPage: data.items_per_page ?? 20,
          dateFormat: data.date_format ?? 'DD/MM/YYYY',
          language: data.language ?? 'pt-BR',
        }));
        if (data.backup_frequency) {
          setBackupSchedule(data.backup_frequency as BackupFrequency);
        }
      }
    };
    load();
  }, [session]);

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || '',
        posto: currentUser.posto || '',
        saram: currentUser.saram || '',
        email: currentUser.email || session?.user?.email || '',
        telefone: currentUser.telefone || '',
        ramal: currentUser.ramal || '',
        divisao: currentUser.divisao || '',
      });
    }
  }, [currentUser, session]);

  const showSaveMessage = (msg: string) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 3500);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          telefone: profile.telefone,
          ramal: profile.ramal,
        })
        .eq('id', currentUser.id);
      if (error) throw error;
      onProfileUpdate?.({ ...currentUser, ...profile });
      showSaveMessage('Perfil atualizado com sucesso!');
    } catch (err: any) {
      showSaveMessage(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      showSaveMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSaveMessage('As senhas não coincidem.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      setPasswordData({ newPassword: '', confirmPassword: '' });
      showSaveMessage('Senha alterada com sucesso!');
    } catch (err: any) {
      showSaveMessage(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: session.user.id,
        notifications_enabled: notifications.enabled,
        email_notifications: notifications.emailNotifications,
        auto_save: workspace.autoSave,
        items_per_page: workspace.itemsPerPage,
        date_format: workspace.dateFormat,
        language: workspace.language,
        backup_frequency: backupSchedule,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      showSaveMessage('Configurações salvas com sucesso!');
    } catch (err: any) {
      showSaveMessage(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Backup handlers
  const handleScheduleChange = async (freq: BackupFrequency) => {
    setBackupSchedule(freq);
    await saveBackupSchedule(freq, session?.user?.id);
    const labels: Record<BackupFrequency, string> = {
      desativado: 'Desativado',
      semanal: 'Semanal',
      mensal: 'Mensal',
      semestral: 'Semestral'
    };
    showSaveMessage(`Frequência de backup definida como: ${labels[freq]}`);
  };

  const handleCreateAndDownloadBackup = async () => {
    setIsGeneratingBackup(true);
    try {
      const payload = await createBackupPayload(currentUser, backupSchedule);
      downloadBackupFile(payload);
      const record = saveBackupToHistory(payload);
      setBackupHistory(prev => [record, ...prev.filter(r => r.id !== record.id)]);
      showSaveMessage('Backup criado e baixado com sucesso!');
    } catch (err: any) {
      showSaveMessage(`Erro ao criar backup: ${err.message}`);
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    setRestoreSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupFile(content);
      if (!validation.valid || !validation.payload) {
        setRestoreError(validation.error || 'Arquivo de backup inválido.');
        return;
      }
      setSelectedBackupToRestore(validation.payload);
      setIsConfirmRestoreOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectHistoryBackup = (record: SavedBackupRecord) => {
    setRestoreError('');
    setRestoreSuccessMsg('');
    setSelectedBackupToRestore(record.payload);
    setIsConfirmRestoreOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupToRestore) return;
    setIsRestoring(true);
    setRestoreError('');
    try {
      const res = await restoreSystemData(selectedBackupToRestore);
      if (res.success) {
        setRestoreSuccessMsg(res.message);
        setIsConfirmRestoreOpen(false);
        onBackupRestored?.();
        setBackupHistory(getSavedBackupsHistory());
      } else {
        setRestoreError(res.message);
      }
    } catch (err: any) {
      setRestoreError(`Erro ao restaurar: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    deleteSavedBackup(id);
    setBackupHistory(prev => prev.filter(h => h.id !== id));
  };

  const sections = [
    { id: 'profile', icon: User, title: 'Perfil', desc: 'Informações pessoais' },
    { id: 'security', icon: Shield, title: 'Segurança', desc: 'Senha e acesso' },
    { id: 'notifications', icon: Bell, title: 'Notificações', desc: 'Alertas e avisos' },
    { id: 'workspace', icon: SettingsIcon, title: 'Espaço de Trabalho', desc: 'Preferências do app' },
    ...(isAdmin ? [{ id: 'backup', icon: Database, title: 'Backup & Restauração', desc: 'Cópias e versões' }] : []),
  ];

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div id="settings-view" className="max-w-5xl mx-auto space-y-8 pb-10">
      <header>
        <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure as preferências do seu espaço de trabalho.</p>
      </header>

      {/* Save Message */}
      {saveMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${saveMsg.startsWith('Erro') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800'}`}
        >
          <CheckCircle2 size={18} />
          {saveMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${
                activeSection === s.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                activeSection === s.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
              }`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className={`text-sm font-bold ${activeSection === s.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{s.title}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            {/* PROFILE SECTION */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Perfil</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Gerencie suas informações pessoais</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">E-mail</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.email} disabled
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Posto</label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.posto} disabled
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">SARAM</label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.saram} disabled
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Telefone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.telefone} onChange={(e) => setProfile(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ramal</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.ramal} onChange={(e) => setProfile(p => ({ ...p, ramal: e.target.value }))} placeholder="0000"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Divisão</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={profile.divisao} disabled
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveProfile} disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                  <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>
            )}

            {/* SECURITY SECTION */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Segurança</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Altere sua senha de acesso</p>
                </div>
                <div className="max-w-md space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nova Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} placeholder="Mínimo 6 caracteres"
                        className="w-full h-11 pl-10 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Confirmar Senha</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repita a nova senha"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                </div>
                <button onClick={handleChangePassword} disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                  <Shield size={16} /> {isSaving ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Notificações</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Configure alertas e atualizações</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'enabled', label: 'Notificações do Sistema', desc: 'Receba alertas dentro do aplicativo.' },
                    { key: 'criticalAlerts', label: 'Alertas Críticos', desc: 'Notificações sobre processos com atraso ou suspensos.' },
                    { key: 'processUpdates', label: 'Atualizações de Processos', desc: 'Aviso quando um processo for alterado.' },
                    { key: 'emailNotifications', label: 'Notificações por E-mail', desc: 'Receba resumos por e-mail (quando disponível).' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle checked={(notifications as any)[item.key]} onChange={(v) => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveSettings} disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                  <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            )}

            {/* WORKSPACE SECTION */}
            {activeSection === 'workspace' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Espaço de Trabalho</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Preferências globais do aplicativo</p>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                      {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tema da Interface</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Atual: {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                      </p>
                    </div>
                  </div>
                  <button onClick={toggleTheme}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all">
                    Alternar Tema
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Salvamento Automático</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Salvar rascunhos automaticamente ao preencher formulários.</p>
                    </div>
                    <Toggle checked={workspace.autoSave} onChange={(v) => setWorkspace(prev => ({ ...prev, autoSave: v }))} />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Itens por Página</label>
                    <select value={workspace.itemsPerPage} onChange={(e) => setWorkspace(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))}
                      className="mt-2 w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value={10}>10 itens</option>
                      <option value={20}>20 itens</option>
                      <option value={50}>50 itens</option>
                      <option value={100}>100 itens</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleSaveSettings} disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                  <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            )}

            {/* BACKUP & RESTORE SECTION */}
            {activeSection === 'backup' && isAdmin && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Backup e Restauração de Versões</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                      Administrador
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
                    Gerencie cópias de segurança e restaure o sistema para versões anteriores sem bugs ou perda de dados.
                  </p>
                </div>

                {/* Restoration Messages */}
                {restoreSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    <span>{restoreSuccessMsg}</span>
                  </div>
                )}
                {restoreError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <span>{restoreError}</span>
                  </div>
                )}

                {/* Section 1: Backup Frequency Schedule */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Frequência do Backup Automático
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Defina a frequência com que o sistema salvará automaticamente um ponto de restauração.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: 'desativado', label: 'Desativado', desc: 'Sem backups agendados automaticamente' },
                      { id: 'semanal', label: 'Semanal', desc: 'Cópia automática a cada 7 dias' },
                      { id: 'mensal', label: 'Mensal', desc: 'Cópia automática a cada 30 dias' },
                      { id: 'semestral', label: 'Semestral', desc: 'Cópia automática a cada 180 dias' },
                    ].map((item) => {
                      const isSelected = backupSchedule === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleScheduleChange(item.id as BackupFrequency)}
                          className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.label}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Export / Download Manual Backup */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Gerar e Baixar Arquivo de Backup
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Exporte um snapshot completo em formato <code>.json</code> contendo todos os processos, usuários, documentos, efetivo, divisões e configurações.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateAndDownloadBackup}
                    disabled={isGeneratingBackup}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                  >
                    {isGeneratingBackup ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Gerando Backup...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Criar Backup Agora</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Section 3: Import / Upload Backup File */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Restaurar Versão por Arquivo (.json)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Faça o upload de um arquivo de backup exportado previamente para restaurar o estado exato dos dados.
                    </p>
                  </div>

                  <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white dark:bg-slate-900 group text-center">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Clique aqui ou arraste o arquivo de backup (.json)
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
                      Formatos suportados: JSON (GPATD Backup V1)
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Section 4: Previous Saved Versions History */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <History size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Histórico de Versões Salvas
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Versões recentes armazenadas localmente para restauração rápida com 1 clique.
                    </p>
                  </div>

                  {backupHistory.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-center text-slate-400 text-xs font-medium">
                      Nenhum backup recente salvo no histórico. Clique em "Criar Backup Agora" para salvar o primeiro ponto de restauração.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {backupHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800 dark:text-white">
                                {new Date(item.timestamp).toLocaleString('pt-BR')}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {item.frequency || 'Manual'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Criado por: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.createdBy}</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                {item.summary?.processesCount || 0} Processos
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                {item.summary?.documentsCount || 0} Documentos
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                {item.summary?.profilesCount || 0} Usuários
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                {item.summary?.efetivoCount || 0} Efetivo
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectHistoryBackup(item)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                            >
                              <RefreshCw size={14} />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => downloadBackupFile(item.payload)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                              title="Baixar arquivo JSON"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-all"
                              title="Excluir histórico"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmation Modal */}
                {isConfirmRestoreOpen && selectedBackupToRestore && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
                    >
                      <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirmar Restauração de Versão</h3>
                          <p className="text-xs text-slate-400">Ação de atualização completa de dados</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                        <p><strong>Data do Backup:</strong> {new Date(selectedBackupToRestore.metadata.timestamp).toLocaleString('pt-BR')}</p>
                        <p><strong>Criado por:</strong> {selectedBackupToRestore.metadata.createdBy.name}</p>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 font-medium">
                          <div>• <strong>Processos:</strong> {selectedBackupToRestore.metadata.summary.processesCount}</div>
                          <div>• <strong>Documentos:</strong> {selectedBackupToRestore.metadata.summary.documentsCount}</div>
                          <div>• <strong>Usuários:</strong> {selectedBackupToRestore.metadata.summary.profilesCount}</div>
                          <div>• <strong>Divisões:</strong> {selectedBackupToRestore.metadata.summary.divisionsCount}</div>
                          <div>• <strong>Efetivo:</strong> {selectedBackupToRestore.metadata.summary.efetivoCount}</div>
                          <div>• <strong>Configurações:</strong> {selectedBackupToRestore.metadata.summary.userSettingsCount}</div>
                        </div>
                      </div>

                      <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                        Atenção: A restauração atualizará todos os processos, documentos e configurações atuais conforme a versão selecionada.
                      </p>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => setIsConfirmRestoreOpen(false)}
                          disabled={isRestoring}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmRestore}
                          disabled={isRestoring}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isRestoring ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              <span>Restaurando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Confirmar Restauração</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
