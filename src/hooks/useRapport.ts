import {
  useState, useEffect,
  useCallback
} from 'react';
import rapportService      from '@/services/rapportService';
import organisationService from '@/services/organisationService';
import type {
  Rapport, RapportListItem,
  GenerateRapportDTO, StatutRapport
} from '@/types/rapport.types';

interface UseRapportReturn {
  rapports:        RapportListItem[];
  rapportDetail:   Rapport | null;
  orgId:           string | null;
  orgNom:          string;
  loading:         boolean;
  loadingDetail:   boolean;
  generating:      boolean;
  error:           string | null;
  success:         string | null;
  selectedId:      string | null;
  generer:         (data: Omit<GenerateRapportDTO, 'id_organisation'>) => Promise<boolean>;
  chargerDetail:   (id: string) => Promise<void>;
  changerStatut:   (id: string, statut: StatutRapport, comment?: string) => Promise<void>;
  fermerDetail:    () => void;
  refetch:         () => Promise<void>;
  clearMessages:   () => void;
}

export const useRapport = (): UseRapportReturn => {
  const [rapports,      setRapports]      = useState<RapportListItem[]>([]);
  const [rapportDetail, setRapportDetail] = useState<Rapport | null>(null);
  const [orgId,         setOrgId]         = useState<string | null>(null);
  const [orgNom,        setOrgNom]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  // Charger l'organisation et les rapports
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgRes = await organisationService.getAll();
      const org    = orgRes.data.data?.[0];
      if (!org) { setError('Aucune organisation trouvée.'); return; }

      setOrgId(org.id_organisation);
      setOrgNom(org.nom);

      const rapRes = await rapportService.getListe(org.id_organisation);
      setRapports(rapRes.data.data ?? []);
    } catch {
      setError('Impossible de charger les rapports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Générer un rapport
  const generer = useCallback(async (
    data: Omit<GenerateRapportDTO, 'id_organisation'>
  ): Promise<boolean> => {
    if (!orgId) return false;
    setGenerating(true);
    setError(null);
    try {
      await rapportService.generer({ ...data, id_organisation: orgId });
      setSuccess('✅ Rapport généré avec succès !');
      await fetchData();
      setTimeout(() => setSuccess(null), 4000);
      return true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Erreur lors de la génération.');
      return false;
    } finally {
      setGenerating(false);
    }
  }, [orgId, fetchData]);

  // Charger le détail d'un rapport
 const chargerDetail = useCallback(async (id: string) => {
  setLoadingDetail(true);
  setSelectedId(id);
  try {
    const res  = await rapportService.getDetail(id);
    const data = res.data.data;

    if (data) {
      // Sécuriser organisation
      if (!data.organisation || typeof data.organisation === 'string') {
        data.organisation = {
          id:                 '',
          nom:                typeof data.organisation === 'string' ? data.organisation : '—',
          secteur:            data.secteur_activite ?? '—',
          pays:               '—',
          nb_employes:        null,
          objectif_reduction: null,
          annee_reference:    null,
          perimetre:          null,
        };
      }

      // Sécuriser periode
      if (!data.periode) {
        data.periode = {
          debut: data.periode_debut ?? '—',
          fin:   data.periode_fin   ?? '—',
          annee: data.annee         ?? 2024,
        };
      }

      // Sécuriser inventaire
      if (!data.inventaire) {
        data.inventaire = {
          bilan_scopes:   {},
          total_co2e:     parseFloat(data.total_co2e ?? 0),
          unite:          'tCO2e',
          nb_activites:   0,
          postes_majeurs: [],
        };
      }

      // Sécuriser indicateurs
      if (!data.indicateurs) {
        data.indicateurs = {
          total_co2e_t:  parseFloat(data.total_co2e ?? 0),
          total_co2e_kg: parseFloat(data.total_co2e ?? 0) * 1000,
          repartition_scopes: {
            scope_1_pct: 0,
            scope_2_pct: 0,
            scope_3_pct: 0,
          }
        };
      }

      // Sécuriser conformite
      if (!data.conformite) {
        data.conformite = {
          checks: {
            scope1_declare:       false,
            scope2_declare:       false,
            scope3_declare:       false,
            facteurs_officiels:   false,
            tracabilite_complete: false,
            donnees_validees:     false,
          },
          score_conformite: '0/6',
          pourcentage:      0,
          niveau:           'NON_CONFORME',
          conforme_ghg:     false,
          conforme_iso14064: false,
        };
      }

      // Sécuriser methodologie et hypotheses
      if (!data.methodologie) data.methodologie = '—';
      if (!data.hypotheses)   data.hypotheses   = '—';
    }

    setRapportDetail(data);
  } catch {
    setError('Impossible de charger le détail du rapport.');
  } finally {
    setLoadingDetail(false);
  }
}, []);

  // Changer le statut
  const changerStatut = useCallback(async (
    id:       string,
    statut:   StatutRapport,
    comment?: string
  ) => {
    setError(null);
    try {
      await rapportService.changerStatut(id, statut, comment);
      setSuccess(`✅ Statut mis à jour : ${statut}`);
      await fetchData();
      if (selectedId === id) await chargerDetail(id);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Erreur lors du changement de statut.');
    }
  }, [fetchData, chargerDetail, selectedId]);

  const fermerDetail  = useCallback(() => {
    setRapportDetail(null);
    setSelectedId(null);
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    rapports, rapportDetail, orgId, orgNom,
    loading, loadingDetail, generating,
    error, success, selectedId,
    generer, chargerDetail, changerStatut,
    fermerDetail, refetch: fetchData,
    clearMessages
  };
};