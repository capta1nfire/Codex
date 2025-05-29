'use client';

// import { useState, useEffect } from 'react'; // Ya no se necesitan
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BarChart2, QrCode, User, LogOut, Settings, FileText, Shield, Crown, Users, Zap, Star, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Importar useAuth
import { useState, useRef, useEffect } from 'react'; // Added useRef, useEffect
import ProfilePicture from './ui/ProfilePicture'; // <-- Updated import
import RoleGuard, { WebAdminOnly, PremiumOnly } from './auth/RoleGuard'; // Importar RoleGuards
import { usePermissions } from '@/hooks/useAuth'; // Importar usePermissions
import RoleBadge from './ui/RoleBadge'; // Importar RoleBadge
import { cn } from '@/lib/utils'; // Para styling condicional

// Default export of the Navbar component
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false); // Estado para opciones avanzadas
  // Obtener estado y funciones del contexto
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const { userRole } = usePermissions();

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
  const profilePictureButtonClasses = `flex items-center p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-900 focus:ring-white transition`;

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
              {navigationLinks.map((link) =>
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
                ) : link.href === '/dashboard' ? (
                  <RoleGuard key={link.href} requiredRoles={['STARTER', 'PRO', 'ENTERPRISE']}>
                    <Link
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
                  </RoleGuard>
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
              )}
            </div>
          </div>

          {/* Sección de usuario Modificada con lógica condicional */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 bg-blue-800/50 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="relative flex items-center gap-3">
                {/* Mostrar rol del usuario con badge estilizado */}
                {userRole && (
                  <div className="hidden md:flex items-center">
                    <RoleBadge role={userRole} variant="default" />
                  </div>
                )}
                
              <div className="relative">
                  {/* Super Admin: Click directo al dashboard, otros: dropdown */}
                  {userRole === 'SUPERADMIN' ? (
                    <Link
                      href="/dashboard"
                      className={`${profilePictureButtonClasses} ring-2 ring-blue-500/20 hover:ring-blue-500/40`}
                      title="Ir al Panel Administrativo"
                    >
                      <ProfilePicture user={user} size="md" />
                    </Link>
                  ) : (
                    <button
                      ref={userProfilePictureButtonRef}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`${profilePictureButtonClasses} ${isUserMenuOpen ? 'ring-2 ring-white/20' : ''}`}
                      aria-label="Abrir menú de usuario"
                    >
                      <ProfilePicture user={user} size="md" />
                    </button>
                  )}

                {/* User Dropdown Menu (Only renders when isUserMenuOpen is true) */}
                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef} // Add ref
                    className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-lg shadow-lg shadow-blue-500/10 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
                  >
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-start gap-2">
                          {userRole && (
                            <div className="mt-0.5">
                              {userRole === 'SUPERADMIN' && <Zap className="h-4 w-4 text-blue-600" />}
                              {userRole === 'ADMIN' && <Crown className="h-4 w-4 text-slate-600" />}
                              {userRole === 'ENTERPRISE' && <Crown className="h-4 w-4 text-amber-600" />}
                              {userRole === 'PRO' && <Shield className="h-4 w-4 text-purple-600" />}
                              {userRole === 'STARTER' && <Star className="h-4 w-4 text-blue-600" />}
                            </div>
                          )}
                          <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                        </div>

                      </div>
                    </div>

                    {/* Navigation Links Section */}
                    <div className="py-2">
                      <div className="px-3 py-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navegación</p>
                      </div>
                      {navigationLinks.map((link) =>
                        link.isExternal ? (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsUserMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                              "border border-gray-200/50 bg-gray-50/30",
                              "hover:border-blue-300 hover:bg-blue-50/50",
                              "hover:shadow-md hover:shadow-blue-500/10",
                              "transition-all duration-200 hover:-translate-y-0.5",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                              link.isActive && "border-blue-300 bg-blue-50/50 text-blue-700"
                            )}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                              {link.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {link.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {link.label === 'API Docs' ? 'Documentación de la API' : 
                                 link.label === 'Generador' ? 'Generar códigos QR' : 
                                 'Ver métricas y estadísticas'}
                              </div>
                            </div>
                          </a>
                        ) : link.href === '/dashboard' ? (
                          <RoleGuard key={link.href} requiredRoles={['STARTER', 'PRO', 'ENTERPRISE']} fallback={null}>
                            <Link
                              href={link.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                                "border border-gray-200/50 bg-gray-50/30",
                                "hover:border-blue-300 hover:bg-blue-50/50",
                                "hover:shadow-md hover:shadow-blue-500/10",
                                "transition-all duration-200 hover:-translate-y-0.5",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                                link.isActive && "border-blue-300 bg-blue-50/50 text-blue-700"
                              )}
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                                {link.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  {link.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Ver métricas y estadísticas
                                </div>
                              </div>
                            </Link>
                          </RoleGuard>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                              "border border-gray-200/50 bg-gray-50/30",
                              "hover:border-blue-300 hover:bg-blue-50/50",
                              "hover:shadow-md hover:shadow-blue-500/10",
                              "transition-all duration-200 hover:-translate-y-0.5",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                              link.isActive && "border-blue-300 bg-blue-50/50 text-blue-700"
                            )}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                              {link.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {link.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                Generar códigos QR
                              </div>
                            </div>
                          </Link>
                        )
                      )}
                    </div>

                    {/* Advanced Features Section - Solo Premium/Advanced */}
                    <PremiumOnly>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="py-2">
                        <div className="px-3 py-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Características Avanzadas</p>
                        </div>
                        
                        {/* Advanced Options Toggle */}
                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Opciones Avanzadas</span>
                            </div>
                            <button
                              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full",
                                "border-2 border-transparent transition-colors duration-200 ease-in-out",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                                isAdvancedMode 
                                  ? "bg-blue-500 hover:bg-blue-600" 
                                  : "bg-gray-200 hover:bg-gray-300"
                              )}
                              role="switch"
                              aria-checked={isAdvancedMode}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg",
                                  "ring-0 transition-transform duration-200 ease-in-out",
                                  isAdvancedMode ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </button>
                          </div>
                          
                          {/* Estado visual del modo - Solo mostrar cuando está activado */}
                          {isAdvancedMode && (
                            <div className="mt-2 p-2 rounded-md text-xs border transition-all duration-200 bg-blue-50 border-blue-200 text-blue-700">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Opciones avanzadas activadas
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Advanced Options para Premium/Advanced - Solo funcionalidades de usuario */}
                        {isAdvancedMode && (
                          <div className="space-y-2 mb-3">
                            {/* Generación por Lotes - Premium/Advanced Feature */}
                            <Link
                              href="/"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 w-full p-3 rounded-lg mx-2",
                                "border border-blue-200/50 bg-blue-50/30",
                                "hover:border-blue-300 hover:bg-blue-100/50",
                                "hover:shadow-md hover:shadow-blue-500/10",
                                "transition-all duration-200 hover:-translate-y-0.5",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              )}
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                                <QrCode className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  Generación por Lotes
                                </div>
                                <div className="text-xs text-gray-500">
                                  Generar múltiples códigos a la vez
                                </div>
                              </div>
                            </Link>

                            {/* API Keys Personal - Premium/Advanced Feature */}
                            <Link
                              href="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 w-full p-3 rounded-lg mx-2",
                                "border border-blue-200/50 bg-blue-50/30",
                                "hover:border-blue-300 hover:bg-blue-100/50",
                                "hover:shadow-md hover:shadow-blue-500/10",
                                "transition-all duration-200 hover:-translate-y-0.5",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              )}
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                                <Key className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  API Keys Personal
                                </div>
                                <div className="text-xs text-gray-500">
                                  Gestionar claves de API personales
                                </div>
                              </div>
                            </Link>
                          </div>
                        )}

                        {/* Production Readiness */}
                        <Link
                          href="/production-readiness"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-3 mx-2",
                            "border border-gray-200/50 bg-gray-50/30",
                            "hover:border-blue-300 hover:bg-blue-50/50",
                            "hover:shadow-md hover:shadow-blue-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Production Readiness
                            </div>
                            <div className="text-xs text-gray-500">
                              Validar preparación para producción
                            </div>
                          </div>
                        </Link>
                      </div>
                    </PremiumOnly>

                    {/* WebAdmin Section */}
                    <WebAdminOnly>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="py-2">
                                                <div className="px-3 py-1 mb-2">
                          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-50 border border-slate-200">
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Panel WebAdmin</span>
                          </div>
                        </div>

                        {/* Gestión de Usuarios */}
                        <Link
                          href="/webadmin/users"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                            "border border-slate-200/50 bg-slate-50/30",
                            "hover:border-slate-300 hover:bg-slate-100/50",
                            "hover:shadow-md hover:shadow-slate-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Gestión de Usuarios
                            </div>
                            <div className="text-xs text-gray-500">
                              Administrar usuarios del sistema
                            </div>
                          </div>
                        </Link>

                        {/* Dashboard WebAdmin */}
                        <Link
                          href="/webadmin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                            "border border-slate-200/50 bg-slate-50/30",
                            "hover:border-slate-300 hover:bg-slate-100/50",
                            "hover:shadow-md hover:shadow-slate-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600">
                            <BarChart2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Dashboard WebAdmin
                            </div>
                            <div className="text-xs text-gray-500">
                              Monitoreo y métricas del sistema
                            </div>
                          </div>
                        </Link>

                        {/* Configuración del Sistema */}
                        <Link
                          href="/webadmin/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                            "border border-slate-200/50 bg-slate-50/30",
                            "hover:border-slate-300 hover:bg-slate-100/50",
                            "hover:shadow-md hover:shadow-slate-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600">
                            <Settings className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Configuración Sistema
                            </div>
                            <div className="text-xs text-gray-500">
                              Ajustes globales del sistema
                            </div>
                          </div>
                        </Link>


                      </div>
                    </WebAdminOnly>

                    {/* User Menu Items */}
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="py-1">
                      <div className="px-3 py-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cuenta</p>
                      </div>
                      {/* Conditionally render "Mi Perfil" link */}
                      {pathname !== '/profile' && (
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)} // Close menu on click
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                            "border border-gray-200/50 bg-gray-50/30",
                            "hover:border-gray-300 hover:bg-gray-100/50",
                            "hover:shadow-md hover:shadow-gray-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                          Mi Perfil
                            </div>
                            <div className="text-xs text-gray-500">
                              Configurar mi cuenta
                            </div>
                          </div>
                        </Link>
                      )}
                      
                      {/* Security Section */}
                      {pathname !== '/security' && (
                        <Link
                          href="/security"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg mb-2 mx-2",
                            "border border-corporate-blue-200/50 bg-corporate-blue-50/30",
                            "hover:border-corporate-blue-300 hover:bg-corporate-blue-100/50",
                            "hover:shadow-md hover:shadow-corporate-blue-500/10",
                            "transition-all duration-200 hover:-translate-y-0.5",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500 focus-visible:ring-offset-2"
                          )}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-corporate-blue-100 text-corporate-blue-600">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              Security Center
                            </div>
                            <div className="text-xs text-gray-500">
                              Gestionar seguridad y privacidad
                            </div>
                          </div>
                        </Link>
                      )}
                      
                      {/* Divider */}
                      <div className="border-t border-gray-200 my-1"></div>
                      
                      {/* Logout Button ... */}
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-lg mx-2",
                          "border border-gray-200/50 bg-gray-50/30",
                          "hover:border-red-300 hover:bg-red-50/50",
                          "hover:shadow-md hover:shadow-red-500/10",
                          "transition-all duration-200 hover:-translate-y-0.5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                          "text-left"
                        )}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                        Cerrar Sesión
                          </div>
                          <div className="text-xs text-gray-500">
                            Salir de la aplicación
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                </div>
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
            {navigationLinks.map((link) =>
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
              ) : link.href === '/dashboard' ? (
                <RoleGuard key={link.href} requiredRoles={['STARTER', 'PRO', 'ENTERPRISE']}>
                  <Link
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
                </RoleGuard>
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
            )}

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
                  {userRole && (
                    <div className="ml-2">
                      <RoleBadge role={userRole} variant="mobile" />
                    </div>
                  )}
                </Link>
                <Link
                  href="/security"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="mr-3 h-5 w-5" />
                  Security Center
                </Link>
                {(user.role.toUpperCase() === 'WEBADMIN' || user.role.toUpperCase() === 'SUPERADMIN') && (
                  <Link
                    href="/webadmin"
                    className="flex items-center px-4 py-3 text-base font-medium rounded-md text-blue-100 hover:bg-white/10 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Panel WebAdmin
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
