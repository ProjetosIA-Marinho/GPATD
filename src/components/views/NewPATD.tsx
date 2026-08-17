import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  FileText, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Save, 
  Trash2, 
  Eraser, 
  History, 
  FilePlus,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2, 
  X, 
  History as HistoryIcon, 
  Download,
  Printer,
  FileUp,
  UploadCloud,
  File,
  Search
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Division } from './Divisions';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { isSameDivision } from '../../utils/divisionUtils';

const InputField = ({ label, icon: Icon, value, onChange, placeholder, disabled = false, type = "text", error, onBlur }: any) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/80 transition-all group-focus-within:text-indigo-500 group-focus-within:scale-110 z-10">
        <Icon size={16} />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800/80'} focus:bg-white/60 dark:focus:bg-slate-950/50 focus:outline-hidden focus:ring-4 ${error ? 'focus:ring-rose-100/30 dark:focus:ring-rose-900/20' : 'focus:ring-indigo-500/10'} focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium tracking-tight relative z-0`}
      />
      {/* Futuristic Background Glow */}
      <div className="absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500/0 via-indigo-500/0 to-purple-500/0 group-focus-within:from-indigo-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-700 -z-10 shadow-inner group-focus-within:shadow-indigo-500/5" />
      
      {/* Corner Brackets (Futuristic UI vibe) */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 group-focus-within:border-indigo-500 transition-colors rounded-tl-sm" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 group-focus-within:border-indigo-500 transition-colors rounded-br-sm" />
    </div>
    {error && (
      <motion.p 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-pulse tracking-wide uppercase"
      >
        {error}
      </motion.p>
    )}
  </div>
);

const AutocompleteInputField = ({ label, icon: Icon, value, onChange, placeholder, disabled = false, type = "text", error, fieldName, onBlur, onSearch }: any) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load options from localStorage (scoped per logged user email if available)
  useEffect(() => {
    const userEmail = localStorage.getItem('logged_user_email') || 'anonymous';
    const key = `patd_field_memory_${userEmail}_${fieldName}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setSuggestions(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error parsing autocomplete options:', e);
    }
  }, [fieldName, showDropdown]);

  // Filter options when value changes
  useEffect(() => {
    const stringVal = value !== undefined && value !== null ? String(value) : '';
    if (!stringVal) {
      setFilteredSuggestions(suggestions);
    } else {
      const lowVal = stringVal.toLowerCase();
      setFilteredSuggestions(
        suggestions.filter((opt) => opt.toLowerCase().includes(lowVal) && opt.toLowerCase() !== lowVal)
      );
    }
  }, [value, suggestions]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange({ target: { value: val } });
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="space-y-1.5 flex-1 relative">
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative group flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/80 transition-all group-focus-within:text-indigo-500 group-focus-within:scale-110 z-10">
            <Icon size={16} />
          </div>
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full h-11 pl-10 pr-4 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800/80'} focus:bg-white/60 dark:focus:bg-slate-950/50 focus:outline-hidden focus:ring-4 ${error ? 'focus:ring-rose-100/30 dark:focus:ring-rose-900/20' : 'focus:ring-indigo-500/10'} focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium tracking-tight relative z-0`}
          />
          {/* Futuristic Background Glow */}
          <div className="absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500/0 via-indigo-500/0 to-purple-500/0 group-focus-within:from-indigo-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-700 -z-10 shadow-inner group-focus-within:shadow-indigo-500/5" />
          
          {/* Corner Brackets (Futuristic UI vibe) */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 group-focus-within:border-indigo-500 transition-colors rounded-tl-sm" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 group-focus-within:border-indigo-500 transition-colors rounded-br-sm" />
        </div>
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            disabled={disabled || !value}
            className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-800/50 text-white disabled:text-slate-500 transition-all flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
            title="Buscar militar no efetivo"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 p-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto custom-scrollbar"
          >
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-3 py-2 text-left text-xs font-semibold rounded-lg hover:bg-indigo-500 hover:text-white text-slate-700 dark:text-slate-300 dark:hover:bg-indigo-700 transition-all block"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-pulse tracking-wide uppercase"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

const DatePickerField = ({ label, value, onChange, error }: any) => {
  return (
    <div className="space-y-1.5 flex-1 min-w-[140px] relative">
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group/picker">
        <input
          type="date"
          value={value || ''}
          onChange={onChange}
          className={`w-full h-11 px-4 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800/80'} focus:bg-white/60 dark:focus:bg-slate-950/50 focus:outline-hidden focus:ring-4 ${error ? 'focus:ring-rose-100/30 dark:focus:ring-rose-900/20' : 'focus:ring-indigo-500/10'} focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white font-medium relative z-10 dark:[color-scheme:dark]`}
        />
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-200 dark:border-slate-800 group-focus-within/picker:border-indigo-500 transition-colors rounded-tl-sm z-0" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-200 dark:border-slate-800 group-focus-within/picker:border-indigo-500 transition-colors rounded-br-sm z-0" />
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-pulse tracking-wide uppercase"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

const SelectField = ({ label, icon: Icon, value, onChange, options, placeholder = "Selecionar", direction = "down", disabled = false }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className={`space-y-1.5 flex-1 relative ${isOpen ? 'z-50' : ''}`}>
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full h-11 pl-10 pr-10 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border border-slate-200 dark:border-slate-800/80 focus:bg-white/60 dark:focus:bg-slate-950/50 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white text-left font-medium relative z-20 flex items-center overflow-hidden ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/80 group-focus-within:text-indigo-500">
            <Icon size={16} />
          </div>
          <span className={`truncate block w-full pr-2 ${!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/60 transition-transform duration-300 flex items-center ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20" 
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
                          onChange({ target: { value: opt.value } });
                        }}
                        className={`
                          relative w-full px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 group/item rounded-lg mb-0.5 last:mb-0
                          ${isSelected 
                            ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }
                        `}
                      >
                        {/* Curved accent from image */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-full" />
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
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

        {/* Decorative corner accents from before */}
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-indigo-500/0 group-focus-within:border-indigo-500 transition-all duration-500 rounded-tr-md pointer-events-none" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-indigo-500/0 group-focus-within:border-indigo-500 transition-all duration-500 rounded-bl-md pointer-events-none" />
      </div>
    </div>
  );
};

const TextAreaField = ({ label, icon: Icon, value, onChange, placeholder }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-4 text-slate-400 dark:text-white/80 transition-all group-focus-within:text-indigo-500 group-focus-within:scale-110">
          <Icon size={16} />
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl bg-white/40 dark:bg-slate-950/30 backdrop-blur-3xl border border-slate-200 dark:border-slate-800/80 focus:bg-white/60 dark:focus:bg-slate-950/50 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none font-medium`}
      />
      {/* Corner accent for textarea */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-indigo-500/0 group-focus-within:border-indigo-500/40 transition-all duration-300" />
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-6">
    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>
  </div>
);

const HistoryModal = ({ isOpen, onClose, historyData }: { isOpen: boolean, onClose: () => void, historyData: any[] }) => {
  const downloadHistory = () => {
    if (!historyData || historyData.length === 0) {
      alert('Não há histórico para exportar.');
      return;
    }
    const header = "HISTÓRICO DE ALTERAÇÕES - GPATD\n" +
                   `Exportado em: ${new Date().toLocaleString('pt-BR')}\n` +
                   "==================================================\n\n";
    const content = historyData.map((item, idx) => {
      return `[${idx + 1}] Campo: ${item.field}\n` +
             `Data: ${item.date}\n` +
             `Valor Anterior: ${item.oldValue || '—'}\n` +
             `Novo Valor: ${item.newValue || '—'}\n` +
             `Usuário: ${item.user}\n` +
             "--------------------------------------------------";
    }).join('\n\n');
    
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_alteracoes_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Histórico de Alterações</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Trilha de auditoria do processo</p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {historyData.map((item, idx) => (
                  <div key={idx} className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                        {item.field}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {item.date}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Valor Anterior</p>
                        <p className="text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700 break-words">{item.oldValue || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Novo Valor</p>
                        <p className="text-slate-900 dark:text-white font-medium break-words">{item.newValue}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <User size={10} />
                      USUÁRIO: {item.user}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={downloadHistory}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <Download size={16} /> Exportar
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ImportModal = ({ isOpen, onClose, data, onSelect, onSelectMultiple }: { isOpen: boolean, onClose: () => void, data: any[], onSelect: (selected: any) => void, onSelectMultiple: (selected: any[]) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdxs, setSelectedIdxs] = useState<Record<number, boolean>>({});
  
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    const low = searchTerm.toLowerCase();
    return data.filter(item => 
      (item.nomeCompleto || '').toLowerCase().includes(low) ||
      (item.saram || '').toLowerCase().includes(low) ||
      (item.patdNumber || '').toLowerCase().includes(low)
    );
  }, [data, searchTerm]);

  const selectedCount = Object.keys(selectedIdxs).length;

  const handleBulkImportClick = () => {
    const selectedRows = filtered.filter((_, idx) => selectedIdxs[idx]);
    if (selectedRows.length === 0) {
      alert('Nenhum registro selecionado.');
      return;
    }
    onSelectMultiple(selectedRows);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] z-10"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Selecionar Registro</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Encontramos {data.length} linhas na planilha. Escolha uma para carregar ou selecione várias para importar em lote:
                </p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, SARAM ou PATD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-4 w-12 text-center">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={filtered.length > 0 && filtered.every((_, i) => selectedIdxs[i])}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSel: Record<number, boolean> = {};
                              filtered.forEach((_, i) => { newSel[i] = true; });
                              setSelectedIdxs(newSel);
                            } else {
                              setSelectedIdxs({});
                            }
                          }}
                        />
                      </th>
                      <th className="px-5 py-4">Nº PATD</th>
                      <th className="px-5 py-4">Militar</th>
                      <th className="px-5 py-4">Posto/Quadro</th>
                      <th className="px-5 py-4">Fato</th>
                      <th className="px-5 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    {filtered.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer ${selectedIdxs[idx] ? 'bg-indigo-500/5' : ''}`}
                        onClick={() => onSelect(row)}
                      >
                        <td className="px-5 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={!!selectedIdxs[idx]}
                            onChange={(e) => {
                              setSelectedIdxs(prev => {
                                const next = { ...prev };
                                if (e.target.checked) {
                                  next[idx] = true;
                                } else {
                                  delete next[idx];
                                }
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                          {row.patdNumber || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{row.nomeCompleto || 'Sem Nome'}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">SARAM: {row.saram || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                            {row.posto || '—'} {row.quadro || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 max-w-xs truncate">
                          {row.resumoFato || '—'}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelect(row)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10"
                          >
                            Selecionar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          Nenhum registro encontrado correspondente à pesquisa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between shrink-0">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              
              {selectedCount > 0 && (
                <button 
                  onClick={handleBulkImportClick}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Importar Lote ({selectedCount})
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function NewPATD({ initialData, onSave, divisions = [], currentUser, processes = [] }: { initialData?: any, onSave?: (data: any) => void, divisions?: Division[], currentUser?: any, processes?: any[] }) {
  const currentYear = new Date().getFullYear();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'capa' | 'delegacao' | 'despacho' | 'fatd'>('capa');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [seqTrigger, setSeqTrigger] = useState(0);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Spreadsheet import states & ref
  const [multipleRowsData, setMultipleRowsData] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const [libraryDocs, setLibraryDocs] = useState<any[]>([]);
  const [isPreviewMailOpen, setIsPreviewMailOpen] = useState(false);
  const [previewMailData, setPreviewMailData] = useState<any>(null);

  useEffect(() => {
    const fetchLibraryDocs = async () => {
      try {
        const { data, error } = await supabase.from('documents').select('*');
        if (data) {
          const filtered = data.filter(d => 
            d.name.toLowerCase().includes('portaria') || 
            d.name.toLowerCase().includes('delega')
          );
          setLibraryDocs(filtered);
        }
      } catch (err) {
        console.error('Error fetching library docs:', err);
      }
    };
    fetchLibraryDocs();
  }, []);
  
  const [formData, setFormData] = useState<any>({
    patdNumber: `001/DIV/${currentYear}`,
    posto: '1T',
    quadro: 'QOINT',
    saram: '',
    nomeCompleto: '',
    especialidade: '',
    divisao: currentUser && currentUser.role !== 'Administrador' && currentUser.divisao ? currentUser.divisao : 'DOA',
    setor: '',
    apurador: currentUser && currentUser.role === 'Apurador' ? currentUser.name : '',
    apuradorPosto: currentUser && currentUser.role === 'Apurador' ? currentUser.posto : '1T',
    apuradorQuadro: currentUser && currentUser.role === 'Apurador' ? currentUser.quadro : 'QOINT',
    apuradorSaram: currentUser && currentUser.role === 'Apurador' ? currentUser.saram : '',
    aplicador: '',
    aplicadorPosto: 'TC',
    aplicadorQuadro: 'QOAV',
    aplicadorCargo: '',
    oficioNumero: '',
    protComaer: '',
    dataOficio: '',
    enquadramentoRdaer: '',
    resumoFato: '',
    dataInicio: '',
    dataTermino: '',
    status: 'Em Andamento',
    punicao: 'Em Branco',
    qtdDias: '0',
    dataPunicao: '',
    resumoPunicao: '',
    nGrade: '',
    boletim: '',
    observacoes: '',
    documents: [],
    delegacaoDoc: null,
    sigadSecprom: '',
    docArquivado: false
  });

  const printDocument = async (type: string) => {
    if (type === 'delegacao') {
      if (formData.delegacaoDoc) {
        const isPng = formData.delegacaoDoc.name?.toLowerCase().endsWith('.png') || formData.delegacaoDoc.url?.toLowerCase().endsWith('.png');
        const isPdf = formData.delegacaoDoc.name?.toLowerCase().endsWith('.pdf') || formData.delegacaoDoc.url?.toLowerCase().endsWith('.pdf');
        
        if (isPng) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Portaria de Delegação</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      background-color: #ffffff;
                    }
                    .page-container {
                      position: relative;
                      width: 210mm;
                      height: 297mm;
                      box-sizing: border-box;
                    }
                    .doc-image {
                      width: 100%;
                      height: 100%;
                      object-fit: contain;
                    }
                    .stamp-image {
                      position: absolute;
                      top: 10mm;
                      right: 10mm;
                      width: 65mm;
                      height: 46mm;
                      z-index: 10;
                    }
                    @media print {
                      @page {
                        size: A4;
                        margin: 0;
                      }
                      body {
                        margin: 0;
                        padding: 0;
                      }
                      .page-container {
                        width: 210mm;
                        height: 297mm;
                        page-break-after: always;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div class="page-container">
                    <img class="doc-image" src="${formData.delegacaoDoc.url}" />
                    <img class="stamp-image" src="${window.location.origin}/sinete.png" />
                  </div>
                  <script>
                    window.onload = function() {
                      window.print();
                      setTimeout(function() {
                        window.close();
                      }, 1000);
                    }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          }
          return;
        } else if (isPdf) {
          try {
            const response = await fetch(formData.delegacaoDoc.url);
            const pdfBytes = await response.arrayBuffer();

            const stampResponse = await fetch('/sinete.png');
            const stampBytes = await stampResponse.arrayBuffer();

            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const stampImg = await pdfDoc.embedPng(stampBytes);

            const pages = pdfDoc.getPages();
            pages.forEach((page, index) => {
              const { width, height } = page.getSize();
              
              if (index === 0) {
                // Folha 1: Proporção original (65mm x 46mm)
                const stampWidth = 184.3;
                const stampHeight = 184.3 * (723 / 1024);
                
                page.drawImage(stampImg, {
                  x: width - stampWidth - 14.17,
                  y: height - stampHeight - 14.17,
                  width: stampWidth,
                  height: stampHeight,
                });
              } else {
                // Folha 2+: Tamanho menor para caber nos espaços em branco sem sobreposição
                const stampWidth = 150.0;
                const stampHeight = 150.0 * (723 / 1024);
                
                page.drawImage(stampImg, {
                  x: width - stampWidth + 25.0,
                  y: height - stampHeight + 15.0,
                  width: stampWidth,
                  height: stampHeight,
                });
              }
            });

            const stampedPdfBytes = await pdfDoc.save();
            const blob = new Blob([stampedPdfBytes], { type: 'application/pdf' });
            const stampedUrl = URL.createObjectURL(blob);
            window.open(stampedUrl, '_blank');
          } catch (error) {
            console.error('Erro ao inserir carimbo no PDF:', error);
            window.open(formData.delegacaoDoc.url, '_blank');
          }
          return;
        }
        
        window.open(formData.delegacaoDoc.url, '_blank');
      } else {
        alert('Nenhuma Portaria de Delegação anexada para imprimir.');
      }
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return '___/___/_____';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const getDocHTML = () => {
      switch(type) {
        case 'capa':
          return `
            <div class="sheet capa font-serif" style="padding: 15mm 20mm 15mm 20mm !important;">
              <!-- Outside the bordered frame -->
              <div class="capa-header text-center" style="margin-bottom: 8mm !important;">
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo C - Capa</p>
                <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
                <p class="text-red" style="font-size: 12px; margin: 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
              </div>

              <!-- Bordered Frame -->
              <div class="capa-frame">
                <!-- Top Emblem and Headers -->
                <div class="w-full text-center flex flex-col items-center">
                  <img src="${window.location.origin}/brasao.png" width="75" height="75" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
                  <p style="font-size: 16px; font-weight: bold; color: #000000; margin: 0 0 4px 0; text-transform: uppercase;">Ministério da Defesa</p>
                  <p style="font-size: 16px; font-weight: bold; color: #000000; margin: 0 0 4px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
                  <p class="text-black underline" style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
                </div>

                <!-- Process Title -->
                <div class="w-full text-center" style="margin-top: 12mm; margin-bottom: 12mm;">
                  <p style="font-size: 13px; font-weight: bold; color: #000000; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">PROCESSO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</p>
                  <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0;">Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span></p>
                </div>

                <!-- Footer/Sections inside Frame -->
                <div class="w-full" style="margin-bottom: 5mm;">
                  <!-- Militar Arrolado -->
                  <div class="text-center" style="margin-bottom: 15mm;">
                    <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Militar Arrolado</p>
                    <p class="text-black" style="font-size: 15px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro}</p>
                    <div class="line-accent" style="margin-top: 5px !important;"></div>
                  </div>

                  <!-- Oficial Apurador -->
                  <div class="text-center">
                    <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Oficial Apurador</p>
                    <p class="text-black" style="font-size: 15px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
                    <div class="line-accent" style="margin-top: 5px !important;"></div>
                  </div>
                </div>
              </div>
            </div>
          `;
        case 'despacho':
          return `
            <div class="sheet despacho font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; position: relative;">
              <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
              <!-- Header inside the printable sheet -->
              <div class="text-center font-bold" style="margin-bottom: 2mm;">
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo B - Despacho de Abertura e Designação de Apurador</p>
                <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
              </div>

              <!-- Top Emblem and Headers -->
              <div class="w-full text-center flex flex-col items-center" style="margin-bottom: 25px;">
                <img src="${window.location.origin}/brasao.png" width="65" height="65" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Ministério da Defesa</p>
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
                <p class="text-black underline" style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
              </div>

              <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6;">
                <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
                  Considerando o disposto no art. 1º da Portaria nº 853/SIJ, de 27 de abril de 2026, publicada no Boletim Interno Ostensivo n º 75, de 29 de abril de 2026, que designa oficiais para apurar transgressão disciplinar e autoridades para aplicar punição disciplinar, no âmbito desta Organização Militar, c/c o item 3.1 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, determino a abertura de Processo de Apuração de Transgressão Disciplinar (PATD), com a finalidade de apurar os fatos relatados no Ofício nº <strong>${formData.oficioNumero || '_______'}</strong>, (Prot. COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>.
                </p>
                
                <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
                  Designo o <strong>${formData.apuradorPosto || ''} ${formData.apuradorQuadro || ''} ${formData.apurador || '___________________________'}</strong> para, na condição de Oficial Apurador, efetuar a apuração da suposta transgressão disciplinar e propor solução à autoridade competente, com estrita observância dos procedimentos previstos na ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, e no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER); sem prejuízo das demais funções.
                </p>
                
                <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
                  Após apurados os fatos, voltem-me os autos para decisão.
                </p>
              </div>

              <div class="text-right" style="margin-top: 25mm; font-size: 13px; font-weight: 550; text-align: right;">
                <p>Pirassununga, ${new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
              </div>

              <div class="signature-box text-center" style="margin-top: 30mm;">
                <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
                <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.aplicadorPosto || ''} ${formData.aplicadorQuadro || ''} ${formData.aplicador || '___________________________'}</p>
                <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">${formData.aplicadorCargo || 'Autoridade Aplicadora / Competente'}</p>
              </div>
            </div>
          `;
        case 'fatd':
          return `
            <!-- Folha 1 -->
            <div class="sheet fatd font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; page-break-after: always; position: relative; box-sizing: border-box;">
              <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
              <!-- Header inside the printable sheet -->
              <div class="text-center font-bold" style="margin-bottom: 2mm;">
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo D - Formulário de Apuração de Transgressão Disciplinar (FATD)</p>
                <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
                <p class="text-red" style="font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
              </div>

              <!-- Top Emblem and Headers -->
              <div class="w-full text-center flex flex-col items-center" style="margin-bottom: 20px;">
                <img src="${window.location.origin}/brasao.png" width="65" height="65" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Ministério da Defesa</p>
                <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
                <p class="text-black underline" style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
              </div>

              <div class="title text-center font-bold uppercase" style="margin-top: 15px; margin-bottom: 15px;">
                <h2 style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; color: #000000;">FORMULÁRIO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</h2>
                <h3 style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase;">FATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span></h3>
              </div>

              <!-- Identificação do Militar Arrolado -->
              <div style="border: 1px solid #000000; padding: 6px; font-size: 12px; margin-bottom: 12px; color: #000000;">
                <p style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase;">IDENTIFICAÇÃO DO MILITAR ARROLADO</p>
                <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro} ${formData.especialidade ? `/ ${formData.especialidade}` : ''}</p>
                <div style="display: flex; justify-content: space-between;">
                  <span>SARAM: <strong>${formData.saram || '_______'}</strong></span>
                  <span>Seção/OM: <strong>${formData.setor || '_______'} / ${formData.divisao || '_______'}</strong></span>
                </div>
              </div>

              <!-- Identificação do Oficial Apurador -->
              <div style="border: 1px solid #000000; padding: 6px; font-size: 12px; margin-bottom: 15px; color: #000000;">
                <p style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase;">IDENTIFICAÇÃO DO OFICIAL APURADOR</p>
                <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
                <div style="display: flex; justify-content: space-between;">
                  <span>SARAM: <strong>${formData.apuradorSaram || '_______'}</strong></span>
                  <span>Seção/OM: <strong>${formData.divisao || '_______'}</strong></span>
                </div>
              </div>

              <div class="text-center font-bold" style="margin-top: 15px; margin-bottom: 10px; font-size: 13px; color: #000000;">RELATO DO FATO</div>
              <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6; color: #000000;">
                <p style="text-indent: 3rem; margin-top: 10px; text-align: justify;">
                  Tendo chegado ao meu conhecimento, por intermédio do Ofício nº <strong>${formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>, que <strong>${formData.resumoFato || '___________________________'}</strong>.
                </p>
                
                <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
                  Em face de o fato narrado, in tese, constituir transgressão disciplinar, podendo ser enquadrada no(s) item(ns) <strong>${formData.enquadramentoRdaer || '_______'}</strong>, do art. 10, do RDAer, encaminho ao senhor cópia da referida ocorrência para, querendo, manifestar-se no prazo de 05 (cinco) dias úteis, podendo constituir advogado e produzir quaisquer provas admitidas em direito para a defesa de seus interesses, em cumprimento ao art. 5º, inciso LV, da Constituição Federal, combinado com o caput do art. 34 do RDAer e com o item 4 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
                </p>
              </div>

              <div class="text-right" style="margin-top: 15mm; font-size: 13px; font-weight: 550; text-align: right;">
                <p>Pirassununga, ${new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
              </div>

              <div class="signature-box text-center" style="margin-top: 20mm;">
                <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
                <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
                <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">Oficial Apurador</p>
              </div>

              <!-- Footer -->
              <div style="position: absolute; bottom: 15mm; left: 20mm; font-size: 11px; font-weight: bold; color: #000000;">
                PATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span>
              </div>
            </div>

            <!-- Folha 2 -->
            <div class="sheet fatd font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box;">
              <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
              <!-- Header inside the printable sheet -->
              <div style="font-size: 13px; font-weight: bold; margin-bottom: 15mm; color: #000000;">
                FATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span> - fls. 2/2
              </div>

              <!-- Title -->
              <div class="text-center font-bold" style="margin-bottom: 12mm; font-size: 14px; text-transform: uppercase; color: #000000;">
                CIENTE DO MILITAR ARROLADO
              </div>

              <!-- Body text -->
              <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6; color: #000000;">
                <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
                  Eu, <strong>${formData.nomeCompleto || '___________________________'}</strong>, <strong>${formData.posto} ${formData.quadro}</strong> do arrolado, SARAM <strong>${formData.saram || '_______'}</strong>, declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos acima e me foi concedido o prazo de 05 (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para apresentar, por escrito, as minhas alegações de defesa, nos termos do item 5.1.2, “b” da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
                </p>

                <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
                  Fui informado(a) ainda, que caso não formule minhas alegações de defesa no prazo assinalado, o PATD seguirá o tramite previsto na supracitada ICA 111-6.
                </p>

                <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
                  Outrossim, declaro que, neste ato, recebi cópia dos seguintes documentos que dizem respeito ao fato objeto da apuração:
                </p>

                <ul style="list-style-type: none; padding-left: 3rem; margin: 15px 0; line-height: 1.6;">
                  <li style="margin-bottom: 4px;">• Capa;</li>
                  <li style="margin-bottom: 4px;">• Portaria nº 853/SIJ, de 27 de abril de 2026;</li>
                  <li style="margin-bottom: 4px;">• Despacho de Abertura do PATD;</li>
                  <li style="margin-bottom: 4px;">• Ofício nº <strong>${formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>;</li>
                  <li style="margin-bottom: 4px;">• Formulário de Apuração de Transgressão Disciplinar (FATD) - fls. 1/2;</li>
                  <li style="margin-bottom: 4px;">• Ficha Individual do Militar Arrolado</li>
                </ul>
              </div>

              <div class="text-left" style="margin-top: 15mm; font-size: 13px; text-align: left;">
                <p>Pirassununga, _______________________.</p>
              </div>

              <div class="signature-box text-center" style="margin-top: 20mm;">
                <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
                <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro}</p>
                <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">Militar Arrolado</p>
              </div>

              <!-- Footer -->
              <div style="position: absolute; bottom: 15mm; left: 20mm; font-size: 11px; font-weight: bold; color: #000000;">
                PATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span>
              </div>
            </div>
          `;
        default:
          return '';
      }
    };

    const css = `
      body {
        background-color: #f1f5f9;
        margin: 0;
        padding: 40px 20px;
        font-family: 'Times New Roman', Times, serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40px;
      }
      .sheet {
        background-color: #ffffff;
        width: 210mm;
        min-height: 297mm;
        padding: 30mm 20mm 20mm 20mm;
        box-sizing: border-box;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        position: relative;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-justify { text-align: justify; }
      .font-bold { font-weight: bold; }
      .uppercase { text-transform: uppercase; }
      .mt-4 { margin-top: 1rem; }
      .mt-8 { margin-top: 2rem; }
      .mt-12 { margin-top: 3rem; }
      .mt-16 { margin-top: 4rem; }
      .mt-24 { margin-top: 6rem; }
      .mt-32 { margin-top: 8rem; }
      .text-sm { font-size: 0.875rem; }
      .text-xs { font-size: 0.75rem; }
      .text-md { font-size: 1.125rem; }
      .text-xl { font-size: 1.25rem; }
      .w-full { width: 100%; }
      .w-64 { width: 16rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gap-4 { gap: 1rem; }
      .border { border: 1px solid #cbd5e1; }
      .border-collapse { border-collapse: collapse; }
      .p-2 { padding: 0.5rem; }
      .p-3 { padding: 0.75rem; }
      .divider {
        margin: 20px 0;
        border-bottom: 2px double #000;
      }
      .border-bottom {
        border-bottom: 1px solid #000;
      }
      .border-top {
        border-top: 1px solid #e2e8f0;
      }
      .pt-4 { padding-top: 1rem; }
      .indent-12 { text-indent: 3rem; }
      .leading-relaxed { line-height: 1.625; }
      .section-title {
        font-family: sans-serif;
        border-left: 4px solid #4f46e5;
        padding-left: 8px;
      }
      .bg-slate-100 { background-color: #f1f5f9; }
      .bg-slate-50 { background-color: #f8fafc; }
      .min-h-24 { min-height: 6rem; }
      .italic { font-style: italic; }
      .rounded-lg { border-radius: 0.5rem; }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background-color: transparent;
          padding: 0;
          margin: 0;
        }
        .sheet {
          box-shadow: none;
          width: 210mm;
          height: 296mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        .sheet:last-child {
          page-break-after: avoid;
        }
      }
      .text-red {
        color: #ff0000 !important;
      }
      .text-black {
        color: #000000 !important;
      }
      .capa-header {
        text-align: center;
        font-family: 'Times New Roman', Times, serif;
      }
      .capa-frame {
        border: 2px solid #000000 !important;
        padding: 10mm 15mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 212mm;
        box-sizing: border-box;
        font-family: 'Times New Roman', Times, serif;
      }
      .line-accent {
        width: 100%;
        border-bottom: 2px solid #000000 !important;
        margin-top: 15px;
        margin-bottom: 5px;
      }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>${type.toUpperCase()} - ${formData.patdNumber || 'PATD'}</title>
          <style>${css}</style>
        </head>
        <body>
          ${getDocHTML()}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printAllDocuments = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return '___/___/_____';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const css = `
      body {
        background-color: #f1f5f9;
        margin: 0;
        padding: 40px 20px;
        font-family: 'Times New Roman', Times, serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 40px;
      }
      .sheet {
        background-color: #ffffff;
        width: 210mm;
        min-height: 297mm;
        padding: 30mm 20mm 20mm 20mm;
        box-sizing: border-box;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        position: relative;
        page-break-after: always;
      }
      .sheet:last-child {
        page-break-after: avoid;
      }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-justify { text-align: justify; }
      .font-bold { font-weight: bold; }
      .uppercase { text-transform: uppercase; }
      .mt-4 { margin-top: 1rem; }
      .mt-6 { margin-top: 1.5rem; }
      .mt-8 { margin-top: 2rem; }
      .mt-12 { margin-top: 3rem; }
      .mt-16 { margin-top: 4rem; }
      .mt-24 { margin-top: 6rem; }
      .mt-32 { margin-top: 8rem; }
      .text-sm { font-size: 0.875rem; }
      .text-xs { font-size: 0.75rem; }
      .text-md { font-size: 1.125rem; }
      .text-xl { font-size: 1.25rem; }
      .w-full { width: 100%; }
      .w-64 { width: 16rem; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gap-4 { gap: 1rem; }
      .border { border: 1px solid #cbd5e1; }
      .border-collapse { border-collapse: collapse; }
      .p-1 { padding: 0.25rem; }
      .p-2 { padding: 0.5rem; }
      .p-3 { padding: 0.75rem; }
      .divider {
        margin: 20px 0;
        border-bottom: 2px double #000;
      }
      .border-bottom {
        border-bottom: 1px solid #000;
      }
      .border-top {
        border-top: 1px solid #e2e8f0;
      }
      .pt-4 { padding-top: 1rem; }
      .indent-12 { text-indent: 3rem; }
      .leading-relaxed { line-height: 1.625; }
      .section-title {
        font-family: sans-serif;
        border-left: 4px solid #4f46e5;
        padding-left: 8px;
      }
      .bg-slate-100 { background-color: #f1f5f9; }
      .bg-slate-50 { background-color: #f8fafc; }
      .min-h-24 { min-height: 6rem; }
      .italic { font-style: italic; }
      .rounded-lg { border-radius: 0.5rem; }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          background-color: transparent;
          padding: 0;
          margin: 0;
          gap: 0;
        }
        .sheet {
          box-shadow: none;
          width: 210mm;
          height: 296mm;
          box-sizing: border-box;
          page-break-after: always;
        }
        .sheet:last-child {
          page-break-after: avoid;
        }
      }
      .text-red {
        color: #ff0000 !important;
      }
      .text-black {
        color: #000000 !important;
      }
      .capa-header {
        text-align: center;
        font-family: 'Times New Roman', Times, serif;
      }
      .capa-frame {
        border: 2px solid #000000 !important;
        padding: 10mm 15mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 212mm;
        box-sizing: border-box;
        font-family: 'Times New Roman', Times, serif;
      }
      .line-accent {
        width: 100%;
        border-bottom: 2px solid #000000 !important;
        margin-top: 15px;
        margin-bottom: 5px;
      }
    `;

    const capaHTML = `
      <div class="sheet capa font-serif" style="padding: 15mm 20mm 15mm 20mm !important;">
        <!-- Outside the bordered frame -->
        <div class="capa-header text-center" style="margin-bottom: 8mm !important;">
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo C - Capa</p>
          <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
          <p class="text-red" style="font-size: 12px; margin: 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
        </div>

        <!-- Bordered Frame -->
        <div class="capa-frame">
          <!-- Top Emblem and Headers -->
          <div class="w-full text-center flex flex-col items-center">
            <img src="${window.location.origin}/brasao.png" width="75" height="75" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
            <p style="font-size: 16px; font-weight: bold; color: #000000; margin: 0 0 4px 0; text-transform: uppercase;">Ministério da Defesa</p>
            <p style="font-size: 16px; font-weight: bold; color: #000000; margin: 0 0 4px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
            <p class="text-black underline" style="font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
          </div>

          <!-- Process Title -->
          <div class="w-full text-center" style="margin-top: 12mm; margin-bottom: 12mm;">
            <p style="font-size: 13px; font-weight: bold; color: #000000; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">PROCESSO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</p>
            <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0;">Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span></p>
          </div>

          <!-- Footer/Sections inside Frame -->
          <div class="w-full" style="margin-bottom: 5mm;">
            <!-- Militar Arrolado -->
            <div class="text-center" style="margin-bottom: 15mm;">
              <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Militar Arrolado</p>
              <p class="text-black" style="font-size: 15px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro}</p>
              <div class="line-accent" style="margin-top: 5px !important;"></div>
            </div>

            <!-- Oficial Apurador -->
            <div class="text-center">
              <p style="font-size: 15px; font-weight: bold; color: #000000; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Oficial Apurador</p>
              <p class="text-black" style="font-size: 15px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
              <div class="line-accent" style="margin-top: 5px !important;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const despachoHTML = `
      <div class="sheet despacho font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; position: relative;">
        <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
        <!-- Header inside the printable sheet -->
        <div class="text-center font-bold" style="margin-bottom: 2mm;">
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo B - Despacho de Abertura e Designação de Apurador</p>
          <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
        </div>

        <!-- Top Emblem and Headers -->
        <div class="w-full text-center flex flex-col items-center" style="margin-bottom: 25px;">
          <img src="${window.location.origin}/brasao.png" width="65" height="65" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Ministério da Defesa</p>
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
          <p class="text-black underline" style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
        </div>

        <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6;">
          <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
            Considerando o disposto no art. 1º da Portaria nº 853/SIJ, de 27 de abril de 2026, publicada no Boletim Interno Ostensivo n º 75, de 29 de abril de 2026, que designa oficiais para apurar transgressão disciplinar e autoridades para aplicar punição disciplinar, no âmbito desta Organização Militar, c/c o item 3.1 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, determino a abertura de Processo de Apuração de Transgressão Disciplinar (PATD), com a finalidade de apurar os fatos relatados no Ofício nº <strong>${formData.oficioNumero || '_______'}</strong>, (Prot. COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>.
          </p>
          
          <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
            Designo o <strong>${formData.apuradorPosto || ''} ${formData.apuradorQuadro || ''} ${formData.apurador || '___________________________'}</strong> para, na condição de Oficial Apurador, efetuar a apuração da suposta transgressão disciplinar e propor solução à autoridade competente, com estrita observância dos procedimentos previstos na ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, e no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER); sem prejuízo das demais funções.
          </p>
          
          <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
            Após apurados os fatos, voltem-me os autos para decisão.
          </p>
        </div>

        <div class="text-right" style="margin-top: 25mm; font-size: 13px; font-weight: 550; text-align: right;">
          <p>Pirassununga, ${new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
        </div>

        <div class="signature-box text-center" style="margin-top: 30mm;">
          <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
          <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.aplicadorPosto || ''} ${formData.aplicadorQuadro || ''} ${formData.aplicador || '___________________________'}</p>
          <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">${formData.aplicadorCargo || 'Autoridade Aplicadora / Competente'}</p>
        </div>
      </div>
    `;

    const fatdHTML = `
      <!-- Folha 1 -->
      <div class="sheet fatd font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; page-break-after: always; position: relative; box-sizing: border-box;">
        <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
        <!-- Header inside the printable sheet -->
        <div class="text-center font-bold" style="margin-bottom: 2mm;">
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 6px 0;">Anexo D - Formulário de Apuração de Transgressão Disciplinar (FATD)</p>
          <p class="text-red" style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0; letter-spacing: 0.5px;">INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 2px 0; font-weight: 500;">Art. 31 da Lei nº 12.527, de 2011</p>
          <p class="text-red" style="font-size: 12px; margin: 0 0 10px 0; font-weight: 500;">Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
        </div>

        <!-- Top Emblem and Headers -->
        <div class="w-full text-center flex flex-col items-center" style="margin-bottom: 20px;">
          <img src="${window.location.origin}/brasao.png" width="65" height="65" style="margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;" />
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Ministério da Defesa</p>
          <p style="font-size: 14px; font-weight: bold; color: #000000; margin: 0 0 3px 0; text-transform: uppercase;">Comando da Aeronáutica</p>
          <p class="text-black underline" style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase;">Academia da Força Aérea</p>
        </div>

        <div class="title text-center font-bold uppercase" style="margin-top: 15px; margin-bottom: 15px;">
          <h2 style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; color: #000000;">FORMULÁRIO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</h2>
          <h3 style="font-size: 14px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase;">FATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span></h3>
        </div>

        <!-- Identificação do Militar Arrolado -->
        <div style="border: 1px solid #000000; padding: 6px; font-size: 12px; margin-bottom: 12px; color: #000000;">
          <p style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase;">IDENTIFICAÇÃO DO MILITAR ARROLADO</p>
          <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro} ${formData.especialidade ? `/ ${formData.especialidade}` : ''}</p>
          <div style="display: flex; justify-content: space-between;">
            <span>SARAM: <strong>${formData.saram || '_______'}</strong></span>
            <span>Seção/OM: <strong>${formData.setor || '_______'} / ${formData.divisao || '_______'}</strong></span>
          </div>
        </div>

        <!-- Identificação do Oficial Apurador -->
        <div style="border: 1px solid #000000; padding: 6px; font-size: 12px; margin-bottom: 15px; color: #000000;">
          <p style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase;">IDENTIFICAÇÃO DO OFICIAL APURADOR</p>
          <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
          <div style="display: flex; justify-content: space-between;">
            <span>SARAM: <strong>${formData.apuradorSaram || '_______'}</strong></span>
            <span>Seção/OM: <strong>${formData.divisao || '_______'}</strong></span>
          </div>
        </div>

        <div class="text-center font-bold" style="margin-top: 15px; margin-bottom: 10px; font-size: 13px; color: #000000;">RELATO DO FATO</div>
        <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6; color: #000000;">
          <p style="text-indent: 3rem; margin-top: 10px; text-align: justify;">
            Tendo chegado ao meu conhecimento, por intermédio do Ofício nº <strong>${formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>, que <strong>${formData.resumoFato || '___________________________'}</strong>.
          </p>
          
          <p style="text-indent: 3rem; margin-top: 15px; text-align: justify;">
            Em face de o fato narrado, em tese, constituir transgressão disciplinar, podendo ser enquadrada no(s) item(ns) <strong>${formData.enquadramentoRdaer || '_______'}</strong>, do art. 10, do RDAer, encaminho ao senhor cópia da referida ocorrência para, querendo, manifestar-se no prazo de 05 (cinco) dias úteis, podendo constituir advogado e produzir quaisquer provas admitidas em direito para a defesa de seus interesses, em cumprimento ao art. 5º, inciso LV, da Constituição Federal, combinado com o caput do art. 34 do RDAer e com o item 4 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
          </p>
        </div>

        <div class="text-right" style="margin-top: 15mm; font-size: 13px; font-weight: 550; text-align: right;">
          <p>Pirassununga, ${new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
        </div>

        <div class="signature-box text-center" style="margin-top: 20mm;">
          <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
          <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.apurador || '___________________________'} - ${formData.apuradorPosto} ${formData.apuradorQuadro}</p>
          <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">Oficial Apurador</p>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 15mm; left: 20mm; font-size: 11px; font-weight: bold; color: #000000;">
          PATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span>
        </div>
      </div>

      <!-- Folha 2 -->
      <div class="sheet fatd font-serif" style="padding: 20mm 15mm 20mm 20mm !important; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box;">
        <img src="${window.location.origin}/sinete.png" style="position: absolute; top: 10mm; right: 5mm; width: 65mm; height: 46mm;" />
        <!-- Header inside the printable sheet -->
        <div style="font-size: 13px; font-weight: bold; margin-bottom: 15mm; color: #000000;">
          FATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span> - fls. 2/2
        </div>

        <!-- Title -->
        <div class="text-center font-bold" style="margin-bottom: 12mm; font-size: 14px; text-transform: uppercase; color: #000000;">
          CIENTE DO MILITAR ARROLADO
        </div>

        <!-- Body text -->
        <div class="body-text text-justify" style="font-size: 13px; line-height: 1.6; color: #000000;">
          <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
            Eu, <strong>${formData.nomeCompleto || '___________________________'}</strong>, <strong>${formData.posto} ${formData.quadro}</strong> do arrolado, SARAM <strong>${formData.saram || '_______'}</strong>, declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos acima e me foi concedido o prazo de 05 (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para apresentar, por escrito, as minhas alegações de defesa, nos termos do item 5.1.2, “b” da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
          </p>

          <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
            Fui informado(a) ainda, que caso não formule minhas alegações de defesa no prazo assinalado, o PATD seguirá o tramite previsto na supracitada ICA 111-6.
          </p>

          <p style="text-indent: 3rem; text-align: justify; margin-bottom: 15px;">
            Outrossim, declaro que, neste ato, recebi cópia dos seguintes documentos que dizem respeito ao fato objeto da apuração:
          </p>

          <ul style="list-style-type: none; padding-left: 3rem; margin: 15px 0; line-height: 1.6;">
            <li style="margin-bottom: 4px;">• Capa;</li>
            <li style="margin-bottom: 4px;">• Portaria nº 853/SIJ, de 27 de abril de 2026;</li>
            <li style="margin-bottom: 4px;">• Despacho de Abertura do PATD;</li>
            <li style="margin-bottom: 4px;">• Ofício nº <strong>${formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>${formData.protComaer || '_______'}</strong>), de <strong>${formatDateStr(formData.dataOficio)}</strong>;</li>
            <li style="margin-bottom: 4px;">• Formulário de Apuração de Transgressão Disciplinar (FATD) - fls. 1/2;</li>
            <li style="margin-bottom: 4px;">• Ficha Individual do Militar Arrolado</li>
          </ul>
        </div>

        <div class="text-left" style="margin-top: 15mm; font-size: 13px; text-align: left;">
          <p>Pirassununga, _______________________.</p>
        </div>

        <div class="signature-box text-center" style="margin-top: 20mm;">
          <div class="line mx-auto w-64 border-bottom mb-2" style="border-bottom: 1px solid #000000; width: 250px; margin-left: auto; margin-right: auto;"></div>
          <p class="font-bold uppercase" style="margin: 0 0 2px 0; font-size: 13px;">${formData.nomeCompleto || '___________________________'} - ${formData.posto} ${formData.quadro}</p>
          <p class="text-xs uppercase text-slate-500" style="margin: 0; font-size: 10px;">Militar Arrolado</p>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 15mm; left: 20mm; font-size: 11px; font-weight: bold; color: #000000;">
          PATD Nº <span class="text-black">${formData.patdNumber || '___/___/_____'}</span>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>PROCESSO COMPLETO - ${formData.patdNumber || 'PATD'}</title>
          <style>${css}</style>
        </head>
        <body>
          ${capaHTML}
          ${despachoHTML}
          ${fatdHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getAllowedQuadros = (posto: string) => {
    if (['BR', 'CL', 'TC', 'MJ', 'CP', '1T', '2T', 'AP'].includes(posto)) {
      return ['QOAV', 'QOINF', 'QOINT', 'QOAP', 'QOMED', 'QOCON', 'QOFARM', 'QODENT', 'QOENG', 'QOECTA', 'QOESUP', 'QOEARM', 'QOEAV', 'QOEA'];
    }
    if (['CD'].includes(posto)) {
      return ['QOAV', 'QOINT', 'QOINF'];
    }
    if (['SO', '1S', '2S', '3S', 'AL'].includes(posto)) {
      return ['QSS', 'QSCON', 'QESA'];
    }
    if (['CB'].includes(posto)) {
      return ['QCB', 'QCBCON'];
    }
    if (['TM', 'T1', 'T2'].includes(posto)) {
      return ['QTA'];
    }
    if (['S1', 'S2'].includes(posto)) {
      return ['QSD'];
    }
    return [];
  };

  const allowedQuadros = useMemo(() => {
    const allowed = getAllowedQuadros(formData.posto);
    const baseQuadros = [
      { value: 'QOAV', label: 'QOAV' },
      { value: 'QOINT', label: 'QOINT' },
      { value: 'QOINF', label: 'QOINF' },
      { value: 'QOAP', label: 'QOAP' },
      { value: 'QOMED', label: 'QOMED' },
      { value: 'QOCON', label: 'QOCON' },
      { value: 'QOFARM', label: 'QOFARM' },
      { value: 'QODENT', label: 'QODENT' },
      { value: 'QOENG', label: 'QOENG' },
      { value: 'QOECTA', label: 'QOECTA' },
      { value: 'QOESUP', label: 'QOESUP' },
      { value: 'QOEARM', label: 'QOEARM' },
      { value: 'QOEAV', label: 'QOEAV' },
      { value: 'QOEA', label: 'QOEA' },
      { value: 'QSS', label: 'QSS' },
      { value: 'QSCON', label: 'QSCON' },
      { value: 'QESA', label: 'QESA' },
      { value: 'QCB', label: 'QCB' },
      { value: 'QCBCON', label: 'QCBCON' },
      { value: 'QTA', label: 'QTA' },
      { value: 'QSD', label: 'QSD' },
    ];
    if (allowed.length === 0) return baseQuadros;
    return baseQuadros.filter(q => allowed.includes(q.value));
  }, [formData.posto]);

  useEffect(() => {
    const allowed = getAllowedQuadros(formData.posto);
    if (allowed.length > 0 && !allowed.includes(formData.quadro)) {
      setFormData(prev => ({
        ...prev,
        quadro: allowed[0]
      }));
    }
  }, [formData.posto]);

  // Form memory persistence and initial load
  useEffect(() => {
    if (initialData) {
      if (initialData._isPrefilledNew) {
        setFormData((prev: any) => ({
          ...prev,
          posto: initialData.posto || '1T',
          quadro: initialData.quadro || 'QOINT',
          saram: initialData.saram || '',
          nomeCompleto: initialData.militar || '',
          especialidade: initialData.especialidade || '',
          divisao: initialData.divisao || currentUser?.divisao || prev.divisao || 'DOA'
        }));
      } else {
        const loadedForm = {
          patdNumber: initialData.patdNumber || '',
          posto: initialData.posto || '1T',
          quadro: initialData.quadro || 'QOINT',
          saram: initialData.saram || '',
          nomeCompleto: initialData.militar || '',
          especialidade: initialData.especialidade || '',
          divisao: initialData.divisao || 'DOA',
          setor: initialData.setor || '',
          apurador: initialData.apurador || '',
          apuradorPosto: initialData.apuradorPosto || '1T',
          apuradorQuadro: initialData.apuradorQuadro || 'QOINT',
          apuradorSaram: initialData.apuradorSaram || '',
          aplicador: initialData.aplicador || '',
          aplicadorPosto: initialData.aplicadorPosto || 'TC',
          aplicadorQuadro: initialData.aplicadorQuadro || 'QOAV',
          aplicadorCargo: initialData.aplicadorCargo || '',
          oficioNumero: initialData.oficioNumero || '',
          protComaer: initialData.protComaer || '',
          dataOficio: initialData.dataOficio || '',
          enquadramentoRdaer: initialData.enquadramentoRdaer || '',
          resumoFato: initialData.resumoFato || '',
          dataInicio: initialData.dataInicio || '',
          dataTermino: initialData.dataTermino || '',
          status: initialData.status || 'Em Andamento',
          punicao: initialData.punicao || 'Em Branco',
          qtdDias: String(initialData.diasPunicao || '0'),
          dataPunicao: initialData.dataPunicao || '',
          resumoPunicao: initialData.resumoPunicao || '',
          nGrade: initialData.nGrade || '',
          boletim: initialData.boletim || '',
          observacoes: initialData.observacoes || '',
          documents: initialData.documents || [],
          delegacaoDoc: initialData.delegacaoDoc || null,
          sigadSecprom: initialData.sigadSecprom || '',
          docArquivado: !!initialData.docArquivado
        };

        // Check if there is an autosaved draft in localStorage for this process edit
        const key = `edit_patd_form_memory_${initialData.id}`;
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              // Merge parsed saved data onto loadedForm, but preserve non-empty DB fields
              Object.keys(parsed).forEach(fieldKey => {
                if (parsed[fieldKey] !== undefined && parsed[fieldKey] !== '' && parsed[fieldKey] !== null) {
                  (loadedForm as any)[fieldKey] = parsed[fieldKey];
                }
              });
            }
          }
        } catch (e) {
          console.error('Error restoring form memory:', e);
        }

        setFormData(loadedForm);
      }
      setHistory(initialData.history || []);
      setIsFormLoaded(true);
      return;
    }

    // Creating new process: check localStorage form memory
    const key = 'new_patd_form_memory';
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev: any) => ({ ...prev, ...parsed }));
          const savedHistory = localStorage.getItem(`${key}_history`);
          if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
          }
          setIsFormLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error restoring new form memory:', e);
    }

    setFormData({
      patdNumber: `001/DIV/${currentYear}`,
      posto: '1T',
      quadro: 'QOINT',
      saram: '',
      nomeCompleto: '',
      especialidade: '',
      divisao: currentUser && currentUser.role !== 'Administrador' && currentUser.divisao ? currentUser.divisao : 'DOA',
      setor: '',
      apurador: '',
      apuradorPosto: '1T',
      apuradorQuadro: 'QOINT',
      apuradorSaram: '',
      aplicador: '',
      aplicadorPosto: 'TC',
      aplicadorQuadro: 'QOAV',
      aplicadorCargo: '',
      oficioNumero: '',
      protComaer: '',
      dataOficio: '',
      enquadramentoRdaer: '',
      resumoFato: '',
      dataInicio: '',
      dataTermino: '',
      status: 'Em Andamento',
      punicao: 'Em Branco',
      qtdDias: '0',
      dataPunicao: '',
      resumoPunicao: '',
      nGrade: '',
      boletim: '',
      observacoes: '',
      documents: [],
      delegacaoDoc: null
    });
    setHistory([]);
    setIsFormLoaded(true);
  }, [initialData, currentUser]);

  // Auto-save form data on changes, only after form is loaded
  useEffect(() => {
    if (!isFormLoaded) return;
    const key = initialData 
      ? (initialData._isPrefilledNew ? 'new_patd_form_memory' : `edit_patd_form_memory_${initialData.id}`)
      : 'new_patd_form_memory';
    localStorage.setItem(key, JSON.stringify(formData));
    localStorage.setItem(`${key}_history`, JSON.stringify(history));
  }, [formData, history, initialData, isFormLoaded]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSpreadsheetClick = () => {
    spreadsheetInputRef.current?.click();
  };

  const handleSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      alert('Formato de arquivo não suportado. Use apenas arquivos .xlsx, .xls ou .csv.');
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_\-–—º°()]/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const mappings: { [key: string]: string[] } = {
          patdNumber: ['patdnumber', 'npatd', 'numeropatd', 'patd', 'ndopatd', 'numerodopatd'],
          posto: ['posto', 'rank'],
          quadro: ['quadro', 'frame'],
          saram: ['saram', 'sarammilitar', 'saramarrolado', 'saramdomilitar'],
          nomeCompleto: ['nomecompleto', 'nome', 'militar', 'militararrolado', 'nomedomilitar', 'arrolado', 'completo'],
          especialidade: ['especialidade', 'specialty'],
          divisao: ['divisao', 'division', 'setor', 'divisaoousetor'],
          setor: ['setor', 'sector'],
          apurador: ['apurador', 'oficialapurador', 'nomeapurador', 'nomedoapurador', 'apuradorencarregado', 'encarregado'],
          apuradorPosto: ['apuradorposto', 'postoapurador', 'postodoapurador', 'postoapuradorencarregado'],
          apuradorQuadro: ['apuradorquadro', 'quadroapurador', 'quadrodoapurador', 'quadroapuradorencarregado'],
          apuradorSaram: ['apuradorsaram', 'saramapurador', 'saramdoapurador', 'saramapuradorencarregado'],
          aplicador: ['aplicador', 'autoridadeaplicadora', 'nomeaplicador', 'nomedoaplicador'],
          aplicadorPosto: ['aplicadorposto', 'postoaplicador', 'postodoaplicador'],
          aplicadorQuadro: ['aplicadorquadro', 'quadroaplicador', 'quadrodoaplicador'],
          aplicadorCargo: ['aplicadorcargo', 'cargoaplicador', 'cargodoaplicador'],
          oficioNumero: ['oficionumero', 'noficio', 'oficio', 'oficionum'],
          protComaer: ['protcomaer', 'protocolocomaer', 'protocolo', 'comaer'],
          dataOficio: ['dataoficio', 'datadooficio'],
          enquadramentoRdaer: ['enquadramentordaer', 'enquadramento', 'rdaer'],
          resumoFato: ['resumofato', 'resumodofato', 'fato', 'resumo'],
          dataInicio: ['datainicio', 'datadeinicio', 'inicio'],
          dataTermino: ['datatermino', 'datadetermino', 'termino'],
          status: ['status'],
          punicao: ['punicao', 'punishment'],
          qtdDias: ['qtddias', 'quantidadededias', 'quantidadedias', 'dias', 'ndias', 'numerodias'],
          dataPunicao: ['datapunicao', 'datadapunicao'],
          resumoPunicao: ['resumopunicao', 'resumodapunicao'],
          nGrade: ['ngrade', 'grade'],
          boletim: ['boletim', 'bulletin'],
          observacoes: ['observacoes', 'obs', 'observacao']
        };

        // Convert sheet to Array of Arrays (AOA) first to locate the header row
        const aoaRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Flatten all aliases to a Set for quick lookup
        const allAliases = new Set(Object.values(mappings).flat());
        
        let headerRowIndex = 0;
        let maxMatches = 0;
        
        // Scan the first 15 rows (or total length if less)
        const scanLimit = Math.min(aoaRows.length, 15);
        for (let i = 0; i < scanLimit; i++) {
          const row = aoaRows[i];
          if (!row || !Array.isArray(row)) continue;
          
          let matches = 0;
          for (let cell of row) {
            if (cell !== null && cell !== undefined) {
              const normalized = normalizeKey(String(cell));
              if (normalized && allAliases.has(normalized)) {
                matches++;
              }
            }
          }
          if (matches > maxMatches) {
            maxMatches = matches;
            headerRowIndex = i;
          }
        }
        
        console.log(`Detected header row index: ${headerRowIndex} with ${maxMatches} matches`);

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
        
        if (rawRows.length === 0) {
          alert('A planilha está vazia.');
          return;
        }

        const parseDateToInputFormat = (value: any) => {
          if (!value) return '';
          if (value instanceof Date) {
            const offset = value.getTimezoneOffset();
            const correctedDate = new Date(value.getTime() - (offset * 60 * 1000));
            return correctedDate.toISOString().split('T')[0];
          }
          if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
              return trimmed;
            }
            const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
            if (dmy) {
              const day = dmy[1].padStart(2, '0');
              const month = dmy[2].padStart(2, '0');
              const year = dmy[3];
              return `${year}-${month}-${day}`;
            }
          }
          return '';
        };

        const extractRowData = (rawRow: any) => {
          const extracted: any = {};
          const rowKeysMapped = Object.keys(rawRow).reduce((acc: any, key: string) => {
            acc[normalizeKey(key)] = rawRow[key];
            return acc;
          }, {});

          Object.keys(mappings).forEach((field) => {
            const aliases = mappings[field];
            const matchedKey = aliases.find(alias => rowKeysMapped[alias] !== undefined && rowKeysMapped[alias] !== '');
            if (matchedKey !== undefined) {
              let value = rowKeysMapped[matchedKey];
              if (value !== null && value !== undefined) {
                if (typeof value === 'string') {
                  value = value.trim();
                }
                
                if (['dataOficio', 'dataInicio', 'dataTermino', 'dataPunicao'].includes(field)) {
                  extracted[field] = parseDateToInputFormat(value);
                } else {
                  extracted[field] = String(value);
                }
              }
            }
          });
          return extracted;
        };

        console.log('--- SHEET IMPORT DEBUG ---');
        console.log('rawRows:', rawRows);
        
        // Filter out rows that are entirely empty or don't have mapped keys
        const processed = rawRows
          .map((r: any) => extractRowData(r))
          .filter((item: any) => Object.keys(item).length > 0 && Object.values(item).some(val => val !== ''));
          
        console.log('processedRows:', processed);

        if (processed.length === 0) {
          alert('Nenhum registro com dados válidos foi encontrado na planilha.');
          return;
        }

        if (processed.length === 1) {
          const mappedData = processed[0];
          setFormData((prev: any) => ({
            ...prev,
            ...mappedData
          }));
        } else {
          setMultipleRowsData(processed);
          setIsImportModalOpen(true);
        }
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        alert(`Erro ao processar o arquivo: ${err.message || err}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo não pode exceder o limite máximo de 20MB.');
      return;
    }

    if (formData.documents && formData.documents.length > 0) {
      alert('Já existe um documento anexado a este processo. Remova-o antes de enviar um novo arquivo.');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `process_docs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newDoc = {
        name: file.name,
        url: urlData.publicUrl,
        uploadedAt: new Date().toLocaleDateString('pt-BR')
      };

      const newHistoryItem = {
        field: 'Documento PDF',
        oldValue: '—',
        newValue: `Adicionado: ${file.name}`,
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };

      setHistory((prev: any) => [newHistoryItem, ...prev]);

      setFormData((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(`Erro ao fazer upload do documento: ${err.message || err}`);
    }
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo não pode exceder o limite máximo de 20MB.');
      return;
    }

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `process_docs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newDoc = {
        name: file.name,
        url: urlData.publicUrl,
        uploadedAt: new Date().toLocaleDateString('pt-BR')
      };

      const newHistoryItem = {
        field: 'Documento PDF',
        oldValue: '—',
        newValue: `Adicionado via Pré-visualização: ${file.name}`,
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };

      setHistory((prev: any) => [newHistoryItem, ...prev]);

      setFormData((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));

      setPreviewMailData((prev: any) => ({
        ...prev,
        documentName: file.name
      }));
    } catch (err: any) {
      console.error('Error uploading file from modal:', err);
      alert(`Erro ao fazer upload do documento: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalFileRemove = () => {
    if (formData.documents && formData.documents.length > 0) {
      const removedDoc = formData.documents[0];
      const newHistoryItem = {
        field: 'Documento PDF',
        oldValue: `Removido via Pré-visualização: ${removedDoc.name}`,
        newValue: '—',
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };
      setHistory((prev: any) => [newHistoryItem, ...prev]);
      setFormData((prev: any) => ({
        ...prev,
        documents: prev.documents.slice(1)
      }));
    }
    setPreviewMailData((prev: any) => ({
      ...prev,
      documentName: null
    }));
  };

  const handleDelegacaoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'image/png') {
      alert('Apenas arquivos PDF ou PNG são permitidos para a Portaria de Delegação.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo não pode exceder o limite máximo de 20MB.');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `delegacao-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `process_docs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newDoc = {
        name: file.name,
        url: urlData.publicUrl,
        uploadedAt: new Date().toLocaleDateString('pt-BR')
      };

      const newHistoryItem = {
        field: 'Portaria de Delegação',
        oldValue: '—',
        newValue: `Adicionada: ${file.name}`,
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };

      setHistory((prev: any) => [newHistoryItem, ...prev]);

      setFormData((prev: any) => ({
        ...prev,
        delegacaoDoc: newDoc
      }));
    } catch (err: any) {
      console.error('Error uploading delegacao:', err);
      alert(`Erro ao fazer upload da Portaria de Delegação: ${err.message || err}`);
    }
  };

  const handleDelegacaoDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir a Portaria de Delegação?')) {
      return;
    }

    try {
      if (formData.delegacaoDoc?.url) {
        const urlParts = formData.delegacaoDoc.url.split('/storage/v1/object/public/documents/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('documents').remove([filePath]);
        }
      }

      const newHistoryItem = {
        field: 'Portaria de Delegação',
        oldValue: formData.delegacaoDoc?.name || 'Existente',
        newValue: 'Excluída',
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };

      setHistory((prev: any) => [newHistoryItem, ...prev]);

      setFormData((prev: any) => ({
        ...prev,
        delegacaoDoc: null
      }));
    } catch (err: any) {
      console.error('Error deleting delegacao:', err);
      alert(`Erro ao excluir a Portaria de Delegação: ${err.message || err}`);
    }
  };

  // Auto-generate ID logic (only if not editing)
  useEffect(() => {
    if (initialData && !initialData._isPrefilledNew) return;

    let active = true;

    const fetchNextNumber = async () => {
      const divShort = formData.divisao.split(' ')[0].toUpperCase();
      let nextNum = 1;

      try {
        // Query active processes from database
        const { data: activeData, error: activeErr } = await supabase
          .from('processes')
          .select('patd_number');

        if (activeErr) console.error('Active query error:', activeErr);

        const allNumbers = [
          ...(activeData || []).map((p: any) => p.patd_number),
          ...processes.map((p: any) => p.patdNumber)
        ];

        let maxNum = 0;
        allNumbers.forEach((pStr: string) => {
          if (!pStr) return;
          const parts = pStr.split('/');
          if (parts.length >= 3) {
            const pDiv = parts[1].toUpperCase();
            const pYear = parseInt(parts[2], 10);
            if (pDiv === divShort && pYear === currentYear) {
              const num = parseInt(parts[0], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        });

        nextNum = maxNum + 1;
      } catch (err) {
        console.error('Error fetching sequential PATD number:', err);
        // Fallback using local state processes array
        let maxNum = 0;
        processes.forEach((p: any) => {
          if (!p.patdNumber) return;
          const parts = p.patdNumber.split('/');
          if (parts.length >= 3) {
            const pDiv = parts[1].toUpperCase();
            const pYear = parseInt(parts[2], 10);
            if (pDiv === divShort && pYear === currentYear) {
              const num = parseInt(parts[0], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        });
        nextNum = maxNum + 1;
      }

      if (active) {
        const formattedNum = String(nextNum).padStart(3, '0');
        setFormData(prev => ({
          ...prev,
          patdNumber: `${formattedNum}/${divShort}/${currentYear}`
        }));
      }
    };

    fetchNextNumber();

    return () => {
      active = false;
    };
  }, [formData.divisao, currentYear, initialData, processes, seqTrigger]);

  // Enforce division if not Admin or Apurador
  useEffect(() => {
    if (!initialData && currentUser && currentUser.role === 'Operador' && currentUser.divisao && !isSameDivision(formData.divisao, currentUser.divisao)) {
      setFormData(prev => ({
        ...prev,
        divisao: currentUser.divisao
      }));
    }
  }, [currentUser, formData.divisao, initialData]);

  // Simplified field name map for history
  const fieldNames: any = {
    patdNumber: 'Nº PATD',
    posto: 'Posto',
    quadro: 'Quadro',
    saram: 'SARAM',
    nomeCompleto: 'Nome Completo',
    especialidade: 'Especialidade',
    divisao: 'Divisão',
    setor: 'Setor',
    apurador: 'Apurador',
    apuradorPosto: 'Posto do Apurador',
    apuradorQuadro: 'Quadro do Apurador',
    apuradorSaram: 'SARAM do Apurador',
    aplicador: 'Aplicador',
    aplicadorPosto: 'Posto do Aplicador',
    aplicadorQuadro: 'Quadro do Aplicador',
    aplicadorCargo: 'Cargo do Aplicador',
    oficioNumero: 'Nº do Ofício',
    protComaer: 'Prot. COMAER nº',
    dataOficio: 'Data do Ofício/Protocolo',
    enquadramentoRdaer: 'Enquadramento RDAER',
    resumoFato: 'Resumo do Fato',
    dataInicio: 'Data de Início',
    dataTermino: 'Data de Término',
    status: 'Status',
    punicao: 'Punição',
    qtdDias: 'Qtd Dias',
    dataPunicao: 'Data da Punição',
    resumoPunicao: 'Resumo da Punição',
    nGrade: 'Nº Grade',
    boletim: 'Boletim',
    observacoes: 'Observações',
    sigadSecprom: 'SIGAD SECPROM',
    docArquivado: 'Doc Arquivado'
  };

  const validateDates = (updatedData: any) => {
    const newErrors = { ...errors };
    const start = updatedData.dataInicio ? new Date(updatedData.dataInicio) : null;
    const end = updatedData.dataTermino ? new Date(updatedData.dataTermino) : null;
    const punishment = updatedData.dataPunicao ? new Date(updatedData.dataPunicao) : null;

    if (start && end && end < start) {
      newErrors.dataTermino = 'Término deve ser posterior ao Início';
    } else {
      delete newErrors.dataTermino;
    }

    if (start && punishment && punishment < start) {
      newErrors.dataPunicao = 'Punição deve ser posterior ao Início';
    } else {
      delete newErrors.dataPunicao;
    }

    setErrors(newErrors);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // SARAM Restriction: only numbers, max 7
    if (field === 'saram' || field === 'apuradorSaram') {
      newValue = newValue.replace(/\D/g, '').slice(0, 7);
    }

    const oldValue = (formData as any)[field];
    
    if (oldValue !== newValue) {
      const newHistoryItem = {
        field: fieldNames[field] || field,
        oldValue: oldValue,
        newValue: newValue,
        user: currentUser?.name || 'Sistema',
        date: new Date().toLocaleString('pt-BR')
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    }

    let updatedData = { ...formData, [field]: newValue };

    // Reset sector if division changes
    if (field === 'divisao') {
      updatedData = { ...updatedData, setor: '' };
    }

    setFormData(updatedData);

    const newErrors = { ...errors };
    if (field === 'saram' && newValue) {
      delete newErrors.saram;
    }
    if (field === 'apuradorSaram' && newValue) {
      delete newErrors.apuradorSaram;
    }
    if (field === 'nomeCompleto' && newValue) {
      delete newErrors.nomeCompleto;
    }
    if (field === 'dataInicio' && newValue) {
      delete newErrors.dataInicio;
    }
    setErrors(newErrors);

    validateDates(updatedData);
  };

  const handleFieldBlur = async (type: 'arrolado' | 'apurador', field: 'saram' | 'nome') => {
    let searchVal = '';
    if (type === 'arrolado') {
      searchVal = field === 'saram' ? formData.saram : formData.nomeCompleto;
    } else {
      searchVal = field === 'saram' ? formData.apuradorSaram : formData.apurador;
    }

    if (!searchVal) return;

    try {
      let query = supabase.from('efetivo').select('*');
      if (currentUser?.role === 'Operador' || currentUser?.role === 'Apurador') {
        query = query.eq('divisao', currentUser.divisao);
      }
      if (field === 'saram') {
        query = query.eq('saram', searchVal.trim());
      } else {
        query = query.ilike('nome_completo', searchVal.trim());
      }
      
      const { data, error } = await query.maybeSingle();
      if (error) throw error;

      if (data) {
        // We found a record! Let's fill the fields.
        if (type === 'arrolado') {
          setFormData((prev: any) => ({
            ...prev,
            saram: data.saram,
            nomeCompleto: data.nome_completo,
            posto: data.posto,
            quadro: data.quadro,
            especialidade: data.especialidade || ''
          }));
          
          const changes = [];
          if (formData.saram !== data.saram) changes.push({ field: 'SARAM', old: formData.saram, new: data.saram });
          if (formData.nomeCompleto !== data.nome_completo) changes.push({ field: 'Nome Completo', old: formData.nomeCompleto, new: data.nome_completo });
          if (formData.posto !== data.posto) changes.push({ field: 'Posto', old: formData.posto, new: data.posto });
          if (formData.quadro !== data.quadro) changes.push({ field: 'Quadro', old: formData.quadro, new: data.quadro });
          if (formData.especialidade !== (data.especialidade || '')) changes.push({ field: 'Especialidade', old: formData.especialidade, new: data.especialidade || '' });
          
          if (changes.length > 0) {
            const historyItems = changes.map(c => ({
              field: c.field,
              oldValue: c.old,
              newValue: c.new,
              user: currentUser?.name || 'Sistema',
              date: new Date().toLocaleString('pt-BR')
            }));
            setHistory(prev => [...historyItems, ...prev]);
          }
        } else {
          setFormData((prev: any) => ({
            ...prev,
            apuradorSaram: data.saram,
            apurador: data.nome_completo,
            apuradorPosto: data.posto,
            apuradorQuadro: data.quadro
          }));
          
          const changes = [];
          if (formData.apuradorSaram !== data.saram) changes.push({ field: 'SARAM do Apurador', old: formData.apuradorSaram, new: data.saram });
          if (formData.apurador !== data.nome_completo) changes.push({ field: 'Apurador', old: formData.apurador, new: data.nome_completo });
          if (formData.apuradorPosto !== data.posto) changes.push({ field: 'Posto do Apurador', old: formData.apuradorPosto, new: data.posto });
          if (formData.apuradorQuadro !== data.quadro) changes.push({ field: 'Quadro do Apurador', old: formData.apuradorQuadro, new: data.quadro });
          
          if (changes.length > 0) {
            const historyItems = changes.map(c => ({
              field: c.field,
              oldValue: c.old,
              newValue: c.new,
              user: currentUser?.name || 'Sistema',
              date: new Date().toLocaleString('pt-BR')
            }));
            setHistory(prev => [...historyItems, ...prev]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching details from efetivo:', err);
    }
  };

  const handleClear = () => {
    if (confirm('Deseja realmente limpar todos os campos?')) {
      const emptyForm = {
        patdNumber: `001/DIV/${currentYear}`,
        posto: '1T',
        quadro: 'QOINT',
        saram: '',
        nomeCompleto: '',
        especialidade: '',
        divisao: currentUser && currentUser.role !== 'Administrador' && currentUser.divisao ? currentUser.divisao : 'DOA',
        setor: '',
        apurador: '',
        apuradorPosto: '1T',
        apuradorQuadro: 'QOINT',
        apuradorSaram: '',
        aplicador: '',
        aplicadorPosto: 'TC',
        aplicadorQuadro: 'QOAV',
        aplicadorCargo: '',
        oficioNumero: '',
        protComaer: '',
        dataOficio: '',
        enquadramentoRdaer: '',
        resumoFato: '',
        dataInicio: '',
        dataTermino: '',
        status: 'Em Andamento',
        punicao: 'Em Branco',
        qtdDias: '0',
        dataPunicao: '',
        resumoPunicao: '',
        nGrade: '',
        boletim: '',
        observacoes: '',
        documents: [],
        sigadSecprom: '',
        docArquivado: false
      };
      setFormData(emptyForm);
      setSeqTrigger(prev => prev + 1);
      setErrors({});
      const key = initialData 
        ? (initialData._isPrefilledNew ? 'new_patd_form_memory' : `edit_patd_form_memory_${initialData.id}`)
        : 'new_patd_form_memory';
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_history`);
    }
  };

  const handleSave = () => {
    const newErrors: any = {};
    if (!formData.saram) {
      newErrors.saram = 'O campo SARAM é obrigatório';
    }
    if (!formData.nomeCompleto) {
      newErrors.nomeCompleto = 'O campo Nome Completo é obrigatório';
    }
    if (!formData.dataInicio) {
      newErrors.dataInicio = 'O campo Data de Início é obrigatório';
    }

    // Merge with any existing date sequence validation errors
    const start = formData.dataInicio ? new Date(formData.dataInicio) : null;
    const end = formData.dataTermino ? new Date(formData.dataTermino) : null;
    const punishment = formData.dataPunicao ? new Date(formData.dataPunicao) : null;

    if (start && end && end < start) {
      newErrors.dataTermino = 'Término deve ser posterior ao Início';
    }
    if (start && punishment && punishment < start) {
      newErrors.dataPunicao = 'Punição deve ser posterior ao Início';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    // Save field memory for autocomplete (scoped per logged user email if available)
    const fieldsToRemember = ['nomeCompleto', 'saram', 'especialidade', 'apurador', 'aplicador', 'aplicadorCargo'];
    const userEmail = localStorage.getItem('logged_user_email') || 'anonymous';
    fieldsToRemember.forEach(field => {
      const val = formData[field]?.trim();
      if (val) {
        const key = `patd_field_memory_${userEmail}_${field}`;
        try {
          const saved = localStorage.getItem(key);
          let list: string[] = saved ? JSON.parse(saved) : [];
          if (!list.includes(val)) {
            list.unshift(val);
            list = list.slice(0, 10);
            localStorage.setItem(key, JSON.stringify(list));
          }
        } catch (e) {
          console.error(`Error saving field memory for ${field}:`, e);
        }
      }
    });

    const isNewProcess = !initialData || initialData._isPrefilledNew;
    const hasApurador = formData.apurador && formData.apuradorSaram;
    const isOperatorOrAdmin = currentUser?.role === 'Operador' || currentUser?.role === 'Administrador';

    if (isNewProcess && hasApurador && isOperatorOrAdmin) {
      setIsSaving(true);
      const fetchMail = async () => {
        try {
          const { data, error } = await supabase.from('profiles')
            .select('email')
            .eq('saram', formData.apuradorSaram.trim())
            .maybeSingle();
          if (error) throw error;
          setIsSaving(false);
          const email = data?.email || '';
          setPreviewMailData({
            toEmail: email || 'Sem e-mail cadastrado (verifique o cadastro do militar)',
            toName: formData.apurador,
            patdNumber: formData.patdNumber,
            documentName: formData.documents && formData.documents.length > 0 ? formData.documents[0].name : null,
            senderPhone: currentUser?.telefone || "",
            senderExtension: currentUser?.ramal || "",
            senderEmail: currentUser?.email || ""
          });
          setIsPreviewMailOpen(true);
        } catch (err) {
          setIsSaving(false);
          console.error(err);
          setPreviewMailData({
            toEmail: 'Erro ao buscar e-mail',
            toName: formData.apurador,
            patdNumber: formData.patdNumber,
            documentName: formData.documents && formData.documents.length > 0 ? formData.documents[0].name : null,
            senderPhone: currentUser?.telefone || "",
            senderExtension: currentUser?.ramal || "",
            senderEmail: currentUser?.email || ""
          });
          setIsPreviewMailOpen(true);
        }
      };
      fetchMail();
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      onSave?.({ ...formData, history });
      const key = initialData 
        ? (initialData._isPrefilledNew ? 'new_patd_form_memory' : `edit_patd_form_memory_${initialData.id}`)
        : 'new_patd_form_memory';
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_history`);
      setIsSaving(false);
      setIsPreviewMailOpen(false);
    }, 800);
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

  const optionsQuadro = [
    { value: 'QOAV', label: 'QOAV' },
    { value: 'QOINT', label: 'QOINT' },
    { value: 'QOINF', label: 'QOINF' },
    { value: 'QOAP', label: 'QOAP' },
    { value: 'QOMED', label: 'QOMED' },
    { value: 'QOCON', label: 'QOCON' },
    { value: 'QOFARM', label: 'QOFARM' },
    { value: 'QODENT', label: 'QODENT' },
    { value: 'QOENG', label: 'QOENG' },
    { value: 'QOECTA', label: 'QOECTA' },
    { value: 'QOESUP', label: 'QOESUP' },
    { value: 'QOEARM', label: 'QOEARM' },
    { value: 'QOEAV', label: 'QOEAV' },
    { value: 'QOEA', label: 'QOEA' },
    { value: 'QSS', label: 'QSS' },
    { value: 'QSCON', label: 'QSCON' },
    { value: 'QESA', label: 'QESA' },
    { value: 'QCB', label: 'QCB' },
    { value: 'QCBCON', label: 'QCBCON' },
    { value: 'QTA', label: 'QTA' },
    { value: 'QSD', label: 'QSD' },
  ];

  const filteredDivsList = (divisions.length > 0 ? divisions : [
    { name: 'DOA', description: 'Divisão de Operações Aéreas' },
    { name: 'GLOG-YS', description: 'Grupo de Logística de Pirassununga' },
    { name: 'GSD-YS', description: 'Grupo de Segurança e Defesa de Pirassununga' },
    { name: 'CCAER', description: 'Corpo de Cadetes da Aeronáutica' },
    { name: 'GSAU-YS', description: 'Grupo de Saúde de Pirassununga' },
    { name: 'DEF', description: 'Divisão de Educação Física' },
    { name: 'EC', description: 'Esquadrão de Comando' }
  ]).filter(d => {
    if (!currentUser || currentUser.role === 'Administrador' || currentUser.role === 'Apurador') return true;
    if (initialData && (isSameDivision(d.name, initialData.divisao) || isSameDivision(d.name, formData.divisao))) return true;
    if (formData.divisao && isSameDivision(d.name, formData.divisao)) return true;
    return isSameDivision(d.name, currentUser.divisao);
  });

  const optionsDivisao = filteredDivsList.map(d => ({ value: d.name, label: `${d.name} - ${d.description}` }));

  const selectedDivision = divisions.find(d => isSameDivision(d.name, formData.divisao));
  const optionsSetor = selectedDivision?.sectors?.map(s => ({ value: s, label: s })) || [];

  const optionsStatus = [
    { value: 'Concluído', label: 'Concluído' },
    { value: 'Em Andamento', label: 'Em Andamento' },
    { value: 'Suspenso', label: 'Suspenso' },
    { value: 'Arquivado', label: 'Arquivado' },
  ];

  const optionsPunicao = [
    { value: 'Em Branco', label: 'Em Branco' },
    { value: 'Prisão Fazendo Svç', label: 'Prisão Fazendo Svç' },
    { value: 'Prisão Sem Svç', label: 'Prisão Sem Svç' },
    { value: 'Detenção', label: 'Detenção' },
    { value: 'Repreensão Escrito', label: 'Repreensão Escrito' },
    { value: 'Repreensão Verbal', label: 'Repreensão Verbal' },
    { value: 'Justificado', label: 'Justificado' },
    { value: 'Arquivado', label: 'Arquivado' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 relative">
      {/* Loading Overlay for Spreadsheet Import */}
      <AnimatePresence>
        {isImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-6 p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-lg font-display font-bold text-slate-900 dark:text-white">Importando Planilha</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Lendo e processando os dados do arquivo...</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header and Top Actions */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSave?.(null)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <SectionHeader title={initialData ? "Editar Processo" : "Novo Cadastro"} subtitle="INCLUSÃO DE PROCESSO" />
        </div>
        
        <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-none">
          {currentUser?.role !== 'Apurador' && (
            <motion.button 
              type="button"
              onClick={handleSpreadsheetClick}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-lg shadow-black/5 group shrink-0"
            >
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <UploadCloud size={18} />
              </div>
              <div className="text-left">
                <p className="leading-none">Importar Planilha</p>
                <p className="text-[9px] opacity-60 lowercase font-medium mt-1">Excel (.xlsx) ou .csv</p>
              </div>
            </motion.button>
          )}

          <input 
            type="file" 
            ref={spreadsheetInputRef} 
            onChange={handleSpreadsheetUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all shadow-lg shadow-black/5 group shrink-0"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <HistoryIcon size={18} />
            </div>
            <div className="text-left">
              <p className="leading-none">Histórico</p>
              <p className="text-[9px] opacity-50 lowercase font-medium mt-1">registro de alterações</p>
            </div>
          </motion.button>
          
          <motion.button 
            type="button"
            onClick={handleFileClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all shadow-lg shadow-black/5 group shrink-0 ${formData.documents && formData.documents.length > 0 ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
          >
            <div className={`p-2 rounded-lg transition-all ${formData.documents && formData.documents.length > 0 ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'}`}>
              {formData.documents && formData.documents.length > 0 ? <FileText size={18} /> : <FilePlus size={18} />}
            </div>
            <div className="text-left">
              <p className="leading-none">{formData.documents && formData.documents.length > 0 ? 'PDF Anexado' : 'Inserir Documentos'}</p>
              <p className="text-[9px] opacity-50 lowercase font-medium mt-1">
                {formData.documents && formData.documents.length > 0 ? '1 documento' : 'anexos e arquivos pdf'}
              </p>
            </div>
          </motion.button>
          
          <motion.button 
            type="button"
            onClick={() => setIsDocModalOpen(true)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 group shrink-0"
          >
            <div className="p-2 rounded-lg bg-white/10 text-white group-hover:scale-110 transition-transform">
              <Printer size={18} />
            </div>
            <div className="text-left">
              <p className="leading-none">Gerar Documentos</p>
              <p className="text-[9px] text-indigo-200 lowercase font-medium mt-1">Capa, Despacho e FATD</p>
            </div>
          </motion.button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {/* IDENTIFICAÇÃO DO MILITAR ARROLADO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2rem] bg-white dark:bg-[#0f172b] border border-slate-200 dark:border-slate-800/60 shadow-sm relative z-20 group/card"
          >
            {/* Ambient Background Pattern - Moved to separate container for overflow control */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/card:bg-indigo-500/10 transition-colors" />
            </div>
            
            <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              / Identificação do Militar Arrolado
            </h4>
            
            <div className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Nº do PATD" icon={FileText} value={formData.patdNumber} onChange={handleChange('patdNumber')} disabled={currentUser?.role === 'Apurador'} />
                <SelectField label="Posto" icon={Shield} value={formData.posto} onChange={handleChange('posto')} options={optionsPosto} disabled={currentUser?.role === 'Apurador'} />
                <SelectField label="Quadro" icon={Briefcase} value={formData.quadro} onChange={handleChange('quadro')} options={allowedQuadros} disabled={currentUser?.role === 'Apurador'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AutocompleteInputField label="SARAM *" icon={User} value={formData.saram} onChange={handleChange('saram')} onBlur={() => handleFieldBlur('arrolado', 'saram')} onSearch={() => handleFieldBlur('arrolado', 'saram')} placeholder="0000000" error={errors.saram} fieldName="saram" disabled={currentUser?.role === 'Apurador'} />
                <AutocompleteInputField label="Nome Completo *" icon={User} value={formData.nomeCompleto} onChange={handleChange('nomeCompleto')} onBlur={() => handleFieldBlur('arrolado', 'nome')} onSearch={() => handleFieldBlur('arrolado', 'nome')} placeholder="Digite o nome completo do militar" error={errors.nomeCompleto} fieldName="nomeCompleto" disabled={currentUser?.role === 'Apurador'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AutocompleteInputField label="Especialidade" icon={Briefcase} value={formData.especialidade} onChange={handleChange('especialidade')} fieldName="especialidade" disabled={currentUser?.role === 'Apurador'} />
                <div className="hidden md:block" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Divisão" icon={Building2} value={formData.divisao} onChange={handleChange('divisao')} options={optionsDivisao} disabled={currentUser?.role === 'Apurador'} />
                <SelectField label="Setor" icon={MapPin} value={formData.setor} onChange={handleChange('setor')} options={optionsSetor} placeholder="Selecione o setor..." disabled={currentUser?.role === 'Apurador'} />
              </div>
            </div>
          </motion.div>

          {/* DETALHES DO FATO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[2rem] bg-white dark:bg-[#0f172b] border border-slate-200 dark:border-slate-800/60 shadow-sm relative z-10 group/card"
          >
            {/* Ambient Background Pattern - Moved to separate container for overflow control */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -ml-16 -mb-16 group-hover/card:bg-purple-500/10 transition-colors" />
            </div>

            <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              / Detalhes do Fato
            </h4>
            
            <div className="relative z-10 space-y-6">
              {/* Seção Apurador */}
              <div className="border-b border-slate-100 dark:border-slate-850/50 pb-6 space-y-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">Identificação do Apurador</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <AutocompleteInputField label="Apurador (Encarregado)" icon={User} value={formData.apurador} onChange={handleChange('apurador')} onBlur={() => handleFieldBlur('apurador', 'nome')} onSearch={() => handleFieldBlur('apurador', 'nome')} fieldName="apurador" />
                  </div>
                  <SelectField label="Posto" icon={Shield} value={formData.apuradorPosto} onChange={handleChange('apuradorPosto')} options={optionsPosto} />
                  <SelectField label="Quadro" icon={Briefcase} value={formData.apuradorQuadro} onChange={handleChange('apuradorQuadro')} options={optionsQuadro} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AutocompleteInputField label="SARAM (Apurador)" icon={User} value={formData.apuradorSaram} onChange={handleChange('apuradorSaram')} onBlur={() => handleFieldBlur('apurador', 'saram')} onSearch={() => handleFieldBlur('apurador', 'saram')} placeholder="0000000" error={errors.apuradorSaram} fieldName="apuradorSaram" />
                  <div className="hidden md:block" />
                </div>
              </div>

              {/* Seção Aplicador */}
              <div className="border-b border-slate-100 dark:border-slate-850/50 pb-6 space-y-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">Identificação do Aplicador</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <AutocompleteInputField label="Autoridade Aplicadora" icon={User} value={formData.aplicador} onChange={handleChange('aplicador')} fieldName="aplicador" disabled={currentUser?.role === 'Apurador'} />
                  </div>
                  <SelectField label="Posto (Aplicador)" icon={Shield} value={formData.aplicadorPosto} onChange={handleChange('aplicadorPosto')} options={optionsPosto} disabled={currentUser?.role === 'Apurador'} />
                  <SelectField label="Quadro (Aplicador)" icon={Briefcase} value={formData.aplicadorQuadro} onChange={handleChange('aplicadorQuadro')} options={optionsQuadro} disabled={currentUser?.role === 'Apurador'} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <AutocompleteInputField label="Cargo (Aplicador)" icon={Briefcase} value={formData.aplicadorCargo} onChange={handleChange('aplicadorCargo')} placeholder="Ex: Comandante, Chefe de Divisão, etc." fieldName="aplicadorCargo" disabled={currentUser?.role === 'Apurador'} />
                  </div>
                  <div className="hidden md:block md:col-span-2" />
                </div>
              </div>

              {/* Seção Documentos de Entrada e Enquadramento */}
              <div className="border-b border-slate-100 dark:border-slate-850/50 pb-6 space-y-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider ml-1">Documentação e Enquadramento</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Ofício nº" icon={FileText} value={formData.oficioNumero} onChange={handleChange('oficioNumero')} placeholder="Ex: 123/SEC/2026" />
                  <InputField label="Prot. COMAER nº" icon={FileText} value={formData.protComaer} onChange={handleChange('protComaer')} placeholder="Ex: 60000.000000/2026-00" />
                  <DatePickerField label="Data" value={formData.dataOficio} onChange={handleChange('dataOficio')} />
                </div>
                <TextAreaField label="Enquadramento RDAER" value={formData.enquadramentoRdaer} onChange={handleChange('enquadramentoRdaer')} placeholder="Ex: Artigo 10, item 12, do RDAER (Regulamento de Disciplina da Aeronáutica)..." />
              </div>

              <TextAreaField label="Resumo do Fato" value={formData.resumoFato} onChange={handleChange('resumoFato')} placeholder="Descreva os fatos ocorridos..." />

              <div className="flex flex-wrap md:flex-nowrap gap-6">
                <DatePickerField label="Início *" value={formData.dataInicio} onChange={handleChange('dataInicio')} error={errors.dataInicio} />
                <DatePickerField label="Término" value={formData.dataTermino} onChange={handleChange('dataTermino')} error={errors.dataTermino} />
                <div className="flex-1 min-w-[200px]">
                  <SelectField label="Status" icon={AlertTriangle} value={formData.status} onChange={handleChange('status')} options={optionsStatus} direction="up" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SANÇÃO DISCIPLINAR */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[2rem] bg-white dark:bg-[#0f172b] text-slate-900 dark:text-white shadow-2xl shadow-indigo-200/50 dark:shadow-none relative group/card border border-slate-200 dark:border-slate-800/60"
          >
            {/* Pulsing Core Background - Moved to separate container for overflow control */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] group-hover/card:bg-indigo-500/15 transition-all duration-700" />
            </div>
            
            <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 relative z-10">
              <div className="w-2 h-2 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
              / Sanção Disciplinar
            </h4>
            
            <div className="relative z-10 space-y-6">
              <SelectField label="Punição" icon={Clock} value={formData.punicao} onChange={handleChange('punicao')} options={optionsPunicao} />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Qtd Dias" icon={Clock} value={formData.qtdDias} onChange={handleChange('qtdDias')} />
                <DatePickerField label="Data da Punição" value={formData.dataPunicao} onChange={handleChange('dataPunicao')} error={errors.dataPunicao} />
              </div>

              <TextAreaField label="Resumo da Punição" value={formData.resumoPunicao} onChange={handleChange('resumoPunicao')} />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="N da Grade" icon={FileText} value={formData.nGrade} onChange={handleChange('nGrade')} disabled={currentUser?.role === 'Apurador'} />
                <InputField label="Boletim" icon={FileText} value={formData.boletim} onChange={handleChange('boletim')} disabled={currentUser?.role === 'Apurador'} />
              </div>

              <TextAreaField label="Observações" value={formData.observacoes} onChange={handleChange('observacoes')} />

              {currentUser?.role === 'Administrador' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <InputField 
                    label="SIGAD SECPROM" 
                    icon={FileText} 
                    value={formData.sigadSecprom || ''} 
                    onChange={handleChange('sigadSecprom')} 
                    placeholder="Ex: 60000.xxxxxx/xxxx-xx" 
                  />
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!formData.docArquivado}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const oldValue = formData.docArquivado;
                          const newHistoryItem = {
                            field: 'Doc Arquivado',
                            oldValue: oldValue ? 'Sim' : 'Não',
                            newValue: checked ? 'Sim' : 'Não',
                            user: currentUser?.name || 'Sistema',
                            date: new Date().toLocaleString('pt-BR')
                          };
                          setHistory(prev => [newHistoryItem, ...prev]);
                          setFormData(prev => ({ ...prev, docArquivado: checked }));
                        }}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-750 text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-slate-900"
                      />
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        DOC ARQUIVADO
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {formData.documents && formData.documents.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Documentos Anexados</p>
                  <div className="space-y-1.5">
                    {formData.documents.map((doc: any, docIdx: number) => (
                      <div key={docIdx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 group/doc">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate pr-4">
                          <FileText size={14} className="shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all"
                            title="Visualizar Documento"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const url = new URL(doc.url);
                              url.searchParams.append('download', '');
                              window.open(url.toString(), '_blank');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 dark:hover:bg-sky-500/20 transition-all"
                            title="Baixar Documento"
                          >
                            <Download size={14} />
                          </button>
                          {currentUser?.role !== 'Apurador' && (
                            <button
                              type="button"
                              onClick={() => {
                                const newHistoryItem = {
                                  field: 'Documento PDF',
                                  oldValue: `Removido: ${doc.name}`,
                                  newValue: '—',
                                  user: currentUser?.name || 'Sistema',
                                  date: new Date().toLocaleString('pt-BR')
                                };
                                setHistory((prev: any) => [newHistoryItem, ...prev]);

                                setFormData((prev: any) => ({
                                  ...prev,
                                  documents: prev.documents.filter((_: any, idx: number) => idx !== docIdx)
                                }));
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all"
                              title="Excluir Documento"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <motion.button 
              whileHover={{ scale: 1.02, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-4.5 rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold transition-all shadow-xl shadow-indigo-500/20 dark:shadow-none border border-indigo-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} className="animate-pulse" />
                  {initialData ? 'Salvar Alterações' : 'Salvar Registro'}
                </>
              )}
            </motion.button>

            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSave?.(null)}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
                Voltar
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClear}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-500 hover:text-white transition-all border border-slate-500/20"
              >
                <Eraser size={18} />
                Limpar
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        historyData={history} 
      />
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        data={multipleRowsData} 
        onSelect={(selectedRow) => {
          setFormData((prev: any) => ({
            ...prev,
            ...selectedRow
          }));
          setIsImportModalOpen(false);
        }} 
        onSelectMultiple={async (selectedRows) => {
          setIsSaving(true);
          let successCount = 0;
          try {
            const payload = selectedRows.map(row => {
              const initialHistory = [
                { 
                  field: 'Criação', 
                  oldValue: '—', 
                  newValue: 'Processo Importado via Planilha (Lote)', 
                  user: currentUser?.name || 'Sistema', 
                  date: new Date().toLocaleString('pt-BR') 
                }
              ];

              return {
                patd_number: row.patdNumber || '000/UNKNOWN/2026',
                militar: row.nomeCompleto || row.militar,
                saram: row.saram,
                posto: row.posto,
                especialidade: row.especialidade || '',
                quadro: row.quadro,
                divisao: row.divisao || 'DOA',
                setor: row.setor || '',
                data_inicio: row.dataInicio || new Date().toISOString().split('T')[0],
                data_termino: row.dataTermino || null,
                status: row.status || 'Em Andamento',
                punicao: row.punicao || 'Em Branco',
                dias_punicao: Number(row.qtdDias) || Number(row.diasPunicao) || 0,
                boletim: row.boletim || '',
                resumo_fato: row.resumoFato || '',
                apurador: row.apurador || '',
                apurador_posto: row.apuradorPosto || null,
                apurador_quadro: row.apuradorQuadro || null,
                apurador_saram: row.apuradorSaram || null,
                aplicador: row.aplicador || '',
                aplicador_posto: row.aplicadorPosto || null,
                aplicador_quadro: row.aplicadorQuadro || null,
                aplicador_cargo: row.aplicadorCargo || null,
                oficio_numero: row.oficioNumero || null,
                prot_comaer: row.protComaer || null,
                data_oficio: row.dataOficio || null,
                enquadramento_rdaer: row.enquadramentoRdaer || null,
                delegacao_doc: null,
                documents: [],
                history: initialHistory,
                n_grade: row.nGrade || '',
                observacoes: row.observacoes || '',
                resumo_punicao: row.resumoPunicao || '',
                data_punicao: row.dataPunicao || null
              };
            });

            const { data, error } = await supabase.from('processes').insert(payload).select();
            if (error) throw error;
            successCount = selectedRows.length;
            alert(`${successCount} processos foram criados em lote com sucesso!`);
            
            // Go back to the processes view and reload
            onSave?.(null);
            window.location.reload();
          } catch (err: any) {
            console.error('Error importing batch:', err);
            alert(`Erro ao criar processos em lote: ${err.message || err}`);
          } finally {
            setIsSaving(false);
            setIsImportModalOpen(false);
          }
        }}
      />

      {/* Email Preview Modal */}
      <AnimatePresence>
        {isPreviewMailOpen && previewMailData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewMailOpen(false)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden max-w-xl w-full flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Pré-visualização do E-mail</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Verifique o conteúdo antes de notificar o apurador</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewMailOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
                {/* Header Information */}
                <div className="space-y-2.5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-850">
                  <div className="flex text-xs">
                    <span className="font-semibold text-slate-450 dark:text-slate-500 w-16 uppercase tracking-wider">Para:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{previewMailData.toName} &lt;{previewMailData.toEmail}&gt;</span>
                  </div>
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-850" />
                  <div className="flex text-xs">
                    <span className="font-semibold text-slate-450 dark:text-slate-500 w-16 uppercase tracking-wider">Assunto:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Novo Processo PATD Atribuído - Nº {previewMailData.patdNumber}</span>
                  </div>
                </div>

                {/* Document attachment slot inside preview modal */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-850 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <File size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Documento do E-mail</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                        {previewMailData.documentName || "Nenhum documento anexado"}
                      </p>
                    </div>
                  </div>
                  <div>
                    {previewMailData.documentName ? (
                      <button
                        type="button"
                        onClick={handleModalFileRemove}
                        className="px-3 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Remover
                      </button>
                    ) : (
                      <>
                        <input
                          type="file"
                          ref={modalFileInputRef}
                          onChange={handleModalFileUpload}
                          accept=".pdf"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => modalFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                        >
                          Anexar PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Email content representation */}
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-855 font-sans text-sm text-slate-800 dark:text-slate-200 space-y-4 leading-relaxed">
                  <p>Olá, <strong>{previewMailData.toName || "Apurador"}</strong>,</p>
                  
                  <p>Informamos que um novo Processo de Apuração de Transgressão Disciplinar (PATD), foi aberto e atribuído a você para apuração.</p>
                  
                  <p><strong>Número do PATD:</strong> {previewMailData.patdNumber}</p>
                  
                  {previewMailData.documentName && (
                    <div style={{ margin: '20px 0', textAlign: 'center' }}>
                      <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-md">
                        <Download size={14} />
                        Visualizar Documento Anexo ({previewMailData.documentName})
                      </div>
                    </div>
                  )}

                  <p>Por favor, acesse o sistema GPATD para visualizar os detalhes completos e dar andamento ao processo.</p>
                  
                  <p style={{ margin: '15px 0 10px 0' }}><a href="https://www.gpatdafa.com" target="_blank" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}>www.gpatdafa.com</a></p>
                  
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                    <strong>Telefone:</strong> {previewMailData.senderPhone || "—"}<br/>
                    <strong>Ramal:</strong> {previewMailData.senderExtension || "—"}<br/>
                    <strong>E-mail:</strong> {previewMailData.senderEmail || "—"}
                  </p>
                  
                  <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />
                  <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                    GPATD - Sistema de Apuração de Transgressão Disciplinar
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setIsPreviewMailOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar e Editar
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
                >
                  Confirmar e Enviar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDocModalOpen(false)}
              className="absolute inset-0"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-[85vh] bg-slate-50 dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="p-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Printer className="text-indigo-600 dark:text-indigo-400" size={20} />
                    Gerador de Documentos Oficiais
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    Preenchimento automático do PATD e geração de PDF/Impressão
                  </p>
                </div>
                <button 
                  onClick={() => setIsDocModalOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 bg-white dark:bg-slate-950/50 p-4 border-r border-slate-200 dark:border-slate-850 flex flex-col justify-between shrink-0">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2 mb-2">Selecione o Documento</p>
                    <button
                      onClick={() => setActiveDocTab('capa')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                        activeDocTab === 'capa'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black scale-102'
                          : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <FileText size={16} />
                      Capa do Processo
                    </button>
                    <button
                      onClick={() => setActiveDocTab('delegacao')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                        activeDocTab === 'delegacao'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black scale-102'
                          : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <FileUp size={16} />
                      Portaria de Delegação
                    </button>
                    <button
                      onClick={() => setActiveDocTab('despacho')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                        activeDocTab === 'despacho'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black scale-102'
                          : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <FileText size={16} />
                      Despacho de Abertura
                    </button>
                    <button
                      onClick={() => setActiveDocTab('fatd')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                        activeDocTab === 'fatd'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black scale-102'
                          : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <FileText size={16} />
                      Formulário FATD
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850/50 hidden md:block">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal italic">
                      As informações inseridas no formulário ao lado são injetadas em tempo real nos modelos acima configurados conforme os padrões do Comando da Aeronáutica.
                    </p>
                  </div>
                </div>

                {/* Preview Container */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900/40 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center justify-start min-h-0">
                  {(() => {
                    const formatDateStr = (dateStr: string) => {
                      if (!dateStr) return '___/___/_____';
                      const [year, month, day] = dateStr.split('-');
                      return `${day}/${month}/${year}`;
                    };

                    switch(activeDocTab) {
                      case 'capa':
                        return (
                          <div className="bg-white p-8 shadow-2xl rounded-2xl text-slate-800 border border-slate-200 w-full max-w-[650px] aspect-[1/1.41] flex flex-col justify-between overflow-y-auto my-4" style={{ padding: '10mm 15mm', fontFamily: "'Times New Roman', Times, serif" }}>
                            {/* Outside the bordered frame */}
                            <div className="text-center" style={{ marginBottom: '6mm' }}>
                              <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#000000' }}>Anexo C - Capa</p>
                              <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff0000', margin: '0 0 3px 0', letterSpacing: '0.5px' }}>INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                              <p style={{ fontSize: '11px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                              <p style={{ fontSize: '11px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 31 da Lei nº 12.527, de 2011</p>
                              <p style={{ fontSize: '11px', color: '#ff0000', margin: 0, fontWeight: 500 }}>Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
                            </div>

                            {/* Bordered Frame */}
                            <div className="border-2 border-black p-8 flex flex-col justify-between items-center w-full flex-1" style={{ boxSizing: 'border-box' }}>
                              {/* Top Emblem and Headers */}
                              <div className="w-full text-center flex flex-col items-center">
                                <img src="/brasao.png" width="60" height="60" style={{ marginBottom: '8px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase', color: '#000000' }}>Ministério da Defesa</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase', color: '#000000' }}>Comando da Aeronáutica</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', textDecoration: 'underline', color: '#000000' }}>Academia da Força Aérea</p>
                              </div>

                              {/* Process Title */}
                              <div className="w-full text-center" style={{ marginTop: '5mm', marginBottom: '5mm' }}>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', color: '#000000' }}>PROCESSO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</p>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#000000' }}>Nº <span>{formData.patdNumber || '___/___/_____'}</span></p>
                              </div>

                              {/* Footer/Sections inside Frame */}
                              <div className="w-full" style={{ marginBottom: '2mm' }}>
                                {/* Militar Arrolado */}
                                <div className="text-center" style={{ marginBottom: '8mm' }}>
                                  <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#000000' }}>Militar Arrolado</p>
                                  <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '6px 0 2px 0', textTransform: 'uppercase', color: '#000000' }}>{formData.nomeCompleto || '___________________________'} - {formData.posto} {formData.quadro}</p>
                                  <div className="border-b border-black mt-1 mb-1 w-full"></div>
                                </div>

                                {/* Oficial Apurador */}
                                <div className="text-center">
                                  <p style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#000000' }}>Oficial Apurador</p>
                                  <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '6px 0 2px 0', textTransform: 'uppercase', color: '#000000' }}>{formData.apurador || '___________________________'} - {formData.apuradorPosto} {formData.apuradorQuadro}</p>
                                  <div className="border-b border-black mt-1 mb-1 w-full"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      case 'delegacao':
                        const isAdmin = currentUser?.role === 'Administrador';
                        const isPng = formData.delegacaoDoc?.name?.toLowerCase().endsWith('.png') || formData.delegacaoDoc?.url?.toLowerCase().endsWith('.png');
                        return (
                          <div className="bg-white dark:bg-slate-950 p-8 shadow-2xl rounded-2xl text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 w-full max-w-[650px] min-h-[500px] flex flex-col justify-between overflow-y-auto my-4 relative">
                            <div>
                              <div className="text-center font-bold pb-4 border-b border-slate-100 dark:border-slate-850 mb-6">
                                <h4 className="text-md font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                                  <FileUp className="text-indigo-600 dark:text-indigo-400" size={18} />
                                  Portaria de Delegação de Competência
                                </h4>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                  Documento oficial de atribuição legal para apuração
                                </p>
                              </div>

                              {formData.delegacaoDoc ? (
                                <div className="space-y-6">
                                  {/* Document Info Card */}
                                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <File size={20} />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-[300px]">
                                          {formData.delegacaoDoc.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                          Enviado em {formData.delegacaoDoc.uploadedAt}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <a
                                        href={formData.delegacaoDoc.url}
                                        download={formData.delegacaoDoc.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                                      >
                                        <Download size={14} />
                                        Download
                                      </a>

                                      {isAdmin && (
                                        <button
                                          type="button"
                                          onClick={handleDelegacaoDelete}
                                          className="h-9 w-9 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                          title="Excluir Portaria de Delegação"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Document Preview Frame */}
                                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center overflow-hidden min-h-[300px] relative">
                                    {isPng ? (
                                      <div className="relative inline-block">
                                        <img
                                          src={formData.delegacaoDoc.url}
                                          alt="Portaria de Delegação"
                                          className="max-h-[380px] object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
                                        />
                                        <img
                                          src="/sinete.png"
                                          alt="Carimbo de Delegação"
                                          className="absolute top-2 right-2 w-24 h-auto pointer-events-none drop-shadow-md"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full flex flex-col items-center justify-center gap-4 py-8">
                                        <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-inner">
                                          <FileText size={32} />
                                        </div>
                                        <div className="text-center space-y-1">
                                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Portaria de Delegação em formato PDF</p>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-550">Visualização integrada em PDF não disponível para este dispositivo</p>
                                          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full inline-block mt-2">
                                            ✓ O carimbo (sinete) será inserido automaticamente no canto superior direito de cada página do PDF ao imprimir.
                                          </p>
                                        </div>
                                        <a
                                          href={formData.delegacaoDoc.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-4 py-2 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer mt-2"
                                        >
                                          Abrir em Nova Guia para Visualização
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="py-12 px-6 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
                                  {isAdmin ? (
                                    <>
                                      <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
                                        <UploadCloud size={24} />
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                                        Upload da Portaria de Delegação
                                      </h5>
                                      <p className="text-[10px] text-slate-450 dark:text-slate-550 max-w-[280px] mb-4">
                                        Selecione um arquivo no formato PDF ou imagem PNG. Limite de tamanho máximo de 20MB.
                                      </p>
                                      
                                      <input
                                        type="file"
                                        id="delegacao-upload-input"
                                        accept="image/png, application/pdf"
                                        onChange={handleDelegacaoUpload}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor="delegacao-upload-input"
                                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                                      >
                                        Selecionar Arquivo
                                      </label>
                                    </>
                                  ) : (
                                    <>
                                      <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-650 mb-4">
                                        <FileText size={24} className="opacity-60" />
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">
                                        Nenhuma Portaria Anexada
                                      </h5>
                                    </>
                                  )}
                                  {libraryDocs.length > 0 && (
                                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 w-full">
                                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 text-left flex items-center gap-1.5">
                                        <FileText size={14} className="text-indigo-500" />
                                        Modelos de Portaria na Biblioteca
                                      </h5>
                                      <div className="space-y-2">
                                        {libraryDocs.map((doc) => (
                                          <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-indigo-500/30 transition-all text-left">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-slate-350 truncate pr-2">
                                              <FileText size={14} className="text-rose-500 shrink-0" />
                                              <span className="truncate">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (doc.drive_link) {
                                                    window.open(doc.drive_link, '_blank');
                                                  } else {
                                                    alert('Link do documento não encontrado.');
                                                  }
                                                }}
                                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-bold cursor-pointer"
                                              >
                                                Visualizar
                                              </button>
                                              {isAdmin && !formData.delegacaoDoc && (
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    const newDoc = {
                                                      name: doc.name,
                                                      url: doc.drive_link,
                                                      uploadedAt: new Date().toLocaleDateString('pt-BR')
                                                    };
                                                    
                                                    const newHistoryItem = {
                                                      field: 'Portaria de Delegação',
                                                      oldValue: '—',
                                                      newValue: `Adicionada da Biblioteca: ${doc.name}`,
                                                      user: currentUser?.name || 'Sistema',
                                                      date: new Date().toLocaleString('pt-BR')
                                                    };

                                                    setHistory((prev: any) => [newHistoryItem, ...prev]);
                                                    setFormData((prev: any) => ({
                                                      ...prev,
                                                      delegacaoDoc: newDoc
                                                    }));
                                                  }}
                                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[10px] font-bold cursor-pointer"
                                                >
                                                  Vincular
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850 text-center">
                              <p className="text-[9px] text-slate-400 dark:text-slate-550 leading-relaxed max-w-[400px] mx-auto">
                                A Portaria de Delegação de competência atribui as faculdades legais necessárias ao Oficial Apurador, devendo ser mantida em estrita conformidade com os regulamentos disciplinares militares.
                              </p>
                            </div>
                          </div>
                        );
                      case 'despacho':
                        return (
                          <div className="bg-white shadow-2xl rounded-2xl text-slate-800 border border-slate-200 w-full max-w-[650px] aspect-[1/1.41] text-left flex flex-col justify-between overflow-y-auto my-4 relative" style={{ padding: '20mm 15mm 20mm 20mm', fontFamily: "'Times New Roman', Times, serif" }}>
                            <img src="/sinete.png" style={{ position: 'absolute', top: '10mm', right: '5mm', width: '65mm', height: '46mm' }} />
                            <div>
                              <div className="text-center font-bold" style={{ marginBottom: '2mm' }}>
                                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', margin: '0 0 4px 0' }}>Anexo B - Despacho de Abertura e Designação de Apurador</p>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff0000', margin: '0 0 3px 0', letterSpacing: '0.5px' }}>INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                                <p style={{ fontSize: '9px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                                <p style={{ fontSize: '9px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 31 da Lei nº 12.527, de 2011</p>
                                <p style={{ fontSize: '9px', color: '#ff0000', margin: 0, fontWeight: 500 }}>Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
                              </div>

                              <div className="w-full text-center flex flex-col items-center" style={{ marginBottom: '15px' }}>
                                <img src="/brasao.png" width="50" height="50" style={{ marginBottom: '8px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Ministério da Defesa</p>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Comando da Aeronáutica</p>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: 0, textTransform: 'uppercase', textDecoration: 'underline' }}>Academia da Força Aérea</p>
                              </div>

                              <div className="body-text text-justify" style={{ fontSize: '12px', lineHeight: '1.5', color: '#000000' }}>
                                <p style={{ textIndent: '2.5rem', marginTop: '10px', textAlign: 'justify' }}>
                                  Considerando o disposto no art. 1º da Portaria nº 853/SIJ, de 27 de abril de 2026, publicada no Boletim Interno Ostensivo n º 75, de 29 de abril de 2026, que designa oficiais para apurar transgressão disciplinar e autoridades para aplicar punição disciplinar, no âmbito desta Organização Militar, c/c o item 3.1 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, determino a abertura de Processo de Apuração de Transgressão Disciplinar (PATD), com a finalidade de apurar os fatos relatados no Ofício nº <strong>{formData.oficioNumero || '_______'}</strong>, (Prot. COMAER nº <strong>{formData.protComaer || '_______'}</strong>), de <strong>{formatDateStr(formData.dataOficio)}</strong>.
                                </p>
                                
                                <p style={{ textIndent: '2.5rem', marginTop: '10px', textAlign: 'justify' }}>
                                  Designo o <strong>{formData.apuradorPosto || ''} {formData.apuradorQuadro || ''} {formData.apurador || '___________________________'}</strong> para, na condição de Oficial Apurador, efetuar a apuração da suposta transgressão disciplinar e propor solução à autoridade competente, com estrita observância dos procedimentos previstos na ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021, e no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER); sem prejuízo das demais funções.
                                </p>
                                
                                <p style={{ textIndent: '2.5rem', marginTop: '10px', textAlign: 'justify' }}>
                                  Após apurados os fatos, voltem-me os autos para decisão.
                                </p>
                              </div>

                              <div className="text-right" style={{ marginTop: '15mm', fontSize: '12px', textAlign: 'right', color: '#000000' }}>
                                <p>Pirassununga, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                              </div>
                            </div>
                            
                            <div className="text-center mt-12">
                              <div className="w-56 mx-auto mb-2" style={{ width: '200px', marginLeft: 'auto', marginRight: 'auto', borderBottom: '1px solid #000000' }} />
                              <p className="font-bold uppercase text-[12px]" style={{ color: '#000000' }}>{formData.aplicadorPosto || ''} {formData.aplicadorQuadro || ''} {formData.aplicador || '___________________________'}</p>
                              <p className="text-[9px] uppercase text-slate-400">{formData.aplicadorCargo || 'Autoridade Competente'}</p>
                            </div>
                          </div>
                        );
                      case 'fatd':
                        return (
                          <div className="flex flex-col gap-8 w-full max-w-[650px] my-4">
                            {/* Folha 1 */}
                            <div className="bg-white shadow-2xl rounded-2xl text-slate-800 border border-slate-200 aspect-[1/1.41] text-left flex flex-col justify-between relative" style={{ padding: '20mm 15mm 20mm 20mm', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                              <img src="/sinete.png" style={{ position: 'absolute', top: '10mm', right: '5mm', width: '65mm', height: '46mm' }} />
                              <div>
                                <div className="text-center font-bold" style={{ marginBottom: '2mm' }}>
                                  <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', margin: '0 0 4px 0' }}>Anexo D - Formulário de Apuração de Transgressão Disciplinar (FATD)</p>
                                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#ff0000', margin: '0 0 3px 0', letterSpacing: '0.5px' }}>INFORMAÇÃO PESSOAL – ACESSO RESTRITO</p>
                                  <p style={{ fontSize: '9px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988</p>
                                  <p style={{ fontSize: '9px', color: '#ff0000', margin: '0 0 1px 0', fontWeight: 500 }}>Art. 31 da Lei nº 12.527, de 2011</p>
                                  <p style={{ fontSize: '9px', color: '#ff0000', margin: 0, fontWeight: 500 }}>Arts. 55 a 62 do Decreto nº 7.724, de 2012</p>
                                </div>

                                <div className="w-full text-center flex flex-col items-center" style={{ marginBottom: '15px' }}>
                                  <img src="/brasao.png" width="50" height="50" style={{ marginBottom: '8px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Ministério da Defesa</p>
                                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Comando da Aeronáutica</p>
                                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000', margin: 0, textTransform: 'uppercase', textDecoration: 'underline' }}>Academia da Força Aérea</p>
                                </div>

                                <div className="text-center font-bold uppercase" style={{ margin: '15px 0', fontSize: '12px' }}>
                                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: '#000000' }}>FORMULÁRIO DE APURAÇÃO DE TRANSGRESSÃO DISCIPLINAR</h2>
                                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '3px 0 0 0', color: '#000000' }}>FATD Nº <span style={{ color: '#000000' }}>{formData.patdNumber || '___/___/_____'}</span></h3>
                                </div>

                                {/* Identificação do Militar Arrolado */}
                                <div style={{ border: '1px solid #000000', padding: '6px', fontSize: '11px', marginBottom: '10px', color: '#000000' }}>
                                  <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>IDENTIFICAÇÃO DO MILITAR ARROLADO</p>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>{formData.nomeCompleto || '___________________________'} - {formData.posto} {formData.quadro} {formData.especialidade ? `/ ${formData.especialidade}` : ''}</p>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000000' }}>
                                    <span>SARAM: <strong>{formData.saram || '_______'}</strong></span>
                                    <span>Seção/OM: <strong>{formData.setor || '_______'} / {formData.divisao || '_______'}</strong></span>
                                  </div>
                                </div>

                                {/* Identificação do Oficial Apurador */}
                                <div style={{ border: '1px solid #000000', padding: '6px', fontSize: '11px', marginBottom: '10px', color: '#000000' }}>
                                  <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>IDENTIFICAÇÃO DO OFICIAL APURADOR</p>
                                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', textTransform: 'uppercase' }}>{formData.apurador || '___________________________'} - {formData.apuradorPosto} {formData.apuradorQuadro}</p>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000000' }}>
                                    <span>SARAM: <strong>{formData.apuradorSaram || '_______'}</strong></span>
                                    <span>Seção/OM: <strong>{formData.divisao || '_______'}</strong></span>
                                  </div>
                                </div>

                                <div className="text-center font-bold" style={{ margin: '10px 0', fontSize: '11px', color: '#000000' }}>RELATO DO FATO</div>
                                <div className="body-text text-justify" style={{ fontSize: '11px', lineHeight: '1.5', color: '#000000' }}>
                                  <p style={{ textIndent: '2.5rem', marginTop: '5px', textAlign: 'justify' }}>
                                    Tendo chegado ao meu conhecimento, por intermédio do Ofício nº <strong>{formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>{formData.protComaer || '_______'}</strong>), de <strong>{formatDateStr(formData.dataOficio)}</strong>, que <strong>{formData.resumoFato || '___________________________'}</strong>.
                                  </p>
                                  
                                  <p style={{ textIndent: '2.5rem', marginTop: '10px', textAlign: 'justify' }}>
                                    Em face de o fato narrado, em tese, constituir transgressão disciplinar, podendo ser enquadrada no(s) item(ns) <strong>{formData.enquadramentoRdaer || '_______'}</strong>, do art. 10, do RDAer, encaminho ao senhor cópia da referida ocorrência para, querendo, manifestar-se no prazo de 05 (cinco) dias úteis, podendo constituir advogado e produzir quaisquer provas admitidas em direito para a defesa de seus interesses, em cumprimento ao art. 5º, inciso LV, da Constituição Federal, combinado com o caput do art. 34 do RDAer e com o item 4 da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
                                  </p>
                                </div>

                                <div className="text-right" style={{ marginTop: '10mm', fontSize: '11px', textAlign: 'right', color: '#000000' }}>
                                  <p>Pirassununga, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                                </div>
                              </div>

                              <div className="text-center mt-8">
                                <div className="w-56 mx-auto mb-2" style={{ width: '200px', marginLeft: 'auto', marginRight: 'auto', borderBottom: '1px solid #000000' }} />
                                <p className="font-bold uppercase text-[11px] text-slate-850" style={{ color: '#000000' }}>{formData.apurador || '___________________________'} - {formData.apuradorPosto} {formData.apuradorQuadro}</p>
                                <p className="text-[9px] uppercase text-slate-400">Oficial Apurador</p>
                              </div>

                              <div style={{ position: 'absolute', bottom: '10mm', left: '20mm', fontSize: '10px', fontWeight: 'bold', color: '#000000' }}>
                                PATD Nº <span>{formData.patdNumber || '___/___/_____'}</span>
                              </div>
                            </div>

                            {/* Folha 2 */}
                            <div className="bg-white shadow-2xl rounded-2xl text-slate-800 border border-slate-200 aspect-[1/1.41] text-left flex flex-col justify-between relative" style={{ padding: '20mm 15mm 20mm 20mm', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
                              <img src="/sinete.png" style={{ position: 'absolute', top: '10mm', right: '5mm', width: '65mm', height: '46mm' }} />
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10mm', color: '#000000' }}>
                                  FATD Nº <span style={{ color: '#000000' }}>{formData.patdNumber || '___/___/_____'}</span> - fls. 2/2
                                </div>

                                <div className="text-center font-bold" style={{ marginBottom: '8mm', fontSize: '12px', color: '#000000' }}>
                                  CIENTE DO MILITAR ARROLADO
                                </div>

                                <div className="body-text text-justify" style={{ fontSize: '11px', lineHeight: '1.5', color: '#000000' }}>
                                  <p style={{ textIndent: '2.5rem', textAlign: 'justify', marginBottom: '10px' }}>
                                    Eu, <strong>{formData.nomeCompleto || '___________________________'}</strong>, <strong>{formData.posto} {formData.quadro}</strong> do arrolado, SARAM <strong>{formData.saram || '_______'}</strong>, declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos acima e me foi concedido o prazo de 05 (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para apresentar, por escrito, as minhas alegações de defesa, nos termos do item 5.1.2, “b” da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3 de 9 de julho de 2021.
                                  </p>

                                  <p style={{ textIndent: '2.5rem', textAlign: 'justify', marginBottom: '10px' }}>
                                    Fui informado(a) ainda, que caso não formule minhas alegações de defesa no prazo assinalado, o PATD seguirá o tramite previsto na supracitada ICA 111-6.
                                  </p>

                                  <p style={{ textIndent: '2.5rem', textAlign: 'justify', marginBottom: '10px' }}>
                                    Outrossim, declaro que, neste ato, recebi cópia dos seguintes documentos que dizem respeito ao fato objeto da apuração:
                                  </p>

                                  <ul style={{ listStyleType: 'none', paddingLeft: '2.5rem', margin: '10px 0', lineHeight: '1.5', color: '#000000' }}>
                                    <li style={{ marginBottom: '3px' }}>• Capa;</li>
                                    <li style={{ marginBottom: '3px' }}>• Portaria nº 853/SIJ, de 27 de abril de 2026;</li>
                                    <li style={{ marginBottom: '3px' }}>• Despacho de Abertura do PATD;</li>
                                    <li style={{ marginBottom: '3px' }}>• Ofício nº <strong>{formData.oficioNumero || '_______'}</strong> (Protocolo COMAER nº <strong>{formData.protComaer || '_______'}</strong>), de <strong>{formatDateStr(formData.dataOficio)}</strong>;</li>
                                    <li style={{ marginBottom: '3px' }}>• Formulário de Apuração de Transgressão Disciplinar (FATD) - fls. 1/2;</li>
                                    <li style={{ marginBottom: '3px' }}>• Ficha Individual do Militar Arrolado</li>
                                  </ul>
                                </div>

                                <div className="text-left" style={{ marginTop: '10mm', fontSize: '11px', textAlign: 'left', color: '#000000' }}>
                                  <p>Pirassununga, _______________________.</p>
                                </div>
                              </div>

                              <div className="text-center mt-8">
                                <div className="w-56 mx-auto mb-2" style={{ width: '200px', marginLeft: 'auto', marginRight: 'auto', borderBottom: '1px solid #000000' }} />
                                <p className="font-bold uppercase text-[11px] text-slate-850" style={{ color: '#000000' }}>{formData.nomeCompleto || '___________________________'} - {formData.posto} {formData.quadro}</p>
                                <p className="text-[9px] uppercase text-slate-400">Militar Arrolado</p>
                              </div>

                              <div style={{ position: 'absolute', bottom: '10mm', left: '20mm', fontSize: '10px', fontWeight: 'bold', color: '#000000' }}>
                                PATD Nº <span>{formData.patdNumber || '___/___/_____'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row justify-between gap-4 shrink-0">
                <button
                  type="button"
                  onClick={printAllDocuments}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Imprimir Todo o Processo (3 Páginas)
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => printDocument(activeDocTab)}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    Imprimir Documento Atual
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(false)}
                    className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


