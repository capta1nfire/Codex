"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  lastLogin?: string;
  apiKey?: string;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Sesión no válida. Por favor, inicie sesión de nuevo.');
        return;
      }

      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            router.push('/login');
            return;
          }
          throw new Error('Error al obtener datos del usuario');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          setName(data.user.name);
        } else {
          throw new Error('Respuesta inválida del servidor');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
      const response = await fetch(`${backendUrl}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al actualizar perfil');
      }

      if (data.success) {
        setUser({...user!, name});
        setMessage('Perfil actualizado con éxito');
        setIsEditing(false);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
      const response = await fetch(`${backendUrl}/api/auth/api-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al generar API key');
      }

      if (data.success && data.apiKey) {
        setApiKey(data.apiKey);
        setMessage('Nueva API key generada con éxito');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 bg-gray-50">
        <div className="text-blue-600 text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Mi Perfil
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6 text-red-900">
              <p>{error}</p>
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-300 rounded-md p-4 mb-6 text-green-900">
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Información personal</h3>
              {isEditing ? (
                <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <div className="mt-1">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className={`flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading
                          ? 'bg-blue-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setName(user?.name || '');
                      }}
                      className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Rol</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.role}</dd>
                  </div>
                  {user?.createdAt && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {user?.lastLogin && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Último acceso</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Editar perfil
                    </button>
                  </div>
                </dl>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">API Key</h3>
              <div className="mt-4">
                {user?.apiKey && (
                  <div className="mb-4">
                    <dt className="text-sm font-medium text-gray-500">API Key actual</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded overflow-auto">
                      {user.apiKey}
                    </dd>
                  </div>
                )}
                
                {apiKey && (
                  <div className="mb-4">
                    <dt className="text-sm font-medium text-green-600">Nueva API Key (guárdala, no se mostrará de nuevo)</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-green-50 p-2 rounded overflow-auto border border-green-300">
                      {apiKey}
                    </dd>
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateApiKey}
                  className={`mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                    isLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generando...' : 'Generar nueva API Key'}
                </button>
                <p className="mt-1 text-xs text-gray-500">
                  Al generar una nueva API Key, la anterior quedará invalidada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 