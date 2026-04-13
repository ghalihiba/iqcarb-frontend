import type { IndicateurScope } from '@/types/conformite.types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  scopes:     IndicateurScope[];
  total_co2e: number;
}

const scopeStyle = {
  SCOPE_1: {
    color:  'text-red-600 dark:text-red-400',
    bg:     'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-800',
    bar:    'bg-red-500',
    badge:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  },
  SCOPE_2: {
    color:  'text-blue-600 dark:text-blue-400',
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-800',
    bar:    'bg-blue-500',
    badge:  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  },
  SCOPE_3: {
    color:  'text-yellow-600 dark:text-yellow-400',
    bg:     'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-100 dark:border-yellow-800',
    bar:    'bg-yellow-500',
    badge:  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
  },
};

const TendanceIcon = ({ t }: { t: IndicateurScope['tendance'] }) => {
  if (t === 'hausse') return <TrendingUp   className="w-4 h-4 text-red-500"   />;
  if (t === 'baisse') return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function ConformiteScopes({ scopes, total_co2e }: Props) {
  return (
    <div className="space-y-3">
      {scopes.map(scope => {
        const s   = scopeStyle[scope.scope];
        const pct = total_co2e > 0
          ? (scope.total_co2e / total_co2e * 100)
          : 0;

        return (
          <div
            key={scope.scope}
            className={`p-4 rounded-2xl border ${s.bg} ${s.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.badge}`}>
                  {scope.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {scope.description}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TendanceIcon t={scope.tendance} />
                <div className="text-right">
                  <p className={`text-lg font-black ${s.color}`}>
                    {scope.total_co2e.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    tCO2e
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div
                className={`${s.bar} h-2.5 rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-4">
                <span className="text-gray-500 dark:text-gray-400">
                  {scope.nb_activites} activité(s)
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  Incert. ±{scope.incertitude}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                {scope.variation_pct !== null && (
                  <span className={`font-semibold ${
                    scope.variation_pct < 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {scope.variation_pct > 0 ? '+' : ''}
                    {scope.variation_pct.toFixed(1)}%
                  </span>
                )}
                <span className={`font-bold ${s.color}`}>
                  {pct.toFixed(1)}% du total
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Total global
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Scope 1 + Scope 2 + Scope 3
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
            {total_co2e.toFixed(4)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">tCO2e</p>
        </div>
      </div>
    </div>
  );
}