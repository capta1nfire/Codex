"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        setIsLoading(false);
        router.push('/login');
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
          let errorData = { error: { message: 'Error al obtener datos del usuario' } };
          try {
            errorData = await response.json();
          } catch (parseError) { /* Ignorar error de parseo */ }
          throw new Error(errorData.error?.message || 'Error al obtener datos del usuario');
        }

        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          setName(data.user.name);
          if (data.user.apiKey) {
             setApiKey(data.user.apiKey);
          }
        } else {
          throw new Error(data.error?.message || 'Respuesta inválida del servidor');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar perfil.');
        setUser(null);
        setName('');
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
    if (!token || !user) {
      router.push('/login');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
      const response = await fetch(`${backendUrl}/api/users/${user.id}`, {
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

      if (data.success && data.user) {
        setUser(data.user);
        setName(data.user.name);
        setMessage('Perfil actualizado con éxito');
        setIsEditing(false);
      } else {
        throw new Error(data.error?.message || 'Respuesta inválida del servidor al actualizar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
    setApiKey('');

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
        if(data.user) {
          setUser(data.user);
        }
        setMessage('Nueva API key generada con éxito. Guárdala bien, no se mostrará de nuevo.');
      } else {
        throw new Error(data.error?.message || 'Respuesta inválida del servidor al generar API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al generar API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 bg-gray-100">
        <p className="text-lg text-gray-600">Cargando perfil...</p>
      </div>
    );
  }
  
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 bg-gray-100">
         <div className="w-full max-w-md bg-white p-6 border border-red-300 rounded-lg shadow-md text-center">
             <h2 className="text-xl font-semibold mb-4 text-red-800">Error al Cargar Perfil</h2>
             <p className="text-red-700">{error || "No se pudieron cargar los datos del usuario. Intenta iniciar sesión de nuevo."}</p>
             <Button onClick={() => router.push('/login')} className="mt-6">Ir a Inicio de Sesión</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-gray-100">
      <div className="w-full max-w-3xl space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Mi Perfil
        </h2>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        {message && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Éxito: </strong>
                <span className="block sm:inline">{message}</span>
            </div>
        )}

        <div className="bg-white p-6 border rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Información Personal</h3>
                {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isLoading}>
                        Editar
                    </Button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                      <Label htmlFor="email-display" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
                      <Input
                          id="email-display"
                          type="email"
                          value={user?.email || ''}
                          className="mt-1 bg-gray-100 cursor-not-allowed"
                          disabled
                      />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => {
                        setIsEditing(false);
                        setName(user?.name || '');
                        setError('');
                      }}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
            ) : (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
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
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
                  </div>
                  {user?.createdAt && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </dd>
                    </div>
                  )}
                  {user?.lastLogin && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Último acceso</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                         {new Date(user.lastLogin).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </dd>
                    </div>
                  )}
                </dl>
            )}
        </div>

        <div className="bg-white p-6 border rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">API Key</h3>
            <div className="space-y-4">
                {apiKey && (
                    <div>
                        <Label className={`text-sm font-medium ${message.includes("Nueva") ? 'text-green-700' : 'text-gray-500'}`}>
                            {message.includes("Nueva") ? 'Nueva API Key (Guárdala bien)' : 'API Key actual'}
                        </Label>
                        <div className={`mt-1 text-sm text-gray-900 font-mono p-3 rounded break-all ${message.includes("Nueva") ? 'bg-green-50 border border-green-300' : 'bg-gray-100'}`}>
                            {apiKey}
                        </div>
                    </div>
                )}
                {!apiKey && user?.apiKey && (
                    <div>
                        <Label className="text-sm font-medium text-gray-500">API Key actual</Label>
                        <div className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-3 rounded break-all">
                            {user.apiKey}
                        </div>
                    </div>
                )}
                
                <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateApiKey}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Generando...' : (user?.apiKey || apiKey ? 'Generar Nueva API Key' : 'Generar API Key')}
                    </Button>
                    <p className="mt-1.5 text-xs text-gray-600">
                      {user?.apiKey || apiKey ? 'Al generar una nueva, la anterior quedará invalidada.' : 'Genera tu primera API Key para usar la API.'}
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
} 