'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Check, 
  AtSign,
  Smartphone
} from 'lucide-react';
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
      phone: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (user && user.firstName) {
      const resetData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
      };
      
      setTimeout(() => {
        reset(resetData);
        
        setValue('firstName', user.firstName || '');
        setValue('lastName', user.lastName || '');
        setValue('username', user.username || '');
        setValue('email', user.email || '');
        setValue('phone', user.phone || '');
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
        phone: user.phone || '',
        password: '',
      };
      
      setTimeout(() => {
        reset(resetData);
        
        setValue('firstName', user.firstName || '');
        setValue('lastName', user.lastName || '');
        setValue('username', user.username || '');
        setValue('email', user.email || '');
        setValue('phone', user.phone || '');
        setValue('password', '');
      }, 100);
    }
  }, [isEditing, user, reset, setValue]);

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Información Personal
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isEditing ? 'Actualiza tus datos personales' : 'Gestiona tu información básica y de contacto'}
          </p>
        </div>
        <Button
          type="button"
          onClick={onEditToggle}
          variant={isEditing ? "outline" : "outline"}
          size="sm"
          disabled={isLoading}
          className={`transition-all duration-200 ${
            isEditing 
              ? 'hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-300 dark:hover:border-red-600 text-red-600 dark:text-red-400' 
              : 'hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-600'
          }`}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      {!isEditing ? (
        // READ MODE - Clean display with subtle improvements
        <div className="bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-950/30 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg mt-1">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nombre completo</Label>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg mt-1">
                  <AtSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Usuario</Label>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {user?.username || (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal">No definido</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg mt-1">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Correo electrónico</Label>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {user?.email}
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-700">
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    Verificado
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg mt-1">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">Teléfono</Label>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {user?.phone || (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal">No registrado</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // EDIT MODE - Enhanced form
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gradient-to-br from-white/80 to-slate-50/50 dark:from-slate-800/80 dark:to-slate-700/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  disabled={isLoading}
                  className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="Tu nombre"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  disabled={isLoading}
                  className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="Tu apellido"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Nombre de usuario
                </Label>
                <Input
                  id="username"
                  {...register('username')}
                  disabled={isLoading}
                  placeholder="Opcional"
                  className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                />
                {errors.username && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  disabled={isLoading}
                  placeholder="+1234567890 (opcional)"
                  className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Email - Full width */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isLoading}
                className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password - Full width */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Nueva contraseña
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isLoading}
                placeholder="Dejar en blanco para no cambiar"
                className="w-full transition-all duration-200 focus:border-blue-500 dark:focus:border-blue-400"
              />
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <Button
              type="button"
              onClick={onEditToggle}
              variant="outline"
              disabled={isLoading}
              className="transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isDirty || !isValid}
              className="min-w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Guardar cambios
                </div>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 