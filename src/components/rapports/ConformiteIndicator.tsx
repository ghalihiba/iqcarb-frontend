import {
  CheckCircle, XCircle, Shield,
  Award
} from 'lucide-react';
import type { Conformite }         from '@/types/rapport.types';
import { getNiveauConformite }     from '@/engines/rapportEngine';

interface Props {
  conformite: Conformite;
}

const CHECK_LABELS: Record<string, string> = {
  scope1_declare:       'Scope 1 déclaré',
  scope2_declare:       'Scope 2 déclaré',
  scope3_declare:       'Scope 3 déclaré',
  facteurs_officiels:   'Facteurs d\'émission officiels',
  tracabilite_complete: 'Traçabilité MRV complète',
  donnees_validees:     'Données validées',
};

export default function ConformiteIndicator({ conformite }: Props) {
  const niveau = getNiveauConformite(conformite.pourcentage);

  return (
    <div className="space-y-4">

      {/* Score global */}
      <div className={`p-5 rounded-2xl border ${niveau.bg} ${
        conformite.pourcentage === 100
          ? 'border-green-200 dark:border-green-800'
          : conformite.pourcentage >= 70
          ? 'border-orange-200 dark:border-orange-800'
          : 'border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${niveau.color}`} />
            <p className={`text-sm font-bold ${niveau.color}`}>
              {niveau.label}
            </p>
          </div>
          <p className={`text-3xl font-black ${niveau.color}`}>
            {conformite.pourcentage}%
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Score : {conformite.score_conformite} vérifications passées
        </p>

        {/* Barre score */}
        <div className="w-full bg-white dark:bg-gray-700 rounded-full h-2.5 mt-3">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${
              conformite.pourcentage === 100
                ? 'bg-green-500'
                : conformite.pourcentage >= 70
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${conformite.pourcentage}%` }}
          />
        </div>
      </div>

      {/* Standards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'GHG Protocol', ok: conformite.conforme_ghg },
          { label: 'ISO 14064',    ok: conformite.conforme_iso14064 },
        ].map(({ label, ok }) => (
          <div
            key={label}
            className={`flex items-center gap-2 p-3 rounded-xl border ${
              ok
                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
            }`}
          >
            <Shield className={`w-4 h-4 ${
              ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`} />
            <div>
              <p className={`text-xs font-bold ${
                ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {label}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {ok ? 'Conforme' : 'Non conforme'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist détaillée */}
      <div className="space-y-2">
        {Object.entries(conformite.checks).map(([key, val]) => (
          <div
            key={key}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              val
                ? 'bg-gray-50 dark:bg-gray-700/50'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            {val
              ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              : <XCircle     className="w-4 h-4 text-red-500 flex-shrink-0"   />
            }
            <p className={`text-sm ${
              val
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-red-700 dark:text-red-400'
            }`}>
              {CHECK_LABELS[key] ?? key}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}