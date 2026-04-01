import {
  createContext, useState,
  useEffect, useCallback,
  type ReactNode
} from 'react';
import authService from '@/services/authService';
import type { User, AuthContextType } from '@/types/auth.types';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<User> => {
    const res = await authService.login({ email, password });
    const { token: newToken, utilisateur } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(utilisateur));
    setToken(newToken);
    setUser(utilisateur);
    return utilisateur;
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
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};