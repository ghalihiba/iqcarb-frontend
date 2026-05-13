import {
  createContext, useState,
  useEffect, useCallback,
  type ReactNode
} from 'react';
import authService from '@/services/authService';
import type {
  User,
  AuthContextType,
  RegisterRequest
} from '@/types/auth.types';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeUser = useCallback((rawUser: User & { role?: string }): User => {
    const roles = rawUser.roles?.length
      ? rawUser.roles
      : rawUser.role
        ? [rawUser.role]
        : ['ETUDIANT'];

    return {
      ...rawUser,
      id: rawUser.id ?? rawUser.id_utilisateur ?? '',
      roles,
      statut_compte: rawUser.statut_compte ?? 'ACTIF',
    };
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(normalizeUser(JSON.parse(storedUser) as User & { role?: string }));
    }
    setLoading(false);
  }, [normalizeUser]);

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<User> => {
    const res = await authService.login({ email, password });
    const { token: newToken, utilisateur } = res.data;
    const normalizedUser = normalizeUser(utilisateur as User & { role?: string });
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
    return normalizedUser;
  }, [normalizeUser]);

  const register = useCallback(async (payload: RegisterRequest): Promise<User> => {
    const res = await authService.register(payload);
    const { token: newToken, utilisateur } = res.data;
    const normalizedUser = normalizeUser(utilisateur);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
    return normalizedUser;
  }, [normalizeUser]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const res = await authService.profil();
    const utilisateur = res.data.utilisateur as User & { role?: string };
    const normalizedUser = normalizeUser(utilisateur);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  }, [token, normalizeUser]);

  const updateProfile = useCallback(async (payload: {
    nom: string;
    prenom: string;
    telephone?: string;
    photo_profil?: string;
  }) => {
    const res = await authService.updateProfil(payload);
    const normalizedUser = normalizeUser(res.data.utilisateur as User & { role?: string });
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  }, [normalizeUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authService.changePassword({ currentPassword, newPassword });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      updateProfile,
      changePassword,
      refreshProfile,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};