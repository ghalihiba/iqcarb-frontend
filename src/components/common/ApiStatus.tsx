import { useApiStatus } from '@/hooks/useApiStatus';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ApiStatus() {
  const { isOnline, isChecking, lastChecked, recheck } = useApiStatus();

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
      ${isOnline
        ? 'bg-green-50 text-green-700 border border-green-100'
        : 'bg-red-50 text-red-700 border border-red-100'}
    `}>
      {isChecking ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}

      <span>
        {isChecking
          ? 'Vérification...'
          : isOnline
          ? 'Backend connecté'
          : 'Backend hors ligne'}
      </span>

      {!isOnline && (
        <button
          onClick={recheck}
          className="ml-1 underline hover:no-underline"
        >
          Réessayer
        </button>
      )}

      {lastChecked && isOnline && (
        <span className="text-green-500 opacity-60">
          · {lastChecked.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit'
          })}
        </span>
      )}
    </div>
  );
}