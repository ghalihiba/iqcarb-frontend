import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Leaf, LayoutDashboard, Activity,
  BarChart3, FileText, Settings, LogOut
} from 'lucide-react';

interface NavItem {
  to:    string;
  icon:  React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/activites',  icon: Activity,        label: 'Activités'  },
  { to: '/calculs',    icon: BarChart3,        label: 'Calculs'    },
  { to: '/rapports',   icon: FileText,         label: 'Rapports'   },
  { to: '/parametres', icon: Settings,         label: 'Paramètres' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`;

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20">

      {/* Logo */}
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">IQcarb</h1>
            <p className="text-primary-400 text-xs">Pilotage Carbone</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur */}
      <div className="p-4 border-t border-primary-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-primary-400 truncate">
              {user?.roles?.[0]}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-primary-300 hover:text-white hover:bg-primary-800 rounded-xl transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}