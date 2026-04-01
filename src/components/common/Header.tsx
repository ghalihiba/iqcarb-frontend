import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  title:     string;
  subtitle?: string;
  onRefresh?: () => void;
}

export default function Header({
  title, subtitle, onRefresh
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        )}
      </div>
    </div>
  );
}