'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchemaFrontend, RegisterFormData } from '@/schemas/auth.schema';

export default function RegisterForm() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchemaFrontend),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 
          responseData.error?.message || 
          'Error al registrar usuario'
        );
      }

      if (responseData.success) {
        setSuccessMessage('¡Usuario creado con éxito! Redirigiendo a inicio de sesión...');
        reset();
      } else {
        throw new Error(
          responseData.message || 
          responseData.error?.message || 
          'Respuesta inválida del servidor'
        );
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Crear una cuenta</h2>

        <div className="bg-white py-8 px-6 shadow rounded-lg w-full">
          {successMessage && (
            <div className="bg-green-50 border border-green-300 rounded-md p-4 mb-6 text-green-900">
              <p>{successMessage}</p>
            </div>
          )}

          {serverError && !successMessage && (
            <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6 text-red-900">
              <p>{serverError}</p>
            </div>
          )}

          {!successMessage && (
            <>
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      {...register('firstName')}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-600 text-left">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Apellido <span className="text-gray-500 text-xs">(Opcional)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      {...register('lastName')}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-600 text-left">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 text-left">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register('password')}
                      className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600 text-left">{errors.password.message}</p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isLoading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                    disabled={isLoading || !successMessage && Object.keys(errors).length > 0 }
                  >
                    {isLoading ? 'Procesando...' : 'Registrarse'}
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
