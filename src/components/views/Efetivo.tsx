import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Search, 
  Database, 
  RefreshCw,
  X,
  Edit2,
  FilePlus,
  UserPlus,
  ChevronDown,
  UserCog
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

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
        className="flex items-center gap-2 h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-[10px] uppercase tracking-wider shadow-sm pointer-events-auto"
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

interface EfetivoRecord {
  saram: string;
  posto: string;
  quadro: string;
  especialidade?: string;
  nome_completo: string;
  divisao?: string;
  email?: string;
  telefone?: string;
  ramal?: string;
  created_at?: string;
  updated_at?: string;
}

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EfetivoRecord | null;
  onSave: (updatedRecord: EfetivoRecord) => Promise<void>;
  currentUser?: any;
  isNew: boolean;
}

function EditRecordModal({ isOpen, onClose, record, onSave, currentUser, isNew }: EditRecordModalProps) {
  const [formData, setFormData] = useState<EfetivoRecord>({
    saram: '',
    posto: '',
    quadro: '',
    especialidade: '',
    nome_completo: '',
    divisao: '',
    email: '',
    telefone: '',
    ramal: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        saram: record.saram || '',
        posto: record.posto || '',
        quadro: record.quadro || '',
        especialidade: record.especialidade || '',
        nome_completo: record.nome_completo || '',
        divisao: record.divisao || '',
        email: record.email || '',
        telefone: record.telefone || '',
        ramal: record.ramal || ''
      });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">
              {isNew ? 'Adicionar Militar' : 'Editar Militar'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 hover:text-rose-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                {isNew ? 'SARAM *' : 'SARAM (Não editável)'}
              </label>
              <input
                type="text"
                required
                maxLength={7}
                value={formData.saram}
                disabled={!isNew}
                onChange={e => setFormData(prev => ({ ...prev, saram: e.target.value.replace(/\D/g, '') }))}
                className={`w-full h-11 px-4 rounded-xl border text-sm font-semibold ${
                  !isNew
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.nome_completo}
                onChange={e => setFormData(prev => ({ ...prev, nome_completo: e.target.value.toUpperCase() }))}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Posto *</label>
                <input
                  type="text"
                  required
                  value={formData.posto}
                  onChange={e => setFormData(prev => ({ ...prev, posto: e.target.value.toUpperCase() }))}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Quadro *</label>
                <input
                  type="text"
                  required
                  value={formData.quadro}
                  onChange={e => setFormData(prev => ({ ...prev, quadro: e.target.value.toUpperCase() }))}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Especialidade</label>
                <input
                  type="text"
                  value={formData.especialidade || ''}
                  onChange={e => setFormData(prev => ({ ...prev, especialidade: e.target.value.toUpperCase() }))}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Divisão *</label>
              <input
                type="text"
                required
                disabled={currentUser?.role === 'Operador'}
                value={formData.divisao || ''}
                onChange={e => setFormData(prev => ({ ...prev, divisao: e.target.value.toUpperCase() }))}
                className={`w-full h-11 px-4 rounded-xl border text-sm font-semibold ${
                  currentUser?.role === 'Operador'
                    ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.telefone || ''}
                  onChange={e => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Ramal</label>
                <input
                  type="text"
                  value={formData.ramal || ''}
                  onChange={e => setFormData(prev => ({ ...prev, ramal: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function Efetivo({ currentUser, onNewPATDFromEfetivo, onNewUserFromEfetivo }: { currentUser: any, onNewPATDFromEfetivo?: (record: EfetivoRecord) => void, onNewUserFromEfetivo?: (record: EfetivoRecord) => void }) {
  const [records, setRecords] = useState<EfetivoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivisao, setFilterDivisao] = useState('');
  const [filterPosto, setFilterPosto] = useState('');

  const optionsDivisao = useMemo(() => Array.from(new Set(records.map(r => r.divisao).filter(Boolean))).sort(), [records]);
  const optionsPosto = useMemo(() => Array.from(new Set(records.map(r => r.posto).filter(Boolean))).sort(), [records]);

  const [modalState, setModalState] = useState<{ isOpen: boolean; record: EfetivoRecord | null; isNew: boolean }>({
    isOpen: false,
    record: null,
    isNew: false
  });
  
  // Upload States
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch personnel database
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('efetivo').select('*');
      if (currentUser?.role === 'Operador' || currentUser?.role === 'Apurador') {
        query = query.eq('divisao', currentUser.divisao);
      }
      const { data, error } = await query.order('nome_completo', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching efetivo records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Download Template
  const downloadTemplate = () => {
    const headers = ['Saram', 'Posto', 'Quadro', 'Especialidade', 'Nome Completo', 'Divisao', 'Email', 'Telefone', 'Ramal'];
    const exampleRow = {
      'Saram': '6543210',
      'Posto': '1T',
      'Quadro': 'QOINT',
      'Especialidade': 'BEI',
      'Nome Completo': 'FULANO DE TAL',
      'Divisao': currentUser?.divisao || 'DOA',
      'Email': 'fulano.tal@fab.mil.br',
      'Telefone': '(19) 99999-9999',
      'Ramal': '1234'
    };

    const worksheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Efetivo_Modelo');
    XLSX.writeFile(workbook, 'modelo_efetivo.xlsx');
  };

  // Drag & Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls' && fileExt !== 'csv') {
      setUploadMessage({ type: 'error', text: 'Formato de arquivo inválido. Use apenas .xlsx, .xls ou .csv.' });
      return;
    }

    setIsImporting(true);
    setUploadMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          setUploadMessage({ type: 'error', text: 'A planilha está vazia.' });
          setIsImporting(false);
          return;
        }

        // Validate required headers (case-insensitive checks)
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow);
        
        const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-]/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const mappedKeys = {
          saram: keys.find(k => normalize(k) === 'saram'),
          posto: keys.find(k => normalize(k) === 'posto'),
          quadro: keys.find(k => normalize(k) === 'quadro'),
          especialidade: keys.find(k => normalize(k) === 'especialidade'),
          nomeCompleto: keys.find(k => normalize(k) === 'nomecompleto'),
          divisao: keys.find(k => normalize(k) === 'divisao' || normalize(k) === 'division'),
          email: keys.find(k => normalize(k) === 'email'),
          telefone: keys.find(k => normalize(k) === 'telefone' || normalize(k) === 'phone' || normalize(k) === 'tel'),
          ramal: keys.find(k => normalize(k) === 'ramal' || normalize(k) === 'extension' || normalize(k) === 'ram')
        };

        if (!mappedKeys.saram || !mappedKeys.posto || !mappedKeys.quadro || !mappedKeys.nomeCompleto) {
          setUploadMessage({ 
            type: 'error', 
            text: 'Cabeçalhos inválidos. A planilha deve conter as colunas: Saram, Posto, Quadro, Nome Completo (Divisao, Especialidade, Email, Telefone e Ramal são opcionais)' 
          });
          setIsImporting(false);
          return;
        }

        const payload = jsonData.map(row => {
          const rowDiv = mappedKeys.divisao ? String(row[mappedKeys.divisao!] || '').trim() : '';
          const finalDiv = currentUser?.role === 'Operador' ? currentUser.divisao : (rowDiv || currentUser?.divisao || '');
          return {
            saram: String(row[mappedKeys.saram!] || '').trim(),
            posto: String(row[mappedKeys.posto!] || '').trim(),
            quadro: String(row[mappedKeys.quadro!] || '').trim(),
            especialidade: mappedKeys.especialidade ? String(row[mappedKeys.especialidade!] || '').trim() : null,
            nome_completo: String(row[mappedKeys.nomeCompleto!] || '').trim(),
            divisao: finalDiv,
            email: mappedKeys.email ? String(row[mappedKeys.email!] || '').trim() : null,
            telefone: mappedKeys.telefone ? String(row[mappedKeys.telefone!] || '').trim() : null,
            ramal: mappedKeys.ramal ? String(row[mappedKeys.ramal!] || '').trim() : null
          };
        }).filter(row => row.saram && row.nome_completo);

        if (payload.length === 0) {
          setUploadMessage({ type: 'error', text: 'Nenhum registro válido encontrado.' });
          setIsImporting(false);
          return;
        }

        // Upsert to database
        const { error } = await supabase.from('efetivo').upsert(payload, { onConflict: 'saram' });
        if (error) throw error;

        setUploadMessage({ 
          type: 'success', 
          text: `${payload.length} registro(s) importado(s) ou atualizado(s) com sucesso!` 
        });
        
        // Refresh records list
        fetchRecords();
      } catch (err: any) {
        console.error('Error importing efetivo:', err);
        setUploadMessage({ type: 'error', text: `Erro na importação: ${err.message || err}` });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteRecord = async (saram: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este militar do Efetivo?')) return;
    try {
      const { error } = await supabase.from('efetivo').delete().eq('saram', saram);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.saram !== saram));
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert('Erro ao excluir registro.');
    }
  };

  const handleSaveRecord = async (updated: EfetivoRecord) => {
    try {
      const isNew = modalState.isNew;
      if (isNew) {
        if (updated.saram.length !== 7) {
          alert('O SARAM deve conter exatamente 7 dígitos.');
          throw new Error('SARAM inválido');
        }
        if (records.some(r => r.saram === updated.saram)) {
          alert('Este SARAM já está cadastrado no efetivo.');
          throw new Error('SARAM duplicado');
        }
        const { error } = await supabase
          .from('efetivo')
          .insert({
            saram: updated.saram,
            nome_completo: updated.nome_completo,
            posto: updated.posto,
            quadro: updated.quadro,
            especialidade: updated.especialidade || null,
            divisao: updated.divisao || currentUser?.divisao || null,
            email: updated.email || null,
            telefone: updated.telefone || null,
            ramal: updated.ramal || null
          });

        if (error) throw error;
        setRecords(prev => [updated, ...prev]);
      } else {
        const { error } = await supabase
          .from('efetivo')
          .update({
            nome_completo: updated.nome_completo,
            posto: updated.posto,
            quadro: updated.quadro,
            especialidade: updated.especialidade || null,
            divisao: updated.divisao || null,
            email: updated.email || null,
            telefone: updated.telefone || null,
            ramal: updated.ramal || null,
            updated_at: new Date().toISOString()
          })
          .eq('saram', updated.saram);

        if (error) throw error;
        setRecords(prev => prev.map(r => r.saram === updated.saram ? updated : r));
      }
    } catch (err: any) {
      console.error('Error saving efetivo record:', err);
      alert(err.message || 'Erro ao salvar registro.');
      throw err;
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (filterDivisao) {
      result = result.filter(r => r.divisao === filterDivisao);
    }
    if (filterPosto) {
      result = result.filter(r => r.posto === filterPosto);
    }

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.nome_completo.toLowerCase().includes(low) ||
        r.saram.toLowerCase().includes(low) ||
        r.posto.toLowerCase().includes(low) ||
        r.quadro.toLowerCase().includes(low) ||
        (r.especialidade || '').toLowerCase().includes(low) ||
        (r.divisao || '').toLowerCase().includes(low)
      );
    }
    return result;
  }, [records, searchTerm, filterDivisao, filterPosto]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Efetivo</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-black opacity-60">
            Base de dados do Efetivo para preenchimento automático
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar militar ou SARAM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 pl-10 pr-4 text-sm focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-white pointer-events-auto shadow-sm"
            />
          </div>

          {(currentUser?.role === 'Administrador' || currentUser?.role === 'Visualizador') && (
            <>
              <FilterDropdown label="Divisão" value={filterDivisao} options={optionsDivisao} onChange={setFilterDivisao} />
              <FilterDropdown label="Posto" value={filterPosto} options={optionsPosto} onChange={setFilterPosto} />
            </>
          )}

          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 text-slate-200 hover:bg-slate-850 dark:hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
          >
            <Download size={16} />
            Modelo Planilha
          </button>

          <button 
            onClick={() => setModalState({
              isOpen: true,
              isNew: true,
              record: {
                saram: '',
                posto: '1T',
                quadro: 'QOINT',
                especialidade: '',
                nome_completo: '',
                divisao: currentUser?.divisao || ''
              }
            })}
            className="flex items-center gap-2 h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
          >
            <UserPlus size={16} />
            Adicionar Militar
          </button>
        </div>
      </header>

      {/* Upload area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`py-12 px-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group/drop bg-white dark:bg-slate-900 ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-lg shadow-indigo-500/5' 
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
            }`}
          >
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-indigo-50 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm group-hover/drop:scale-110 transition-transform">
              {isImporting ? <RefreshCw size={24} className="animate-spin" /> : <UploadCloud size={24} />}
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Arraste a planilha de Efetivo aqui
            </h4>
            <p className="text-[10px] text-slate-455 dark:text-slate-500">
              Ou clique para selecionar. Aceita arquivos .xlsx, .xls ou .csv.
            </p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden" 
            />
          </div>

          {uploadMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-start gap-3 border text-xs font-semibold ${
                uploadMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455'
              }`}
            >
              {uploadMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span>{uploadMessage.text}</span>
            </motion.div>
          )}
        </div>

        {/* Database List */}
        <div className="lg:col-span-2">
          <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative min-h-[300px]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-left">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-8">SARAM</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Posto/Quadro</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Especialidade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nome Completo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Divisão</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">E-mail</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Telefone</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ramal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pr-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Carregando registros...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        Nenhum militar cadastrado.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.saram} className="hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-colors">
                        <td className="px-6 py-4 pl-8 font-mono font-bold text-slate-900 dark:text-white text-xs">{record.saram}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                          {record.posto} {record.quadro}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                          {record.especialidade || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{record.nome_completo}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase">{record.divisao || '—'}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">{record.email || '—'}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350 whitespace-nowrap">{record.telefone || '—'}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">{record.ramal || '—'}</td>
                        <td className="px-6 py-4 pr-8 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onNewPATDFromEfetivo && (
                              <button
                                onClick={() => onNewPATDFromEfetivo(record)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                title="Criar Novo PATD"
                              >
                                <FilePlus size={14} />
                              </button>
                            )}
                            {onNewUserFromEfetivo && (
                              <button
                                onClick={() => onNewUserFromEfetivo(record)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                title="Criar Apurador"
                              >
                                <UserCog size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => setModalState({ isOpen: true, record: record, isNew: false })}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Editar Militar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.saram)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Remover Militar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-right text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Total de registros: {filteredRecords.length}
            </div>
          </div>
        </div>
      </div>

      <EditRecordModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false, record: null, isNew: false })} 
        record={modalState.record} 
        onSave={handleSaveRecord} 
        currentUser={currentUser}
        isNew={modalState.isNew}
      />
    </div>
  );
}
