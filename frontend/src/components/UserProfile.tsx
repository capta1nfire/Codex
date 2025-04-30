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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserProfileSchema, UpdateProfileFormData } from '@/schemas/auth.schema';

interface DefaultAvatar {
  type: string;
  url: string;
}

export default function UserProfile() {
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

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateUserProfileSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '', 
      lastName: '', 
      username: '', 
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    if (authUser) {
      reset({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        username: authUser.username || '',
        email: authUser.email || '',
        password: '',
      });
      setIsLoading(false);
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [reset, authUser, authLoading, isAuthenticated, router]);

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

  const handleApiError = (error: unknown, context: string) => {
    let errorMessage = 'Error desconocido';
    let statusCode: number | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      statusCode = (error as any).status;
    }

    if (statusCode === 401 || errorMessage.toLowerCase().includes('token inválido') || errorMessage.toLowerCase().includes('unauthorized')) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout();
    } else {
      setError(errorMessage);
      toast.error(`Error ${context}: ${errorMessage}`);
      console.error(`Error ${context}:`, { error });
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    setError('');
    setIsLoading(true);

    if (!authToken || !authUser) {
      logout();
      return;
    }

    const updateData: Partial<UpdateProfileFormData> = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    if (updateData.username === '' || updateData.username === null) {
        updateData.username = null;
    }

    let response: Response | null = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      response = await fetch(`${backendUrl}/api/users/${authUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData), 
      });

      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(responseData.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (responseData.success && responseData.user) {
        reset(responseData.user);
        updateUser(responseData.user);
        setIsEditing(false);
        toast.success('Perfil actualizado correctamente');
      } else {
        throw new Error(responseData.error?.message || 'Respuesta inválida del servidor al actualizar');
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
        if (response.status === 401) {
           const error = new Error(data.error?.message || `Error ${response.status}`);
           (error as any).status = response.status; 
           throw error;
        }
        console.error("Error en la respuesta real:", data); 
        const error = new Error(data.error?.message || `Error ${response.status}`);
        (error as any).status = response.status; 
        throw error;
      }

      if (data.success && data.apiKey) {
        updateUser({ currentApiKey: data.apiKey });
        setShowApiGenerationSuccess(true);
        if (data.user) {
          updateUser({ ...data.user, currentApiKey: data.apiKey }); 
        }
      } else {
        throw new Error(
          data.error?.message || 'Respuesta inválida del servidor al generar API key'
        );
      }
    } catch (err) {
      handleApiError(err, 'generando API Key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authToken) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024;

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
        const updatedUserData = {
            ...data.user,
            profilePictureUrl: data.user.avatarUrl, 
            profilePictureType: data.user.avatarType, 
        };

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

  const toggleApiKeyVisibility = () => {
    const nextVisibility = !isApiKeyVisible;
    setIsApiKeyVisible(nextVisibility);
    setShowApiGenerationSuccess(false);
    setShowApiKeyWarning(nextVisibility);
  };

  const currentApiKey = authUser?.currentApiKey;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profilePictureMenuRef.current && 
        !profilePictureMenuRef.current.contains(event.target as Node) &&
        profilePictureButtonRef.current &&
        !profilePictureButtonRef.current.contains(event.target as Node)
      ) {
        setIsProfilePictureMenuOpen(false);
      }
    };

    if (isProfilePictureMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfilePictureMenuOpen]);

  const handleEditToggle = () => {
    if (isEditing) {
       reset({ 
         firstName: authUser?.firstName || '',
         lastName: authUser?.lastName || '',
         username: authUser?.username || '',
         email: authUser?.email || '', 
         password: '', 
       });
    }
    setIsEditing(!isEditing);
  };

  if (isLoading || authLoading) {
    return <div>Cargando perfil...</div>;
  }

  if (!isAuthenticated || !authUser) {
    return <div>No autenticado.</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8">
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
          <div className="flex flex-col items-center mb-6 relative">
            <div className="relative mb-3"> 
              <ProfilePicture user={authUser} size="xl" className="border border-border" />
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
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            
            {isProfilePictureMenuOpen && (
              <div 
                ref={profilePictureMenuRef}
                className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg p-3 z-20 w-auto min-w-[12rem]">
                <div className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b">Imagen de perfil</div>
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
                onClick={handleEditToggle}
                disabled={isLoading}
              >
                Editar
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  {...register('firstName')}
                  disabled={!isEditing}
                  className={`mt-1 ${!isEditing ? 'bg-gray-100' : ''}`}
                />
                {errors.firstName && isEditing && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Apellido <span className="text-gray-500 text-xs">(Opcional)</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  {...register('lastName')}
                  disabled={!isEditing}
                  className={`mt-1 ${!isEditing ? 'bg-gray-100' : ''}`}
                />
                {errors.lastName && isEditing && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input 
                  id="username" 
                  type="text" 
                  {...register('username')} 
                  disabled={!isEditing}
                  className={`mt-1 ${!isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="(Opcional)"
                />
                {errors.username && isEditing && (
                  <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...register('password')} 
                  disabled={!isEditing}
                  className={`mt-1 ${!isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="Dejar vacío para no cambiar"
                />
                {errors.password && isEditing && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres, con mayúsculas, minúsculas y números si se establece.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit" disabled={isLoading || !isDirty || !isValid}>
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleEditToggle}
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
                <dd className="mt-1 text-sm text-gray-900">{authUser?.firstName}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Apellido</dt>
                <dd className="mt-1 text-sm text-gray-900">{authUser?.lastName || '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nombre de usuario</dt>
                <dd className="mt-1 text-sm text-gray-900">{authUser?.username || '-'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                <dd className="mt-1 text-sm text-gray-900">{authUser?.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Rol</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{authUser?.role}</dd>
              </div>
              {authUser?.createdAt && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(authUser.createdAt).toLocaleDateString('es-ES', {
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
