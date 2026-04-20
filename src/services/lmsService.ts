import api from './api';

const lmsService = {
  // ── Parcours ──────────────────────────────────────────────
  getParcours:       ()          => api.get('/lms/parcours'),
  getParcoursDetail: (id:string) => api.get(`/lms/parcours/${id}`),
  inscrire:          (id:string) => api.post(`/lms/parcours/${id}/inscrire`),

  // ── Modules ───────────────────────────────────────────────
  getModules:      (id:string) => api.get(`/lms/modules/${id}`),
  getModuleDetail: (id:string) => api.get(`/lms/modules/${id}/detail`),

  // ── Cours ─────────────────────────────────────────────────
  getCours:      (id:string)                      => api.get(`/lms/cours/${id}`),
  terminerCours: (id:string, temps_passe?: number) =>
    api.post(`/lms/cours/${id}/terminer`, { temps_passe: temps_passe ?? 0 }),

  // ── Progression ───────────────────────────────────────────
  getProgression:     () => api.get('/lms/progression'),
  getProfilApprenant: () => api.get('/lms/profil'),

  // ── Stats (admin) ─────────────────────────────────────────
  getStats: () => api.get('/lms/stats'),

  // ── Quiz ──────────────────────────────────────────────────
  // Charge le quiz lié à un cours (questions SANS est_correcte)
  getQuiz: (id_cours: string) =>
    api.get(`/lms/quiz/${id_cours}`),

  // Soumettre les réponses → reçoit score, corrections, passed
  submitQuiz: (id_quiz: string, answers: Record<string, string>) =>
    api.post(`/lms/quiz/${id_quiz}/submit`, { answers }),

  // Résultat précédent de l'apprenant pour ce quiz
  getQuizResultat: (id_quiz: string) =>
    api.get(`/lms/quiz/${id_quiz}/resultat`),

  // ── Flashcards ────────────────────────────────────────────
  // Deck + cartes + état maîtrisée par l'utilisateur
  getFlashcards: (id_cours: string) =>
    api.get(`/lms/flashcards/${id_cours}`),

  // Toggle maîtrisée pour une carte
  markFlashcardMaitrisee: (id_carte: string) =>
    api.post(`/lms/flashcards/${id_carte}/maitrisee`),

  // ── Formateur ─────────────────────────────────────────────
  getFormateurParcours:  ()              => api.get('/lms/formateur/parcours'),
  getFormateurModules:   (id:string)     => api.get(`/lms/formateur/modules/${id}`),
  getFormateurCours:     (id:string)     => api.get(`/lms/formateur/cours/${id}`),
  getApprenantsStats:    ()              => api.get('/lms/formateur/apprenants/stats'),
  getEquipeProgression:  ()              => api.get('/lms/formateur/equipe/progression'),

  createParcours: (payload: {
    titre: string; description?: string; objectifs?: string;
    niveau?: string; duree_estimee?: number; type_acces?: string; est_publie?: boolean;
  }) => api.post('/lms/formateur/parcours', payload),

  updateParcours: (id: string, payload: {
    titre?: string; description?: string; objectifs?: string;
    niveau?: string; duree_estimee?: number; type_acces?: string; est_publie?: boolean;
  }) => api.put(`/lms/formateur/parcours/${id}`, payload),

  createModule: (payload: {
    id_parcours: string; titre: string; description?: string;
    ordre?: number; niveau?: string; est_publie?: boolean;
  }) => api.post('/lms/formateur/modules', payload),

  updateModule: (id: string, payload: {
    titre?: string; description?: string; ordre?: number;
    niveau?: string; est_publie?: boolean;
  }) => api.put(`/lms/formateur/modules/${id}`, payload),

  createCours: (payload: {
    id_module: string; titre: string; description?: string;
    type_contenu: string; contenu?: string; url_ressource?: string;
    duree_minutes?: number; ordre?: number; points_xp?: number; est_publie?: boolean;
  }) => api.post('/lms/formateur/cours', payload),

  updateCours: (id: string, payload: {
    titre?: string; description?: string; type_contenu?: string;
    contenu?: string; url_ressource?: string; duree_minutes?: number;
    ordre?: number; points_xp?: number; est_publie?: boolean;
  }) => api.put(`/lms/formateur/cours/${id}`, payload),

  createQuiz: (payload: {
    id_cours: string; titre: string; score_minimal?: number;
    nb_questions?: number; duree_limite_min?: number; nb_tentatives_max?: number;
  }) => api.post('/lms/formateur/quiz', payload),
};

export default lmsService;