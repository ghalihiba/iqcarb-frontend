
import LMSHome       from '@/pages/LMSHome';
import ParcoursDetail from '@/pages/ParcoursDetail';
import ModuleDetail from '@/pages/ModuleDetail';
import CoursDetail from '@/pages/CoursDetail';
import LMSProgression from '@/pages/LMSProgression';
import LMSFormateur from '@/pages/LMSFormateur';
import LMSCertificats from '@/pages/LMSCertificats';
import Parametres from '@/pages/Parametres';
import Support from '@/pages/Support';
import Unauthorized from '@/pages/Unauthorized';
import Conformite from '@/pages/Conformite';
import Rapports from '@/pages/Rapports';
import Calculs from '@/pages/Calculs';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Login     from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Activites from '@/pages/Activites';
import EtudiantDashboard from '@/pages/lms/EtudiantDashboard';

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
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
  return hasAccess ? <>{children}</> : <Navigate to="/unauthorized" replace />;
};

const DashboardRoute = () => {
  const { user } = useAuth();
  const role = user?.roles?.[0];

  if (role === 'ETUDIANT') {
    return <EtudiantDashboard />;
  }
  return <Dashboard />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardRoute /></PrivateRoute>
        } />
        <Route path="/activites" element={
          <PrivateRoute>
            <RoleRoute allowedRoles={['ADMIN', 'ENTREPRISE', 'FORMATEUR', 'AUDITEUR']}>
              <Activites />
            </RoleRoute>
          </PrivateRoute>
        } />
        <Route path="/calculs" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ADMIN', 'ENTREPRISE', 'FORMATEUR', 'AUDITEUR']}>
      <Calculs />
    </RoleRoute>
  </PrivateRoute>
} />
<Route path="/rapports" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ADMIN', 'ENTREPRISE', 'FORMATEUR', 'AUDITEUR']}>
      <Rapports />
    </RoleRoute>
  </PrivateRoute>
} />
<Route path="/conformite" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ADMIN', 'ENTREPRISE', 'FORMATEUR', 'AUDITEUR']}>
      <Conformite />
    </RoleRoute>
  </PrivateRoute>
} />
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
<Route path="/lms/certificats" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ETUDIANT']}>
      <LMSCertificats />
    </RoleRoute>
  </PrivateRoute>
} />
<Route path="/lms/formateur" element={
  <PrivateRoute>
    <RoleRoute allowedRoles={['ADMIN', 'FORMATEUR']}>
      <LMSFormateur />
    </RoleRoute>
  </PrivateRoute>
} />
<Route path="/parametres" element={
  <PrivateRoute><Parametres /></PrivateRoute>
} />
<Route path="/support" element={
  <PrivateRoute><Support /></PrivateRoute>
} />
<Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/lms/dashboard" element={<PrivateRoute><EtudiantDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}