'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  FC,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation'; // Para redirección si es necesario

// 1. Definir la forma del Usuario y del Contexto
interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  username?: string; // Make optional to match backend
  role: string;
  profilePictureUrl?: string;
  profilePictureType?: string;
  currentApiKey?: string; // Campo para la API Key actual (NO es el hash del backend)
  apiUsage?: number; // Campo para el uso de API - Fase 2C
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
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
  const [isInitialized, setIsInitialized] = useState<boolean>(false); // Track if initial check is done
  const router = useRouter();
  
  // Ref to prevent double initialization in StrictMode
  const hasInitializedRef = useRef(false);

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
        // Only clear tokens on authentication errors (401)
        if (response.status === 401) {
          console.log('[AuthContext] 401 error - clearing tokens');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
        throw new Error(`Error fetching user: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Map backend field names (avatarUrl/Type) to frontend names (profilePictureUrl/Type)
        const frontendUser: User = {
          ...data.user,
          username: data.user.username,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: data.user.avatarType,
        };
        
        // Remove original backend fields if they exist to avoid confusion (optional but clean)
        // delete frontendUser.avatarUrl;
        // delete frontendUser.avatarType;

        setUser(frontendUser); // Set state with correctly named fields
        setIsAuthenticated(true);
        setToken(token);
      } else {
        // Only clear tokens if it's an authentication issue
        if (data.error?.code === 'UNAUTHORIZED' || data.error?.code === 'INVALID_TOKEN') {
          console.log('[AuthContext] Auth error - clearing tokens');
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
        }
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        throw new Error(data.error?.message || 'Invalid user data received from /me');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Don't clear tokens on network errors or other non-auth issues
      // Only clear if explicitly handled above (401 or auth error codes)
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías intencionalmente (usan setters de estado)

  // Verificar token al montar el proveedor
  useEffect(() => {
    // Use ref to prevent double execution in StrictMode
    if (hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth check...');
      const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (storedToken) {
        console.log('[AuthContext] Token found, fetching user...');
        try {
          await fetchUser(storedToken);
        } catch (error) {
          console.error('[AuthContext] Error during initial auth check:', error);
        }
      } else {
        console.log('[AuthContext] No token found');
        setIsLoading(false);
      }
      
      // Mark as initialized after check completes
      setIsInitialized(true);
    };
    
    initializeAuth();
  }, [fetchUser]);

  // Función de Login
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<LoginResult> => {
    console.log('[AuthContext] Login called with rememberMe:', rememberMe);
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
          message: data.error?.message || 'Error de autenticación',
        };
      }

      // Si tenemos token
      if (data.success && data.token) {
        // Use sessionStorage for temporary login, localStorage for persistent
        if (rememberMe) {
          console.log('[AuthContext] Storing token in localStorage');
          localStorage.setItem('authToken', data.token);
        } else {
          console.log('[AuthContext] Storing token in sessionStorage');
          sessionStorage.setItem('authToken', data.token);
        }

        if (data.user) {
          // Map backend field names to frontend names for consistency
          const frontendUser: User = {
            ...data.user,
            username: data.user.username,
            profilePictureUrl: data.user.avatarUrl,
            profilePictureType: data.user.avatarType,
          };
          
          // Usuario vino en la respuesta del login
          setUser(frontendUser);
          setIsAuthenticated(true);
          setToken(data.token);
          return { success: true, user: frontendUser }; // Devolver usuario aquí
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
          message: data.error?.message || 'No se recibió token o datos válidos',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Error desconocido durante el inicio de sesión',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función de Logout
  const logout = () => {
    // Clear from both storage locations
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  // Función para actualizar datos del usuario (modificada)
  const updateUser = (userData: Partial<User>) => {
    setUser((prevUser) => {
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

  // Show loading state until initial auth check is complete
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-slate-700">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

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
