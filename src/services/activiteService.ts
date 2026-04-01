import api from './api';
import type { ActiviteFormData, ActiviteFilters } from '@/types/activite.types';

const activiteService = {

  // Récupérer toutes les activités avec filtres optionnels
  getAll: (filters?: ActiviteFilters) =>
    api.get('/activites', { params: filters }),

  // Récupérer le détail d'une activité
  getById: (id: string) =>
    api.get(`/activites/${id}`),

  // Créer une nouvelle activité
  create: (data: ActiviteFormData) =>
    api.post('/activites', data),

  // Valider une activité → déclenche calcul CO2e automatique
  valider: (id: string) =>
    api.patch(`/activites/${id}/valider`),

  // Supprimer une activité (seulement BROUILLON)
  supprimer: (id: string) =>
    api.delete(`/activites/${id}`),

};

export default activiteService;