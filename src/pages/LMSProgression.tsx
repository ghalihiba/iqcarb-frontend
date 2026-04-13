import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BarChart3, BookOpen, TrendingUp } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LMSBreadcrumb from '@/components/lms/LMSBreadcrumb';
import lmsService from '@/services/lmsService';

interface ProgressionItem {
  id_parcours: string;
  titre: string;
  niveau: string;
  progression: number | string;
  statut_simulation: string;
  date_debut?: string;
}

interface ProgressionData {
  inscriptions: ProgressionItem[];
  stats: {
    nb_inscrits: number;
    nb_termines: number;
    nb_en_cours: number;
    progression_moy: number;
  };
}

export default function LMSProgression() {
  const [data, setData] = useState<ProgressionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgression = async () => {
    setLoading(true);
    try {
      const res = await lmsService.getProgression();
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgression();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement de la progression..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title="Progression globale apprenant" subtitle="Suivi des parcours et avancement global" onRefresh={fetchProgression} />
        <div className="p-8 space-y-6">
          <LMSBreadcrumb items={[{ label: 'Apprentissage', to: '/lms' }, { label: 'Progression globale' }]} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Parcours actifs', value: data?.stats.nb_inscrits ?? 0, icon: BookOpen },
              { label: 'Terminés', value: data?.stats.nb_termines ?? 0, icon: Award },
              { label: 'En cours', value: data?.stats.nb_en_cours ?? 0, icon: TrendingUp },
              { label: 'Progression moyenne', value: `${data?.stats.progression_moy ?? 0}%`, icon: BarChart3 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <Icon className="w-5 h-5 text-primary-600 mb-2" />
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Détail par parcours</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.inscriptions?.length ? data.inscriptions.map((item) => {
                const progression = Number(item.progression ?? 0);
                return (
                  <div key={item.id_parcours} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.titre}</p>
                      <p className="text-xs text-gray-500">Niveau: {item.niveau}</p>
                    </div>
                    <div className="flex items-center gap-3 min-w-[260px]">
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-primary-600" style={{ width: `${Math.min(progression, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-12 text-right">{progression}%</span>
                      <Link
                        to={`/lms/parcours/${item.id_parcours}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-semibold"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-8 text-center text-sm text-gray-500">
                  Aucune progression disponible pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
