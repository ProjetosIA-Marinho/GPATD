import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  ArrowUpRight, 
  Calendar,
  Zap,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Bell,
  Search,
  ChevronDown,
  Filter,
  Building2,
  LayoutDashboard,
  BarChart2,
  Hash
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  LabelList
} from 'recharts';

const ParallaxCard = ({ children, offset = 10, className = "" }: { children: React.ReactNode, offset?: number, className?: string, key?: any }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

const StatCard = ({ stat, idx, onClick }: any) => {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1 }}
      whileHover={{ scale: 1.02, cursor: 'pointer', backgroundColor: "var(--hover-bg)" }}
      style={{ '--hover-bg': stat.hoverColor } as any}
      className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border transition-all duration-300 group h-full ${
        stat.customBg || 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center text-white shadow-lg ${stat.shadowColor} transition-transform group-hover:scale-110 duration-500`}>
          <stat.icon size={24} />
        </div>
        <button className={`${stat.isCustom ? 'text-slate-300 dark:text-slate-400 hover:text-slate-500 dark:hover:text-slate-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <h3 className={`text-3xl font-display font-black leading-none ${
            stat.isCustom ? 'text-black dark:text-white' : 'text-slate-900 dark:text-white'
          }`}>
            {stat.value}
          </h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.1em] mt-3 ${
            stat.isCustom ? 'text-[#62748e] dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {stat.name}
          </p>
          <p className={`text-[10px] font-black uppercase tracking-[0.1em] mt-1 ${
            stat.isCustom ? 'text-slate-400 dark:text-indigo-400' : stat.textColor
          }`}>
            {stat.subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

import { Process } from '../views/Processes';

export default function Dashboard({ 
  processes = [], 
  setActiveTab, 
  onSelectProcess,
  globalSearchTerm = '',
  currentUser
}: { 
  processes: Process[], 
  setActiveTab: (tab: string, filter?: string) => void, 
  onSelectProcess?: (process: Process) => void,
  globalSearchTerm?: string,
  currentUser: any
}) {
  const canFilterAllDivisions = currentUser.role === 'Administrador' || currentUser.role === 'Visualizador';
  
  const [selectedAno, setSelectedAno] = useState('');
  const [isAnoOpen, setIsAnoOpen] = useState(false);

  const [selectedDivisao, setSelectedDivisao] = useState('');
  const [isDivisaoOpen, setIsDivisaoOpen] = useState(false);

  const optionsAno = useMemo(() => {
    const years = processes.map(p => p.patdNumber.split('/').pop()).filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b!.localeCompare(a!));
  }, [processes]);

  const optionsDivisao = useMemo(() => {
    return Array.from(new Set(processes.map(p => p.divisao))).filter(Boolean).sort();
  }, [processes]);

  const displayProcesses = useMemo(() => {
    let result = canFilterAllDivisions ? processes : processes.filter(p => p.divisao === currentUser.divisao);
    if (canFilterAllDivisions && selectedDivisao) {
      result = result.filter(p => p.divisao === selectedDivisao);
    }
    if (selectedAno) {
      result = result.filter(p => p.patdNumber.endsWith(selectedAno));
    }
    return result;
  }, [processes, currentUser, canFilterAllDivisions, selectedDivisao, selectedAno]);

  // Infinite Scroll States
  const [visibleRecent, setVisibleRecent] = useState(5);
  const [visibleCritical, setVisibleCritical] = useState(10);
  const [visibleDivisions, setVisibleDivisions] = useState(4);

  const stats = [
    { 
      name: 'Total de Processos', 
      value: displayProcesses.length.toString(), 
      icon: FileText, 
      bgColor: 'bg-blue-600', 
      hoverColor: 'rgba(59, 130, 246, 0.03)',
      shadowColor: 'shadow-blue-200 dark:shadow-none',
      textColor: 'text-blue-600 dark:text-blue-400',
      subtitle: '',
      chartColor: '#2563eb',
      customBg: 'bg-white dark:bg-[#0f172b] border-slate-100 dark:border-slate-800',
      isCustom: true
    },
    { 
      name: 'Concluídos', 
      value: displayProcesses.filter(p => p.status === 'Concluído').length.toString(), 
      icon: CheckCircle2, 
      bgColor: 'bg-emerald-500', 
      hoverColor: 'rgba(16, 185, 129, 0.03)',
      shadowColor: 'shadow-emerald-200 dark:shadow-none',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      subtitle: `${Math.round((displayProcesses.filter(p => p.status === 'Concluído').length / (displayProcesses.length || 1)) * 100)}% Finalizados`,
      chartColor: '#10b981'
    },
    { 
      name: 'Em Andamento', 
      value: displayProcesses.filter(p => p.status === 'Em Andamento').length.toString(), 
      icon: Clock, 
      bgColor: 'bg-amber-500', 
      hoverColor: 'rgba(245, 158, 11, 0.03)',
      shadowColor: 'shadow-amber-200 dark:shadow-none',
      textColor: 'text-amber-600 dark:text-amber-400',
      subtitle: `${Math.round((displayProcesses.filter(p => p.status === 'Em Andamento').length / (displayProcesses.length || 1)) * 100)}% Ativos`,
      chartColor: '#f59e0b'
    },
    { 
      name: 'Suspensos', 
      value: displayProcesses.filter(p => p.status === 'Suspenso').length.toString(), 
      icon: AlertCircle, 
      bgColor: 'bg-rose-500', 
      hoverColor: 'rgba(244, 63, 94, 0.03)',
      shadowColor: 'shadow-rose-200 dark:shadow-none',
      textColor: 'text-rose-600 dark:text-rose-400',
      subtitle: `${Math.round((displayProcesses.filter(p => p.status === 'Suspenso').length / (displayProcesses.length || 1)) * 100)}% Paralisados`,
      chartColor: '#f43f5e'
    },
  ];

  const criticalAlerts = displayProcesses.filter(p => {
    const startDate = new Date(p.dataInicio);
    const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const matchesSearch = !globalSearchTerm || 
      p.patdNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
      p.militar.toLowerCase().includes(globalSearchTerm.toLowerCase());

    return (p.status === 'Suspenso' || p.status === 'Em Andamento') && diffDays > 30 && matchesSearch;
  });

  const latestProcesses = [...displayProcesses]
    .filter(p => !globalSearchTerm || 
      p.patdNumber.toLowerCase().includes(globalSearchTerm.toLowerCase()) || 
      p.militar.toLowerCase().includes(globalSearchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());

  // Dynamic Division Data
  const divCounts = displayProcesses.reduce((acc: any, p) => {
    acc[p.divisao] = (acc[p.divisao] || 0) + 1;
    return acc;
  }, {});
  
  const divisionData = Object.entries(divCounts).map(([name, val]: [string, any], i) => ({
    name,
    val,
    color: ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-orange-500'][i % 7]
  })).sort((a, b) => b.val - a.val);

  // Dynamic Punishment Data
  const punCounts = displayProcesses.reduce((acc: any, p) => {
    if (p.punicao && p.punicao !== 'Em Branco') {
      acc[p.punicao] = (acc[p.punicao] || 0) + 1;
    }
    return acc;
  }, {});

  const punishmentData = Object.entries(punCounts).map(([name, value]: [string, any], i) => ({
    name,
    value,
    color: ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'][i % 6]
  }));

  // Dynamic Rank Data
  const rankOrder = ['S2', 'T2', 'T1', 'S1', 'CB', '3S', '2S', '1S', 'SO', 'CD', 'AP', '2T', '1T', 'CP', 'MJ', 'TC', 'CL', 'BR'];
  const rankCounts = displayProcesses.reduce((acc: any, p) => {
    acc[p.posto] = (acc[p.posto] || 0) + 1;
    return acc;
  }, {});

  const rankData = rankOrder
    .map(name => ({ name, value: rankCounts[name] || 0 }))
    .filter(item => item.value > 0);

  // Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>, setter: React.Dispatch<React.SetStateAction<number>>, total: number) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      setter(prev => Math.min(prev + 5, total));
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Bem-vindo</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-black opacity-60">Visão Geral dos Processos</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
            <div className="relative">
              {canFilterAllDivisions ? (
                <>
                  <button 
                    onClick={() => setIsDivisaoOpen(!isDivisaoOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Building2 size={14} className="opacity-50" />
                    Divisão: <span className="text-indigo-600 dark:text-indigo-400">{selectedDivisao || 'Todos'}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isDivisaoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isDivisaoOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDivisaoOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          className="absolute left-0 top-full mt-2 p-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 min-w-[150px] max-h-60 overflow-y-auto custom-scrollbar"
                        >
                          <button 
                            onClick={() => { setSelectedDivisao(''); setIsDivisaoOpen(false); }}
                            className={`w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!selectedDivisao ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                          >
                            Todos
                          </button>
                          {optionsDivisao.map((div: string) => (
                            <button 
                              key={div}
                              onClick={() => { setSelectedDivisao(div); setIsDivisaoOpen(false); }}
                              className={`w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest rounded-lg transition-all mt-1 ${selectedDivisao === div ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                            >
                              {div}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Building2 size={14} className="opacity-50" />
                  Divisão: {currentUser.divisao}
                </div>
              )}
            </div>
            <div className="h-4 w-px bg-slate-100 dark:bg-slate-800" />
            <div className="relative">
              <button 
                onClick={() => setIsAnoOpen(!isAnoOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Calendar size={14} className="opacity-50" />
                Ano: <span className="text-indigo-600 dark:text-indigo-400">{selectedAno || 'Todos'}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isAnoOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isAnoOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsAnoOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      className="absolute right-0 top-full mt-2 p-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 min-w-[120px]"
                    >
                      <button 
                        onClick={() => { setSelectedAno(''); setIsAnoOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!selectedAno ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                      >
                        Todos
                      </button>
                      {optionsAno.map((ano: string) => (
                        <button 
                          key={ano}
                          onClick={() => { setSelectedAno(ano); setIsAnoOpen(false); }}
                          className={`w-full px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest rounded-lg transition-all mt-1 ${selectedAno === ano ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                        >
                          {ano}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {stats.map((stat, idx) => (
          <ParallaxCard key={stat.name} offset={4 + idx} className="h-full">
            <StatCard stat={stat} idx={idx} onClick={() => {
              const statusMap: any = {
                'Concluídos': 'Concluído',
                'Em Andamento': 'Em Andamento',
                'Suspensos': 'Suspenso'
              };
              setActiveTab('processos', statusMap[stat.name] || '');
            }} />
          </ParallaxCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <ParallaxCard offset={6} className="h-full">
              <div 
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Processo por Divisão</h3>
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-500 transition-colors">
                    <LayoutDashboard size={14} />
                  </div>
                </div>
                 <div 
                  className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {divisionData.map((div, i) => (
                    <div key={div.name} className="space-y-1.5" onClick={() => setActiveTab('processos', '')}>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">{div.name}</span>
                        <span className="text-slate-900 dark:text-white">{div.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: `${(div.val / 50) * 100}%` }}
                           viewport={{ once: true }}
                           transition={{ duration: 1, delay: i * 0.05 }}
                           className={`h-full ${div.color} rounded-full`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ParallaxCard>
            
            <ParallaxCard offset={8} className="h-full">
              <div 
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
                onClick={() => setActiveTab('processos', '')}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Processos por Posto</h3>
                  <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-500 transition-colors">
                    <BarChart2 size={14} />
                  </div>
                </div>
                <div className="h-44 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankData}>
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                         <Tooltip 
                           cursor={{ fill: 'transparent' }} 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         />
                         <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                           <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 'bold' }} />
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </ParallaxCard>
          </div>

          <ParallaxCard offset={4}>
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Processos Recentes</h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold opacity-70">Acompanhamento detalhado</p>
                </div>
                <button 
                  onClick={() => setActiveTab('processos', '')}
                  className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-800"
                >
                  Ver Todos
                </button>
              </div>
              <div 
                className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar space-y-4"
                onScroll={(e) => handleScroll(e, setVisibleRecent, latestProcesses.length)}
              >
                {latestProcesses.slice(0, visibleRecent).map((process, i) => {
                  const hasOperatorDoc = currentUser?.role === 'Administrador' && process.history && Array.isArray(process.history) && process.history.some((h: any) => {
                    const isDoc = h.field === 'Documento PDF' || h.field === 'Portaria de Delegação';
                    const isAddition = h.newValue && (h.newValue.includes('Adicionado') || h.newValue.includes('Adicionada'));
                    const isNotCurrentAdmin = h.user && h.user !== currentUser.name;
                    return isDoc && isAddition && isNotCurrentAdmin;
                  });

                  return (
                    <motion.div 
                      key={process.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer transition-all group" 
                      onClick={() => onSelectProcess?.(process)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all overflow-hidden relative group-hover:border-indigo-500/50">
                          <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 z-10">{process.divisao.substring(0, 3)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900 dark:text-white">PATD {process.patdNumber}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                              process.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 
                              process.status === 'Suspenso' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {process.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{process.militar} • <span className="opacity-60">{process.saram}</span></p>
                          {hasOperatorDoc && (
                            <span className="flex items-center gap-1 mt-1.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md w-fit">
                              <AlertCircle size={10} />
                              Doc. Inserido por Operador
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex flex-col items-end">
                          <span className="opacity-50">Início</span>
                          <span className="text-slate-600 dark:text-slate-300">{new Date(process.dataInicio).toLocaleDateString()}</span>
                        </div>
                        <ArrowUpRight size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                    </motion.div>
                  );
                })}
                {visibleRecent < latestProcesses.length && (
                  <div className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando mais processos...</div>
                )}
              </div>
            </div>
          </ParallaxCard>
          
          <ParallaxCard offset={2}>
            <div className="rounded-2xl bg-linear-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative group">
               <div className="relative z-10">
                 <h3 className="text-2xl font-display font-bold">Documentos</h3>
                 <p className="mt-2 text-indigo-100 max-w-md">Acesse documentos como modelos, portarias, normas e legislações que vão te auxiliar durante o processo.</p>
                 <button 
                   onClick={() => setActiveTab('documentos')}
                   className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 hover:bg-slate-50 transition-all hover:scale-105 shadow-lg"
                 >
                   Ver Documentação
                 </button>
               </div>
               <div className="absolute -bottom-10 -right-10 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            </div>
          </ParallaxCard>
        </div>

        {/* Sidebar Widgets */}
        <div className="flex flex-col gap-6 text-sm h-full">
           <ParallaxCard offset={8} className="flex-1">
             <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
               <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-6">Tipos de Punição</h3>
               
               <div className="h-[280px] w-full relative my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={punishmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {punishmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                       {punishmentData.reduce((acc, d) => acc + d.value, 0)}
                     </p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total</p>
                  </div>
               </div>

               <div className="mt-8 space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                 {punishmentData.map((item) => (
                   <div 
                     key={item.name} 
                     className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-xl transition-colors"
                     onClick={() => setActiveTab('processos', '')}
                   >
                     <div className="flex items-center gap-2">
                       <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                       <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider group-hover:text-indigo-500 transition-colors">{item.name}</span>
                     </div>
                     <span className="text-slate-900 dark:text-white font-black">{item.value}</span>
                   </div>
                 ))}
               </div>
             </div>
           </ParallaxCard>

           <ParallaxCard offset={10}>
             <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-6">
                <h3 className="text-lg font-display font-bold text-rose-900 dark:text-rose-400 mb-6 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Alertas Críticos
                </h3>
                <div 
                  className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                  onScroll={(e) => handleScroll(e, setVisibleCritical, criticalAlerts.length)}
                >
                   {criticalAlerts.length > 0 ? criticalAlerts.slice(0, visibleCritical).map((p) => (
                      <motion.div 
                        key={p.id}
                        layout
                        whileHover={{ x: 5 }}
                        className="p-4 rounded-xl bg-white dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 shadow-sm cursor-pointer group"
                        onClick={() => onSelectProcess?.(p)}
                      >
                         <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                             {p.status === 'Suspenso' ? 'Processo Suspenso' : 'Atraso Crítico'}
                           </p>
                           <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <p className="text-sm font-black text-slate-800 dark:text-white mt-1">PATD {p.patdNumber}</p>
                         <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-bold">{p.militar}</p>
                      </motion.div>
                   )) : (
                     <div className="p-4 text-center text-rose-400/50 text-xs font-bold uppercase tracking-widest">
                       Nenhum alerta crítico
                     </div>
                   )}
                   {visibleCritical < criticalAlerts.length && (
                     <div className="py-2 text-center text-[10px] text-rose-400/50 font-bold uppercase tracking-widest animate-pulse">Carregando mais...</div>
                   )}
                </div>
             </div>
           </ParallaxCard>
        </div>
      </div>
    </div>
  );
}

