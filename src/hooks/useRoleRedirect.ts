import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook à appeler après un login réussi.
 * Redirige automatiquement vers le bon dashboard selon le rôle.
 */
export function useRoleRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const role = user.roles?.[0] ?? 'ETUDIANT';
    redirectByRole(role, navigate);
  }, [user, navigate]);
}

/**
 * Fonction utilitaire de redirection par rôle.
 * À appeler dans handleSubmit après login réussi.
 */
export function redirectByRole(role: string, navigate: (path: string) => void) {
  switch (role) {
    case 'ENTREPRISE':
      navigate('/dashboard');
      break;
    case 'FORMATEUR':
      navigate('/lms/formateur');
      break;
    case 'AUDITEUR':
      navigate('/lms/auditeur');
      break;
    case 'ETUDIANT':
    default:
      navigate('/lms/dashboard');
      break;
  }
}