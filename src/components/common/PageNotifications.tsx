import { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, Award, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import lmsService from '@/services/lmsService';
import { useAuth } from '@/hooks/useAuth';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'badge' | 'info';
  to?: string;
}

const INFO_ITEM: NotificationItem = {
  id: 'info-platform',
  title: 'Mise a jour plateforme',
  description: 'Nouvelles ressources LMS ajoutees cette semaine.',
  type: 'info',
};

export default function PageNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([INFO_ITEM]);
  const [seenCourseId, setSeenCourseId] = useState<string>(() => localStorage.getItem('iq-notif-seen-course-id') ?? '');
  const [seenBadgeMarker, setSeenBadgeMarker] = useState<string>(() => localStorage.getItem('iq-notif-seen-badge-marker') ?? '');

  useEffect(() => {
    const loadDynamicNotifications = async () => {
      const nextItems: NotificationItem[] = [];

      try {
        const parcoursRes = await lmsService.getParcours();
        const parcoursList = (parcoursRes.data?.data ?? parcoursRes.data ?? []) as Array<{
          id_parcours: string;
          titre: string;
          created_at?: string;
          est_publie?: boolean;
        }>;
        const published = parcoursList.filter((p) => p.est_publie !== false);
        const sorted = [...published].sort((a, b) => {
          const ad = new Date(a.created_at ?? 0).getTime();
          const bd = new Date(b.created_at ?? 0).getTime();
          return bd - ad;
        });
        const latest = sorted[0];
        if (latest) {
          nextItems.push({
            id: `course-${latest.id_parcours}`,
            title: 'Nouveau cours disponible',
            description: `${latest.titre} est maintenant accessible.`,
            type: 'course',
            to: `/lms/parcours/${latest.id_parcours}`,
          });
        }
      } catch {
        // silence: notification dynamique indisponible
      }

      try {
        const certRes = await lmsService.getStats();
        const stats = (certRes.data?.data ?? certRes.data ?? {}) as { nb_inscrits_total?: number };
        const currentBadgeMarker = String(stats.nb_inscrits_total ?? 0);
        const seenBadgeMarker = localStorage.getItem('iq-notif-seen-badge-marker');
        if (currentBadgeMarker !== '0') {
          const userRoles = user?.roles ?? [];
          const badgeTarget = userRoles.includes('ETUDIANT') ? '/lms/certificats' : '/lms';
          nextItems.push({
            id: `badge-${currentBadgeMarker}`,
            title: 'Nouveau badge obtenu',
            description: 'Vous avez debloque un nouveau badge de progression.',
            type: 'badge',
            to: badgeTarget,
          });
        }
      } catch {
        // silence: pas de notification badge pour ce role
      }

      nextItems.push(INFO_ITEM);
      setItems(nextItems);
    };

    loadDynamicNotifications();
  }, [user?.roles]);

  const unread = useMemo(() => {
    return items.filter((item) => {
      if (item.type === 'course') {
        const id = item.id.replace('course-', '');
        return id !== seenCourseId;
      }
      if (item.type === 'badge') {
        const marker = item.id.replace('badge-', '');
        return marker !== seenBadgeMarker;
      }
      return false;
    }).length;
  }, [items, seenBadgeMarker, seenCourseId]);

  const unreadItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type === 'course') {
        return item.id.replace('course-', '') !== seenCourseId;
      }
      if (item.type === 'badge') {
        return item.id.replace('badge-', '') !== seenBadgeMarker;
      }
      return false;
    });
  }, [items, seenBadgeMarker, seenCourseId]);

  const seenItems = useMemo(() => {
    return items.filter((item) => !unreadItems.some((u) => u.id === item.id));
  }, [items, unreadItems]);

  const iconForType = (type: NotificationItem['type']) => {
    if (type === 'course') return <BookOpen className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
    if (type === 'badge') return <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    return <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="iq-btn-ghost relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] iq-card p-3 shadow-xl z-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-[var(--iq-text-1)]">Notifications</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="iq-btn-ghost !px-2 !py-1"
              aria-label="Fermer notifications"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            <div>
              <p className="text-[11px] font-semibold text-[var(--iq-text-2)] mb-1">Non lues</p>
              {unreadItems.length === 0 ? (
                <div className="iq-soft rounded-xl p-2.5 border border-[var(--iq-border)]">
                  <p className="text-xs text-[var(--iq-text-2)]">Aucune nouvelle notification.</p>
                </div>
              ) : unreadItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.type === 'course') {
                      const id = item.id.replace('course-', '');
                      localStorage.setItem('iq-notif-seen-course-id', id);
                      setSeenCourseId(id);
                    }
                    if (item.type === 'badge') {
                      const marker = item.id.replace('badge-', '');
                      localStorage.setItem('iq-notif-seen-badge-marker', marker);
                      setSeenBadgeMarker(marker);
                    }
                    if (item.to) {
                      setOpen(false);
                      navigate(item.to);
                    }
                  }}
                  className={`w-full text-left iq-soft rounded-xl p-2.5 border border-[var(--iq-border)] transition-colors mb-2 ${
                    item.to ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{iconForType(item.type)}</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--iq-text-1)]">{item.title}</p>
                      <p className="text-xs text-[var(--iq-text-2)] mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[var(--iq-text-2)] mb-1">Lues</p>
              {seenItems.length === 0 ? (
                <div className="iq-soft rounded-xl p-2.5 border border-[var(--iq-border)]">
                  <p className="text-xs text-[var(--iq-text-2)]">Aucune notification lue.</p>
                </div>
              ) : seenItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.to) {
                      setOpen(false);
                      navigate(item.to);
                    }
                  }}
                  className={`w-full text-left iq-soft rounded-xl p-2.5 border border-[var(--iq-border)] opacity-80 transition-colors mb-2 ${
                    item.to ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{iconForType(item.type)}</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--iq-text-1)]">{item.title}</p>
                      <p className="text-xs text-[var(--iq-text-2)] mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
