import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/components/common/Toast';
import LMSBreadcrumb from '@/components/lms/LMSBreadcrumb';
import lmsService from '@/services/lmsService';
import type { Cours } from '@/types/lms.types';

type CoursDetailData = Cours & {
  module_titre: string;
  parcours_titre: string;
  id_parcours: string;
  navigation?: {
    precedent?: { id_cours: string };
    suivant?: { id_cours: string };
  };
};

export default function CoursDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [cours, setCours] = useState<CoursDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchCours = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await lmsService.getCours(id);
      setCours(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCours();
  }, [id]);

  const handleComplete = async () => {
    if (!id) return;
    setIsCompleting(true);
    try {
      await lmsService.terminerCours(id, 300);
      await fetchCours();
      toast.success('Cours validé', 'Votre progression a été mise à jour.');
    } catch {
      toast.error('Erreur', 'Impossible de valider ce cours pour le moment.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <LoadingSpinner message="Chargement du cours..." />
        </main>
      </div>
    );
  }

  if (!cours) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title={cours.titre} subtitle={`${cours.parcours_titre} · ${cours.module_titre}`} />
        <div className="p-8 space-y-5">
          <LMSBreadcrumb
            items={[
              { label: 'Apprentissage', to: '/lms' },
              { label: cours.parcours_titre, to: `/lms/parcours/${cours.id_parcours}` },
              { label: cours.module_titre, to: `/lms/modules/${cours.id_module}` },
              { label: cours.titre }
            ]}
          />
          <Link to={`/lms/modules/${cours.id_module}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
            Retour au module
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {cours.contenu || cours.description || 'Contenu du cours non disponible.'}
            </p>
            {cours.url_ressource && (
              <a
                href={cours.url_ressource}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center mt-4 text-primary-600 font-semibold text-sm"
              >
                Ouvrir la ressource
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              disabled={isCompleting || cours.est_complete}
              className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {cours.est_complete ? 'Cours déjà terminé' : isCompleting ? 'Validation...' : 'Marquer comme terminé'}
            </button>
            {cours.navigation?.suivant && (
              <Link
                to={`/lms/cours/${cours.navigation.suivant.id_cours}`}
                className="px-5 py-2.5 rounded-xl border border-primary-200 text-primary-700 text-sm font-semibold"
              >
                Cours suivant
              </Link>
            )}
            {cours.est_complete && (
              <Link
                to={`/lms/modules/${cours.id_module}`}
                className="px-5 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold inline-flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Revenir au module
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
