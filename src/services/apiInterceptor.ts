import api from './api';
import type { AxiosError } from 'axios';

// Messages d'erreur selon le code HTTP
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Données invalides. Vérifiez les champs du formulaire.',
  401: 'Session expirée. Reconnectez-vous.',
  403: 'Accès refusé. Permissions insuffisantes.',
  404: 'Ressource introuvable.',
  409: 'Conflit de données. Cet élément existe déjà.',
  422: 'Données non traitables. Vérifiez le format.',
  429: 'Trop de requêtes. Attendez quelques secondes.',
  500: 'Erreur serveur interne. Réessayez plus tard.',
  502: 'Serveur indisponible. Vérifiez la connexion.',
  503: 'Service temporairement indisponible.',
};

// Extraire le message d'erreur d'une réponse Axios
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<{ message?: string; detail?: string }>;

    // Erreur réseau (backend non démarré)
    if (!axiosError.response) {
      return 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur le port 5000.';
    }

    const status  = axiosError.response.status;
    const data    = axiosError.response.data;

    // Message spécifique du backend
    if (data?.message) return data.message;
    if (data?.detail)  return data.detail;

    // Message générique selon le code HTTP
    return ERROR_MESSAGES[status] ?? `Erreur HTTP ${status}`;
  }

  return 'Une erreur inattendue est survenue.';
};

// Vérifier si le backend est accessible
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch('http://localhost:5000/health');
    const data = await res.json();
    return data.status === 'OK';
  } catch {
    return false;
  }
};

// Configurer les intercepteurs avec les toasts
export const setupInterceptors = (
  onError: (msg: string) => void,
  onUnauthorized: () => void
) => {
  api.interceptors.response.use(
    response => response,
    (error: AxiosError<{ message?: string }>) => {
      // Ne pas afficher de toast pour les 401
      // (géré par AuthContext)
      if (error.response?.status === 401) {
        onUnauthorized();
        return Promise.reject(error);
      }

      // Afficher le message d'erreur
      const message = getErrorMessage(error);
      onError(message);

      return Promise.reject(error);
    }
  );
};

export default { getErrorMessage, checkBackendHealth, setupInterceptors };