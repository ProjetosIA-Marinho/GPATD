import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  MessageSquareText, 
  CheckSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Search,
  Moon,
  Sun,
  FileText,
  PlusCircle,
  BarChart,
  Users as UsersIcon,
  Files,
  Building2,
  Bell,
  AlertCircle,
  X,
  LogOut,
  Database
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Division } from '../views/Divisions';

interface ShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string, filter?: string) => void;
  processes?: any[];
  onNotificationClick?: (process: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentUser: any;
  divisions?: Division[];
}

export default function Shell({ 
  children, 
  activeTab, 
  setActiveTab, 
  processes = [], 
  onNotificationClick,
  searchTerm,
  setSearchTerm,
  currentUser,
  divisions = []
}: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissedNotifIds));
  }, [dismissedNotifIds]);

  const handleNotificationAction = (notif: any) => {
    setIsNotificationsOpen(false);
    if (notif.process) {
      onNotificationClick?.(notif.process);
    } else if (notif.tab) {
      setActiveTab(notif.tab);
    }
  };

  const isException = currentUser?.role === 'Administrador' || currentUser?.role === 'Visualizador';

  const criticalAlerts = processes.filter(p => {
    const startDate = new Date(p.dataInicio);
    const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isCritical = (p.status === 'Suspenso' || p.status === 'Em Andamento') && diffDays > 30;

    if (!isCritical) return false;
    if (isException) return true;

    // Filter by logged-in user association
    const userName = currentUser?.name?.toLowerCase() || '';
    const userSaram = currentUser?.saram || '';

    const isMilitar = (p.militar && p.militar.toLowerCase().includes(userName)) || (p.saram && p.saram === userSaram);
    const isApurador = p.apurador && p.apurador.toLowerCase().includes(userName);
    const isAplicador = p.aplicador && p.aplicador.toLowerCase().includes(userName);
    const isHistoryUser = p.history && Array.isArray(p.history) && p.history.some((h: any) => h.user && h.user.toLowerCase().includes(userName));

    return isMilitar || isApurador || isAplicador || isHistoryUser;
  });

  const completedAlerts = currentUser?.role === 'Administrador' ? processes.filter(p => {
    if (p.status !== 'Concluído') return false;
    return p.history && Array.isArray(p.history) && p.history.some((h: any) => {
      const isStatus = h.field === 'Status' || h.field === 'status';
      const fromActive = h.oldValue === 'Em Andamento' || h.oldValue === 'Suspenso';
      const toCompleted = h.newValue === 'Concluído';
      return isStatus && fromActive && toCompleted;
    });
  }) : [];

  const operatorDocUploads = currentUser?.role === 'Administrador' ? processes.filter(p => {
    return p.history && Array.isArray(p.history) && p.history.some((h: any) => {
      const isDoc = h.field === 'Documento PDF' || h.field === 'Portaria de Delegação';
      const isAddition = h.newValue && (h.newValue.includes('Adicionado') || h.newValue.includes('Adicionada'));
      const isNotCurrentAdmin = h.user && h.user !== currentUser.name;
      return isDoc && isAddition && isNotCurrentAdmin;
    });
  }) : [];

  const allRawNotifications = [
    ...criticalAlerts.map(p => ({
      id: `alert-${p.id}`,
      title: p.status === 'Suspenso' ? 'Processo Suspenso' : 'Atraso Crítico (>30 dias)',
      subtitle: `PATD ${p.patdNumber} - ${p.militar}`,
      type: 'critical',
      time: 'Agora',
      process: p
    })),
    ...completedAlerts.map(p => ({
      id: `completed-${p.id}`,
      title: 'Status Concluído',
      subtitle: `PATD ${p.patdNumber} - ${p.militar} foi concluído`,
      type: 'info',
      time: 'Recente',
      process: p
    })),
    ...operatorDocUploads.map(p => {
      const docHistory = [...p.history].reverse().find((h: any) => {
        const isDoc = h.field === 'Documento PDF' || h.field === 'Portaria de Delegação';
        const isAddition = h.newValue && (h.newValue.includes('Adicionado') || h.newValue.includes('Adicionada'));
        const isNotCurrentAdmin = h.user && h.user !== currentUser.name;
        return isDoc && isAddition && isNotCurrentAdmin;
      });
      return {
        id: `opdoc-${p.id}-${docHistory ? docHistory.date : ''}`,
        title: 'Documento Anexado por Operador',
        subtitle: `O operador ${docHistory ? docHistory.user : 'envolvido'} anexou um documento no PATD ${p.patdNumber}`,
        type: 'info',
        time: 'Recente',
        process: p
      };
    }),
    ...(isException ? [
      {
        id: 'admin-doc-1',
        title: 'Novo Documento Adicionado',
        subtitle: 'Administrador anexou "Normas_2024.pdf" ao sistema.',
        type: 'info',
        time: '2h atrás',
        tab: 'documentos'
      }
    ] : [])
  ];

  const notifications = allRawNotifications.filter(n => !dismissedNotifIds.includes(n.id));

  const handleClearAll = () => {
    setDismissedNotifIds(prev => [
      ...prev,
      ...notifications.map(n => n.id)
    ]);
  };

  const primaryNavigation = [
    ...(currentUser?.role !== 'Apurador' ? [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    ] : []),
    ...(currentUser?.role !== 'Visualizador' ? [
      { id: 'processos', name: 'Processos', icon: FileText },
      ...(currentUser?.role !== 'Apurador' ? [
        { id: 'novo-patd', name: 'Novo PATD', icon: PlusCircle },
        { id: 'efetivo', name: 'Efetivo', icon: Database },
      ] : []),
    ] : []),
    ...(currentUser?.role !== 'Apurador' ? [
      { id: 'relatorio', name: 'Relatório', icon: BarChart },
    ] : []),
    ...(currentUser?.role === 'Administrador' || currentUser?.role === 'Operador' ? [
      { id: 'usuarios', name: 'Usuários', icon: UsersIcon },
    ] : []),
    { id: 'documentos', name: 'Documentos', icon: Files },
  ];

  const adminNavigation = [
    ...(currentUser?.role === 'Administrador' || currentUser?.role === 'Operador' ? [{ id: 'divisoes', name: 'Divisões', icon: Building2 }] : []),
    { id: 'settings', name: 'Configurações', icon: Settings },
  ];

  const allNavigation = [...primaryNavigation, ...adminNavigation];

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        id={`nav-${item.id}`}
        key={item.id}
        onClick={() => setActiveTab(item.id, item.id === 'processos' ? '' : undefined)}
        className={`flex w-full items-center rounded-2xl py-3 transition-all relative group ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-slate-900 dark:text-white' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900'
        } ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
      >
        {/* Active Left Indicator */}
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-r-lg bg-blue-500"
          />
        )}
        
        <Icon size={22} className={`${isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`} />
        
        {isSidebarOpen && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`ml-4 font-bold text-[15px] ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
          >
            {item.name}
          </motion.span>
        )}

        {/* Active Right Dot */}
        {isActive && isSidebarOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          />
        )}
      </button>
    );
  };

  return (
    <div id="app-shell" className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        id="sidebar"
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      >
        <div className="flex h-20 items-center px-4 shrink-0 overflow-hidden relative">
          <div className={`flex items-center gap-3 w-full ${!isSidebarOpen ? 'justify-center' : 'px-2'}`}>
             <div className="flex h-12 w-12 shrink-0 items-center justify-center">
               <img src="/logo.png" alt="AFA Logo" className="h-full w-full object-contain drop-shadow-sm" />
             </div>
             <AnimatePresence>
               {isSidebarOpen && (
                 <motion.span 
                   initial={{ opacity: 0, width: 0 }}
                   animate={{ opacity: 1, width: 'auto' }}
                   exit={{ opacity: 0, width: 0 }}
                   transition={{ duration: 0.2 }}
                   className="font-display text-xl font-bold tracking-tight text-slate-800 dark:text-white whitespace-nowrap"
                 >
                  <div className="flex flex-col">
                    <span className="font-display text-xl font-bold tracking-tight text-slate-800 dark:text-white whitespace-nowrap leading-none">
                      GPATD
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">
                      Gestão de PATD da AFA
                    </span>
                  </div>
                 </motion.span>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Floating Toggle Button */}
        <button
          id="toggle-sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all hover:scale-110"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
          {/* PRINCIPAL Section */}
          <div className="space-y-2">
            {isSidebarOpen && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 whitespace-nowrap"
              >
                Principal
              </motion.h3>
            )}
            <div className="space-y-1">
              {primaryNavigation.map(renderNavItem)}
            </div>
          </div>

          {/* ADMINISTRAÇÃO Section */}
          <div className="space-y-2">
            {isSidebarOpen && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-4 whitespace-nowrap"
              >
                Administração
              </motion.h3>
            )}
            <div className="space-y-1">
              {adminNavigation.map(renderNavItem)}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all font-medium text-sm"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              </motion.span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-lg font-semibold text-slate-800 dark:text-white">
              {allNavigation.find(n => n.id === activeTab)?.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
              <div className="relative hidden md:block">
                <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-indigo-500' : 'text-slate-400'}`} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-64 rounded-full bg-slate-100 dark:bg-slate-800 pl-10 pr-4 text-sm focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{ color: '#1d293d' }}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

             <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                        >
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Notificações</h4>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">{notifications.length}</span>
                          </div>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? notifications.map((notif) => (
                              <button 
                                key={notif.id}
                                onClick={() => handleNotificationAction(notif)}
                                className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 flex gap-3"
                              >
                                <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${notif.type === 'critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'}`}>
                                  {notif.type === 'critical' ? <AlertCircle size={16} /> : <FileText size={16} />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{notif.subtitle}</p>
                                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-black opacity-50">{notif.time}</p>
                                </div>
                              </button>
                            )) : (
                              <div className="p-8 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhuma notificação</p>
                              </div>
                            )}
                          </div>
                          {notifications.length > 0 && (
                            <button 
                              onClick={handleClearAll}
                              className="w-full p-3 text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest border-t border-slate-100 dark:border-slate-800"
                            >
                              Limpar Tudo
                            </button>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{currentUser.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-sm border-2 border-white dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold overflow-hidden relative">
                    {(() => {
                      const div = divisions.find(d => d.name === currentUser.divisao);
                      if (div && div.image) {
                        return <img src={div.image} alt={div.name} className="w-full h-full object-cover object-center" />;
                      }
                      return <span className="text-slate-700 dark:text-slate-300 drop-shadow-sm">{currentUser.name.charAt(0).toUpperCase()}</span>;
                    })()}
                    <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
             </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
