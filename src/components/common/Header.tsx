import { RefreshCw } from 'lucide-react';

interface Props {
  title:      string;
  subtitle?:  string;
  onRefresh?: () => void;
}

export default function Header({ title, subtitle, onRefresh }: Props) {
  return (
    <div className="
      bg-white dark:bg-gray-800
      border-b border-gray-100 dark:border-gray-700
      px-8 py-5 sticky top-0 z-10
    ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-medium transition-colors
              bg-primary-50 dark:bg-primary-900/30
              text-primary-700 dark:text-primary-400
              hover:bg-primary-100 dark:hover:bg-primary-900/50
            "
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        )}
      </div>
    </div>
  );
}