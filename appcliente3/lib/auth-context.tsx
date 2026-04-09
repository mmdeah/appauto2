'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from './types';
import { getCurrentUser, setCurrentUser } from './storage';
import { getUserByEmail } from './db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar usuarios por defecto
    const initUsers = async () => {
      const { initializeDefaultUsers } = await import('./init-default-users');
      await initializeDefaultUsers();
      
      // Check for existing session
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Verificar que el usuario aún existe en la API
        const apiUser = await getUserByEmail(currentUser.email);
        if (apiUser) {
          // Actualizar con datos de la API por si hubo cambios
          setUser(apiUser);
          setCurrentUser(apiUser);
        } else {
          // Usuario no existe en la API, limpiar sesión
          setUser(null);
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };
    
    initUsers().catch(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('[v0] Attempting login for:', email);
      const foundUser = await getUserByEmail(email);
      console.log('[v0] User found:', foundUser ? `${foundUser.name} (${foundUser.role})` : 'Not found');
      
      if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        setCurrentUser(foundUser);
        console.log('[v0] Login successful');
        return true;
      }
      
      console.log('[v0] Login failed: invalid password or user not found');
      return false;
    } catch (error) {
      console.error('[v0] Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
