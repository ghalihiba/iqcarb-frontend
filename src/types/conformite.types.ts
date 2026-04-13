export type NiveauConformite =
  | 'CONFORME'
  | 'PARTIELLEMENT_CONFORME'
  | 'NON_CONFORME';

export type StatutIndicateur =
  | 'OK'
  | 'ATTENTION'
  | 'CRITIQUE'
  | 'INFO';

export interface IndicateurScope {
  scope:               'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  label:               string;
  description:         string;
  total_co2e:          number;
  pourcentage:         number;
  nb_activites:        number;
  incertitude:         number;
  tendance:            'hausse' | 'baisse' | 'stable' | null;
  variation_pct:       number | null;
  objectif_scope?:     number;
  objectif_atteint?:   boolean;
}

export interface IndicateurCle {
  id:          string;
  label:       string;
  valeur:      number | string;
  unite?:      string;
  statut:      StatutIndicateur;
  description: string;
  seuil_ok?:   number;
  seuil_att?:  number;
  tendance?:   'hausse' | 'baisse' | 'stable';
}

export interface CheckConformite {
  id:          string;
  label:       string;
  description: string;
  statut:      boolean;
  obligatoire: boolean;
  standard:    'GHG' | 'ISO' | 'MRV' | 'ALL';
}

export interface ConformiteStandard {
  nom:         string;
  code:        string;
  conforme:    boolean;
  score:       number;
  total:       number;
  pourcentage: number;
  checks:      CheckConformite[];
}

export interface EvolutionConformite {
  annee:       number;
  score:       number;
  niveau:      NiveauConformite;
  total_co2e:  number;
  nb_rapports: number;
}

export interface ConformiteData {
  // Scores globaux
  score_global:       number;
  niveau:             NiveauConformite;
  date_evaluation:    string;

  // Indicateurs clés
  indicateurs_cles:   IndicateurCle[];

  // Par scope
  scopes:             IndicateurScope[];
  total_co2e:         number;
  total_co2e_kg:      number;
  nb_activites:       number;
  intensite_employe?: number;

  // Standards
  standards:          ConformiteStandard[];

  // Évolution
  evolution:          EvolutionConformite[];

  // Organisation
  organisation: {
    nom:             string;
    secteur:         string;
    objectif:        number | null;
    annee_reference: number | null;
  };
}