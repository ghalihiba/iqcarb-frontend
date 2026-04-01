import { useState, useEffect, useCallback } from 'react';
import dashboardService from '@/services/dashboardService';
import organisationService from '@/services/organisationService';
import type { DashboardData } from '@/types/dashboard.types';

interface UseDashboardReturn {
  dashboard: DashboardData | null;
  orgId:     string | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orgId,     setOrgId]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState<boolean>(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgRes = await organisationService.getAll();
      const orgs   = orgRes.data.data;

      if (!orgs || orgs.length === 0) {
        setError('Aucune organisation trouvée.');
        return;
      }

      const org = orgs[0];
      setOrgId(org.id_organisation);

      const dashRes = await dashboardService.getDashboard(
        org.id_organisation
      );
      setDashboard(dashRes.data.data);

    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'Erreur de chargement des données';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { dashboard, orgId, loading, error, refetch: fetchData };
};