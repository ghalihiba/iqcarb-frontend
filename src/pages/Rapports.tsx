import { useState, useEffect }  from 'react';
import Sidebar                  from '@/components/common/Sidebar';
import Header                   from '@/components/common/Header';
import RapportCard              from '@/components/rapports/RapportCard';
import RapportDetail            from '@/components/rapports/RapportDetail';
import RapportGenerator         from '@/components/rapports/RapportGenerator';
import { useRapport }           from '@/hooks/useRapport';
import {
  Plus, FileText, CheckCircle,
  AlertCircle, Loader2,
  BarChart3, Shield
} from 'lucide-react';

export default function Rapports() {
  const [showGenerator, setShowGenerator] = useState(false);

  const {
    rapports, rapportDetail, orgNom,
    loading, loadingDetail, generating,
    error, success,
    generer, chargerDetail, changerStatut,
    fermerDetail, refetch, clearMessages
  } = useRapport();

  // Auto-clear messages
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(clearMessages, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error, clearMessages]);

  const handleGenerate = async (data: Parameters<typeof generer>[0]) => {
    const ok = await generer(data);
    if (ok) setShowGenerator(false);
    return ok;
  };

  return (
    <div className="iq-shell">
      <Sidebar />

      <main className="iq-main iq-dotgrid relative">
        <Header
          title="Rapports Carbone"
          subtitle={`${orgNom} — GHG Protocol & ISO 14064`}
          onRefresh={refetch}
        />

        <div className="iq-content">

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-2xl">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Total rapports',
                value: rapports.length,
                icon:  FileText,
                color: 'text-primary-600 dark:text-primary-400',
                bg:    'bg-primary-50 dark:bg-primary-900/20'
              },
              {
                label: 'Validés',
                value: rapports.filter(r => r.statut === 'VALIDE').length,
                icon:  CheckCircle,
                color: 'text-green-600 dark:text-green-400',
                bg:    'bg-green-50 dark:bg-green-900/20'
              },
              {
                label: 'Conformité',
                value: rapports.length > 0 ? 'GHG + ISO' : '—',
                icon:  Shield,
                color: 'text-blue-600 dark:text-blue-400',
                bg:    'bg-blue-50 dark:bg-blue-900/20'
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} iq-stat-card p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 iq-soft flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Barre d'action */}
          <div className="iq-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {rapports.length} rapport(s) · Scopes 1/2/3
              </p>
            </div>
            <button
              onClick={() => setShowGenerator(true)}
              className="iq-btn-primary text-sm"
            >
              <Plus className="w-4 h-4" />
              Générer un rapport
            </button>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : rapports.length === 0 ? (
            <div className="iq-card flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText className="w-14 h-14 mb-4 opacity-20" />
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                Aucun rapport généré
              </p>
              <p className="text-sm mt-1 text-center max-w-sm">
                Cliquez sur "Générer un rapport" pour créer votre premier rapport carbone conforme GHG Protocol
              </p>
              <button
                onClick={() => setShowGenerator(true)}
                className="mt-4 flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Générer maintenant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rapports.map(rapport => (
                <RapportCard
                  key={rapport.id_rapport}
                  rapport={rapport}
                  onView={chargerDetail}
                  onSoumettre={(id) => changerStatut(id, 'SOUMIS')}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal génération */}
      {showGenerator && (
        <RapportGenerator
          generating={generating}
          onGenerate={handleGenerate}
          onClose={() => setShowGenerator(false)}
        />
      )}

      {/* Modal détail */}
      {(rapportDetail || loadingDetail) && (
        <RapportDetail
          rapport={rapportDetail}
          loading={loadingDetail}
          onClose={fermerDetail}
          onStatut={changerStatut as (id: string, statut: string) => void}
        />
      )}
    </div>
  );
}