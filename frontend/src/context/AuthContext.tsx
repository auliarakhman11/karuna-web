'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileState: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check initial authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          // Parse basic payload from token if user info not returned or fetch user profile
          const tokenParts = data.accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            setUser({
              id: payload.userId,
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
            });
          }
        }
      } catch (err) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    await api.post('/auth/register', { email, password, name });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateProfileState = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileState }}>
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
