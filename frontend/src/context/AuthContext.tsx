'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, FC } from 'react';
import { useRouter } from 'next/navigation'; // Para redirección si es necesario

// 1. Definir la forma del Usuario y del Contexto
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Añadir otros campos si son necesarios
}

// 1. Definir la "forma" del estado de autenticación
interface AuthState {
  isAuthenticated: boolean;
  user: User | null; // Podríamos definir una interfaz User más detallada
  token: string | null;
  isLoading: boolean; // Para manejar estados de carga durante login/logout
}

// Tipo para la respuesta de login/error
interface LoginResult {
    success: boolean;
    message?: string; // Mensaje de error opcional
}

// 2. Definir las acciones que el contexto proveerá
interface AuthContextActions {
  login: (credentials: { email: string; password: string }) => Promise<LoginResult>; // Modificado para aceptar credenciales y devolver resultado
  logout: () => void;
  // Podríamos añadir más acciones: register, loadUserFromToken, etc.
}

// Combinar estado y acciones en el tipo del contexto
interface AuthContextType extends AuthState, AuthContextActions {}

// 3. Crear el Contexto con un valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Crear el componente Proveedor (Provider)
interface AuthProviderProps {
  children: ReactNode; // Para envolver la aplicación
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  // --- Estado Interno del Provider ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Empezar cargando (para verificar token inicial?)
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
        setIsAuthenticated(true);
        setToken(token);
      } else {
        // Si /me falla pero el token existe, lo limpiamos igual
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        throw new Error(data.error?.message || 'Invalid user data received from /me');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('authToken'); // Asegurar limpieza en cualquier error
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías intencionalmente (usan setters de estado)

  // Verificar token al montar el proveedor
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      void fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Función de Login
  const login = useCallback(async (credentials: { email: string; password: string }): Promise<LoginResult> => {
    setIsLoading(true);
    let result: LoginResult = { success: false }; // Valor por defecto

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Extraer mensaje de error del backend (estructura anidada o plana)
        let errorMessage = 'Error de autenticación.';
        if (data.error && typeof data.error === 'object' && data.error.message) {
            errorMessage = data.error.message;
        } else if (typeof data.error === 'string') {
            errorMessage = data.error;
        } else if (response.status === 401) {
            errorMessage = 'Credenciales inválidas.';
        }
        console.error('Login failed:', errorMessage);
        result = { success: false, message: errorMessage };
      } else if (data.success && data.token) {
        // Éxito: guardar token y obtener datos del usuario
        localStorage.setItem('authToken', data.token);
        await fetchUser(data.token); // Actualiza user, isAuthenticated, token
        console.log('Login successful');
        result = { success: true };
      } else {
        // Respuesta inesperada
        console.error('Login failed: Invalid response format', data);
        result = { success: false, message: 'Respuesta inesperada del servidor.' };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      result = { success: false, message: error instanceof Error ? error.message : 'Error de red o desconocido.' };
    } finally {
      setIsLoading(false);
    }
    return result; // Devolver el resultado
  }, [fetchUser]);

  // Función de Logout
  const logout = useCallback(() => {
    setIsLoading(true);
    console.log('[AuthProvider] logout llamado');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    setIsLoading(false);
    router.push('/'); // Redirigir a home tras logout
  }, [router]);

  // --- Valor que el Provider pasará a los consumidores ---
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    isLoading,
    login,
    logout,
  };

  // Envolver a los hijos con el Provider y el valor del contexto
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Crear un Hook personalizado para consumir el contexto fácilmente
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 