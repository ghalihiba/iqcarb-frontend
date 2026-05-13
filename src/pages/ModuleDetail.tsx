/**
 * IQcarb — ModuleDetail.tsx (mis à jour)
 * Gestion des modules verrouillés (Premium requis)
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Crown, Lock, Play } from 'lucide-react';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar    from '@/components/lms/ProgressBar';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import lmsService     from '@/services/lmsService';
import type { Cours, Module } from '@/types/lms.types';

type ModuleDetailData = Module & {
  cours:          Cours[];
  est_gratuit:    boolean;
  est_verrouille?: boolean;
};

export default function ModuleDetail() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleDetailData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [verrouille, setVerrouille] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await lmsService.getModuleDetail(id);
        setModuleData(res.data.data);
        setVerrouille(res.data.data?.est_verrouille === true);
      } catch (err: any) {
        // 402 = module verrouillé → rediriger vers premium
        if (err.response?.status === 402) {
          navigate('/lms/premium');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="iq-shell">
        <Sidebar />
        <main className="iq-main flex items-center justify-center">
          <LoadingSpinner message="Chargement du module..." />
        </main>
      </div>
    );
  }

  if (!moduleData) return null;

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative overflow-y-auto">
        <Header title={moduleData.titre} subtitle="Contenu du module et progression" />
        <div className="iq-content">
          <LMSBreadcrumb items={[
            { label: 'Apprentissage', to: '/lms' },
            { label: 'Parcours', to: `/lms/parcours/${moduleData.id_parcours}` },
            { label: moduleData.titre }
          ]} />

          <button
            onClick={() => navigate(`/lms/parcours/${moduleData.id_parcours}`)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au parcours
          </button>

          {/* Badge gratuit */}
          {moduleData.est_gratuit && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 w-fit">
              ✨ Module gratuit — accessible sans abonnement
            </div>
          )}

          <div className="iq-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {moduleData.description}
            </p>
            <ProgressBar value={moduleData.progression ?? 0} label="Progression du module" />
          </div>

          <div className="space-y-3">
            {moduleData.cours?.map((cours, idx) => {
              const precedentTermine = idx === 0 || !!moduleData.cours?.[idx - 1]?.est_complete;
              const estVerrouilleCours = !precedentTermine;

              return (
                <div
                  key={cours.id_cours}
                  className={`iq-card p-5 ${estVerrouilleCours ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {cours.titre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" />
                        {cours.duree_minutes ?? 0} min
                      </p>
                    </div>

                    {estVerrouilleCours ? (
                      <span className="text-xs text-gray-400">
                        Complétez le cours précédent
                      </span>
                    ) : (
                      <Link
                        to={`/lms/cours/${cours.id_cours}`}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                          cours.est_complete
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {cours.est_complete
                          ? <><CheckCircle className="w-4 h-4" /> Revoir</>
                          : <><Play className="w-4 h-4" /> Commencer</>
                        }
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}