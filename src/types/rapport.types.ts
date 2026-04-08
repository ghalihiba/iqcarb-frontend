export type StatutRapport =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VERIFIE'
  | 'VALIDE'
  | 'REJETE'
  | 'CORRECTIONS_DEMANDEES';

export type StandardRapport =
  | 'GHG Protocol Corporate Standard'
  | 'ISO 14064-1:2018'
  | 'Bilan Carbone® ADEME';

export interface ScopeDetail {
  total:             number;
  nb_activites:      number;
  pourcentage:       number;
  description:       string;
  incertitude_moyenne: number;
  activites:         ActiviteRapport[];
}

export interface ActiviteRapport {
  source:      string;
  categorie:   string;
  quantite:    number;
  unite:       string;
  co2e_t:      number;
  site:        string;
  periode:     string;
  facteur:     string;
  reference:   string;
}

export interface ConformiteCheck {
  scope1_declare:       boolean;
  scope2_declare:       boolean;
  scope3_declare:       boolean;
  facteurs_officiels:   boolean;
  tracabilite_complete: boolean;
  donnees_validees:     boolean;
}

export interface Conformite {
  checks:           ConformiteCheck;
  score_conformite: string;
  pourcentage:      number;
  niveau:           'CONFORME' | 'PARTIELLEMENT_CONFORME' | 'NON_CONFORME';
  conforme_ghg:     boolean;
  conforme_iso14064: boolean;
}

export interface KPIsRapport {
  total_co2e_t:         number;
  total_co2e_kg:        number;
  co2e_par_employe?:    number;
  objectif_reduction_t?: number;
  ecart_objectif_t?:    number;
  objectif_atteint?:    boolean;
  taux_realisation_pct?: number;
  repartition_scopes: {
    scope_1_pct: number;
    scope_2_pct: number;
    scope_3_pct: number;
  };
}

export interface OrganisationRapport {
  id:                 string;
  nom:                string;
  secteur:            string;
  pays:               string;
  nb_employes:        number | null;
  objectif_reduction: number | null;
  annee_reference:    number | null;
  perimetre:          string | null;
}

export interface Rapport {
  id_rapport:       string;
  statut:           StatutRapport;
  date_generation:  string;
  standard_utilise: StandardRapport;
  organisation:     OrganisationRapport;
  periode: {
    debut: string;
    fin:   string;
    annee: number;
  };
  inventaire: {
    bilan_scopes:   Record<string, ScopeDetail>;
    total_co2e:     number;
    unite:          string;
    nb_activites:   number;
    postes_majeurs: PosteMajeur[];
  };
  indicateurs:  KPIsRapport;
  conformite:   Conformite;
  methodologie: string;
  hypotheses:   string;
}

export interface PosteMajeur {
  source:       string;
  categorie:    string;
  scope:        string;
  total_co2e:   number;
  pourcentage:  number;
  nb_activites: number;
}

export interface RapportListItem {
  id_rapport:       string;
  annee:            number;
  periode_debut:    string;
  periode_fin:      string;
  total_scope1:     string;
  total_scope2:     string;
  total_scope3:     string;
  total_co2e:       string;
  statut:           StatutRapport;
  standard_utilise: string;
  date_generation:  string;
  organisation:     string;
  createur:         string;
}

export interface GenerateRapportDTO {
  id_organisation: string;
  annee:           number;
  periode_debut:   string;
  periode_fin:     string;
  standard:        StandardRapport;
}