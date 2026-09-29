import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { mobileApi } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('@payverify_token');
      if (token) {
        const profile = await mobileApi.getMe();
        setUser(profile);
      }
    } catch (e) {
      console.warn('Could not restore auth token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string = 'password123') => {
    setIsLoading(true);
    try {
      const res = await mobileApi.login(username, password);
      await AsyncStorage.setItem('@payverify_token', res.access_token);
      const profile = await mobileApi.getMe();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@payverify_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
