/**
 * Login.tsx — IQcarb · Design Premium
 * ─────────────────────────────────────────────────────────────
 * CORRECTIONS :
 *  1. Rôle ENTREPRISE → affiche un champ "Nom de l'entreprise"
 *     (nom_organisation) distinct du prénom/nom du responsable.
 *  2. Le nom_organisation est envoyé au backend lors du register.
 *  3. Redirection après login basée sur le rôle (redirectByRole).
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail, Lock, AlertCircle, Eye, EyeOff,
  UserCircle2, Briefcase, ArrowRight, Leaf, Building2,
} from 'lucide-react';

// ─── Icônes OAuth ─────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="0"   y="0"   width="8.5" height="8.5" fill="#F25022"/>
    <rect x="9.5" y="0"   width="8.5" height="8.5" fill="#7FBA00"/>
    <rect x="0"   y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
    <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
  </svg>
);

// ─── Particules décoratives ───────────────────────────────────
const PARTICLES = [
  { id:0,  x:8,  y:15, s:6,  d:0,   dur:8  },
  { id:1,  x:22, y:72, s:9,  d:1.2, dur:11 },
  { id:2,  x:45, y:5,  s:5,  d:0.5, dur:9  },
  { id:3,  x:65, y:88, s:8,  d:2,   dur:13 },
  { id:4,  x:80, y:30, s:11, d:0.8, dur:10 },
  { id:5,  x:91, y:60, s:6,  d:3,   dur:12 },
  { id:6,  x:15, y:45, s:4,  d:1.5, dur:7  },
  { id:7,  x:55, y:55, s:7,  d:0.3, dur:14 },
  { id:8,  x:33, y:85, s:5,  d:2.5, dur:9  },
  { id:9,  x:72, y:12, s:10, d:1,   dur:11 },
  { id:10, x:88, y:80, s:6,  d:1.8, dur:8  },
  { id:11, x:5,  y:65, s:8,  d:0.6, dur:13 },
  { id:12, x:40, y:40, s:5,  d:3.5, dur:10 },
  { id:13, x:60, y:25, s:9,  d:2.2, dur:12 },
  { id:14, x:25, y:10, s:6,  d:1,   dur:9  },
  { id:15, x:75, y:70, s:7,  d:0.4, dur:11 },
];

// ─── Redirection selon le rôle ────────────────────────────────
function redirectByRole(roles: string[], navigate: ReturnType<typeof useNavigate>) {
  const role = roles?.[0];
  if (role === 'ETUDIANT')   return navigate('/lms/dashboard');
  if (role === 'ENTREPRISE') return navigate('/dashboard');
  if (role === 'FORMATEUR')  return navigate('/lms/formateur');
  if (role === 'AUDITEUR')   return navigate('/dashboard');
  return navigate('/dashboard');
}

// ═════════════════════════════════════════════════════════════
// Composant principal
// ═════════════════════════════════════════════════════════════
export default function Login() {
  const [isRegister, setIsRegister]         = useState(false);
  const [email,      setEmail]              = useState('');
  const [password,   setPassword]           = useState('');
  const [nom,        setNom]                = useState('');
  const [prenom,     setPrenom]             = useState('');
  const [role,       setRole]               = useState('ETUDIANT');
  // ── NOUVEAU : nom de l'entreprise (uniquement si role=ENTREPRISE) ──
  const [nomOrganisation, setNomOrganisation] = useState('');
  const [showPwd,    setShowPwd]            = useState(false);
  const [error,      setError]              = useState('');
  const [loading,    setLoading]            = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isEntreprise = role === 'ENTREPRISE';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation frontend pour ENTREPRISE
    if (isRegister && isEntreprise && !nomOrganisation.trim()) {
      setError('Le nom de l\'entreprise est requis.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // Envoyer nom_organisation uniquement pour ENTREPRISE
        const payload: Record<string, string> = { nom, prenom, email, password, role };
        if (isEntreprise) payload.nom_organisation = nomOrganisation.trim();
        const userData = await register(payload);
        redirectByRole(userData?.roles ?? [role], navigate);
      } else {
        const userData = await login(email, password);
        redirectByRole(userData?.roles ?? [], navigate);
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e?.response?.status;
      const msg    = e?.response?.data?.message;
      if (status === 409)      setError('Cet email est déjà utilisé.');
      else if (status === 401) setError('Email ou mot de passe incorrect.');
      else if (!status)        setError('Backend inaccessible. Vérifiez que l’API est démarrée (http://localhost:5000/api).');
      else setError(msg ?? (isRegister ? 'Impossible de créer le compte.' : 'Connexion échouée. Réessayez.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    alert(`Connexion ${provider} — à configurer avec votre provider OAuth.`);
  };

  const switchMode = (toRegister: boolean) => {
    setIsRegister(toRegister);
    setError('');
    setEmail('');
    setPassword('');
    setNomOrganisation('');
  };

  // ─── Styles partagés ──────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    paddingTop: 12, paddingBottom: 12, paddingRight: 14,
    border: '1.5px solid rgba(82,183,136,0.22)',
    borderRadius: 10, fontSize: 13, color: '#1a3a2a',
    background: 'rgba(255,255,255,0.65)',
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#3d6b50', marginBottom: 5,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    left: 12, width: 15, height: 15, color: '#7a9e87',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        @keyframes floatUp {
          0%   { transform: translateY(0)     scale(1);    opacity: 0.2; }
          50%  { transform: translateY(-18px) scale(1.08); opacity: 0.4; }
          100% { transform: translateY(0)     scale(1);    opacity: 0.2; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes breatheOrb {
          0%,100% { opacity: 0.35; transform: scale(1);    }
          50%      { opacity: 0.55; transform: scale(1.06); }
        }

        .iqcarb-login * { font-family: 'DM Sans', sans-serif; }
        .iqcarb-login .display { font-family: 'Cormorant Garamond', serif; }

        .iqcarb-login .fade-1 { animation: fadeSlideUp 0.55s ease 0.05s both; }
        .iqcarb-login .fade-2 { animation: fadeSlideUp 0.55s ease 0.15s both; }
        .iqcarb-login .fade-3 { animation: fadeSlideUp 0.55s ease 0.25s both; }
        .iqcarb-login .fade-4 { animation: fadeSlideUp 0.55s ease 0.35s both; }
        .iqcarb-login .fade-5 { animation: fadeSlideUp 0.55s ease 0.45s both; }

        .iqcarb-login .input-iq:focus {
          border-color: #52b788 !important;
          box-shadow: 0 0 0 3px rgba(82,183,136,0.14) !important;
        }

        .iqcarb-login .btn-main {
          background: linear-gradient(110deg, #2d6a4f 0%, #52b788 50%, #2d6a4f 100%);
          background-size: 200% auto;
          transition: background-position 0.5s ease, transform 0.15s, box-shadow 0.2s;
        }
        .iqcarb-login .btn-main:hover:not(:disabled) {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(45,106,79,0.38) !important;
        }
        .iqcarb-login .btn-main:active:not(:disabled) { transform: translateY(0); }

        .iqcarb-login .oauth-btn {
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
        }
        .iqcarb-login .oauth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.95) !important;
        }

        .iqcarb-login .tab-pill {
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          border: none; cursor: pointer;
        }

        /* Encadré entreprise */
        .iq-entreprise-block {
          background: rgba(45,106,79,0.05);
          border: 1.5px solid rgba(45,106,79,0.18);
          border-radius: 12px;
          padding: 14px 14px 10px;
        }
      `}</style>

      <div
        className="iqcarb-login"
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, position: 'relative',
          overflow: 'hidden',
          background: `
            radial-gradient(ellipse 90% 70% at 15% 85%, rgba(116,185,129,0.38) 0%, transparent 55%),
            radial-gradient(ellipse 70% 55% at 85% 15%, rgba(163,217,180,0.28) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 60% 60%, rgba(200,235,210,0.2) 0%, transparent 60%),
            linear-gradient(160deg, #e8f5ec 0%, #d4ead9 40%, #c8e3cc 100%)
          `,
        }}
      >
        {/* Orbes */}
        {[
          { w:550, h:550, top:-180, left:-120, d:'0s',   c:'rgba(100,180,120,0.28)' },
          { w:420, h:420, bottom:-100, right:-80, d:'3s', c:'rgba(70,150,90,0.22)'  },
          { w:300, h:300, top:'35%', right:'18%', d:'1.5s', c:'rgba(150,210,165,0.18)' },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: o.w, height: o.h,
            top: (o as Record<string,unknown>).top as number | string | undefined,
            bottom: (o as Record<string,unknown>).bottom as number | undefined,
            left: (o as Record<string,unknown>).left as number | undefined,
            right: (o as Record<string,unknown>).right as number | string | undefined,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.c}, transparent 70%)`,
            filter: 'blur(50px)',
            animation: `breatheOrb 7s ease-in-out ${o.d} infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Particules */}
        {PARTICLES.map((p) => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(82,183,136,0.5), transparent 70%)`,
            animation: `floatUp ${p.dur}s ease-in-out ${p.d}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Molécules SVG */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity:0.1 }}
          viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <g transform="translate(82 68)">
            <circle cx="0"  cy="0"  r="3.2" fill="none" stroke="#2d6a4f" strokeWidth="0.4"/>
            <circle cx="8"  cy="-5" r="2.2" fill="none" stroke="#2d6a4f" strokeWidth="0.4"/>
            <circle cx="8"  cy="5"  r="1.8" fill="none" stroke="#2d6a4f" strokeWidth="0.4"/>
            <circle cx="-8" cy="0"  r="1.5" fill="none" stroke="#2d6a4f" strokeWidth="0.4"/>
            <circle cx="0"  cy="8"  r="1.2" fill="none" stroke="#2d6a4f" strokeWidth="0.4"/>
            <line x1="3.2" y1="-1.5" x2="5.8"  y2="-4"  stroke="#2d6a4f" strokeWidth="0.35"/>
            <line x1="3.2" y1="1.5"  x2="6.2"  y2="4"   stroke="#2d6a4f" strokeWidth="0.35"/>
            <line x1="-3.2" y1="0"   x2="-6.5" y2="0"   stroke="#2d6a4f" strokeWidth="0.35"/>
            <line x1="0"   y1="3.2"  x2="0"    y2="6.8" stroke="#2d6a4f" strokeWidth="0.35"/>
          </g>
          <g transform="translate(12 20)">
            <circle cx="0"  cy="0"  r="2.5" fill="none" stroke="#3d8b5a" strokeWidth="0.4"/>
            <circle cx="6"  cy="4"  r="1.6" fill="none" stroke="#3d8b5a" strokeWidth="0.4"/>
            <circle cx="-5" cy="4"  r="1.2" fill="none" stroke="#3d8b5a" strokeWidth="0.4"/>
            <circle cx="0"  cy="-6" r="1.4" fill="none" stroke="#3d8b5a" strokeWidth="0.4"/>
            <line x1="2.5"  y1="1"   x2="4.4"  y2="3.2" stroke="#3d8b5a" strokeWidth="0.3"/>
            <line x1="-2.5" y1="1"   x2="-3.8" y2="3.2" stroke="#3d8b5a" strokeWidth="0.3"/>
            <line x1="0"    y1="-2.5" x2="0"    y2="-4.6" stroke="#3d8b5a" strokeWidth="0.3"/>
          </g>
          <g transform="translate(55 85)">
            <circle cx="0"  cy="0"  r="1.8" fill="none" stroke="#2d6a4f" strokeWidth="0.35"/>
            <circle cx="5"  cy="-3" r="1.2" fill="none" stroke="#2d6a4f" strokeWidth="0.35"/>
            <circle cx="-4" cy="-2" r="1"   fill="none" stroke="#2d6a4f" strokeWidth="0.35"/>
            <line x1="1.8"  y1="-0.8" x2="3.8"  y2="-2.4" stroke="#2d6a4f" strokeWidth="0.3"/>
            <line x1="-1.8" y1="-0.8" x2="-3.2" y2="-1.8" stroke="#2d6a4f" strokeWidth="0.3"/>
          </g>
        </svg>

        {/* ── Carte formulaire ──────────────────────────────── */}
        <div style={{
          position: 'relative', width: '100%', maxWidth: 440,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(22px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 28px 80px rgba(30,80,40,0.16), 0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Ligne verte décorative */}
          <div style={{
            height: 3,
            background: 'linear-gradient(90deg, transparent 0%, #52b788 30%, #2d6a4f 50%, #52b788 70%, transparent 100%)',
          }} />

          <div style={{ padding: '28px 32px 28px' }}>

            {/* Logo */}
            <div className="fade-1" style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 50, height: 50, borderRadius: 14, marginBottom: 12,
                background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
                boxShadow: '0 8px 24px rgba(45,106,79,0.32)',
              }}>
                <Leaf style={{ width: 22, height: 22, color: 'white' }} />
              </div>
              <h1 className="display" style={{
                fontSize: 30, fontWeight: 600, color: '#1a3a2a',
                letterSpacing: '-0.3px', lineHeight: 1, margin: 0,
              }}>
                IQcarb
              </h1>
              <p style={{ color: '#5a7a65', fontSize: 12.5, marginTop: 4, fontWeight: 400 }}>
                Plateforme intelligente de pilotage carbone
              </p>
            </div>

            {/* Onglets Connexion / Inscription */}
            <div className="fade-2" style={{
              display: 'flex', gap: 4,
              background: 'rgba(45,106,79,0.07)',
              borderRadius: 12, padding: 4, marginBottom: 20,
            }}>
              {[{ label: 'Connexion', val: false }, { label: 'Inscription', val: true }].map(({ label, val }) => (
                <button
                  key={label} type="button"
                  onClick={() => switchMode(val)}
                  className="tab-pill"
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 9,
                    fontSize: 13, fontWeight: 600,
                    color: val === isRegister ? '#2d6a4f' : '#7a9e87',
                    background: val === isRegister ? 'white' : 'transparent',
                    boxShadow: val === isRegister ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: 10, padding: '10px 13px', marginBottom: 14,
              }}>
                <AlertCircle style={{ width: 14, height: 14, color: '#dc2626', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

              {/* ── INSCRIPTION : sélection du rôle en premier ── */}
              {isRegister && (
                <div className="fade-2">
                  <label style={labelStyle}>Type de compte</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase style={{ ...iconStyle }} />
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setNomOrganisation('');
                        setError('');
                      }}
                      className="input-iq"
                      style={{
                        ...inputStyle, paddingLeft: 34,
                        appearance: 'none', WebkitAppearance: 'none',
                      }}
                    >
                      <option value="ETUDIANT">Apprenant / Étudiant</option>
                      <option value="FORMATEUR">Formateur</option>
                      <option value="AUDITEUR">Auditeur</option>
                      <option value="ENTREPRISE">Entreprise / Organisation</option>
                    </select>
                    <div style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', color: '#7a9e87', fontSize: 10,
                    }}>▼</div>
                  </div>
                </div>
              )}

              {/* ── ENTREPRISE : nom de l'organisation (apparaît dès que ENTREPRISE sélectionné) ── */}
              {isRegister && isEntreprise && (
                <div className="fade-2 iq-entreprise-block">
                  {/* Titre bloc */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <Building2 style={{ width: 14, height: 14, color: '#2d6a4f' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f' }}>
                      Informations de l'organisation
                    </span>
                  </div>

                  {/* Nom de l'entreprise — c'est CE nom qui sera affiché partout */}
                  <div style={{ marginBottom: 0 }}>
                    <label style={{ ...labelStyle, color: '#2d6a4f' }}>
                      Nom de l'entreprise *
                      <span style={{ fontSize: 11, fontWeight: 400, color: '#7a9e87', marginLeft: 5 }}>
                        (affiché dans la plateforme)
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 style={{ ...iconStyle, color: '#2d6a4f' }} />
                      <input
                        type="text"
                        value={nomOrganisation}
                        placeholder="ex : SolarTech Tunisie, GreenFactory…"
                        required={isEntreprise}
                        onChange={(e) => setNomOrganisation(e.target.value)}
                        className="input-iq"
                        style={{
                          ...inputStyle, paddingLeft: 34,
                          borderColor: 'rgba(45,106,79,0.35)',
                          background: 'rgba(255,255,255,0.8)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Prénom + Nom (toujours affiché en inscription) ── */}
              {isRegister && (
                <div className="fade-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    {
                      label: isEntreprise ? 'Prénom du responsable' : 'Prénom',
                      value: prenom, setter: setPrenom, ph: 'Marie',
                    },
                    {
                      label: isEntreprise ? 'Nom du responsable' : 'Nom',
                      value: nom, setter: setNom, ph: 'Dupont',
                    },
                  ].map(({ label, value, setter, ph }) => (
                    <div key={label}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <UserCircle2 style={{ ...iconStyle }} />
                        <input
                          type="text" value={value} placeholder={ph} required
                          onChange={(e) => setter(e.target.value)}
                          className="input-iq"
                          style={{ ...inputStyle, paddingLeft: 34 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Email */}
              <div className="fade-3">
                <label style={labelStyle}>Adresse e-mail</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ ...iconStyle }} />
                  <input
                    type="email" value={email} placeholder="nom@exemple.com" required
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-iq"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="fade-4">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Mot de passe</label>
                  {!isRegister && (
                    <button type="button" style={{
                      fontSize: 12, color: '#52b788', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}>
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ ...iconStyle }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} placeholder="Votre mot de passe" required
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-iq"
                    style={{ ...inputStyle, paddingLeft: 36, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#7a9e87',
                    display: 'flex', padding: 2,
                  }}>
                    {showPwd
                      ? <EyeOff style={{ width: 15, height: 15 }} />
                      : <Eye    style={{ width: 15, height: 15 }} />
                    }
                  </button>
                </div>
              </div>

              {/* Info entreprise — accès LMS des employés */}
              {isRegister && isEntreprise && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: 'rgba(82,183,136,0.07)',
                  border: '1px solid rgba(82,183,136,0.22)',
                  borderRadius: 9, padding: '9px 12px',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
                  <p style={{ fontSize: 12, color: '#3d6b50', margin: 0, lineHeight: 1.5 }}>
                    En tant qu'entreprise, vous pourrez <strong>inviter vos employés</strong> à rejoindre votre organisation depuis votre tableau de bord. Vos employés auront accès aux parcours LMS et vous pourrez suivre leur progression.
                  </p>
                </div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-main fade-5"
                style={{
                  width: '100%', padding: '13px 0', marginTop: 2,
                  borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  color: 'white', fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 15, height: 15,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block',
                    }} />
                    {isRegister ? 'Création...' : 'Connexion...'}
                  </>
                ) : (
                  <>
                    {isRegister ? 'Créer mon compte' : 'Me connecter'}
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>

            {/* Séparateur OAuth */}
            <div className="fade-5" style={{
              display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(45,106,79,0.1)' }} />
              <span style={{ fontSize: 12, color: '#7a9e87', fontWeight: 500 }}>ou continuer avec</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(45,106,79,0.1)' }} />
            </div>

            {/* Boutons OAuth */}
            <div className="fade-5" style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: <GoogleIcon />,    label: 'Google',    provider: 'Google'    },
                { icon: <MicrosoftIcon />, label: 'Microsoft', provider: 'Microsoft' },
              ].map(({ icon, label, provider }) => (
                <button key={label} type="button" onClick={() => handleOAuth(provider)}
                  className="oauth-btn" style={{
                    flex: 1, padding: '10px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1.5px solid rgba(45,106,79,0.12)',
                    borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#2d3748',
                  }}>
                  {icon}{label}
                </button>
              ))}
            </div>

            {/* Badges conformité */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 7, marginTop: 20, flexWrap: 'wrap',
            }}>
              {['GHG Protocol', 'ISO 14064', 'MRV'].map((b) => (
                <span key={b} style={{
                  fontSize: 11, fontWeight: 500, color: '#5a8a6a',
                  background: 'rgba(82,183,136,0.08)',
                  border: '1px solid rgba(82,183,136,0.18)',
                  borderRadius: 20, padding: '3px 9px',
                }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p style={{
          position: 'absolute', bottom: 16, left: 0, right: 0,
          textAlign: 'center', fontSize: 11.5, color: 'rgba(45,106,79,0.45)',
        }}>
          © 2025 IQcarb · Pilotage carbone & conformité climatique
        </p>
      </div>
    </>
  );
}