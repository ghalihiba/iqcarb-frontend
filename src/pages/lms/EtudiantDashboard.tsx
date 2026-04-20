import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Trophy, ChevronRight,
  Star, Target, TrendingUp, Play, CheckCircle, Lock
} from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import lmsService from '@/services/lmsService';
import { useAuth } from '@/hooks/useAuth';
import { useConformite } from '@/hooks/useConformite';

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface ParcoursCours {
  id_parcours: string;
  titre: string;
  niveau: string;
  progression: number;
  statut_simulation: string;
  date_debut?: string;
}

interface DashboardData {
  inscriptions: ParcoursCours[];
  stats: {
    nb_inscrits: number;
    nb_termines: number;
    nb_en_cours: number;
    progression_moy: number;
  };
}

const NIVEAU_COLOR: Record<string, string> = {
  DEBUTANT:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  INTERMEDIAIRE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  AVANCE:        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  EXPERT:        'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        className="text-gray-100 dark:text-gray-700" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        className="text-primary-500" strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function CourseCard({ item }: { item: ParcoursCours }) {
  const prog = Math.round(Number(item.progression ?? 0));
  const isComplete = item.statut_simulation === 'TERMINE' || prog === 100;
  const niveauKey = item.niveau?.toUpperCase() ?? 'DEBUTANT';

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md hover:border-primary-100 dark:hover:border-primary-800 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${NIVEAU_COLOR[niveauKey] ?? NIVEAU_COLOR.DEBUTANT}`}>
            {item.niveau}
          </span>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
            {item.titre}
          </h3>
        </div>
        <div className="relative flex-shrink-0">
          <CircularProgress value={prog} size={52} />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 rotate-90">
            {prog}%
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-primary-500'}`}
          style={{ width: `${Math.min(prog, 100)}%` }}
        />
      </div>

      <Link
        to={`/lms/parcours/${item.id_parcours}`}
        className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold transition-all
          ${isComplete
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
            : prog > 0
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200'
          }`}
      >
        {isComplete
          ? <><CheckCircle className="w-4 h-4" /> Revoir</>
          : prog > 0
          ? <><Play className="w-4 h-4" /> Continuer</>
          : <><Play className="w-4 h-4" /> Commencer</>
        }
      </Link>
    </div>
  );
}

export default function EtudiantDashboard() {
  const { user } = useAuth();
  const { data: conformiteData } = useConformite();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await lmsService.getProgression();
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement de votre espace..." />
        </main>
      </div>
    );
  }

  const stats = data?.stats;
  const enCours = data?.inscriptions?.filter(i => Number(i.progression) > 0 && Number(i.progression) < 100) ?? [];
  const nonCommences = data?.inscriptions?.filter(i => Number(i.progression) === 0) ?? [];
  const termines = data?.inscriptions?.filter(i => Number(i.progression) >= 100 || i.statut_simulation === 'TERMINE') ?? [];
  const prochainCours = enCours[0] ?? nonCommences[0] ?? null;
  const mrvChecks = [
    { label: 'Monitoring', status: conformiteData?.standards?.find((s) => s.code === 'MRV')?.checks?.[0]?.statut },
    { label: 'Reporting', status: conformiteData?.standards?.find((s) => s.code === 'MRV')?.checks?.[1]?.statut },
    { label: 'Vérification', status: conformiteData?.standards?.find((s) => s.code === 'MRV')?.checks?.[2]?.statut },
  ];
  const normes = conformiteData?.standards ?? [];

  const statCards: StatCard[] = [
    { label: 'Parcours actifs',   value: stats?.nb_inscrits ?? 0,        icon: BookOpen,   color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Terminés',          value: stats?.nb_termines ?? 0,         icon: Trophy,     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'En cours',          value: stats?.nb_en_cours ?? 0,         icon: TrendingUp, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Progression moy.',  value: `${stats?.progression_moy ?? 0}%`, icon: Target,  color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  const prenom = user?.prenom ?? 'Apprenant';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header
          title="Mon espace apprenant"
          subtitle="Suivez votre progression et continuez votre parcours"
          onRefresh={fetchData}
        />

        <div className="p-8 space-y-6">

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            welcome back, {prenom.toLowerCase()} !
          </p>

          {/* Banner style maquette */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
            <img src="/images/trophy-banner.png" alt="Progress banner" className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-transparent dark:from-gray-900/80 flex flex-col justify-center px-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Bravo pour vos progrès en climatologie !</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Continuez à réduire votre impact carbone et à gravir les échelons de conformité.</p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Layout maquette: progression + conformité */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Progression de la maîtrise carbone 🚀</h3>
                  <span className="text-sm font-bold text-primary-600">{stats?.progression_moy ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-1000"
                    style={{ width: `${Math.min(stats?.progression_moy ?? 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Débutant</span>
                  <span>Intermédiaire</span>
                  <span>Avancé</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Continuer votre apprentissage</h3>
                {prochainCours ? (
                  <div className="rounded-xl border border-primary-100 dark:border-primary-900 p-4 flex items-center justify-between gap-4 bg-primary-50/40 dark:bg-primary-900/10">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{prochainCours.titre}</p>
                      <p className="text-xs text-gray-500 mt-1">{prochainCours.niveau} · progression {Math.round(Number(prochainCours.progression ?? 0))}%</p>
                    </div>
                    <Link
                      to={`/lms/parcours/${prochainCours.id_parcours}`}
                      className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold"
                    >
                      Continuer
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun parcours actif pour le moment.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Suivi de conformité climatique</h3>
                <p className="text-xs text-gray-500 mb-2">MRV</p>
                <div className="space-y-2">
                  {mrvChecks.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className={item.status ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {item.status ? 'Validé' : 'En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Normes</h3>
                <div className="space-y-2">
                  {(normes.length ? normes : [
                    { nom: 'ISO 14064', conforme: false },
                    { nom: 'Bilan Carbone', conforme: false },
                    { nom: 'CSRD', conforme: false },
                  ]).map((n) => (
                    <div key={n.nom} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{n.nom}</span>
                      <span className={n.conforme ? 'text-green-600 font-semibold' : 'text-gray-500'}>{n.conforme ? 'Conforme' : 'En cours'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Parcours en cours */}
          {enCours.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary-500" />
                  En cours ({enCours.length})
                </h3>
                <Link to="/lms/progression" className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:underline">
                  Tout voir <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enCours.map(item => <CourseCard key={item.id_parcours} item={item} />)}
              </div>
            </section>
          )}

          {/* Parcours terminés */}
          {termines.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-emerald-500" />
                Terminés ({termines.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {termines.map(item => <CourseCard key={item.id_parcours} item={item} />)}
              </div>
            </section>
          )}

          {/* Parcours non commencés */}
          {nonCommences.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-gray-400" />
                À commencer ({nonCommences.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nonCommences.map(item => <CourseCard key={item.id_parcours} item={item} />)}
              </div>
            </section>
          )}

          {/* Etat vide */}
          {!data?.inscriptions?.length && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Aucun parcours pour le moment</h3>
              <p className="text-sm text-gray-500 mb-6">Inscrivez-vous à votre premier parcours pour commencer.</p>
              <Link
                to="/lms"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Voir le catalogue
              </Link>
            </div>
          )}

          {/* Raccourcis rapides */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/lms" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md hover:border-primary-100 dark:hover:border-primary-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Catalogue</p>
                <p className="text-xs text-gray-500">Découvrir de nouveaux parcours</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 ml-auto transition-colors" />
            </Link>
            <Link to="/lms/progression" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md hover:border-primary-100 dark:hover:border-primary-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Progression</p>
                <p className="text-xs text-gray-500">Voir mon avancement détaillé</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 ml-auto transition-colors" />
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}