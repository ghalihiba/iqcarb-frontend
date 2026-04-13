import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar        from '@/components/common/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NiveauBadge    from '@/components/lms/NiveauBadge';
import ProgressBar    from '@/components/lms/ProgressBar';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import lmsService     from '@/services/lmsService';
import type { Parcours, Module } from '@/types/lms.types';
import {
  BookOpen, Clock,
  CheckCircle, Lock, Play,
  ArrowLeft
} from 'lucide-react';

export default function ParcoursDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [data,     setData]     = useState<(Parcours & { modules: Module[] }) | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [inscrit,  setInscrit]  = useState(false);
  const [inscribing, setInscribing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await lmsService.getParcoursDetail(id);
        setData(res.data.data);
        setInscrit(res.data.data.est_inscrit);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleInscrire = async () => {
    if (!id) return;
    setInscribing(true);
    try {
      await lmsService.inscrire(id);
      setInscrit(true);
      const res = await lmsService.getParcoursDetail(id);
      setData(res.data.data);
    } finally {
      setInscribing(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <LoadingSpinner message="Chargement du parcours..." />
      </main>
    </div>
  );

  if (!data) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-y-auto">
        <div className="p-8">
          <LMSBreadcrumb
            items={[
              { label: 'Apprentissage', to: '/lms' },
              { label: data.titre }
            ]}
          />

          {/* Retour */}
          <button
            onClick={() => navigate('/lms')}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </button>

          {/* Header parcours */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <NiveauBadge niveau={data.niveau} size="md" />
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {data.nb_modules} modules · {Math.round((data.duree_estimee ?? 0) / 60)}h estimées
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {data.titre}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {data.description}
                </p>
                {data.objectifs && (
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2">
                      🎯 Objectifs
                    </p>
                    <p className="text-sm text-primary-600 dark:text-primary-300">
                      {data.objectifs}
                    </p>
                  </div>
                )}
              </div>

              {/* Action */}
<div className="ml-6 flex-shrink-0 text-center">
  {(data.progression ?? 0) > 0 && (
    <div className="mb-3 w-32">
      <ProgressBar value={data.progression ?? 0} size="md" />
    </div>
  )}
                {inscrit ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Inscrit
                  </div>
                ) : (
                  <button
                    onClick={handleInscrire}
                    disabled={inscribing}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {inscribing ? 'Inscription...' : 'S\'inscrire'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste des modules */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Contenu du parcours
          </h2>

          <div className="space-y-3">
            {data.modules.map((module, idx) => {
              const estInscriptionRequise = data.type_acces !== 'LIBRE';
              const estInscriptionOk = !estInscriptionRequise || inscrit;
              const modulePrecedent = idx > 0 ? data.modules[idx - 1] : null;
              const estParcoursGuide = data.type_acces === 'GUIDE' || data.type_acces === 'PREREQUIS';
              const prerequisOk = !estParcoursGuide || idx === 0 || modulePrecedent?.statut === 'TERMINE';
              const estVerrouille = !(estInscriptionOk && prerequisOk);

              return (
                <div
                  key={module.id_module}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm p-5 ${
                    estVerrouille
                      ? 'border-gray-100 dark:border-gray-700 opacity-60'
                      : 'border-gray-100 dark:border-gray-700 hover:shadow-md transition-all'
                  }`}
                >
                  <div className="flex items-center gap-4">

                    {/* Numéro */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center
                      font-bold text-sm flex-shrink-0
                      ${module.statut === 'TERMINE'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : module.statut === 'EN_COURS'
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      {module.statut === 'TERMINE'
                        ? <CheckCircle className="w-5 h-5" />
                        : estVerrouille
                        ? <Lock className="w-4 h-4" />
                        : idx + 1
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {module.titre}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {module.nb_cours} cours
                        </span>
                        {module.duree_estimee && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.duree_estimee} min
                          </span>
                        )}
                      </div>
                      {module.statut !== 'NON_COMMENCE' && (
                        <div className="mt-2 w-48">
                          <ProgressBar
                            value={module.progression ?? 0}
                            size="sm"
                            showPct={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Bouton */}
                    {!estVerrouille && (
                      <Link
                        to={`/lms/modules/${module.id_module}`}
                        className={`
                          flex items-center gap-1.5 px-4 py-2 rounded-xl
                          text-sm font-semibold transition-colors flex-shrink-0
                          ${module.statut === 'TERMINE'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                          }
                        `}
                      >
                        {module.statut === 'TERMINE'
                          ? <><CheckCircle className="w-4 h-4" /> Revoir</>
                          : module.statut === 'EN_COURS'
                          ? <><Play className="w-4 h-4" /> Continuer</>
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