'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Upload, RefreshCw, Copy, Eye, EyeOff, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfilePicture from './ui/ProfilePicture';

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  username?: string;
  createdAt?: string;
  lastLogin?: string;
  avatarUrl?: string;
  avatarType?: string;
  profilePictureUrl?: string;
  profilePictureType?: string;
}

interface DefaultAvatar {
  type: string;
  url: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const [showApiGenerationSuccess, setShowApiGenerationSuccess] = useState(false);
  const [defaultProfilePictures, setDefaultProfilePictures] = useState<DefaultAvatar[]>([]);
  const [isProfilePictureMenuOpen, setIsProfilePictureMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePictureMenuRef = useRef<HTMLDivElement>(null);
  const profilePictureButtonRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading, token: authToken, updateUser, logout } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        setUser(authUser);
        setFirstName(authUser?.firstName || '');
        setLastName(authUser?.lastName || '');
        setUsername(authUser?.username || '');
      }
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, authUser, router]);

  // Cargar opciones de avatares predeterminados
  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchDefaultProfilePictures();
    }
  }, [isAuthenticated, authToken]);

  const fetchDefaultProfilePictures = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/avatars/default-options`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.avatarOptions) {
          setDefaultProfilePictures(data.avatarOptions);
        }
      }
    } catch (err) {
      console.error('Error al cargar imágenes de perfil predeterminadas:', err);
    }
  };

  // Helper function to handle API errors, including 401 for logout
  const handleApiError = (error: unknown, context: string) => {
    let errorMessage = 'Error desconocido';
    let statusCode: number | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      statusCode = (error as any).status; // Try to get status if added
    }

    // Check for 401 Unauthorized
    if (statusCode === 401 || errorMessage.toLowerCase().includes('token inválido') || errorMessage.toLowerCase().includes('unauthorized')) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout(); // Logout and redirect
    } else {
      // Handle other errors
      setError(errorMessage);
      toast.error(`Error ${context}: ${errorMessage}`);
      console.error(`Error ${context}:`, { error }); // Use console.error in frontend
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!authToken || !user) {
      logout(); // Should not happen if component rendered, but good practice
      return;
    }

    const updateData = {
      firstName,
      lastName: lastName || null,
      username: username.trim() === '' ? null : username.trim(),
    };

    let response: Response | null = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (data.success && data.user) {
        setUser(data.user);
        setFirstName(data.user.firstName || '');
        setLastName(data.user.lastName || '');
        setUsername(data.user.username || '');
        updateUser(data.user);
        setIsEditing(false);
        toast.success('Perfil actualizado correctamente');
      } else {
        // Throw error for unexpected success=false or missing user
        throw new Error(data.error?.message || 'Respuesta inválida del servidor al actualizar');
      }
    } catch (err) {
      handleApiError(err, 'actualizando perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyApiKey = () => {
    const currentApiKey = authUser?.currentApiKey;
    if (!currentApiKey) return;
    navigator.clipboard.writeText(currentApiKey)
      .then(() => {
        toast.success('API Key copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar API key:', err);
        toast.error('No se pudo copiar la API key');
      });
  };

  const generateApiKey = async () => {
    setError('');
    setIsLoading(true);
    setIsApiKeyVisible(false);
    setShowApiKeyWarning(false);
    setShowApiGenerationSuccess(false);

    if (!authToken) {
      logout(); 
      return;
    }

    let response: Response | null = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/auth/api-key`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Simulating success on error for demo purposes - REMOVE THIS IN PRODUCTION
        if (response.status === 401) { // Explicitly handle 401 here before simulation
           const error = new Error(data.error?.message || `Error ${response.status}`);
           (error as any).status = response.status; 
           throw error;
        }
        console.error("Error en la respuesta real:", data); 
        // const simulatedApiKey = "7a9bd3fe8db060004510a28315da8e031b113113f1e969d92a5fc5727a40eeeb";
        // updateUser({ currentApiKey: simulatedApiKey }); 
        // setShowApiGenerationSuccess(true);
        // throw new Error('Simulación de error completada'); // Re-throw simulated error if needed
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
        // return; // Original return on error simulation
      }

      if (data.success && data.apiKey) {
        updateUser({ currentApiKey: data.apiKey });
        setShowApiGenerationSuccess(true);
        if (data.user) {
          // Ensure context gets updated user data along with the new key state
          updateUser({ ...data.user, currentApiKey: data.apiKey }); 
        }
      } else {
        throw new Error(
          data.error?.message || 'Respuesta inválida del servidor al generar API key'
        );
      }
    } catch (err) {
      // Remove error simulation logic from catch block
      // console.error("Error en generateApiKey:", err);
      // const simulatedApiKey = "7a9bd3fe8db060004510a28315da8e031b113113f1e969d92a5fc5727a40eeeb";
      // updateUser({ currentApiKey: simulatedApiKey });
      // setShowApiGenerationSuccess(true);
      handleApiError(err, 'generando API Key');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para abrir el selector de archivos
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Función para subir un avatar personalizado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    // Validar tipo y tamaño del archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('El archivo debe ser una imagen (JPG o PNG)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setIsLoading(true);
    setError('');

    let response: Response | null = null;
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/avatars/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (data.success && data.user && data.user.avatarUrl !== undefined && data.user.avatarType !== undefined) {
        const updatedUserData = {
          ...data.user,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: data.user.avatarType
        };

        setUser(updatedUserData);
        updateUser(updatedUserData);
        toast.success('Imagen de perfil actualizada correctamente');
      } else {
         throw new Error(data.error?.message || 'Respuesta inválida del servidor al subir imagen');
      }
    } catch (err) {
      handleApiError(err, 'subiendo imagen de perfil');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función para establecer un avatar predeterminado
  const setDefaultProfilePicture = async (type: string) => {
    if (!authToken) {
        logout();
        return;
    }

    setIsLoading(true);
    setError('');
    setIsProfilePictureMenuOpen(false);

    let response: Response | null = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/avatars/default/${type}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (data.success && data.user) {
        // API confirmed success, now find the selected picture details from state
        const selectedPic = defaultProfilePictures.find(pic => pic.type === type);

        if (!selectedPic) {
          console.error(`Could not find details for default picture type: ${type}`);
          toast.error('Error al obtener detalles de la imagen seleccionada.');
          setIsLoading(false);
          return; // Stop execution if details aren't found
        }

        // Construct updated data using user info from API response 
        // BUT profile picture info from the selected default option
        const updatedUserData = {
          ...data.user, // Base user info from API
          profilePictureUrl: selectedPic.url, // Use the URL from state
          // Ensure the type starts with "default-" so ProfilePicture component renders it
          profilePictureType: `default-${selectedPic.type}` 
        };

        setUser(updatedUserData);
        updateUser(updatedUserData);
        toast.success('Imagen de perfil actualizada correctamente');
      } else {
         throw new Error(data.error?.message || 'Error al establecer imagen de perfil predeterminada');
      }
    } catch (err) {
       handleApiError(err, 'estableciendo imagen de perfil predeterminada');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para volver a la inicial del nombre
  const resetProfilePicture = async () => {
    if (!authToken) {
        logout();
        return;
    }

    setIsLoading(true);
    setError('');
    setIsProfilePictureMenuOpen(false);

    let response: Response | null = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/avatars/reset`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (data.success && data.user) {
        const updatedUserData = {
          ...data.user,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: 'initial'
        };

        setUser(updatedUserData);
        updateUser(updatedUserData);
        toast.success('Imagen de perfil restablecida a iniciales');
      } else {
         throw new Error(data.error?.message || 'Error al restablecer imagen de perfil');
      }
    } catch (err) {
      handleApiError(err, 'restableciendo imagen de perfil');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Función para alternar visibilidad Y mostrar advertencia ---
  const toggleApiKeyVisibility = () => {
    const nextVisibility = !isApiKeyVisible;
    setIsApiKeyVisible(nextVisibility);
    setShowApiGenerationSuccess(false);
    setShowApiKeyWarning(nextVisibility);
  };

  const currentApiKey = authUser?.currentApiKey;

  // --- Effect for handling clicks outside the avatar menu ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if clicked outside menu AND outside button
      if (
        profilePictureMenuRef.current && 
        !profilePictureMenuRef.current.contains(event.target as Node) &&
        profilePictureButtonRef.current &&
        !profilePictureButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfilePictureMenuOpen(false);
      }
    };

    // Add listener if menu is open
    if (isProfilePictureMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Remove listener if menu is closed
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup listener on component unmount or when menu closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfilePictureMenuOpen]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 bg-gray-100">
        <p className="text-lg text-gray-600">Cargando perfil...</p>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 bg-gray-100">
        <div className="w-full max-w-md bg-white p-6 border border-red-300 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Error al Cargar Perfil</h2>
          <p className="text-red-700">
            {error ||
              'No se pudieron cargar los datos del usuario. Intenta iniciar sesión de nuevo.'}
          </p>
          <Button onClick={() => router.push('/login')} className="mt-6">
            Ir a Inicio de Sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-gray-100">
      <div className="w-full max-w-3xl space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">Mi Perfil</h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white p-6 border rounded-lg shadow-md">
          {/* Sección de avatar */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="relative mb-3"> 
              <ProfilePicture user={user} size="xl" />
              <button
                ref={profilePictureButtonRef}
                onClick={() => setIsProfilePictureMenuOpen(!isProfilePictureMenuOpen)}
                disabled={isLoading}
                className={`absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Cambiar imagen de perfil"
              >
                <Pencil className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            {/* Input oculto para cargar archivos */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            
            {/* Menú desplegable para opciones de imagen de perfil */}
            {isProfilePictureMenuOpen && (
              <div 
                ref={profilePictureMenuRef}
                className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg p-3 z-20 w-auto min-w-[12rem]">
                <div className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b">Imagen de perfil</div>
                {/* Opciones de Subir y Resetear */}
                <div className="space-y-1 mb-3">
                  <div>
                    <button 
                      onClick={handleUploadClick}
                      className="text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center text-sm w-full disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir imagen
                    </button>
                  </div>
                  <div>
                    <button 
                      onClick={resetProfilePicture}
                      className="text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center text-sm w-full disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restablecer a iniciales
                    </button>
                  </div>
                </div>
                {/* Separador y sección de imágenes predeterminadas */}
                <div className="text-xs font-medium text-gray-500 mb-2 pt-2 border-t">BarBots:</div>
                <div className="grid grid-cols-3 gap-3 place-items-center">
                  {defaultProfilePictures.map((pic: DefaultAvatar) => (
                    <div key={pic.type} className="flex justify-center">
                      <button 
                        onClick={() => setDefaultProfilePicture(pic.type)}
                        className="p-1 hover:bg-gray-100 rounded-md flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-16"
                        disabled={isLoading}
                      >
                        <img 
                          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004'}${pic.url}`} 
                          alt={pic.type} 
                          className="h-12 w-12 rounded-full mb-1"
                        />
                        <span className="text-xs text-gray-600 truncate">{pic.type}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Información Personal</h3>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
              >
                Editar
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Apellido <span className="text-gray-500 text-xs">(Opcional)</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  disabled={isLoading} 
                  placeholder="(Opcional)" 
                />
                <p className="mt-1 text-xs text-gray-500">
                  Solo letras, números, guion bajo (_) y guion medio (-). Mínimo 3 caracteres.
                </p>
              </div>
              <div>
                <Label htmlFor="email-display" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <Input
                  id="email-display"
                  type="email"
                  value={user?.email || ''}
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFirstName(user?.firstName || '');
                    setLastName(user?.lastName || '');
                    setUsername(user?.username || '');
                    setError('');
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.firstName}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Apellido</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.lastName || '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nombre de usuario</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username || '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Rol</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
              </div>
              {user?.createdAt && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="bg-white p-6 border rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">API Key</h3>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tu API Key te permite interactuar con el servicio de forma programática.
            </p>

            {currentApiKey && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 font-medium">API Key generada:</Label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-md border border-gray-300">
                  <code className="flex-1 text-sm break-all font-mono text-gray-800">
                    {isApiKeyVisible ? currentApiKey : '••••••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleApiKeyVisibility}
                    aria-label={isApiKeyVisible ? "Ocultar API Key" : "Mostrar API Key"}
                    className="flex-shrink-0 h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    {isApiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={handleCopyApiKey}
                    aria-label="Copiar API Key"
                    className="flex-shrink-0 h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {showApiGenerationSuccess && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded mt-2">
                    <p className="text-sm text-green-800">
                      <span className="font-bold">Éxito:</span> Nueva API key generada. Guárdala bien, no se mostrará de nuevo.
                    </p>
                  </div>
                )}
                {showApiKeyWarning && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded mt-2">
                    <p className="text-sm text-red-800">
                      <span className="font-bold">¡Importante!</span> Esta API Key sólo se mostrará una vez. Guárdala en un lugar seguro.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={generateApiKey} disabled={isLoading}>
              {isLoading 
                ? 'Generando...' 
                : currentApiKey 
                  ? 'Regenerar API Key' 
                  : 'Generar nueva API Key'}
            </Button>
            <p className="text-xs text-gray-500">
              Nota: Al generar una nueva API Key, cualquier API Key anterior dejará de funcionar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
