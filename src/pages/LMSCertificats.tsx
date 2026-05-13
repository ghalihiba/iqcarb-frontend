/**
 * IQcarb — LMSCertificats.tsx
 * ─────────────────────────────────────────────────────────────
 * Page certificats de l'apprenant avec :
 *   - Liste des certificats obtenus (archivés en base)
 *   - Bouton "Générer" si parcours terminé mais pas encore certifié
 *   - Bouton "Télécharger PDF" pour chaque certificat existant
 *   - Badges de progression (gamification)
 *   - Vérification d'éligibilité en temps réel
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award, BadgeCheck, Download, FileCheck,
  Loader2, RefreshCw, Search, Sparkles, XCircle
} from 'lucide-react';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import lmsService     from '@/services/lmsService';
import api            from '@/services/api';

// ── Types ─────────────────────────────────────────────────────

interface Certificat {
  id_certification:   string;
  code_verification:  string;
  score_final:        number;
  nb_modules:         number;
  nb_quiz_valides:    number;
  date_obtention:     string;
  id_parcours:        string;
  parcours_titre:     string;
  parcours_niveau:    string;
  parcours_objectifs: string;
}

interface ParcoursEligible {
  id_parcours:  string;
  titre:        string;
  niveau:       string;
  progression:  number;
  statut_simulation: string;
}

// ── Constante couleur niveau ──────────────────────────────────
const NIVEAU_COLOR: Record<string, string> = {
  DEBUTANT:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  INTERMEDIAIRE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  AVANCE:        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  EXPERT:        'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

// ── Composant carte certificat obtenu ─────────────────────────
function CertificatCard({
  cert,
  onDownload,
  downloading
}: {
  cert: Certificat;
  onDownload: (id: string, titre: string) => void;
  downloading: boolean;
}) {
  const niveauKey = cert.parcours_niveau?.toUpperCase() ?? 'DEBUTANT';
  const dateStr   = cert.date_obtention
    ? new Date(cert.date_obtention).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      })
    : '—';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">

        {/* Icône */}
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
          <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${NIVEAU_COLOR[niveauKey] ?? NIVEAU_COLOR.DEBUTANT}`}>
              {cert.parcours_niveau}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1">
            {cert.parcours_titre}
          </h3>
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
            <span>Score : <span className="font-semibold text-gray-700 dark:text-gray-200">{parseFloat(String(cert.score_final ?? 0)).toFixed(1)}/100</span></span>
            <span>·</span>
            <span>{cert.nb_modules} module(s)</span>
            <span>·</span>
            <span>Obtenu le {dateStr}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono truncate">
            Réf: {cert.code_verification}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => onDownload(cert.id_certification, cert.parcours_titre)}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
          >
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            {downloading ? 'Export...' : 'PDF'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Composant carte parcours éligible (à certifier) ──────────
function EligibleCard({
  parcours,
  onGenerate,
  generating
}: {
  parcours: ParcoursEligible;
  onGenerate: (id: string) => void;
  generating: boolean;
}) {
  const niveauKey = parcours.niveau?.toUpperCase() ?? 'DEBUTANT';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${NIVEAU_COLOR[niveauKey] ?? NIVEAU_COLOR.DEBUTANT} mb-1 inline-block`}>
            {parcours.niveau}
          </span>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            {parcours.titre}
          </h3>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
            ✓ Parcours terminé — Certificat disponible
          </p>
        </div>
        <button
          onClick={() => onGenerate(parcours.id_parcours)}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex-shrink-0"
        >
          {generating
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Sparkles className="w-3.5 h-3.5" />
          }
          {generating ? 'Génération...' : 'Générer'}
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function LMSCertificats() {

  const [loading,        setLoading]        = useState(true);
  const [query,          setQuery]          = useState('');
  const [certificats,    setCertificats]    = useState<Certificat[]>([]);
  const [parcoursTermines, setParcoursTermines] = useState<ParcoursEligible[]>([]);
  const [xpTotal,        setXpTotal]        = useState(0);
  const [generatingId,   setGeneratingId]   = useState<string | null>(null);
  const [downloadingId,  setDownloadingId]  = useState<string | null>(null);
  const [toast,          setToast]          = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Toast auto-dismiss ──────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Chargement des données ──────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [certsRes, progRes, profilRes] = await Promise.all([
        api.get('/lms/certifications/mes-certificats'),
        lmsService.getProgression(),
        lmsService.getProfilApprenant()
      ]);

      setCertificats(certsRes.data.data ?? []);
      setXpTotal(Number(profilRes.data.data?.points_xp_total ?? 0));

      // Parcours terminés sans certificat → éligibles à la génération
      const certIds   = new Set((certsRes.data.data ?? []).map((c: Certificat) => c.id_parcours));
      const inscriptions: ParcoursEligible[] = progRes.data.data?.inscriptions ?? [];

      const eligibles = inscriptions.filter(p =>
        (p.statut_simulation === 'TERMINE' || Number(p.progression ?? 0) >= 100)
        && !certIds.has(p.id_parcours)
      );

      setParcoursTermines(eligibles);

    } catch (err) {
      console.error('❌ loadData LMSCertificats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Générer un certificat ────────────────────────────────────
  const handleGenerate = async (id_parcours: string) => {
    setGeneratingId(id_parcours);
    try {
      await api.post(`/lms/certifications/generer/${id_parcours}`);
      setToast({ type: 'success', message: 'Certificat généré avec succès ! Vous pouvez maintenant le télécharger.' });
      await loadData(); // Recharger pour afficher le nouveau certificat
    } catch (err: any) {
      const msg = err.response?.data?.raison ?? err.response?.data?.message ?? 'Erreur lors de la génération.';
      setToast({ type: 'error', message: msg });
    } finally {
      setGeneratingId(null);
    }
  };

  // ── Télécharger le PDF ────────────────────────────────────────
  const handleDownload = async (id_certification: string, titre: string) => {
    setDownloadingId(id_certification);
    try {
      const response = await api.get(
        `/lms/certifications/${id_certification}/telecharger`,
        { responseType: 'blob' }
      );

      const url      = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `IQcarb_Certificat_${titre.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ type: 'success', message: 'Certificat téléchargé.' });
    } catch {
      setToast({ type: 'error', message: 'Erreur lors du téléchargement.' });
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Filtrage ──────────────────────────────────────────────────
  const filtered = useMemo(() =>
    certificats.filter(c =>
      c.parcours_titre?.toLowerCase().includes(query.trim().toLowerCase())
    ),
    [certificats, query]
  );

  // ── Badges gamification ───────────────────────────────────────
  const badges = [
    { label: 'Premier pas',       unlocked: certificats.length >= 1,  helper: '1 certificat',  icon: '🌱' },
    { label: 'Apprenant actif',   unlocked: certificats.length >= 2,  helper: '2 certificats', icon: '📗' },
    { label: 'Expert carbone',    unlocked: certificats.length >= 3,  helper: '3 certificats', icon: '🏆' },
    { label: 'Maître XP',         unlocked: xpTotal >= 500,           helper: '500 XP',        icon: '⭐' },
  ];

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="iq-shell">
        <Sidebar />
        <main className="iq-main flex items-center justify-center">
          <LoadingSpinner message="Chargement des certificats..." />
        </main>
      </div>
    );
  }

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative overflow-y-auto">
        <Header
          title="Certificats & Badges"
          subtitle="Vos certifications de compétences carbone obtenues"
          onRefresh={loadData}
        />

        <div className="iq-content">
          <LMSBreadcrumb items={[
            { label: 'Apprentissage', to: '/lms' },
            { label: 'Certificats' }
          ]} />

          {/* Toast notification */}
          {toast && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
            }`}>
              {toast.type === 'success'
                ? <BadgeCheck className="w-4 h-4 flex-shrink-0" />
                : <XCircle    className="w-4 h-4 flex-shrink-0" />
              }
              {toast.message}
            </div>
          )}

          {/* Badges gamification */}
          <div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.label}
                  className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${
                    badge.unlocked
                      ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-900 border-dashed border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${badge.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {badge.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{badge.helper}</p>
                  </div>
                  <BadgeCheck className={`w-4 h-4 ml-auto flex-shrink-0 ${badge.unlocked ? 'text-emerald-500' : 'text-gray-200 dark:text-gray-700'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Parcours terminés éligibles à la certification */}
          {parcoursTermines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Certificats disponibles ({parcoursTermines.length})
                </h2>
              </div>
              <div className="space-y-3">
                {parcoursTermines.map(p => (
                  <EligibleCard
                    key={p.id_parcours}
                    parcours={p}
                    onGenerate={handleGenerate}
                    generating={generatingId === p.id_parcours}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Certificats obtenus */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Mes certificats ({certificats.length})
                </h2>
              </div>
              <button
                onClick={loadData}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </button>
            </div>

            {/* Barre de recherche */}
            {certificats.length > 0 && (
              <div className="relative max-w-sm mb-4">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un certificat..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            )}

            {/* Liste */}
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
                <Award className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {certificats.length === 0
                    ? 'Aucun certificat obtenu pour le moment'
                    : 'Aucun résultat pour cette recherche'
                  }
                </p>
                <p className="text-xs text-gray-400">
                  {certificats.length === 0
                    ? 'Terminez un parcours pour obtenir votre premier certificat.'
                    : 'Essayez un autre terme de recherche.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(cert => (
                  <CertificatCard
                    key={cert.id_certification}
                    cert={cert}
                    onDownload={handleDownload}
                    downloading={downloadingId === cert.id_certification}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}