import { useState } from 'react';
import type { Source } from '@/types/activite.types';
import { SCOPES } from '@/types/activite.types';
import api from '@/services/api';
import {
  Plus, Trash2, BarChart3,
  Loader2, Trophy, AlertCircle
} from 'lucide-react';

interface Scenario {
  nom:       string;
  id_source: string;
  quantite:  string;
  unite:     string;
  scope:     string;
}

interface ResultatScenario {
  nom:                 string;
  co2e_t:              number;
  co2e_kg:             number;
  economie_vs_pire_t:  number;
  economie_vs_pire_pct: number;
  scope:               string;
  facteur: {
    valeur:            number;
    unite:             string;
    source_officielle: string;
  };
}

interface Props {
  sources: Source[];
}

const emptyScenario = (): Scenario => ({
  nom:       '',
  id_source: '',
  quantite:  '',
  unite:     '',
  scope:     ''
});

export default function ComparateurScenarios({ sources }: Props) {
  const [scenarios,  setScenarios]  = useState<Scenario[]>([
    emptyScenario(), emptyScenario()
  ]);
  const [resultats,  setResultats]  = useState<ResultatScenario[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Mettre à jour un scénario
  const updateScenario = (
    index: number,
    field: keyof Scenario,
    value: string
  ) => {
    setScenarios(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-remplir l'unité selon la source
      if (field === 'id_source') {
        const source = sources.find(s => s.id_source === value);
        updated[index].unite = source?.unite_activite ?? '';
      }
      return updated;
    });
    setResultats([]);
  };

  // Ajouter un scénario
  const ajouterScenario = () => {
    if (scenarios.length < 4) {
      setScenarios(prev => [...prev, emptyScenario()]);
    }
  };

  // Supprimer un scénario
  const supprimerScenario = (index: number) => {
    if (scenarios.length > 2) {
      setScenarios(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Lancer la comparaison
  const comparer = async () => {
    setError(null);

    // Validation
    const valides = scenarios.filter(
      s => s.id_source && s.quantite && parseFloat(s.quantite) > 0 && s.scope
    );

    if (valides.length < 2) {
      setError('Remplissez au moins 2 scénarios complets.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/calculs/comparer', {
        scenarios: valides.map(s => ({
          nom:       s.nom || `Scénario ${scenarios.indexOf(s) + 1}`,
          id_source: s.id_source,
          quantite:  parseFloat(s.quantite),
          unite:     s.unite,
          scope:     s.scope
        }))
      });

      setResultats(res.data.data.scenarios || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de comparaison';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScenarios([emptyScenario(), emptyScenario()]);
    setResultats([]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              Comparateur de scénarios
            </h3>
            <p className="text-xs text-gray-400">
              Comparez jusqu'à 4 alternatives
            </p>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      {/* Scénarios */}
      <div className="space-y-4 mb-5">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={scenario.nom}
                onChange={e => updateScenario(index, 'nom', e.target.value)}
                placeholder={`Scénario ${index + 1} (ex: Diesel actuel)`}
                className="text-sm font-semibold text-gray-700 bg-transparent border-none focus:outline-none flex-1"
              />
              {scenarios.length > 2 && (
                <button
                  onClick={() => supprimerScenario(index)}
                  className="text-red-400 hover:text-red-600 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Scope */}
              <select
                value={scenario.scope}
                onChange={e => updateScenario(index, 'scope', e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
              >
                <option value="">Scope...</option>
                {SCOPES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Source */}
              <select
                value={scenario.id_source}
                onChange={e => updateScenario(index, 'id_source', e.target.value)}
                disabled={!scenario.scope}
                className="px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white disabled:bg-gray-50"
              >
                <option value="">Source...</option>
                {sources
                  .filter(s => !scenario.scope || s.scope_defaut === scenario.scope)
                  .map(s => (
                    <option key={s.id_source} value={s.id_source}>
                      {s.nom_source}
                    </option>
                  ))
                }
              </select>

              {/* Quantité */}
              <div className="flex gap-1">
                <input
                  type="number"
                  value={scenario.quantite}
                  onChange={e => updateScenario(index, 'quantite', e.target.value)}
                  placeholder="Quantité"
                  min="0"
                  className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <span className="px-2 py-2 bg-gray-100 rounded-lg text-xs text-gray-500 flex items-center">
                  {scenario.unite || '?'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Boutons */}
      <div className="flex gap-3 mb-5">
        {scenarios.length < 4 && (
          <button
            onClick={ajouterScenario}
            className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-primary-400 hover:text-primary-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter un scénario
          </button>
        )}
        <button
          onClick={comparer}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <BarChart3 className="w-4 h-4" />
          }
          {loading ? 'Comparaison...' : 'Comparer'}
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 mb-4">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Résultats */}
      {resultats.length > 0 && (
        <div className="space-y-3 border-t border-gray-100 pt-5">
          <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Résultats — du moins au plus émetteur
          </p>

          {resultats.map((r, i) => {
            const isMeilleur = i === 0;
            const isPire     = i === resultats.length - 1;

            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  isMeilleur
                    ? 'bg-green-50 border-green-200'
                    : isPire
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${
                      isMeilleur ? '🥇' : isPire ? '🔴' : '🥈'
                    }`} />
                    <p className={`text-sm font-bold ${
                      isMeilleur ? 'text-green-800'
                      : isPire   ? 'text-red-800'
                      : 'text-gray-800'
                    }`}>
                      {r.nom}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      isMeilleur ? 'text-green-700'
                      : isPire   ? 'text-red-700'
                      : 'text-gray-700'
                    }`}>
                      {r.co2e_t.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-400">tCO2e</p>
                  </div>
                </div>

                {/* Barre relative */}
                <div className="w-full bg-white rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isMeilleur ? 'bg-green-400'
                      : isPire   ? 'bg-red-400'
                      : 'bg-gray-400'
                    }`}
                    style={{
                      width: isPire
                        ? '100%'
                        : `${100 - r.economie_vs_pire_pct}%`
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    {r.facteur.valeur} {r.facteur.unite}
                  </span>
                  {!isPire && (
                    <span className="text-green-600 font-bold">
                      -{r.economie_vs_pire_pct}% vs pire scénario
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}