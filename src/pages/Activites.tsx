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
    <div className="iq-shell">
      <Sidebar />

      <main className="iq-main iq-dotgrid relative">

        <Header
          title="Gestion des Activités"
          subtitle="Saisie et suivi des données d'émissions carbone"
          onRefresh={refetch}
        />

        <div className="iq-content">

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-2xl mb-1 shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl mb-1 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Barre d'action */}
          <div className="iq-card p-4 flex items-center justify-between">

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 iq-soft px-4 py-2">
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
              className="iq-btn-primary text-sm"
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