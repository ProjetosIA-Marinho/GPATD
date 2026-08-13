/**
 * Division normalization and matching utilities for GPATD
 */

export function normalizeDivision(div?: string | null): string {
  if (!div) return '';
  const clean = div.trim().toUpperCase();
  
  // Division aliases mapping
  if (clean === 'DEF' || clean === 'CDEF' || clean === 'COMISSÃO DE DESPORTO E EDUCAÇÃO FÍSICA') return 'CDEF';
  if (clean === 'CMDO' || clean === 'COMANDO' || clean === 'COMANDO DA AFA') return 'COMANDO';
  if (clean === 'GLOG' || clean === 'GLOG-YS') return 'GLOG-YS';
  if (clean === 'GSD' || clean === 'GSD-YS') return 'GSD-YS';
  if (clean === 'GSAU' || clean === 'GSAU-YS') return 'GSAU-YS';
  
  return clean;
}

export function isSameDivision(div1?: string | null, div2?: string | null): boolean {
  if (!div1 || !div2) return false;
  return normalizeDivision(div1) === normalizeDivision(div2);
}
