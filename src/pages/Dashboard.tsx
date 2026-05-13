/**
 * Dashboard.tsx — Dashboard Carbone Entreprise
 * ─────────────────────────────────────────────────────────────
 * Design cohérent avec Login.tsx :
 * - Light mode : fond #f4f9f6 (vert pâle naturel), cartes blanches, textes foncés
 * - Dark mode  : fond #0f1612, cartes #141e18, textes clairs
 * - Détection via classe html.dark (ThemeToggle existant)
 * - Logique données conservée : useDashboard, useConformite
 */

import { useEffect, useState, useRef } from 'react';
import ConformiteDashboard from '@/components/conformite/ConformiteDashboard';
import { useConformite }   from '@/hooks/useConformite';
import Sidebar             from '@/components/common/Sidebar';
import PageNotifications   from '@/components/common/PageNotifications';
import LoadingSpinner      from '@/components/common/LoadingSpinner';
import { useDashboard }    from '@/hooks/useDashboard';
import {
  Leaf, Activity, FileText, TrendingDown, TrendingUp,
  RefreshCw, Shield, BarChart3, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Zap, Globe2, BookOpen,
  ArrowUpRight, Target, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

// ─── Tokens design selon mode ─────────────────────────────────
function tokens(dark: boolean) {
  return {
    bg:       dark ? '#0f1612'              : '#f4f9f6',
    surface:  dark ? '#141e18'              : '#ffffff',
    surface2: dark ? 'rgba(20,30,24,0.95)' : '#ffffff',
    border:   dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,106,79,0.12)',
    border2:  dark ? 'rgba(255,255,255,0.12)' : 'rgba(45,106,79,0.2)',
    text1:    dark ? '#e4ede8'              : '#1a3028',
    text2:    dark ? 'rgba(160,190,170,0.7)': 'rgba(30,80,55,0.6)',
    text3:    dark ? 'rgba(100,140,115,0.5)': 'rgba(30,80,55,0.4)',
    headerBg: dark ? 'rgba(15,22,18,0.94)'  : 'rgba(244,249,246,0.96)',
    dotGrid:  dark ? 'rgba(255,255,255,0.028)' : 'rgba(45,106,79,0.04)',
    scanLine: dark ? 'rgba(34,197,94,0.35)'    : 'rgba(45,106,79,0.2)',
    bannerBg: dark
      ? 'linear-gradient(115deg, rgba(18,45,30,0.98) 0%, rgba(12,28,20,0.99) 100%)'
      : 'linear-gradient(115deg, rgba(210,240,225,0.9) 0%, rgba(232,248,240,0.95) 100%)',
    bannerBorder: dark ? 'rgba(34,197,94,0.2)' : 'rgba(45,106,79,0.2)',
    bannerTitle:  dark ? '#e4ede8'              : '#1a3028',
    bannerSub:    dark ? 'rgba(130,170,148,0.7)': 'rgba(30,80,55,0.6)',
    accentLabel:  dark ? '#f59e0b'              : '#b45309',
    kpiBg:        dark ? 'rgba(20,30,24,0.95)'  : '#ffffff',
    progressBg:   dark ? 'rgba(255,255,255,0.06)': 'rgba(45,106,79,0.08)',
    rowHover:     dark ? 'rgba(255,255,255,0.03)': 'rgba(45,106,79,0.04)',
  };
}

// ─── Compteur animé ───────────────────────────────────────────
function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [v, setV] = useState(0);
  const r = useRef<number>(0);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 1400, 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) r.current = requestAnimationFrame(tick);
    };
    r.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r.current);
  }, [to]);
  return <>{v.toFixed(decimals)}</>;
}

// ─── Barre de progression animée ─────────────────────────────
function Bar({ pct, color, delay = 0, bgColor }: {
  pct: number; color: string; delay?: number; bgColor: string;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 250 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
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

// ─── Donut SVG ────────────────────────────────────────────────
function Donut({ s1 = 0, s2 = 0, s3 = 0, dark }: {
  s1?: number; s2?: number; s3?: number; dark: boolean;
}) {
  const total = s1 + s2 + s3 || 1;
  const R = 52, cx = 68, cy = 68, sw = 14;
  const circ = 2 * Math.PI * R;
  let off = 0;
  const segs = [
    { v: s1, c: '#ef4444' },
    { v: s2, c: '#3b82f6' },
    { v: s3, c: '#f59e0b' },
  ];
  return (
    <svg viewBox="0 0 136 136" style={{ width: 136, height: 136 }}>
      <circle cx={cx} cy={cy} r={R} fill="none"
        stroke={dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.08)'}
        strokeWidth={sw} />
      {segs.map((sg, i) => {
        const dash = (sg.v / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={sg.c} strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-off}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
              filter: `drop-shadow(0 0 4px ${sg.c}60)`,
            }} />
        );
        off += dash;
        return el;
      })}
      <text x={cx} y={cy - 5} textAnchor="middle"
        style={{ fill: dark ? '#e4ede8' : '#1a3028', fontSize: 12, fontWeight: 700, fontFamily: 'Syne,sans-serif' }}>
        {(s1+s2+s3).toFixed(2)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ fill: dark ? 'rgba(160,190,170,0.5)' : 'rgba(30,80,55,0.45)', fontSize: 8, fontFamily: 'Syne,sans-serif' }}>
        tCO₂e
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const dark = useDarkMode();
  const T = tokens(dark);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('iq-sidebar-collapsed') === '1'
  );

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

  const { data: conformiteData } = useConformite();
  const { dashboard, loading, error, refetch } = useDashboard();

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'Syne',sans-serif" }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--iq-sidebar-width, 240px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: `3px solid ${T.border2}`,
            borderTopColor: '#2d6a4f', borderRadius: '50%',
            animation: 'iqSpin 0.8s linear infinite', margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: 13, color: T.text2 }}>Chargement...</p>
        </div>
      </main>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--iq-sidebar-width, 240px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{
          padding: '18px 22px', borderRadius: 14,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#ef4444', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {error}
          <button onClick={refetch} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}>Réessayer</button>
        </div>
      </main>
    </div>
  );

  const kpis      = dashboard?.kpis;
  const scopes    = dashboard?.repartition_scopes ?? null;
  const evolution = dashboard?.evolution_annuelle ?? [];
  const mrv       = dashboard?.statut_mrv;
  const activites = dashboard?.activites_recentes ?? [];
  const org       = dashboard?.organisation;
  const isOk      = (kpis?.co2e_derniere_annee ?? 0) <= (org?.objectif ?? Infinity);

  const s1v = parseFloat(String(scopes?.SCOPE_1?.valeur ?? 0));
  const s2v = parseFloat(String(scopes?.SCOPE_2?.valeur ?? 0));
  const s3v = parseFloat(String(scopes?.SCOPE_3?.valeur ?? 0));
  const totalE = s1v + s2v + s3v;
  const globalConformiteScore = typeof conformiteData?.score_global === 'number'
    ? conformiteData.score_global
    : null;
  const conformiteRows = ((conformiteData?.standards?.length ? conformiteData.standards : [
    { code: 'GHG', pourcentage: 0 },
    { code: 'ISO', pourcentage: 0 },
    { code: 'MRV', pourcentage: 0 },
  ])).map((std) => ({
    l: std.code === 'GHG' ? 'GHG Protocol' : std.code === 'ISO' ? 'ISO 14064' : std.code,
    p: std.pourcentage,
    c: std.code === 'MRV' ? '#f59e0b' : '#22c55e',
  }));
  const actionsConformite = (conformiteData?.standards ?? [])
    .flatMap((std) => std.checks)
    .filter((check) => check.obligatoire && !check.statut).length;

  const kpiCards = [
    { label: 'Émissions totales', val: (kpis?.co2e_derniere_annee ?? 0).toFixed(4), unit: ' tCO₂e',
      sub: `Année ${kpis?.derniere_annee ?? new Date().getFullYear()}`,
      icon: Leaf, color: '#22c55e', glow: 'rgba(34,197,94,0.12)', trend: '↓ 12.4%', trendOk: true },
    { label: 'Activités validées', val: String(mrv?.monitoring?.activites_validees ?? 0), unit: '',
      sub: 'Données collectées',
      icon: Activity, color: '#3b82f6', glow: 'rgba(59,130,246,0.12)', trend: '↑ 2', trendOk: false },
    { label: 'Score conformité', val: globalConformiteScore !== null ? String(globalConformiteScore) : '—', unit: globalConformiteScore !== null ? '%' : '',
      sub: 'GHG · ISO 14064 · MRV',
      icon: Shield, color: '#f59e0b', glow: 'rgba(245,158,11,0.12)', trend: '↑ 5.2%', trendOk: false },
    { label: 'Objectif réduction', val: org?.objectif ? String(org.objectif) : '—', unit: org?.objectif ? ' t' : '',
      sub: isOk ? 'Objectif atteint' : 'Objectif non atteint',
      icon: isOk ? TrendingDown : Target, color: isOk ? '#22c55e' : '#ef4444',
      glow: isOk ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      trend: '−30%', trendOk: true },
  ];

  const scopeRows = [
    { label: 'Scope 1 — Directes',        val: s1v, color: '#ef4444', pct: totalE ? (s1v/totalE)*100 : 0 },
    { label: 'Scope 2 — Énergie',          val: s2v, color: '#3b82f6', pct: totalE ? (s2v/totalE)*100 : 0 },
    { label: 'Scope 3 — Chaîne de valeur', val: s3v, color: '#f59e0b', pct: totalE ? (s3v/totalE)*100 : 0 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes iqFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iqSpin    { to{transform:rotate(360deg)} }
        @keyframes iqDot     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes iqScan    { 0%{top:-2px} 100%{top:calc(100% + 2px)} }
        .iq-f1{animation:iqFadeUp .5s ease .04s both}
        .iq-f2{animation:iqFadeUp .5s ease .10s both}
        .iq-f3{animation:iqFadeUp .5s ease .18s both}
        .iq-f4{animation:iqFadeUp .5s ease .26s both}
        .iq-f5{animation:iqFadeUp .5s ease .34s both}
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'Syne',sans-serif", color: T.text1 }}>
        <Sidebar />

        <main style={{ marginLeft: 'var(--iq-sidebar-width, 240px)', flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

          {/* Grille de points subtile */}
          <div style={{
            position: 'fixed', inset: 0, marginLeft: 'var(--iq-sidebar-width, 240px)', pointerEvents: 'none', zIndex: 0,
            backgroundImage: `radial-gradient(circle, ${T.dotGrid} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          {/* Header sticky */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20,
            background: T.headerBg,
            backdropFilter: 'blur(14px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
            borderBottom: `1px solid ${T.border}`,
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
                  border: `1px solid ${T.border}`,
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)',
                  color: T.text2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen style={{ width: 15, height: 15 }} />
                  : <PanelLeftClose style={{ width: 15, height: 15 }} />
                }
              </button>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                animation: 'iqDot 2.2s ease-in-out infinite',
              }} />
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 800, color: T.text1, margin: 0, letterSpacing: '-0.4px' }}>
                  Dashboard Carbone
                </h1>
                <p style={{ fontSize: 11.5, color: T.text3, margin: 0 }}>
                  {org?.nom ?? ''}{org?.secteur ? ` — ${org.secteur}` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PageNotifications />
              <button onClick={refetch} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.07)',
                border: `1px solid ${T.border}`,
                color: T.text2, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}>
                <RefreshCw style={{ width: 13, height: 13 }} />
                Actualiser
              </button>
            </div>
          </div>

          <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>

            {/* Bannière objectif */}
            <div className="iq-f1" style={{
              borderRadius: 18, padding: '22px 26px',
              background: T.bannerBg,
              border: `1px solid ${T.bannerBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Scan line */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: '1px',
                background: `linear-gradient(90deg, transparent, ${T.scanLine}, transparent)`,
                animation: 'iqScan 4s ease-in-out infinite',
              }} />
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
                  textTransform: 'uppercase', color: T.accentLabel,
                  margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    width: 14, height: 14,
                    background: T.accentLabel + '20',
                    border: `1px solid ${T.accentLabel}40`,
                    borderRadius: 4, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 9,
                  }}>⚡</span>
                  Trajectoire 2030
                </p>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: T.bannerTitle, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                  Réduction de 30% des émissions GES
                </h2>
                <p style={{ fontSize: 12, color: T.bannerSub, margin: 0 }}>
                  {org?.nom} · Aligné Accord de Paris · SBTi
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link to="/rapports" style={{
                  padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: dark ? 'rgba(34,197,94,0.12)' : 'rgba(45,106,79,0.1)',
                  color: dark ? '#22c55e' : '#2d6a4f',
                  border: `1px solid ${dark ? 'rgba(34,197,94,0.25)' : 'rgba(45,106,79,0.2)'}`,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <BarChart3 style={{ width: 13, height: 13 }} />
                  Rapports
                </Link>
                <Link to="/lms" style={{
                  padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.06)',
                  color: T.text2,
                  border: `1px solid ${T.border}`,
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <BookOpen style={{ width: 13, height: 13 }} />
                  Formation
                </Link>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="iq-f2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {kpiCards.map((k, i) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} style={{
                    borderRadius: 16, padding: '18px 20px',
                    background: T.kpiBg,
                    border: `1px solid ${T.border}`,
                    position: 'relative', overflow: 'hidden',
                    boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = k.color + '40';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${k.color}18`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = T.border;
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)';
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -16, right: -16, width: 70, height: 70,
                      borderRadius: '50%', background: k.glow, filter: 'blur(14px)', pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: k.glow,
                        border: `1px solid ${k.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon style={{ width: 15, height: 15, color: k.color }} />
                      </div>
                      <div style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: k.trendOk
                          ? (dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)')
                          : (dark ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.08)'),
                        color: k.trendOk ? '#22c55e' : (dark ? '#ef4444' : '#3b82f6'),
                        border: `1px solid ${k.trendOk ? 'rgba(34,197,94,0.22)' : 'rgba(59,130,246,0.2)'}`,
                      }}>
                        {k.trend}
                      </div>
                    </div>

                    <div style={{
                      fontSize: 26, fontWeight: 800, color: k.color,
                      letterSpacing: '-1px', lineHeight: 1, marginBottom: 4,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {k.val}<span style={{ fontSize: 12 }}>{k.unit}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 11, color: T.text3 }}>{k.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Ligne 2 : Scopes + Évolution + MRV */}
            <div className="iq-f3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>

              {/* Donut scopes */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Répartition par Scope</p>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 16px' }}>
                  GHG Protocol · {kpis?.derniere_annee ?? new Date().getFullYear()}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <Donut s1={s1v} s2={s2v} s3={s3v} dark={dark} />
                </div>
                {scopeRows.map((sr, i) => (
                  <div key={sr.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: sr.color }}>{sr.label}</span>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: T.text2 }}>
                        {sr.val.toFixed(3)} t
                      </span>
                    </div>
                    <Bar pct={sr.pct} color={sr.color} delay={i*100} bgColor={T.progressBg} />
                  </div>
                ))}
              </div>

              {/* Évolution */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Évolution annuelle</p>
                    <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Émissions par scope · tCO₂e</p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
                    background: dark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)',
                    border: `1px solid ${dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.22)'}`,
                  }}>
                    <TrendingDown style={{ width: 11, height: 11, color: '#22c55e' }} />
                    <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      −12.4%
                    </span>
                  </div>
                </div>

                {evolution.length > 0 ? (
                  <svg viewBox="0 0 400 130" style={{ width: '100%', height: 130 }}>
                    {[0,1,2,3].map(i => (
                      <line key={i} x1="0" y1={i*30+10} x2="400" y2={i*30+10}
                        stroke={dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)'}
                        strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    {evolution.slice(-12).map((e: Record<string, unknown>, i: number, arr: Record<string, unknown>[]) => {
                      const maxV = Math.max(...arr.map((x: Record<string, unknown>) => parseFloat(String(x?.total ?? 0)) || 0.1));
                      const v = parseFloat(String(e?.total ?? 0)) || 0;
                      const bH = Math.max((v / maxV) * 100, 2);
                      const x = i * (400/12) + 3;
                      const bW = (400/12) - 6;
                      const isLast = i === arr.length - 1;
                      return (
                        <rect key={i} x={x} y={120 - bH} width={bW} height={bH}
                          rx="3"
                          fill={isLast
                            ? (dark ? '#22c55e' : '#2d6a4f')
                            : (dark ? `rgba(34,197,94,${0.2+(v/maxV)*0.45})` : `rgba(45,106,79,${0.18+(v/maxV)*0.4})`)
                          }
                          style={{ filter: isLast ? `drop-shadow(0 0 5px ${dark ? 'rgba(34,197,94,0.5)' : 'rgba(45,106,79,0.4)'})` : 'none' }}
                        />
                      );
                    })}
                    {['J','F','M','A','M','J','J','A','S','O','N','D'].map((m, i) => (
                      <text key={m} x={i*(400/12)+(400/24)} y={128} textAnchor="middle"
                        style={{ fill: T.text3, fontSize: 8, fontFamily: 'JetBrains Mono' }}>
                        {m}
                      </text>
                    ))}
                  </svg>
                ) : (
                  <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 12 }}>
                    Aucune donnée disponible
                  </div>
                )}

                <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                  {[{ l: 'Scope 1', c: '#ef4444' }, { l: 'Scope 2', c: '#3b82f6' }, { l: 'Scope 3', c: '#f59e0b' }].map(sc => (
                    <div key={sc.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.c }} />
                      <span style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>{sc.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MRV + Conformité */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Statut MRV</p>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 14px' }}>Monitoring · Reporting · Vérification</p>

                {[
                  { l: 'Monitoring',   sub: `${mrv?.monitoring?.activites_validees ?? 0} activités`, s: mrv?.monitoring?.statut ?? 'ACTIF', c: '#22c55e' },
                  { l: 'Reporting',    sub: `${mrv?.reporting?.nb_rapports ?? 0} rapport(s)`, s: mrv?.reporting?.statut ?? 'ACTIF', c: '#22c55e' },
                  { l: 'Vérification', sub: 'En attente de validation', s: mrv?.verification?.statut ?? 'EN_ATTENTE', c: '#f59e0b' },
                ].map(({ l, sub, s, c }) => (
                  <div key={l} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 11px', borderRadius: 10, marginBottom: 6,
                    background: dark ? 'rgba(255,255,255,0.025)' : 'rgba(45,106,79,0.04)',
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(45,106,79,0.08)'}`,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.text1 }}>{l}</div>
                      <div style={{ fontSize: 10, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                      background: `${c}14`, color: c, border: `1px solid ${c}25`,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>{s}</span>
                  </div>
                ))}

                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 12,
                  background: dark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.06)',
                  border: `1px solid ${dark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.18)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Shield style={{ width: 12, height: 12, color: '#f59e0b' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>Conformité réglementaire</span>
                  </div>
                  {conformiteData
                    ? <ConformiteDashboard data={conformiteData} compact />
                    : conformiteRows.map((c, i) => (
                      <div key={c.l} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: T.text2, fontWeight: 600 }}>{c.l}</span>
                          <span style={{ fontSize: 10, color: c.c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{c.p}%</span>
                        </div>
                        <Bar pct={c.p} color={c.c} delay={i*80} bgColor={T.progressBg} />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Ligne 3 : Activités + Alertes + Formation */}
            <div className="iq-f4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>

              {/* Activités récentes */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Activités récentes</p>
                    <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Dernières saisies</p>
                  </div>
                  <span style={{
                    padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: dark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)',
                    color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    {activites.length} activité(s)
                  </span>
                </div>

                {activites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: T.text3, fontSize: 12 }}>
                    Aucune activité récente
                  </div>
                ) : activites.slice(0, 4).map((a: Record<string, unknown>, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 11px', borderRadius: 10, marginBottom: 4,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.rowHover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: dark ? 'rgba(34,197,94,0.08)' : 'rgba(45,106,79,0.08)',
                      border: `1px solid ${dark ? 'rgba(34,197,94,0.14)' : 'rgba(45,106,79,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap style={{ width: 12, height: 12, color: dark ? '#22c55e' : '#2d6a4f' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(a.description ?? a.label ?? 'Activité')}
                      </div>
                      <div style={{ fontSize: 10, color: T.text3 }}>
                        {String(a.source_emission_nom ?? a.source ?? '')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: dark ? '#22c55e' : '#2d6a4f',
                        fontFamily: 'JetBrains Mono, monospace' }}>
                        {parseFloat(String(a.total_co2e ?? 0)).toFixed(4)} t
                      </div>
                      <span style={{
                        fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: a.scope === 'SCOPE_1' ? 'rgba(239,68,68,0.12)'
                                  : a.scope === 'SCOPE_2' ? 'rgba(59,130,246,0.12)'
                                  : 'rgba(245,158,11,0.12)',
                        color: a.scope === 'SCOPE_1' ? '#ef4444'
                             : a.scope === 'SCOPE_2' ? '#3b82f6' : '#f59e0b',
                      }}>
                        {String(a.scope ?? 'S?').replace('SCOPE_', 'S')}
                      </span>
                    </div>
                    {a.statut === 'VALIDE'
                      ? <CheckCircle2 style={{ width: 13, height: 13, color: '#22c55e', flexShrink: 0 }} />
                      : <Clock        style={{ width: 13, height: 13, color: '#f59e0b', flexShrink: 0 }} />
                    }
                  </div>
                ))}

                <Link to="/activites" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '9px 0', marginTop: 8, borderRadius: 10,
                  background: dark ? 'rgba(255,255,255,0.025)' : 'rgba(45,106,79,0.05)',
                  border: `1px solid ${T.border}`,
                  color: T.text2, fontSize: 12, fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Toutes les activités
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>

              {/* Alertes */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Alertes</p>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 14px' }}>Actions requises</p>

                {[
                  { msg: 'Vérification MRV en attente de validation', type: 'warn' },
                  { msg: 'Rapport CSRD à soumettre avant le 30 juin', type: 'info' },
                  { msg: 'Nouveau facteur d\'émission disponible (ADEME)', type: 'info' },
                ].map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '10px 11px', borderRadius: 10, marginBottom: 6,
                    background: a.type === 'warn' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)',
                    border: `1px solid ${a.type === 'warn' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}`,
                  }}>
                    {a.type === 'warn'
                      ? <AlertTriangle style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                      : <Globe2        style={{ width: 12, height: 12, color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
                    }
                    <span style={{ fontSize: 11.5, color: T.text1, lineHeight: 1.5 }}>{a.msg}</span>
                  </div>
                ))}

                <div style={{
                  marginTop: 14, textAlign: 'center', padding: '16px 0', borderRadius: 12,
                  background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(45,106,79,0.04)',
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{
                    fontSize: 38, fontWeight: 800, color: '#f59e0b', lineHeight: 1,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {globalConformiteScore !== null ? <><Counter to={globalConformiteScore} />%</> : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 4, fontWeight: 600 }}>
                    Score de conformité global
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', marginTop: 8, borderRadius: 99,
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: 10, color: '#f59e0b', fontWeight: 700,
                  }}>
                    {actionsConformite > 0 ? `Partiel · ${actionsConformite} actions` : 'Conforme'}
                  </div>
                </div>
              </div>

              {/* Formation */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 18, padding: 20,
                boxShadow: dark ? 'none' : '0 2px 12px rgba(45,106,79,0.06)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>Formation</p>
                <p style={{ fontSize: 11, color: T.text3, margin: '0 0 14px' }}>IQcarb Learning Platform</p>

                {[
                  { t: 'GHG Protocol & ISO 14064', n: 'Intermédiaire', c: '#3b82f6' },
                  { t: 'Fondamentaux MRV',          n: 'Intermédiaire', c: '#a855f7' },
                  { t: 'Reporting CSRD',             n: 'Avancé',       c: '#f59e0b' },
                ].map(cp => (
                  <div key={cp.t} style={{
                    padding: '11px 12px', borderRadius: 10, marginBottom: 7,
                    background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(45,106,79,0.04)',
                    border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.text1, flex: 1, marginRight: 8 }}>{cp.t}</span>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                        background: `${cp.c}12`, color: cp.c, border: `1px solid ${cp.c}22`,
                      }}>{cp.n}</span>
                    </div>
                    <Bar pct={0} color={cp.c} bgColor={T.progressBg} />
                    <div style={{ fontSize: 9, color: T.text3, marginTop: 3 }}>Non commencé</div>
                  </div>
                ))}

                <Link to="/lms" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 0', marginTop: 8, borderRadius: 10,
                  background: dark
                    ? 'linear-gradient(110deg, rgba(34,197,94,0.1), rgba(59,130,246,0.06))'
                    : 'linear-gradient(110deg, rgba(45,106,79,0.1), rgba(82,183,136,0.07))',
                  border: `1px solid ${dark ? 'rgba(34,197,94,0.18)' : 'rgba(45,106,79,0.18)'}`,
                  color: dark ? '#22c55e' : '#2d6a4f',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                }}>
                  <BookOpen style={{ width: 12, height: 12 }} />
                  Accéder à la formation
                  <ArrowUpRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="iq-f5" style={{ textAlign: 'center', paddingBottom: 8 }}>
              <p style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                color: dark ? 'rgba(80,120,95,0.35)' : 'rgba(30,80,55,0.3)',
              }}>
                IQcarb · {new Date().getFullYear()} · GHG Protocol · ISO 14064 · CSRD · MRV
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}