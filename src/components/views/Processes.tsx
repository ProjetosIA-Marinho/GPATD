import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ExternalLink,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  History,
  Building2,
  User,
  FileUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Division } from './Divisions';
import BulkImportModal from './BulkImportModal';

const FilterDropdown = ({ label, value, options, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (val: string) => {
    setIsOpen(false);
    onChange(val);
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm"
      >
        {label}: <span className="text-indigo-600 dark:text-indigo-400">{value || 'Todos'}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 p-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 min-w-[180px] max-h-64 overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${!value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
              >
                Todos
              </button>
              {options.map((opt: string) => (
                <button 
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all mt-1 ${value === opt ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface HistoryItem {
  id: string;
  date: string;
  action: string;
  description: string;
  user: string;
}

export interface Process {
  id: string;
  patdNumber: string;
  militar: string;
  saram: string;
  posto: string;
  especialidade: string;
  quadro: string;
  divisao: string;
  setor: string;
  dataInicio: string;
  dataTermino?: string;
  dataPunicao?: string;
  status: 'Concluído' | 'Em Andamento' | 'Suspenso' | 'Arquivado';
  punicao: string;
  diasPunicao: number;
  boletim: string;
  resumoFato: string;
  apurador: string;
  aplicador: string;
  history: HistoryItem[];
  nGrade?: string;
  observacoes?: string;
  resumoPunicao?: string;
  delegacaoDoc?: { name: string; url: string; uploadedAt: string } | null;
}

export default function Processes({ 
  processes, 
  setProcesses, 
  divisions = [],
  setActiveTab, 
  onEdit, 
  onNew,
  initialFilter = '',
  onClearFilter,
  globalSearchTerm = '',
  currentUser
}: { 
  processes: Process[], 
  setProcesses: React.Dispatch<React.SetStateAction<Process[]>>, 
  divisions?: Division[],
  setActiveTab?: (tab: string, filter?: string) => void, 
  onEdit?: (process: Process) => void, 
  onNew?: () => void,
  initialFilter?: string,
  onClearFilter?: () => void,
  globalSearchTerm?: string,
  currentUser: any
}) {
  const canFilterAllDivisions = currentUser.role === 'Administrador' || currentUser.role === 'Visualizador';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Process; direction: 'asc' | 'desc' } | null>(null);
  const [visibleItems, setVisibleItems] = useState(20);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const loadingRef = React.useRef<HTMLDivElement>(null);

  // Audit States
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [deletedProcesses, setDeletedProcesses] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [selectedDeletedProcess, setSelectedDeletedProcess] = useState<any>(null);

  // Fetch deleted processes when modal opens
  React.useEffect(() => {
    if (isAuditOpen) {
      const fetchDeleted = async () => {
        setIsLoadingAudit(true);
        try {
          const { data, error } = await supabase
            .from('deleted_processes')
            .select('*')
            .order('deleted_at', { ascending: false });
          if (error) throw error;
          setDeletedProcesses(data || []);
        } catch (err) {
          console.error('Error fetching deleted processes:', err);
        } finally {
          setIsLoadingAudit(false);
        }
      };
      fetchDeleted();
    }
  }, [isAuditOpen]);

  // Filter States
  const [filterDivisao, setFilterDivisao] = useState(canFilterAllDivisions ? '' : currentUser.divisao);
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [filterPosto, setFilterPosto] = useState('');
  const [filterPunicao, setFilterPunicao] = useState('');
  const [filterAno, setFilterAno] = useState('');

  // Sync initial filter if it changes externally
  React.useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
      // Reset other filters to ensure the specific one is visible
      setFilterDivisao('');
      setFilterPosto('');
      setFilterPunicao('');
      setFilterAno('');
      setSearchTerm('');
    }
  }, [initialFilter]);

  const optionsDivisao = useMemo(() => Array.from(new Set(processes.map(p => p.divisao))), [processes]);
  const optionsStatus = useMemo(() => Array.from(new Set(processes.map(p => p.status))), [processes]);
  const optionsPosto = useMemo(() => Array.from(new Set(processes.map(p => p.posto))).filter(Boolean), [processes]);
  const optionsPunicao = useMemo(() => Array.from(new Set(processes.map(p => p.punicao))), [processes]);
  const optionsAno = useMemo(() => Array.from(new Set(processes.map(p => p.patdNumber.split('/').pop() || ''))), [processes]);

  // Sorting Logic
  const handleSort = (key: keyof Process) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const confirmDelete = async () => {
    if (processToDelete) {
      try {
        // 1. Insert into deleted_processes
        const { error: auditError } = await supabase.from('deleted_processes').insert({
          process_id: processToDelete.id,
          patd_number: processToDelete.patdNumber,
          militar: processToDelete.militar,
          saram: processToDelete.saram,
          divisao: processToDelete.divisao,
          history: processToDelete.history || [],
          deleted_by: currentUser?.name || 'Sistema'
        });
        if (auditError) throw auditError;

        // 2. Delete from main processes table
        const { error } = await supabase.from('processes').delete().eq('id', processToDelete.id);
        if (error) throw error;

        // 3. Update state
        setProcesses(prev => prev.filter(p => p.id !== processToDelete.id));
        if (selectedProcess?.id === processToDelete.id) setSelectedProcess(null);
        setProcessToDelete(null);
      } catch (err: any) {
        console.error('Error deleting process:', err);
        alert(`Erro ao excluir processo: ${err.message || err}`);
      }
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length > 0) {
      try {
        const processesToDelete = processes.filter(p => selectedIds.includes(p.id));

        const auditRecords = processesToDelete.map(p => ({
          process_id: p.id,
          patd_number: p.patdNumber,
          militar: p.militar,
          saram: p.saram,
          divisao: p.divisao,
          history: p.history || [],
          deleted_by: currentUser?.name || 'Sistema'
        }));

        const { error: auditError } = await supabase.from('deleted_processes').insert(auditRecords);
        if (auditError) throw auditError;

        const { error } = await supabase.from('processes').delete().in('id', selectedIds);
        if (error) throw error;

        setProcesses(prev => prev.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBulkDeleteConfirm(false);
      } catch (err: any) {
        console.error('Error deleting processes:', err);
      }
    }
  };

  const handleDelete = (process: Process) => {
    setProcessToDelete(process);
  };

  // Filter and Sort Data
  const filteredAndSortedData = useMemo(() => {
    let result = [...processes];
    
    // Restrict Apurador to only see their processes
    if (currentUser?.role === 'Apurador') {
      const activeSaram = currentUser.saram;
      const activeName = currentUser.name?.toLowerCase() || '';
      result = result.filter(p => {
        const matchesSaram = p.apuradorSaram && p.apuradorSaram === activeSaram;
        const matchesName = p.apurador && p.apurador.toLowerCase().includes(activeName);
        return matchesSaram || matchesName;
      });
    }
    
    // Filter
    const effectiveSearch = globalSearchTerm || searchTerm;
    if (effectiveSearch) {
      const lowSearch = effectiveSearch.toLowerCase();
      result = result.filter(p => 
        p.patdNumber.toLowerCase().includes(lowSearch) ||
        p.militar.toLowerCase().includes(lowSearch) ||
        p.saram.toLowerCase().includes(lowSearch) ||
        p.divisao.toLowerCase().includes(lowSearch) ||
        p.boletim?.toLowerCase().includes(lowSearch)
      );
    }

    // Dropdown Filters
    if (filterDivisao) result = result.filter(p => p.divisao === filterDivisao);
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterPosto) result = result.filter(p => p.posto === filterPosto);
    if (filterPunicao) result = result.filter(p => p.punicao === filterPunicao);
    if (filterAno) result = result.filter(p => p.patdNumber.endsWith(filterAno));

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [processes, searchTerm, globalSearchTerm, sortConfig, filterDivisao, filterStatus, filterPosto, filterPunicao, filterAno]);

  // Reset visible items when filters change
  React.useEffect(() => {
    setVisibleItems(20);
  }, [searchTerm, globalSearchTerm, filterDivisao, filterStatus, filterPosto, filterPunicao, filterAno]);

  // Infinite Scroll Logic
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleItems < filteredAndSortedData.length) {
          setVisibleItems(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [visibleItems, filteredAndSortedData.length]);

  const displayedData = filteredAndSortedData.slice(0, visibleItems);

  const getStatusStyle = (status: Process['status']) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Em Andamento':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Suspenso':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Arquivado':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: Process['status']) => {
    switch (status) {
      case 'Concluído': return <CheckCircle2 size={12} />;
      case 'Em Andamento': return <Clock size={12} />;
      case 'Suspenso': return <AlertCircle size={12} />;
      case 'Arquivado': return <FileText size={12} />;
      default: return null;
    }
  };

  const SortIcon = ({ column }: { column: keyof Process }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <ChevronDown size={14} className="opacity-20 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-indigo-500" /> 
      : <ChevronDown size={14} className="text-indigo-500" />;
  };

  return (
    <div id="processes-view" className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Processos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-black opacity-60">Gerenciamento Completo de PATD</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -track-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} style={{ transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Pesquisar PATD, Militar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white pointer-events-auto shadow-sm"
            />
          </div>

          {currentUser.role === 'Administrador' && (
            <button 
              onClick={() => setIsAuditOpen(true)}
              className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 text-slate-200 hover:bg-slate-850 dark:hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-wider shadow-md"
            >
              <History size={16} className="text-amber-500" />
              Auditoria
            </button>
          )}
          
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-2 h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20"
            >
              <Trash2 size={16} />
              Excluir ({selectedIds.length})
            </button>
          )}
          {currentUser.role !== 'Visualizador' && currentUser.role !== 'Apurador' && (
            <button 
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <FileUp size={16} />
              Importar Planilha
            </button>
          )}
          {(currentUser.role === 'Operador' || currentUser.role === 'Administrador') && (
            <button 
              onClick={() => onNew ? onNew() : setActiveTab?.('novo-patd')}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20"
            >
              Novo PATD
            </button>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm relative z-30">
        <Filter size={16} className="text-slate-400 ml-2" />
        {canFilterAllDivisions ? (
          <FilterDropdown label="Divisão" value={filterDivisao} options={optionsDivisao} onChange={setFilterDivisao} />
        ) : (
          <div className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider shadow-sm opacity-80 cursor-not-allowed">
            Divisão: <span className="text-slate-700 dark:text-slate-200">{currentUser.divisao}</span>
          </div>
        )}
        <FilterDropdown label="Ano" value={filterAno} options={optionsAno} onChange={setFilterAno} />
        <FilterDropdown label="Status" value={filterStatus} options={optionsStatus} onChange={setFilterStatus} />
        <FilterDropdown label="Posto" value={filterPosto} options={optionsPosto} onChange={setFilterPosto} />
        <FilterDropdown label="Punição" value={filterPunicao} options={optionsPunicao} onChange={setFilterPunicao} />
        
        {(filterDivisao !== (canFilterAllDivisions ? '' : currentUser.divisao) || filterStatus || filterPosto || filterPunicao || filterAno) && (
          <button 
            onClick={() => { 
              setFilterDivisao(canFilterAllDivisions ? '' : currentUser.divisao); 
              setFilterStatus(''); 
              setFilterPosto(''); 
              setFilterPunicao(''); 
              setFilterAno(''); 
              onClearFilter?.();
            }}
            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors ml-auto h-10 px-4"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative group/table">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover/table:bg-indigo-500/10 transition-all duration-700" />
        
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-left">
                <th className="px-6 py-5 w-12 first:pl-8">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={displayedData.length > 0 && selectedIds.length === displayedData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(displayedData.map(p => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </div>
                </th>
                {[
                  { key: 'patdNumber', label: 'Nº PATD' },
                  { key: 'militar', label: 'Militar Arrolado' },
                  { key: 'posto', label: 'Posto' },
                  { key: 'divisao', label: 'Divisão' },
                  { key: 'dataInicio', label: 'Data de Início' },
                  { key: 'dataTermino', label: 'Data de Término' },
                  { key: 'boletim', label: 'Boletim' },
                  { key: 'status', label: 'Status' },
                  { key: 'punicao', label: 'Punição' },
                ].map((col) => (
                  <th 
                     key={col.key}
                     onClick={() => handleSort(col.key as keyof Process)}
                     className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors last:pr-8"
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <SortIcon column={col.key as keyof Process} />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 pr-8 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode='popLayout'>
                {displayedData.map((process, idx) => (
                  <motion.tr 
                    key={process.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedProcess(process);
                    }}
                    className="hover:bg-slate-50/80 dark:hover:bg-indigo-500/5 transition-all group/row cursor-pointer"
                  >
                    <td className="px-6 py-5 pl-8 w-12" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedIds.includes(process.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, process.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== process.id));
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{process.patdNumber}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{process.militar}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider">SARAM: {process.saram}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                          {process.posto}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 opacity-60">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{process.quadro}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{process.especialidade}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-500 shadow-sm overflow-hidden shrink-0">
                          {(() => {
                            const div = divisions.find(d => d.name === process.divisao);
                            if (div && div.image) {
                              return <img src={div.image} alt={div.name} className="w-full h-full object-cover object-center" />;
                            }
                            return <Building2 size={16} />;
                          })()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            {process.divisao}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                            {process.setor}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {new Date(process.dataInicio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {process.dataTermino ? new Date(process.dataTermino).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-900 dark:text-white uppercase">
                      {process.boletim || '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(process.status)}`}>
                        {getStatusIcon(process.status)}
                        {process.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {process.punicao}
                        </span>
                        {process.diasPunicao > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            {process.diasPunicao} dias de punição
                          </span>
                        )}
                        {process.punicao === 'Em Branco' && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                            Aguardando decisão
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                         {(((Array.isArray(process.documents) && process.documents.some((d: any) => d && (d.url || d.name))) || (typeof process.documents === 'string' && process.documents !== '[]' && process.documents.trim() !== '')) || (process.delegacaoDoc && process.delegacaoDoc.url)) && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner flex items-center justify-center shrink-0 cursor-help" title="Possui documentos inseridos">
                            <FileText size={14} />
                          </div>
                        )}
                        <button 
                          onClick={() => onEdit?.(process)}
                          className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700" 
                          title="Editar PATD"
                        >
                          <Edit2 size={16} />
                        </button>
                        {currentUser.role !== 'Apurador' && (
                          <button 
                            onClick={() => handleDelete(process)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700" 
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Loading Ref for Infinite Scroll */}
        {visibleItems < filteredAndSortedData.length && (
          <div ref={loadingRef} className="py-10 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border border-slate-100 dark:border-slate-800">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Nenhum processo encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">Não encontramos registros correspondentes à sua pesquisa ou filtros.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all"
            >
              Limpar Pesquisa
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Mostrando <span className="text-slate-900 dark:text-white">{displayedData.length}</span> de 
            <span className="text-slate-900 dark:text-white ml-1">{filteredAndSortedData.length}</span> resultados
          </p>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedProcess && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProcess(null)}
              className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-[70] p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative pointer-events-auto flex flex-col max-h-[85vh]">
                {/* Header Section */}
                <div className="p-8 pb-4 relative">
                  <div className="absolute top-0 left-0 right-0 h-32 bg-indigo-500/5 -z-10" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <FileText size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">Processo {selectedProcess.patdNumber}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(selectedProcess.status)}`}>
                            {getStatusIcon(selectedProcess.status)}
                            {selectedProcess.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Detalhes Completos do Procedimento</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedProcess(null)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
                  </div>

                  {/* Tab Title (Single now) */}
                  <div className="flex items-center gap-8 mt-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 relative">
                      Informações Gerais
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-10"
                  >
                    {/* Military Info Section */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Identificação do Militar
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome Completo</label>
                          <p className="text-sm font-bold text-slate-700 dark:text-white uppercase">{selectedProcess.militar}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">SARAM / Posto</label>
                          <p className="text-sm font-bold text-slate-700 dark:text-white uppercase">{selectedProcess.saram} - {selectedProcess.posto}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Divisão / Setor</label>
                          <p className="text-sm font-bold text-slate-700 dark:text-white uppercase">{selectedProcess.divisao} / {selectedProcess.setor}</p>
                        </div>
                      </div>
                    </section>

                    {/* Process details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <section>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Controle de Prazos
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Clock size={20} />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Início</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">{new Date(selectedProcess.dataInicio).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Término</p>
                              <p className="text-sm font-bold text-slate-700 dark:text-white">
                                {selectedProcess.dataTermino ? new Date(selectedProcess.dataTermino).toLocaleDateString('pt-BR') : 'Em Aberto'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Autoridades Responsáveis
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Apurador</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-white mt-1">{selectedProcess.apurador}</p>
                          </div>
                          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aplicador</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-white mt-1">{selectedProcess.aplicador}</p>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Summary Section */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Resumo do Fato
                      </h4>
                      <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 dark:border-indigo-500/20 text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed shadow-inner">
                        "{selectedProcess.resumoFato}"
                      </div>
                    </section>

                    {/* Sanction Details */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Punição Aplicada
                      </h4>
                      <div className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-rose-500 shadow-sm">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-700 dark:text-white leading-tight">{selectedProcess.punicao}</p>
                          {selectedProcess.diasPunicao > 0 ? (
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">{selectedProcess.diasPunicao} Dias de Punição</p>
                          ) : (
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">Sem dias de detenção/prisão</p>
                          )}
                        </div>
                      </div>
                    </section>
                  </motion.div>
                </div>

                {/* Footer Section */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Clock size={14} />
                    Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        onEdit?.(selectedProcess);
                        setSelectedProcess(null);
                      }}
                      className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                    >
                      Editar PATD
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {processToDelete && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProcessToDelete(null)}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[110] p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden pointer-events-auto">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">Confirmar Exclusão</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                    Tem certeza que deseja excluir o PATD <span className="font-bold text-slate-900 dark:text-white">{processToDelete.patdNumber}</span>? 
                    <br />Esta ação não poderá ser desfeita.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setProcessToDelete(null)}
                      className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-display"
                    >
                      Não, Cancelar
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="h-12 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all font-display"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BULK DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[110] p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden pointer-events-auto">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">Confirmar Exclusão em Massa</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                    Tem certeza que deseja excluir os <span className="font-bold text-slate-900 dark:text-white">{selectedIds.length}</span> processos selecionados? 
                    <br />Esta ação não poderá ser desfeita.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowBulkDeleteConfirm(false)}
                      className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-display"
                    >
                      Não, Cancelar
                    </button>
                    <button 
                      onClick={confirmBulkDelete}
                      className="h-12 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all font-display"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AUDIT MODAL */}
      <AnimatePresence>
        {isAuditOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuditOpen(false)}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl z-[110] p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                      <History size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Auditoria de Processos Excluídos</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Histórico completo de auditoria e exclusões do sistema</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAuditOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                  {isLoadingAudit ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Carregando dados da auditoria...</p>
                    </div>
                  ) : deletedProcesses.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 mx-auto mb-4">
                        <History size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Nenhum processo excluído foi encontrado para auditoria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-8">Nº PATD</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Militar</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Divisão</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Excluído por</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Exclusão</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pr-8 text-right">Histórico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {deletedProcesses.map((delProc) => (
                            <tr key={delProc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="px-6 py-4 pl-8 font-mono text-xs font-bold text-slate-900 dark:text-white">{delProc.patd_number}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{delProc.militar} <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-wider">SARAM: {delProc.saram}</span></td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{delProc.divisao}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">{delProc.deleted_by}</td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(delProc.deleted_at).toLocaleString('pt-BR')}</td>
                              <td className="px-6 py-4 pr-8 text-right">
                                <button 
                                  onClick={() => setSelectedDeletedProcess(delProc)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                >
                                  Ver Histórico
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer Section */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20">
                  <button 
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Nº PATD,Militar,Divisão,Excluído por,Data de Exclusão\n"
                        + deletedProcesses.map(p => `${p.process_data?.patdNumber || p.process_id},${p.process_data?.militar || 'Desconhecido'},${p.process_data?.divisao || 'Desconhecido'},${p.deleted_by_name},${new Date(p.deleted_at).toLocaleString('pt-BR')}`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "auditoria_processos_excluidos.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                  <button 
                    onClick={() => setIsAuditOpen(false)}
                    className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Fechar Auditoria
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SELECTED DELETED PROCESS HISTORY SUB-MODAL */}
      <AnimatePresence>
        {selectedDeletedProcess && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeletedProcess(null)}
              className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[130] p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden pointer-events-auto flex flex-col max-h-[75vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                      <History size={18} />
                    </div>
                    <div>
                      <h4 className="text-base font-display font-bold text-slate-900 dark:text-white">Histórico do Processo Excluído</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{selectedDeletedProcess.patd_number} - {selectedDeletedProcess.militar}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDeletedProcess(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* History Timeline */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                  {selectedDeletedProcess.history && selectedDeletedProcess.history.length > 0 ? (
                    <div className="relative border-l border-slate-100 dark:border-slate-800/80 ml-3.5 space-y-6">
                      {selectedDeletedProcess.history.map((item: any, idx: number) => (
                        <div key={idx} className="relative pl-6 group">
                          {/* Dot Indicator */}
                          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover:bg-indigo-500 transition-all duration-300" />
                          <div className="flex flex-col bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-800/80 transition-all">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{item.field || 'Alteração'}</span>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{item.date}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed mb-2">
                              {item.oldValue === '—' || !item.oldValue ? (
                                <span className="text-emerald-600 dark:text-emerald-400">{item.newValue}</span>
                              ) : (
                                <>
                                  De <span className="line-through text-slate-400 dark:text-slate-500 font-medium">{item.oldValue}</span> para <span className="text-slate-900 dark:text-white">{item.newValue}</span>
                                </>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              <User size={10} />
                              USUÁRIO: {item.user}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400">Nenhum histórico registrado para este processo.</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/30 dark:bg-slate-800/20">
                  <button 
                    onClick={() => setSelectedDeletedProcess(null)}
                    className="h-10 px-5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BulkImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        currentUser={currentUser} 
        divisions={divisions} 
        onImportSuccess={(newProcesses) => {
          setProcesses(newProcesses);
          setIsImportOpen(false);
        }} 
      />

      {/* Decorative Background Accents */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] -z-10" />
    </div>
  );
}
