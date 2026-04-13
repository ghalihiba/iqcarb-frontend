import Sidebar              from '@/components/common/Sidebar';
import Header               from '@/components/common/Header';
import LoadingSpinner       from '@/components/common/LoadingSpinner';
import ErrorMessage         from '@/components/common/ErrorMessage';
import ConformiteGauge      from '@/components/conformite/ConformiteGauge';
import ConformiteScopes     from '@/components/conformite/ConformiteScopes';
import ConformiteTimeline   from '@/components/conformite/ConformiteTimeline';
import ConformiteBadge      from '@/components/conformite/ConformiteBadge';
import { useConformite }    from '@/hooks/useConformite';
import { Shield, BarChart3 } from 'lucide-react';

export default function Conformite() {
  const { data, loading, error, refetch } = useConformite();

  if (loading) return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <LoadingSpinner message="Calcul des indicateurs de conformité..." />
      </main>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <ErrorMessage message={error ?? 'Erreur'} onRetry={refetch} />
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-y-auto">
        <Header
          title="Conformité Réglementaire"
          subtitle={`${data.organisation.nom} — GHG Protocol · ISO 14064 · MRV`}
          onRefresh={refetch}
        />

        <div className="p-8 space-y-8">

          {/* Score global + Standards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Jauge globale */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col items-center justify-center gap-3">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Score global
              </p>
              <ConformiteGauge
                score={data.score_global}
                niveau={data.niveau}
                size="lg"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Évalué le{' '}
                {new Date(data.date_evaluation).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* KPIs principaux */}
            {data.indicateurs_cles.slice(0, 3).map(kpi => (
              <div
                key={kpi.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {kpi.label}
                  </p>
                  <ConformiteBadge statut={kpi.statut} size="sm" />
                </div>
                <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">
                    {typeof kpi.valeur === 'number'
                      ? kpi.valeur.toFixed(
                          kpi.unite === 'tCO2e' ? 4 : 0
                        )
                      : kpi.valeur}
                    {kpi.unite && (
                      <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
                        {kpi.unite}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {kpi.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Corps principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Indicateurs par scope */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Émissions par Scope
                </h2>
              </div>
              <ConformiteScopes
                scopes={data.scopes}
                total_co2e={data.total_co2e}
              />
            </div>

            {/* Standards de conformité */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Vérification des Standards
                </h2>
              </div>
              <ConformiteTimeline standards={data.standards} />
            </div>
          </div>

          {/* Tous les KPIs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">
              Indicateurs clés de performance carbone
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.indicateurs_cles.map(kpi => (
                <div
                  key={kpi.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
                >
                  <ConformiteBadge statut={kpi.statut} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {kpi.label}
                    </p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {typeof kpi.valeur === 'number'
                        ? kpi.valeur.toFixed(
                            kpi.unite === 'tCO2e' ? 4 : 0
                          )
                        : kpi.valeur}
                      {kpi.unite && (
                        <span className="text-xs font-normal text-gray-400 ml-1">
                          {kpi.unite}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {kpi.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}