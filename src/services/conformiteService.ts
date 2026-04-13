import api from './api';

const conformiteService = {

  // Récupérer tous les indicateurs de conformité
  getIndicateurs: (orgId: string) =>
    api.get(`/reporting/indicateurs/${orgId}`),

  // Dashboard carbone
  getDashboard: (orgId: string) =>
    api.get(`/reporting/dashboard/${orgId}`),

  // Liste des rapports pour l'évolution
  getListe: (orgId: string) =>
    api.get(`/reporting/organisation/${orgId}`),

  // Bilan par scope
  getBilanScope: (orgId: string, annee?: number) =>
    api.get(`/calculs/bilan/${orgId}`, {
      params: annee ? { annee } : {}
    }),
};

export default conformiteService;