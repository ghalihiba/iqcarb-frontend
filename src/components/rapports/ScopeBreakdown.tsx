import { SCOPE_CONFIG, formatCO2e } from '@/engines/rapportEngine';
import type { ScopeDetail }          from '@/types/rapport.types';
import { ChevronDown, ChevronUp }    from 'lucide-react';
import { useState }                  from 'react';

interface Props {
  scopes: Record<string, ScopeDetail>;
}

export default function ScopeBreakdown({ scopes }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalGlobal = Object.values(scopes)
    .reduce((sum, s) => sum + (s?.total ?? 0), 0);

  return (
    <div className="space-y-3">
      {Object.entries(SCOPE_CONFIG).map(([key, cfg]) => {
        const data      = scopes[key];
        const isExpanded = expanded === key;
        if (!data) return null;

        return (
          <div
            key={key}
            className={`rounded-2xl border transition-all ${cfg.bg} ${cfg.border}`}
          >
            {/* Header scope */}
            <button
              onClick={() => setExpanded(isExpanded ? null : key)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              {/* Badge scope */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${cfg.color}`}>
                  {cfg.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {cfg.ghg}
                </p>
              </div>

              {/* Total */}
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-black ${cfg.color}`}>
                  {formatCO2e(data.total)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">tCO2e</p>
              </div>

              {/* % + expand */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-bold ${cfg.color}`}>
                  {data.pourcentage?.toFixed(1)}%
                </span>
                {isExpanded
                  ? <ChevronUp   className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </div>
            </button>

            {/* Barre de progression */}
            <div className="mx-4 mb-3">
              <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${cfg.bar} h-2 rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min(data.pourcentage ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {data.nb_activites} activité(s) · ±{data.incertitude_moyenne}%
                </span>
                <span className={`text-xs font-semibold ${cfg.color}`}>
                  {totalGlobal > 0
                    ? ((data.total / totalGlobal) * 100).toFixed(1)
                    : '0.0'}% du total
                </span>
              </div>
            </div>

            {/* Détail des activités (expandable) */}
            {isExpanded && data.activites?.length > 0 && (
              <div className="px-4 pb-4 border-t border-white/50 dark:border-gray-600/50 pt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Sources d'émission
                </p>
                <div className="space-y-2">
                  {data.activites.slice(0, 8).map((act, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/60 dark:bg-gray-700/40 p-2.5 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                          {act.source}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {act.quantite} {act.unite}
                          {act.site ? ` · ${act.site}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className={`text-xs font-bold ${cfg.color}`}>
                          {formatCO2e(act.co2e_t)}
                        </p>
                        <p className="text-xs text-gray-400">tCO2e</p>
                      </div>
                    </div>
                  ))}
                  {data.activites.length > 8 && (
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                      +{data.activites.length - 8} autres sources
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}