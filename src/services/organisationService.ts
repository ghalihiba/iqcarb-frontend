import api from './api';

const organisationService = {
  getAll:  () => api.get('/organisations'),
  getById: (id: string) => api.get(`/organisations/${id}`),
};

export default organisationService;