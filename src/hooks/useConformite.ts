import { useState, useEffect, useCallback } from 'react';
import conformiteService   from '@/services/conformiteService';
import organisationService from '@/services/organisationService';
import type {
  ConformiteData, IndicateurCle,
  IndicateurScope, ConformiteStandard,
  EvolutionConformite, NiveauConformite
} from '@/types/conformite.types';

interface UseConformiteReturn {
  data:    ConformiteData | null;
  loading: boolean;
  error:   string | null;
  refetch: () => Promise<void>;
}

// ── Helpers ──────────────────────────────────────────────────
const getNiveau = (score: number): NiveauConformite =>
  score === 100 ? 'CONFORME'
  : score >= 70  ? 'PARTIELLEMENT_CONFORME'
  : 'NON_CONFORME';

const getStatutKPI = (
  valeur: number,
  seuilOk:  number,
  seuilAtt: number
) => valeur <= seuilOk  ? 'OK'
   : valeur <= seuilAtt ? 'ATTENTION'
   : 'CRITIQUE';

// ── Hook principal ────────────────────────────────────────────
export const useConformite = (): UseConformiteReturn => {
  const [data,    setData]    = useState<ConformiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer l'organisation
      const orgRes = await organisationService.getAll();
      const org    = orgRes.data.data?.[0];
      if (!org) throw new Error('Aucune organisation trouvée');

      const orgId = org.id_organisation;

      // Charger dashboard + rapports en parallèle
      const [dashRes, listRes, bilanRes] = await Promise.allSettled([
        conformiteService.getDashboard(orgId),
        conformiteService.getListe(orgId),
        conformiteService.getBilanScope(orgId, 2024),
      ]);

      const dash  = dashRes.status  === 'fulfilled'
        ? dashRes.value.data.data   : null;
      const liste = listRes.status  === 'fulfilled'
        ? listRes.value.data.data   : [];
      const bilan = bilanRes.status === 'fulfilled'
        ? bilanRes.value.data.data  : null;

      const totalCO2e     = dash?.kpis?.co2e_derniere_annee ?? 0;
      const nbActivites   = dash?.statut_mrv?.monitoring?.activites_validees ?? 0;
      const nbRapports    = dash?.kpis?.nb_rapports ?? 0;
      const objectif      = org.objectif_reduction_co2
        ? parseFloat(org.objectif_reduction_co2) : null;
      const nbEmployes    = org.nb_employes ?? 0;
      const intensite     = nbEmployes > 0
        ? totalCO2e / nbEmployes : undefined;

      // ── Indicateurs clés ─────────────────────────────────
      const indicateursCles: IndicateurCle[] = [
        {
          id:          'total_co2e',
          label:       'Émissions totales',
          valeur:      totalCO2e,
          unite:       'tCO2e',
          statut:      objectif
            ? getStatutKPI(totalCO2e, objectif, objectif * 1.2)
            : 'INFO',
          description: `Total Scope 1+2+3 — Année ${dash?.kpis?.derniere_annee ?? 2024}`,
          seuil_ok:    objectif ?? undefined,
          tendance:    'stable',
        },
        {
          id:          'activites_validees',
          label:       'Activités validées',
          valeur:      nbActivites,
          statut:      nbActivites >= 3 ? 'OK'
                     : nbActivites >= 1 ? 'ATTENTION'
                     : 'CRITIQUE',
          description: 'Données collectées et validées (MRV)',
          seuil_ok:    3,
          seuil_att:   1,
        },
        {
          id:          'rapports_generes',
          label:       'Rapports générés',
          valeur:      nbRapports,
          statut:      nbRapports >= 1 ? 'OK' : 'ATTENTION',
          description: 'Rapports carbone conformes GHG Protocol',
        },
        ...(intensite !== undefined ? [{
          id:          'intensite_employe',
          label:       'Intensité / employé',
          valeur:      parseFloat(intensite.toFixed(4)),
          unite:       'tCO2e/emp.',
          statut:      'INFO' as const,
          description: `Émissions par employé (${nbEmployes} employés)`,
        }] : []),
        ...(objectif ? [{
          id:          'objectif_reduction',
          label:       'Objectif réduction',
          valeur:      objectif,
          unite:       'tCO2e',
          statut:      totalCO2e <= objectif ? 'OK' as const : 'CRITIQUE' as const,
          description: totalCO2e <= objectif
            ? `✅ Objectif atteint — écart : ${(objectif - totalCO2e).toFixed(3)} t`
            : `⚠️ Dépassement de ${(totalCO2e - objectif).toFixed(3)} tCO2e`,
          seuil_ok:    objectif,
        }] : []),
      ];

      // ── Indicateurs par scope ─────────────────────────────
      const mrv    = dash?.statut_mrv;
      const scopes: IndicateurScope[] = [
        {
          scope:        'SCOPE_1',
          label:        'Scope 1',
          description:  'Émissions directes',
          total_co2e:   bilan?.par_scope?.SCOPE_1?.total_co2e ?? 0,
          pourcentage:  bilan?.par_scope?.SCOPE_1?.pourcentage ?? 0,
          nb_activites: bilan?.par_scope?.SCOPE_1?.nb_activites ?? 0,
          incertitude:  5,
          tendance:     null,
          variation_pct: null,
        },
        {
          scope:        'SCOPE_2',
          label:        'Scope 2',
          description:  'Énergie indirecte',
          total_co2e:   bilan?.par_scope?.SCOPE_2?.total_co2e ?? 0,
          pourcentage:  bilan?.par_scope?.SCOPE_2?.pourcentage ?? 0,
          nb_activites: bilan?.par_scope?.SCOPE_2?.nb_activites ?? 0,
          incertitude:  10,
          tendance:     null,
          variation_pct: null,
        },
        {
          scope:        'SCOPE_3',
          label:        'Scope 3',
          description:  'Chaîne de valeur',
          total_co2e:   bilan?.par_scope?.SCOPE_3?.total_co2e ?? 0,
          pourcentage:  bilan?.par_scope?.SCOPE_3?.pourcentage ?? 0,
          nb_activites: bilan?.par_scope?.SCOPE_3?.nb_activites ?? 0,
          incertitude:  30,
          tendance:     null,
          variation_pct: null,
        },
      ];

      // ── Standards ─────────────────────────────────────────
      const s1Ok = scopes[0].nb_activites > 0;
      const s2Ok = scopes[1].nb_activites > 0;
      const s3Ok = scopes[2].nb_activites > 0;
      const dataOk = nbActivites > 0;

      const standards: ConformiteStandard[] = [
        {
          nom:         'GHG Protocol Corporate Standard',
          code:        'GHG',
          conforme:    s1Ok && s2Ok && dataOk,
          score:       [s1Ok, s2Ok, s3Ok, dataOk, nbRapports > 0].filter(Boolean).length,
          total:       5,
          pourcentage: Math.round(
            [s1Ok, s2Ok, s3Ok, dataOk, nbRapports > 0]
              .filter(Boolean).length / 5 * 100
          ),
          checks: [
            { id: 'ghg_s1', label: 'Scope 1 déclaré',   description: 'Émissions directes documentées', statut: s1Ok,  obligatoire: true,  standard: 'GHG' },
            { id: 'ghg_s2', label: 'Scope 2 déclaré',   description: 'Énergie indirecte documentée',   statut: s2Ok,  obligatoire: true,  standard: 'GHG' },
            { id: 'ghg_s3', label: 'Scope 3 déclaré',   description: 'Chaîne de valeur documentée',    statut: s3Ok,  obligatoire: false, standard: 'GHG' },
            { id: 'ghg_dt', label: 'Données validées',  description: 'Activités validées en base',     statut: dataOk,obligatoire: true,  standard: 'GHG' },
            { id: 'ghg_rp', label: 'Rapport généré',    description: 'Au moins un rapport disponible', statut: nbRapports > 0, obligatoire: true, standard: 'GHG' },
          ],
        },
        {
          nom:         'ISO 14064-1:2018',
          code:        'ISO',
          conforme:    dataOk && nbRapports > 0,
          score:       [dataOk, nbRapports > 0, s1Ok, s2Ok].filter(Boolean).length,
          total:       4,
          pourcentage: Math.round(
            [dataOk, nbRapports > 0, s1Ok, s2Ok]
              .filter(Boolean).length / 4 * 100
          ),
          checks: [
            { id: 'iso_tr', label: 'Traçabilité MRV',      description: 'Monitoring → Reporting → Verification', statut: dataOk,       obligatoire: true,  standard: 'ISO' },
            { id: 'iso_rp', label: 'Rapport documenté',    description: 'Rapport carbone formalisé',             statut: nbRapports > 0,obligatoire: true,  standard: 'ISO' },
            { id: 'iso_s1', label: 'Sources Scope 1',      description: 'Sources d\'émission directes',          statut: s1Ok,         obligatoire: true,  standard: 'ISO' },
            { id: 'iso_s2', label: 'Sources Scope 2',      description: 'Sources d\'énergie indirecte',          statut: s2Ok,         obligatoire: true,  standard: 'ISO' },
          ],
        },
        {
          nom:         'Principe MRV',
          code:        'MRV',
          conforme:    mrv?.monitoring?.statut === 'ACTIF' && mrv?.reporting?.statut === 'ACTIF',
          score:       [
            mrv?.monitoring?.statut === 'ACTIF',
            mrv?.reporting?.statut  === 'ACTIF',
            mrv?.verification?.statut === 'VALIDE',
          ].filter(Boolean).length,
          total:       3,
          pourcentage: Math.round(
            [
              mrv?.monitoring?.statut === 'ACTIF',
              mrv?.reporting?.statut  === 'ACTIF',
              mrv?.verification?.statut === 'VALIDE',
            ].filter(Boolean).length / 3 * 100
          ),
          checks: [
            { id: 'mrv_m', label: 'Monitoring actif',    description: `${mrv?.monitoring?.activites_validees ?? 0} activités validées`, statut: mrv?.monitoring?.statut === 'ACTIF',    obligatoire: true, standard: 'MRV' },
            { id: 'mrv_r', label: 'Reporting actif',     description: `${mrv?.reporting?.total_rapports ?? 0} rapports générés`,         statut: mrv?.reporting?.statut  === 'ACTIF',    obligatoire: true, standard: 'MRV' },
            { id: 'mrv_v', label: 'Vérification faite',  description: 'Rapport validé par auditeur',                                      statut: mrv?.verification?.statut === 'VALIDE', obligatoire: false,standard: 'MRV' },
          ],
        },
      ];

      // ── Évolution ─────────────────────────────────────────
      const evolution: EvolutionConformite[] = (liste ?? [])
        .slice()
        .sort((a: { annee: number }, b: { annee: number }) =>
          a.annee - b.annee)
        .map((r: {
          annee: number; total_co2e: string;
        }) => {
          const s = standards.reduce(
            (acc, std) => acc + std.pourcentage, 0
          ) / standards.length;
          return {
            annee:       r.annee,
            score:       Math.round(s),
            niveau:      getNiveau(Math.round(s)),
            total_co2e:  parseFloat(r.total_co2e ?? '0'),
            nb_rapports: nbRapports,
          };
        });

      // ── Score global ──────────────────────────────────────
      const scoreGlobal = Math.round(
        standards.reduce((acc, s) => acc + s.pourcentage, 0)
        / standards.length
      );

      setData({
        score_global:      scoreGlobal,
        niveau:            getNiveau(scoreGlobal),
        date_evaluation:   new Date().toISOString(),
        indicateurs_cles:  indicateursCles,
        scopes,
        total_co2e:        totalCO2e,
        total_co2e_kg:     totalCO2e * 1000,
        nb_activites:      nbActivites,
        intensite_employe: intensite,
        standards,
        evolution,
        organisation: {
          nom:             org.nom,
          secteur:         org.secteur_activite ?? '—',
          objectif:        objectif,
          annee_reference: org.annee_reference ?? null,
        },
      });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};