import { useState, useEffect, useCallback } from 'react';
import type { Source } from '@/types/activite.types';
import { SCOPES } from '@/types/activite.types';
import api from '@/services/api';
import {
  Calculator, Loader2, ChevronDown,
  TrendingDown, Info, RefreshCw
} from 'lucide-react';

interface SimulationResult {
  co2e_t:          number;
  co2e_kg:         number;
  incertitude_pct: number;
  methode_calcul:  string;
  facteur: {
    valeur:           number;
    unite:            string;
    source_officielle: string;
    annee:            number;
  };
  scope_description: string;
}

interface Props {
  sources: Source[];
}

export default function SimulateurCO2({ sources }: Props) {
  const [scope,       setScope]       = useState('');
  const [idSource,    setIdSource]    = useState('');
  const [quantite,    setQuantite]    = useState('');
  const [unite,       setUnite]       = useState('');
  const [result,      setResult]      = useState<SimulationResult | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [sourcesFilt, setSourcesFilt] = useState<Source[]>([]);

  // Filtrer les sources par scope
  useEffect(() => {
    if (scope) {
      const filtered = sources.filter(s => s.scope_defaut === scope);
      setSourcesFilt(filtered);
      setIdSource('');
      setUnite('');
      setResult(null);
    }
  }, [scope, sources]);

  // Mettre à jour l'unité selon la source
  useEffect(() => {
    if (idSource) {
      const source = sources.find(s => s.id_source === idSource);
      setUnite(source?.unite_activite ?? '');
      setResult(null);
    }
  }, [idSource, sources]);

  // Lancer la simulation
  const simuler = useCallback(async () => {
    if (!idSource || !quantite || !scope) return;
    if (parseFloat(quantite) <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/calculs/simuler', {
        id_source: idSource,
        quantite:  parseFloat(quantite),
        unite,
        scope,
        pays:  'France',
        annee: 2024
      });

      const calcul = res.data.data;
      setResult({
        co2e_t:          calcul.resultat.co2e_t,
        co2e_kg:         calcul.resultat.co2e_kg,
        incertitude_pct: calcul.resultat.incertitude_pct,
        methode_calcul:  calcul.methode_calcul,
        facteur:         calcul.facteur,
        scope_description: calcul.description_scope
      });

    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Erreur de simulation';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [idSource, quantite, unite, scope]);

  // Simulation automatique après changement de quantité (debounce)
  useEffect(() => {
    if (!idSource || !quantite || parseFloat(quantite) <= 0) return;
    const timer = setTimeout(simuler, 800);
    return () => clearTimeout(timer);
  }, [quantite, simuler]);

  const reset = () => {
    setScope('');
    setIdSource('');
    setQuantite('');
    setUnite('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              Simulateur CO2e
            </h3>
            <p className="text-xs text-gray-400">
              Calcul instantané — non sauvegardé
            </p>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </div>

      <div className="space-y-4">

        {/* Scope */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Scope GES
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SCOPES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setScope(s.value)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  scope === s.value
                    ? `${s.bg} ${s.border} ${s.color}`
                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Source d'émission
          </label>
          <div className="relative">
            <select
              value={idSource}
              onChange={e => setIdSource(e.target.value)}
              disabled={!scope}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">
                {!scope ? '← Choisir un scope' : 'Sélectionner...'}
              </option>
              {sourcesFilt.map(s => (
                <option key={s.id_source} value={s.id_source}>
                  {s.nom_source}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Quantité */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Quantité{unite && <span className="text-primary-600 ml-1">({unite})</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={quantite}
              onChange={e => setQuantite(e.target.value)}
              placeholder="ex: 1200"
              min="0"
              step="0.01"
              disabled={!idSource}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            />
            <button
              onClick={simuler}
              disabled={!idSource || !quantite || loading}
              className="px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Calculator className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Le calcul se lance automatiquement
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Résultat */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-gray-100">

            {/* CO2e principal */}
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">
                Émissions calculées
              </p>
              <p className="text-3xl font-bold text-green-700">
                {result.co2e_t.toFixed(6)}
              </p>
              <p className="text-sm text-green-500">tCO2e</p>
              <p className="text-xs text-green-400 mt-1">
                = {result.co2e_kg.toFixed(3)} kgCO2e
              </p>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-400 mb-1">Incertitude</p>
                <p className="text-sm font-bold text-gray-700">
                  ± {result.incertitude_pct}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-400 mb-1">Facteur</p>
                <p className="text-sm font-bold text-gray-700">
                  {result.facteur.valeur} {result.facteur.unite}
                </p>
              </div>
            </div>

            {/* Méthode */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="w-3 h-3 text-blue-500" />
                <p className="text-xs font-semibold text-blue-700">
                  Méthode de calcul
                </p>
              </div>
              <p className="text-xs text-blue-600 font-mono">
                {result.methode_calcul}
              </p>
            </div>

            {/* Source officielle */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
              <TrendingDown className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-500">
                Référence : {result.facteur.source_officielle}
                {' '}({result.facteur.annee})
              </p>
            </div>

            {/* Avertissement simulation */}
            <p className="text-xs text-center text-gray-400 italic">
              ⚠️ Simulation uniquement — non sauvegardée en base
            </p>
          </div>
        )}
      </div>
    </div>
  );
}