import ExportButton from './ExportButton';
import type { Rapport } from '@/types/rapport.types';
import { Eye, Send, Leaf, Download }           from 'lucide-react';
import type { RapportListItem }       from '@/types/rapport.types';
import {
  STATUT_CONFIG, formatCO2e, formatDate
} from '@/engines/rapportEngine';
import rapportService from '@/services/rapportService';

interface Props {
  rapport:     RapportListItem;
  onView:      (id: string) => void;
  onSoumettre: (id: string) => void;
}

export default function RapportCard({ rapport, onView, onSoumettre }: Props) {
  const cfg = STATUT_CONFIG[rapport.statut] ?? STATUT_CONFIG.BROUILLON;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all p-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">
              Rapport {rapport.annee}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(rapport.periode_debut)} → {formatDate(rapport.periode_fin)}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Totaux par scope */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'S1', value: rapport.total_scope1, color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20'    },
          { label: 'S2', value: rapport.total_scope2, color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20'  },
          { label: 'S3', value: rapport.total_scope3, color: 'text-yellow-600 dark:text-yellow-400',bg: 'bg-yellow-50 dark:bg-yellow-900/20'},
          { label: 'Total', value: rapport.total_co2e,color: 'text-green-700 dark:text-green-400',bg: 'bg-green-50 dark:bg-green-900/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} p-2 rounded-xl text-center`}>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${color}`}>
              {formatCO2e(value, 3)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">t</p>
          </div>
        ))}
      </div>

      {/* Standard */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
        <Leaf className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {rapport.standard_utilise}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(rapport.date_generation)}
        </p>
        <div className="flex gap-2">
          {rapport.statut === 'BROUILLON' && (
            <button
              onClick={() => onSoumettre(rapport.id_rapport)}
              className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" />
              Soumettre
            </button>
          )}
          <button
  onClick={async () => {
    try {
      await rapportService.exportPDF(
        rapport.id_rapport,
        rapport.organisation ?? 'Organisation',
        rapport.annee
      );
    } catch { /* handled */ }
  }}
  className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 hover:bg-green-100 text-green-700 dark:text-green-400 font-semibold px-3 py-1.5 rounded-lg transition-colors"
>
  <Download className="w-3 h-3" />
  PDF
</button>
          <button
            onClick={() => onView(rapport.id_rapport)}
            className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 text-primary-700 dark:text-primary-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" />
            Consulter
          </button>
        </div>
      </div>
    </div>
  );
}