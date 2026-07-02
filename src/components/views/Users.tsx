import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  MoreVertical,
  Shield, 
  Mail, 
  Building2, 
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
  AlertCircle,
  Lock,
  User as UserSoloIcon,
  Phone,
  Hash,
  Briefcase,
  Eye,
  EyeOff,
  Send,
  Check,
  Loader2
} from 'lucide-react';
import { Division } from './Divisions';
import { supabase } from '../../lib/supabase';

export interface User {
  id: string;
  name: string;
  posto: string;
  saram: string;
  divisao: string;
  role: 'Administrador' | 'Operador' | 'Visualizador' | 'Apurador';
  status: 'Ativo' | 'Inativo';
  lastAccess: string;
  email?: string;
  login?: string;
  senha?: string;
  telefone?: string;
  ramal?: string;
}

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  divisions: Division[];
  globalSearchTerm?: string;
  isAdmin?: boolean;
  loggedUser?: User;
}

const SelectField = ({ label, icon: Icon, value, onChange, options, placeholder = "Selecionar", direction = "down" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className={`space-y-1.5 flex-1 relative ${isOpen ? 'z-50' : ''}`}>
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white text-left font-medium relative z-20 flex items-center overflow-hidden"
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500">
            {Icon && <Icon size={16} />}
          </div>
          <span className={`truncate block w-full pr-2 ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-transform duration-300 flex items-center ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              <motion.div
                initial={direction === 'up' 
                  ? { opacity: 0, y: -10, scale: 0.95 } 
                  : { opacity: 0, y: 10, scale: 0.95 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={direction === 'up'
                  ? { opacity: 0, y: -10, scale: 0.95 }
                  : { opacity: 0, y: 10, scale: 0.95 }
                }
                className={`absolute left-0 right-0 p-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden min-w-[200px] ${
                  direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
                }`}
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {options.map((opt: any) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          onChange(opt.value);
                        }}
                        className={`
                          relative w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 group/item rounded-lg mb-0.5 last:mb-0
                          ${isSelected 
                            ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 rounded-full bg-white"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Users({ users, setUsers, divisions, globalSearchTerm = '', isAdmin = true, loggedUser }: UsersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Bulk Email State
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('[GPATD] Aviso: Atualização Obrigatória de Processos (PATD)');
  const [emailBody, setEmailBody] = useState(`Prezado(a) Operador(a),

Solicitamos a revisão e atualização do andamento de todos os processos (PATD) sob a responsabilidade de sua Divisão que se encontram pendentes de atualizações no sistema GPATD, até o dia 30/06/2026.

Respeitosamente,
Seção de Investigação e Justiça (SIJ)`);
  
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1); // 1: Select recipients, 2: Compose email, 3: Sending/Progress
  const [sendingIndex, setSendingIndex] = useState(-1);
  const [sendingLogs, setSendingLogs] = useState<{ id: string; name: string; email: string; status: 'pending' | 'sending' | 'success' | 'error' }[]>([]);

  // Filter only operators with valid email
  const operatorsWithEmail = React.useMemo(() => {
    return users.filter(u => u.role === 'Operador' && u.email && u.email.trim() !== '');
  }, [users]);

  React.useEffect(() => {
    if (isBulkEmailModalOpen) {
      setSelectedUserIds(operatorsWithEmail.map(u => u.id));
      setBulkStep(1);
      setSendingIndex(-1);
      setSendingLogs([]);
    }
  }, [isBulkEmailModalOpen, operatorsWithEmail]);

  const handleStartSending = () => {
    setBulkStep(3);
    setSendingIndex(0);
    
    const logs = operatorsWithEmail
      .filter(u => selectedUserIds.includes(u.id))
      .map(u => ({ id: u.id, name: u.name, email: u.email || '', status: 'pending' as const }));
    
    setSendingLogs(logs);
  };

  React.useEffect(() => {
    const sendCurrentEmail = async () => {
      if (bulkStep === 3 && sendingIndex >= 0 && sendingIndex < sendingLogs.length) {
        const currentLog = sendingLogs[sendingIndex];
        if (!currentLog || currentLog.status !== 'pending') return;

        setSendingLogs(prev => prev.map((log, idx) => idx === sendingIndex ? { ...log, status: 'sending' } : log));
        
        try {
          const { error } = await supabase.functions.invoke('send-notification', {
            body: {
              to: currentLog.email,
              name: currentLog.name,
              subject: emailSubject,
              body: emailBody,
              senderPhone: loggedUser?.telefone || "",
              senderExtension: loggedUser?.ramal || "",
              senderEmail: loggedUser?.email || ""
            }
          });
          
          if (error) {
            console.error(`Error sending email to ${currentLog.email}:`, error);
            setSendingLogs(prev => prev.map((log, idx) => idx === sendingIndex ? { ...log, status: 'error' } : log));
          } else {
            setSendingLogs(prev => prev.map((log, idx) => idx === sendingIndex ? { ...log, status: 'success' } : log));
          }
        } catch (err) {
          console.error(`Exception sending email to ${currentLog.email}:`, err);
          setSendingLogs(prev => prev.map((log, idx) => idx === sendingIndex ? { ...log, status: 'error' } : log));
        } finally {
          setSendingIndex(prev => prev + 1);
        }
      }
    };

    sendCurrentEmail();
  }, [bulkStep, sendingIndex, emailSubject, emailBody, loggedUser]);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    posto: '',
    saram: '',
    divisao: '',
    role: 'Visualizador',
    status: 'Ativo',
    email: '',
    login: '',
    senha: '',
    telefone: '',
    ramal: ''
  });

  const handleFieldBlur = async (field: 'saram' | 'nome') => {
    const searchVal = field === 'saram' ? formData.saram : formData.name;
    if (!searchVal) return;

    try {
      let query = supabase.from('efetivo').select('*');
      if (loggedUser?.role === 'Operador') {
        query = query.eq('divisao', loggedUser.divisao);
      }
      if (field === 'saram') {
        query = query.eq('saram', searchVal.trim());
      } else {
        query = query.ilike('nome_completo', searchVal.trim());
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      if (data) {
        setFormData((prev: any) => ({
          ...prev,
          saram: data.saram || prev.saram,
          name: data.nome_completo || prev.name,
          posto: data.posto || prev.posto,
          divisao: data.divisao || prev.divisao,
          email: data.email || prev.email,
          login: data.email || prev.login,
          telefone: data.telefone || prev.telefone,
          ramal: data.ramal || prev.ramal
        }));
      }
    } catch (err) {
      console.error('Error fetching details from efetivo for user:', err);
    }
  };

  const optionsPosto = [
    { value: 'BR', label: 'BR' },
    { value: 'CL', label: 'CL' },
    { value: 'TC', label: 'TC' },
    { value: 'MJ', label: 'MJ' },
    { value: 'CP', label: 'CP' },
    { value: '1T', label: '1T' },
    { value: '2T', label: '2T' },
    { value: 'AP', label: 'AP' },
    { value: 'CD', label: 'CD' },
    { value: 'SO', label: 'SO' },
    { value: '1S', label: '1S' },
    { value: '2S', label: '2S' },
    { value: '3S', label: '3S' },
    { value: 'AL', label: 'AL' },
    { value: 'CB', label: 'CB' },
    { value: 'TM', label: 'TM' },
    { value: 'S1', label: 'S1' },
    { value: 'T1', label: 'T1' },
    { value: 'S2', label: 'S2' },
    { value: 'T2', label: 'T2' },
  ];

  const optionsRole = loggedUser?.role === 'Operador'
    ? [{ value: 'Apurador', label: 'Apurador' }]
    : [
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Operador', label: 'Operador' },
        { value: 'Visualizador', label: 'Visualizador' },
        { value: 'Apurador', label: 'Apurador' },
      ];

  const optionsStatus = [
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
  ];

  const optionsDivisao = divisions.map(d => ({ value: d.name, label: d.name }));

  const filteredUsers = users.filter(user => {
    if (loggedUser?.role === 'Operador') {
      const isSelf = user.id === loggedUser.id;
      const isApuradorInSameDiv = user.role === 'Apurador' && user.divisao === loggedUser.divisao;
      if (!isSelf && !isApuradorInSameDiv) return false;
    }
    const effectiveSearch = globalSearchTerm || searchTerm;
    const matchesSearch = user.name.toLowerCase().includes(effectiveSearch.toLowerCase()) || 
                         user.saram.includes(effectiveSearch);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: User['role']) => {
    switch (role) {
      case 'Administrador': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Operador': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Apurador': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Visualizador': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        ...user,
        email: user.email || '',
        login: user.login || '',
        senha: '', // Oculta a senha atual do administrador
        telefone: user.telefone || '',
        ramal: user.ramal || ''
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        posto: '',
        saram: '',
        divisao: loggedUser?.role === 'Operador' ? loggedUser.divisao : '',
        role: loggedUser?.role === 'Operador' ? 'Apurador' : 'Visualizador',
        status: 'Ativo',
        email: '',
        login: '',
        senha: '',
        telefone: '',
        ramal: ''
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setShowPassword(false);
    setFormData({
      name: '',
      posto: '',
      saram: '',
      divisao: '',
      role: 'Visualizador',
      status: 'Ativo',
      email: '',
      login: '',
      senha: '',
      telefone: '',
      ramal: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar SARAM (7 números)
    if (formData.saram?.length !== 7 || !/^\d+$/.test(formData.saram)) {
      alert('O campo SARAM deve conter exatamente 7 números.');
      return;
    }

    // Verificar se o e-mail já existe no sistema
    const emailExists = users.some(u => u.email?.toLowerCase() === formData.email?.toLowerCase() && u.id !== currentUser?.id);
    if (emailExists) {
      alert('Este e-mail já está cadastrado no sistema.');
      return;
    }

    try {
      const dbPayload: any = {
        name: formData.name,
        posto: formData.posto,
        saram: formData.saram,
        divisao: formData.divisao,
        role: formData.role,
        status: formData.status,
        email: formData.email,
        telefone: formData.telefone,
        ramal: formData.ramal,
      };

      if (currentUser) {
        // Update
        if (!isAdmin && !(loggedUser?.role === 'Operador' && currentUser.role === 'Apurador')) {
          alert('Apenas administradores ou operadores autorizados podem editar usuários.');
          return;
        }
        const { error } = await supabase.from('profiles').update(dbPayload).eq('id', currentUser.id);
        if (error) throw error;
        setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...formData } as User : u));
      } else {
        // Create
        if (!isAdmin && loggedUser?.role !== 'Operador') {
          alert('Apenas administradores ou operadores podem criar usuários.');
          return;
        }

        if (!formData.senha) {
          alert('Por favor, defina uma senha para o novo usuário.');
          return;
        }

        const { createClient } = await import('@supabase/supabase-js');
        const authClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const { data: authData, error: authError } = await authClient.auth.signUp({
          email: formData.email as string,
          password: formData.senha as string,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Usuário não retornado pelo Auth.");

        // Atualizar o perfil recém-criado pelo trigger do banco com os dados do formulário
        const { error: profileError } = await supabase
          .from('profiles')
          .update(dbPayload)
          .eq('id', authData.user.id);

        if (profileError) {
          // Se falhar o update do perfil, no mínimo o perfil básico foi criado pelo trigger.
          console.warn('Erro ao atualizar perfil com dados complementares:', profileError);
        }
        
        const newUser: User = {
          ...formData,
          id: authData.user.id,
          lastAccess: 'Nunca'
        } as User;
        setUsers([newUser, ...users]);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving user:', err);
      alert(`Erro ao salvar usuário no banco de dados. ${err.message || ''}`);
    }
  };

  // Nota: A exclusão da linha em 'profiles' dispara automaticamente o trigger de banco 
  // 'on_profile_deleted', que apaga o correspondente em 'auth.users' no Supabase.
  const handleDelete = async () => {
    if (userToDelete) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Erro ao excluir usuário do banco de dados.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Gerenciamento de Usuários</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administre os acessos e permissões dos operadores do sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => setIsBulkEmailModalOpen(true)}
              className="h-11 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 group"
            >
              <Mail size={18} className="group-hover:scale-110 transition-transform" />
              Aviso em Lote
            </button>
          )}
          {(isAdmin || loggedUser?.role === 'Operador') && (
            <button 
              onClick={() => handleOpenModal()}
              className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
            >
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              Novo Usuário
            </button>
          )}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou SARAM..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium outline-hidden"
            style={{ color: '#9a9a9a' }}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-48">
             <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <select 
               value={filterRole}
               onChange={(e) => setFilterRole(e.target.value)}
               className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs font-bold uppercase tracking-widest outline-hidden appearance-none cursor-pointer"
               style={{ color: '#917f7f' }}
             >
               <option value="all">Todos os Cargos</option>
               <option value="Administrador">Administrador</option>
               <option value="Operador">Operador</option>
               <option value="Visualizador">Visualizador</option>
             </select>
             <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
              
              {/* Status Corner Ribbon (Star fold) */}
              <div className="absolute top-0 right-0 z-20">
                <div className="relative">
                  <div 
                    className={`w-12 h-12 ${user.status === 'Ativo' ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'} fill-current`} 
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} 
                  />
                  <span 
                    className={`absolute top-1.5 right-1.5 text-[9px] font-black leading-none ${
                      user.status === 'Ativo' ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    ★
                  </span>
                </div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Centered Circular Avatar and overlapping role badge */}
                <div className="flex flex-col items-center mt-2 mb-4 relative shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-850 shadow-inner bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-650 dark:text-slate-400 overflow-hidden uppercase font-black text-xs group-hover:scale-105 transition-transform duration-555">
                      {(() => {
                        const div = divisions.find(d => d.name === user.divisao);
                        if (div && div.image) {
                          return <img src={div.image} alt={div.name} className="w-full h-full object-cover object-center" />;
                        }
                        return (
                          <svg className="w-14 h-14 text-slate-350 dark:text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        );
                      })()}
                    </div>
                    {/* Overlapping Bottom Badge */}
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-md bg-white dark:bg-slate-800 flex items-center justify-center absolute -bottom-1.5 left-1/2 -translate-x-1/2 translate-y-1/4 z-10">
                      {(() => {
                        switch (user.role) {
                          case 'Administrador': return <Shield size={14} className="text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />;
                          case 'Operador': return <Briefcase size={14} className="text-emerald-500 dark:text-emerald-400 stroke-[2.5]" />;
                          case 'Apurador': return <Search size={14} className="text-amber-500 dark:text-amber-400 stroke-[2.5]" />;
                          case 'Visualizador': return <Eye size={14} className="text-slate-500 dark:text-slate-400 stroke-[2.5]" />;
                          default: return <UserSoloIcon size={14} className="text-slate-500 dark:text-slate-400 stroke-[2.5]" />;
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Center aligned User Name and details */}
                <div className="text-center mt-4 mb-6 shrink-0">
                  <h4 className="font-display font-bold text-slate-900 dark:text-white uppercase text-base tracking-tight line-clamp-1">{user.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{user.posto} • SARAM {user.saram}</p>
                </div>

                {/* Metrics Info Rows with colored circles */}
                <div className="space-y-4 px-2 mb-6 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Divisão</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1.5 truncate">{user.divisao || 'Não especificada'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Shield size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Cargo</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1.5 truncate">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Mail size={14} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">E-mail</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1.5 truncate">{user.email || 'Não cadastrado'}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Section with dropdown menu */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative shrink-0">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Último Acesso</p>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1.5">{user.lastAccess}</p>
                  </div>
                  
                  {(isAdmin || (loggedUser?.role === 'Operador' && user.role === 'Apurador')) && (
                    <div className="relative">
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === user.id ? null : user.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeDropdownId === user.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                          <div className="absolute bottom-10 right-0 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 flex flex-col min-w-32 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button 
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleOpenModal(user);
                              }}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors w-full text-left"
                            >
                              <Edit2 size={14} className="text-slate-400" />
                              Editar
                            </button>
                            <button 
                              onClick={() => {
                                setActiveDropdownId(null);
                                setUserToDelete(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors w-full text-left"
                            >
                              <Trash2 size={14} className="text-rose-500" />
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-[2rem] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-6">
            <UsersIcon size={40} />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Nenhum usuário encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">Tente ajustar seus termos de pesquisa ou filtros.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                      {currentUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase font-bold tracking-widest">
                      Credenciais e informações de acesso
                    </p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {/* Informações Básicas */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <UserSoloIcon size={14} className="text-indigo-500" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificação Militar</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                             <UserSoloIcon size={16} />
                          </div>
                          <input 
                            required
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            onBlur={() => handleFieldBlur('nome')}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="Ex: Cap Marinho"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">SARAM (7 dígitos)</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                             <Hash size={16} />
                          </div>
                          <input 
                            required
                            maxLength={7}
                            type="text" 
                            value={formData.saram}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setFormData({...formData, saram: val});
                            }}
                            onBlur={() => handleFieldBlur('saram')}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="1234567"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SelectField 
                        label="Posto / Graduação" 
                        icon={Briefcase} 
                        value={formData.posto} 
                        onChange={(val: string) => setFormData({...formData, posto: val})} 
                        options={optionsPosto} 
                      />
                      {loggedUser?.role === 'Operador' ? (
                        <div className="space-y-1.5 flex-1">
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Divisão</label>
                          <div className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-150 dark:bg-slate-800/85 border border-slate-200 dark:border-slate-750 flex items-center text-sm font-medium text-slate-500 cursor-not-allowed">
                            <Building2 size={16} className="text-slate-400 mr-2 shrink-0" />
                            <span>{formData.divisao || 'Sem divisão'}</span>
                          </div>
                        </div>
                      ) : (
                        <SelectField 
                          label="Divisão" 
                          icon={Building2} 
                          value={formData.divisao} 
                          onChange={(val: string) => setFormData({...formData, divisao: val})} 
                          options={optionsDivisao} 
                        />
                      )}
                    </div>
                  </section>

                  {/* Contato */}
                  <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                       <Mail size={14} className="text-indigo-500" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contato</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional (Login)</label>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                           <Mail size={16} />
                        </div>
                        <input 
                          type="email" 
                          required
                          autoComplete="new-user-email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value, login: e.target.value})}
                          className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                          placeholder="email@fab.mil.br"
                        />
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase">O e-mail será utilizado como login de acesso</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Telefone / Celular</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                             <Phone size={16} />
                          </div>
                          <input 
                            type="text" 
                            value={formData.telefone}
                            onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="(19) 99999-9999"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Ramal</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                             <Phone size={16} />
                          </div>
                          <input 
                            type="text" 
                            value={formData.ramal}
                            onChange={(e) => setFormData({...formData, ramal: e.target.value})}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder="1234"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Acesso */}
                  <section className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                       <Lock size={14} className="text-indigo-500" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Segurança</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                             <Lock size={16} />
                          </div>
                          <input 
                            required={!currentUser}
                            type={showPassword ? 'text' : 'password'} 
                            autoComplete="new-password"
                            value={formData.senha}
                            onChange={(e) => setFormData({...formData, senha: e.target.value})}
                            className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            placeholder={currentUser ? 'Deixe em branco para manter' : '••••••••'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {loggedUser?.role === 'Operador' ? (
                        <div className="space-y-1.5 flex-1">
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Papel</label>
                          <div className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-150 dark:bg-slate-800/85 border border-slate-200 dark:border-slate-750 flex items-center text-sm font-medium text-slate-500 cursor-not-allowed">
                            <Shield size={16} className="text-slate-400 mr-2 shrink-0" />
                            <span>{formData.role || 'Sem papel'}</span>
                          </div>
                        </div>
                      ) : (
                        <SelectField 
                          label="Papel" 
                          icon={Shield} 
                          value={formData.role} 
                          onChange={(val: any) => setFormData({...formData, role: val})} 
                          options={optionsRole} 
                        />
                      )}
                      <SelectField 
                        label="Status da Conta" 
                        icon={CheckCircle2} 
                        value={formData.status} 
                        onChange={(val: any) => setFormData({...formData, status: val})} 
                        options={optionsStatus} 
                      />
                    </div>
                  </section>
                </div>

                <div className="pt-10 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 border-t border-slate-100 dark:border-slate-800 mt-8">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                  >
                    {currentUser ? 'Salvar Alterações' : 'Criar Conta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Remover Usuário?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Esta ação excluirá permanentemente o acesso de <span className="font-bold text-slate-700 dark:text-white">{userToDelete?.name}</span>. Esta operação não pode ser desfeita.
                </p>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 h-12 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Email Modal */}
      <AnimatePresence>
        {isBulkEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => bulkStep !== 3 && setIsBulkEmailModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                      Aviso em Lote para Operadores
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 uppercase font-bold tracking-widest">
                      Envio de notificação padrão para atualização de processos
                    </p>
                  </div>
                </div>
                {bulkStep !== 3 && (
                  <button 
                    onClick={() => setIsBulkEmailModalOpen(false)} 
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                
                {/* Step Indicators */}
                <div className="flex items-center justify-between mb-8 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      bulkStep === 1 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' 
                        : bulkStep > 1 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {bulkStep > 1 ? <Check size={14} /> : '1'}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${bulkStep === 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Destinatários</span>
                  </div>
                  <div className="h-[2px] flex-1 mx-4 bg-slate-100 dark:bg-slate-800" />
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      bulkStep === 2 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' 
                        : bulkStep > 2 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {bulkStep > 2 ? <Check size={14} /> : '2'}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${bulkStep === 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Mensagem</span>
                  </div>
                  <div className="h-[2px] flex-1 mx-4 bg-slate-100 dark:bg-slate-800" />
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      bulkStep === 3 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      3
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${bulkStep === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Progresso</span>
                  </div>
                </div>

                {/* Step 1: Select Recipients */}
                {bulkStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Operadores Cadastrados ({operatorsWithEmail.length})
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds(operatorsWithEmail.map(u => u.id))}
                          className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:underline font-bold"
                        >
                          Selecionar Todos
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds([])}
                          className="text-[10px] font-black text-slate-400 uppercase tracking-wider hover:underline font-bold"
                        >
                          Limpar Seleção
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {operatorsWithEmail.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          Nenhum operador com e-mail cadastrado encontrado.
                        </div>
                      ) : (
                        operatorsWithEmail.map(user => {
                          const isSelected = selectedUserIds.includes(user.id);
                          return (
                            <label 
                              key={user.id}
                              className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                                    } else {
                                      setSelectedUserIds(prev => [...prev, user.id]);
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {user.posto} {user.name}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                                    ({user.divisao})
                                  </span>
                                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Compose Email */}
                {bulkStep === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assunto do E-mail</label>
                      <input 
                        type="text" 
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white"
                        placeholder="Assunto"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Mensagem (Corpo do E-mail)</label>
                      <textarea 
                        rows={8}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-750 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-900 dark:text-white resize-none"
                        placeholder="Mensagem..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Sending & Logs */}
                {bulkStep === 3 && (
                  <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          {sendingIndex < sendingLogs.length ? 'Enviando Avisos...' : 'Envio Concluído com Sucesso!'}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {Math.min(sendingIndex, sendingLogs.length)} / {sendingLogs.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-indigo-600 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(Math.min(sendingIndex, sendingLogs.length) / sendingLogs.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Sending Logs List */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-850 rounded-2xl p-4 divide-y divide-slate-100/50 dark:divide-slate-800/50">
                      {sendingLogs.map((log, idx) => (
                        <div key={log.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{log.name}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-550 ml-2 font-mono">{log.email}</span>
                          </div>
                          <div>
                            {log.status === 'pending' && (
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aguardando</span>
                            )}
                            {log.status === 'sending' && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                                <Loader2 size={12} className="animate-spin" /> Enviando
                              </span>
                            )}
                            {log.status === 'success' && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                                <Check size={12} /> Enviado
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3">
                {bulkStep === 1 && (
                  <>
                    <button 
                      onClick={() => setIsBulkEmailModalOpen(false)}
                      className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={selectedUserIds.length === 0}
                      onClick={() => setBulkStep(2)}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                      Prosseguir ({selectedUserIds.length})
                    </button>
                  </>
                )}

                {bulkStep === 2 && (
                  <>
                    <button 
                      onClick={() => setBulkStep(1)}
                      className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={handleStartSending}
                      className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={14} />
                      Iniciar Envio em Lote
                    </button>
                  </>
                )}

                {bulkStep === 3 && (
                  <button 
                    disabled={sendingIndex < sendingLogs.length}
                    onClick={() => setIsBulkEmailModalOpen(false)}
                    className="w-full h-12 rounded-xl bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                  >
                    {sendingIndex < sendingLogs.length ? 'Enviando...' : 'Concluir'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
