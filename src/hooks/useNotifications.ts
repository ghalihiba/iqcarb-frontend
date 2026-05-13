/**
 * IQcarb — useNotifications.ts
 * ─────────────────────────────────────────────────────────────
 * Hook global qui gère :
 *   1. Connexion SSE pour notifications temps réel
 *   2. Badge compteur dans le Header
 *   3. Rechargement automatique après verdict/soumission
 *
 * Usage dans Header.tsx :
 *   const { nbNonLues, notifications, marquerLue, toutMarquerLu } = useNotifications();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';

export interface Notification {
  id_notification:   string;
  type:              string;
  titre:             string;
  message:           string;
  est_lue:           boolean;
  priorite:          'HAUTE' | 'NORMALE' | 'BASSE';
  created_at:        string;
  id_rapport:        string | null;
  id_organisation:   string | null;
  rapport_statut:    string | null;
  rapport_annee:     number | null;
  organisation_nom:  string | null;
  metadata:          Record<string, unknown>;
}

interface UseNotificationsResult {
  notifications:  Notification[];
  nbNonLues:      number;
  chargement:     boolean;
  recharger:      () => void;
  marquerLue:     (id: string) => Promise<void>;
  toutMarquerLu:  () => Promise<void>;
  supprimer:      (id: string) => Promise<void>;
}

export const useNotifications = (): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nbNonLues,     setNbNonLues]     = useState(0);
  const [chargement,    setChargement]    = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  // ── Charger les notifications depuis l'API ────────────────
  const recharger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await api.get('/notifications?limite=30');
      setNotifications(res.data.data ?? []);
      setNbNonLues(res.data.nb_non_lues ?? 0);
    } catch (err) {
      console.error('useNotifications:', err);
    } finally {
      setChargement(false);
    }
  }, []);

  // ── Connexion SSE pour temps réel ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // EventSource ne supporte pas les headers custom nativement
    // On passe le token en query param (accepté par le backend)
    const url = `${import.meta.env.VITE_API_URL}/api/notifications/stream?token=${token}`;
    const sse  = new EventSource(url);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'NOTIFICATION') {
          // Ajouter la nouvelle notification en tête de liste
          setNotifications(prev => [{
            id_notification:  data.id_notification,
            type:             data.type_notif,
            titre:            data.titre,
            message:          data.message,
            priorite:         data.priorite ?? 'NORMALE',
            est_lue:          false,
            created_at:       data.created_at,
            id_rapport:       data.id_rapport ?? null,
            id_organisation:  null,
            rapport_statut:   null,
            rapport_annee:    null,
            organisation_nom: null,
            metadata:         {}
          }, ...prev]);

          setNbNonLues(prev => prev + 1);
        }
      } catch { /* ignorer les erreurs de parse */ }
    };

    sse.onerror = () => {
      // Reconnexion automatique après 5s
      sse.close();
      setTimeout(() => {
        if (sseRef.current === sse) {
          recharger();
        }
      }, 5000);
    };

    // Chargement initial
    recharger();

    return () => {
      sse.close();
      sseRef.current = null;
    };
  }, [recharger]);

  // ── Marquer une notification comme lue ───────────────────
  const marquerLue = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/lire`);
      setNotifications(prev =>
        prev.map(n => n.id_notification === id ? { ...n, est_lue: true } : n)
      );
      setNbNonLues(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('marquerLue:', err);
    }
  }, []);

  // ── Tout marquer comme lu ─────────────────────────────────
  const toutMarquerLu = useCallback(async () => {
    try {
      await api.patch('/notifications/tout-lire');
      setNotifications(prev => prev.map(n => ({ ...n, est_lue: true })));
      setNbNonLues(0);
    } catch (err) {
      console.error('toutMarquerLu:', err);
    }
  }, []);

  // ── Supprimer une notification ────────────────────────────
  const supprimer = useCallback(async (id: string) => {
    try {
      const notif = notifications.find(n => n.id_notification === id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id_notification !== id));
      if (notif && !notif.est_lue) {
        setNbNonLues(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('supprimer:', err);
    }
  }, [notifications]);

  return {
    notifications,
    nbNonLues,
    chargement,
    recharger,
    marquerLue,
    toutMarquerLu,
    supprimer
  };
};

export default useNotifications;