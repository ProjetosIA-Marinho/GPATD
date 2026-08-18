import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart as BarChartIcon, 
  Calendar, 
  Download, 
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  User,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  ChevronDown
} from 'lucide-react';
import { Process } from './Processes';
import { isSameDivision } from '../../utils/divisionUtils';
import Pagination, { PageSizeOption } from '../common/Pagination';

const FilterDropdown = ({ label, value, options, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (val: string) => {
    setIsOpen(false);
    onChange(val);
  };
  
  return (
    <div className="relative flex-1 min-w-[140px]">
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border border-slate-200/80 dark:border-slate-800/80 hover:bg-white/60 dark:hover:bg-slate-950/50 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all group"
      >
        <span className="truncate">{value || `Todos ${label}s`}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute left-0 right-0 top-full mt-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/50 ${!value ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Todos {label}s
              </button>
              {options.map((opt: string) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/50 ${value === opt ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30' : 'text-slate-700 dark:text-slate-300'}`}
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

export interface ReportsProps {
  processes: Process[];
  globalSearchTerm?: string;
  currentUser: any;
}

export default function Reports({ processes, globalSearchTerm = '', currentUser }: ReportsProps) {
  const canFilterAllDivisions = currentUser.role === 'Administrador' || currentUser.role === 'Visualizador';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivisao, setFilterDivisao] = useState(canFilterAllDivisions ? '' : currentUser.divisao);
  const [filterAno, setFilterAno] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosto, setFilterPosto] = useState('');
  const [filterPunicao, setFilterPunicao] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDivisao, filterAno, filterStatus, filterPosto, filterPunicao, startDate, endDate]);

  const visibleProcesses = useMemo(() => {
    if (currentUser?.role === 'Apurador') {
      const activeSaram = currentUser.saram;
      const activeName = currentUser.name?.toLowerCase() || '';
      return processes.filter(p => {
        const matchesSaram = p.apuradorSaram && p.apuradorSaram === activeSaram;
        const matchesName = p.apurador && p.apurador.toLowerCase().includes(activeName);
        return matchesSaram || matchesName;
      });
    }
    if (canFilterAllDivisions) return processes;
    return processes.filter(p => isSameDivision(p.divisao, currentUser.divisao));
  }, [processes, canFilterAllDivisions, currentUser]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = visibleProcesses.length;
    const completed = visibleProcesses.filter(p => p.status === 'Concluído').length;
    const inProgress = visibleProcesses.filter(p => p.status === 'Em Andamento').length;
    const suspended = visibleProcesses.filter(p => p.status === 'Suspenso').length;
    
    return [
      { label: 'Total de PATDs', value: total, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
      { label: 'Concluídos', value: completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Em Andamento', value: inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Suspensos', value: suspended, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    ];
  }, [visibleProcesses]);

  const filterOptions = useMemo(() => ({
    divisoes: Array.from(new Set(visibleProcesses.map(p => p.divisao))).sort(),
    anos: (Array.from(new Set(visibleProcesses.map(p => new Date(p.dataInicio).getFullYear().toString()))) as string[]).sort((a, b) => b.localeCompare(a)),
    status: Array.from(new Set(visibleProcesses.map(p => p.status))).sort(),
    postos: Array.from(new Set(visibleProcesses.map(p => p.posto))).sort(),
    punicoes: Array.from(new Set(visibleProcesses.map(p => p.punicao))).filter(Boolean).sort() as string[],
  }), [visibleProcesses]);

  // Filtered Logic
  const filteredProcesses = useMemo(() => {
    return visibleProcesses.filter(p => {
      const pAno = new Date(p.dataInicio).getFullYear().toString();
      const pDate = new Date(p.dataInicio).getTime();
      const start = startDate ? new Date(startDate).getTime() : null;
      const end = endDate ? new Date(endDate).getTime() : null;

      const effectiveSearch = globalSearchTerm || searchTerm;

      return (
        (effectiveSearch === '' || p.patdNumber.toLowerCase().includes(effectiveSearch.toLowerCase()) || p.militar.toLowerCase().includes(effectiveSearch.toLowerCase())) &&
        (filterDivisao === '' || isSameDivision(p.divisao, filterDivisao)) &&
        (filterAno === '' || pAno === filterAno) &&
        (filterStatus === '' || p.status === filterStatus) &&
        (filterPosto === '' || p.posto === filterPosto) &&
        (filterPunicao === '' || p.punicao === filterPunicao) &&
        (!start || pDate >= start) &&
        (!end || pDate <= end)
      );
    });
  }, [visibleProcesses, searchTerm, globalSearchTerm, filterDivisao, filterAno, filterStatus, filterPosto, filterPunicao, startDate, endDate]);

  const displayedProcesses = useMemo(() => {
    if (pageSize === 'all') return filteredProcesses;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredProcesses.slice(start, start + (pageSize as number));
  }, [filteredProcesses, currentPage, pageSize]);

  const getStatusStyle = (status: Process['status']) => {
    switch (status) {
      case 'Em Andamento': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Concluído': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Suspenso': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const clearFilters = () => {
    setFilterDivisao(canFilterAllDivisions ? '' : currentUser.divisao);
    setFilterAno('');
    setFilterStatus('');
    setFilterPosto('');
    setFilterPunicao('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = [
      'Nº PATD', 'Militar Arrolado', 'SARAM', 'Posto', 'Quadro', 'Especialidade', 'Divisão', 'Setor',
      'Data de Início', 'Data de Término', 'Status', 'Punição', 'Dias Punição', 'Data Punição', 
      'Boletim', 'Grade', 'Apurador', 'Aplicador', 'Resumo Fato', 'Observações'
    ];

    const rows = filteredProcesses.map(p => [
      p.patdNumber, 
      `"${(p.militar || '').replace(/"/g, '""')}"`, 
      p.saram, 
      p.posto, 
      p.quadro, 
      p.especialidade, 
      `"${(p.divisao || '').replace(/"/g, '""')}"`, 
      `"${(p.setor || '').replace(/"/g, '""')}"`,
      p.dataInicio ? new Date(p.dataInicio).toLocaleDateString('pt-BR') : '',
      p.dataTermino ? new Date(p.dataTermino).toLocaleDateString('pt-BR') : '',
      p.status,
      p.punicao,
      p.diasPunicao || 0,
      p.dataPunicao ? new Date(p.dataPunicao).toLocaleDateString('pt-BR') : '',
      `"${(p.boletim || '').replace(/"/g, '""')}"`,
      `"${(p.nGrade || '').replace(/"/g, '""')}"`,
      `"${(p.apurador || '').replace(/"/g, '""')}"`,
      `"${(p.aplicador || '').replace(/"/g, '""')}"`,
      `"${(p.resumoFato || '').replace(/"/g, '""')}"`,
      `"${(p.observacoes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_patd_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 pb-20 print:pb-0 print:space-y-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Relatórios e Listagem</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gere relatórios detalhados com filtros avançados de processos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={exportToCSV}
            className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95 shrink-0 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <FileText size={18} />
            Exportar CSV
          </button>
          <button 
            onClick={() => setShowPreview(true)}
            className="h-11 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95 shrink-0 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </header>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 print:static print:inset-auto print:bg-transparent print:backdrop-blur-none print:p-0"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-5xl h-full overflow-hidden rounded-3xl shadow-2xl flex flex-col print:shadow-none print:overflow-visible print:h-auto print:w-auto print:max-w-none print:block print:rounded-none"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <FileText size={18} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 dark:text-white">Pré-visualização do Relatório</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="h-10 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <Download size={16} /> Imprimir / PDF
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-slate-200 dark:bg-slate-950 custom-scrollbar print:p-0 print:overflow-visible print:bg-transparent print:block">
                {/* Visual A4 Page Landscape */}
                <style>{`
                  @media print { 
                    @page { size: landscape; margin: 0; } 
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                    /* Hide sidebar and other app elements */
                    #settings-view, nav, aside, .print\\:hidden { display: none !important; }
                    body * { visibility: hidden; }
                    #report-content, #report-content * { visibility: visible; }
                    #report-content { position: absolute; left: 0; top: 0; width: 100vw; margin: 0 !important; }
                  }
                `}</style>
                <div className="mx-auto bg-white text-slate-900 w-[297mm] min-h-[210mm] shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col print:shadow-none print:m-0" id="report-content">
                  {/* Document Header */}
                  <div className="bg-[#283655] text-white pt-8 pb-4 px-10 flex flex-col relative w-full h-[140px] shrink-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="AFA Logo" className="w-12 h-14 object-contain" />
                        <div className="flex flex-col mt-1">
                          <h1 className="text-xl font-black uppercase tracking-wide leading-tight" style={{ fontFamily: 'Arial' }}>ACADEMIA DA FORÇA AÉREA</h1>
                          <h2 className="text-[11px] uppercase tracking-[0.15em] text-slate-300 leading-tight" style={{ fontFamily: 'Arial' }}>COMANDO DA AFA</h2>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-3 mt-1">
                        <div className="leading-tight">
                          <p className="text-[11px] font-bold">Data do Relatório</p>
                          <p className="text-[9px] text-slate-300 font-medium">{new Date().toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="leading-tight">
                          <p className="text-[11px] font-bold">Perfil</p>
                          <p className="text-[9px] text-slate-300 uppercase font-medium">{currentUser.posto} {currentUser.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 w-full left-0 text-center">
                      <h2 className="text-2xl font-black uppercase tracking-wider" style={{ fontFamily: 'Arial' }}>RELATÓRIO DE PATD</h2>
                    </div>
                  </div>

                  {/* Document Content Table */}
                  <div className="flex-1 w-full flex flex-col">
                    <table className="w-full text-[8px] border-collapse" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap w-24">NO. PATD</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Divisão</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Posto</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Militar Arrolado</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Resumo do Fato</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Autoridades</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Status</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Datas</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Punição</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Boletim</th>
                          <th className="py-3 px-3 text-left font-black uppercase whitespace-nowrap">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProcesses.map((p, index) => {
                          const setorAbbr = p.setor && p.setor.startsWith('Seção') 
                            ? p.setor.replace('Seção', 'Sec') 
                            : p.setor;
                            
                          return (
                            <tr key={p.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-100/60"}>
                              <td className="py-4 px-3 font-bold whitespace-nowrap align-top">{p.patdNumber}</td>
                              <td className="py-4 px-3 align-top">
                                <div className="flex flex-col leading-tight gap-1">
                                  <span className="font-bold uppercase text-[9px]">{p.divisao}</span>
                                  <span className="text-[7px] text-slate-500">{setorAbbr}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top">
                                <div className="flex flex-col leading-tight gap-0.5">
                                  <span className="font-bold text-[9px]">{p.posto}</span>
                                  <span className="text-[7px] text-slate-600">{p.quadro}</span>
                                  <span className="text-[7px] text-slate-600">{p.especialidade}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[120px]">
                                <div className="flex flex-col leading-tight gap-1">
                                  <span className="font-bold uppercase text-[9px]">{p.militar}</span>
                                  <span className="text-[7px] text-slate-500 uppercase tracking-wider">SARAM: {p.saram}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[180px]">
                                <p className="leading-snug text-slate-800 font-medium">{p.resumoFato}</p>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[100px]">
                                <div className="flex flex-col gap-2">
                                  <div>
                                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Apurador</p>
                                    <p className="font-bold uppercase text-[8px]">{p.apurador}</p>
                                  </div>
                                  <div>
                                    <p className="text-[6px] text-slate-500 uppercase tracking-widest font-bold">Aplicador</p>
                                    <p className="font-bold uppercase text-[8px]">{p.aplicador}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top font-black uppercase text-[8px]">
                                {p.status}
                              </td>
                              <td className="py-4 px-3 align-top min-w-[80px]">
                                <div className="flex flex-col gap-1.5 text-[7px]">
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-slate-500 uppercase">Início</span>
                                    <span className="font-bold">{new Date(p.dataInicio).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-slate-500 uppercase">Término</span>
                                    <span className="font-bold">{p.dataTermino ? new Date(p.dataTermino).toLocaleDateString('pt-BR') : '--'}</span>
                                  </div>
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-slate-500 uppercase">Punição</span>
                                    <span className="font-bold">{p.dataPunicao ? new Date(p.dataPunicao).toLocaleDateString('pt-BR') : '--'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[70px]">
                                <div className="flex flex-col">
                                  <span className="font-bold uppercase text-[8px] mb-1">{p.punicao || '--'}</span>
                                  {p.diasPunicao > 0 && <span className="text-[7px] font-bold text-slate-600">{p.diasPunicao} DIAS</span>}
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[70px]">
                                <div className="flex flex-col leading-tight gap-1">
                                  <span className="font-bold uppercase text-[8px]">{p.boletim || '--'}</span>
                                  <span className="text-[7px] text-slate-500 uppercase">Grade: {p.nGrade || '--'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-3 align-top min-w-[120px]">
                                <p className="leading-snug text-slate-800 font-medium">{p.observacoes || '--'}</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel - Always Visible */}
      <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          {/* Main Filters Group */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-3 bg-indigo-500 rounded-full" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Categóricos</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canFilterAllDivisions ? (
                <FilterDropdown 
                  label="Divisão" 
                  value={filterDivisao} 
                  options={filterOptions.divisoes} 
                  onChange={setFilterDivisao} 
                />
              ) : (
                <div className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider shadow-sm opacity-80 cursor-not-allowed">
                  Divisão: <span className="text-slate-700 dark:text-slate-200">{currentUser.divisao}</span>
                </div>
              )}
              <FilterDropdown 
                label="Ano" 
                value={filterAno} 
                options={filterOptions.anos} 
                onChange={setFilterAno} 
              />
              <FilterDropdown 
                label="Status" 
                value={filterStatus} 
                options={filterOptions.status} 
                onChange={setFilterStatus} 
              />
              <FilterDropdown 
                label="Posto" 
                value={filterPosto} 
                options={filterOptions.postos} 
                onChange={setFilterPosto} 
              />
              <FilterDropdown 
                label="Punição" 
                value={filterPunicao} 
                options={filterOptions.punicoes} 
                onChange={setFilterPunicao} 
              />
            </div>
          </div>

          {/* Temporal Group */}
          <div className="space-y-4 pt-6 xl:pt-0 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 xl:pl-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-indigo-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intervalo Temporal</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all focus-within:border-indigo-500 group">
                <span className="text-[10px] font-black text-slate-400 uppercase">De</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none outline-hidden text-[10px] font-bold text-slate-700 dark:text-slate-200 p-0 w-28 uppercase"
                />
              </div>

              <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all focus-within:border-indigo-500 group">
                <span className="text-[10px] font-black text-slate-400 uppercase">Até</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none outline-hidden text-[10px] font-bold text-slate-700 dark:text-slate-200 p-0 w-28 uppercase"
                />
              </div>

              {(filterDivisao || filterAno || filterStatus || filterPosto || filterPunicao || startDate || endDate) && (
                <button 
                  onClick={clearFilters}
                  className="h-10 px-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30"
                  title="Limpar todos os filtros"
                >
                  <X size={14} />
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group"
          >
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${stat.bg} blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 relative z-10`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 relative z-10">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Process List */}
      <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Resultados do Relatório</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredProcesses.length} PATDs encontradas</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Nº PATD</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Divisão</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Posto</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Militar</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Resumo do Fato</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Responsáveis</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Data de Início</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Data de Término</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Punição</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Data Punição</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Boletim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {displayedProcesses.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{p.patdNumber}</span>
                  </td>
                  <td className="py-4 px-4">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{p.divisao}</span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{p.setor}</span>
                     </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase border border-slate-200 dark:border-slate-700 w-fit">
                        {p.posto}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">{p.especialidade}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-tight">{p.militar}</span>
                       <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">SARAM: {p.saram}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 max-w-[200px]">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-tight">
                      {p.resumoFato}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Apurador:</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-none">{p.apurador}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Aplicador:</span>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-none">{p.aplicador}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {new Date(p.dataInicio).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {p.dataTermino ? new Date(p.dataTermino).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${getStatusStyle(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {p.punicao ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-rose-500">
                          <ShieldAlert size={14} />
                          <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{p.punicao}</span>
                        </div>
                        {p.diasPunicao > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 whitespace-nowrap">
                            {p.diasPunicao} dias de punição
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {p.dataPunicao ? new Date(p.dataPunicao).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-4 px-4 text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase whitespace-nowrap">
                    {p.boletim || '—'}
                  </td>
                </tr>
              ))}
              {filteredProcesses.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FileText size={40} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest">Nenhum processo encontrado para os filtros selecionados</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredProcesses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="mt-6 rounded-2xl"
        />
      </div>
    </div>
  );
}
