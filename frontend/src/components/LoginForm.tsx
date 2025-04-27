'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = email, 2 = password
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validar email básico
      if (email.includes('@')) {
        setStep(2);
        return;
      } else {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }
    }
    
    setError('');

    const result = await login(email, password);
    
    // Debug - Mostrar el resultado completo
    console.log('Resultado de login:', result);

    if (result.success) {
      // Mostrar toast de éxito antes de redirigir
      const welcomeMessage = result.user
        ? `¡Bienvenido ${result.user.username}!`
        : '¡Inicio de sesión exitoso!';
      toast.success(welcomeMessage);
      
      // Pequeño retraso para que el usuario vea el toast antes de la redirección
      setTimeout(() => {
        router.push('/');
      }, 300);
    } else {
      toast.error(result.message || 'Error al iniciar sesión');
      setError(result.message || 'Error desconocido durante el inicio de sesión.');
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
        
        <h2 className="text-2xl font-normal text-center mb-8">
          {step === 1 ? 'Inicia sesión' : `Hola, ${email.split('@')[0]}`}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-3 mb-6 text-red-900 text-sm">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div>
              <div className="mb-5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Correo electrónico"
                  disabled={isLoading}
                />
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
                    disabled={isLoading}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Cambiar cuenta
                </button>
              </div>
              
              <div className="mb-5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Contraseña"
                  disabled={isLoading}
                />
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
                    href="/forgot-password"
                    className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                  
                  <button
                    type="submit"
                    className={`py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isLoading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Procesando...' : 'Iniciar sesión'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      
      <div className="mt-6 flex space-x-6 text-sm text-gray-500">
        <a href="#" className="hover:text-gray-700">Ayuda</a>
        <a href="#" className="hover:text-gray-700">Privacidad</a>
        <a href="#" className="hover:text-gray-700">Términos</a>
      </div>
    </div>
  );
}
