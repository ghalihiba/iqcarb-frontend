import api from './api';
import type { StatutRapport } from '@/types/rapport.types';

const rapportService = {

  generer: (data: object) =>
    api.post('/reporting/generer', data),

  getListe: (orgId: string) =>
    api.get(`/reporting/organisation/${orgId}`),

  getDetail: (id: string) =>
    api.get(`/reporting/${id}`),

  changerStatut: (
    id:           string,
    statut:       StatutRapport,
    commentaire?: string
  ) => api.patch(`/reporting/${id}/statut`, { statut, commentaire }),

  getIndicateurs: (orgId: string, annee?: number) =>
    api.get(`/reporting/indicateurs/${orgId}`, {
      params: annee ? { annee } : {}
    }),

  getDashboard: (orgId: string) =>
    api.get(`/reporting/dashboard/${orgId}`),

  // ── Export PDF ─────────────────────────────────────────────
  exportPDF: async (
    id:     string,
    nomOrg: string,
    annee:  number
  ): Promise<void> => {
    const response = await api.get(
      `/reporting/${id}/export-pdf`,
      { responseType: 'blob' }          // ← CRITIQUE : blob pas json
    );

    // Vérifier que c'est bien un PDF
    const contentType = response.headers['content-type'] ?? '';
    const isPDF       = contentType.includes('application/pdf');

    const extension = isPDF ? 'pdf' : 'txt';
    const mimeType  = isPDF ? 'application/pdf' : 'text/plain';

    const blob     = new Blob([response.data], { type: mimeType });
    const url      = window.URL.createObjectURL(blob);
    const link     = document.createElement('a');
    const fileName = `IQcarb_Rapport_${nomOrg.replace(/\s+/g, '_')}_${annee}.${extension}`;

    link.href      = url;
    link.download  = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
};

export default rapportService;