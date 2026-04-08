import ActiviteCard from './ActiviteCard';
import type { Activite, ActiviteFilters } from '@/types/activite.types';
import { Loader2, Inbox, Filter } from 'lucide-react';

interface Props {
  activites:   Activite[];
  loading:     boolean;
  total:       number;
  filters:     ActiviteFilters;
  onFilter:    (f: ActiviteFilters) => void;
  onValider:   (id: string) => void;
  onSupprimer: (id: string) => void;
}

const SCOPE_OPTIONS = [
  { value: '',        label: 'Tous les scopes' },
  { value: 'SCOPE_1', label: 'Scope 1 — Directes' },
  { value: 'SCOPE_2', label: 'Scope 2 — Énergie' },
  { value: 'SCOPE_3', label: 'Scope 3 — Chaîne de valeur' },
];

const STATUT_OPTIONS = [
  { value: '',          label: 'Tous les statuts' },
  { value: 'BROUILLON', label: 'Brouillon' },
  { value: 'VALIDE',    label: 'Validé' },
  { value: 'REJETE',    label: 'Rejeté' },
];

export default function ActiviteList({
  activites, loading, total,
  filters, onFilter,
  onValider, onSupprimer
}: Props) {

  return (
    <div>
      {/* Filtres */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mr-2">Filtrer :</p>

        <select
          value={filters.scope ?? ''}
          onChange={e => onFilter({ ...filters, scope: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {SCOPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.statut ?? ''}
          onChange={e => onFilter({ ...filters, statut: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          {STATUT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 font-medium">
          {total} activité(s)
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Liste vide */}
      {!loading && activites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-400 dark:text-gray-500">
            Aucune activité trouvée
          </p>
          <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
            Créez votre première activité carbone
          </p>
        </div>
      )}

      {/* Grille */}
      {!loading && activites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activites.map(activite => (
            <ActiviteCard
              key={activite.id_activite}
              activite={activite}
              onValider={onValider}
              onSupprimer={onSupprimer}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > (filters.limite ?? 10) && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onFilter({
              ...filters,
              page: Math.max(1, (filters.page ?? 1) - 1)
            })}
            disabled={(filters.page ?? 1) <= 1}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          >
            ← Précédent
          </button>

          <span className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            Page {filters.page ?? 1}
          </span>

          <button
            onClick={() => onFilter({
              ...filters,
              page: (filters.page ?? 1) + 1
            })}
            disabled={
              ((filters.page ?? 1) * (filters.limite ?? 10)) >= total
            }
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}