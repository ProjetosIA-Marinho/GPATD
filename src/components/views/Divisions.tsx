import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  X, 
  Upload,
  ShieldCheck,
  Search,
  Loader2,
  MoreVertical,
  Edit2,
  FileText,
  CheckCircle2,
  Check,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isSameDivision } from '../../utils/divisionUtils';
import DivisionIcon from '../common/DivisionIcon';

export interface Division {
  id: string;
  name: string;
  description: string;
  image?: string;
  sectors?: string[];
}

interface DivisionsProps {
  divisions: Division[];
  setDivisions: React.Dispatch<React.SetStateAction<Division[]>>;
  isAdmin?: boolean;
  globalSearchTerm?: string;
  currentUser?: any;
}

export default function Divisions({ divisions, setDivisions, isAdmin = true, globalSearchTerm = '', currentUser }: DivisionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSectorName, setNewSectorName] = useState<{[key: string]: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isSavingSector, setIsSavingSector] = useState<string | null>(null);
  
  // State for inline sector editing
  const [editingSector, setEditingSector] = useState<{ divisionId: string; index: number; value: string } | null>(null);
  const editSectorInputRef = useRef<HTMLInputElement>(null);

  // State for sector deletion confirmation modal
  const [deletingSector, setDeletingSector] = useState<{ divisionId: string; index: number; name: string; divisionName: string } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (editingSector && editSectorInputRef.current) {
      editSectorInputRef.current.focus();
      editSectorInputRef.current.select();
    }
  }, [editingSector]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sectors: [] as string[]
  });

  const handleOpenModal = (division?: Division) => {
    if (!isAdmin) return;
    if (division) {
      setEditingDivision(division);
      setFormData({
        name: division.name,
        description: division.description,
        image: division.image || '',
        sectors: division.sectors || []
      });
    } else {
      setEditingDivision(null);
      setFormData({ name: '', description: '', image: '', sectors: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDivision(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('divisions')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('divisions')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image: publicUrl }));
      setToast({ message: 'Imagem carregada com sucesso!', type: 'success' });
    } catch (error) {
      console.error('Error uploading image: ', error);
      setToast({ message: 'Erro ao fazer upload da imagem.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin || !formData.name) return;

    try {
      if (editingDivision) {
        const { error } = await supabase.from('divisions').update(formData).eq('id', editingDivision.id);
        if (error) throw error;
        setDivisions(prev => prev.map(d => d.id === editingDivision.id ? { ...d, ...formData } : d));
        setToast({ message: `Divisão ${formData.name} atualizada com sucesso!`, type: 'success' });
      } else {
        const { data, error } = await supabase.from('divisions').insert(formData).select().single();
        if (error) throw error;
        if (data) setDivisions(prev => [...prev, data]);
        setToast({ message: `Divisão ${formData.name} criada com sucesso!`, type: 'success' });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving division:', err);
      setToast({ message: 'Erro ao salvar divisão.', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza que deseja excluir esta divisão? Isso pode afetar processos vinculados.')) {
      try {
        const { error } = await supabase.from('divisions').delete().eq('id', id);
        if (error) throw error;
        setDivisions(prev => prev.filter(d => d.id !== id));
        setToast({ message: 'Divisão excluída com sucesso.', type: 'info' });
      } catch (err) {
        console.error('Error deleting division:', err);
        setToast({ message: 'Erro ao excluir divisão.', type: 'error' });
      }
    }
  };

  const canManageSectors = (division: Division) => {
    if (isAdmin) return true;
    if (currentUser?.role === 'Operador' && isSameDivision(division.name, currentUser?.divisao)) return true;
    return false;
  };

  const handleAddSector = async (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId);
    if (!division || !canManageSectors(division)) return;

    const sectorName = (newSectorName[divisionId] || '').trim();
    if (!sectorName) return;

    const existingSectors = division.sectors || [];
    if (existingSectors.some(s => s.trim().toLowerCase() === sectorName.toLowerCase())) {
      setToast({ message: `O setor "${sectorName}" já existe nesta divisão.`, type: 'error' });
      return;
    }
    
    const newSectors = [...existingSectors, sectorName];

    try {
      setIsSavingSector(divisionId);
      const { error } = await supabase.from('divisions').update({ sectors: newSectors }).eq('id', divisionId);
      if (error) throw error;
      
      setDivisions(prev => prev.map(d => d.id === divisionId ? { ...d, sectors: newSectors } : d));
      setNewSectorName(prev => ({ ...prev, [divisionId]: '' }));
      setToast({ message: `Setor "${sectorName}" adicionado com sucesso!`, type: 'success' });
    } catch (err) {
      console.error('Error adding sector:', err);
      setToast({ message: 'Erro ao adicionar setor no banco de dados.', type: 'error' });
    } finally {
      setIsSavingSector(null);
    }
  };

  const handleStartEditSector = (divisionId: string, index: number, currentValue: string) => {
    setEditingSector({
      divisionId,
      index,
      value: currentValue
    });
  };

  const handleSaveEditSector = async () => {
    if (!editingSector) return;
    const { divisionId, index, value } = editingSector;
    const cleanValue = value.trim();

    if (!cleanValue) {
      setToast({ message: 'O nome do setor não pode estar vazio.', type: 'error' });
      return;
    }

    const division = divisions.find(d => d.id === divisionId);
    if (!division || !canManageSectors(division)) {
      setEditingSector(null);
      return;
    }

    const currentSectors = division.sectors || [];
    const originalValue = currentSectors[index];

    // If unchanged, simply exit edit mode
    if (originalValue === cleanValue) {
      setEditingSector(null);
      return;
    }

    // Check duplicate
    if (currentSectors.some((s, i) => i !== index && s.trim().toLowerCase() === cleanValue.toLowerCase())) {
      setToast({ message: `Já existe outro setor chamado "${cleanValue}" nesta divisão.`, type: 'error' });
      return;
    }

    const newSectors = [...currentSectors];
    newSectors[index] = cleanValue;

    try {
      setIsSavingSector(divisionId);
      const { error } = await supabase.from('divisions').update({ sectors: newSectors }).eq('id', divisionId);
      if (error) throw error;

      setDivisions(prev => prev.map(d => d.id === divisionId ? { ...d, sectors: newSectors } : d));
      setEditingSector(null);
      setToast({ message: `Setor alterado para "${cleanValue}" com sucesso!`, type: 'success' });
    } catch (err) {
      console.error('Error updating sector:', err);
      setToast({ message: 'Erro ao atualizar setor.', type: 'error' });
    } finally {
      setIsSavingSector(null);
    }
  };

  const handleConfirmDeleteSector = async () => {
    if (!deletingSector) return;
    const { divisionId, index, name } = deletingSector;

    const division = divisions.find(d => d.id === divisionId);
    if (!division || !canManageSectors(division)) {
      setDeletingSector(null);
      return;
    }
    
    const newSectors = [...(division.sectors || [])];
    newSectors.splice(index, 1);

    try {
      setIsSavingSector(divisionId);
      const { error } = await supabase.from('divisions').update({ sectors: newSectors }).eq('id', divisionId);
      if (error) throw error;
      
      setDivisions(prev => prev.map(d => d.id === divisionId ? { ...d, sectors: newSectors } : d));
      setDeletingSector(null);
      setToast({ message: `Setor "${name}" excluído com sucesso.`, type: 'info' });
    } catch (err) {
      console.error('Error removing sector:', err);
      setToast({ message: 'Erro ao remover setor.', type: 'error' });
    } finally {
      setIsSavingSector(null);
    }
  };

  const isOperator = currentUser?.role === 'Operador';
  const isViewer = currentUser?.role === 'Visualizador' || (!isAdmin && !isOperator);

  const filteredDivisions = divisions.filter(d => {
    if (isOperator && !isSameDivision(d.name, currentUser?.divisao)) {
      return false;
    }
    
    const effectiveSearch = globalSearchTerm || searchTerm;
    return (
      d.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      d.description.toLowerCase().includes(effectiveSearch.toLowerCase())
    );
  });

  return (
    <div id="divisions-view" className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'bg-rose-500/90 border-rose-400 text-white shadow-rose-500/20'
                : 'bg-indigo-600/90 border-indigo-500 text-white shadow-indigo-500/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="shrink-0" />}
            {toast.type === 'error' && <AlertTriangle size={18} className="shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="shrink-0" />}
            <span className="text-xs font-bold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-indigo-600 dark:text-indigo-400" />
            {isOperator ? `Divisão & Setores: ${currentUser?.divisao || 'Sua Divisão'}` : 'Gerenciamento de Divisões'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isOperator 
              ? 'Adicione, edite e gerencie todos os setores subordinados à sua divisão.' 
              : 'Administre as organizações, divisões e sub-unidades do sistema.'}
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-display uppercase tracking-widest text-xs cursor-pointer"
          >
            <Plus size={18} />
            Nova Divisão
          </button>
        )}
      </header>

      {/* Role Notice Banner */}
      {isOperator && (
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 text-sm">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Layers size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Painel do Operador</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Você tem permissão para <strong>adicionar</strong>, <strong>editar o nome</strong> ou <strong>excluir</strong> os setores vinculados à divisão <strong>{currentUser?.divisao}</strong>.
            </p>
          </div>
        </div>
      )}

      {isViewer && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm">
          <ShieldCheck size={20} className="shrink-0" />
          <p>Apenas administradores podem criar ou excluir divisões. Seu acesso atual é de visualização.</p>
        </div>
      )}

      {/* Search Bar (Only when multiple divisions shown) */}
      {!isOperator && (
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Pesquisar divisões por nome ou sigla..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 font-medium"
          />
        </div>
      )}

      {/* Grid of Divisions */}
      <div className={`grid gap-8 ${isOperator ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {filteredDivisions.map((division) => {
          const userCanManage = canManageSectors(division);
          const isCurrentSaving = isSavingSector === division.id;

          return (
            <motion.div 
              key={division.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative flex flex-col rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-5 min-h-[440px] overflow-hidden"
            >
              {/* Corner Fold Star Ribbon */}
              <div className="absolute top-0 right-0 z-20 pointer-events-none">
                <div className="relative">
                  <div 
                    className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500" 
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} 
                  />
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-black leading-none text-white">★</span>
                </div>
              </div>

              {/* Float Edit/Delete Three-dot Menu for Admins */}
              {isAdmin && (
                <div className="absolute top-10 right-3 z-20">
                  <button 
                    onClick={() => setActiveDropdownId(activeDropdownId === division.id ? null : division.id)}
                    className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 cursor-pointer"
                    title="Opções da divisão"
                  >
                    <MoreVertical size={14} />
                  </button>
                  
                  {activeDropdownId === division.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                      <div className="absolute top-10 right-0 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 flex flex-col min-w-32 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => {
                            setActiveDropdownId(null);
                            handleOpenModal(division);
                          }}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors w-full text-left cursor-pointer"
                        >
                          <Edit2 size={14} className="text-slate-400" />
                          Editar Divisão
                        </button>
                        <button 
                          onClick={() => {
                            setActiveDropdownId(null);
                            handleDelete(division.id);
                          }}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors w-full text-left cursor-pointer"
                        >
                          <Trash2 size={14} className="text-rose-500" />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full flex-1">
                {/* Centered Circular Avatar with Division Image or icon */}
                <div className="flex flex-col items-center mt-1 mb-3 relative shrink-0">
                  <div className="relative">
                    <div className="w-18 h-18 rounded-full border-[3px] border-slate-50 dark:border-slate-850 shadow-inner bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-650 dark:text-slate-400 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                      <DivisionIcon division={division.name} image={division.image} size={28} />
                    </div>
                    {/* Overlapping Bottom Badge */}
                    <div className="w-6 h-6 rounded-full border border-white dark:border-slate-900 shadow-md bg-white dark:bg-slate-800 flex items-center justify-center absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/4 z-10 text-indigo-600 dark:text-indigo-400">
                      <DivisionIcon division={division.name} size={12} />
                    </div>
                  </div>
                </div>

                {/* Center aligned Name and description */}
                <div className="text-center mt-2.5 mb-4 shrink-0">
                  <h4 className="font-display font-bold text-slate-900 dark:text-white uppercase text-base tracking-tight line-clamp-1">{division.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[260px] mx-auto">{division.description || 'Divisão Cadastrada'}</p>
                </div>

                {/* Metrics Rows */}
                <div className="space-y-2.5 px-1 mb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Building2 size={12} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Sub-Unidades</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{(division.sectors?.length || 0)} setores</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText size={12} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Sigla / Ref</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{division.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Status</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">Ativa</p>
                    </div>
                  </div>
                </div>

                {/* Sectors Content Section */}
                <div className="flex-1 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Setores Cadastrados</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400">
                        {division.sectors?.length || 0}
                      </span>
                    </h4>
                    {userCanManage && (
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        Passe o mouse para editar/excluir
                      </span>
                    )}
                  </div>

                  {/* Sectors List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 mb-3 max-h-48 min-h-[90px]">
                    {division.sectors && division.sectors.length > 0 ? (
                      division.sectors.map((sector, sIdx) => {
                        const isEditingThis = editingSector?.divisionId === division.id && editingSector?.index === sIdx;

                        if (isEditingThis) {
                          return (
                            <div 
                              key={sIdx} 
                              className="flex items-center gap-1.5 p-1 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 animate-in fade-in duration-150"
                            >
                              <input 
                                ref={editSectorInputRef}
                                type="text"
                                value={editingSector.value}
                                onChange={(e) => setEditingSector(prev => prev ? { ...prev, value: e.target.value } : null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditSector();
                                  if (e.key === 'Escape') setEditingSector(null);
                                }}
                                className="flex-1 h-7 px-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Nome do setor..."
                              />
                              <button 
                                onClick={handleSaveEditSector}
                                disabled={isCurrentSaving}
                                className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                                title="Salvar alteração (Enter)"
                              >
                                <Check size={13} />
                              </button>
                              <button 
                                onClick={() => setEditingSector(null)}
                                className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                title="Cancelar (Esc)"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={sIdx} 
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750 group/sector transition-all"
                          >
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate pr-2" title={sector}>
                              {sector}
                            </span>
                            
                            {userCanManage && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/sector:opacity-100 transition-opacity shrink-0">
                                <button 
                                  onClick={() => handleStartEditSector(division.id, sIdx, sector)}
                                  className="h-6 w-6 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-indigo-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Editar nome do setor"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button 
                                  onClick={() => setDeletingSector({
                                    divisionId: division.id,
                                    index: sIdx,
                                    name: sector,
                                    divisionName: division.name
                                  })}
                                  className="h-6 w-6 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-rose-600 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Excluir setor"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-60 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Nenhum setor cadastrado</p>
                        {userCanManage && <p className="text-[9px] text-slate-400 mt-0.5">Use o campo abaixo para cadastrar o primeiro.</p>}
                      </div>
                    )}
                  </div>

                  {/* Add Sector Input */}
                  {userCanManage && (
                    <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="relative group/input flex items-center gap-1.5">
                        <input 
                          type="text"
                          placeholder="Novo setor (ex: Seção de Pessoal)..."
                          value={newSectorName[division.id] || ''}
                          onChange={(e) => setNewSectorName(prev => ({ ...prev, [division.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSector(division.id)}
                          disabled={isCurrentSaving}
                          className="flex-1 h-9 pl-3 pr-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium outline-none"
                        />
                        <button 
                          onClick={() => handleAddSector(division.id)}
                          disabled={isCurrentSaving || !(newSectorName[division.id] || '').trim()}
                          className="h-9 px-3 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                          title="Adicionar setor"
                        >
                          {isCurrentSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Plus size={14} />
                              <span className="hidden sm:inline">Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Sector Confirmation Modal */}
      <AnimatePresence>
        {deletingSector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingSector(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Excluir Setor</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Esta ação removerá o setor da lista da divisão.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700/60 my-4 text-xs">
                <p className="text-slate-600 dark:text-slate-300">
                  Deseja realmente excluir o setor <strong className="text-slate-900 dark:text-white">"{deletingSector.name}"</strong> da divisão <strong className="text-slate-900 dark:text-white">{deletingSector.divisionName}</strong>?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                  * Processos já cadastrados com este setor manterão seu histórico inalterado.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setDeletingSector(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmDeleteSector}
                  disabled={isSavingSector !== null}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingSector ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Exclusão'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Division Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  {editingDivision ? 'Editar Divisão' : 'Nova Divisão'}
                </h3>
                <button 
                  onClick={handleCloseModal}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Imagem em JPEG, PNG</label>
                    <div className="h-40 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 relative group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition-all overflow-hidden flex flex-col items-center justify-center text-slate-400">
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="animate-spin mb-2 text-indigo-500" size={32} />
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Enviando...</p>
                        </div>
                      ) : formData.image ? (
                        <>
                          <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover object-center" />
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload size={32} className="mb-2" />
                          <p className="text-xs font-bold uppercase tracking-wider">Clique para Upload</p>
                          <input 
                            type="file" 
                            accept="image/jpeg, image/png"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome/Sigla da Divisão</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                      placeholder="Ex: DOA, GLOG-YS"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium resize-none"
                      placeholder="Breve descrição da divisão..."
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleCloseModal}
                    className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 transition-all font-display uppercase tracking-widest cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 font-display uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Salvar
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
