import { useState, useEffect } from 'react';
import Sidebar             from '@/components/common/Sidebar';
import Header              from '@/components/common/Header';
import SimulateurCO2       from '@/components/calculs/SimulateurCO2';
import ApiStatus           from '@/components/common/ApiStatus';
import api                 from '@/services/api';
import organisationService from '@/services/organisationService';
import type { Source }     from '@/types/activite.types';
import ComparateurScenarios from '@/components/calculs/ComparateurScenarios';
import {
  BarChart3, Loader2, Leaf,
  AlertCircle
} from 'lucide-react';

interface BilanScope {
  total:        number;
  nb_activites: number;
  pourcentage:  number;
  description:  string;
}

interface Bilan {
  total_co2e:   number;
  par_scope:    Record<string, BilanScope>;
  nb_activites: number;
  annee:        number;
}

// ── Helper sécurisé pour toFixed ──────────────────────────────
const safeFixed = (
  val: number | string | undefined | null,
  decimals = 4
): string => {
  const num = parseFloat(String(val ?? 0));
  return isNaN(num) ? '0.0000' : num.toFixed(decimals);
};

// Dans scopeConfig, ajouter les dark: classes
const scopeConfig: Record<string, {
  label: string; color: string;
  bg: string; bar: string; border: string;
}> = {
  SCOPE_1: {
    label:  'Scope 1',
    color:  'text-red-600 dark:text-red-400',
    bg:     'bg-red-50 dark:bg-red-900/20',
    bar:    'bg-red-400',
    border: 'border-red-100 dark:border-red-800'
  },
  SCOPE_2: {
    label:  'Scope 2',
    color:  'text-blue-600 dark:text-blue-400',
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    bar:    'bg-blue-400',
    border: 'border-blue-100 dark:border-blue-800'
  },
  SCOPE_3: {
    label:  'Scope 3',
    color:  'text-yellow-600 dark:text-yellow-400',
    bg:     'bg-yellow-50 dark:bg-yellow-900/20',
    bar:    'bg-yellow-400',
    border: 'border-yellow-100 dark:border-yellow-800'
  },
};

export default function Calculs() {
  const [sources,  setSources]  = useState<Source[]>([]);
  const [bilan,    setBilan]    = useState<Bilan | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Charger les sources d'émission
        const srcRes = await api.get('/facteurs/sources');
        setSources(srcRes.data.data ?? []);

        // Charger l'organisation et le bilan
        const orgRes = await organisationService.getAll();
        const orgs   = orgRes.data.data;

        if (orgs && orgs.length > 0) {
          const id = orgs[0].id_organisation;

          try {
            const bilanRes = await api.get(`/calculs/bilan/${id}?annee=2024`);
            const rawBilan = bilanRes.data.data;

            // Sécuriser toutes les valeurs numériques
            if (rawBilan) {
              setBilan({
                total_co2e:   parseFloat(rawBilan.total_co2e   ?? 0) || 0,
                nb_activites: parseInt(rawBilan.nb_activites    ?? 0) || 0,
                annee:        parseInt(rawBilan.annee           ?? 2024) || 2024,
                par_scope: {
                  SCOPE_1: {
                    total:        parseFloat(rawBilan.par_scope?.SCOPE_1?.total_co2e ?? 0) || 0,
                    nb_activites: rawBilan.par_scope?.SCOPE_1?.nb_activites ?? 0,
                    pourcentage:  parseFloat(rawBilan.par_scope?.SCOPE_1?.pourcentage ?? 0) || 0,
                    description:  rawBilan.par_scope?.SCOPE_1?.description ?? 'Émissions directes',
                  },
                  SCOPE_2: {
                    total:        parseFloat(rawBilan.par_scope?.SCOPE_2?.total_co2e ?? 0) || 0,
                    nb_activites: rawBilan.par_scope?.SCOPE_2?.nb_activites ?? 0,
                    pourcentage:  parseFloat(rawBilan.par_scope?.SCOPE_2?.pourcentage ?? 0) || 0,
                    description:  rawBilan.par_scope?.SCOPE_2?.description ?? 'Énergie indirecte',
                  },
                  SCOPE_3: {
                    total:        parseFloat(rawBilan.par_scope?.SCOPE_3?.total_co2e ?? 0) || 0,
                    nb_activites: rawBilan.par_scope?.SCOPE_3?.nb_activites ?? 0,
                    pourcentage:  parseFloat(rawBilan.par_scope?.SCOPE_3?.pourcentage ?? 0) || 0,
                    description:  rawBilan.par_scope?.SCOPE_3?.description ?? 'Chaîne de valeur',
                  },
                }
              });
            }
          } catch {
            // Bilan non disponible — pas d'erreur bloquante
            setBilan(null);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error
          ? err.message
          : 'Erreur de chargement';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="ml-64 flex-1 overflow-y-auto">
        <Header title="Calculs Carbone" subtitle="Simulateur CO2e et bilan par scope" />
        <div className="p-8 space-y-8">
          <div className="flex justify-end"><ApiStatus /></div>
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimulateurCO2 sources={sources} />
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Bilan par Scope</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Année {bilan?.annee ?? 2024} — GHG Protocol</p>
                  </div>
                </div>
                {bilan && bilan.nb_activites > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 mb-4">
                      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">Total émissions</p>
                      <p className="text-4xl font-bold text-primary-700 dark:text-primary-400">{safeFixed(bilan.total_co2e)}</p>
                      <p className="text-sm text-primary-500 dark:text-primary-400">tCO2e</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{bilan.nb_activites} activité(s) validée(s)</p>
                    </div>
                    {Object.entries(scopeConfig).map(([scope, config]) => {
                      const data = bilan.par_scope[scope];
                      if (!data) return null;
                      return (
                        <div key={scope} className={`p-4 ${config.bg} rounded-xl border ${config.border}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{data.description}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${config.color}`}>{safeFixed(data.total)}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">tCO2e</p>
                            </div>
                          </div>
                          <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                            <div className={`${config.bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${Math.min(data.pourcentage, 100)}%` }} />
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500">{data.nb_activites} activité(s)</p>
                            <p className={`text-xs font-bold ${config.color}`}>{safeFixed(data.pourcentage, 1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-green-500" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Conforme GHG Protocol · ISO 14064</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun bilan disponible</p>
                    <p className="text-xs mt-1 text-center max-w-48">Créez et validez des activités pour générer un bilan carbone</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!loading && <ComparateurScenarios sources={sources} />}
        </div>
      </main>
    </div>
  );
}