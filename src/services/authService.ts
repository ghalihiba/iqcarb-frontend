import api from './api';
import type { LoginRequest, LoginResponse } from '@/types/auth.types';

const authService = {
  login:  (data: LoginRequest): Promise<{ data: LoginResponse }> =>
    api.post('/auth/login', data),
  profil: () => api.get('/auth/profil'),
};

export default authService;