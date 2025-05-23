'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UpdateProfileFormData } from '@/schemas/auth.schema';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface DefaultAvatar {
  type: string;
  url: string;
}

export function useUserProfileLogic() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [defaultProfilePictures, setDefaultProfilePictures] = useState<DefaultAvatar[]>([]);

  const router = useRouter();
  const {
    user: authUser,
    isAuthenticated,
    isLoading: authLoading,
    token: authToken,
    updateUser,
    logout,
  } = useAuth();

  // Initialize loading state
  useEffect(() => {
    if (authUser) {
      setIsLoading(false);
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authUser, authLoading, isAuthenticated, router]);

  // Fetch default profile pictures
  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchDefaultProfilePictures();
    }
  }, [isAuthenticated, authToken]);

  const fetchDefaultProfilePictures = async () => {
    try {
      const data = await api.get('/api/avatars/default-options');
      if (data.success && data.avatarOptions) {
        setDefaultProfilePictures(data.avatarOptions);
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

    if (
      statusCode === 401 ||
      errorMessage.toLowerCase().includes('token inválido') ||
      errorMessage.toLowerCase().includes('unauthorized')
    ) {
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout();
    } else {
      setError(errorMessage);
      toast.error(`Error ${context}: ${errorMessage}`);
      console.error(`Error ${context}:`, { error });
    }
  };

  const handleProfileUpdate = async (data: UpdateProfileFormData) => {
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

    try {
      const responseData = await api.put(`/api/users/${authUser.id}`, updateData);

      if (responseData.success && responseData.user) {
        updateUser(responseData.user);
        setIsEditing(false);
        toast.success('Perfil actualizado correctamente');
      } else {
        throw new Error(
          responseData.error?.message || 'Respuesta inválida del servidor al actualizar'
        );
      }
    } catch (err) {
      handleApiError(err, 'actualizando perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setError('');
    setIsLoading(true);

    if (!authToken) {
      logout();
      return;
    }

    try {
      const data = await api.post('/api/auth/api-key');

      if (data.success && data.apiKey) {
        updateUser({ currentApiKey: data.apiKey });
        if (data.user) {
          updateUser({ ...data.user, currentApiKey: data.apiKey });
        }
        toast.success('API Key generada correctamente');
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

  const handleFileUpload = async (file: File) => {
    if (!authToken) {
      logout();
      return;
    }

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

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const data = await api.upload('/api/avatars/upload', formData);

      if (data.success && data.user) {
        const updatedUserData = {
          ...data.user,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: data.user.avatarType,
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
    }
  };

  const handleSetDefaultProfilePicture = async (type: string) => {
    if (!authToken) {
      logout();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.post(`/api/avatars/default/${type}`);

      if (data.success && data.user) {
        const updatedUserData = {
          ...data.user,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: data.user.avatarType,
        };

        updateUser(updatedUserData);
        toast.success('Imagen de perfil actualizada correctamente');
      } else {
        throw new Error(
          data.error?.message || 'Error al establecer imagen de perfil predeterminada'
        );
      }
    } catch (err) {
      handleApiError(err, 'estableciendo imagen de perfil predeterminada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProfilePicture = async () => {
    if (!authToken) {
      logout();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await api.post('/api/avatars/reset');

      if (data.success && data.user) {
        const updatedUserData = {
          ...data.user,
          profilePictureUrl: data.user.avatarUrl,
          profilePictureType: 'initial',
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  return {
    // State
    isLoading: isLoading || authLoading,
    error,
    isEditing,
    defaultProfilePictures,
    
    // User data
    user: authUser,
    isAuthenticated,
    
    // Handlers
    handleProfileUpdate,
    handleGenerateApiKey,
    handleFileUpload,
    handleSetDefaultProfilePicture,
    handleResetProfilePicture,
    handleEditToggle,
  };
} 