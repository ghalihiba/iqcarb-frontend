import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '@/types/auth.types';

const authService = {
  login:  (data: LoginRequest): Promise<{ data: LoginResponse }> =>
    api.post('/auth/login', data),
  register: (data: RegisterRequest): Promise<{ data: RegisterResponse }> =>
    api.post('/auth/register', data),
  profil: () => api.get('/auth/profil'),
  updateProfil: (data: {
    nom: string;
    prenom: string;
    telephone?: string;
    photo_profil?: string;
  }) => api.put('/auth/profil', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/password', data),
};

export default authService;