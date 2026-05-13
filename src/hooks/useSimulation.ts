/**
 * useSimulation.ts
 * ──────────────────────────────────────────────────────────────
 * Hook React pour le module simulation carbone
 * Pattern identique à useActivites, useConformite, etc.
 */

import { useState, useCallback } from 'react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────

export interface SourceEmission {
  id_source:    string;
  nom_source:   string;
  description:  string | null;
  categorie:    string | null;
  unite_activite: string;
  scope_defaut: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  facteur_min:  number | null;
  facteur_max:  number | null;
  annee_recente: number | null;
  unite_facteur: string | null;
}

export interface ActiviteSimulation {
  id_source: string;
  label:     string;
  quantite:  number;
  unite:     string;
  scope:     'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  pays?:     string;
  annee?:    number;
}

export interface Reduction {
  index_activite:    number;
  type:              'reduction_pct' | 'changement_source' | 'suppression' | 'changement_quantite';
  valeur?:           number;          // pour reduction_pct ou changement_quantite
  nouvelle_source_id?: string;        // pour changement_source
}

export interface BilanScope {
  total: number;
  pct:   number;
}

export interface BilanActivite {
  label:      string;
  scope:      string;
  quantite:   number;
  unite:      string;
  co2e_t:     number;
  co2e_avant?: number;
  economie_t?: number;
  reduit?:    boolean;
}

export interface Bilan {
  total_co2e: number;
  par_scope:  {
    SCOPE_1: BilanScope;
    SCOPE_2: BilanScope;
    SCOPE_3: BilanScope;
  };
  activites: BilanActivite[];
}

export interface Delta {
  co2e_t:           number;
  pct:              number;
  objectif_pct:     number | null;
  objectif_atteint: boolean | null;
}

export interface ResultatSimulation {
  id_simulation:       string;
  type_simulation:     string;
  bilan_avant:         Bilan;
  bilan_apres:         Bilan | null;
  delta:               Delta | null;
  scoring_pedagogique: number | null;
  objectif_atteint:    boolean | null;
  date_simulation:     string;
}

export interface ResultatSimpleCalcul {
  scope:               string;
  description_scope:   string;
  input: {
    quantite_originale: number;
    unite_originale:    string;
    quantite_convertie: number;
    unite_base:         string;
  };
  facteur: {
    valeur:            number;
    unite:             string;
    pays:              string;
    annee:             number;
    source_officielle: string;
  };
  resultat: {
    co2e_kg:         number;
    co2e_t:          number;
    incertitude_pct: number;
  };
  methode_calcul: string;
  date_calcul:    string;
}

export interface HistoriqueSimulation {
  id_simulation:       string;
  nom:                 string;
  type_simulation:     string;
  total_emission:      number;
  delta_co2e:          number | null;
  delta_pct:           number | null;
  objectif_pct:        number | null;
  objectif_atteint:    boolean;
  scoring_pedagogique: number | null;
  statut:              string;
  date_simulation:     string;
  cours_titre:         string | null;
  module_titre:        string | null;
  parcours_titre:      string | null;
}

export interface ScenarioComparaison {
  nom:                string;
  id_source:          string;
  quantite:           number;
  unite:              string;
  scope:              string;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useSimulation() {
  // État sources
  const [sources,         setSources]         = useState<SourceEmission[]>([]);
  const [loadingSources,  setLoadingSources]   = useState(false);

  // État calcul simple
  const [resultSimple,    setResultSimple]     = useState<ResultatSimpleCalcul | null>(null);
  const [loadingSimple,   setLoadingSimple]    = useState(false);

  // État scénarisation
  const [resultScenario,  setResultScenario]   = useState<ResultatSimulation | null>(null);
  const [loadingScenario, setLoadingScenario]  = useState(false);

  // État comparaison
  const [resultComparaison, setResultComparaison] = useState<{
    scenarios: Array<{
      nom:                  string;
      co2e_t:               number;
      scope:                string;
      economie_vs_pire_t:   number;
      economie_vs_pire_pct: number;
    }>;
    meilleur: string;
    pire:     string;
  } | null>(null);
  const [loadingComparaison, setLoadingComparaison] = useState(false);

  // État historique
  const [historique,      setHistorique]       = useState<HistoriqueSimulation[]>([]);
  const [totalHistorique, setTotalHistorique]  = useState(0);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // Messages
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // ── Charger les sources d'émission ──────────────────────────
  const fetchSources = useCallback(async (scope?: string) => {
    setLoadingSources(true);
    try {
      const params = scope ? `?scope=${scope}` : '';
      const res = await api.get(`/simulations/sources${params}`);
      setSources(res.data.data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement sources';
      setError(msg);
    } finally {
      setLoadingSources(false);
    }
  }, []);

  // ── Simulation simple (calcul instantané, non sauvegardé) ───
  const simulerSimple = useCallback(async (params: {
    id_source: string;
    quantite:  number;
    unite:     string;
    scope:     string;
    pays?:     string;
    annee?:    number;
  }): Promise<ResultatSimpleCalcul | null> => {
    setLoadingSimple(true);
    setError(null);
    setResultSimple(null);
    try {
      const res = await api.post('/simulations/calculer', params);
      const calcul = res.data.data as ResultatSimpleCalcul;
      setResultSimple(calcul);
      return calcul;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur simulation';
      setError(msg);
      return null;
    } finally {
      setLoadingSimple(false);
    }
  }, []);

  // ── Scénarisation avant/après ────────────────────────────────
  const scenariser = useCallback(async (params: {
    id_organisation?: string;
    id_cours?:        string;
    nom?:             string;
    activites:        ActiviteSimulation[];
    reductions?:      Reduction[];
    objectif_pct?:    number;
    annee?:           number;
    notes?:           string;
  }): Promise<ResultatSimulation | null> => {
    setLoadingScenario(true);
    setError(null);
    setResultScenario(null);
    try {
      const res = await api.post('/simulations/scenariser', params);
      const resultat = res.data.data as ResultatSimulation;
      setResultScenario(resultat);

      if (resultat.objectif_atteint) {
        setSuccess(`🎉 Objectif atteint ! Réduction : ${resultat.delta?.pct ?? 0}%`);
      } else if (resultat.delta) {
        setSuccess(`Simulation calculée. Réduction : ${resultat.delta.pct}%`);
      } else {
        setSuccess('Bilan initial calculé avec succès.');
      }

      return resultat;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur scénarisation';
      setError(msg);
      return null;
    } finally {
      setLoadingScenario(false);
    }
  }, []);

  // ── Comparaison de scénarios ─────────────────────────────────
  const comparer = useCallback(async (
    scenarios: ScenarioComparaison[]
  ) => {
    setLoadingComparaison(true);
    setError(null);
    setResultComparaison(null);
    try {
      const res = await api.post('/simulations/comparer', { scenarios });
      setResultComparaison(res.data.data);
      return res.data.data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur comparaison';
      setError(msg);
      return null;
    } finally {
      setLoadingComparaison(false);
    }
  }, []);

  // ── Historique ───────────────────────────────────────────────
  const fetchHistorique = useCallback(async (params?: {
    type_simulation?: string;
    page?:            number;
    limite?:          number;
  }) => {
    setLoadingHistorique(true);
    try {
      const query = new URLSearchParams();
      if (params?.type_simulation) query.set('type_simulation', params.type_simulation);
      if (params?.page)            query.set('page', String(params.page));
      if (params?.limite)          query.set('limite', String(params.limite));

      const res = await api.get(`/simulations/historique?${query.toString()}`);
      setHistorique(res.data.data ?? []);
      setTotalHistorique(res.data.total ?? 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur historique';
      setError(msg);
    } finally {
      setLoadingHistorique(false);
    }
  }, []);

  // ── Reset ────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setResultSimple(null);
    setResultScenario(null);
    setResultComparaison(null);
    setError(null);
    setSuccess(null);
  }, []);

  return {
    // Sources
    sources,
    loadingSources,
    fetchSources,

    // Simulation simple
    resultSimple,
    loadingSimple,
    simulerSimple,

    // Scénarisation
    resultScenario,
    loadingScenario,
    scenariser,

    // Comparaison
    resultComparaison,
    loadingComparaison,
    comparer,

    // Historique
    historique,
    totalHistorique,
    loadingHistorique,
    fetchHistorique,

    // Messages
    error,
    success,
    clearMessages,
    reset,
  };
}