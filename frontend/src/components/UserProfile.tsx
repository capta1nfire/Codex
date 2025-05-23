'use client';

import React from 'react';
import { useUserProfileLogic } from '@/hooks/useUserProfileLogic';
import ProfileForm from './profile/ProfileForm';
import ApiKeySection from './profile/ApiKeySection';
import ProfilePictureUpload from './profile/ProfilePictureUpload';

export default function UserProfile() {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No autenticado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-8">
        <h2 className="text-3xl font-bold text-center">Mi Perfil</h2>

        {error && (
          <div
            className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="bg-card p-6 border border-border rounded-lg shadow-md">
          <ProfilePictureUpload
            user={user}
            isLoading={isLoading}
            defaultProfilePictures={defaultProfilePictures}
            onFileUpload={handleFileUpload}
            onSetDefaultPicture={handleSetDefaultProfilePicture}
            onResetPicture={handleResetProfilePicture}
          />
        </div>

        {/* Profile Form Section */}
        <ProfileForm
          user={user}
          isEditing={isEditing}
          isLoading={isLoading}
          onSubmit={handleProfileUpdate}
          onEditToggle={handleEditToggle}
        />

        {/* API Key Section */}
        <ApiKeySection
          currentApiKey={user.currentApiKey}
          isLoading={isLoading}
          onGenerateApiKey={handleGenerateApiKey}
        />
      </div>
    </div>
  );
}
