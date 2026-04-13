import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Play } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar from '@/components/lms/ProgressBar';
import LMSBreadcrumb from '@/components/lms/LMSBreadcrumb';
import lmsService from '@/services/lmsService';
import type { Cours, Module } from '@/types/lms.types';

type ModuleDetailData = Module & { cours: Cours[] };

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await lmsService.getModuleDetail(id);
        setModuleData(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement du module..." />
        </main>
      </div>
    );
  }

  if (!moduleData) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title={moduleData.titre} subtitle="Contenu du module et progression" />
        <div className="p-8 space-y-6">
          <LMSBreadcrumb
            items={[
              { label: 'Apprentissage', to: '/lms' },
              { label: 'Parcours', to: `/lms/parcours/${moduleData.id_parcours}` },
              { label: moduleData.titre }
            ]}
          />
          <button
            onClick={() => navigate(`/lms/parcours/${moduleData.id_parcours}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au parcours
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{moduleData.description}</p>
            <ProgressBar value={moduleData.progression ?? 0} label="Progression du module" />
          </div>

          <div className="space-y-3">
            {moduleData.cours?.map((cours, idx) => {
              const precedentTermine = idx === 0 || !!moduleData.cours?.[idx - 1]?.est_complete;
              const estVerrouille = !precedentTermine;

              return (
                <div
                  key={cours.id_cours}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border ${estVerrouille ? 'opacity-60 border-gray-100 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cours.titre}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" />
                        {cours.duree_minutes ?? 0} min
                      </p>
                    </div>
                    {estVerrouille ? (
                      <span className="text-xs text-gray-400">Complétez le cours précédent</span>
                    ) : (
                      <Link
                        to={`/lms/cours/${cours.id_cours}`}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${cours.est_complete ? 'bg-green-50 text-green-700' : 'bg-primary-600 text-white'}`}
                      >
                        {cours.est_complete ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {cours.est_complete ? 'Revoir' : 'Commencer'}
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
