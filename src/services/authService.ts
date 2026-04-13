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
};

export default authService;