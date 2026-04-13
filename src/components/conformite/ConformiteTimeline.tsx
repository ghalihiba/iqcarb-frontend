import type { ConformiteStandard } from '@/types/conformite.types';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

interface Props {
  standards: ConformiteStandard[];
}

const standardColors: Record<string, {
  color: string; bg: string; border: string;
}> = {
  GHG: {
    color:  'text-green-700 dark:text-green-400',
    bg:     'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
  },
  ISO: {
    color:  'text-blue-700 dark:text-blue-400',
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  MRV: {
    color:  'text-purple-700 dark:text-purple-400',
    bg:     'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

export default function ConformiteTimeline({ standards }: Props) {
  return (
    <div className="space-y-4">
      {standards.map(std => {
        const c = standardColors[std.code] ?? standardColors.GHG;

        return (
          <div
            key={std.code}
            className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}
          >
            {/* Header standard */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  std.conforme
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-red-100 dark:bg-red-900/40'
                }`}>
                  <Shield className={`w-5 h-5 ${
                    std.conforme
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${c.color}`}>
                    {std.nom}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {std.score}/{std.total} vérifications
                  </p>
                </div>
              </div>

              {/* Score circulaire mini */}
              <div className="text-right">
                <p className={`text-2xl font-black ${c.color}`}>
                  {std.pourcentage}%
                </p>
                <p className={`text-xs font-bold ${
                  std.conforme
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {std.conforme ? 'CONFORME ✓' : 'PARTIEL ⚠'}
                </p>
              </div>
            </div>

            {/* Barre de score */}
            <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${
                  std.conforme ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${std.pourcentage}%` }}
              />
            </div>

            {/* Checks */}
            <div className="space-y-2">
              {std.checks.map(check => (
                <div
                  key={check.id}
                  className="flex items-center gap-3 p-2.5 bg-white/60 dark:bg-gray-700/40 rounded-xl"
                >
                  {check.statut
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle     className="w-4 h-4 text-red-400   flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${
                      check.statut
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {check.label}
                      {check.obligatoire && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {check.description}
                    </p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${
                    check.statut
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500'
                  }`}>
                    {check.statut ? 'OK' : 'NON'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}