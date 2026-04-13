import Sidebar            from '@/components/common/Sidebar';
import Header             from '@/components/common/Header';
import LoadingSpinner     from '@/components/common/LoadingSpinner';
import ParcoursCard       from '@/components/lms/ParcoursCard';
import LMSBreadcrumb      from '@/components/lms/LMSBreadcrumb';
import { useLMS }         from '@/hooks/useLMS';
import { useAuth }        from '@/hooks/useAuth';
import { Link }           from 'react-router-dom';
import {
  BookOpen, Award, Target,
  TrendingUp, CheckCircle, AlertCircle, ShieldCheck
} from 'lucide-react';

export default function LMSHome() {
  const { parcours, profil, loading, error, success, inscrire, refetch } = useLMS();
  const { user } = useAuth();
  const rolePrincipale = user?.roles?.[0] ?? 'ETUDIANT';

  const parcoursEnCours  = parcours.filter(p => p.statut === 'EN_COURS');
  const parcoursTermines = parcours.filter(p => p.statut === 'TERMINE');

  if (loading) return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <LoadingSpinner message="Chargement de votre espace d'apprentissage..." />
      </main>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="ml-64 flex-1 overflow-y-auto">
        <Header
          title="Espace Apprentissage"
          subtitle="IQcarb Learning — Pilotage carbone & conformité"
          onRefresh={refetch}
        />

        <div className="p-8 space-y-8">
          <LMSBreadcrumb items={[{ label: 'Apprentissage' }]} />

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-2xl">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Bienvenue + Stats profil */}
          <div className="bg-gradient-to-r from-primary-900 to-primary-700 dark:from-primary-800 dark:to-primary-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-200 text-sm mb-1">Bienvenue,</p>
                <h2 className="text-2xl font-bold">
                  {user?.prenom} {user?.nom} 👋
                </h2>
                <p className="text-primary-300 text-sm mt-1">
                  Continuez votre parcours d'apprentissage carbone
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Rôle: {rolePrincipale}
                  </span>
                  {['ETUDIANT', 'FORMATEUR'].includes(rolePrincipale) && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-400/20 text-green-100 border border-green-300/30">
                      Apprenant actif
                    </span>
                  )}
                </div>
              </div>
              {profil && (
                <div className="text-right">
                  <p className="text-primary-200 text-xs mb-1">Points XP</p>
                  <p className="text-4xl font-black text-yellow-400">
                    {profil.points_xp_total}
                  </p>
                  <p className="text-primary-300 text-xs">XP accumulés</p>
                </div>
              )}
            </div>

            {/* Stats en ligne */}
            {profil && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Parcours', value: profil.nb_parcours,         icon: BookOpen },
                  { label: 'Terminés', value: parcoursTermines.length,    icon: CheckCircle },
                  { label: 'Cours OK', value: profil.nb_cours_termines,   icon: Target },
                  { label: 'Progression', value: `${profil.progression_moyenne}%`, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                    <Icon className="w-5 h-5 mx-auto mb-1 text-primary-200" />
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-primary-300">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              to="/lms/progression"
              className="text-sm px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              Voir ma progression globale
            </Link>
          </div>

          {/* Parcours en cours */}
          {parcoursEnCours.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Mes parcours en cours
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {parcoursEnCours.map(p => (
                  <ParcoursCard
                    key={p.id_parcours}
                    parcours={p}
                    onInscrire={inscrire}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tous les parcours disponibles */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                Catalogue des parcours
              </h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {parcours.length} parcours disponibles
              </span>
            </div>

            {parcours.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Aucun parcours disponible
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Les parcours seront publiés prochainement
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {parcours.map(p => (
                  <ParcoursCard
                    key={p.id_parcours}
                    parcours={p}
                    onInscrire={inscrire}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Parcours terminés */}
          {parcoursTermines.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Parcours complétés 🏆
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {parcoursTermines.map(p => (
                  <ParcoursCard
                    key={p.id_parcours}
                    parcours={p}
                    onInscrire={inscrire}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}