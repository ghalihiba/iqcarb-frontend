import { useState, useEffect, useCallback } from 'react';
import lmsService from '@/services/lmsService';
import type { Parcours, ProfilApprenant, StatsLMS } from '@/types/lms.types';

interface UseLMSReturn {
  parcours:    Parcours[];
  profil:      ProfilApprenant | null;
  stats:       StatsLMS | null;
  loading:     boolean;
  error:       string | null;
  success:     string | null;
  inscrire:    (id: string) => Promise<void>;
  refetch:     () => Promise<void>;
  clearMsg:    () => void;
}

export const useLMS = (): UseLMSReturn => {
  const [parcours,  setParcours]  = useState<Parcours[]>([]);
  const [profil,    setProfil]    = useState<ProfilApprenant | null>(null);
  const stats: StatsLMS | null = null;
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [parRes, profRes] = await Promise.allSettled([
        lmsService.getParcours(),
        lmsService.getProfilApprenant(),
      ]);

      if (parRes.status  === 'fulfilled')
        setParcours(parRes.value.data.data ?? []);
      if (profRes.status === 'fulfilled')
        setProfil(profRes.value.data.data ?? null);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const inscrire = useCallback(async (id: string) => {
    setError(null);
    try {
      await lmsService.inscrire(id);
      setSuccess('✅ Inscription réussie ! Vous pouvez commencer le parcours.');
      await fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Erreur d\'inscription');
    }
  }, [fetchData]);

  return {
    parcours, profil, stats,
    loading, error, success,
    inscrire,
    refetch:  fetchData,
    clearMsg: () => { setError(null); setSuccess(null); },
  };
};