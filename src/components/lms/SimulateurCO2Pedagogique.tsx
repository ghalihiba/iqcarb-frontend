import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle, Loader2, Plus, Target, Trash2, Zap } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import type { ActiviteSimulation, Reduction } from '@/hooks/useSimulation';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';

interface SimulateurCO2PedagogiqueProps {
  idCours: string;
  contenu?: string;
  onComplete: () => void;
  isCompleted: boolean;
}

interface ContenuSimulation {
  nom?: string;
  objectif_pct?: number;
  activites?: Array<Partial<ActiviteSimulation>>;
}

const parseContenuSimulation = (contenu?: string): ContenuSimulation => {
  if (!contenu) return {};
  try {
    const parsed = JSON.parse(contenu) as ContenuSimulation;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const fmt = (v?: number | null, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '0.00');

export default function SimulateurCO2Pedagogique({
  idCours,
  contenu,
  onComplete,
  isCompleted,
}: SimulateurCO2PedagogiqueProps) {
  const toast = useToast();
  const { user } = useAuth();
  const defaults = useMemo(() => parseContenuSimulation(contenu), [contenu]);
  const {
    sources,
    loadingSources,
    fetchSources,
    resultScenario,
    loadingScenario,
    scenariser,
    error,
  } = useSimulation();

  const [nom, setNom] = useState(defaults.nom ?? 'Cas pratique CO2');
  const [objectifPct, setObjectifPct] = useState(
    defaults.objectif_pct ? String(defaults.objectif_pct) : '20'
  );
  const [activites, setActivites] = useState<ActiviteSimulation[]>(
    defaults.activites?.length
      ? defaults.activites.map((a, idx) => ({
          id_source: a.id_source ?? '',
          label: a.label ?? `Activité ${idx + 1}`,
          quantite: a.quantite ?? 1000,
          unite: a.unite ?? 'kWh',
          scope: a.scope ?? 'SCOPE_2',
          annee: a.annee,
          pays: a.pays,
        }))
      : [{ id_source: '', label: 'Électricité bureau', quantite: 12000, unite: 'kWh', scope: 'SCOPE_2' }]
  );

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const activitesValides = useMemo(
    () => activites.filter((a) => a.id_source && a.quantite > 0 && a.unite),
    [activites]
  );

  const addActivite = useCallback(() => {
    setActivites((prev) => [
      ...prev,
      { id_source: '', label: `Activité ${prev.length + 1}`, quantite: 1000, unite: 'km', scope: 'SCOPE_1' },
    ]);
  }, []);

  const updateActivite = useCallback((idx: number, patch: Partial<ActiviteSimulation>) => {
    setActivites((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }, []);

  const deleteActivite = useCallback((idx: number) => {
    setActivites((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const runSimulation = useCallback(async () => {
    const valid = activites.filter((a) => a.id_source && a.quantite > 0 && a.unite);
    if (valid.length === 0) {
      toast.error('Activites invalides', "Selectionnez une source et une quantite valide.");
      return;
    }
    const reductions: Reduction[] = [];
    const result = await scenariser({
      id_organisation: user?.id_organisation,
      id_cours: idCours,
      nom,
      activites: valid,
      reductions,
      objectif_pct: objectifPct ? parseFloat(objectifPct) : undefined,
      annee: new Date().getFullYear(),
      notes: 'Simulation pédagogique LMS',
    });
    if (!result) {
      toast.error('Simulation echouee', "Le calcul n'a pas abouti. Verifiez les donnees.");
    }
  }, [activites, idCours, nom, objectifPct, scenariser, toast, user]);

  const bilanAvant = resultScenario?.bilan_avant;
  const bilanApres = resultScenario?.bilan_apres;
  const delta = resultScenario?.delta;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="iq-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--iq-text-1)]">Simulateur CO2 pedagogique</h3>
            <p className="text-xs text-[var(--iq-text-2)]">Testez un scenario de reduction d'emissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="iq-input"
            placeholder="Nom de la simulation"
          />
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            <input
              type="number"
              min="0"
              max="100"
              value={objectifPct}
              onChange={(e) => setObjectifPct(e.target.value)}
              className="iq-input"
              placeholder="Objectif reduction (%)"
            />
          </div>
        </div>
      </div>

      <div className="iq-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-[var(--iq-text-1)]">Activites a simuler</h4>
          <button onClick={addActivite} className="iq-btn-ghost text-xs">
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>

        {loadingSources ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {activites.map((a, i) => (
              <div key={`${a.label}-${i}`} className="grid grid-cols-12 gap-2 p-3 rounded-xl iq-soft border border-[var(--iq-border)]">
                <input
                  className="iq-input col-span-3"
                  value={a.label}
                  onChange={(e) => updateActivite(i, { label: e.target.value })}
                  placeholder="Description"
                />
                <select
                  className="iq-input col-span-2"
                  value={a.scope}
                  onChange={(e) => updateActivite(i, { scope: e.target.value as ActiviteSimulation['scope'], id_source: '' })}
                >
                  <option value="SCOPE_1">Scope 1</option>
                  <option value="SCOPE_2">Scope 2</option>
                  <option value="SCOPE_3">Scope 3</option>
                </select>
                <select
                  className="iq-input col-span-3"
                  value={a.id_source}
                  onChange={(e) => updateActivite(i, { id_source: e.target.value })}
                >
                  <option value="">Source d'emission</option>
                  {sources
                    .filter((s) => s.scope_defaut === a.scope || !s.scope_defaut)
                    .map((s) => (
                      <option key={s.id_source} value={s.id_source}>
                        {s.nom_source}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="iq-input col-span-2"
                  value={a.quantite}
                  onChange={(e) => updateActivite(i, { quantite: parseFloat(e.target.value) || 0 })}
                />
                <div className="col-span-2 flex gap-2">
                  <input
                    className="iq-input flex-1"
                    value={a.unite}
                    onChange={(e) => updateActivite(i, { unite: e.target.value })}
                    placeholder="Unite"
                  />
                  <button
                    type="button"
                    onClick={() => deleteActivite(i)}
                    className="px-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                    aria-label="Supprimer l'activite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={runSimulation}
            disabled={loadingScenario || activitesValides.length === 0}
            className="iq-btn-primary"
          >
            {loadingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Lancer la simulation
          </button>
        </div>
        {activitesValides.length === 0 && (
          <p className="mt-2 text-xs text-[var(--iq-text-2)]">
            Selectionnez au moins une source d'emission pour lancer la simulation.
          </p>
        )}
      </div>

      {error && (
        <div className="iq-card p-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {resultScenario && (
        <div className="iq-card p-5 space-y-4">
          <h4 className="text-sm font-bold text-[var(--iq-text-1)]">Resultat du cas pratique</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="iq-soft rounded-xl p-4 border border-[var(--iq-border)]">
              <p className="text-xs text-[var(--iq-text-2)]">Bilan initial</p>
              <p className="text-2xl font-black text-red-500">{fmt(bilanAvant?.total_co2e)} tCO2e</p>
            </div>
            <div className="iq-soft rounded-xl p-4 border border-[var(--iq-border)]">
              <p className="text-xs text-[var(--iq-text-2)]">Apres action</p>
              <p className="text-2xl font-black text-green-600">{fmt(bilanApres?.total_co2e ?? bilanAvant?.total_co2e)} tCO2e</p>
            </div>
            <div className="rounded-xl p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-[var(--iq-text-2)]">Reduction</p>
              <p className="text-2xl font-black text-green-700 dark:text-green-300">-{fmt(delta?.pct, 1)}%</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onComplete}
              disabled={isCompleted}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-default'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted ? 'Cas pratique complete' : 'Valider ce cas pratique'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
