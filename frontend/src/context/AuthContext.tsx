'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  FC,
} from 'react';
import { useRouter } from 'next/navigation'; // Para redirección si es necesario

// 1. Definir la forma del Usuario y del Contexto
interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username: string;
  role: string;
  profilePictureUrl?: string;
  profilePictureType?: string;
  currentApiKey?: string; // Campo para la API Key actual (NO es el hash del backend)
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
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
  user?: User;
  message?: string; // Mensaje de error opcional
}

// 2. Definir las acciones que el contexto proveerá
interface AuthContextActions {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void; // <-- Acepta datos parciales para actualizar solo campos específicos
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
  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error?.message || 'Error de autenticación'
        };
      }

      // Si tenemos token
      if (data.success && data.token) {
        localStorage.setItem('authToken', data.token);

        if (data.user) {
          // Usuario vino en la respuesta del login
          setUser(data.user);
          setIsAuthenticated(true);
          setToken(data.token);
          return { success: true, user: data.user }; // Devolver usuario aquí
        } else {
          // Usuario NO vino en la respuesta, intentar obtenerlo con /me
          // fetchUser actualizará el estado internamente de forma asíncrona
          await fetchUser(data.token);
          // Como fetchUser es async y actualiza el estado,
          // no podemos garantizar que 'user' esté disponible inmediatamente aquí.
          // Devolvemos success: true, pero el consumidor debería observar el estado del contexto.
          return { success: true, user: undefined };
        }
      } else {
        // Caso: respuesta ok, pero success: false o sin token
        return {
          success: false,
          message: data.error?.message || 'No se recibió token o datos válidos'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido durante el inicio de sesión'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  // Función para actualizar datos del usuario (modificada)
  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null; // No debería pasar si está autenticado, pero por seguridad
      // Fusionar datos previos con los nuevos
      return { ...prevUser, ...userData };
    });
  };

  // --- Valor que el Provider pasará a los consumidores ---
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  // Envolver a los hijos con el Provider y el valor del contexto
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// 5. Crear un Hook personalizado para consumir el contexto fácilmente
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
