import type { NiveauPedagogique } from '@/types/lms.types';

const config: Record<NiveauPedagogique, {
  label: string; color: string; bg: string; emoji: string;
}> = {
  DEBUTANT: {
    label: 'Débutant',   emoji: '🌱',
    color: 'text-green-700 dark:text-green-400',
    bg:    'bg-green-100 dark:bg-green-900/40',
  },
  INTERMEDIAIRE: {
    label: 'Intermédiaire', emoji: '🌿',
    color: 'text-blue-700 dark:text-blue-400',
    bg:    'bg-blue-100 dark:bg-blue-900/40',
  },
  AVANCE: {
    label: 'Avancé',    emoji: '🌳',
    color: 'text-purple-700 dark:text-purple-400',
    bg:    'bg-purple-100 dark:bg-purple-900/40',
  },
};

export default function NiveauBadge({
  niveau, size = 'sm'
}: {
  niveau: NiveauPedagogique;
  size?:  'sm' | 'md';
}) {
  const c = config[niveau];
  return (
    <span className={`
      inline-flex items-center gap-1 font-semibold rounded-full
      ${c.bg} ${c.color}
      ${size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'}
    `}>
      {c.emoji} {c.label}
    </span>
  );
}