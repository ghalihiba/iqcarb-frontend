import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LMSBreadcrumb from '@/components/lms/LMSBreadcrumb';
import lmsService from '@/services/lmsService';
import { BarChart3, CheckCircle2, Clock3, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EquipeProgressionRow {
  id_utilisateur: string;
  nom: string;
  prenom: string;
  email: string;
  parcours_titre: string;
  progression: number | string;
  statut_simulation: string;
}

interface FormateurStats {
  nb_apprenants: number;
  nb_parcours: number;
  nb_cours_termines: number;
}

export default function LMSFormateurSuivi() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FormateurStats | null>(null);
  const [rows, setRows] = useState<EquipeProgressionRow[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, progressionRes] = await Promise.all([
        lmsService.getApprenantsStats(),
        lmsService.getEquipeProgression(),
      ]);
      setStats(statsRes.data.data ?? null);
      setRows(progressionRes.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const progressionMoyenne = useMemo(() => {
    if (!rows.length) return 0;
    const total = rows.reduce((sum, row) => sum + Number(row.progression ?? 0), 0);
    return Math.round(total / rows.length);
  }, [rows]);

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative">
        <Header
          title="Suivi progression"
          subtitle="Vue formateur: avancement des apprenants par parcours et modules"
          onRefresh={fetchData}
        />

        <div className="iq-content">
          <LMSBreadcrumb items={[{ label: 'Apprentissage', to: '/lms' }, { label: 'Suivi progression' }]} />
          <div className="flex justify-end">
            <Link to="/lms/formateur" className="iq-btn-primary text-sm">
              Gerer contenus
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Apprenants', value: stats?.nb_apprenants ?? 0, icon: Users },
              { label: 'Parcours', value: stats?.nb_parcours ?? 0, icon: BarChart3 },
              { label: 'Cours terminés', value: stats?.nb_cours_termines ?? 0, icon: CheckCircle2 },
              { label: 'Progression moyenne', value: `${progressionMoyenne}%`, icon: Clock3 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="iq-stat-card p-4">
                <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="iq-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">Progression de l’équipe</h2>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-gray-500 dark:text-gray-400">Chargement...</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-sm text-gray-500 dark:text-gray-400">Aucune donnée de progression disponible.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/10">
                {rows.map((row, idx) => {
                  const pct = Math.max(0, Math.min(100, Number(row.progression ?? 0)));
                  return (
                    <div key={`${row.id_utilisateur}-${idx}`} className="p-5">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {row.prenom} {row.nom}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {row.email} - {row.parcours_titre}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold">
                          {row.statut_simulation}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
