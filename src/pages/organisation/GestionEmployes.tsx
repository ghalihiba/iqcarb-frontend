/**
 * GestionEmployes.tsx — Tableau de bord RH de l'entreprise
 * ─────────────────────────────────────────────────────────────
 * Route : /organisation/employes
 * Rôle  : ENTREPRISE uniquement
 *
 * Fonctionnalités :
 *  • Voir la liste de ses employés + progression LMS
 *  • Ajouter un employé par email (il doit déjà avoir un compte)
 *  • Retirer un employé
 *  • Voir les certificats obtenus par chaque employé
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import Sidebar          from '@/components/common/Sidebar';
import PageNotifications from '@/components/common/PageNotifications';
import { useAuth }      from '@/hooks/useAuth';
import axios            from 'axios';
import {
  Users, UserPlus, Trash2, RefreshCw, Award,
  BookOpen, TrendingUp, Mail, CheckCircle2,
  AlertCircle, ChevronRight, Building2, Search,
} from 'lucide-react';

// ─── Hook dark mode ───────────────────────────────────────────
function useDark() {
  const [d, setD] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setD(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return d;
}

// ─── API helper ───────────────────────────────────────────────
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// ─── Types ────────────────────────────────────────────────────
interface EmployeStats {
  nb_parcours:      number;
  nb_certificats:   number;
  progression_moy:  number;
  nb_en_cours:      number;
}

interface Employe {
  id_utilisateur:  string;
  prenom:          string;
  nom:             string;
  email:           string;
  photo_profil?:   string;
  statut_employe:  'ACTIF' | 'SUSPENDU' | 'RETIRE';
  date_ajout:      string;
  roles:           string[];
  stats_lms:       EmployeStats;
}

interface OrganisationData {
  id_organisation: string;
  nb_employes:     number;
  employes:        Employe[];
}

// ─── Tokens couleurs ──────────────────────────────────────────
function tk(dark: boolean) {
  return {
    bg:       dark ? '#0f1612' : '#f4f9f6',
    surface:  dark ? '#141e18' : '#ffffff',
    border:   dark ? 'rgba(255,255,255,0.07)' : 'rgba(45,106,79,0.12)',
    text1:    dark ? '#e4ede8' : '#1a3028',
    text2:    dark ? 'rgba(160,190,170,0.7)' : 'rgba(30,80,55,0.6)',
    text3:    dark ? 'rgba(100,140,115,0.5)' : 'rgba(30,80,55,0.4)',
    headerBg: dark ? 'rgba(15,22,18,0.94)'   : 'rgba(244,249,246,0.96)',
    inputBg:  dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.04)',
    green:    dark ? '#22c55e' : '#2d6a4f',
    dot:      dark ? 'rgba(255,255,255,0.028)' : 'rgba(45,106,79,0.04)',
  };
}

// ─── Barre de progression ─────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(pct), 200); }, [pct]);
  return (
    <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ height: '100%', width: `${w}%`, borderRadius: 99, background: color, transition: 'width 1s ease', boxShadow: `0 0 5px ${color}50` }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Page principale
// ═════════════════════════════════════════════════════════════
export default function GestionEmployes() {
  const dark  = useDark();
  const T     = tk(dark);
  const { user } = useAuth();

  const [data,       setData]       = useState<OrganisationData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [ajoutLoading, setAjoutLoading] = useState(false);
  const [search,     setSearch]     = useState('');
  const [message,    setMessage]    = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  const nom_organisation = user?.nom_organisation ?? user?.nom ?? 'Mon organisation';

  // ── Fetch ──────────────────────────────────────────────────
  const fetchEmployes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/employes');
      setData(res.data.data);
    } catch {
      affMsg('err', 'Impossible de charger les employés.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployes(); }, [fetchEmployes]);

  const affMsg = (type: 'ok'|'err', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  // ── Ajouter un employé ─────────────────────────────────────
  const ajouterEmploye = async () => {
    if (!emailInput.trim()) return affMsg('err', 'Saisissez un email.');
    try {
      setAjoutLoading(true);
      const res = await api.post('/auth/employes', { email: emailInput.trim() });
      affMsg('ok', res.data.message ?? 'Employé ajouté.');
      setEmailInput('');
      fetchEmployes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      affMsg('err', e?.response?.data?.message ?? 'Erreur lors de l\'ajout.');
    } finally {
      setAjoutLoading(false);
    }
  };

  // ── Retirer un employé ─────────────────────────────────────
  const retirerEmploye = async (emp: Employe) => {
    if (!confirm(`Retirer ${emp.prenom} ${emp.nom} de votre organisation ?`)) return;
    try {
      await api.delete(`/auth/employes/${emp.id_utilisateur}`);
      affMsg('ok', `${emp.prenom} ${emp.nom} a été retiré.`);
      fetchEmployes();
    } catch {
      affMsg('err', 'Erreur lors du retrait.');
    }
  };

  // ── Filtrage par recherche ─────────────────────────────────
  const employes = (data?.employes ?? []).filter(emp =>
    `${emp.prenom} ${emp.nom} ${emp.email}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Styles communs ─────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
    padding: 20, boxShadow: dark ? 'none' : '0 2px 10px rgba(45,106,79,0.06)',
  };
  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 9, fontSize: 12.5,
    background: T.inputBg, border: `1px solid ${T.border}`,
    color: T.text1, fontFamily: 'Syne, sans-serif', outline: 'none',
  };
  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    background: 'linear-gradient(110deg, #2d6a4f, #52b788)', color: '#fff',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(45,106,79,0.25)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes iqFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes iqDot    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes iqSpin   { to{transform:rotate(360deg)} }
        .iq-page { animation: iqFadeUp 0.4s ease both; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'Syne',sans-serif", color: T.text1 }}>
        <Sidebar />

        <main style={{ marginLeft: 240, flex: 1, overflowY: 'auto', position: 'relative' }}>

          {/* Grille décorative */}
          <div style={{
            position: 'fixed', inset: 0, marginLeft: 240, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `radial-gradient(circle, ${T.dot} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          {/* Header sticky */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20, background: T.headerBg,
            backdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.border}`,
            padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, animation: 'iqDot 2.2s ease-in-out infinite' }} />
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 800, color: T.text1, margin: 0, letterSpacing: '-0.4px' }}>
                  Gestion des employés
                </h1>
                <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>
                  {nom_organisation} · {data?.nb_employes ?? 0} membre{(data?.nb_employes ?? 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PageNotifications />
              <button onClick={fetchEmployes} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                background: T.inputBg, border: `1px solid ${T.border}`, color: T.text2,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
                Actualiser
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>

            {/* Toast */}
            {message && (
              <div style={{
                position: 'fixed', top: 80, right: 24, zIndex: 100,
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRadius: 11, fontSize: 12, fontWeight: 600,
                background: message.type === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${message.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: message.type === 'ok' ? '#22c55e' : '#ef4444',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                animation: 'iqFadeUp 0.3s ease',
              }}>
                {message.type === 'ok' ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                {message.text}
              </div>
            )}

            {/* ── Bannière organisation ─────────────────────── */}
            <div className="iq-page" style={{
              borderRadius: 16, padding: '18px 22px',
              background: dark
                ? 'linear-gradient(115deg, rgba(18,45,30,0.98) 0%, rgba(12,28,20,0.99) 100%)'
                : 'linear-gradient(115deg, rgba(210,240,225,0.9) 0%, rgba(232,248,240,0.95) 100%)',
              border: `1px solid ${dark ? 'rgba(34,197,94,0.18)' : 'rgba(45,106,79,0.18)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <Building2 style={{ width: 14, height: 14, color: T.green }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.green, letterSpacing: '0.5px' }}>
                    Organisation
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text1, margin: '0 0 3px', letterSpacing: '-0.3px' }}>
                  {nom_organisation}
                </h2>
                <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>
                  Gérez vos employés et suivez leur progression sur la plateforme LMS IQcarb.
                </p>
              </div>
              {/* Stats globales */}
              <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                {[
                  { label: 'Employés', v: data?.nb_employes ?? 0, c: T.green },
                  { label: 'Cours actifs', v: (data?.employes ?? []).reduce((s, e) => s + e.stats_lms.nb_en_cours, 0), c: '#3b82f6' },
                  { label: 'Certificats', v: (data?.employes ?? []).reduce((s, e) => s + e.stats_lms.nb_certificats, 0), c: '#f59e0b' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(45,106,79,0.06)', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: kpi.c, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{kpi.v}</div>
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 2 }}>{kpi.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Ajouter un employé ──────────────────────────── */}
            <div className="iq-page" style={cardStyle}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus style={{ width: 14, height: 14, color: T.green }} />
                Ajouter un employé
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: T.text3 }} />
                  <input
                    style={{ ...inputStyle, width: '100%', paddingLeft: 32, boxSizing: 'border-box' }}
                    type="email" placeholder="email@employe.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') ajouterEmploye(); }}
                  />
                </div>
                <button style={btnPrimary} onClick={ajouterEmploye} disabled={ajoutLoading}>
                  {ajoutLoading
                    ? <RefreshCw style={{ width: 13, height: 13, animation: 'iqSpin 0.8s linear infinite' }} />
                    : <UserPlus style={{ width: 13, height: 13 }} />
                  }
                  Ajouter
                </button>
              </div>
              <p style={{ fontSize: 11, color: T.text3, margin: '10px 0 0' }}>
                L'employé doit déjà avoir créé son compte IQcarb. Il recevra l'accès aux cours et vous pourrez suivre sa progression.
              </p>
            </div>

            {/* ── Liste des employés ──────────────────────────── */}
            <div className="iq-page" style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text1, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users style={{ width: 14, height: 14, color: '#3b82f6' }} />
                  Mes employés ({employes.length})
                </p>
                {/* Recherche */}
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3 }} />
                  <input
                    style={{ ...inputStyle, paddingLeft: 28, fontSize: 11.5, width: 180, boxSizing: 'border-box' }}
                    placeholder="Rechercher…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: T.text3 }}>
                  <RefreshCw style={{ width: 20, height: 20, animation: 'iqSpin 0.8s linear infinite', margin: '0 auto' }} />
                  <p style={{ marginTop: 10, fontSize: 12 }}>Chargement…</p>
                </div>
              ) : employes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px', background: T.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 18, height: 18, color: T.text3 }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text2, margin: '0 0 5px' }}>
                    {search ? 'Aucun résultat' : 'Aucun employé'}
                  </p>
                  <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>
                    {search ? 'Modifiez votre recherche.' : 'Ajoutez votre premier employé ci-dessus.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {employes.map(emp => {
                    const stats = emp.stats_lms;
                    return (
                      <div key={emp.id_utilisateur} style={{
                        borderRadius: 12, padding: '14px 16px',
                        background: dark ? 'rgba(255,255,255,0.025)' : 'rgba(45,106,79,0.03)',
                        border: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 14,
                        transition: 'border-color 0.2s',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: 'white',
                          boxShadow: '0 3px 10px rgba(45,106,79,0.25)',
                        }}>
                          {`${emp.prenom?.[0] ?? ''}${emp.nom?.[0] ?? ''}`.toUpperCase()}
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>
                              {emp.prenom} {emp.nom}
                            </span>
                            {emp.statut_employe === 'ACTIF' && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.22)' }}>
                                ACTIF
                              </span>
                            )}
                            {emp.roles.map(r => (
                              <span key={r} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                                {r}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: T.text3, marginBottom: 6 }}>{emp.email}</div>

                          {/* Stats LMS */}
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <BookOpen style={{ width: 11, height: 11, color: '#3b82f6' }} />
                              <span style={{ fontSize: 11, color: T.text2 }}>
                                {stats.nb_parcours} parcours
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Award style={{ width: 11, height: 11, color: '#f59e0b' }} />
                              <span style={{ fontSize: 11, color: T.text2 }}>
                                {stats.nb_certificats} certificat{stats.nb_certificats > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                              <TrendingUp style={{ width: 11, height: 11, color: T.green, flexShrink: 0 }} />
                              <Bar pct={stats.progression_moy} color={T.green} />
                              <span style={{ fontSize: 10, color: T.green, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                                {stats.progression_moy}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => retirerEmploye(emp)}
                            style={{
                              padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                              color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Trash2 style={{ width: 11, height: 11 }} /> Retirer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}