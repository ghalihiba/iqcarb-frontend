import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Video, HelpCircle,
  Clock, CheckCircle, ChevronLeft, ChevronRight,
  CreditCard, Briefcase,
} from 'lucide-react';

import Sidebar        from '@/components/common/Sidebar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import { useToast }   from '@/components/common/Toast';
import CoursSidebar   from '@/components/lms/CoursSidebar';
import QuizPlayer     from '@/components/lms/QuizPlayer';
import FlashcardDeck  from '@/components/lms/FlashcardDeck';

import lmsService from '@/services/lmsService';
import type { Cours, Module, Parcours } from '@/types/lms.types';

// ─── Types ────────────────────────────────────────────────────
type FullParcours = Parcours & { modules: (Module & { cours: Cours[] })[] };

// ─── Glossaire carbone ────────────────────────────────────────
const CARBON_GLOSSARY: Record<string, string> = {
  'CO₂e':         'Dioxyde de carbone équivalent — unité commune pour tous les GES',
  'Scope 1':      'Émissions directes de sources appartenant à l\'organisation',
  'Scope 2':      'Émissions indirectes liées à l\'énergie achetée',
  'Scope 3':      'Autres émissions indirectes dans la chaîne de valeur',
  'GES':          'Gaz à Effet de Serre : CO₂, CH₄, N₂O, HFC, PFC, SF₆...',
  'MRV':          'Monitoring, Reporting, Verification',
  'GHG Protocol': 'Standard international de comptabilité carbone',
  'ISO 14064':    'Norme internationale GES',
  'CSRD':         'Corporate Sustainability Reporting Directive',
  'PRG':          'Potentiel de Réchauffement Global sur 100 ans',
  'tCO₂e':        'Tonnes de CO₂ équivalent',
};

// ─── parseMarkdown ────────────────────────────────────────────
function parseMarkdown(text: string): string {
  if (!text) return '';
  let r = text;

  // Tableaux
  r = r.replace(/^\|(.+)\|$/gm, (_, cells) => {
    const tds = cells.split('|').map((c: string) =>
      `<td style="padding:8px 12px;border:1px solid #374151;font-size:13px">${c.trim()}</td>`
    ).join('');
    return `<tr>${tds}</tr>`;
  });
  r = r.replace(/((<tr>.*<\/tr>\n?)+)/gs,
    '<div style="overflow-x:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse">$1</table></div>'
  );

  r = r.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #374151;margin:24px 0"/>');
  r = r.replace(/^>\s*(.+)$/gm,
    '<blockquote style="border-left:4px solid #10b981;padding:12px 16px;margin:16px 0;background:rgba(16,185,129,0.08);border-radius:0 8px 8px 0;color:#d1fae5;font-style:italic">$1</blockquote>'
  );
  r = r.replace(/^### (.+)$/gm,
    '<h3 style="font-size:15px;font-weight:700;color:#f9fafb;margin:20px 0 8px">$1</h3>'
  );
  r = r.replace(/^## (.+)$/gm,
    '<h2 style="font-size:18px;font-weight:700;color:#f9fafb;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid #374151">$1</h2>'
  );
  r = r.replace(/^- (.+)$/gm,
    '<li style="display:flex;gap:8px;margin:4px 0;color:#d1d5db;font-size:14px"><span style="color:#10b981">●</span><span>$1</span></li>'
  );
  r = r.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs,
    '<ul style="list-style:none;padding:0;margin:12px 0">$&</ul>'
  );
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#f9fafb">$1</strong>');
  r = r.replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>');
  r = r.replace(/^(?!<[hublpdt]|<\/|<strong|<em|<blockquote)(.+)$/gm,
    '<p style="color:#d1d5db;font-size:14px;line-height:1.7;margin:8px 0">$1</p>'
  );

  // Surligner termes glossaire
  Object.entries(CARBON_GLOSSARY).forEach(([term, def]) => {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    r = r.replace(
      new RegExp(`(?<!title=")\\b(${esc})\\b`, 'g'),
      `<span title="${def}" style="border-bottom:1px dashed #10b981;color:#6ee7b7;cursor:help">$1</span>`
    );
  });

  return r;
}

// ─── ArticleReader ────────────────────────────────────────────
function ArticleReader({ contenu, onComplete, isCompleted }: {
  contenu: string; onComplete: () => void; isCompleted: boolean;
}) {
  const words = Math.ceil(contenu.split(/\s+/).filter(Boolean).length / 200);
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
        <Clock className="w-3.5 h-3.5" />
        <span>Lecture estimée : {words} min</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: parseMarkdown(contenu) }} />
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isCompleted ? '✓ Complété' : 'Lu cet article ?'}
        </p>
        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-default'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {isCompleted ? 'Complété' : 'Marquer comme lu'}
        </button>
      </div>
    </div>
  );
}

// ─── VideoPlayer ──────────────────────────────────────────────
function VideoPlayer({ url, onComplete, isCompleted }: {
  url: string; onComplete: () => void; isCompleted: boolean;
}) {
  const getId = (u: string) => {
    const patterns = [/youtube\.com\/watch\?v=([^&]+)/, /youtu\.be\/([^?]+)/, /youtube\.com\/embed\/([^?]+)/];
    for (const p of patterns) { const m = u.match(p); if (m) return m[1]; }
    return null;
  };
  const videoId = getId(url);

  return (
    <div className="max-w-3xl">
      {videoId ? (
        <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title="Vidéo" allow="autoplay; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline text-sm">{url}</a>
        </div>
      )}
      <div className="mt-6 flex justify-end">
        <button onClick={onComplete} disabled={isCompleted}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold ${
            isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 cursor-default' : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}>
          <CheckCircle className="w-4 h-4" />
          {isCompleted ? 'Complété' : 'J\'ai regardé'}
        </button>
      </div>
    </div>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    ARTICLE:    { label: 'Article',     icon: BookOpen,   cls: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
    VIDEO:      { label: 'Vidéo',       icon: Video,      cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
    QUIZ:       { label: 'Quiz',        icon: HelpCircle, cls: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
    FLASHCARD:  { label: 'Flashcards',  icon: CreditCard, cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
    CASE_STUDY: { label: 'Cas pratique',icon: Briefcase,  cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  };
  const cfg = map[type] ?? map.ARTICLE;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </span>
  );
}

// ─── Confetti ─────────────────────────────────────────────────
function Confetti() {
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${Math.random() * 100}%`, top: '-20px',
          width: `${6 + Math.random() * 8}px`, height: `${6 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          animation: `fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
          opacity: 0,
        }} />
      ))}
      <style>{`@keyframes fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// CoursDetail — Page principale
// ═════════════════════════════════════════════════════════════
export default function CoursDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast    = useToast();

  const [cours,        setCours]        = useState<Cours | null>(null);
  const [parcours,     setParcours]     = useState<FullParcours | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const completingRef = useRef(false);

  // ── Chargement des données ────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCours(null);
    setParcours(null);

    const load = async () => {
      try {
        // 1. Charger le cours
        const coursRes  = await lmsService.getCours(id);
        const coursData: Cours = coursRes.data?.data ?? coursRes.data;
        setCours(coursData);

        // 2. Récupérer l'id_parcours depuis le cours
        // Le backend retourne id_parcours dans la réponse getCours
        const id_parcours: string | undefined =
          (coursData as Cours & { id_parcours?: string }).id_parcours;

        if (!id_parcours) return;

        // 3. Charger le parcours (sans cours imbriqués)
        const parcoursRes  = await lmsService.getParcoursDetail(id_parcours);
        const parcoursData = parcoursRes.data?.data ?? parcoursRes.data;

        // 4. Charger les cours de chaque module séparément
        // ⚠️ getParcoursDetail retourne modules[] mais SANS cours[] dans chaque module
        // On charge chaque module individuellement pour avoir ses cours
        const rawModules: Module[] = parcoursData?.modules ?? [];
        const modulesAvecCours: (Module & { cours: Cours[] })[] = [];

        for (const m of rawModules) {
          try {
            const modRes  = await lmsService.getModuleDetail(m.id_module);
            const modData = modRes.data?.data ?? modRes.data;
            modulesAvecCours.push({
              ...m,
              cours: Array.isArray(modData?.cours) ? modData.cours : [],
            });
          } catch {
            // Si le module échoue, on l'ajoute sans cours
            modulesAvecCours.push({ ...m, cours: [] });
          }
        }

        const fullParcours: FullParcours = {
          ...parcoursData,
          modules: modulesAvecCours,
        };
        setParcours(fullParcours);

        // 5. Construire le set des cours déjà complétés
        const completed = new Set<string>();
        modulesAvecCours.forEach((m) => {
          (m.cours ?? []).forEach((c) => {
            if (c.est_complete) completed.add(c.id_cours);
          });
        });
        setCompletedIds(completed);

      } catch (err) {
        console.error('[CoursDetail] Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ── Marquer cours comme complété ──────────────────────────
  const handleComplete = useCallback(async () => {
    if (!id || completingRef.current || completedIds.has(id)) return;
    completingRef.current = true;
    try {
      await lmsService.terminerCours(id);
      setCompletedIds((prev) => new Set([...prev, id]));
      toast.success('✓ Cours complété ! +10 XP');

      if (parcours?.modules) {
        const mod = parcours.modules.find((m) =>
          (m.cours ?? []).some((c) => c.id_cours === id)
        );
        if (mod) {
          const newSet = new Set([...completedIds, id]);
          const done   = (mod.cours ?? []).every((c) => newSet.has(c.id_cours));
          if (done) {
            setShowConfetti(true);
            toast.success('🎯 Module terminé !');
            setTimeout(() => setShowConfetti(false), 3500);
          }
        }
      }
    } catch (err) {
      console.error('[CoursDetail] Erreur completion:', err);
      toast.error('Erreur', 'Impossible de marquer comme complété.');
    } finally {
      completingRef.current = false;
    }
  }, [id, completedIds, parcours, toast]);

  // ── Navigation précédent / suivant ────────────────────────
  const { prevCours, nextCours } = (() => {
    if (!parcours?.modules || !id) return { prevCours: null, nextCours: null };
    let prev: Cours | null = null;
    let next: Cours | null = null;
    let found = false;
    for (const m of parcours.modules) {
      const liste = m.cours ?? [];
      for (let i = 0; i < liste.length; i++) {
        const c = liste[i];
        if (found && !next) { next = c; break; }
        if (c.id_cours === id) { found = true; prev = liste[i - 1] ?? null; }
      }
      if (next) break;
    }
    return { prevCours: prev, nextCours: next };
  })();

  // ── Rendu contenu selon type ──────────────────────────────
  const renderContent = () => {
    if (!cours) return null;
    const isCompleted = completedIds.has(id ?? '');
    const type    = cours.type_contenu ?? 'ARTICLE';
    const contenu = (cours as Cours & { contenu?: string }).contenu ?? cours.contenu_url ?? '';

    if (type === 'VIDEO') {
      return <VideoPlayer url={contenu} onComplete={handleComplete} isCompleted={isCompleted} />;
    }

    if (type === 'QUIZ') {
      return (
        <QuizPlayer
          id_cours={id ?? ''}
          onComplete={handleComplete}
        />
      );
    }

    if (type === 'FLASHCARD') {
      return (
        <FlashcardDeck
          id_cours={id ?? ''}
          onComplete={handleComplete}
        />
      );
    }

    // ARTICLE (défaut)
    return (
      <ArticleReader contenu={contenu} onComplete={handleComplete} isCompleted={isCompleted} />
    );
  };

  // ── Loading state ─────────────────────────────────────────
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

      <div className="ml-64 flex-1 flex overflow-hidden">

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">

          {/* Header sticky */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 flex-shrink-0 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                {parcours && (
                  <LMSBreadcrumb items={[
                    { label: 'Apprentissage', to: '/lms' },
                    { label: parcours.titre, to: `/lms/parcours/${parcours.id_parcours}` },
                    { label: cours.titre },
                  ]} />
                )}
                <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {cours.titre}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {cours.duree_minutes ?? 0} min
              </span>
              <TypeBadge type={cours.type_contenu ?? 'ARTICLE'} />
              {completedIds.has(id ?? '') && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Complété
                </span>
              )}
            </div>
          </div>

          {/* Contenu du cours */}
          <div className="p-8">
            {renderContent()}
          </div>

          {/* Navigation bas de page */}
          <div className="px-8 pb-8 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6">
            {prevCours ? (
              <Link to={`/lms/cours/${prevCours.id_cours}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span className="line-clamp-1 max-w-[180px]">{prevCours.titre}</span>
              </Link>
            ) : <div />}

            {nextCours && (
              <Link
                to={`/lms/cours/${nextCours.id_cours}`}
                onClick={(e) => { if (!completedIds.has(id ?? '')) e.preventDefault(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  completedIds.has(id ?? '')
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="line-clamp-1 max-w-[180px]">{nextCours.titre}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </main>

        {/* Sidebar droite — seulement si parcours + modules chargés */}
        {parcours && (parcours.modules?.length ?? 0) > 0 && (
          <CoursSidebar
            parcours={parcours}
            currentCoursId={id ?? ''}
            completedIds={completedIds}
          />
        )}
      </div>

      {showConfetti && <Confetti />}
    </div>
  );
}