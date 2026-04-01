import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import type { EvolutionAnnuelle } from '@/types/dashboard.types';

interface EvolutionChartProps {
  data: EvolutionAnnuelle[];
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p className="text-sm">Aucune donnée annuelle</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="annee" tick={{ fontSize: 12, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} unit="t" />
        <Tooltip
          formatter={(value) => {
    if (typeof value !== 'number') return ['0 tCO2e', ''];
    return [`${value.toFixed(4)} tCO2e`, ''];
  }}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        />
        <Legend />
        <Bar dataKey="scope1" name="Scope 1" fill="#ef4444" radius={[4,4,0,0]} />
        <Bar dataKey="scope2" name="Scope 2" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="scope3" name="Scope 3" fill="#f59e0b" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}