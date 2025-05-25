'use client';

import React from 'react';
import { useUserProfileLogic } from '@/hooks/useUserProfileLogic';
import ProfileForm from './profile/ProfileForm';
import ApiKeySection from './profile/ApiKeySection';
import ProfilePictureUpload from './profile/ProfilePictureUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Key, Camera, AlertCircle } from 'lucide-react';

interface UserProfileProps {
  isAdvancedMode?: boolean;
}

export default function UserProfile({ isAdvancedMode }: UserProfileProps) {
  const {
    isLoading,
    error,
    isEditing,
    defaultProfilePictures,
    user,
    isAuthenticated,
    handleProfileUpdate,
    handleGenerateApiKey,
    handleFileUpload,
    handleSetDefaultProfilePicture,
    handleResetProfilePicture,
    handleEditToggle,
  } = useUserProfileLogic();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md p-8">
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <CardTitle className="text-lg mb-2">Cargando perfil</CardTitle>
            <CardDescription>Obteniendo información del usuario...</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md p-8">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-lg mb-2 text-destructive">Acceso denegado</CardTitle>
            <CardDescription>Debes iniciar sesión para ver tu perfil.</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Error Alert */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Se produjo un error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Picture */}
        <div className="lg:col-span-1">
          <Card className="h-fit sticky top-6 shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>
                Personaliza tu imagen de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePictureUpload
                user={user}
                isLoading={isLoading}
                defaultProfilePictures={defaultProfilePictures}
                onFileUpload={handleFileUpload}
                onSetDefaultPicture={handleSetDefaultProfilePicture}
                onResetPicture={handleResetProfilePicture}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Form & API Keys */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y credenciales de acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                user={user}
                isEditing={isEditing}
                isLoading={isLoading}
                onSubmit={handleProfileUpdate}
                onEditToggle={handleEditToggle}
              />
            </CardContent>
          </Card>

          {/* API Keys Section - Solo visible en modo avanzado */}
          {isAdvancedMode && (
            <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Claves API
                </CardTitle>
                <CardDescription>
                  Gestiona tus claves de API para integración con servicios externos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeySection
                  currentApiKey={user.currentApiKey}
                  isLoading={isLoading}
                  onGenerateApiKey={handleGenerateApiKey}
                />
              </CardContent>
            </Card>
          )}

          {/* Account Summary Card */}
          <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Cuenta</CardTitle>
              <CardDescription>
                Información general de tu cuenta CODEX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuario ID:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">#{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre completo:</span>
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuenta creada:</span>
                    <span className="font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">Activo</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última actualización:</span>
                    <span className="font-medium">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
