import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, ChevronLeft, Trophy, Lock, Loader2, Leaf, Target, Plus, Trash2,
  BarChart3, RefreshCw, Lightbulb, Info, Zap,
} from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSimulation } from '@/hooks/useSimulation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import type { ActiviteSimulation, Reduction, SourceEmission } from '@/hooks/useSimulation';

interface Props {
  id_cours?: string;
}

type Etape = 'configuration' | 'reduction' | 'resultats';
type PresetKey = 'bureau_10' | 'pme_50' | '';
type Scope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';

interface CoursPedagogique {
  id_cours: string;
  id_parcours?: string;
  titre: string;
  description?: string | null;
  objectif_pct?: number | string | null;
  preset_activites?: string | null;
  duree_minutes?: number | null;
  points_xp?: number | null;
  module_titre?: string | null;
  parcours_titre?: string | null;
}

const MAX_TENTATIVES = 5;
const fmt = (v: number | string | null | undefined, d = 2): string => {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? '—' : n.toFixed(d);
};

const ETAPES: Array<{ key: Etape; label: string }> = [
  { key: 'configuration', label: 'Configuration' },
  { key: 'reduction', label: 'Réduction' },
  { key: 'resultats', label: 'Résultats' },
];

const presetCards: Array<{ key: Exclude<PresetKey, ''>; title: string; subtitle: string; emoji: string }> = [
  { key: 'bureau_10', title: 'Bureau 10 personnes', subtitle: 'Entreprise tertiaire, 10 employés', emoji: '🏢' },
  { key: 'pme_50', title: 'PME industrielle 50 pers.', subtitle: 'Entreprise manufacturière, 50 employés', emoji: '🏭' },
];

const conseils = [
  '⚡ Le Scope 2 (électricité) est souvent le plus facile à réduire rapidement.',
  '🚗 Les déplacements domicile-travail représentent en moyenne 30% du Scope 1.',
  '✈️ Un vol Paris-New York émet autant que 3 mois de chauffage d\'un appartement.',
  '♻️ Passer au tri sélectif peut réduire les émissions déchets de 50 à 70%.',
  '🌱 L\'électricité française (nucléaire) émet 12× moins que la moyenne européenne.',
];

const reduceTips = [
  '⚡ Énergie — Réduire la consommation électrique de 20% via LED et extinction automatique.',
  '🚗 Mobilité — Passer au covoiturage ou au télétravail 2j/semaine baisse fortement le Scope 1.',
  '✈️ Voyages — Substituer 50% des vols court-courriers par des trains réduit le Scope 3.',
  '🌡️ Chauffage — Baisser le thermostat de 1°C économise environ 7% de gaz.',
];

const buildPreset = (key: Exclude<PresetKey, ''>): ActiviteSimulation[] => {
  if (key === 'pme_50') {
    return [
      { id_source: '', label: 'Électricité production', quantite: 180000, unite: 'kWh', scope: 'SCOPE_2' },
      { id_source: '', label: 'Gaz chauffage & process', quantite: 95000, unite: 'kWh', scope: 'SCOPE_1' },
      { id_source: '', label: 'Flotte véhicules diesel', quantite: 180000, unite: 'km', scope: 'SCOPE_1' },
      { id_source: '', label: 'Livraisons camions fret', quantite: 420000, unite: 'km', scope: 'SCOPE_3' },
      { id_source: '', label: 'Déchets industriels', quantite: 8500, unite: 'kg', scope: 'SCOPE_1' },
    ];
  }
  return [
    { id_source: '', label: 'Électricité bureau', quantite: 25000, unite: 'kWh', scope: 'SCOPE_2' },
    { id_source: '', label: 'Chauffage gaz naturel', quantite: 8000, unite: 'kWh', scope: 'SCOPE_1' },
    { id_source: '', label: 'Déplacements domicile-travail', quantite: 45000, unite: 'km', scope: 'SCOPE_1' },
    { id_source: '', label: 'Voyages professionnels avion', quantite: 12000, unite: 'km', scope: 'SCOPE_3' },
    { id_source: '', label: 'Déchets bureaux', quantite: 1200, unite: 'kg', scope: 'SCOPE_1' },
  ];
};

const scopeBadge = (scope: Scope): string => {
  if (scope === 'SCOPE_1') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  if (scope === 'SCOPE_2') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
};

const findSource = (act: ActiviteSimulation, sources: SourceEmission[]): string => {
  const inScope = sources.filter((s) => s.scope_defaut === act.scope);
  const label = act.label.toLowerCase();
  const candidates: Array<{ keys: string[] }> = [
    { keys: ['electricit', 'kwh'] },
    { keys: ['gaz', 'naturel'] },
    { keys: ['diesel', 'voiture', 'vehicule'] },
    { keys: ['avion', 'vol'] },
    { keys: ['camion', 'fret'] },
    { keys: ['dechet', 'waste'] },
  ];
  for (const c of candidates) {
    if (!c.keys.some((k) => label.includes(k))) continue;
    const matched = inScope.find((s) => c.keys.some((k) => s.nom_source.toLowerCase().includes(k)));
    if (matched) return matched.id_source;
  }
  return inScope[0]?.id_source ?? '';
};

export default function SimulateurCO2Pedagogique({ id_cours }: Props) {
  const { id_cours: idCoursParams } = useParams<{ id_cours: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const idCours = id_cours ?? idCoursParams ?? '';
  const loadedPresetRef = useRef(false);

  const [cours, setCours] = useState<CoursPedagogique | null>(null);
  const [loadingCours, setLoadingCours] = useState(true);
  const [etape, setEtape] = useState<Etape>('configuration');
  const [presetChoisi, setPresetChoisi] = useState<PresetKey>('');
  const [activites, setActivites] = useState<ActiviteSimulation[]>([]);
  const [reductions, setReductions] = useState<Reduction[]>([]);
  const [tentatives, setTentatives] = useState(0);
  const [showScopes, setShowScopes] = useState(true);

  const {
    sources,
    loadingSources,
    fetchSources,
    resultScenario,
    loadingScenario,
    scenariser,
    error,
    success,
    clearMessages,
    reset,
  } = useSimulation();

  const objectifPct = parseFloat(String(cours?.objectif_pct ?? 30));
  const xp = parseFloat(String(cours?.points_xp ?? 10));
  const conseilIndex = tentatives % 5;

  const appliquerPreset = useCallback((key: Exclude<PresetKey, ''>, sourceList: SourceEmission[]) => {
    const preset = buildPreset(key).map((a) => ({ ...a, id_source: findSource(a, sourceList) }));
    setPresetChoisi(key);
    setActivites(preset);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!idCours) {
        setLoadingCours(false);
        return;
      }
      try {
        const coursRes = await api.get(`/lms/cours/${idCours}`);
        const data = (coursRes.data?.data ?? coursRes.data) as CoursPedagogique;
        setCours(data);
      } finally {
        setLoadingCours(false);
      }
    };
    load();
  }, [idCours]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    if (loadedPresetRef.current || loadingSources || sources.length === 0) return;
    const key = (cours?.preset_activites ?? 'bureau_10') as Exclude<PresetKey, ''>;
    appliquerPreset(key === 'pme_50' ? 'pme_50' : 'bureau_10', sources);
    loadedPresetRef.current = true;
  }, [appliquerPreset, cours?.preset_activites, loadingSources, sources]);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(clearMessages, 5000);
    return () => clearTimeout(t);
  }, [success, error, clearMessages]);

  const goReduction = useCallback(() => {
    if (activites.some((a) => a.id_source)) setEtape('reduction');
  }, [activites]);

  const addReduction = useCallback(() => {
    setReductions((prev) => [...prev, { index_activite: 0, type: 'reduction_pct', valeur: 20 }]);
  }, []);

  const runSimulation = useCallback(async () => {
    if (tentatives >= MAX_TENTATIVES) return;
    setTentatives((v) => v + 1);
    await scenariser({
      id_organisation: user?.id_organisation || undefined,
      id_cours: cours?.id_cours || undefined,
      nom: `Simulation — ${cours?.titre ?? 'Libre'}`,
      activites: activites.filter((a) => a.id_source && a.quantite > 0),
      reductions: reductions.length > 0 ? reductions : undefined,
      objectif_pct: cours?.objectif_pct ? parseFloat(String(cours.objectif_pct)) : undefined,
      annee: new Date().getFullYear(),
    });
    setEtape('resultats');
  }, [activites, cours, reductions, scenariser, tentatives, user]);

  const resetAll = useCallback(() => {
    reset();
    setActivites([]);
    setReductions([]);
    setPresetChoisi('');
    setEtape('configuration');
    setTentatives(0);
    loadedPresetRef.current = false;
  }, [reset]);

  if (loadingCours) {
    return (
      <div className="iq-shell">
        <Sidebar />
        <main className="iq-main flex items-center justify-center">
          <LoadingSpinner message="Chargement du cours..." />
        </main>
      </div>
    );
  }

  const bilanAvant = resultScenario?.bilan_avant;
  const bilanApres = resultScenario?.bilan_apres;
  const delta = resultScenario?.delta;
  const atteint = !!delta?.objectif_atteint;
  const score = parseFloat(String(resultScenario?.scoring_pedagogique ?? 0));
  const circ = 2 * Math.PI * 40;
  const dash = circ * (1 - Math.min(Math.max(score, 0), 100) / 100);

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative">
        <Header
          title={cours?.titre ?? 'Simulation pédagogique'}
          subtitle={`${cours?.parcours_titre ?? 'Apprentissage'}${cours?.module_titre ? ` • ${cours.module_titre}` : ''}`}
          onRefresh={resetAll}
        />
        <div className="iq-content space-y-5">
          <div className="iq-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              {ETAPES.map((s, i) => {
                const currentIdx = ETAPES.findIndex((e) => e.key === etape);
                const done = i < currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                      done
                        ? 'bg-green-600 text-white border-green-600'
                        : current
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${current ? 'text-[var(--iq-text-1)]' : 'text-[var(--iq-text-2)]'}`}>{s.label}</span>
                    {i < ETAPES.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="iq-card p-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--iq-text-1)]">
              Objectif : Réduire les émissions d'au moins <strong>{fmt(objectifPct, 0)}%</strong> par rapport au bilan initial
            </p>
            <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">+{fmt(xp, 0)} XP</span>
            <span className="text-xs text-[var(--iq-text-2)]">{tentatives}/{MAX_TENTATIVES} essais</span>
            {cours?.duree_minutes ? <span className="text-xs text-[var(--iq-text-2)]">{fmt(cours.duree_minutes, 0)} min</span> : null}
          </div>

          {etape === 'configuration' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presetCards.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => appliquerPreset(p.key, sources)}
                      className={`iq-card text-left p-4 border-2 transition-colors ${
                        presetChoisi === p.key ? 'border-green-500' : 'border-transparent'
                      }`}
                    >
                      <p className="text-xl mb-1">{p.emoji}</p>
                      <p className="font-bold text-[var(--iq-text-1)]">{p.title}</p>
                      <p className="text-xs text-[var(--iq-text-2)]">{p.subtitle}</p>
                    </button>
                  ))}
                </div>

                <div className="iq-card p-4 space-y-2">
                  {loadingSources ? (
                    <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                  ) : (
                    activites.map((a, i) => (
                      <div key={`${a.label}-${i}`} className="grid grid-cols-12 gap-2 items-center iq-soft border border-[var(--iq-border)] rounded-xl p-2">
                        <span className={`col-span-2 text-[11px] font-bold px-2 py-1 rounded border ${scopeBadge(a.scope as Scope)}`}>{a.scope.replace('_', ' ')}</span>
                        <input className="iq-input col-span-3" value={a.label} onChange={(e) => setActivites((prev) => prev.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                        <select className="iq-input col-span-2" value={a.scope} onChange={(e) => setActivites((prev) => prev.map((x, idx) => idx === i ? { ...x, scope: e.target.value as Scope, id_source: '' } : x))}>
                          <option value="SCOPE_1">Scope 1</option><option value="SCOPE_2">Scope 2</option><option value="SCOPE_3">Scope 3</option>
                        </select>
                        <select className="iq-input col-span-2" value={a.id_source} onChange={(e) => setActivites((prev) => prev.map((x, idx) => idx === i ? { ...x, id_source: e.target.value } : x))}>
                          <option value="">Source</option>
                          {sources.filter((s) => s.scope_defaut === a.scope).map((s) => <option key={s.id_source} value={s.id_source}>{s.nom_source}</option>)}
                        </select>
                        <input type="number" className="iq-input col-span-1" value={a.quantite} onChange={(e) => setActivites((prev) => prev.map((x, idx) => idx === i ? { ...x, quantite: parseFloat(String(e.target.value || 0)) } : x))} />
                        <input className="iq-input col-span-1" value={a.unite} onChange={(e) => setActivites((prev) => prev.map((x, idx) => idx === i ? { ...x, unite: e.target.value } : x))} />
                        <button type="button" className="col-span-1 p-2 text-red-500" onClick={() => setActivites((prev) => prev.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
                </div>

                <button type="button" className="iq-btn-primary" disabled={!activites.some((a) => !!a.id_source)} onClick={goReduction}>
                  Définir les actions de réduction <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="iq-card p-4">
                  <p className="text-sm font-semibold text-[var(--iq-text-1)] mb-2">Le saviez-vous ?</p>
                  <p className="text-xs text-[var(--iq-text-2)]">{conseils[conseilIndex]}</p>
                </div>
                <div className="iq-card p-4">
                  <button type="button" className="w-full flex items-center justify-between" onClick={() => setShowScopes((v) => !v)}>
                    <span className="text-sm font-semibold text-[var(--iq-text-1)]">Les 3 Scopes GHG</span>
                    <Info className="w-4 h-4 text-[var(--iq-text-2)]" />
                  </button>
                  {showScopes && (
                    <div className="mt-3 space-y-2 text-xs">
                      <p className="text-red-600 dark:text-red-300"><strong>S1</strong> Émissions directes de vos équipements.</p>
                      <p className="text-blue-600 dark:text-blue-300"><strong>S2</strong> Émissions liées à l'énergie achetée.</p>
                      <p className="text-yellow-700 dark:text-yellow-300"><strong>S3</strong> Émissions indirectes de la chaîne de valeur.</p>
                    </div>
                  )}
                </div>
                {cours?.description ? (
                  <div className="iq-card p-4">
                    <p className="text-sm font-semibold text-[var(--iq-text-1)] mb-1">Description</p>
                    <p className="text-xs text-[var(--iq-text-2)]">{cours.description}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {etape === 'reduction' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="iq-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {activites.map((a, i) => <span key={`${a.label}-${i}`} className={`px-2 py-1 text-xs rounded-full border ${scopeBadge(a.scope as Scope)}`}>{a.label}</span>)}
                    <button type="button" className="ml-auto iq-btn-ghost text-xs" onClick={() => setEtape('configuration')}>
                      <ChevronLeft className="w-3.5 h-3.5" /> Modifier les activités
                    </button>
                  </div>
                </div>

                <div className="iq-card p-4">
                  {reductions.length === 0 ? (
                    <div className="border-2 border-dashed border-[var(--iq-border)] rounded-xl p-6 text-center">
                      <p className="text-sm text-[var(--iq-text-2)] mb-3">Ajoutez des actions de réduction pour atteindre l'objectif de -{fmt(objectifPct, 0)}%</p>
                      <button type="button" className="iq-btn-primary" onClick={addReduction}>Première réduction</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reductions.map((r, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center iq-soft rounded-xl p-3 border border-[var(--iq-border)]">
                          <select className="iq-input col-span-4" value={r.index_activite} onChange={(e) => setReductions((prev) => prev.map((x, i) => i === idx ? { ...x, index_activite: parseInt(e.target.value, 10) } : x))}>
                            {activites.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
                          </select>
                          <select className="iq-input col-span-3" value={r.type} onChange={(e) => setReductions((prev) => prev.map((x, i) => i === idx ? { ...x, type: e.target.value as Reduction['type'] } : x))}>
                            <option value="reduction_pct">Réduction %</option>
                            <option value="changement_quantite">Changer quantité</option>
                            <option value="suppression">Suppression</option>
                          </select>
                          {r.type === 'suppression' ? (
                            <p className="col-span-4 text-xs text-[var(--iq-text-2)]">Cette activité sera supprimée</p>
                          ) : r.type === 'reduction_pct' ? (
                            <div className="col-span-4 flex items-center gap-2">
                              <input type="range" min="0" max="100" value={parseFloat(String(r.valeur ?? 0))} onChange={(e) => setReductions((prev) => prev.map((x, i) => i === idx ? { ...x, valeur: parseFloat(String(e.target.value)) } : x))} className="flex-1 accent-green-600" />
                              <span className="text-xs text-green-600 font-bold w-9 text-right">{fmt(r.valeur, 0)}%</span>
                            </div>
                          ) : (
                            <input type="number" className="iq-input col-span-4" value={parseFloat(String(r.valeur ?? 0))} onChange={(e) => setReductions((prev) => prev.map((x, i) => i === idx ? { ...x, valeur: parseFloat(String(e.target.value || 0)) } : x))} />
                          )}
                          <button type="button" className="col-span-1 p-2 text-red-500" onClick={() => setReductions((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" className="mt-3 iq-btn-ghost text-xs" onClick={addReduction}><Plus className="w-3.5 h-3.5" /> Ajouter une action de réduction</button>
                </div>

                {tentatives >= MAX_TENTATIVES ? (
                  <div className="iq-card p-4 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Limite d'essais atteinte ({MAX_TENTATIVES}/{MAX_TENTATIVES}).
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <button type="button" className="iq-btn-ghost" onClick={() => setEtape('configuration')}><ChevronLeft className="w-4 h-4" /> Retour</button>
                  <button type="button" className="iq-btn-primary" disabled={loadingScenario || tentatives >= MAX_TENTATIVES} onClick={runSimulation}>
                    {loadingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Calculer le bilan
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="iq-card p-4">
                  <p className="text-sm font-semibold text-[var(--iq-text-1)] mb-2">Conseils réduction</p>
                  <div className="space-y-1.5">{reduceTips.map((t) => <p key={t} className="text-xs text-[var(--iq-text-2)]">{t}</p>)}</div>
                </div>
                <div className="iq-card p-6 text-center">
                  <p className="text-xs text-[var(--iq-text-2)]">Objectif</p>
                  <p className="text-5xl font-black text-green-600 dark:text-green-400">-{fmt(objectifPct, 0)}%</p>
                </div>
              </div>
            </div>
          )}

          {etape === 'resultats' && (
            <div className="space-y-4">
              {loadingScenario ? (
                <div className="iq-card p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
              ) : resultScenario ? (
                <>
                  <div className={`iq-card p-5 ${atteint ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="relative">
                        <svg className="-rotate-90" viewBox="0 0 96 96" width="96" height="96">
                          <circle cx="48" cy="48" r="40" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" stroke="currentColor" />
                          <circle cx="48" cy="48" r="40" strokeWidth="8" fill="none" strokeLinecap="round"
                            stroke={score >= 80 ? '#f59e0b' : score >= 60 ? '#6366f1' : '#9ca3af'}
                            strokeDasharray={circ}
                            strokeDashoffset={dash}
                            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-[var(--iq-text-1)]">{fmt(score, 0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-black text-[var(--iq-text-1)]">{atteint ? '🎉 Objectif atteint !' : '⚠️ Objectif non atteint'}</p>
                        <p className="text-sm text-[var(--iq-text-2)]">
                          Réduction obtenue : {fmt(delta?.pct, 1)}% • Objectif : {fmt(objectifPct, 0)}% • Écart : {fmt(objectifPct - parseFloat(String(delta?.pct ?? 0)), 1)}%
                        </p>
                        {atteint ? <p className="text-sm text-green-700 dark:text-green-300 font-bold mt-1">⭐ +{fmt(xp, 0)} XP gagnés !</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="iq-card p-4"><p className="text-xs text-[var(--iq-text-2)]">Bilan initial</p><p className="text-2xl font-black text-red-500">{fmt(bilanAvant?.total_co2e, 2)}</p><p className="text-xs text-[var(--iq-text-2)]">tCO₂e</p></div>
                    <div className="iq-card p-4"><p className="text-xs text-[var(--iq-text-2)]">Actions</p><p className="text-2xl font-black text-[var(--iq-text-1)]">{reductions.length}</p><p className="text-xs text-[var(--iq-text-2)]">appliquées</p></div>
                    <div className="iq-card p-4"><p className="text-xs text-[var(--iq-text-2)]">Après réduction</p><p className="text-2xl font-black text-green-600">{fmt(bilanApres?.total_co2e ?? bilanAvant?.total_co2e, 2)}</p><p className="text-xs text-[var(--iq-text-2)]">tCO₂e</p></div>
                  </div>

                  <div className="iq-card p-4 space-y-3">
                    <p className="text-sm font-bold text-[var(--iq-text-1)]">Comparaison avant/après par scope</p>
                    {(['SCOPE_1', 'SCOPE_2', 'SCOPE_3'] as Scope[]).map((scope) => {
                      const av = parseFloat(String(bilanAvant?.par_scope?.[scope]?.total ?? 0));
                      const ap = parseFloat(String(bilanApres?.par_scope?.[scope]?.total ?? av));
                      const max = Math.max(av, ap, 1);
                      const pct = av > 0 ? ((av - ap) / av) * 100 : 0;
                      return (
                        <div key={scope} className="iq-soft border border-[var(--iq-border)] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${scopeBadge(scope)}`}>{scope.replace('_', ' ')}</span>
                            <span className="text-xs font-bold text-green-600">-{fmt(pct, 1)}%</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs"><span className="w-10 text-[var(--iq-text-2)]">Avant</span><div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full flex-1"><div className="h-2 bg-red-400 rounded-full" style={{ width: `${(av / max) * 100}%` }} /></div><span className="w-16 text-right">{fmt(av, 2)}</span></div>
                            <div className="flex items-center gap-2 text-xs"><span className="w-10 text-[var(--iq-text-2)]">Après</span><div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full flex-1"><div className="h-2 bg-green-500 rounded-full" style={{ width: `${(ap / max) * 100}%` }} /></div><span className="w-16 text-right">{fmt(ap, 2)}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="iq-card p-4">
                    <p className="text-sm font-bold text-[var(--iq-text-1)] mb-2">Économies par activité</p>
                    <div className="space-y-2">
                      {(bilanApres?.activites ?? []).map((a, idx) => {
                        const co2 = parseFloat(String(a.co2e_t ?? 0));
                        const eco = parseFloat(String(a.economie_t ?? 0));
                        const pct = co2 > 0 ? (eco / co2) * 100 : 0;
                        return (
                          <div key={`${a.label}-${idx}`} className={`p-3 rounded-xl border ${a.reduit ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/40 border-[var(--iq-border)]'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[var(--iq-text-1)]">{a.label}</span>
                              <span className="text-xs font-bold text-[var(--iq-text-1)]">{fmt(a.co2e_t, 3)} tCO₂e</span>
                            </div>
                            {a.reduit ? <p className="text-xs text-green-700 dark:text-green-300 mt-1">-{fmt(pct, 1)}%</p> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="iq-card p-3 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-[var(--iq-text-1)]">
                      Simulation conforme GHG Protocol · ISO 14064 • Sauvegardée · Tentative {tentatives}/{MAX_TENTATIVES}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!atteint && tentatives < MAX_TENTATIVES ? (
                      <button type="button" className="iq-btn-ghost" onClick={() => { setEtape('reduction'); reset(); }}>
                        <RefreshCw className="w-4 h-4" /> Modifier mes réductions
                      </button>
                    ) : null}
                    <button type="button" className="iq-btn-ghost" onClick={resetAll}><RefreshCw className="w-4 h-4" /> Recommencer</button>
                    {cours?.id_parcours ? (
                      <Link to={`/lms/parcours/${cours.id_parcours}`} className="iq-btn-primary">
                        {atteint ? <Trophy className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {atteint ? 'Continuer le parcours' : 'Retour au parcours'}
                      </Link>
                    ) : (
                      <Link to="/simulations" className="iq-btn-primary"><BarChart3 className="w-4 h-4" /> Simulateur avancé</Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="iq-card p-6 text-sm text-[var(--iq-text-2)]">Aucun résultat disponible.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
