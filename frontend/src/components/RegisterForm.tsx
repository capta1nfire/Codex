'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('El correo electrónico ya está registrado');
        }
        throw new Error(data.error?.message || 'Error al registrar usuario');
      }

      if (data.success) {
        setSuccessMessage('¡Usuario creado con éxito! Redirigiendo a inicio de sesión...');
      } else {
        throw new Error(data.error?.message || 'Respuesta inválida del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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

          {error && !successMessage && (
            <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6 text-red-900">
              <p>{error}</p>
            </div>
          )}

          {!successMessage && (
            <>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Nombre
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Correo electrónico
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 text-left"
                  >
                    Contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    La contraseña debe tener al menos 8 caracteres, e incluir letras mayúsculas,
                    minúsculas y números.
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
                    disabled={isLoading}
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
