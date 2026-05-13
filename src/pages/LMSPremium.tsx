/**
 * IQcarb — LMSPremium.tsx
 * ─────────────────────────────────────────────────────────────
 * Page de présentation des plans et déclenchement du paiement.
 * Style identique à EtudiantDashboard (iq-shell, iq-main, iq-content).
 *
 * Routes associées :
 *   /lms/premium          → cette page
 *   /lms/premium/succes   → LMSPremiumSucces.tsx (page retour Stripe)
 *
 * Flux utilisateur :
 *   1. Arriver sur /lms/premium (redirect depuis module verrouillé)
 *   2. Voir les deux plans (Mensuel / Annuel)
 *   3. Cliquer "Choisir ce plan" → POST /api/paiements/checkout
 *   4. Redirect vers Stripe Checkout (URL retournée par l'API)
 *   5. Après paiement → Stripe redirige vers /lms/premium/succes
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Award, BadgeCheck, CheckCircle, ChevronRight,
  Loader2, Lock, Shield, Sparkles, Zap
} from 'lucide-react';
import Sidebar        from '@/components/common/Sidebar';
import Header         from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LMSBreadcrumb  from '@/components/lms/LMSBreadcrumb';
import api            from '@/services/api';

// ── Types ─────────────────────────────────────────────────────
interface Plan {
  id_plan:          string;
  code:             string;
  nom:              string;
  description:      string;
  prix_centimes:    number;
  periodicite:      string;
  prix_affiche:     string;
  prix_mensuel:     string | null;
  economie_annuel:  string | null;
  badge_promo:      string | null;
  nb_essai_jours:   number;
}

interface Abonnement {
  statut:      string;
  plan_code:   string;
  plan_nom:    string;
  date_fin:    string | null;
  prix_affiche: string;
}

// ── Features incluses dans l'abonnement ──────────────────────
const FEATURES = [
  { label: 'Tous les modules de formation carbone',  inclus: true },
  { label: 'GHG Protocol & ISO 14064 en pratique',   inclus: true },
  { label: 'Stratégie de décarbonation avancée',     inclus: true },
  { label: 'Simulateur carbone entreprise',          inclus: true },
  { label: 'Certificats PDF téléchargeables',        inclus: true },
  { label: 'Badges et système de progression XP',   inclus: true },
  { label: 'Accès mobile et desktop',                inclus: true },
  { label: 'Module 1 débutant',                      inclus: true, gratuit: true },
];

// ── Composant carte plan ──────────────────────────────────────
function PlanCard({
  plan,
  isLoading,
  onChoisir,
  recommended
}: {
  plan: Plan;
  isLoading: boolean;
  onChoisir: (id: string) => void;
  recommended?: boolean;
}) {
  const isAnnuel = plan.periodicite === 'year';

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 ${
      recommended
        ? 'border-primary-300 dark:border-primary-700 shadow-lg shadow-primary-100 dark:shadow-primary-900/20 scale-[1.02]'
        : 'border-gray-100 dark:border-gray-700 hover:shadow-md'
    }`}>

      {/* Badge recommandé */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recommandé
          </span>
        </div>
      )}

      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{plan.nom}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{plan.description}</p>
          </div>
          {plan.badge_promo && (
            <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 flex-shrink-0 ml-2">
              {plan.badge_promo}
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {(plan.prix_centimes / 100).toFixed(0)}€
            </span>
            <span className="text-gray-400 dark:text-gray-500 mb-1 text-sm">
              /{isAnnuel ? 'an' : 'mois'}
            </span>
          </div>
          {plan.prix_mensuel && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              ≈ {plan.prix_mensuel}
            </p>
          )}
          {plan.economie_annuel && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {plan.economie_annuel}
            </p>
          )}
          {plan.nb_essai_jours > 0 && (
            <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-1">
              {plan.nb_essai_jours} jours d'essai gratuit inclus
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onChoisir(plan.id_plan)}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
            recommended
              ? 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
              : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 disabled:opacity-50'
          }`}
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirection...</>
            : <><Zap className="w-4 h-4" /> Choisir ce plan</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function LMSPremium() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const annule         = searchParams.get('annule') === 'true';

  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [abonnement,  setAbonnement]  = useState<Abonnement | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingId,   setLoadingId]   = useState<string | null>(null);
  const [erreur,      setErreur]      = useState<string | null>(null);

  // ── Chargement données ────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, aboRes] = await Promise.all([
        api.get('/paiements/plans'),
        api.get('/paiements/mon-abonnement').catch(() => null)
      ]);
      setPlans(plansRes.data.data ?? []);
      if (aboRes?.data?.a_acces) {
        setAbonnement(aboRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Démarrer le paiement ──────────────────────────────────
  const handleChoisir = async (id_plan: string) => {
    setLoadingId(id_plan);
    setErreur(null);
    try {
      const res = await api.post('/paiements/checkout', { id_plan });
      // Redirection vers Stripe Checkout (URL externe)
      window.location.href = res.data.checkout_url;
    } catch (err: any) {
      setErreur(
        err.response?.data?.message
        ?? 'Une erreur est survenue. Veuillez réessayer.'
      );
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="iq-shell">
        <Sidebar />
        <main className="iq-main flex items-center justify-center">
          <LoadingSpinner message="Chargement des plans..." />
        </main>
      </div>
    );
  }

  // ── Utilisateur déjà abonné ───────────────────────────────
  if (abonnement) {
    return (
      <div className="iq-shell">
        <Sidebar />
        <main className="iq-main iq-dotgrid relative overflow-y-auto">
          <Header title="Accès Premium" subtitle="Votre abonnement IQcarb" />
          <div className="iq-content">
            <LMSBreadcrumb items={[
              { label: 'Apprentissage', to: '/lms' },
              { label: 'Premium' }
            ]} />

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Abonnement actif
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Plan : <span className="font-semibold text-gray-700 dark:text-gray-200">{abonnement.plan_nom}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {abonnement.date_fin
                  ? `Valide jusqu'au ${new Date(abonnement.date_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`
                  : 'Renouvellement automatique actif'
                }
              </p>
              <button
                onClick={() => navigate('/lms')}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Accéder à mes formations
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const planAnnuel  = plans.find(p => p.periodicite === 'year');
  const planMensuel = plans.find(p => p.periodicite === 'month');

  return (
    <div className="iq-shell">
      <Sidebar />
      <main className="iq-main iq-dotgrid relative overflow-y-auto">
        <Header
          title="Passer à Premium"
          subtitle="Débloquez tous les modules de formation carbone"
        />

        <div className="iq-content">
          <LMSBreadcrumb items={[
            { label: 'Apprentissage', to: '/lms' },
            { label: 'Premium' }
          ]} />

          {/* Bannière annulation */}
          {annule && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              Paiement annulé. Vous pouvez réessayer quand vous voulez.
            </div>
          )}

          {/* Erreur */}
          {erreur && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {erreur}
            </div>
          )}

          {/* Hero */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                  Votre premier module est gratuit
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Le module d'introduction au bilan carbone est accessible sans abonnement.
                  Pour accéder à tous les modules avancés — GHG Protocol, ISO 14064,
                  stratégie de décarbonation et simulateur — souscrivez à un plan.
                </p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
              Choisissez votre plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              {planMensuel && (
                <PlanCard
                  plan={planMensuel}
                  isLoading={loadingId === planMensuel.id_plan}
                  onChoisir={handleChoisir}
                />
              )}
              {planAnnuel && (
                <PlanCard
                  plan={planAnnuel}
                  isLoading={loadingId === planAnnuel.id_plan}
                  onChoisir={handleChoisir}
                  recommended
                />
              )}
            </div>
          </div>

          {/* Features incluses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">
              Ce qui est inclus dans votre abonnement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                    f.gratuit
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {f.label}
                    {f.gratuit && (
                      <span className="ml-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Gratuit
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-500 py-2">
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Paiement sécurisé par Stripe
            </div>
            <span>·</span>
            <span>Résiliable à tout moment</span>
            <span>·</span>
            <span>Sans engagement</span>
          </div>

        </div>
      </main>
    </div>
  );
}