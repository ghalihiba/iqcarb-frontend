// ── Énumérations ─────────────────────────────────────────────

export type NiveauPedagogique =
  | 'DEBUTANT'
  | 'INTERMEDIAIRE'
  | 'AVANCE';

export type TypeContenu =
  | 'VIDEO'
  | 'PDF'
  | 'ARTICLE'
  | 'ETUDE_DE_CAS'
  | 'PRESENTATION'
  | 'MIXTE';

export type StatutProgression =
  | 'NON_COMMENCE'
  | 'EN_COURS'
  | 'TERMINE';

export type TypeAcces =
  | 'LIBRE'
  | 'GUIDE'
  | 'PREREQUIS';

// ── Parcours ──────────────────────────────────────────────────

export interface Parcours {
  id_parcours:     string;
  titre:           string;
  description:     string | null;
  objectifs:       string | null;
  niveau:          NiveauPedagogique;
  duree_estimee:   number | null;   // en minutes
  type_acces:      TypeAcces;
  est_publie:      boolean;
  image_url:       string | null;
  ordre:           number;
  nb_modules:      number;
  nb_inscrits:     number;
  created_at:      string;
  // Progression de l'utilisateur
  progression?:    number;          // 0–100%
  statut?:         StatutProgression;
  est_inscrit?:    boolean;
}

// ── Module ────────────────────────────────────────────────────

export interface Module {
  id_module:       string;
  id_parcours:     string;
  titre:           string;
  description:     string | null;
  ordre:           number;
  duree_estimee:   number | null;
  est_publie:      boolean;
  nb_cours:        number;
  // Progression
  progression?:    number;
  statut?:         StatutProgression;
  cours?:          Cours[];
}

// ── Cours ─────────────────────────────────────────────────────

export interface Cours {
  id_cours:        string;
  id_module:       string;
  titre:           string;
  description:     string | null;
  contenu:         string | null;   // HTML ou Markdown
  type_contenu:    TypeContenu;
  url_ressource:   string | null;
  duree_minutes:   number | null;
  ordre:           number;
  est_publie:      boolean;
  points_xp:       number;
  // Progression
  est_complete?:   boolean;
  date_completion?: string;
}

// ── Inscription ───────────────────────────────────────────────

export interface Inscription {
  id_inscription:  string;
  id_utilisateur:  string;
  id_parcours:     string;
  date_inscription: string;
  progression:     number;
  statut:          StatutProgression;
  date_completion?: string;
}

// ── Progression cours ─────────────────────────────────────────

export interface ProgressionCours {
  id_progression:  string;
  id_utilisateur:  string;
  id_cours:        string;
  est_complete:    boolean;
  date_completion?: string;
  temps_passe:     number;          // en secondes
}

// ── Profil apprenant ──────────────────────────────────────────

export interface ProfilApprenant {
  id_utilisateur:   string;
  nom:              string;
  prenom:           string;
  email:            string;
  niveau_global:    NiveauPedagogique;
  points_xp_total:  number;
  nb_parcours:      number;
  nb_cours_termines: number;
  progression_moyenne: number;
  parcours_actifs:  Inscription[];
}

// ── Stats LMS ─────────────────────────────────────────────────

export interface StatsLMS {
  nb_parcours_disponibles: number;
  nb_inscrits_total:       number;
  nb_cours_total:          number;
  taux_completion_moyen:   number;
}