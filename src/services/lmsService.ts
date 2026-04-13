import api from './api';

const lmsService = {
  // Parcours
  getParcours:      ()         => api.get('/lms/parcours'),
  getParcoursDetail:(id:string)=> api.get(`/lms/parcours/${id}`),
  inscrire:         (id:string)=> api.post(`/lms/parcours/${id}/inscrire`),

  // Modules
  getModules:       (id:string)=> api.get(`/lms/modules/${id}`),
  getModuleDetail:  (id:string)=> api.get(`/lms/modules/${id}/detail`),

  // Cours
  getCours:         (id:string)=> api.get(`/lms/cours/${id}`),
  terminerCours:    (id:string, temps_passe: number) =>
    api.post(`/lms/cours/${id}/terminer`, { temps_passe }),

  // Progression
  getProgression:      () => api.get('/lms/progression'),
  getProfilApprenant:  () => api.get('/lms/profil'),

  // Stats (admin)
  getStats: () => api.get('/lms/stats'),
};

export default lmsService;