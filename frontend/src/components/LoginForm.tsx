'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/schemas/auth.schema';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');

    const result = await login(data.email, data.password);

    console.log('Resultado de login:', result);

    if (result.success) {
      const welcomeMessage = result.user
        ? `¡Bienvenido ${result.user.username}!`
        : '¡Inicio de sesión exitoso!';
      toast.success(welcomeMessage);

      setTimeout(() => {
        router.push('/');
      }, 300);
    } else {
      toast.error(result.message || 'Error al iniciar sesión');
      setServerError(result.message || 'Error desconocido durante el inicio de sesión.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-[450px] p-12 rounded-2xl shadow-lg bg-white">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-600">Codex</span>
          </div>
        </div>

        <h2 className="text-2xl font-normal text-center mb-8">Inicia sesión en Codex</h2>

        {serverError && (
          <div className="bg-red-50 border border-red-300 rounded-md p-3 mb-6 text-red-900 text-sm">
            <p>{serverError}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`appearance-none block w-full px-3 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base`}
              placeholder="Correo electrónico"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 text-left">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`appearance-none block w-full px-3 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base`}
              placeholder="Contraseña"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 text-left">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center mb-4">
            <input
              id="show-password"
              name="show-password"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="show-password" className="ml-2 block text-sm text-gray-700">
              Mostrar contraseña
            </label>
          </div>

          <div className="pt-4">
            <div className="flex justify-between items-center">
              <Link
                href="/register"
                className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Crear cuenta
              </Link>

              <button
                type="submit"
                className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
                disabled={isLoading || Object.keys(errors).length > 0}
              >
                {isLoading ? 'Procesando...' : 'Iniciar sesión'}
              </button>
            </div>

            <div className="mt-4 text-right">
              <Link
                href="/forgot-password"
                className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 flex space-x-6 text-sm text-gray-500">
        <a href="#" className="hover:text-gray-700">
          Ayuda
        </a>
        <a href="#" className="hover:text-gray-700">
          Privacidad
        </a>
        <a href="#" className="hover:text-gray-700">
          Términos
        </a>
      </div>
    </div>
  );
}
