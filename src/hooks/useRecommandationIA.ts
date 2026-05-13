/**
 * IQcarb Frontend — useRecommandationIA.ts
 * -----------------------------------------
 * Hook React qui appelle le Module IA 2 (Recommandation adaptative)
 * après chaque soumission de quiz dans le LMS.
 *
 * À UTILISER dans :
 *   - EtudiantDashboard.tsx → après soumission quiz
 *   - ParcoursDetail.tsx    → affichage recommandation
 *   - LMSProgression.tsx    → section "Module recommandé"
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────

export interface Indicateurs {
  score_dernier_quiz:  number;   // en %
  taux_completion_pct: number;   // en %
  nb_tentatives:       number;
  delta_xp:            number;
}

export interface ModuleRecommande {
  id_module:   string;
  titre:       string;
  niveau:      string;
  ordre:       number;
}

export interface Recommandation {
  succes:               boolean;
  id_utilisateur:       string;
  profil: {
    points_xp:    number;
    niveau:       string;
    score_carbone: number;
  };
  indicateurs:          Indicateurs;
  score_recommandation: number;    // 0.000 → 1.000
  interpretation:       string;
  decision:             'MODULE_SUIVANT' | 'REMEDIATION' | 'REINITIALISATION';
  module_recommande:    ModuleRecommande | null;
  bounty_disponible:    boolean;
  message_apprenant:    string;
  actions_suggerees:    string[];
  timestamp:            string;
}

interface UseRecommandationIAResult {
  recommandation:     Recommandation | null;
  chargement:         boolean;
  erreur:             string | null;
  fetchRecommandation: (idUtilisateur: string, idModuleActuel?: string) => Promise<void>;
  reset:              () => void;
}

// ─── Couleurs et icônes par décision ─────────────────────────

export const DECISION_CONFIG = {
  MODULE_SUIVANT: {
    couleur:     'text-green-700',
    fond:        'bg-green-50 border-green-200',
    icone:       '🎯',
    badge:       'Progression',
    badge_color: 'bg-green-100 text-green-800'
  },
  REMEDIATION: {
    couleur:     'text-yellow-700',
    fond:        'bg-yellow-50 border-yellow-200',
    icone:       '🟡',
    badge:       'Remédiation',
    badge_color: 'bg-yellow-100 text-yellow-800'
  },
  REINITIALISATION: {
    couleur:     'text-red-700',
    fond:        'bg-red-50 border-red-200',
    icone:       '🔄',
    badge:       'Réinitialisation',
    badge_color: 'bg-red-100 text-red-800'
  }
};

// ─── Hook principal ───────────────────────────────────────────

export const useRecommandationIA = (): UseRecommandationIAResult => {
  const [recommandation, setRecommandation] = useState<Recommandation | null>(null);
  const [chargement,     setChargement]     = useState(false);
  const [erreur,         setErreur]         = useState<string | null>(null);

  const fetchRecommandation = useCallback(async (
    idUtilisateur:  string,
    idModuleActuel: string = ''
  ) => {
    setChargement(true);
    setErreur(null);

    try {
      const token = localStorage.getItem('token');
      const params = idModuleActuel ? `?id_module=${idModuleActuel}` : '';

      const response = await axios.get<{ success: boolean; data: Recommandation }>(
        `${import.meta.env.VITE_API_URL}/api/lms/recommend/${idUtilisateur}${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setRecommandation(response.data.data);
      } else {
        setErreur('Impossible de générer la recommandation.');
      }

    } catch (err: any) {
      console.error('❌ useRecommandationIA:', err.message);
      setErreur(err.response?.data?.message || 'Erreur réseau.');
    } finally {
      setChargement(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRecommandation(null);
    setErreur(null);
  }, []);

  return { recommandation, chargement, erreur, fetchRecommandation, reset };
};

export default useRecommandationIA;