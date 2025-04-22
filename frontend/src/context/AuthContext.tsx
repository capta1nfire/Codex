'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Para redirección si es necesario

// 1. Definir la forma del Usuario y del Contexto
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Añadir otros campos si son necesarios
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>; // Hacemos login asíncrono
  logout: () => void;
}

// 2. Crear el Contexto con un valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Crear el Componente Proveedor
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Empezar cargando hasta verificar token
  const router = useRouter();

  // Función para obtener datos del usuario basado en token
  const fetchUser = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching user: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token'); // Limpiar token inválido
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback sin dependencias por ahora

  // Verificar token al montar el proveedor
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      void fetchUser(token); // Llamar a fetchUser si hay token
    } else {
      setIsLoading(false); // No hay token, terminar carga
    }
  }, [fetchUser]); // Depender de fetchUser

  // Función de Login
  const login = useCallback(async (token: string) => {
    localStorage.setItem('auth_token', token);
    await fetchUser(token); // Obtener y establecer datos del usuario
    // No redirigir aquí necesariamente, el componente que llama puede decidir
  }, [fetchUser]);

  // Función de Logout
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken'); // Limpiar legacy
    setUser(null);
    // Podríamos redirigir aquí si siempre queremos ir a home al hacer logout
    // router.push('/');
  }, []);

  // Valor a proveer por el contexto
  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. Crear Hook Personalizado para consumir el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 