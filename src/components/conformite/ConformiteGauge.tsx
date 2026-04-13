import type { NiveauConformite } from '@/types/conformite.types';

interface Props {
  score:  number;
  niveau: NiveauConformite;
  size?:  'sm' | 'md' | 'lg';
}

const niveauConfig: Record<NiveauConformite, {
  color: string; bg: string; label: string; ring: string;
}> = {
  CONFORME: {
    color: 'text-green-600 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-900/20',
    label: 'Conforme',
    ring:  '#16a34a',
  },
  PARTIELLEMENT_CONFORME: {
    color: 'text-orange-600 dark:text-orange-400',
    bg:    'bg-orange-50 dark:bg-orange-900/20',
    label: 'Partiel',
    ring:  '#ea580c',
  },
  NON_CONFORME: {
    color: 'text-red-600 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-900/20',
    label: 'Non conforme',
    ring:  '#dc2626',
  },
};

export default function ConformiteGauge({ score, niveau, size = 'md' }: Props) {
  const cfg  = niveauConfig[niveau];
  const r    = size === 'lg' ? 54 : size === 'md' ? 42 : 30;
  const sw   = size === 'lg' ? 10  : size === 'md' ? 8  : 6;
  const dim  = size === 'lg' ? 140 : size === 'md' ? 110 : 80;
  const cx   = dim / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const textSize = size === 'lg'
    ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex flex-col items-center gap-2 ${cfg.bg} p-4 rounded-2xl`}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={sw}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={cfg.ring}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        {/* Texte centré */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-black ${cfg.color}`}>
            {score}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">%</span>
        </div>
      </div>
      <span className={`text-sm font-bold ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  );
}