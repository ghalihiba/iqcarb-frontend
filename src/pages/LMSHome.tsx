/**
 * LMSHome.tsx — Dashboard Apprenant IQcarb
 * Design system cohérent : même tokens que Login + Dashboard
 * Light/dark via classe html.dark, logique useLMS inchangée
 */

import { useState, useEffect } from 'react';
import { Link }        from 'react-router-dom';
import Sidebar         from '@/components/common/Sidebar';
import PageNotifications from '@/components/common/PageNotifications';
import LMSBreadcrumb   from '@/components/lms/LMSBreadcrumb';
import { useLMS }      from '@/hooks/useLMS';
import { useAuth }     from '@/hooks/useAuth';
import {
  BookOpen, Award, Target, TrendingUp, CheckCircle,
  AlertCircle, ShieldCheck, RefreshCw, Play, Clock,
  BarChart3, ChevronRight, Flame, Star, Sparkles, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

// ─── Hook dark mode ───────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Tokens ───────────────────────────────────────────────────
function T(dark: boolean) {
  return {
    bg:       dark ? '#0f1612' : '#f4f9f6',
    surface:  dark ? '#141e18' : '#ffffff',
    border:   dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,106,79,0.12)',
    border2:  dark ? 'rgba(255,255,255,0.12)' : 'rgba(45,106,79,0.2)',
    text1:    dark ? '#e4ede8' : '#1a3028',
    text2:    dark ? 'rgba(160,190,170,0.7)' : 'rgba(30,80,55,0.6)',
    text3:    dark ? 'rgba(100,140,115,0.5)' : 'rgba(30,80,55,0.4)',
    headerBg: dark ? 'rgba(15,22,18,0.94)' : 'rgba(244,249,246,0.96)',
    dotGrid:  dark ? 'rgba(255,255,255,0.028)' : 'rgba(45,106,79,0.04)',
    rowHover: dark ? 'rgba(255,255,255,0.03)' : 'rgba(45,106,79,0.04)',
    progressBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(45,106,79,0.08)',
    accentGreen: dark ? '#22c55e' : '#2d6a4f',
  };
}

// ─── Badge niveau ─────────────────────────────────────────────
const NIVEAUX: Record<string, { label: string; c: string }> = {
  DEBUTANT:      { label: 'Débutant',      c: '#22c55e' },
  INTERMEDIAIRE: { label: 'Intermédiaire', c: '#3b82f6' },
  AVANCE:        { label: 'Avancé',        c: '#a855f7' },
  EXPERT:        { label: 'Expert',        c: '#f59e0b' },
};

// ─── Compteur animé ───────────────────────────────────────────
function Counter({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const raf = (now: number) => {
      const p = Math.min((now - t0) / 1200, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [to]);
  return <>{Math.round(v)}</>;
}

// ─── Barre de progression ─────────────────────────────────────
function Bar({ pct, color, bgColor, delay = 0 }: {
  pct: number; color: string; bgColor: string; delay?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 250 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ height: 4, background: bgColor, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${w}%`, borderRadius: 99,
        background: color, boxShadow: `0 0 7px ${color}50`,
        transition: 'width 1.1s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

// ─── Carte parcours ───────────────────────────────────────────
function ParcoursTile({
  parcours, onInscrire, dark,
}: {
  parcours: Record<string, unknown>;
  onInscrire: (id: string) => Promise<unknown>;
  dark: boolean;
}) {
  const tk      = T(dark);
  const id      = String(parcours.id_parcours ?? '');
  const titre   = String(parcours.titre ?? '');
  const niveau  = String(parcours.niveau ?? 'DEBUTANT');
  const desc    = String(parcours.description ?? '');
  const prog    = Number(parcours.progression ?? 0);
  const statut  = String(parcours.statut ?? '');
  const duree   = Number(parcours.duree_estimee_min ?? 0);
  const nbMod   = Number(parcours.nb_modules ?? 0);
  const isInscrit = statut === 'EN_COURS' || statut === 'TERMINE';
  const isTermine = statut === 'TERMINE';
  const niv = NIVEAUX[niveau] ?? NIVEAUX.DEBUTANT;
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16, padding: 18,
        background: hov
          ? (dark ? '#1a2820' : '#f0faf5')
          : tk.surface,
        border: `1px solid ${hov ? niv.c + '35' : tk.border}`,
        boxShadow: hov
          ? (dark ? `0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px ${niv.c}18` : `0 8px 28px rgba(45,106,79,0.12), 0 0 0 1px ${niv.c}18`)
          : (dark ? 'none' : '0 2px 10px rgba(45,106,79,0.06)'),
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Accent glow top-right */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 70, height: 70,
        borderRadius: '50%', background: `${niv.c}14`, filter: 'blur(14px)',
        pointerEvents: 'none', opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${niv.c}12`, border: `1px solid ${niv.c}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen style={{ width: 15, height: 15, color: niv.c }} />
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
            background: `${niv.c}12`, color: niv.c, border: `1px solid ${niv.c}22`,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.3px',
          }}>{niv.label}</span>
          {isTermine && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: 'rgba(34,197,94,0.1)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.22)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>TERMINÉ</span>
          )}
        </div>
      </div>

      {/* Titre */}
      <h3 style={{
        fontSize: 13.5, fontWeight: 700, margin: '0 0 5px',
        color: tk.text1, letterSpacing: '-0.2px', lineHeight: 1.35,
      }}>
        {titre}
      </h3>
      <p style={{
        fontSize: 11, color: tk.text3, margin: '0 0 12px', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {desc || 'Formation en comptabilité carbone et développement durable'}
      </p>

      {/* Méta */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {duree > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 10, height: 10, color: tk.text3 }} />
            <span style={{ fontSize: 10, color: tk.text3, fontWeight: 600 }}>
              {Math.round(duree/60)}h
            </span>
          </div>
        )}
        {nbMod > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <BarChart3 style={{ width: 10, height: 10, color: tk.text3 }} />
            <span style={{ fontSize: 10, color: tk.text3, fontWeight: 600 }}>
              {nbMod} module{nbMod > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Progression */}
      {isInscrit && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: tk.text3 }}>Progression</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: niv.c, fontFamily: 'JetBrains Mono, monospace' }}>
              {prog}%
            </span>
          </div>
          <Bar pct={prog} color={niv.c} bgColor={tk.progressBg} />
        </div>
      )}

      {/* CTA */}
      {isTermine ? (
        <Link to={`/lms/parcours/${id}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: 'rgba(34,197,94,0.1)', color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.22)', textDecoration: 'none',
        }}>
          <Award style={{ width: 12, height: 12 }} />
          Certificat obtenu
        </Link>
      ) : isInscrit ? (
        <Link to={`/lms/parcours/${id}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: `${niv.c}14`, color: niv.c,
          border: `1px solid ${niv.c}28`, textDecoration: 'none',
        }}>
          <Play style={{ width: 11, height: 11 }} />
          Continuer ({prog}%)
        </Link>
      ) : (
        <button onClick={() => onInscrire(id)} style={{
          width: '100%', padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)',
          color: tk.text2, border: `1px solid ${tk.border}`,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.2s',
        }}>
          <Sparkles style={{ width: 11, height: 11 }} />
          Commencer
        </button>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, color, dark }: {
  icon: React.ElementType; title: string; sub: string; color: string; dark: boolean;
}) {
  const tk = T(dark);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: `${color}12`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: tk.text1, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 11, color: tk.text3, margin: 0 }}>{sub}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Page principale
// ═════════════════════════════════════════════════════════════
export default function LMSHome() {
  const dark = useDarkMode();
  const tk   = T(dark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('iq-sidebar-collapsed') === '1'
  );

  const { parcours, profil, loading, error, success, inscrire, refetch } = useLMS();
  const { user } = useAuth();
  const role = user?.roles?.[0] ?? 'ETUDIANT';

  useEffect(() => {
    const onSidebarStateChanged = (event: Event) => {
      const custom = event as CustomEvent<{ collapsed?: boolean }>;
      if (typeof custom.detail?.collapsed === 'boolean') {
        setSidebarCollapsed(custom.detail.collapsed);
      }
    };
    window.addEventListener('iq-sidebar-state-changed', onSidebarStateChanged);
    return () => window.removeEventListener('iq-sidebar-state-changed', onSidebarStateChanged);
  }, []);

  const enCours  = parcours.filter((p: Record<string, unknown>) => p.statut === 'EN_COURS');
  const termines = parcours.filter((p: Record<string, unknown>) => p.statut === 'TERMINE');

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: tk.bg, fontFamily: "'Syne',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--iq-sidebar-width, 240px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: `3px solid ${tk.border2}`,
            borderTopColor: tk.accentGreen, borderRadius: '50%',
            animation: 'iqSpin 0.8s linear infinite', margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: 13, color: tk.text2 }}>Chargement de votre espace...</p>
        </div>
      </main>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes iqFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iqSpin   { to{transform:rotate(360deg)} }
        @keyframes iqDot    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .iq-f1{animation:iqFadeUp .5s ease .04s both}
        .iq-f2{animation:iqFadeUp .5s ease .10s both}
        .iq-f3{animation:iqFadeUp .5s ease .18s both}
        .iq-f4{animation:iqFadeUp .5s ease .26s both}
        .iq-f5{animation:iqFadeUp .5s ease .34s both}
        .iq-f6{animation:iqFadeUp .5s ease .42s both}
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: tk.bg, fontFamily: "'Syne',sans-serif", color: tk.text1 }}>
        <Sidebar />

        <main style={{ marginLeft: 'var(--iq-sidebar-width, 240px)', flex: 1, overflowY: 'auto', position: 'relative' }}>

          {/* Grille de points */}
          <div style={{
            position: 'fixed', inset: 0, marginLeft: 'var(--iq-sidebar-width, 240px)', pointerEvents: 'none', zIndex: 0,
            backgroundImage: `radial-gradient(circle, ${tk.dotGrid} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          {/* Header sticky */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20,
            background: tk.headerBg,
            backdropFilter: 'blur(14px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
            borderBottom: `1px solid ${tk.border}`,
            padding: '18px 30px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('iq-sidebar-toggle'))}
                aria-label={sidebarCollapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
                title={sidebarCollapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'}
                style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  border: `1px solid ${tk.border}`,
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)',
                  color: tk.text2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen style={{ width: 15, height: 15 }} />
                  : <PanelLeftClose style={{ width: 15, height: 15 }} />
                }
              </button>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: tk.accentGreen,
                animation: 'iqDot 2.2s ease-in-out infinite',
              }} />
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 800, color: tk.text1, margin: 0, letterSpacing: '-0.4px' }}>
                  Espace Apprentissage
                </h1>
                <p style={{ fontSize: 11.5, color: tk.text3, margin: 0 }}>
                  IQcarb Learning · Pilotage carbone & conformité
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <LMSBreadcrumb items={[{ label: 'Apprentissage' }]} />
              <PageNotifications />
              <button onClick={refetch} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 9,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.07)',
                border: `1px solid ${tk.border}`,
                color: tk.text2, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
                Actualiser
              </button>
            </div>
          </div>

          <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>

            {/* Messages */}
            {success && (
              <div className="iq-f1" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderRadius: 11,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                color: dark ? '#22c55e' : '#2d6a4f', fontSize: 13, fontWeight: 600,
              }}>
                <CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {success}
              </div>
            )}
            {error && (
              <div className="iq-f1" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderRadius: 11,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', fontSize: 13, fontWeight: 600,
              }}>
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Bannière bienvenue */}
            <div className="iq-f1" style={{
              borderRadius: 18, padding: '22px 26px',
              background: dark
                ? 'linear-gradient(115deg, rgba(18,45,30,0.98) 0%, rgba(12,28,20,0.99) 100%)'
                : 'linear-gradient(115deg, rgba(210,240,225,0.9) 0%, rgba(232,248,240,0.95) 100%)',
              border: `1px solid ${dark ? 'rgba(34,197,94,0.2)' : 'rgba(45,106,79,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -30, top: -30, width: 160, height: 160,
                borderRadius: '50%', pointerEvents: 'none',
                background: dark
                  ? 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(45,106,79,0.1) 0%, transparent 70%)',
              }} />

              <div>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: dark ? '#f59e0b' : '#b45309',
                  margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Flame style={{ width: 12, height: 12 }} />
                  Bienvenue de retour
                </p>
                <h2 style={{
                  fontSize: 20, fontWeight: 800, margin: '0 0 5px',
                  color: dark ? '#e4ede8' : '#1a3028', letterSpacing: '-0.4px',
                }}>
                  {user?.prenom} {user?.nom}
                </h2>
                <p style={{ fontSize: 12, color: dark ? 'rgba(130,170,148,0.7)' : 'rgba(30,80,55,0.6)', margin: '0 0 14px' }}>
                  Continuez votre parcours · La connaissance s'acquiert pas à pas
                </p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                    background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,106,79,0.08)',
                    color: tk.text2, border: `1px solid ${tk.border}`,
                  }}>
                    <ShieldCheck style={{ width: 10, height: 10 }} />
                    {role}
                  </span>
                  {['ETUDIANT','FORMATEUR'].includes(role) && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      background: dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)',
                      color: dark ? '#22c55e' : '#2d6a4f',
                      border: `1px solid ${dark ? 'rgba(34,197,94,0.22)' : 'rgba(45,106,79,0.2)'}`,
                    }}>
                      <Star style={{ width: 10, height: 10 }} />
                      Apprenant actif
                    </span>
                  )}
                </div>
              </div>

              {profil && (
                <div style={{
                  padding: '16px 22px', borderRadius: 14, flexShrink: 0, textAlign: 'center',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)',
                  border: `1px solid ${tk.border}`,
                }}>
                  <p style={{ fontSize: 9, color: tk.text3, fontWeight: 700, letterSpacing: '1px',
                    textTransform: 'uppercase', marginBottom: 3 }}>Points XP</p>
                  <p style={{
                    fontSize: 38, fontWeight: 800, margin: '0 0 2px', lineHeight: 1,
                    color: dark ? '#f59e0b' : '#b45309',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    <Counter to={profil.points_xp_total ?? 0} />
                  </p>
                  <p style={{ fontSize: 9, color: tk.text3, marginBottom: 10 }}>XP accumulés</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {[
                      { l: 'Parcours', v: profil.nb_parcours ?? 0 },
                      { l: 'Cours OK', v: profil.nb_cours_termines ?? 0 },
                    ].map(({ l, v }) => (
                      <div key={l} style={{
                        padding: '6px 0', borderRadius: 8, textAlign: 'center',
                        background: dark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${dark ? 'rgba(34,197,94,0.15)' : 'rgba(45,106,79,0.15)'}`,
                      }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: tk.accentGreen,
                          margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{v}</p>
                        <p style={{ fontSize: 9, color: tk.text3, margin: 0 }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats KPI */}
            {profil && (
              <div className="iq-f2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 11 }}>
                {[
                  { label: 'Inscrits', value: profil.nb_parcours ?? 0, icon: BookOpen, color: dark ? '#22c55e' : '#2d6a4f' },
                  { label: 'Cours terminés', value: profil.nb_cours_termines ?? 0, icon: CheckCircle, color: '#3b82f6' },
                  { label: 'Progression moy.', value: profil.progression_moyenne ?? 0, icon: Target, color: '#a855f7', suffix: '%' },
                  { label: 'Complétés', value: termines.length, icon: Award, color: '#f59e0b' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} style={{
                      borderRadius: 14, padding: '16px 18px',
                      background: tk.surface, border: `1px solid ${tk.border}`,
                      boxShadow: dark ? 'none' : '0 2px 10px rgba(45,106,79,0.06)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: -14, right: -14, width: 58, height: 58,
                        borderRadius: '50%', background: `${stat.color}14`, filter: 'blur(12px)',
                        pointerEvents: 'none',
                      }} />
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, marginBottom: 11,
                        background: `${stat.color}12`, border: `1px solid ${stat.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon style={{ width: 13, height: 13, color: stat.color }} />
                      </div>
                      <div style={{
                        fontSize: 24, fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 3,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        <Counter to={stat.value} />{stat.suffix ?? ''}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: tk.text2 }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="iq-f3" style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <Link to="/lms/progression" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(110deg, #2d6a4f, #52b788)',
                color: '#fff', textDecoration: 'none',
                boxShadow: '0 5px 18px rgba(45,106,79,0.25)',
              }}>
                <TrendingUp style={{ width: 13, height: 13 }} />
                Ma progression
              </Link>
              {['ADMIN','FORMATEUR'].includes(role) && (
                <Link to="/lms/formateur" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.07)',
                  color: tk.text2, textDecoration: 'none', border: `1px solid ${tk.border}`,
                }}>
                  <ShieldCheck style={{ width: 13, height: 13 }} />
                  Espace formateur
                </Link>
              )}
            </div>

            {/* Parcours en cours */}
            {enCours.length > 0 && (
              <div className="iq-f3">
                <SectionHeader icon={Play} title="Parcours en cours" sub={`${enCours.length} actif${enCours.length > 1 ? 's' : ''}`} color={dark ? '#22c55e' : '#2d6a4f'} dark={dark} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 13 }}>
                  {enCours.map((p: Record<string, unknown>) => (
                    <ParcoursTile key={String(p.id_parcours)} parcours={p} onInscrire={inscrire} dark={dark} />
                  ))}
                </div>
              </div>
            )}

            {/* Catalogue */}
            <div className="iq-f4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <SectionHeader icon={BookOpen} title="Catalogue des parcours" sub={`${parcours.length} disponibles`} color={'#3b82f6'} dark={dark} />
              </div>

              {parcours.length === 0 ? (
                <div style={{
                  borderRadius: 16, padding: '48px 0', textAlign: 'center',
                  background: tk.surface, border: `1px solid ${tk.border}`,
                  boxShadow: dark ? 'none' : '0 2px 10px rgba(45,106,79,0.06)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen style={{ width: 18, height: 18, color: tk.text3 }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: tk.text2, margin: '0 0 4px' }}>
                    Aucun parcours disponible
                  </p>
                  <p style={{ fontSize: 12, color: tk.text3, margin: 0 }}>
                    Les parcours seront publiés prochainement
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 13 }}>
                  {parcours.map((p: Record<string, unknown>) => (
                    <ParcoursTile key={String(p.id_parcours)} parcours={p} onInscrire={inscrire} dark={dark} />
                  ))}
                </div>
              )}
            </div>

            {/* Parcours terminés */}
            {termines.length > 0 && (
              <div className="iq-f5">
                <SectionHeader icon={Award} title="Parcours complétés" sub={`${termines.length} certification${termines.length > 1 ? 's' : ''}`} color={'#f59e0b'} dark={dark} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 13 }}>
                  {termines.map((p: Record<string, unknown>) => (
                    <ParcoursTile key={String(p.id_parcours)} parcours={p} onInscrire={inscrire} dark={dark} />
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="iq-f6" style={{ textAlign: 'center', paddingBottom: 8 }}>
              <p style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                color: dark ? 'rgba(80,120,95,0.35)' : 'rgba(30,80,55,0.28)',
              }}>
                IQcarb Learning · {new Date().getFullYear()} · GHG Protocol · ISO 14064 · MRV
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}