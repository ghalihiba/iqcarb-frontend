import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '@/services/apiInterceptor';

interface ApiStatus {
  isOnline:    boolean;
  isChecking:  boolean;
  lastChecked: Date | null;
  recheck:     () => Promise<void>;
}

export const useApiStatus = (
  intervalMs = 30000
): ApiStatus => {
  const [isOnline,    setIsOnline]    = useState<boolean>(true);
  const [isChecking,  setIsChecking]  = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setIsChecking(true);
    const online = await checkBackendHealth();
    setIsOnline(online);
    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  // Vérification initiale
  useEffect(() => { check(); }, [check]);

  // Vérification périodique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(check, intervalMs);
    return () => clearInterval(interval);
  }, [check, intervalMs]);

  return { isOnline, isChecking, lastChecked, recheck: check };
};