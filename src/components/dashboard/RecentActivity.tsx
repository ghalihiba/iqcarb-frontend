import { Zap, CheckCircle, Clock } from 'lucide-react';
import type { ActiviteRecente } from '@/types/dashboard.types';
import { getScopeBadgeClass, formatDate } from '@/utils/formatters';

interface RecentActivityProps {
  activites: ActiviteRecente[];
}

export default function RecentActivity({ activites }: RecentActivityProps) {
  if (activites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
        <Zap className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activites.map((act) => (
        <div
          key={act.id_activite}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {act.nom_source}
            </p>
            <p className="text-xs text-gray-400">
              {parseFloat(act.quantite).toFixed(0)} {act.unite}
              {act.valeur_co2e && (
                <span className="text-green-600 font-medium">
                  {' → '}{parseFloat(act.valeur_co2e).toFixed(4)} tCO2e
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getScopeBadgeClass(act.scope)}`}>
              {act.scope?.replace('SCOPE_', 'S')}
            </span>
            {act.statut === 'VALIDE'
              ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              : <Clock className="w-3.5 h-3.5 text-orange-400" />
            }
          </div>
        </div>
      ))}
    </div>
  );
}