/**
 * IQcarb — useAccesPremium.ts
 * ─────────────────────────────────────────────────────────────
 * Hook React qui vérifie si l'utilisateur a un abonnement actif.
 * Utilisé dans ModuleDetail.tsx et ParcoursDetail.tsx pour
 * afficher le cadenas et rediriger vers /lms/premium.
 *
 * Usage :
 *   const { aAcces, chargement, estGratuit } = useAccesPremium(id_module, ordre_module);
 *   if (!aAcces && !estGratuit) → afficher cadenas + bouton Premium
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate }                       from 'react-router-dom';
import api                                   from '@/services/api';

interface AccesPremiumResult {
  aAcces:     boolean;      // true = abonnement actif ou module gratuit
  estGratuit: boolean;      // true = module 1 (ordre === 1)
  chargement: boolean;
  statut:     string;       // 'ACTIVE' | 'TRIALING' | 'NONE' | ...
  redirigerVersPremium: () => void;
}

/**
 * @param ordre_module - Ordre du module dans le parcours (1 = gratuit)
 * @param est_premium  - Parcours premium (vient de l'API parcours)
 */
export const useAccesPremium = (
  ordre_module: number = 1,
  est_premium:  boolean = true
): AccesPremiumResult => {
  const navigate   = useNavigate();
  const [aAcces,   setAAcces]   = useState(false);
  const [statut,   setStatut]   = useState('NONE');
  const [chargement, setChargement] = useState(true);

  // Module gratuit = premier module (ordre 1) de n'importe quel parcours
  const estGratuit = ordre_module === 1 || !est_premium;

  const verifier = useCallback(async () => {
    // Si le module est gratuit, pas besoin de vérifier
    if (estGratuit) {
      setAAcces(true);
      setStatut('GRATUIT');
      setChargement(false);
      return;
    }

    try {
      const res = await api.get('/paiements/mon-abonnement');
      const hasAccess = res.data?.a_acces === true;
      setAAcces(hasAccess);
      setStatut(res.data?.data?.statut ?? 'NONE');
    } catch {
      setAAcces(false);
      setStatut('ERROR');
    } finally {
      setChargement(false);
    }
  }, [estGratuit]);

  useEffect(() => { verifier(); }, [verifier]);

  const redirigerVersPremium = useCallback(() => {
    navigate('/lms/premium');
  }, [navigate]);

  return { aAcces, estGratuit, chargement, statut, redirigerVersPremium };
};

export default useAccesPremium;