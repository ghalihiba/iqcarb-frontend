import { CheckCircle, Trash2, Clock, Leaf } from 'lucide-react';
import type { Activite } from '@/types/activite.types';
import { STATUTS } from '@/types/activite.types';
import { getScopeBadgeClass } from '@/utils/formatters';

interface Props {
  activite:  Activite;
  onValider: (id: string) => void;
  onSupprimer: (id: string) => void;
}

export default function ActiviteCard({
  activite, onValider, onSupprimer
}: Props) {
  const statut = STATUTS[activite.statut as keyof typeof STATUTS]
    ?? { label: activite.statut, color: 'bg-gray-100 text-gray-600' };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5">

      {/* Header carte */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {activite.nom_source ?? 'Source inconnue'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {activite.categorie ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getScopeBadgeClass(activite.scope)}`}>
            {activite.scope?.replace('SCOPE_', 'S')}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statut.color}`}>
            {statut.label}
          </span>
        </div>
      </div>

      {/* Données */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Quantité</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {parseFloat(activite.quantite).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">{activite.unite}</p>
        </div>

        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">CO2e</p>
          <p className="text-sm font-bold text-green-700">
            {activite.valeur_co2e
              ? parseFloat(activite.valeur_co2e).toFixed(4)
              : '—'}
          </p>
          <p className="text-xs text-gray-500">tCO2e</p>
        </div>

        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Site</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
            {activite.site ?? '—'}
          </p>
        </div>
      </div>

      {/* Période */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-none">
        <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {formatDate(activite.periode_debut)}
          {' → '}
          {formatDate(activite.periode_fin)}
        </p>
      </div>

      {/* Description */}
      {activite.description && (
        <p className="text-xs text-gray-400 mb-4 truncate">
          {activite.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {activite.statut === 'BROUILLON' && (
          <>
            <button
              onClick={() => onValider(activite.id_activite)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Valider + Calculer CO2e
            </button>
            <button
              onClick={() => onSupprimer(activite.id_activite)}
              className="w-10 h-10 flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        {activite.statut === 'VALIDE' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold py-2.5 rounded-xl border border-green-100">
            <CheckCircle className="w-3.5 h-3.5" />
            Validée — {activite.valeur_co2e
              ? `${parseFloat(activite.valeur_co2e).toFixed(4)} tCO2e`
              : 'CO2e calculé'}
          </div>
        )}
      </div>
    </div>
  );
}