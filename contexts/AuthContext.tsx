import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: any;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  login: (credentials: any) => Promise<void>;
  isLoginLoading: boolean;
  loginError: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const value: AuthContextType = {
    isAuthenticated: auth.isAuthenticated,
    usuario: auth.usuario,
    token: auth.token,
    isLoading: auth.isLoading,
    logout: auth.logout,
    login: auth.login,
    isLoginLoading: auth.isLoginLoading,
    loginError: auth.loginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 