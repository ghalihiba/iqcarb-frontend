import ConformiteGauge  from './ConformiteGauge';
import ConformiteBadge  from './ConformiteBadge';
import type { ConformiteData } from '@/types/conformite.types';
import { Shield, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  data: ConformiteData;
}

export default function ConformiteDashboard({ data }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Conformité réglementaire
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              GHG Protocol · ISO 14064 · MRV
            </p>
          </div>
        </div>
        <Link
          to="/conformite"
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
        >
          Détails →
        </Link>
      </div>

      {/* Jauge + Standards */}
      <div className="flex items-center gap-4 mb-5">
        <ConformiteGauge
          score={data.score_global}
          niveau={data.niveau}
          size="md"
        />
        <div className="flex-1 space-y-2">
          {data.standards.map(std => (
            <div key={std.code} className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {std.code}
              </span>
              <div className="flex items-center gap-2 flex-1 mx-3">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      std.conforme ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${std.pourcentage}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold w-8 text-right ${
                std.conforme
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {std.pourcentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {data.indicateurs_cles.slice(0, 4).map(kpi => (
          <div
            key={kpi.id}
            className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <ConformiteBadge statut={kpi.statut} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {typeof kpi.valeur === 'number'
                  ? kpi.valeur.toFixed(kpi.unite === 'tCO2e' ? 4 : 0)
                  : kpi.valeur}
                {kpi.unite && (
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    {kpi.unite}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Objectif */}
      {data.organisation.objectif && (
        <div className={`flex items-center gap-2 p-3 rounded-xl border ${
          (data.total_co2e <= data.organisation.objectif)
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
        }`}>
          <TrendingDown className={`w-4 h-4 flex-shrink-0 ${
            data.total_co2e <= data.organisation.objectif
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Objectif réduction : {data.organisation.objectif.toFixed(1)} tCO2e
            </p>
            <p className={`text-xs ${
              data.total_co2e <= data.organisation.objectif
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {data.total_co2e <= data.organisation.objectif
                ? `✅ Atteint — écart : ${(data.organisation.objectif - data.total_co2e).toFixed(3)} t`
                : `⚠️ Dépassement : +${(data.total_co2e - data.organisation.objectif).toFixed(3)} t`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}