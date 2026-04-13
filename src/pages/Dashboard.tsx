import ConformiteDashboard from '@/components/conformite/ConformiteDashboard';
import { useConformite }   from '@/hooks/useConformite';
import AchievementBanner from '@/components/dashboard/AchievementBanner';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage   from '@/components/common/ErrorMessage';
import KPICard        from '@/components/dashboard/KPICard';
import ScopeChart     from '@/components/dashboard/ScopeChart';
import EvolutionChart from '@/components/dashboard/EvolutionChart';
import MRVStatus      from '@/components/dashboard/MRVStatus';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useDashboard } from '@/hooks/useDashboard';
import {
  Leaf, Activity, FileText, TrendingDown
} from 'lucide-react';

export default function Dashboard() {
  const { data: conformiteData } = useConformite();
  const { dashboard, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement du dashboard carbone..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <ErrorMessage message={error} onRetry={refetch} />
        </main>
      </div>
    );
  }

  const kpis      = dashboard?.kpis;
  const scopes    = dashboard?.repartition_scopes ?? null;
  const evolution = dashboard?.evolution_annuelle ?? [];
  const mrv       = dashboard?.statut_mrv;
  const activites = dashboard?.activites_recentes ?? [];
  const org       = dashboard?.organisation;

  const isObjectifAtteint =
    (kpis?.co2e_derniere_annee ?? 0) <= (org?.objectif ?? Infinity);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-y-auto">

        <Header
          title="Dashboard Carbone"
          subtitle={`${org?.nom ?? ''} — ${org?.secteur ?? ''}`}
          onRefresh={refetch}
        />

        <div className="p-8 space-y-8">
          

  {/* Banner */}
  <AchievementBanner name={org?.nom} />

  {/* KPI Cards */}


          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard
              title="Total CO2e"
              value={kpis?.co2e_derniere_annee?.toFixed(4) ?? '0'}
              unit="tCO2e"
              icon={Leaf}
              color="green"
              subtitle={`Année ${kpis?.derniere_annee ?? '—'}`}
            />
            <KPICard
              title="Activités validées"
              value={mrv?.monitoring?.activites_validees ?? 0}
              icon={Activity}
              color="blue"
              subtitle="Données collectées"
            />
            <KPICard
              title="Rapports générés"
              value={kpis?.nb_rapports ?? 0}
              icon={FileText}
              color="orange"
              subtitle="Tous statuts"
            />
            <KPICard
              title="Objectif réduction"
              value={org?.objectif ? `${org.objectif} t` : '—'}
              icon={TrendingDown}
              color={isObjectifAtteint ? 'green' : 'red'}
              subtitle={
                isObjectifAtteint
                  ? '✅ Objectif atteint'
                  : '⚠️ Objectif non atteint'
              }
            />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Répartition scopes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Répartition par Scope
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  GHG Protocol — {kpis?.derniere_annee ?? '2024'}
                </p>
              </div>
              <ScopeChart data={scopes} />

              {scopes && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { key: 'SCOPE_1', color: 'bg-red-500',    label: 'Scope 1' },
                    { key: 'SCOPE_2', color: 'bg-blue-500',   label: 'Scope 2' },
                    { key: 'SCOPE_3', color: 'bg-yellow-500', label: 'Scope 3' },
                  ].map(({ key, color, label }) => (
                    <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className={`w-3 h-3 ${color} rounded-full mx-auto mb-1`} />
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {parseFloat(
                          String(scopes[key as keyof typeof scopes]?.valeur ?? 0)
                        ).toFixed(3)} t
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Évolution annuelle */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Évolution annuelle
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Émissions par scope en tCO2e
                </p>
              </div>
              <EvolutionChart data={evolution} />
            </div>
          </div>

          {/* Bas du dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Statut MRV */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Statut MRV
                </h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Monitoring · Reporting · Vérification
                </p>
              </div>
              <MRVStatus mrv={mrv} />

              {/* Conformité */}
             {conformiteData && (
  <ConformiteDashboard data={conformiteData} />
)}
            </div>

            {/* Activités récentes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Activités récentes
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Dernières saisies
                  </p>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full font-medium">
                  {activites.length} activité(s)
                </span>
              </div>
              <RecentActivity activites={activites} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}