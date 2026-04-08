import { useState, useEffect } from 'react';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import ActiviteForm   from '@/components/activites/ActiviteForm';
import ActiviteList   from '@/components/activites/ActiviteList';
import { useActivites } from '@/hooks/useActivites';
import {
  Plus, CheckCircle,
  AlertCircle, Activity
} from 'lucide-react';

export default function Activites() {
  const [showForm, setShowForm] = useState(false);

  const {
    activites, sources, orgId,
    loading, loadingSources, submitting,
    error, success, total,
    filters, setFilters,
    creerActivite, validerActivite, supprimerActivite,
    refetch, clearMessages
  } = useActivites();

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearMessages]);

  const handleSubmit = async (data: Parameters<typeof creerActivite>[0]) => {
    const ok = await creerActivite(data);
    if (ok) setShowForm(false);
    return ok;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-y-auto">

        <Header
          title="Gestion des Activités"
          subtitle="Saisie et suivi des données d'émissions carbone"
          onRefresh={refetch}
        />

        <div className="p-8">

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl mb-6 shadow-sm animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Barre d'action */}
          <div className="flex items-center justify-between mb-6">

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <Activity className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {total} activité(s)
                </span>
              </div>

              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-800">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {activites.filter(a => a.statut === 'VALIDE').length} validée(s)
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle activité
            </button>
          </div>

          {/* Liste */}
          <ActiviteList
            activites={activites}
            loading={loading}
            total={total}
            filters={filters}
            onFilter={setFilters}
            onValider={validerActivite}
            onSupprimer={supprimerActivite}
          />
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <ActiviteForm
          sources={sources}
          orgId={orgId}
          loadingSources={loadingSources}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}