import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Upload,
  ShieldCheck,
  Search,
  Loader2,
  MoreVertical,
  MoreHorizontal,
  Edit2,
  FileText,
  CheckCircle2
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
    } catch (error) {
      console.error('Error uploading image: ', error);
      alert('Erro ao fazer upload da imagem. Verifique se o bucket "divisions" existe e está configurado corretamente.');
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
      } else {
        const { data, error } = await supabase.from('divisions').insert(formData).select().single();
        if (error) throw error;
        if (data) setDivisions(prev => [...prev, data]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving division:', err);
      alert('Erro ao salvar divisão.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza que deseja excluir esta divisão? Isso pode afetar processos vinculados.')) {
      try {
        const { error } = await supabase.from('divisions').delete().eq('id', id);
        if (error) throw error;
        setDivisions(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        console.error('Error deleting division:', err);
        alert('Erro ao excluir divisão.');
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

    const sectorName = newSectorName[divisionId];
    if (!sectorName?.trim()) return;
    
    const newSectors = [...(division.sectors || []), sectorName.trim()];

    try {
      const { error } = await supabase.from('divisions').update({ sectors: newSectors }).eq('id', divisionId);
      if (error) throw error;
      
      setDivisions(prev => prev.map(d => d.id === divisionId ? { ...d, sectors: newSectors } : d));
      setNewSectorName(prev => ({ ...prev, [divisionId]: '' }));
    } catch (err) {
      console.error('Error adding sector:', err);
      alert('Erro ao adicionar setor.');
    }
  };

  const handleRemoveSector = async (divisionId: string, sectorIndex: number) => {
    const division = divisions.find(d => d.id === divisionId);
    if (!division || !canManageSectors(division)) return;
    
    const newSectors = [...(division.sectors || [])];
    newSectors.splice(sectorIndex, 1);

    try {
      const { error } = await supabase.from('divisions').update({ sectors: newSectors }).eq('id', divisionId);
      if (error) throw error;
      
      setDivisions(prev => prev.map(d => d.id === divisionId ? { ...d, sectors: newSectors } : d));
    } catch (err) {
      console.error('Error removing sector:', err);
      alert('Erro ao remover setor.');
    }
  };

  const filteredDivisions = divisions.filter(d => {
    const effectiveSearch = globalSearchTerm || searchTerm;
    return (
      d.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      d.description.toLowerCase().includes(effectiveSearch.toLowerCase())
    );
  });

  return (
    <div id="divisions-view" className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-indigo-600" />
            Gerenciamento de Divisões
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administre as organizações, divisões e sub-unidades do sistema.</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-display uppercase tracking-widest text-xs"
          >
            <Plus size={18} />
            Nova Divisão
          </button>
        )}
      </header>

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

      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm">
          <ShieldCheck size={20} />
          <p>Apenas administradores podem criar, editar ou excluir divisões. Seu acesso atual é de visualização.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDivisions.map((division) => (
          <motion.div 
            key={division.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative flex flex-col rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-5 min-h-[410px] overflow-hidden"
          >
            {/* Corner Fold Star Ribbon */}
            <div className="absolute top-0 right-0 z-20">
              <div className="relative">
                <div 
                  className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500" 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} 
                />
                <span className="absolute top-1.5 right-1.5 text-[9px] font-black leading-none text-white">★</span>
              </div>
            </div>

            {/* Float Edit/Delete Three-dot Menu */}
            {isAdmin && (
              <div className="absolute top-10 right-3 z-20">
                <button 
                  onClick={() => setActiveDropdownId(activeDropdownId === division.id ? null : division.id)}
                  className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700"
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
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors w-full text-left"
                      >
                        <Edit2 size={14} className="text-slate-400" />
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          setActiveDropdownId(null);
                          handleDelete(division.id);
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
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[220px] mx-auto">{division.description || 'Divisão Cadastrada'}</p>
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
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Sigla/Ref</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{division.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} className="stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Situação</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">Ativa</p>
                  </div>
                </div>
              </div>

              {/* Sectors Content Section */}
              <div className="flex-1 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Setores Cadastrados</h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1 mb-2.5">
                  {division.sectors && division.sectors.length > 0 ? (
                    division.sectors.map((sector, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 group/sector">
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{sector}</span>
                        {canManageSectors(division) && (
                          <button 
                            onClick={() => handleRemoveSector(division.id, sIdx)}
                            className="opacity-0 group-hover/sector:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-60 py-3">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Nenhum setor</p>
                    </div>
                  )}
                </div>

                {canManageSectors(division) && (
                  <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="relative group/input">
                      <input 
                        type="text"
                        placeholder="Novo setor..."
                        value={newSectorName[division.id] || ''}
                        onChange={(e) => setNewSectorName(prev => ({ ...prev, [division.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSector(division.id)}
                        className="w-full h-8 pl-2.5 pr-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-slate-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium outline-none"
                      />
                      <button 
                        onClick={() => handleAddSector(division.id)}
                        className="absolute right-1 top-1 h-6 w-6 flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
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
                            className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
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
                    className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 transition-all font-display uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 font-display uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
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
