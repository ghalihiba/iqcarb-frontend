/**
 * IQcarb — LMSPremiumSucces.tsx
 * ─────────────────────────────────────────────────────────────
 * Page de confirmation après paiement Stripe réussi.
 * Stripe redirige ici avec ?session_id=cs_xxx
 *
 * Cette page :
 *   1. Affiche un message de succès animé
 *   2. Vérifie que l'abonnement est bien activé (polling)
 *   3. Redirige vers /lms après confirmation
 *
 * Route : /lms/premium/succes
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Award, BadgeCheck, ChevronRight,
  Loader2, Sparkles
} from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import api     from '@/services/api';

// Nombre max de tentatives de vérification avant de passer outre
const MAX_POLLING = 8;
const POLL_DELAY  = 2000; // ms

export default function LMSPremiumSucces() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId      = searchParams.get('session_id');

  const [statut,   setStatut]   = useState<'verif' | 'ok' | 'attente'>('verif');
  const [tentative, setTentative] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling — vérifier que le webhook a bien activé l'abo ──
  useEffect(() => {
    if (!sessionId) {
      setStatut('attente');
      return;
    }

    const verifier = async () => {
      try {
        const res = await api.get('/paiements/mon-abonnement');
        if (res.data?.a_acces) {
          setStatut('ok');
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setTentative(prev => {
            if (prev >= MAX_POLLING) {
              setStatut('attente');
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
            return prev + 1;
          });
        }
      } catch {
        setStatut('attente');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // Première vérification après 1.5s (laisser le temps au webhook)
    const timeout = setTimeout(() => {
      verifier();
      intervalRef.current = setInterval(verifier, POLL_DELAY);
    }, 1500);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  // ── Auto-redirect après confirmation ─────────────────────
  useEffect(() => {
    if (statut !== 'ok') return;
    const t = setTimeout(() => navigate('/lms'), 4000);
    return () => clearTimeout(t);
  }, [statut, navigate]);

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center max-w-md w-full shadow-sm">

          {/* Icône animée */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
            statut === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 scale-110'
              : 'bg-primary-50 dark:bg-primary-900/20'
          }`}>
            {statut === 'verif' ? (
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            ) : statut === 'ok' ? (
              <BadgeCheck className="w-10 h-10 text-emerald-500" />
            ) : (
              <Award className="w-10 h-10 text-amber-500" />
            )}
          </div>

          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {statut === 'verif' && 'Confirmation en cours...'}
            {statut === 'ok'   && 'Paiement confirmé !'}
            {statut === 'attente' && 'Paiement reçu'}
          </h1>

          {/* Sous-titre */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {statut === 'verif' && (
              'Nous vérifions votre paiement. Cela prend quelques secondes...'
            )}
            {statut === 'ok' && (
              'Votre abonnement est activé. Vous avez accès à tous les modules de formation carbone. Redirection automatique...'
            )}
            {statut === 'attente' && (
              'Votre paiement a été reçu. L\'activation de votre compte peut prendre quelques minutes. Vous pouvez dès maintenant accéder à votre espace.'
            )}
          </p>

          {/* Badges inclus */}
          {(statut === 'ok' || statut === 'attente') && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { icone: '📗', label: 'Tous les modules' },
                { icone: '🏆', label: 'Certificats PDF' },
                { icone: '🏅', label: 'Badges & XP' },
              ].map(item => (
                <div
                  key={item.label}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">{item.icone}</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/lms')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {statut === 'ok'
                ? <><Sparkles className="w-4 h-4" /> Accéder à mes formations</>
                : <><ChevronRight className="w-4 h-4" /> Aller à mon espace</>
              }
            </button>

            {statut === 'ok' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Redirection automatique dans 4 secondes...
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}