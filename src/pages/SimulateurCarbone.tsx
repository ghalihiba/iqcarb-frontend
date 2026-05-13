/**
 * SimulateurCarbone.tsx
 * ──────────────────────────────────────────────────────────────
 * Page principale du module simulation carbone + scénarisation
 * Design system IQcarb : iq-shell, iq-main, iq-card, iq-content
 * Intégration : Sidebar, Header, dark mode, Lucide icons
 *
 * Route suggérée : /simulations
 * À ajouter dans votre router et dans Sidebar.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import Sidebar  from '@/components/common/Sidebar';
import Header   from '@/components/common/Header';
import { useSimulation } from '@/hooks/useSimulation';
import type {
  ActiviteSimulation,
  Reduction,
  SourceEmission,
} from '@/hooks/useSimulation';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Zap, BarChart3, Target, CheckCircle,
  AlertCircle, Loader2, ArrowRight,
  Leaf, RefreshCw, BookOpen, TrendingDown
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (v: number | null | undefined, d = 4): string => {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? '—' : n.toFixed(d);
};

const SCOPE_CONFIG = {
  SCOPE_1: { label: 'Scope 1', color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-100 dark:border-red-800',    bar: 'bg-red-400' },
  SCOPE_2: { label: 'Scope 2', color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-100 dark:border-blue-800',   bar: 'bg-blue-400' },
  SCOPE_3: { label: 'Scope 3', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-800', bar: 'bg-yellow-400' },
} as const;

type ScopeKey = keyof typeof SCOPE_CONFIG;

const REDUCTION_TYPES = [
  { value: 'reduction_pct',        label: 'Réduction en %' },
  { value: 'changement_quantite',  label: 'Modifier la quantité' },
  { value: 'suppression',          label: 'Supprimer l\'activité' },
  { value: 'changement_source',    label: 'Changer la source' },
];

// ─── Sous-composant : ligne d'activité ───────────────────────
interface LigneActiviteProps {
  index:    number;
  activite: ActiviteSimulation;
  sources:  SourceEmission[];
  onChange: (index: number, field: keyof ActiviteSimulation, value: string | number) => void;
  onDelete: (index: number) => void;
}

function LigneActivite({ index, activite, sources, onChange, onDelete }: LigneActiviteProps) {
  const sourceFiltree = sources.filter(
    s => !activite.scope || s.scope_defaut === activite.scope
  );

  return (
    <div className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-600">
      {/* Label */}
      <div className="col-span-3">
        <input
          type="text"
          placeholder="Description"
          value={activite.label}
          onChange={e => onChange(index, 'label', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Scope */}
      <div className="col-span-2">
        <select
          value={activite.scope}
          onChange={e => onChange(index, 'scope', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="SCOPE_1">Scope 1</option>
          <option value="SCOPE_2">Scope 2</option>
          <option value="SCOPE_3">Scope 3</option>
        </select>
      </div>

      {/* Source */}
      <div className="col-span-3">
        <select
          value={activite.id_source}
          onChange={e => onChange(index, 'id_source', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">— Sélectionner —</option>
          {sourceFiltree.map(s => (
            <option key={s.id_source} value={s.id_source}>
              {s.nom_source}
            </option>
          ))}
        </select>
      </div>

      {/* Quantité */}
      <div className="col-span-2">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Quantité"
          value={activite.quantite}
          onChange={e => onChange(index, 'quantite', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Unité */}
      <div className="col-span-1">
        <input
          type="text"
          placeholder="Unité"
          value={activite.unite}
          onChange={e => onChange(index, 'unite', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Supprimer */}
      <div className="col-span-1 flex justify-center">
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────
export default function SimulateurCarbone() {
  const { user } = useAuth();

  const {
    sources, loadingSources, fetchSources,
    resultScenario, loadingScenario, scenariser,
    error, success, clearMessages, reset
  } = useSimulation();

  // Formulaire activités
  const [activites, setActivites] = useState<ActiviteSimulation[]>([
    { id_source: '', label: 'Électricité bureau',       quantite: 25000, unite: 'kWh', scope: 'SCOPE_2' },
    { id_source: '', label: 'Déplacements domicile-travail', quantite: 45000, unite: 'km',  scope: 'SCOPE_1' },
  ]);

  // Réductions
  const [reductions,    setReductions]    = useState<Reduction[]>([]);
  const [objectifPct,   setObjectifPct]   = useState<string>('');
  const [nom,           setNom]           = useState('');
  const [showReductions, setShowReductions] = useState(false);

  // Onglet résultats
  const [onglet, setOnglet] = useState<'avant' | 'apres' | 'delta'>('avant');

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(clearMessages, 5000);
      return () => clearTimeout(t);
    }
  }, [success, error, clearMessages]);

  // ── Gestion activités ──────────────────────────────────────
  const ajouterActivite = useCallback(() => {
    setActivites(prev => [...prev, {
      id_source: '',
      label:     `Activité ${prev.length + 1}`,
      quantite:  1000,
      unite:     'kWh',
      scope:     'SCOPE_2'
    }]);
  }, []);

  const modifierActivite = useCallback((
    index: number,
    field: keyof ActiviteSimulation,
    value: string | number
  ) => {
    setActivites(prev => {
      const copy = [...prev];
      // Si scope change, remettre la source à vide
      if (field === 'scope') {
        copy[index] = { ...copy[index], [field]: value as ActiviteSimulation['scope'], id_source: '' };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  }, []);

  const supprimerActivite = useCallback((index: number) => {
    setActivites(prev => prev.filter((_, i) => i !== index));
    setReductions(prev => prev
      .filter(r => r.index_activite !== index)
      .map(r => ({
        ...r,
        index_activite: r.index_activite > index ? r.index_activite - 1 : r.index_activite
      }))
    );
  }, []);

  // ── Gestion réductions ─────────────────────────────────────
  const ajouterReduction = useCallback(() => {
    setReductions(prev => [...prev, {
      index_activite: 0,
      type:           'reduction_pct',
      valeur:         20
    }]);
  }, []);

  const modifierReduction = useCallback((
    index: number,
    field: keyof Reduction,
    value: string | number
  ) => {
    setReductions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }, []);

  const supprimerReduction = useCallback((index: number) => {
    setReductions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Lancer la simulation ───────────────────────────────────
  const lancerSimulation = useCallback(async () => {
    const activitesValides = activites.filter(a => a.id_source && a.quantite > 0 && a.unite);
    if (activitesValides.length === 0) {
      return;
    }

    reset();
    await scenariser({
      id_organisation: user?.id_organisation || undefined,
      nom:             nom || undefined,
      activites:       activitesValides,
      reductions:      reductions.length > 0 ? reductions : undefined,
      objectif_pct:    objectifPct ? parseFloat(objectifPct) : undefined,
      annee:           new Date().getFullYear(),
    });

    setOnglet(reductions.length > 0 ? 'delta' : 'avant');
  }, [activites, reductions, objectifPct, nom, user, scenariser, reset]);

  const bilanAvant = resultScenario?.bilan_avant;
  const bilanApres = resultScenario?.bilan_apres;
  const delta      = resultScenario?.delta;

  return (
    <div className="iq-shell">
      <Sidebar />

      <main className="iq-main iq-dotgrid relative">
        <Header
          title="Simulateur Carbone"
          subtitle="Calculez et optimisez votre bilan GES — Scénarios avant / après réduction"
          onRefresh={() => { reset(); setActivites([{ id_source:'', label:'Activité 1', quantite:1000, unite:'kWh', scope:'SCOPE_2' }]); setReductions([]); }}
        />

        <div className="iq-content">

          {/* Messages */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-2xl shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-2xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── Panneau gauche : Configuration ────────────── */}
            <div className="flex flex-col gap-5">

              {/* Entête simulation */}
              <div className="iq-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">Paramétrage</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">GHG Protocol · ISO 14064</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nom de la simulation
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Bureau 2024"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Objectif réduction (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Ex: 30"
                      value={objectifPct}
                      onChange={e => setObjectifPct(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Activités */}
              <div className="iq-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      Activités ({activites.length})
                    </h3>
                  </div>
                  <button onClick={ajouterActivite} className="iq-btn-ghost text-xs flex items-center gap-1 px-3 py-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>

                {/* En-tête colonnes */}
                <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                  {['Description', 'Scope', 'Source', 'Quantité', 'Unité', ''].map((h, i) => (
                    <div key={i} className={`text-xs font-semibold text-gray-400 dark:text-gray-500 ${
                      i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-1' : 'col-span-1'
                    }`}>{h}</div>
                  ))}
                </div>

                {loadingSources ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activites.map((act, i) => (
                      <LigneActivite
                        key={i}
                        index={i}
                        activite={act}
                        sources={sources}
                        onChange={modifierActivite}
                        onDelete={supprimerActivite}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Réductions */}
              <div className="iq-card p-5">
                <button
                  onClick={() => setShowReductions(v => !v)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      Actions de réduction ({reductions.length})
                    </h3>
                  </div>
                  {showReductions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {showReductions && (
                  <div className="mt-4 flex flex-col gap-3">
                    {reductions.map((red, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                        {/* Activité cible */}
                        <div className="col-span-3">
                          <select
                            value={red.index_activite}
                            onChange={e => modifierReduction(i, 'index_activite', parseInt(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none"
                          >
                            {activites.map((a, idx) => (
                              <option key={idx} value={idx}>{a.label || `Activité ${idx + 1}`}</option>
                            ))}
                          </select>
                        </div>

                        {/* Type */}
                        <div className="col-span-4">
                          <select
                            value={red.type}
                            onChange={e => modifierReduction(i, 'type', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none"
                          >
                            {REDUCTION_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Valeur */}
                        {red.type !== 'suppression' && red.type !== 'changement_source' && (
                          <div className="col-span-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="range"
                                min="0"
                                max={red.type === 'reduction_pct' ? 100 : 1000000}
                                step={red.type === 'reduction_pct' ? 1 : 100}
                                value={red.valeur ?? 0}
                                onChange={e => modifierReduction(i, 'valeur', parseFloat(e.target.value))}
                                className="flex-1 accent-green-600"
                              />
                              <span className="text-xs font-bold text-green-700 dark:text-green-400 w-10 text-right">
                                {red.valeur}{red.type === 'reduction_pct' ? '%' : ''}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="col-span-2 flex justify-end">
                          <button
                            onClick={() => supprimerReduction(i)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={ajouterReduction}
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-xs font-semibold hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter une action de réduction
                    </button>
                  </div>
                )}
              </div>

              {/* Bouton lancer */}
              <button
                onClick={lancerSimulation}
                disabled={loadingScenario || activites.filter(a => a.id_source).length === 0}
                className="iq-btn-primary w-full justify-center py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingScenario ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {reductions.length > 0 ? 'Calculer avant / après' : 'Calculer le bilan'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* ── Panneau droit : Résultats ──────────────────── */}
            <div className="flex flex-col gap-5">

              {!resultScenario && !loadingScenario ? (
                <div className="iq-card p-10 flex flex-col items-center justify-center text-center gap-4 min-h-80">
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Résultats de simulation</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Configurez vos activités et lancez le calcul
                    </p>
                  </div>
                </div>
              ) : loadingScenario ? (
                <div className="iq-card p-10 flex flex-col items-center justify-center gap-4 min-h-80">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                  <p className="text-sm text-gray-400">Calcul des émissions...</p>
                </div>
              ) : resultScenario && (
                <>
                  {/* KPI résumé */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="iq-card p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Bilan initial</p>
                      <p className="text-2xl font-black text-red-500">{fmt(bilanAvant?.total_co2e, 2)}</p>
                      <p className="text-xs text-gray-400">tCO₂e</p>
                    </div>
                    {bilanApres && (
                      <>
                        <div className="iq-card p-4 text-center">
                          <p className="text-xs text-gray-400 mb-1">Après réduction</p>
                          <p className="text-2xl font-black text-green-500">{fmt(bilanApres.total_co2e, 2)}</p>
                          <p className="text-xs text-gray-400">tCO₂e</p>
                        </div>
                        <div className={`iq-card p-4 text-center ${delta?.objectif_atteint ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
                          <p className="text-xs text-gray-400 mb-1">Réduction</p>
                          <p className={`text-2xl font-black ${delta?.objectif_atteint ? 'text-green-600' : 'text-primary-600 dark:text-primary-400'}`}>
                            -{fmt(delta?.pct, 1)}%
                          </p>
                          {delta?.objectif_atteint && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-green-600">
                              <CheckCircle className="w-3 h-3" /> Objectif
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Onglets */}
                  <div className="iq-card p-5">
                    <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                      {([
                        { key: 'avant', label: 'Bilan initial',  show: true },
                        { key: 'apres', label: 'Après réduction', show: !!bilanApres },
                        { key: 'delta', label: 'Comparaison',    show: !!delta },
                      ] as const).filter(t => t.show).map(t => (
                        <button
                          key={t.key}
                          onClick={() => setOnglet(t.key)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            onglet === t.key
                              ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Contenu onglet Avant */}
                    {onglet === 'avant' && bilanAvant && (
                      <div className="flex flex-col gap-3">
                        {(Object.entries(SCOPE_CONFIG) as [ScopeKey, typeof SCOPE_CONFIG[ScopeKey]][]).map(([scope, cfg]) => {
                          const data = bilanAvant.par_scope[scope];
                          return (
                            <div key={scope} className={`p-4 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                                <span className={`text-lg font-black ${cfg.color}`}>{fmt(data.total, 2)} <span className="text-xs font-normal text-gray-400">tCO₂e</span></span>
                              </div>
                              <div className="w-full bg-white dark:bg-gray-700 rounded-full h-1.5">
                                <div className={`${cfg.bar} h-1.5 rounded-full`} style={{ width: `${Math.min(data.pct, 100)}%` }} />
                              </div>
                              <p className={`text-xs font-bold mt-1 ${cfg.color}`}>{fmt(data.pct, 1)}%</p>
                            </div>
                          );
                        })}
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Détail par activité</p>
                          <div className="flex flex-col gap-1.5">
                            {bilanAvant.activites.map((act, i) => (
                              <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{act.label}</span>
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 ml-2 flex-shrink-0">{fmt(act.co2e_t, 3)} tCO₂e</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contenu onglet Après */}
                    {onglet === 'apres' && bilanApres && (
                      <div className="flex flex-col gap-3">
                        {(Object.entries(SCOPE_CONFIG) as [ScopeKey, typeof SCOPE_CONFIG[ScopeKey]][]).map(([scope, cfg]) => {
                          const data = bilanApres.par_scope[scope];
                          return (
                            <div key={scope} className={`p-4 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                                <span className={`text-lg font-black ${cfg.color}`}>{fmt(data.total, 2)} <span className="text-xs font-normal text-gray-400">tCO₂e</span></span>
                              </div>
                              <div className="w-full bg-white dark:bg-gray-700 rounded-full h-1.5">
                                <div className={`${cfg.bar} h-1.5 rounded-full`} style={{ width: `${Math.min(data.pct, 100)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Économies par activité</p>
                          {bilanApres.activites.map((act, i) => (
                            <div key={i} className={`flex items-center justify-between px-3 py-2 mb-1.5 rounded-lg ${act.reduit ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/40'}`}>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {act.reduit && <TrendingDown className="w-3 h-3 text-green-600 flex-shrink-0" />}
                                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{act.label}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{fmt(act.co2e_t, 3)}</span>
                                {act.economie_t !== undefined && act.economie_t > 0 && (
                                  <span className="text-xs text-green-600 font-bold">-{fmt(act.economie_t, 3)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contenu onglet Comparaison */}
                    {onglet === 'delta' && delta && (
                      <div className="flex flex-col gap-4">
                        {/* Delta global */}
                        <div className={`p-5 rounded-xl border text-center ${
                          delta.objectif_atteint
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800'
                        }`}>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Réduction totale obtenue</p>
                          <p className={`text-5xl font-black ${delta.objectif_atteint ? 'text-green-600' : 'text-primary-600 dark:text-primary-400'}`}>
                            -{fmt(delta.pct, 1)}%
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            soit <strong>{fmt(delta.co2e_t, 3)} tCO₂e évitées</strong>
                          </p>
                          {delta.objectif_pct && (
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">Objectif : {delta.objectif_pct}%</span>
                              {delta.objectif_atteint
                                ? <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle className="w-3.5 h-3.5" /> Atteint !</span>
                                : <span className="text-xs text-orange-500 font-bold">Manque {fmt((delta.objectif_pct as number) - delta.pct, 1)}%</span>
                              }
                            </div>
                          )}
                        </div>

                        {/* Comparaison par scope */}
                        {(Object.entries(SCOPE_CONFIG) as [ScopeKey, typeof SCOPE_CONFIG[ScopeKey]][]).map(([scope, cfg]) => {
                          const avant = bilanAvant?.par_scope[scope].total ?? 0;
                          const apres = bilanApres?.par_scope[scope].total ?? 0;
                          const eco   = avant - apres;
                          const pct   = avant > 0 ? ((eco / avant) * 100) : 0;
                          const maxPx = Math.max(avant, apres) || 1;
                          return (
                            <div key={scope} className={`p-4 ${cfg.bg} rounded-xl border ${cfg.border}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-xs font-bold text-green-600">-{fmt(pct, 1)}%</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 w-12">Avant</span>
                                  <div className="flex-1 bg-white dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-red-300 h-2 rounded-full" style={{ width: `${(avant / maxPx * 100)}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-16 text-right">{fmt(avant, 2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 w-12">Après</span>
                                  <div className="flex-1 bg-white dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(apres / maxPx * 100)}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-16 text-right">{fmt(apres, 2)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Badge conformité */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                          <Leaf className="w-4 h-4 text-green-500" />
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Simulation conforme GHG Protocol · Sauvegardée dans votre historique
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score pédagogique */}
                  {resultScenario.scoring_pedagogique !== null && (
                    <div className="iq-card p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                          {Math.round(resultScenario.scoring_pedagogique ?? 0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Score pédagogique</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {resultScenario.scoring_pedagogique && resultScenario.scoring_pedagogique >= 80
                            ? '🏆 Excellent ! Vous maîtrisez la réduction des émissions.'
                            : resultScenario.scoring_pedagogique && resultScenario.scoring_pedagogique >= 50
                            ? '👍 Bonne approche, continuez à optimiser.'
                            : '💡 Explorez d\'autres actions de réduction.'}
                        </p>
                      </div>
                      <button onClick={() => window.location.href = '/lms'} className="ml-auto iq-btn-ghost text-xs flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Parcours
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}