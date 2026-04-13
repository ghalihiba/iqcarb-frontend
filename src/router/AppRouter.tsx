import LMSHome       from '@/pages/LMSHome';
import ParcoursDetail from '@/pages/ParcoursDetail';
import ModuleDetail from '@/pages/ModuleDetail';
import CoursDetail from '@/pages/CoursDetail';
import LMSProgression from '@/pages/LMSProgression';
import Parametres from '@/pages/Parametres';
import Conformite from '@/pages/Conformite';
import Rapports from '@/pages/Rapports';
import Calculs from '@/pages/Calculs';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Login     from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Activites from '@/pages/Activites';

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/activites" element={
          <PrivateRoute><Activites /></PrivateRoute>
        } />
        <Route path="/calculs" element={
  <PrivateRoute><Calculs /></PrivateRoute>
} />
<Route path="/rapports" element={
  <PrivateRoute><Rapports /></PrivateRoute>
} />
<Route path="/conformite" element={
  <PrivateRoute><Conformite /></PrivateRoute>
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
<Route path="/parametres" element={
  <PrivateRoute><Parametres /></PrivateRoute>
} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}