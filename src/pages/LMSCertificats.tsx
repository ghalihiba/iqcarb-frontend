import { useEffect, useMemo, useState } from 'react';
import { Award, BadgeCheck, Search, Sparkles } from 'lucide-react';
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
  date_fin?: string | null;
}

export default function LMSCertificats() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [certificats, setCertificats] = useState<ProgressionItem[]>([]);
  const [xpTotal, setXpTotal] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [progRes, profilRes] = await Promise.all([
        lmsService.getProgression(),
        lmsService.getProfilApprenant(),
      ]);
      const rows = (progRes.data.data?.inscriptions ?? []) as ProgressionItem[];
      const completed = rows.filter(
        (item) =>
          item.statut_simulation === 'TERMINE' || Number(item.progression ?? 0) >= 100
      );
      setCertificats(completed);
      setXpTotal(Number(profilRes.data.data?.points_xp_total ?? 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      certificats.filter((c) =>
        c.titre.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [certificats, query]
  );

  const badges = [
    { label: 'Starter Climat', unlocked: xpTotal >= 50, helper: '50 XP' },
    { label: 'Apprenant régulier', unlocked: certificats.length >= 2, helper: '2 certificats' },
    { label: 'Expert progression', unlocked: certificats.length >= 5, helper: '5 certificats' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement des certificats..." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header
          title="Certificats"
          subtitle="Vos certificats et badges collectés depuis l’apprentissage"
          onRefresh={loadData}
        />

        <div className="p-8 space-y-6">
          <LMSBreadcrumb
            items={[{ label: 'Apprentissage', to: '/lms' }, { label: 'Certificats' }]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-white">{badge.label}</p>
                  <BadgeCheck
                    className={`w-5 h-5 ${
                      badge.unlocked ? 'text-green-600' : 'text-gray-300'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{badge.helper}</p>
              </div>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher des certificats..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun certificat trouvé.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id_parcours}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.titre}</p>
                    <p className="text-sm text-gray-500">Niveau: {item.niveau}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Terminé le:{' '}
                      {item.date_fin ? new Date(item.date_fin).toLocaleDateString('fr-FR') : 'Date non disponible'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Certificat de réussite
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
