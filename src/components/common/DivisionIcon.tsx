import React from 'react';
import { 
  Trophy, 
  Crown, 
  Plane, 
  Package, 
  Shield, 
  HeartPulse, 
  GraduationCap, 
  Compass, 
  Building2
} from 'lucide-react';
import { normalizeDivision } from '../../utils/divisionUtils';

interface DivisionIconProps {
  division?: string;
  image?: string;
  className?: string;
  size?: number;
}

export default function DivisionIcon({ division, image, className = "w-full h-full", size = 16 }: DivisionIconProps) {
  if (image) {
    return <img src={image} alt={division || 'Divisão'} className={`${className} object-cover object-center`} />;
  }

  const norm = normalizeDivision(division);

  switch (norm) {
    case 'CDEF':
      return <Trophy size={size} className="text-amber-500 dark:text-amber-400 shrink-0" />;
    case 'COMANDO':
      return <Crown size={size} className="text-amber-600 dark:text-amber-300 shrink-0" />;
    case 'DOA':
      return <Plane size={size} className="text-sky-500 dark:text-sky-400 shrink-0" />;
    case 'GLOG-YS':
      return <Package size={size} className="text-indigo-500 dark:text-indigo-400 shrink-0" />;
    case 'GSD-YS':
      return <Shield size={size} className="text-emerald-500 dark:text-emerald-400 shrink-0" />;
    case 'GSAU-YS':
      return <HeartPulse size={size} className="text-rose-500 dark:text-rose-400 shrink-0" />;
    case 'CCAER':
      return <GraduationCap size={size} className="text-purple-500 dark:text-purple-400 shrink-0" />;
    case 'EC':
      return <Compass size={size} className="text-teal-500 dark:text-teal-400 shrink-0" />;
    default:
      return <Building2 size={size} className="text-indigo-500 dark:text-indigo-400 shrink-0" />;
  }
}
