'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { updateUserProfileSchema, UpdateProfileFormData } from '@/schemas/auth.schema';

interface ProfileFormProps {
  user: any;
  isEditing: boolean;
  isLoading: boolean;
  onSubmit: (data: UpdateProfileFormData) => Promise<void>;
  onEditToggle: () => void;
}

export default function ProfileForm({ 
  user, 
  isEditing, 
  isLoading, 
  onSubmit, 
  onEditToggle 
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setValue,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateUserProfileSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (user && user.firstName) { // Ensure user has required data
      const resetData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
      };
      
      // Use setTimeout to ensure the form is ready
      setTimeout(() => {
        // First try reset
        reset(resetData);
        
        // As backup, also set individual values
        setValue('firstName', user.firstName || '');
        setValue('lastName', user.lastName || '');
        setValue('username', user.username || '');
        setValue('email', user.email || '');
        setValue('password', '');
      }, 100);
    }
  }, [user, reset, setValue]);

  React.useEffect(() => {
    if (!isEditing && user && user.firstName) {
      const resetData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
      };
      
      setTimeout(() => {
        reset(resetData);
        
        // Also set individual values
        setValue('firstName', user.firstName || '');
        setValue('lastName', user.lastName || '');
        setValue('username', user.username || '');
        setValue('email', user.email || '');
        setValue('password', '');
      }, 100);
    }
  }, [isEditing, user, reset, setValue]);

  return (
    <div className="bg-card p-6 border border-border rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Información Personal</h3>
        <Button
          type="button"
          onClick={onEditToggle}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              disabled={!isEditing || isLoading}
              className="w-full"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              disabled={!isEditing || isLoading}
              className="w-full"
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            {...register('username')}
            disabled={!isEditing || isLoading}
            placeholder="Opcional"
            className="w-full"
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={!isEditing || isLoading}
            className="w-full"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              disabled={isLoading}
              placeholder="Dejar en blanco para no cambiar"
              className="w-full"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        )}

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isDirty || !isValid}
              className="min-w-[100px]"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
} 