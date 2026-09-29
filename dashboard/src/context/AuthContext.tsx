import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('payverify_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      if (localStorage.getItem('payverify_token')) {
        const profile = await authApi.getMe();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
      localStorage.removeItem('payverify_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const login = async (username: string, password: string = 'password123') => {
    setIsLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('payverify_token', res.access_token);
      setToken(res.access_token);
      const profile = await authApi.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('payverify_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: UserRole) => {
    const roleUsernameMap: Record<UserRole, string> = {
      OWNER: 'owner',
      MANAGER: 'manager',
      WAITER: 'abel',
      ACCOUNTANT: 'accountant'
    };
    await login(roleUsernameMap[role], 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
