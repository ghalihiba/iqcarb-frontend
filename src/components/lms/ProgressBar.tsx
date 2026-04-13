interface Props {
  value:   number;   // 0–100
  label?:  string;
  color?:  string;
  size?:   'sm' | 'md' | 'lg';
  showPct?: boolean;
}

export default function ProgressBar({
  value, label, color = 'bg-primary-600',
  size = 'md', showPct = true
}: Props) {
  const h = size === 'lg' ? 'h-4' : size === 'md' ? 'h-2.5' : 'h-1.5';
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <div>
      {(label || showPct) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {label}
            </span>
          )}
          {showPct && (
            <span className={`text-xs font-bold ${
              pct === 100
                ? 'text-green-600 dark:text-green-400'
                : 'text-primary-600 dark:text-primary-400'
            }`}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full ${h}`}>
        <div
          className={`${color} ${h} rounded-full transition-all duration-700 ${
            pct === 100 ? 'bg-green-500' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}