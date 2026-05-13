/**
 * IQcarb — NotificationDropdown.tsx
 * ─────────────────────────────────────────────────────────────
 * Dropdown de notifications dans le Header.
 * Affiche le badge rouge avec le nombre de non lues.
 * Clic → ouvre le panneau avec la liste des notifications.
 *
 * Usage dans Header.tsx :
 *   import NotificationDropdown from '@/components/common/NotificationDropdown';
 *   <NotificationDropdown />
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, ChevronRight,
  FileCheck, FileX, RefreshCw,
  Trash2, X, AlertTriangle, Info
} from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

// ── Icône selon le type de notification ──────────────────────
const IconeType = ({ type }: { type: string }) => {
  const classes = 'w-4 h-4 flex-shrink-0';
  switch (type) {
    case 'RAPPORT_VALIDE':
      return <FileCheck className={`${classes} text-emerald-500`} />;
    case 'RAPPORT_REJETE':
      return <FileX className={`${classes} text-red-500`} />;
    case 'RAPPORT_CORRECTIONS':
      return <RefreshCw className={`${classes} text-amber-500`} />;
    case 'RAPPORT_SOUMIS':
      return <FileCheck className={`${classes} text-blue-500`} />;
    case 'RAPPORT_URGENT':
      return <AlertTriangle className={`${classes} text-red-500`} />;
    default:
      return <Info className={`${classes} text-gray-400`} />;
  }
};

// ── Couleur fond selon priorité ───────────────────────────────
const fondPriorite = (priorite: string, estLue: boolean) => {
  if (estLue) return 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50';
  switch (priorite) {
    case 'HAUTE':   return 'bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20';
    case 'NORMALE': return 'bg-primary-50/40 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20';
    default:        return 'bg-gray-50/60 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-700/50';
  }
};

// ── Formater la date relative ─────────────────────────────────
const dateRelative = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const j    = Math.floor(diff / 86400000);
  if (min < 1)  return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  if (h < 24)   return `Il y a ${h}h`;
  return `Il y a ${j}j`;
};

// ── Carte notification individuelle ──────────────────────────
function CarteNotification({
  notif,
  onLire,
  onSupprimer,
  onNaviguer
}: {
  notif: Notification;
  onLire: (id: string) => void;
  onSupprimer: (id: string) => void;
  onNaviguer: (notif: Notification) => void;
}) {
  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3 cursor-pointer
        border-b border-gray-100 dark:border-gray-700/50 last:border-0
        transition-colors duration-150 group
        ${fondPriorite(notif.priorite, notif.est_lue)}
      `}
      onClick={() => {
        if (!notif.est_lue) onLire(notif.id_notification);
        onNaviguer(notif);
      }}
    >
      {/* Point non-lue */}
      {!notif.est_lue && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
      )}

      {/* Icône */}
      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
        notif.est_lue
          ? 'bg-gray-100 dark:bg-gray-700'
          : 'bg-white dark:bg-gray-800 shadow-sm'
      }`}>
        <IconeType type={notif.type} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight truncate ${
          notif.est_lue
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-gray-900 dark:text-white'
        }`}>
          {notif.titre}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {dateRelative(notif.created_at)}
        </p>
      </div>

      {/* Bouton supprimer (visible au hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSupprimer(notif.id_notification);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 text-gray-300 flex-shrink-0"
        title="Supprimer"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function NotificationDropdown() {
  const navigate  = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const ref       = useRef<HTMLDivElement>(null);

  const {
    notifications,
    nbNonLues,
    chargement,
    recharger,
    marquerLue,
    toutMarquerLu,
    supprimer
  } = useNotifications();

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Naviguer selon le type de notification
  const handleNaviguer = (notif: Notification) => {
    setOuvert(false);
    if (notif.id_rapport) {
      // Auditeur → page de détail rapport
      navigate(`/audit/rapports/${notif.id_rapport}`);
    } else if (notif.id_organisation) {
      navigate(`/rapports`);
    } else {
      navigate('/rapports');
    }
  };

  return (
    <div className="relative" ref={ref}>

      {/* Bouton cloche */}
      <button
        onClick={() => setOuvert(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {nbNonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {nbNonLues > 99 ? '99+' : nbNonLues}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {ouvert && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 z-50 overflow-hidden">

          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                Notifications
              </span>
              {nbNonLues > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {nbNonLues} non lue{nbNonLues > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {nbNonLues > 0 && (
                <button
                  onClick={toutMarquerLu}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </button>
              )}
              <button
                onClick={recharger}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${chargement ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setOuvert(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-[420px] overflow-y-auto">
            {chargement && notifications.length === 0 ? (
              <div className="py-10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <CarteNotification
                  key={notif.id_notification}
                  notif={notif}
                  onLire={marquerLue}
                  onSupprimer={supprimer}
                  onNaviguer={handleNaviguer}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-2">
              <button
                onClick={() => { setOuvert(false); navigate('/notifications'); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
              >
                Voir toutes les notifications
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}