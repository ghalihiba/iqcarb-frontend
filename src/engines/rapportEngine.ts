import type {
  Rapport, StatutRapport,
  StandardRapport
} from '@/types/rapport.types';

// ── Formatage ────────────────────────────────────────────────

export const formatCO2e = (
  value: number | string | undefined,
  decimals = 4
): string => {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? '0.0000' : num.toFixed(decimals);
};

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

export const formatPeriode = (debut: string, fin: string): string =>
  `${formatDate(debut)} → ${formatDate(fin)}`;

// ── Configuration statuts ────────────────────────────────────

export const STATUT_CONFIG: Record<StatutRapport, {
  label:  string;
  color:  string;
  bg:     string;
  border: string;
  step:   number;
}> = {
  BROUILLON: {
    label:  'Brouillon',
    color:  'text-gray-600 dark:text-gray-400',
    bg:     'bg-gray-100 dark:bg-gray-700',
    border: 'border-gray-200 dark:border-gray-600',
    step:   1
  },
  SOUMIS: {
    label:  'Soumis',
    color:  'text-blue-700 dark:text-blue-400',
    bg:     'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    step:   2
  },
  VERIFIE: {
    label:  'Vérifié',
    color:  'text-purple-700 dark:text-purple-400',
    bg:     'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    step:   3
  },
  VALIDE: {
    label:  'Validé',
    color:  'text-green-700 dark:text-green-400',
    bg:     'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    step:   4
  },
  REJETE: {
    label:  'Rejeté',
    color:  'text-red-700 dark:text-red-400',
    bg:     'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    step:   0
  },
  CORRECTIONS_DEMANDEES: {
    label:  'Corrections requises',
    color:  'text-orange-700 dark:text-orange-400',
    bg:     'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    step:   1
  },
};

// ── Configuration scopes ─────────────────────────────────────

export const SCOPE_CONFIG = {
  SCOPE_1: {
    label:       'Scope 1',
    description: 'Émissions directes',
    color:       'text-red-600 dark:text-red-400',
    bg:          'bg-red-50 dark:bg-red-900/20',
    border:      'border-red-100 dark:border-red-800',
    bar:         'bg-red-400',
    badge:       'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    ghg:         'Sources détenues ou contrôlées par l\'organisation',
  },
  SCOPE_2: {
    label:       'Scope 2',
    description: 'Énergie indirecte',
    color:       'text-blue-600 dark:text-blue-400',
    bg:          'bg-blue-50 dark:bg-blue-900/20',
    border:      'border-blue-100 dark:border-blue-800',
    bar:         'bg-blue-400',
    badge:       'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    ghg:         'Énergie achetée et consommée par l\'organisation',
  },
  SCOPE_3: {
    label:       'Scope 3',
    description: 'Chaîne de valeur',
    color:       'text-yellow-600 dark:text-yellow-400',
    bg:          'bg-yellow-50 dark:bg-yellow-900/20',
    border:      'border-yellow-100 dark:border-yellow-800',
    bar:         'bg-yellow-400',
    badge:       'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
    ghg:         'Autres émissions indirectes de la chaîne de valeur',
  },
} as const;

// ── Standards disponibles ────────────────────────────────────

export const STANDARDS: {
  value: StandardRapport;
  label: string;
  desc:  string;
}[] = [
  {
    value: 'GHG Protocol Corporate Standard',
    label: 'GHG Protocol',
    desc:  'Référence mondiale — Scopes 1/2/3'
  },
  {
    value: 'ISO 14064-1:2018',
    label: 'ISO 14064',
    desc:  'Norme internationale de quantification'
  },
  {
    value: 'Bilan Carbone® ADEME',
    label: 'Bilan Carbone®',
    desc:  'Méthode ADEME française'
  },
];

// ── Calcul niveau conformité ─────────────────────────────────

export const getNiveauConformite = (pct: number): {
  label: string;
  color: string;
  bg:    string;
} => {
  if (pct === 100) return {
    label: 'Pleinement conforme',
    color: 'text-green-700 dark:text-green-400',
    bg:    'bg-green-50 dark:bg-green-900/20'
  };
  if (pct >= 70)  return {
    label: 'Partiellement conforme',
    color: 'text-orange-700 dark:text-orange-400',
    bg:    'bg-orange-50 dark:bg-orange-900/20'
  };
  return {
    label: 'Non conforme',
    color: 'text-red-700 dark:text-red-400',
    bg:    'bg-red-50 dark:bg-red-900/20'
  };
};

// ── Générer le contenu texte du rapport ──────────────────────

export const genererContenuRapport = (rapport: Rapport): string => {
  const org    = rapport.organisation;
  const inv    = rapport.inventaire;
  const kpis   = rapport.indicateurs;
  const conf   = rapport.conformite;
  const scopes = inv.bilan_scopes;

  return `
RAPPORT CLIMATIQUE — ${org.nom.toUpperCase()}
${'═'.repeat(60)}
Standard : ${rapport.standard_utilise}
Période  : ${formatPeriode(rapport.periode.debut, rapport.periode.fin)}
Généré le: ${formatDate(rapport.date_generation)}
Statut   : ${STATUT_CONFIG[rapport.statut].label}

1. INFORMATIONS ORGANISATIONNELLES
${'─'.repeat(40)}
Organisation : ${org.nom}
Secteur      : ${org.secteur ?? '—'}
Pays         : ${org.pays ?? '—'}
Employés     : ${org.nb_employes ?? '—'}
Périmètre    : ${org.perimetre ?? 'Contrôle opérationnel'}
Année réf.   : ${org.annee_reference ?? '—'}

2. RÉSUMÉ EXÉCUTIF
${'─'.repeat(40)}
Total émissions : ${formatCO2e(kpis.total_co2e_t)} tCO2e
                  (${formatCO2e(kpis.total_co2e_kg, 2)} kgCO2e)
${org.nb_employes ? `Par employé     : ${formatCO2e(kpis.co2e_par_employe)} tCO2e/employé` : ''}
${kpis.objectif_reduction_t ? `Objectif        : ${formatCO2e(kpis.objectif_reduction_t)} tCO2e
Écart objectif  : ${formatCO2e(kpis.ecart_objectif_t)} tCO2e
Atteint         : ${kpis.objectif_atteint ? 'OUI ✓' : 'NON ✗'}` : ''}

3. INVENTAIRE DES ÉMISSIONS (GHG Protocol)
${'─'.repeat(40)}
${['SCOPE_1', 'SCOPE_2', 'SCOPE_3'].map(s => {
  const scope = scopes[s];
  if (!scope) return '';
  const cfg = SCOPE_CONFIG[s as keyof typeof SCOPE_CONFIG];
  return `${cfg.label} — ${cfg.description}
  Total    : ${formatCO2e(scope.total)} tCO2e (${scope.pourcentage?.toFixed(1)}%)
  Activités: ${scope.nb_activites}
  Incert.  : ±${scope.incertitude_moyenne}%
  Sources  :
${scope.activites?.slice(0, 5).map((a: ActiviteRapport) =>
  `    • ${a.source}: ${a.quantite} ${a.unite} → ${formatCO2e(a.co2e_t)} tCO2e`
).join('\n') ?? '    Aucune activité'}`;
}).join('\n\n')}

4. POSTES MAJEURS D'ÉMISSION
${'─'.repeat(40)}
${inv.postes_majeurs?.slice(0, 5).map((p: PosteMajeur, i: number) =>
  `${i + 1}. ${p.source} (${p.scope?.replace('SCOPE_', 'S')}) : ${formatCO2e(p.total_co2e)} tCO2e — ${p.pourcentage?.toFixed(1)}%`
).join('\n') ?? 'Aucun poste identifié'}

5. MÉTHODOLOGIE
${'─'.repeat(40)}
${rapport.methodologie}

6. HYPOTHÈSES
${'─'.repeat(40)}
${rapport.hypotheses}

7. CONFORMITÉ RÉGLEMENTAIRE
${'─'.repeat(40)}
Score global      : ${conf.score_conformite} (${conf.pourcentage}%)
Niveau            : ${conf.niveau}
Conforme GHG      : ${conf.conforme_ghg ? 'OUI ✓' : 'NON ✗'}
Conforme ISO 14064: ${conf.conforme_iso14064 ? 'OUI ✓' : 'NON ✗'}

Détail des vérifications :
${Object.entries(conf.checks).map(([k, v]) =>
  `  ${v ? '✓' : '✗'} ${k.replace(/_/g, ' ')}`
).join('\n')}

8. RÉPARTITION PAR SCOPE
${'─'.repeat(40)}
Scope 1 : ${kpis.repartition_scopes.scope_1_pct}%
Scope 2 : ${kpis.repartition_scopes.scope_2_pct}%
Scope 3 : ${kpis.repartition_scopes.scope_3_pct}%

${'═'.repeat(60)}
Document généré par IQcarb — Plateforme de Pilotage Carbone
Conforme ${rapport.standard_utilise}
  `.trim();
};

// Type local pour l'utilisation dans genererContenuRapport
interface ActiviteRapport {
  source:    string;
  categorie: string;
  quantite:  number;
  unite:     string;
  co2e_t:    number;
  site:      string;
  periode:   string;
  facteur:   string;
  reference: string;
}

interface PosteMajeur {
  source:      string;
  categorie:   string;
  scope:       string;
  total_co2e:  number;
  pourcentage: number;
  nb_activites: number;
}