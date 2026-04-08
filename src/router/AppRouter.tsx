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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/calculs" element={
  <PrivateRoute><Calculs /></PrivateRoute>
} />
<Route path="/rapports" element={
  <PrivateRoute><Rapports /></PrivateRoute>
} />
      </Routes>
    </BrowserRouter>
  );
}