export interface Source {
  id_source:      string;
  nom_source:     string;
  categorie:      string;
  unite_activite: string;
  scope_defaut:   string;
  nb_facteurs:    number;
}

export interface Activite {
  id_activite:   string;
  id_organisation: string;
  id_source:     string;
  description:   string | null;
  periode_debut: string;
  periode_fin:   string;
  quantite:      string;
  unite:         string;
  site:          string | null;
  scope:         string;
  statut:        string;
  nom_source?:   string;
  categorie?:    string;
  valeur_co2e?:  string | null;
  created_at:    string;
}

export interface ActiviteFormData {
  id_organisation: string;
  id_source:       string;
  description:     string;
  periode_debut:   string;
  periode_fin:     string;
  quantite:        number | '';
  unite:           string;
  site:            string;
  scope:           string;
  notes:           string;
}

export interface ActiviteFilters {
  scope?:  string;
  statut?: string;
  page?:   number;
  limite?: number;
}

export const SCOPES = [
  {
    value: 'SCOPE_1',
    label: 'Scope 1',
    description: 'Émissions directes',
    color: 'text-red-600',
    bg:    'bg-red-50',
    border: 'border-red-200'
  },
  {
    value: 'SCOPE_2',
    label: 'Scope 2',
    description: 'Énergie indirecte',
    color: 'text-blue-600',
    bg:    'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    value: 'SCOPE_3',
    label: 'Scope 3',
    description: 'Chaîne de valeur',
    color: 'text-yellow-600',
    bg:    'bg-yellow-50',
    border: 'border-yellow-200'
  },
] as const;

export const STATUTS = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600'   },
  VALIDE:    { label: 'Validé',    color: 'bg-green-100 text-green-700'  },
  REJETE:    { label: 'Rejeté',   color: 'bg-red-100 text-red-700'     },
} as const;