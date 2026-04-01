
import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { RepartitionScopes } from '@/types/dashboard.types';

interface ScopeChartProps {
  data: RepartitionScopes | null;
}

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b'];

export default function ScopeChart({ data }: ScopeChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p className="text-sm">Aucune donnée</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Scope 1 — Directes',     value: data.SCOPE_1?.valeur ?? 0 },
    { name: 'Scope 2 — Énergie',       value: data.SCOPE_2?.valeur ?? 0 },
    { name: 'Scope 3 — Chaîne valeur', value: data.SCOPE_3?.valeur ?? 0 },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p className="text-sm">Aucune émission enregistrée</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={105}
          paddingAngle={4}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
  formatter={(value) => {
    if (typeof value !== 'number') return ['0 tCO2e', ''];
    return [`${value.toFixed(4)} tCO2e`, ''];
  }}
/>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}