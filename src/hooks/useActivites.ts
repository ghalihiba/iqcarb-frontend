

import api from '@/services/api';
import {
  useState, useEffect,
  useCallback
} from 'react';
import activiteService from '@/services/activiteService';
import organisationService from '@/services/organisationService';
import type {
  Activite, ActiviteFormData,
  ActiviteFilters, Source
} from '@/types/activite.types';

interface UseActivitesReturn {
  activites:     Activite[];
  sources:       Source[];
  orgId:         string | null;
  loading:       boolean;
  loadingSources: boolean;
  submitting:    boolean;
  error:         string | null;
  success:       string | null;
  total:         number;
  filters:       ActiviteFilters;
  setFilters:    (f: ActiviteFilters) => void;
  creerActivite: (
  data: ActiviteFormData,
  options?: {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
) => Promise<boolean>;
  validerActivite: (id: string) => Promise<void>;
  supprimerActivite: (id: string) => Promise<void>;
  refetch:       () => Promise<void>;
  clearMessages: () => void;
}

export const useActivites = (): UseActivitesReturn => {
  const [activites,      setActivites]      = useState<Activite[]>([]);
  const [sources,        setSources]        = useState<Source[]>([]);
  const [orgId,          setOrgId]          = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [success,        setSuccess]        = useState<string | null>(null);
  const [total,          setTotal]          = useState(0);
  const [filters,        setFilters]        = useState<ActiviteFilters>({
    page: 1, limite: 10
  });

  // Charger l'organisation de l'utilisateur
  const fetchOrg = useCallback(async () => {
    try {
      const res  = await organisationService.getAll();
      const orgs = res.data.data;
      if (orgs && orgs.length > 0) {
        setOrgId(orgs[0].id_organisation);
      }
    } catch {
      setError('Impossible de charger l\'organisation');
    }
  }, []);

  // Charger les sources d'émission
  // en haut du fichier


const fetchSources = useCallback(async () => {
  setLoadingSources(true);
  try {
    const res = await api.get('/facteurs/sources');
    setSources(res.data.data || []);
  } catch {
    setError('Impossible de charger les sources d\'émission');
  } finally {
    setLoadingSources(false);
  }
}, []);

  // Charger les activités
  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activiteService.getAll(filters);
      setActivites(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setError('Impossible de charger les activités');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrg();
    fetchSources();
  }, [fetchOrg, fetchSources]);

  useEffect(() => {
    fetchActivites();
  }, [fetchActivites]);

  // Créer une activité
  const creerActivite = useCallback(async (
  data: ActiviteFormData,
  options?: {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
  }
): Promise<boolean> => {
  setSubmitting(true);
  setError(null);
  setSuccess(null);

  try {
    await activiteService.create(data);

    const message = '✅ Activité créée avec succès !';

    setSuccess(message);

    // 🔥 NOUVEAU : callback toast
    options?.onSuccess?.(message);

    await fetchActivites();
    return true;

  } catch (err: unknown) {
    const msg = err instanceof Error
      ? err.message
      : 'Erreur lors de la création';

    setError(msg);

    // 🔥 NOUVEAU : callback toast
    options?.onError?.(msg);

    return false;

  } finally {
    setSubmitting(false);
  }
}, [fetchActivites]);

  // Valider une activité → calcul CO2e automatique
  const validerActivite = useCallback(async (id: string) => {
    setError(null);
    try {
      await activiteService.valider(id);
      setSuccess('✅ Activité validée ! CO2e calculé automatiquement.');
      await fetchActivites();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de validation';
      setError(msg);
    }
  }, [fetchActivites]);

  // Supprimer une activité
  const supprimerActivite = useCallback(async (id: string) => {
    setError(null);
    try {
      await activiteService.supprimer(id);
      setSuccess('✅ Activité supprimée.');
      await fetchActivites();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression';
      setError(msg);
    }
  }, [fetchActivites]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    activites, sources, orgId,
    loading, loadingSources, submitting,
    error, success, total,
    filters, setFilters,
    creerActivite, validerActivite, supprimerActivite,
    refetch: fetchActivites,
    clearMessages
  };
};