/**
 * IQcarb — ParcoursDetail.tsx (mis à jour)
 * Affiche le cadenas + bouton Premium sur modules verrouillés
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NiveauBadge    from '@/components/lms/NiveauBadge';
import ProgressBar    from '@/components/lms/ProgressBar';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import lmsService     from '@/services/lmsService';
import type { Parcours, Module } from '@/types/lms.types';
import {
  ArrowLeft, BookOpen, CheckCircle,
  Clock, Crown, Lock, Play, Sparkles, Zap
} from 'lucide-react';

type ModuleAvecVerrou = Module & { est_verrouille?: boolean; est_gratuit?: boolean };

export default function ParcoursDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data,       setData]       = useState<(Parcours & { modules: ModuleAvecVerrou[] }) | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [inscrit,    setInscrit]    = useState(false);
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
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main flex items-center justify-center">
        <LoadingSpinner message="Chargement du parcours..." />
      </main>
    </div>
  );

  if (!data) return null;

  const nbVerrouilles = data.modules.filter(m => m.est_verrouille).length;

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative overflow-y-auto">
        <Header title="Détail parcours" subtitle="Structure du parcours, modules et progression" />
        <div className="iq-content">
          <LMSBreadcrumb items={[
            { label: 'Apprentissage', to: '/lms' },
            { label: data.titre }
          ]} />

          <button
            onClick={() => navigate('/lms')}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </button>

          {/* Bannière Premium si des modules sont verrouillés */}
          {nbVerrouilles > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                    {nbVerrouilles} module(s) nécessitent un abonnement Premium
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Le premier module est gratuit. Débloquez tout avec un abonnement.
                  </p>
                </div>
              </div>
              <Link
                to="/lms/premium"
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex-shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                Passer Premium
              </Link>
            </div>
          )}

          {/* Header parcours */}
          <div className="iq-card p-6">
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">{data.description}</p>
                {data.objectifs && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                      🎯 Objectifs
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">{data.objectifs}</p>
                  </div>
                )}
              </div>
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Contenu du parcours
          </h2>

          <div className="space-y-3">
            {data.modules.map((module, idx) => {
              const estVerrouilleModule = module.est_verrouille === true;
              const estInscriptionRequise = data.type_acces !== 'LIBRE';
              const estInscriptionOk = !estInscriptionRequise || inscrit;
              const modulePrecedent  = idx > 0 ? data.modules[idx - 1] : null;
              const estParcoursGuide = data.type_acces === 'GUIDE' || data.type_acces === 'PREREQUIS';
              const prerequisOk      = !estParcoursGuide || idx === 0 || modulePrecedent?.statut === 'TERMINE';
              const estVerrouilleParcours = !(estInscriptionOk && prerequisOk);

              return (
                <div
                  key={module.id_module}
                  className={`iq-card p-5 ${
                    (estVerrouilleModule || estVerrouilleParcours) ? 'opacity-70' : 'hover:shadow-md transition-all'
                  }`}
                >
                  <div className="flex items-center gap-4">

                    {/* Numéro / Icône */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      estVerrouilleModule
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : module.statut === 'TERMINE'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : module.statut === 'EN_COURS'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {estVerrouilleModule
                        ? <Crown className="w-4 h-4 text-amber-500" />
                        : module.statut === 'TERMINE'
                        ? <CheckCircle className="w-5 h-5" />
                        : estVerrouilleParcours
                        ? <Lock className="w-4 h-4" />
                        : idx + 1
                      }
                    </div>

                    {/* Info module */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {module.titre}
                        </h3>
                        {module.est_gratuit && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                            Gratuit
                          </span>
                        )}
                        {estVerrouilleModule && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
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
                      {module.statut !== 'NON_COMMENCE' && !estVerrouilleModule && (
                        <div className="mt-2 w-48">
                          <ProgressBar value={module.progression ?? 0} size="sm" showPct={false} />
                        </div>
                      )}
                    </div>

                    {/* Bouton action */}
                    {estVerrouilleModule ? (
                      <Link
                        to="/lms/premium"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors flex-shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Débloquer
                      </Link>
                    ) : !estVerrouilleParcours ? (
                      <Link
                        to={`/lms/modules/${module.id_module}`}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 ${
                          module.statut === 'TERMINE'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {module.statut === 'TERMINE'
                          ? <><CheckCircle className="w-4 h-4" /> Revoir</>
                          : module.statut === 'EN_COURS'
                          ? <><Play className="w-4 h-4" /> Continuer</>
                          : <><Play className="w-4 h-4" /> Commencer</>
                        }
                      </Link>
                    ) : null}
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