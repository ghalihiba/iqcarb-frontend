import { CheckCircle, Clock, Lock } from 'lucide-react';
import type { StatutMRV } from '@/types/dashboard.types';

interface MRVStatusProps {
  mrv: StatutMRV | undefined;
}

const StatusIcon = ({ statut }: { statut: string }) => {
  if (statut === 'ACTIF' || statut === 'VALIDE')
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (statut === 'EN_ATTENTE')
    return <Clock className="w-5 h-5 text-orange-400" />;
  return <Lock className="w-5 h-5 text-gray-400" />;
};

export default function MRVStatus({ mrv }: MRVStatusProps) {
  if (!mrv) return null;

  const phases = [
    {
      label:  'Monitoring',
      statut: mrv.monitoring?.statut ?? 'EN_ATTENTE',
      detail: `${mrv.monitoring?.activites_validees ?? 0} activités validées`
    },
    {
      label:  'Reporting',
      statut: mrv.reporting?.statut ?? 'EN_ATTENTE',
      detail: `${mrv.reporting?.total_rapports ?? 0} rapports générés`
    },
    {
      label:  'Vérification',
      statut: mrv.verification?.statut ?? 'EN_ATTENTE',
      detail: mrv.verification?.statut === 'VALIDE'
              ? 'Rapport validé' : 'En attente de validation'
    },
  ];

  return (
    <div className="space-y-3">
      {phases.map(({ label, statut, detail }) => (
        <div
          key={label}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <StatusIcon statut={statut} />
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{detail}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            statut === 'ACTIF' || statut === 'VALIDE'
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {statut}
          </span>
        </div>
      ))}
    </div>
  );
}