import type { StatutIndicateur } from '@/types/conformite.types';
import {
  CheckCircle, AlertTriangle,
  XCircle, Info
} from 'lucide-react';

interface Props {
  statut:    StatutIndicateur;
  label?:    string;
  size?:     'sm' | 'md';
}

const config: Record<StatutIndicateur, {
  icon:    React.ElementType;
  color:   string;
  bg:      string;
  border:  string;
  label:   string;
}> = {
  OK: {
    icon:   CheckCircle,
    color:  'text-green-700 dark:text-green-400',
    bg:     'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    label:  'Conforme',
  },
  ATTENTION: {
    icon:   AlertTriangle,
    color:  'text-orange-700 dark:text-orange-400',
    bg:     'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    label:  'Attention',
  },
  CRITIQUE: {
    icon:   XCircle,
    color:  'text-red-700 dark:text-red-400',
    bg:     'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    label:  'Critique',
  },
  INFO: {
    icon:   Info,
    color:  'text-blue-700 dark:text-blue-400',
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    label:  'Info',
  },
};

export default function ConformiteBadge({ statut, label, size = 'sm' }: Props) {
  const c    = config[statut];
  const Icon = c.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 font-semibold rounded-full border
      ${c.bg} ${c.color} ${c.border}
      ${size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'}
    `}>
      <Icon className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      {label ?? c.label}
    </span>
  );
}