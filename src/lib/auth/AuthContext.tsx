'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineDb } from '@/lib/db/offlineDb';

export interface AuthUser {
  id: string;
  fullName: string;
  identifier: string;
  role: 'PATIENT' | 'CAREGIVER' | 'DOCTOR';
  region: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; role?: string; user?: AuthUser }>;
  loginDemo: (role: 'PATIENT' | 'CAREGIVER') => Promise<{ success: boolean; role?: string; user?: AuthUser }>;
  signup: (data: {
    fullName: string;
    identifier: string;
    password: string;
    role: 'PATIENT' | 'CAREGIVER' | 'DOCTOR';
    region?: string;
  }) => Promise<{ success: boolean; error?: string; role?: string; user?: AuthUser }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => ({ success: false }),
  loginDemo: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sevamitr_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      // LocalStorage error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sevamitr_auth_user', JSON.stringify(u));
    }
    if (u.role === 'PATIENT') {
      const p = offlineDb.getPatient();
      p.fullName = u.fullName;
      p.region = u.region || p.region;
      offlineDb.savePatient(p);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user);
        return { success: true, role: data.user.role, user: data.user };
      }
      return { success: false, error: data.error || 'Login failed.' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const loginDemo = async (role: 'PATIENT' | 'CAREGIVER') => {
    const creds =
      role === 'PATIENT'
        ? { identifier: 'bhaben', password: 'password123' }
        : { identifier: 'anuradha@sevamitr.org', password: 'care123' };

    return login(creds.identifier, creds.password);
  };

  const signup = async (formData: {
    fullName: string;
    identifier: string;
    password: string;
    role: 'PATIENT' | 'CAREGIVER' | 'DOCTOR';
    region?: string;
  }) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', ...formData }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user);
        return { success: true, role: data.user.role, user: data.user };
      }
      return { success: false, error: data.error || 'Signup failed.' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sevamitr_auth_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        loginDemo,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
