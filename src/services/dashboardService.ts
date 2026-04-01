import api from './api';

const dashboardService = {
  getDashboard:   (id: string) => api.get(`/reporting/dashboard/${id}`),
  getIndicateurs: (id: string) => api.get(`/reporting/indicateurs/${id}`),
};

export default dashboardService;