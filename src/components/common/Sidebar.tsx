/**
 * Sidebar.tsx — Navigation IQcarb
 * ─────────────────────────────────────────────────────────────
 * Corrections :
 *  • ENTREPRISE : affiche nom_organisation (pas prénom+nom)
 *  • ENTREPRISE : nav spécifique (Dashboard, Activités, Calculs,
 *    Rapports, Conformité, + "Mes Employés" pour gérer l'équipe)
 *  • ENTREPRISE : pas d'accès LMS direct (Apprentissage masqué)
 *  • Employés rattachés : accès LMS normal
 */

import { useEffect, useState } from 'react';
import { GraduationCap, Shield, Users } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth }    from '@/hooks/useAuth';
import ThemeToggle    from './ThemeToggle';
import {
  Leaf, LayoutDashboard, Activity,
  BarChart3, FileText, Settings, LogOut, Award, LifeBuoy, Zap,
} from 'lucide-react';

interface NavItem {
  to:            string;
  icon:          React.ElementType;
  label:         string;
  allowedRoles?: string[];
  // blockedRoles : roles qui NE doivent PAS voir cet item
  blockedRoles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard'         },
  { to: '/activites',       icon: Activity,        label: 'Activités',         allowedRoles: ['ADMIN','ENTREPRISE','AUDITEUR'] },
  { to: '/calculs',         icon: BarChart3,        label: 'Calculs',           allowedRoles: ['ADMIN','ENTREPRISE','AUDITEUR'] },
  { to: '/rapports',        icon: FileText,         label: 'Rapports',          allowedRoles: ['ADMIN','ENTREPRISE','AUDITEUR'] },
  { to: '/conformite',      icon: Shield,           label: 'Conformité',        allowedRoles: ['ADMIN','ENTREPRISE','AUDITEUR'] },
  { to: '/simulations',     icon: Zap,              label: 'Simulateur',        allowedRoles: ['ADMIN', 'ENTREPRISE', 'AUDITEUR'] },

  // Gestion des employés — uniquement ENTREPRISE
  { to: '/organisation/employes', icon: Users,       label: 'Mes Employés',      allowedRoles: ['ENTREPRISE'] },

  // Apprentissage — tout le monde SAUF ENTREPRISE (l'entreprise voit les cours mais ne s'inscrit pas)
  { to: '/lms',             icon: GraduationCap,   label: 'Apprentissage',     blockedRoles: ['ENTREPRISE'] },

  // Certificats — ETUDIANT seulement
  { to: '/lms/certificats', icon: Award,           label: 'Certificats',       allowedRoles: ['ETUDIANT'], blockedRoles: ['FORMATEUR'] },

  { to: '/support',         icon: LifeBuoy,         label: 'Support'           },
  { to: '/parametres',      icon: Settings,         label: 'Paramètres'        },
  { to: '/lms/formateur',   icon: GraduationCap,   label: 'Espace Formateur',  allowedRoles: ['ADMIN','FORMATEUR'] },
  { to: '/lms/premium', icon: Zap, label: 'Premium', allowedRoles: ['ETUDIANT', 'ENTREPRISE'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem('iq-sidebar-collapsed') === '1');

  const handleLogout = () => { logout(); navigate('/login'); };

  const userRoles   = user?.roles ?? [];
  const isEntreprise = userRoles.includes('ENTREPRISE');

  // ── Nom affiché ───────────────────────────────────────────
  // ENTREPRISE : nom_organisation (retourné par le backend au login)
  // Autres     : prénom + nom
  const nomAffiche = isEntreprise && user?.nom_organisation
    ? user.nom_organisation
    : `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim();

  // Initiales pour l'avatar
  const initials = isEntreprise && user?.nom_organisation
    ? user.nom_organisation.slice(0, 2).toUpperCase()
    : `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase();

  // Filtrer les nav items selon les rôles
  const visible = navItems
  .filter(item => {
    // blockedRoles : masquer si l'utilisateur a ce rôle
    if (item.blockedRoles?.some(r => userRoles.includes(r))) return false;
    // allowedRoles : afficher seulement si l'utilisateur a ce rôle
    if (item.allowedRoles?.length && !item.allowedRoles.some(r => userRoles.includes(r))) return false;
    return true;
  })
  .map(item => {
    if (userRoles.includes('FORMATEUR') && item.to === '/dashboard') {
      return { ...item, label: 'Suivi progression' };
    }
    return item;
  });

  useEffect(() => {
    localStorage.setItem('iq-sidebar-collapsed', collapsed ? '1' : '0');
    document.documentElement.style.setProperty('--iq-sidebar-width', collapsed ? '76px' : '240px');
    window.dispatchEvent(new CustomEvent('iq-sidebar-state-changed', { detail: { collapsed } }));
    return () => document.documentElement.style.removeProperty('--iq-sidebar-width');
  }, [collapsed]);

  useEffect(() => {
    const onToggle = () => setCollapsed((prev) => !prev);
    window.addEventListener('iq-sidebar-toggle', onToggle);
    return () => window.removeEventListener('iq-sidebar-toggle', onToggle);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');

        .iq-sidebar {
          font-family: 'Syne', sans-serif;
          width: 240px; display: flex; flex-direction: column;
          height: 100vh; position: fixed; left: 0; top: 0; z-index: 40;
          background: #ffffff;
          border-right: 1px solid rgba(45,106,79,0.12);
          box-shadow: 2px 0 20px rgba(45,106,79,0.06);
          transition: background 0.3s, border-color 0.3s, width 0.25s;
        }
        .iq-sidebar.collapsed { width: 76px; }
        html.dark .iq-sidebar {
          background: #0f1612;
          border-right-color: rgba(255,255,255,0.07);
          box-shadow: 2px 0 30px rgba(0,0,0,0.4);
        }

        .iq-sidebar-logo {
          padding: 20px 20px 18px;
          border-bottom: 1px solid rgba(45,106,79,0.1);
          display: flex; align-items: center; justify-content: flex-start; gap: 12px;
        }
        .iq-sidebar.collapsed .iq-sidebar-logo { padding: 12px 8px; justify-content: center; }
        html.dark .iq-sidebar-logo { border-bottom-color: rgba(255,255,255,0.06); }

        .iq-logo-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .iq-sidebar.collapsed .iq-logo-left { justify-content: center; }

        .iq-sidebar-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #2d6a4f, #52b788);
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(45,106,79,0.35); flex-shrink: 0;
        }

        .iq-sidebar-logo-title { font-size: 17px; font-weight: 800; color: #1a3028; letter-spacing: -0.3px; margin: 0; }
        html.dark .iq-sidebar-logo-title { color: #e4ede8; }

        .iq-sidebar-logo-sub { font-size: 10px; color: rgba(45,106,79,0.55); margin: 1px 0 0; font-weight: 500; }
        html.dark .iq-sidebar-logo-sub { color: rgba(130,165,145,0.55); }
        .iq-sidebar.collapsed .iq-logo-text { display: none; }

        .iq-sidebar-nav {
          flex: 1; padding: 12px 10px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 2px;
        }
        .iq-sidebar-nav::-webkit-scrollbar { width: 3px; }
        .iq-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .iq-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(45,106,79,0.2); border-radius: 99px; }

        .iq-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 11px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          color: rgba(30,70,50,0.6);
          transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
          position: relative;
        }
        .iq-sidebar.collapsed .iq-nav-item {
          justify-content: center;
          padding: 10px 8px;
          gap: 0;
        }
        .iq-sidebar.collapsed .iq-nav-label { display: none; }
        html.dark .iq-nav-item { color: rgba(130,165,145,0.65); }

        .iq-nav-item:hover { background: rgba(45,106,79,0.07); color: #2d6a4f; }
        html.dark .iq-nav-item:hover { background: rgba(255,255,255,0.05); color: #a0c8b0; }

        .iq-nav-item.active {
          background: linear-gradient(110deg, rgba(45,106,79,0.14) 0%, rgba(82,183,136,0.08) 100%);
          color: #2d6a4f; border: 1px solid rgba(45,106,79,0.2); font-weight: 700;
        }
        html.dark .iq-nav-item.active {
          background: linear-gradient(110deg, rgba(34,197,94,0.12) 0%, rgba(45,106,79,0.08) 100%);
          color: #52b788; border-color: rgba(34,197,94,0.18);
        }
        .iq-nav-item.active::before {
          content: ''; position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 18px; background: linear-gradient(180deg, #2d6a4f, #52b788);
          border-radius: 0 3px 3px 0;
        }
        html.dark .iq-nav-item.active::before { background: linear-gradient(180deg, #22c55e, #52b788); }

        .iq-sidebar-theme {
          padding: 10px 18px; border-top: 1px solid rgba(45,106,79,0.1);
          display: flex; align-items: center; justify-content: space-between;
        }
        .iq-sidebar.collapsed .iq-sidebar-theme {
          padding: 10px 8px;
          justify-content: center;
        }
        html.dark .iq-sidebar-theme { border-top-color: rgba(255,255,255,0.06); }

        .iq-sidebar-theme-label { font-size: 11px; font-weight: 600; color: rgba(45,106,79,0.45); }
        html.dark .iq-sidebar-theme-label { color: rgba(130,165,145,0.45); }
        .iq-sidebar.collapsed .iq-sidebar-theme-label { display: none; }

        .iq-sidebar-user { padding: 14px 16px; border-top: 1px solid rgba(45,106,79,0.1); }
        .iq-sidebar.collapsed .iq-sidebar-user { padding: 10px 8px; }
        html.dark .iq-sidebar-user { border-top-color: rgba(255,255,255,0.06); }

        .iq-user-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 11px; margin-bottom: 4px;
          background: rgba(45,106,79,0.04); border: 1px solid rgba(45,106,79,0.1);
        }
        .iq-sidebar.collapsed .iq-user-row {
          justify-content: center;
          padding: 6px;
          margin-bottom: 6px;
        }
        html.dark .iq-user-row { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }

        .iq-user-avatar {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #2d6a4f, #52b788);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: white; font-family: 'Syne', sans-serif;
          box-shadow: 0 3px 10px rgba(45,106,79,0.3);
        }

        .iq-user-name { font-size: 12.5px; font-weight: 700; color: #1a3028; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        html.dark .iq-user-name { color: #c8d8d0; }

        .iq-user-role { font-size: 10px; font-weight: 500; color: rgba(45,106,79,0.5); margin: 0; }
        html.dark .iq-user-role { color: rgba(130,165,145,0.5); }
        .iq-sidebar.collapsed .iq-user-meta { display: none; }

        .iq-logout-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 9px 12px; border-radius: 10px;
          background: none; border: none; cursor: pointer; font-family: 'Syne', sans-serif;
          font-size: 12px; font-weight: 600; color: rgba(30,70,50,0.5); transition: all 0.18s; text-align: left;
        }
        .iq-sidebar.collapsed .iq-logout-btn {
          justify-content: center;
          padding: 9px 0;
        }
        .iq-sidebar.collapsed .iq-logout-label { display: none; }
        .iq-logout-btn:hover { background: rgba(239,68,68,0.07); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); }
        html.dark .iq-logout-btn { color: rgba(130,165,145,0.5); }
        html.dark .iq-logout-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; }
      `}</style>

      <aside className={`iq-sidebar${collapsed ? ' collapsed' : ''}`}>

        {/* Logo */}
        <div className="iq-sidebar-logo">
          <div className="iq-logo-left">
            <div className="iq-sidebar-logo-icon">
              <Leaf style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <div className="iq-logo-text">
              <p className="iq-sidebar-logo-title">IQcarb</p>
              <p className="iq-sidebar-logo-sub">Pilotage Carbone</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="iq-sidebar-nav">
          {visible.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              end={to === '/lms'}
              className={({ isActive }) => `iq-nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span className="iq-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="iq-sidebar-theme">
          <span className="iq-sidebar-theme-label">Apparence</span>
          <ThemeToggle />
        </div>

        {/* User */}
        <div className="iq-sidebar-user">
          <div className="iq-user-row" title={collapsed ? nomAffiche : undefined}>
            <div className="iq-user-avatar">{initials}</div>
            <div className="iq-user-meta" style={{ flex: 1, minWidth: 0 }}>
              {/* Nom affiché : organisation ou prénom+nom */}
              <p className="iq-user-name">{nomAffiche}</p>
              <p className="iq-user-role">
                {isEntreprise ? 'Organisation' : (userRoles[0] ?? 'Utilisateur')}
              </p>
            </div>
          </div>
          <button className="iq-logout-btn" onClick={handleLogout} title={collapsed ? 'Déconnexion' : undefined}>
            <LogOut style={{ width: 14, height: 14 }} />
            <span className="iq-logout-label">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}