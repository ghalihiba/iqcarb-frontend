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
    <div className="iq-card p-5 transition-all hover:translate-y-[-1px]">

      {/* Header carte */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--iq-green-dim)', border: '1px solid var(--iq-green-mid)' }}>
            <Leaf className="w-5 h-5" style={{ color: 'var(--iq-forest)' }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--iq-text-1)' }}>
              {activite.nom_source ?? 'Source inconnue'}
            </p>
            <p className="text-xs" style={{ color: 'var(--iq-text-3)' }}>
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
        <div className="text-center p-2 rounded-lg iq-soft">
          <p className="text-xs mb-0.5" style={{ color: 'var(--iq-text-3)' }}>Quantité</p>
          <p className="text-sm font-bold" style={{ color: 'var(--iq-text-1)' }}>
            {parseFloat(activite.quantite).toFixed(0)}
          </p>
          <p className="text-xs" style={{ color: 'var(--iq-text-2)' }}>{activite.unite}</p>
        </div>

        <div className="text-center p-2 rounded-lg iq-soft">
          <p className="text-xs mb-0.5" style={{ color: 'var(--iq-text-3)' }}>CO2e</p>
          <p className="text-sm font-bold" style={{ color: 'var(--iq-green)' }}>
            {activite.valeur_co2e
              ? parseFloat(activite.valeur_co2e).toFixed(4)
              : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--iq-text-2)' }}>tCO2e</p>
        </div>

        <div className="text-center p-2 rounded-lg iq-soft">
          <p className="text-xs mb-0.5" style={{ color: 'var(--iq-text-3)' }}>Site</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--iq-text-1)' }}>
            {activite.site ?? '—'}
          </p>
        </div>
      </div>

      {/* Période */}
      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--iq-blue)' }} />
        <p className="text-xs font-medium" style={{ color: 'var(--iq-blue)' }}>
          {formatDate(activite.periode_debut)}
          {' → '}
          {formatDate(activite.periode_fin)}
        </p>
      </div>

      {/* Description */}
      {activite.description && (
        <p className="text-xs mb-4 truncate" style={{ color: 'var(--iq-text-3)' }}>
          {activite.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {activite.statut === 'BROUILLON' && (
          <>
            <button
              onClick={() => onValider(activite.id_activite)}
              className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
              style={{ background: 'var(--iq-forest)' }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Valider + Calculer CO2e
            </button>
            <button
              onClick={() => onSupprimer(activite.id_activite)}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.25)', color: 'var(--iq-red)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
        {activite.statut === 'VALIDE' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl"
               style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--iq-green)', border: '1px solid rgba(34,197,94,0.25)' }}>
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