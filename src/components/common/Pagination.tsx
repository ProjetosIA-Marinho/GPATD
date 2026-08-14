import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export type PageSizeOption = number | 'all';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: PageSizeOption;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSizeOption) => void;
  pageSizeOptions?: PageSizeOption[];
  className?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100, 'all'],
  className = ''
}: PaginationProps) {
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? Math.max(1, totalItems) : (pageSize as number);
  const totalPages = isAll ? 1 : Math.ceil(totalItems / effectivePageSize) || 1;

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * effectivePageSize + 1;
  const endItem = isAll ? totalItems : Math.min(validCurrentPage * effectivePageSize, totalItems);

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (validCurrentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, validCurrentPage - 1);
    const end = Math.min(totalPages - 1, validCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (validCurrentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 select-none ${className}`}>
      {/* Left: Items count & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Itens por página:
          </span>
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
            {pageSizeOptions.map((opt) => {
              const isSelected = pageSize === opt;
              const label = opt === 'all' ? 'Todos' : String(opt);
              return (
                <button
                  key={String(opt)}
                  onClick={() => {
                    onPageSizeChange(opt);
                    onPageChange(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block" />

        <p className="text-xs">
          Mostrando <span className="font-bold text-slate-900 dark:text-white">{startItem}</span> a{' '}
          <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> de{' '}
          <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> resultados
        </p>
      </div>

      {/* Right: Page Navigation Buttons */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={validCurrentPage === 1}
            title="Primeira página"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            title="Página anterior"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Number Buttons */}
          <div className="flex items-center gap-1 px-1">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-bold">
                    ...
                  </span>
                );
              }
              const pageNum = p as number;
              const isActive = pageNum === validCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages}
            title="Próxima página"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={validCurrentPage === totalPages}
            title="Última página"
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
