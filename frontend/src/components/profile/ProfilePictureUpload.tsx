'use client';

import React, { useState, useRef, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
import { Upload, Pencil } from 'lucide-react';
import ProfilePicture from '../ui/ProfilePicture';

interface DefaultAvatar {
  type: string;
  url: string;
}

interface ProfilePictureUploadProps {
  user: any;
  isLoading: boolean;
  defaultProfilePictures: DefaultAvatar[];
  onFileUpload: (file: File) => Promise<void>;
  onSetDefaultPicture: (type: string) => Promise<void>;
  onResetPicture: () => Promise<void>;
}

export default function ProfilePictureUpload({
  user,
  isLoading,
  defaultProfilePictures,
  onFileUpload,
  onSetDefaultPicture,
  onResetPicture,
}: ProfilePictureUploadProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      // toast.error('El archivo debe ser una imagen (JPG o PNG)');
      return;
    }

    if (file.size > maxSize) {
      // toast.error('La imagen no debe superar los 5MB');
      return;
    }

    await onFileUpload(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsMenuOpen(false);
  };

  const handleSetDefault = async (type: string) => {
    await onSetDefaultPicture(type);
    setIsMenuOpen(false);
  };

  const handleReset = async () => {
    await onResetPicture();
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col items-center mb-6 relative">
      <div className="relative mb-3">
        <ProfilePicture user={user} size="xl" className="border border-border" />
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isLoading}
          className={`absolute bottom-1 right-1 p-2 bg-card rounded-full shadow-md border border-border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Cambiar imagen de perfil"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
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

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full mt-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-20 w-auto min-w-[12rem]"
        >
          <div className="text-sm font-medium text-popover-foreground mb-2 pb-1 border-b border-border">
            Imagen de perfil
          </div>
          
          <div className="space-y-1 mb-3">
            {/* Upload Custom Image */}
            <button
              onClick={handleUploadClick}
              className="text-left px-3 py-2 hover:bg-muted rounded-md flex items-center text-sm w-full disabled:opacity-50 text-popover-foreground"
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir imagen
            </button>

            {/* Reset to Initials */}
            <button
              onClick={handleReset}
              className="text-left px-3 py-2 hover:bg-muted rounded-md flex items-center text-sm w-full disabled:opacity-50 text-popover-foreground"
              disabled={isLoading}
            >
              Restablecer a iniciales
            </button>
          </div>

          {/* Default Pictures */}
          {defaultProfilePictures.length > 0 && (
            <>
              <div className="text-xs font-medium text-muted-foreground mb-2 pb-1 border-b border-border">
                Imágenes predeterminadas
              </div>
              <div className="space-y-1">
                {defaultProfilePictures.map((avatar) => (
                  <button
                    key={avatar.type}
                    onClick={() => handleSetDefault(avatar.type)}
                    className="text-left px-3 py-2 hover:bg-muted rounded-md text-sm w-full disabled:opacity-50 text-popover-foreground capitalize"
                    disabled={isLoading}
                  >
                    {avatar.type}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 