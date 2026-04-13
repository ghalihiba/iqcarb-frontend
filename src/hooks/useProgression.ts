import { useState, useEffect, useCallback, useRef } from 'react';
import lmsService from '@/services/lmsService';
import type { Cours } from '@/types/lms.types';

interface UseProgressionReturn {
  cours:        Cours | null;
  loading:      boolean;
  terminating:  boolean;
  success:      string | null;
  tempsEcoule:  number;           // secondes
  terminer:     () => Promise<void>;
}

export const useProgression = (idCours: string): UseProgressionReturn => {
  const [cours,       setCours]       = useState<Cours | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [terminating, setTerminating] = useState(false);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger le cours
  useEffect(() => {
    const fetchCours = async () => {
      setLoading(true);
      try {
        const res = await lmsService.getCours(idCours);
        setCours(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchCours();
  }, [idCours]);

  // Timer automatique dès l'ouverture du cours
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTempsEcoule(t => t + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Marquer le cours comme terminé
  const terminer = useCallback(async () => {
    if (!cours || cours.est_complete) return;
    setTerminating(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await lmsService.terminerCours(idCours, tempsEcoule);
      setCours(prev => prev ? { ...prev, est_complete: true } : null);
      setSuccess(`🎉 Cours terminé ! +${cours.points_xp} XP`);
      setTimeout(() => setSuccess(null), 4000);
    } finally {
      setTerminating(false);
    }
  }, [cours, idCours, tempsEcoule]);

  return { cours, loading, terminating, success, tempsEcoule, terminer };
};