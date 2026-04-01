import type { LucideIcon } from 'lucide-react';

type ColorVariant = 'green' | 'blue' | 'orange' | 'red' | 'purple';

interface KPICardProps {
  title:     string;
  value:     string | number;
  unit?:     string;
  icon:      LucideIcon;
  color?:    ColorVariant;
  subtitle?: string;
  trend?:    number;
}

const colorMap: Record<ColorVariant, {
  bg: string; text: string; icon: string; border: string;
}> = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-100',  border: 'border-green-100'  },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100',   border: 'border-blue-100'   },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-100', border: 'border-orange-100' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'bg-red-100',    border: 'border-red-100'    },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-100', border: 'border-purple-100' },
};

export default function KPICard({
  title, value, unit, icon: Icon,
  color = 'green', subtitle, trend
}: KPICardProps) {
  const c = colorMap[color];

  return (
    <div className={`${c.bg} rounded-2xl p-6 border ${c.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${c.icon} p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend <= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {trend <= 0 ? '↓' : '↑'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <p className={`text-3xl font-bold ${c.text}`}>
        {value}
        {unit && (
          <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
        )}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
      )}
    </div>
  );
}