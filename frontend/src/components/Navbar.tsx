'use client';

// import { useState, useEffect } from 'react'; // Ya no se necesitan
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BarChart2, QrCode, User, LogOut, Settings, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Importar useAuth
import { useState, useRef, useEffect } from 'react'; // Added useRef, useEffect
import ProfilePicture from './ui/ProfilePicture'; // <-- Updated import

// Default export of the Navbar component
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Obtener estado y funciones del contexto
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  const pathname = usePathname();

  const userMenuRef = useRef<HTMLDivElement>(null); // Ref for dropdown
  const userProfilePictureButtonRef = useRef<HTMLButtonElement>(null); // <-- Renamed ref

  // Click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        userProfilePictureButtonRef.current &&
        !userProfilePictureButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
    {
      href: 'http://localhost:3004/api-docs/',
      label: 'API Docs',
      icon: <FileText className="h-4 w-4 md:mr-2 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />,
      isActive: false,
      isExternal: true,
    },
  ];

  // Re-añadir handleLogout
  const handleLogout = () => {
    logout(); 
    setIsUserMenuOpen(false); // Asegurar que el menú se cierre
    setIsMenuOpen(false);
  };

  // Simplified classes for avatar button
  const profilePictureButtonClasses = `flex items-center p-1 rounded-full hover:bg-blue-800/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-white transition`; // <-- Renamed variable

  return (
    <header className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between h-16 lg:h-20 xl:h-24">
          {/* Logo y enlaces de navegación */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-white font-bold text-lg lg:text-xl xl:text-2xl flex items-center"
              >
                <QrCode className="mr-2 h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8" />
                Codex
              </Link>
            </div>

            {/* Enlaces de navegación - versión desktop */}
            <div className="hidden md:ml-8 md:flex md:items-center md:space-x-2 lg:ml-10 lg:space-x-4 xl:ml-12 xl:space-x-6">
              {navigationLinks.map((link) => (
                link.isExternal ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white transition-all duration-200 
                    lg:px-5 lg:py-3 lg:text-base xl:px-6 xl:py-3 xl:text-lg"
                  >
                    <span className="mr-2 lg:mr-3">{link.icon}</span>
                    {link.label}
                  </a>
                ) : (
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
                )
              ))}
            </div>
          </div>

          {/* Sección de usuario Modificada con lógica condicional */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 bg-blue-800/50 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative"> 
                {/* --- Conditional rendering based on pathname --- */}
                {pathname === '/profile' ? (
                  // On /profile: Render BUTTON that toggles menu
                  <button
                    ref={userProfilePictureButtonRef} // Add ref
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={profilePictureButtonClasses} 
                    aria-label="Abrir menú de usuario"
                  >
                    <ProfilePicture user={user} size="md" />
                  </button>
                ) : (
                  // Outside /profile: Render LINK to profile
                  <Link
                    href="/profile"
                    className={profilePictureButtonClasses} 
                    aria-label="Ir al perfil"
                  >
                    <ProfilePicture user={user} size="md" />
                  </Link>
                )}
                {/* --- End Conditional rendering --- */}

                {/* User Dropdown Menu (Only renders when isUserMenuOpen is true) */}
                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef} // Add ref
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50"
                  >
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName || ''}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Conditionally render "Mi Perfil" link */}
                      {pathname !== '/profile' && (
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)} // Close menu on click
                        >
                          <User className="mr-3 h-4 w-4 text-gray-500" />
                          Mi Perfil
                        </Link>
                      )}
                      {/* Admin Panel Link (conditional as before) ... */}
                      {user.role.toUpperCase() === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="mr-3 h-4 w-4 text-gray-500" />
                          Panel Admin
                        </Link>
                      )}
                      {/* Logout Button ... */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                        Cerrar Sesión
                      </button>
                    </div>
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
              link.isExternal ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.label}
                </a>
              ) : (
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
              )
            ))}

            {/* Lógica condicional móvil basada en contexto */}
            {isLoading ? (
              <div className="h-10 bg-blue-800/50 rounded animate-pulse mt-2"></div>
            ) : isAuthenticated && user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="mr-3 h-5 w-5" />
                  Mi Perfil ({user.firstName})
                </Link>
                {user.role.toUpperCase() === 'ADMIN' && (
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
                  onClick={() => logout()}
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
