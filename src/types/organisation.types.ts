export interface Organisation {
  id_organisation:        string;
  nom:                    string;
  secteur_activite:       string | null;
  type_organisation:      string | null;
  pays:                   string | null;
  ville:                  string | null;
  nb_employes:            number | null;
  objectif_reduction_co2: string | null;
  annee_reference:        number | null;
  created_at:             string;
}