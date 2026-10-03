'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from './auth-client';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  setUser: () => {},
  logout: async () => {},
});

const CACHE_KEY = 'filo_cached_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Pre-hydrate from localStorage synchronously if available
  const [user, setUserState] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as AuthUser;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!user);

  const setUser = useCallback((newUser: AuthUser | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      try {
        if (newUser) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newUser));
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setUser(json.user);
          return json.user;
        }
      }
      // If 401 or no user, clear
      if (res.status === 401) {
        setUser(null);
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [setUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
