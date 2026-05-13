/**
 * AppRouter.tsx — Routes IQcarb
 * ─────────────────────────────────────────────────────────────
 * Ajout de la route /organisation/employes pour l'ENTREPRISE.
 * Logique de redirection DashboardRoute étendue.
 */
import LMSPremium       from '@/pages/LMSPremium';
import LMSPremiumSucces from '@/pages/LMSPremiumSucces';
import LMSHome          from '@/pages/LMSHome';
import ParcoursDetail   from '@/pages/ParcoursDetail';
import ModuleDetail     from '@/pages/ModuleDetail';
import CoursDetail      from '@/pages/CoursDetail';
import LMSProgression   from '@/pages/LMSProgression';
import LMSFormateur     from '@/pages/LMSFormateur';
import LMSFormateurSuivi from '@/pages/LMSFormateurSuivi';
import LMSCertificats   from '@/pages/LMSCertificats';
import Parametres       from '@/pages/Parametres';
import Support          from '@/pages/Support';
import Unauthorized     from '@/pages/Unauthorized';
import Conformite       from '@/pages/Conformite';
import Rapports         from '@/pages/Rapports';
import Calculs          from '@/pages/Calculs';
import SimulateurCarbone from '@/pages/SimulateurCarbone';
import GestionEmployes  from '@/pages/organisation/GestionEmployes';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }      from '@/hooks/useAuth';
import Login            from '@/pages/Login';
import Dashboard        from '@/pages/Dashboard';
import Activites        from '@/pages/Activites';
import EtudiantDashboard from '@/pages/lms/EtudiantDashboard';

// ─── Guards ──────────────────────────────────────────────────
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));
  return hasAccess ? <>{children}</> : <Navigate to="/unauthorized" replace />;
};

// ─── Dashboard selon le rôle ──────────────────────────────────
const DashboardRoute = () => {
  const { user } = useAuth();
  const role = user?.roles?.[0];
  // ETUDIANT → dashboard apprenant
  if (role === 'ETUDIANT') return <EtudiantDashboard />;
  // FORMATEUR → dashboard de suivi progression (distinct de l'espace de création)
  if (role === 'FORMATEUR') return <LMSFormateurSuivi />;
  // Les autres (ENTREPRISE, AUDITEUR, ADMIN) → dashboard carbone
  return <Dashboard />;
};

// ═════════════════════════════════════════════════════════════
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Publique ──────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />

        {/* ── Dashboard (selon rôle) ────────────────────────── */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardRoute /></PrivateRoute>
        } />

        {/* ── Carbone (ENTREPRISE, ADMIN, FORMATEUR, AUDITEUR) ─ */}
        <Route path="/activites" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','ENTREPRISE','FORMATEUR','AUDITEUR']}>
              <Activites />
            </RoleRoute>
          </PrivateRoute>
        } />
        <Route path="/calculs" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','ENTREPRISE','FORMATEUR','AUDITEUR']}>
              <Calculs />
            </RoleRoute>
          </PrivateRoute>
        } />
        <Route path="/rapports" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','ENTREPRISE','FORMATEUR','AUDITEUR']}>
              <Rapports />
            </RoleRoute>
          </PrivateRoute>
        } />
        <Route path="/conformite" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','ENTREPRISE','FORMATEUR','AUDITEUR']}>
              <Conformite />
            </RoleRoute>
          </PrivateRoute>
        } />
        <Route path="/simulations" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','ENTREPRISE','AUDITEUR']}>
              <SimulateurCarbone />
            </RoleRoute>
          </PrivateRoute>
        } />

        {/* ── Organisation : gestion des employés ─────────────
             ENTREPRISE uniquement
             Page : src/pages/organisation/GestionEmployes.tsx    */}
        <Route path="/organisation/employes" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ENTREPRISE','ADMIN']}>
              <GestionEmployes />
            </RoleRoute>
          </PrivateRoute>
        } />

        {/* ── LMS (tout le monde sauf ENTREPRISE) ──────────── */}
        <Route path="/lms" element={
          <PrivateRoute><LMSHome /></PrivateRoute>
        } />
        <Route path="/lms/parcours/:id" element={
          <PrivateRoute><ParcoursDetail /></PrivateRoute>
        } />
        <Route path="/lms/modules/:id" element={
          <PrivateRoute><ModuleDetail /></PrivateRoute>
        } />
        <Route path="/lms/cours/:id" element={
          <PrivateRoute><CoursDetail /></PrivateRoute>
        } />
        <Route path="/lms/progression" element={
          <PrivateRoute><LMSProgression /></PrivateRoute>
        } />
        <Route path="/lms/dashboard" element={
          <PrivateRoute><EtudiantDashboard /></PrivateRoute>
        } />

        {/* Certificats — ETUDIANT uniquement */}
        <Route path="/lms/certificats" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ETUDIANT']}>
              <LMSCertificats />
            </RoleRoute>
          </PrivateRoute>
        } />

        {/* Espace formateur — ADMIN + FORMATEUR */}
        <Route path="/lms/formateur" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN','FORMATEUR']}>
              <LMSFormateur />
            </RoleRoute>
          </PrivateRoute>
        } />

        {/* ── Paramètres & support ─────────────────────────── */}
        <Route path="/parametres" element={<PrivateRoute><Parametres /></PrivateRoute>} />
        <Route path="/support"    element={<PrivateRoute><Support /></PrivateRoute>} />

        {/* ── Utilitaires ──────────────────────────────────── */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
<Route path="/lms/premium" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ETUDIANT', 'ENTREPRISE', 'ADMIN']}>
      <LMSPremium />
    </RoleRoute>
  </PrivateRoute>
} />
<Route path="/lms/premium/succes" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ETUDIANT', 'ENTREPRISE', 'ADMIN']}>
      <LMSPremiumSucces />
    </RoleRoute>
  </PrivateRoute>
} />
      </Routes>
    </BrowserRouter>
  );
}