import { X, Loader2, FileText, Building2, Calendar, BarChart3 } from 'lucide-react';
import type { Rapport }           from '@/types/rapport.types';
import {
  STATUT_CONFIG, formatCO2e,
  formatDate, formatPeriode
} from '@/engines/rapportEngine';
import ScopeBreakdown       from './ScopeBreakdown';
import ConformiteIndicator  from './ConformiteIndicator';
import ExportButton         from './ExportButton';

interface Props {
  rapport:       Rapport | null;
  loading:       boolean;
  onClose:       () => void;
  onStatut:      (id: string, statut: string) => void;
}

export default function RapportDetail({
  rapport, loading, onClose, onStatut
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-none sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-screen sm:max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-t-3xl border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {loading ? 'Chargement...' : `Rapport ${rapport?.periode?.annee ?? '—'}`}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {rapport?.standard_utilise ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rapport && <ExportButton rapport={rapport} />}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : rapport ? (
            <>
              {/* Statut workflow */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                  Workflow de validation
                </p>
                <div className="flex items-center gap-2">
                  {['BROUILLON', 'SOUMIS', 'VERIFIE', 'VALIDE'].map((s, i, arr) => {
                    const cfg         = STATUT_CONFIG[s as keyof typeof STATUT_CONFIG];
                    const currentStep = STATUT_CONFIG[rapport.statut]?.step ?? 0;
                    const isActive    = cfg.step === currentStep;
                    const isPast      = cfg.step < currentStep;

                    return (
                      <div key={s} className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            isActive
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : isPast
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400'
                          }`}>
                            {isPast ? '✓' : cfg.step}
                          </div>
                          <p className={`text-xs mt-1 font-medium ${
                            isActive
                              ? 'text-primary-600 dark:text-primary-400'
                              : isPast
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {cfg.label}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`h-0.5 flex-1 -mt-5 ${
                            isPast
                              ? 'bg-green-400'
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions statut */}
                {rapport.statut === 'BROUILLON' && (
                  <button
                    onClick={() => onStatut(rapport.id_rapport, 'SOUMIS')}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Soumettre pour vérification →
                  </button>
                )}
              </div>

              {/* Informations organisation */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Informations organisationnelles
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    // Remplace toutes ces lignes dans RapportDetail.tsx :
                    { label: 'Organisation',  value: rapport.organisation?.nom        ?? '—' },
                    { label: 'Secteur',       value: rapport.organisation?.secteur    ?? '—' },
                    { label: 'Pays',          value: rapport.organisation?.pays       ?? '—' },
                    { label: 'Employés',      value: rapport.organisation?.nb_employes?.toString() ?? '—' },
                    { label: 'Périmètre',     value: rapport.organisation?.perimetre  ?? 'Contrôle opérationnel' },
                    { label: 'Année réf.',    value: rapport.organisation?.annee_reference?.toString() ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                        {value ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Période et totaux */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Résumé exécutif
                  </p>
                </div>

                {/* Période */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Période : {formatPeriode(rapport.periode.debut, rapport.periode.fin)}
                </p>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 col-span-2 sm:col-span-1">
                    <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">Total CO2e</p>
                    <p className="text-2xl font-black text-primary-700 dark:text-primary-400">
                      {formatCO2e(rapport.inventaire.total_co2e)}
                    </p>
                    <p className="text-xs text-primary-500">tCO2e</p>
                  </div>
                  {rapport.indicateurs.co2e_par_employe && (
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">/ Employé</p>
                      <p className="text-xl font-black text-blue-700 dark:text-blue-400">
                        {formatCO2e(rapport.indicateurs.co2e_par_employe, 3)}
                      </p>
                      <p className="text-xs text-blue-500">tCO2e</p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 mb-1">Activités</p>
                    <p className="text-xl font-black text-gray-700 dark:text-gray-200">
                      {rapport.inventaire.nb_activites}
                    </p>
                    <p className="text-xs text-gray-400">validées</p>
                  </div>
                  {rapport.indicateurs.objectif_atteint !== undefined && (
                    <div className={`text-center p-3 rounded-xl border ${
                      rapport.indicateurs.objectif_atteint
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
                    }`}>
                      <p className="text-xs text-gray-500 mb-1">Objectif</p>
                      <p className={`text-xl font-black ${
                        rapport.indicateurs.objectif_atteint
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {rapport.indicateurs.objectif_atteint ? '✅' : '❌'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rapport.indicateurs.objectif_atteint ? 'Atteint' : 'Non atteint'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Répartition scopes */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Scope 1', pct: rapport.indicateurs.repartition_scopes.scope_1_pct, color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20'    },
                    { label: 'Scope 2', pct: rapport.indicateurs.repartition_scopes.scope_2_pct, color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20'  },
                    { label: 'Scope 3', pct: rapport.indicateurs.repartition_scopes.scope_3_pct, color: 'text-yellow-600 dark:text-yellow-400',bg: 'bg-yellow-50 dark:bg-yellow-900/20'},
                  ].map(({ label, pct, color, bg }) => (
                    <div key={label} className={`text-center p-2 ${bg} rounded-xl`}>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                      <p className={`text-lg font-black ${color}`}>{pct}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventaire par scope */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary-600" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Inventaire des émissions — GHG Protocol
                  </p>
                </div>
                <ScopeBreakdown scopes={rapport.inventaire.bilan_scopes} />
              </div>

              {/* Conformité */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                  Conformité réglementaire
                </p>
                <ConformiteIndicator conformite={rapport.conformite} />
              </div>

              {/* Méthodologie */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Méthodologie & Hypothèses
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Méthodologie
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {rapport.methodologie}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Hypothèses
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {rapport.hypotheses}
                    </p>
                  </div>
                </div>
              </div>

              {/* Généré le */}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 pb-4">
                Rapport généré le {formatDate(rapport.date_generation)} · {rapport.standard_utilise}
              </p>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p>Rapport introuvable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}