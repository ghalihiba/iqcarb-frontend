import type { LucideIcon } from 'lucide-react';

type ColorVariant = 'green' | 'blue' | 'orange' | 'red' | 'purple';

interface Props {
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
  green: {
    bg:     'bg-green-50 dark:bg-green-900/20',
    text:   'text-green-700 dark:text-green-400',
    icon:   'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-100 dark:border-green-800'
  },
  blue: {
    bg:     'bg-blue-50 dark:bg-blue-900/20',
    text:   'text-blue-700 dark:text-blue-400',
    icon:   'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-100 dark:border-blue-800'
  },
  orange: {
    bg:     'bg-orange-50 dark:bg-orange-900/20',
    text:   'text-orange-700 dark:text-orange-400',
    icon:   'bg-orange-100 dark:bg-orange-900/40',
    border: 'border-orange-100 dark:border-orange-800'
  },
  red: {
    bg:     'bg-red-50 dark:bg-red-900/20',
    text:   'text-red-700 dark:text-red-400',
    icon:   'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-100 dark:border-red-800'
  },
  purple: {
    bg:     'bg-purple-50 dark:bg-purple-900/20',
    text:   'text-purple-700 dark:text-purple-400',
    icon:   'bg-purple-100 dark:bg-purple-900/40',
    border: 'border-purple-100 dark:border-purple-800'
  },
};

export default function KPICard({
  title, value, unit, icon: Icon,
  color = 'green', subtitle, trend
}: Props) {
  const c = colorMap[color];

  return (
    <div className={`${c.bg} rounded-2xl p-6 border ${c.border} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${c.icon} p-3 rounded-xl`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend <= 0
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
          }`}>
            {trend <= 0 ? '↓' : '↑'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
        {title}
      </p>
      <p className={`text-3xl font-bold ${c.text}`}>
        {value}
        {unit && (
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
            {unit}
          </span>
        )}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}