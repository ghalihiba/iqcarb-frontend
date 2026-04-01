import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message, onRetry
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertTriangle className="w-12 h-12 text-orange-400" />
      <p className="text-gray-600 text-sm text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      )}
    </div>
  );
}