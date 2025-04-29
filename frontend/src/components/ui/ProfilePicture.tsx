'use client';

import React, { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

// Definir los tipos para las props del componente
interface ProfilePictureUser { // Renamed from AvatarUser
  firstName: string;
  lastName?: string;
  profilePictureUrl?: string | null; // Renamed from avatarUrl
  profilePictureType?: string | null; // Renamed from avatarType
}

// Interfaz para las props del componente principal
interface ProfilePictureProps extends VariantProps<typeof profilePictureVariants> { // Renamed from AvatarProps
  user: ProfilePictureUser | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Keep original sizes or adjust if needed
  className?: string;
}

// Configuración de variantes CVA para tamaños y estilos
const profilePictureVariants = cva(
  'relative inline-flex items-center justify-center rounded-full overflow-hidden text-gray-600 font-semibold',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 lg:h-12 lg:w-12 text-base',
        lg: 'h-14 w-14 xl:h-16 xl:w-16 text-2xl',
        xl: 'h-20 w-20 xl:h-24 xl:w-24 text-3xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const ProfilePicture: React.FC<ProfilePictureProps> = ({ user, size = 'md', className = '' }) => { // Renamed from Avatar
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';

  // Placeholder si no hay datos de usuario
  const placeholder = useMemo(() => (
    <span className={cn(profilePictureVariants({ size }), 'bg-gray-200', className)}
          aria-label="Profile picture de usuario">
      <svg className="absolute inset-0 w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" fillRule="evenodd" />
      </svg>
    </span>
  ), [size, className]);

  if (!user) {
    return placeholder;
  }

  // Determinar qué mostrar basado en el tipo y URL
  let profilePictureElement: React.ReactNode; // Renamed from avatarElement

  const initials = useMemo(() => {
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return `${first}${last}`.toUpperCase();
  }, [user.firstName, user.lastName]);

  // Lógica para determinar el contenido
  if (user.profilePictureType === 'initial' || !user.profilePictureType) {
    profilePictureElement = (
      <span title={`${user.firstName} ${user.lastName || ''}`.trim()}
            aria-label={`Iniciales de ${user.firstName}`}
            className="flex items-center justify-center w-full h-full bg-blue-100 text-blue-700">
        {initials}
      </span>
    );
  } else if (user.profilePictureType !== 'initial' && user.profilePictureUrl) {
    const fullUrl = user.profilePictureUrl.startsWith('http')
      ? user.profilePictureUrl
      : `${backendUrl}${user.profilePictureUrl}`;
    profilePictureElement = (
      <img
        className="object-cover w-full h-full"
        src={fullUrl}
        alt={`Profile picture de ${user.firstName}`}
        onError={(e) => {
          console.error('Error loading profile picture:', fullUrl, e);
        }}
      />
    );
  } else {
    profilePictureElement = placeholder;
  }

  // Renderizar el contenedor con el contenido determinado
  return (
    <div className={cn(profilePictureVariants({ size }), className)}>
      {profilePictureElement}
    </div>
  );
};

export default ProfilePicture;