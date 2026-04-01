export interface ScopeData {
  valeur: number;
  label:  string;
}

export interface RepartitionScopes {
  SCOPE_1: ScopeData;
  SCOPE_2: ScopeData;
  SCOPE_3: ScopeData;
}

export interface EvolutionAnnuelle {
  annee:  number;
  scope1: number;
  scope2: number;
  scope3: number;
  total:  number;
  statut: string;
}

export interface MRVPhase {
  statut:               string;
  total_activites?:     number;
  activites_validees?:  number;
  activites_brouillon?: number;
  total_rapports?:      number;
  rapports_valides?:    number;
}

export interface StatutMRV {
  monitoring:   MRVPhase;
  reporting:    MRVPhase;
  verification: MRVPhase;
}

export interface KPIs {
  total_co2e_cumule:   number;
  nb_rapports:         number;
  derniere_annee:      number | null;
  co2e_derniere_annee: number;
}

export interface ActiviteRecente {
  id_activite: string;
  scope:       string;
  statut:      string;
  quantite:    string;
  unite:       string;
  created_at:  string;
  nom_source:  string;
  valeur_co2e: string | null;
}

export interface Organisation {
  nom:             string;
  secteur:         string;
  objectif:        number | null;
  annee_reference: number | null;
}

export interface DashboardData {
  organisation:       Organisation;
  kpis:               KPIs;
  evolution_annuelle: EvolutionAnnuelle[];
  repartition_scopes: RepartitionScopes | null;
  activites_recentes: ActiviteRecente[];
  statut_mrv:         StatutMRV;
}