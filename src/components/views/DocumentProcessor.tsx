import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  FileImage, 
  ArrowDown, 
  ArrowUp, 
  Trash2, 
  Loader2, 
  Settings, 
  Check, 
  Cpu, 
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PDFDocument } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { renderAsync } from 'docx-preview';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';

interface DocumentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: File, description: string, targetFolderId?: string) => Promise<void>;
  folders: any[];
  initialFolderId?: string;
}

interface QueueItem {
  id: string;
  file: File;
  name: string;
  type: string;
  size: string;
}

export default function DocumentProcessor({ isOpen, onClose, onUploadSuccess, folders, initialFolderId }: DocumentProcessorProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [enableOCR, setEnableOCR] = useState(true);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [ocrTextResult, setOcrTextResult] = useState<string>('');
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolderId || '');
  const [successInfo, setSuccessInfo] = useState<{ fileName: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSelectedFolderId(initialFolderId || '');
  }, [initialFolderId]);

  React.useEffect(() => {
    if (!isOpen) {
      setQueue([]);
      setSuccessInfo(null);
      setErrorLog(null);
      setIsProcessing(false);
      setProgressPercentage(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFilesToQueue(Array.from(files));
  };

  const addFilesToQueue = (files: File[]) => {
    const pdfFiles = files.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext !== 'pdf') {
        alert(`O arquivo "${file.name}" não é um PDF. Somente arquivos PDF são permitidos.`);
        return false;
      }
      return true;
    });

    const newItems = pdfFiles.map(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        type: ext,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      };
    });
    setQueue(prev => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQueue.length) return;
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;
    setQueue(newQueue);
  };

  // Convert DOCX to an image representation (via HTML canvas)
  const convertDocxToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    const arrayBuffer = await file.arrayBuffer();
    await renderAsync(arrayBuffer, container, undefined, {
      className: 'docx-preview',
      inWrapper: true
    });

    // Temporarily disable stylesheets containing oklch or links to prevent html2canvas parsing crash
    const disabledSheets: any[] = [];
    const sheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    sheets.forEach((sheet: any) => {
      try {
        const isLink = sheet.tagName === 'LINK';
        const text = isLink ? '' : sheet.textContent || '';
        if (isLink || text.includes('oklch')) {
          sheet.disabled = true;
          disabledSheets.push(sheet);
        }
      } catch (err) {
        // ignore
      }
    });

    // Render HTML page to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Restore stylesheets
    disabledSheets.forEach((sheet) => {
      sheet.disabled = false;
    });

    document.body.removeChild(container);
    return canvas;
  };

  // Simple client-side ODT parsing (extract text content and paint to canvas)
  const convertOdtToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
    const zip = await JSZip.loadAsync(file);
    const contentXml = await zip.file("content.xml")?.async("text");
    if (!contentXml) throw new Error("Não foi possível ler o arquivo content.xml do ODT.");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contentXml, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("text:p");
    
    // Create HTML render container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.background = '#ffffff';
    container.style.fontFamily = 'serif';
    container.style.fontSize = '16px';
    container.style.lineHeight = '1.6';
    container.style.color = '#333333';

    for (let i = 0; i < paragraphs.length; i++) {
      const p = document.createElement('p');
      p.style.marginBottom = '1.5em';
      p.style.textAlign = 'justify';
      p.textContent = paragraphs[i].textContent || '';
      container.appendChild(p);
    }

    document.body.appendChild(container);

    // Temporarily disable stylesheets containing oklch or links to prevent html2canvas parsing crash
    const disabledSheets: any[] = [];
    const sheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    sheets.forEach((sheet: any) => {
      try {
        const isLink = sheet.tagName === 'LINK';
        const text = isLink ? '' : sheet.textContent || '';
        if (isLink || text.includes('oklch')) {
          sheet.disabled = true;
          disabledSheets.push(sheet);
        }
      } catch (err) {
        // ignore
      }
    });

    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false
    });

    // Restore stylesheets
    disabledSheets.forEach((sheet) => {
      sheet.disabled = false;
    });

    document.body.removeChild(container);
    return canvas;
  };

  const processPipeline = async () => {
    if (queue.length === 0) {
      alert('A fila está vazia. Adicione pelo menos um documento.');
      return;
    }

    setIsProcessing(true);
    setProgressPercentage(10);
    setErrorLog(null);
    setOcrTextResult('');

    try {
      setProcessStep('Inicializando Novo Documento PDF...');
      const mergedPdf = await PDFDocument.create();
      let totalItems = queue.length;

      // Initialize Tesseract Worker if OCR is enabled
      let ocrWorker: any = null;
      if (enableOCR) {
        setProcessStep('Carregando Motor de OCR (Tesseract)...');
        ocrWorker = await createWorker('por'); // Portuguese
      }

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.file.size === 0) {
          throw new Error(`O arquivo "${item.name}" está vazio (0 bytes). Não é possível processar arquivos sem conteúdo.`);
        }
        const stepProgress = 10 + Math.floor((i / totalItems) * 70);
        setProgressPercentage(stepProgress);
        setProcessStep(`Processando [${i+1}/${totalItems}]: ${item.name}...`);

        if (item.type === 'pdf') {
          // Merge PDF pages directly
          const pdfBytes = await item.file.arrayBuffer();
          const srcPdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } else if (item.type === 'png' || item.type === 'jpg' || item.type === 'jpeg') {
          // Convert Image to PDF Page
          const imageBytes = await item.file.arrayBuffer();
          const page = mergedPdf.addPage();
          
          let embeddedImage;
          if (item.type === 'png') {
            embeddedImage = await mergedPdf.embedPng(imageBytes);
          } else {
            embeddedImage = await mergedPdf.embedJpg(imageBytes);
          }

          // Scale page dimensions to fit image aspect ratio
          const { width, height } = embeddedImage.scale(0.5);
          page.setSize(width, height);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: width,
            height: height
          });

          // Run OCR on the image
          if (enableOCR && ocrWorker) {
            setProcessStep(`Lendo texto (OCR) da imagem: ${item.name}...`);
            const { data: { text } } = await ocrWorker.recognize(item.file);
            // Draw invisible selectable text layer on top of image
            if (text.trim()) {
              page.drawText(text, {
                x: 10,
                y: 10,
                size: 1,
                opacity: 0
              });
              setOcrTextResult(prev => prev + `\n--- OCR ${item.name} ---\n` + text);
            }
          }
        } else if (item.type === 'docx') {
          // Convert word document
          setProcessStep(`Convertendo documento Word: ${item.name}...`);
          const canvas = await convertDocxToCanvas(item.file);
          const imgUrl = canvas.toDataURL('image/jpeg', 0.85);
          const response = await fetch(imgUrl);
          const imageBytes = await response.arrayBuffer();

          const page = mergedPdf.addPage();
          const embeddedImage = await mergedPdf.embedJpg(imageBytes);
          const { width, height } = embeddedImage.scale(0.5);
          page.setSize(width, height);
          page.drawImage(embeddedImage, { x: 0, y: 0, width, height });

          if (enableOCR && ocrWorker) {
            setProcessStep(`Lendo texto (OCR) do Word convertido: ${item.name}...`);
            const { data: { text } } = await ocrWorker.recognize(canvas);
            if (text.trim()) {
              page.drawText(text, { x: 10, y: 10, size: 1, opacity: 0 });
              setOcrTextResult(prev => prev + `\n--- OCR ${item.name} ---\n` + text);
            }
          }
        } else if (item.type === 'odt') {
          // Convert ODT document
          setProcessStep(`Convertendo documento ODT: ${item.name}...`);
          const canvas = await convertOdtToCanvas(item.file);
          const imgUrl = canvas.toDataURL('image/jpeg', 0.85);
          const response = await fetch(imgUrl);
          const imageBytes = await response.arrayBuffer();

          const page = mergedPdf.addPage();
          const embeddedImage = await mergedPdf.embedJpg(imageBytes);
          const { width, height } = embeddedImage.scale(0.5);
          page.setSize(width, height);
          page.drawImage(embeddedImage, { x: 0, y: 0, width, height });

          if (enableOCR && ocrWorker) {
            setProcessStep(`Lendo texto (OCR) do ODT convertido: ${item.name}...`);
            const { data: { text } } = await ocrWorker.recognize(canvas);
            if (text.trim()) {
              page.drawText(text, { x: 10, y: 10, size: 1, opacity: 0 });
              setOcrTextResult(prev => prev + `\n--- OCR ${item.name} ---\n` + text);
            }
          }
        }
      }

      // Cleanup OCR
      if (ocrWorker) {
        await ocrWorker.terminate();
      }

      // Compression Phase
      setProcessStep('Compactando e estruturando PDF final...');
      setProgressPercentage(85);
      
      const finalPdfBytes = await mergedPdf.save({
        useObjectStreams: compressionLevel !== 'low'
      });

      setProgressPercentage(95);
      setProcessStep('Preparando arquivo para exportação...');

      // Generate File instance
      const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const finalFile = new File([finalBlob], `Juntada_Digital_${Date.now()}.pdf`, { type: 'application/pdf' });

      // Action: Trigger direct upload to Supabase Folder if selected
      if (selectedFolderId) {
        setProcessStep('Enviando documento para a biblioteca...');
        const desc = `Documento unificado via Juntada Digital (${totalItems} arquivos).` + 
                     (enableOCR ? " Processado com camada de pesquisa OCR." : "");
        await onUploadSuccess(finalFile, desc, selectedFolderId);
      }

      const sizeStr = (finalBlob.size / 1024 / 1024).toFixed(2) + ' MB';
      setSuccessInfo({ fileName: finalFile.name, size: sizeStr });

      setProgressPercentage(100);
      setProcessStep('Processamento Concluído com Sucesso!');
      
      // Auto download backup copy locally
      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = finalFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setIsProcessing(false);

    } catch (err: any) {
      console.error('Error during Document Merging/OCR pipeline:', err);
      setErrorLog(err.message || 'Falha desconhecida no processamento de arquivos.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isProcessing && onClose()}
        className="absolute inset-0"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] z-10"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                Juntada Digital de Documentos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 uppercase font-bold tracking-widest">
                Mescle, compacte e gere PDF pesquisável (OCR)
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {successInfo ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <Check size={40} className="stroke-[3]" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Juntada Concluída!</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Os documentos foram mesclados e compactados com sucesso.</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 w-full max-w-md text-left space-y-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nome do Arquivo</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">{successInfo.fileName}</span>
                </div>
                <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tamanho Final do PDF</span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{successInfo.size}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[9px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider">Compactado</span>
                </div>
              </div>

              <p className="text-xs text-slate-450">O download iniciou automaticamente. Você também pode fechar esta tela.</p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
                <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 animate-pulse" size={28} />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">{processStep}</h4>
                <p className="text-xs text-slate-455">A Juntada Digital está processando as conversões e mesclando os arquivos diretamente no navegador.</p>
              </div>

              <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-wider">{progressPercentage}% COMPLETADO</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Drag and Drop Box */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer group bg-slate-50/50 dark:bg-slate-900/30 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform shadow-sm">
                  <Upload size={22} className="text-indigo-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Clique ou arraste seus arquivos para a Juntada
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-black">
                  Suporta apenas arquivos PDF (Máximo 20MB por arquivo)
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  onChange={handleFileChange}
                  accept=".pdf" 
                  className="hidden" 
                />
              </div>

              {/* Document Queue */}
              {queue.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fila de Documentos para Compilação ({queue.length})</h4>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                    {queue.map((item, idx) => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{item.name}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wider font-mono">
                              {item.type} • {item.size}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 ml-4">
                          <button 
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItem(idx, 'up')}
                            className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button"
                            disabled={idx === queue.length - 1}
                            onClick={() => moveItem(idx, 'down')}
                            className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error log if failed */}
              {errorLog && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-xs font-semibold text-rose-600 dark:text-rose-455">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase tracking-wider mb-1">Falha no Processamento</p>
                    <p>{errorLog}</p>
                  </div>
                </div>
              )}

              {/* Configuration Settings */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings size={12} />
                  Opções de Processamento
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Folder Destination selector */}
                  {folders.length > 0 && (
                    <div className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 md:col-span-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Pasta de Destino na Biblioteca</p>
                      <select
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 outline-hidden border border-transparent focus:border-indigo-500 transition-all text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="">Apenas Download Local (Não enviar para biblioteca)</option>
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* OCR Option */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Reconhecimento de Texto (OCR)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-400">Torna o PDF final pesquisável para buscas de palavras.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableOCR} 
                        onChange={(e) => setEnableOCR(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Compression Option */}
                  <div className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Compactação do PDF</p>
                    <div className="flex gap-2 mt-1">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setCompressionLevel(level)}
                          className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                            compressionLevel === level
                              ? 'bg-indigo-600 border-transparent text-white shadow-md'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          {level === 'low' ? 'Baixa' : level === 'medium' ? 'Média' : 'Alta'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isProcessing && (
          <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 shrink-0">
            {successInfo ? (
              <button 
                onClick={onClose}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center"
              >
                Concluir e Fechar
              </button>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={processPipeline}
                  disabled={queue.length === 0}
                  className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Cpu size={16} />
                  Iniciar Juntada ({queue.length})
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
