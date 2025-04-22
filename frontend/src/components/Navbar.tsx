'use client';

// import { useState, useEffect } from 'react'; // Ya no se necesitan
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, BarChart2, QrCode, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Importar useAuth
import { useState } from 'react'; // Mantener useState para isMenuOpen, isUserMenuOpen

// Ya no necesitamos la interfaz User aquí, vendrá del contexto
/*
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}
*/

// Default export of the Navbar component
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Obtener estado y funciones del contexto
  const { user, isLoading, logout } = useAuth();

  const pathname = usePathname();
  const router = useRouter(); // Todavía podríamos necesitarlo para otras navegaciones

  // Eliminar el useEffect que hacía fetch localmente
  /*
  useEffect(() => {
    // ... lógica de fetch eliminada ...
  }, []);
  */

  // Función de logout ahora usa la función del contexto
  const handleLogout = () => {
    logout(); // Llama a la función logout del contexto
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    // La redirección la puede manejar el contexto o simplemente el estado cambia
    // router.push('/'); // Opcional: redirigir si el contexto no lo hace
  };

  // Enlaces de navegación - definidos una vez para reutilizar en escritorio y móvil
  const navigationLinks = [
    {
      href: '/',
      label: 'Generador',
      icon: <QrCode className="h-4 w-4 md:mr-2 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />,
      isActive: pathname === '/',
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <BarChart2 className="h-4 w-4 md:mr-2 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />,
      isActive: pathname.includes('/dashboard'),
    },
  ];

  return (
    <header className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 shadow-md sticky top-0 z-50">
      {/* Versión de escritorio */}
      <div className="max-w-6xl mx-auto px-4 lg:max-w-7xl xl:max-w-full xl:px-12 2xl:max-w-screen-2xl">
        <nav className="flex items-center justify-between h-16 lg:h-20 xl:h-24">
          {/* Logo siempre visible */}
          <Link href="/" className="flex items-center">
            <span className="font-bold text-2xl text-white lg:text-3xl xl:text-4xl">CODEX</span>
          </Link>

          {/* Navegación principal - visible en escritorio, oculta en móvil */}
          <div className="hidden md:flex items-center justify-center flex-1 ml-6 lg:ml-10 xl:ml-16">
            <div className="flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                    lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-3 xl:text-lg
                    ${
                      link.isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span className="mr-2 lg:mr-3">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sección de usuario */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-24 bg-blue-800/50 rounded animate-pulse lg:h-10 lg:w-32 xl:h-12 xl:w-40"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full bg-blue-800/50 border border-blue-700 hover:bg-blue-800/70 transition
                  lg:px-4 lg:py-3 lg:space-x-3 xl:px-5 xl:py-3 xl:space-x-4"
                >
                  <div
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white
                  lg:h-10 lg:w-10 xl:h-12 xl:w-12"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-white hidden sm:inline lg:text-lg xl:text-xl">
                    {user.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-blue-200 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50
                  lg:w-56 lg:mt-3 xl:w-64"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50
                      lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-4 xl:text-lg"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                      Mi Perfil
                    </Link>
                    {user.role === 'ADMIN' && ( // Comparar con rol del contexto
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50
                        lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-4 xl:text-lg"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-500 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout} // Llama a la nueva función handleLogout
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left
                      lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-4 xl:text-lg"
                    >
                      <LogOut className="mr-3 h-4 w-4 text-gray-500 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6">
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium rounded-md text-white hover:bg-blue-800/40 transition-all duration-200
                  lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-3 xl:text-lg"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50 shadow-sm transition-all duration-200
                  lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-3 xl:text-lg"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Botón hamburguesa móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-2 md:hidden inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800/50"
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Menú móvil - fuera del layout principal para que no se superponga */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-blue-800 bg-gradient-to-b from-blue-900 to-indigo-900">
          <div className="py-2 space-y-1 px-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-md ${
                  link.isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {/* Lógica condicional móvil basada en contexto */}
            {isLoading ? (
               <div className="h-10 bg-blue-800/50 rounded animate-pulse mt-2"></div>
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                 >
                   <User className="mr-3 h-5 w-5" />
                   Mi Perfil
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Panel Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white text-left"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link
                   href="/login"
                   className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                   onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                   href="/register"
                   className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                   onClick={() => setIsMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
