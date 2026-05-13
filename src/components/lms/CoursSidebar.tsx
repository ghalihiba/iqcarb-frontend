import { Link } from 'react-router-dom';
import {
  CheckCircle, Play, Lock, BookOpen,
  Layers, ChevronDown, ChevronRight,
  FileText, Video, HelpCircle, CreditCard, Briefcase,
} from 'lucide-react';
import { useState } from 'react';
import ProgressBar from '@/components/lms/ProgressBar';
import type { Module, Cours, Parcours } from '@/types/lms.types';

// ─── Types ────────────────────────────────────────────────────
interface CoursSidebarProps {
  parcours: Parcours & { modules: (Module & { cours: Cours[] })[] };
  currentCoursId: string;
  completedIds: Set<string>;
}

// ─── Icône par type de contenu ────────────────────────────────
function TypeIcon({ type }: { type: string }) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';
  switch (type) {
    case 'VIDEO':      return <Video      className={`${cls} text-green-500`}    />;
    case 'QUIZ':       return <HelpCircle className={`${cls} text-green-500`}  />;
    case 'FLASHCARD':  return <CreditCard className={`${cls} text-amber-500`}   />;
    case 'ETUDE_DE_CAS':
    case 'CASE_STUDY': return <Briefcase  className={`${cls} text-emerald-500`} />;
    default:           return <FileText   className={`${cls} text-gray-400`}    />;
  }
}

// ═════════════════════════════════════════════════════════════
export default function CoursSidebar({ parcours, currentCoursId, completedIds }: CoursSidebarProps) {

  // ── Modules ouverts : celui qui contient le cours actif ──
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // ✅ Optional chaining pour éviter l'erreur si modules est undefined
    (parcours?.modules ?? []).forEach((m) => {
      if ((m.cours ?? []).some((c) => c.id_cours === currentCoursId)) {
        initial.add(m.id_module);
      }
    });
    return initial;
  });

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Progression globale ────────────────────────────────────
  // ✅ Optional chaining sur modules pour éviter crash si undefined
  const safeModules = parcours?.modules ?? [];

  const totalCours = safeModules.reduce(
    (acc, m) => acc + (m.cours?.length ?? 0), 0
  );
  const completedCount = safeModules.reduce(
    (acc, m) => acc + (m.cours?.filter((c) => completedIds.has(c.id_cours)).length ?? 0), 0
  );
  const progressionGlobale = totalCours > 0
    ? Math.round((completedCount / totalCours) * 100)
    : 0;

  // ── Pas de modules → ne pas afficher la sidebar ────────────
  if (safeModules.length === 0) return null;

  return (
    <aside
      className="w-72 flex-shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto"
      style={{
        background: 'var(--iq-surface)',
        borderLeft: '1px solid var(--iq-border)',
      }}
      aria-label="Navigation du parcours"
    >
      {/* En-tête */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--iq-border)' }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Parcours</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              {parcours?.titre ?? ''}
            </p>
          </div>
        </div>
        <ProgressBar
          value={progressionGlobale}
          size="sm"
          color="bg-green-600"
          pctClassName="text-green-600 dark:text-green-400"
          label={`${completedCount}/${totalCours} cours`}
        />
      </div>

      {/* Liste modules / cours */}
      <nav className="flex-1 overflow-y-auto p-2">
        {safeModules.map((module, moduleIdx) => {
          const isOpen = openModules.has(module.id_module);
          // ✅ Optional chaining sur cours
          const safeCours    = module.cours ?? [];
          const nbCompleted  = safeCours.filter((c) => completedIds.has(c.id_cours)).length;
          const nbTotal      = safeCours.length;
          const allDone      = nbTotal > 0 && nbCompleted === nbTotal;

          return (
            <div key={module.id_module} className="mb-1.5 iq-soft rounded-xl">

              {/* Header module */}
              <button
                onClick={() => toggleModule(module.id_module)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  allDone
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {allDone ? <CheckCircle className="w-3.5 h-3.5" /> : moduleIdx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                    {module.titre}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {nbCompleted}/{nbTotal} cours
                  </p>
                </div>

                {isOpen
                  ? <ChevronDown  className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                }
              </button>

              {/* Liste des cours dépliable */}
              {isOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 pl-3" style={{ borderLeftColor: 'var(--iq-border)' }}>
                  {safeCours.map((cours, coursIdx) => {
                    const isActive    = cours.id_cours === currentCoursId;
                    const isCompleted = completedIds.has(cours.id_cours);

                    // Verrouillage séquentiel (uniquement si parcours non LIBRE)
                    const prevCours = safeCours[coursIdx - 1];
                    const isLocked  =
                      coursIdx > 0 &&
                      parcours?.type_acces !== 'LIBRE' &&
                      !!prevCours &&
                      !completedIds.has(prevCours.id_cours);

                    return (
                      <div key={cours.id_cours}>
                        {isLocked ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg opacity-40 cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
                              {cours.titre}
                            </span>
                          </div>
                        ) : (
                          <Link
                            to={`/lms/cours/${cours.id_cours}`}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group ${
                              isActive
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                            ) : isActive ? (
                              <Play className="w-3.5 h-3.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                            )}

                            <span className={`text-xs flex-1 line-clamp-2 leading-tight ${
                              isActive
                                ? 'font-bold text-green-700 dark:text-green-300'
                                : isCompleted
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {cours.titre}
                            </span>

                            <TypeIcon type={cours.type_contenu ?? 'ARTICLE'} />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--iq-border)' }}>
        <Link
          to={`/lms/parcours/${parcours?.id_parcours ?? ''}`}
          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Retour au parcours
        </Link>
      </div>
    </aside>
  );
}