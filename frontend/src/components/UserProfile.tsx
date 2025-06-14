'use client';

import React, { useState, useEffect } from 'react';
import { useUserProfileLogic } from '@/hooks/useUserProfileLogic';
import ProfileForm from './profile/ProfileForm';
import ApiKeySection from './profile/ApiKeySection';
import AdvancedAvatarEditor from './profile/AdvancedAvatarEditor';
import PlanLimitsSection from './profile/PlanLimitsSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Key, 
  AlertCircle, 
  Calendar,
  Mail,
  Clock,
  Shield,
  Sparkles,
  TrendingUp,
  Star,
  ArrowLeft,
  Home,
  Smartphone,
  Activity,
  Lock,
  Settings,
  Palette,
  Globe,
  Bell,
  QrCode,
  Monitor,
  Sun,
  Moon,
  Accessibility
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface UserProfileProps {
  isAdvancedMode?: boolean;
}

export default function UserProfile({ isAdvancedMode }: UserProfileProps) {
  const [mounted, setMounted] = useState(false);
  const [heroAnimated, setHeroAnimated] = useState(false);
  
  const {
    isLoading,
    error,
    isEditing,
    defaultProfilePictures,
    user,
    isAuthenticated,
    handleProfileUpdate,
    handleGenerateApiKey,
    handleFileUpload,
    handleSetDefaultProfilePicture,
    handleResetProfilePicture,
    handleEditToggle,
  } = useUserProfileLogic();

  // Hero moment animation trigger
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setHeroAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced loading state with corporate sophistication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <Card className={`
          w-full max-w-md transition-all duration-500 ease-smooth transform
          ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          shadow-corporate-lg border-corporate-blue-200 dark:border-corporate-blue-700
        `}>
          <CardContent className="text-center p-8">
            {/* Corporate Loading Animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full opacity-20 animate-spin-slow"></div>
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-transparent border-t-blue-400 rounded-full animate-spin-reverse"></div>
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-blue-500 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-3">
              <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                Cargando Perfil
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Preparando tu experiencia CODEX...
              </CardDescription>
              
              {/* Loading Progress Dots */}
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 bg-blue-500 rounded-full animate-pulse`}
                    style={{ animationDelay: `${i * 200}ms` }}
                  ></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced error state with corporate design
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <Card className={`
          w-full max-w-md transition-all duration-500 ease-smooth transform
          ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          shadow-corporate-lg border-destructive/30 bg-destructive/5
        `}>
          <CardContent className="text-center p-8">
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
              </div>
            </div>
            
            <CardTitle className="text-xl text-destructive mb-3">
              Acceso Restringido
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Debes iniciar sesión para acceder a tu perfil personal.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate account metrics for enhanced summary
  const accountAge = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const lastUpdate = user.updatedAt ? Math.floor((Date.now() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Floating Navigation Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => window.history.back()}
          className={`
            flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm 
            border border-blue-200/50 dark:border-blue-700/50 rounded-full shadow-corporate-lg
            hover:shadow-corporate-hero hover:bg-white dark:hover:bg-slate-800
            transition-all duration-300 ease-smooth transform hover:scale-105
            text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400
            ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Volver</span>
        </button>
      </div>

      {/* Alternative Home Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => window.location.href = '/'}
          className={`
            flex items-center gap-2 px-4 py-2 bg-blue-500/90 dark:bg-blue-600/90 backdrop-blur-sm 
            border border-blue-300/50 dark:border-blue-500/50 rounded-full shadow-corporate-lg
            hover:shadow-corporate-hero hover:bg-blue-500 dark:hover:bg-blue-600
            transition-all duration-300 ease-smooth transform hover:scale-105
            text-white hover:text-white
            ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
          style={{ transitionDelay: '100ms' }}
        >
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">Inicio</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Enhanced Error Alert with Corporate Styling */}
      {error && (
        <Card className={`
          shadow-corporate-md border-destructive/50 bg-gradient-to-r from-destructive/5 to-destructive/10 
          transition-all duration-200 ease-smooth transform
          ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
        `}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-destructive">Error del Sistema</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Welcome Section */}
      <div className={`
        transition-all duration-700 ease-smooth transform
        ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}>
        <Card className="relative overflow-hidden shadow-corporate-lg hover:shadow-corporate-xl border border-corporate-blue-200/50 dark:border-corporate-blue-700/50 transition-all duration-200">
          {/* Hero Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-corporate-blue-50/30 via-corporate-blue-100/20 to-slate-50 dark:from-corporate-blue-950/30 dark:via-corporate-blue-900/20 dark:to-slate-950"></div>

          <CardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Welcome Message */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <Star className="h-3 w-3 mr-1 text-blue-600" />
                    Perfil CODEX
                  </Badge>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-2">
                    ¡Bienvenido, {user.firstName}!
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                    Gestiona tu información personal y preferencias de cuenta
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600 hover:transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-corporate-blue-600" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Miembro desde</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {accountAge} días
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600 hover:transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-corporate-blue-600" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Estado</span>
                    </div>
                    <p className="text-sm font-semibold text-corporate-blue-600 dark:text-corporate-blue-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-corporate-blue-500 rounded-full animate-pulse"></div>
                      Activo
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600 hover:transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-corporate-blue-600" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Rol</span>
                    </div>
                    <p className="text-sm font-semibold text-corporate-blue-600 dark:text-corporate-blue-400 capitalize">
                      {user.role?.toLowerCase()}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600 hover:transform hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-corporate-blue-600" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Actualizado</span>
                    </div>
                    <p className="text-sm font-semibold text-corporate-blue-600 dark:text-corporate-blue-400">
                      {lastUpdate === 0 ? 'Hoy' : `${lastUpdate}d`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Profile Sections */}
      <div className="space-y-8">
        {/* Integrated Profile Section with Enhanced Styling */}
        <Card className={`
          shadow-corporate-lg border-blue-200/50 dark:border-blue-700/50 bg-card/95 backdrop-blur-sm
          transition-all duration-500 ease-smooth transform
          ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          hover:shadow-corporate-hero hover:border-blue-300/70 dark:hover:border-blue-600/70
          overflow-hidden p-0
        `} style={{ transitionDelay: '100ms' }}>
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-slate-50/50 dark:from-blue-950/50 dark:to-slate-950/50 border-b border-blue-200/30 dark:border-blue-700/30 rounded-t-lg m-0 py-8 px-8">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-200">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Información Personal
                </span>
                <Badge variant="secondary" className="ml-3 text-xs">
                  Privado
                </Badge>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-3">
              Actualiza tu información personal y credenciales de acceso de forma segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Enhanced Profile Picture Section */}
            <div className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-gradient-to-br from-slate-50/80 to-blue-50/40 dark:from-slate-800/80 dark:to-blue-950/40 rounded-xl border border-blue-200/40 dark:border-blue-700/40">
              <div className="flex-shrink-0">
                <AdvancedAvatarEditor
                  user={user}
                  isLoading={isLoading}
                  onFileUpload={handleFileUpload}
                  onSetDefaultPicture={handleSetDefaultProfilePicture}
                  onResetPicture={handleResetProfilePicture}
                />
              </div>
              <div className="text-center lg:text-left flex-1 min-w-0 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-corporate-blue-100 dark:bg-corporate-blue-900/30 rounded-full">
                    <div className="w-2 h-2 bg-corporate-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-corporate-blue-600 dark:text-corporate-blue-400 font-medium">Cuenta Activa</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-corporate-blue-300 dark:border-corporate-blue-700">
                    {user.role?.toLowerCase()}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  Personaliza tu imagen de perfil con nuestro editor avanzado. Incluye filtros profesionales, herramientas de recorte y una galería corporativa.
                </p>
              </div>
            </div>

            {/* Enhanced Profile Form */}
            <div className="border-t border-blue-200/30 dark:border-blue-700/30 pt-8">
              <ProfileForm
                user={user}
                isEditing={isEditing}
                isLoading={isLoading}
                onSubmit={handleProfileUpdate}
                onEditToggle={handleEditToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Security Section - CODEX Design System Compliant */}
        <Card className={`
          shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm
          transition-all duration-500 ease-smooth transform
          ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70
          overflow-hidden p-0
        `} style={{ transitionDelay: '150ms' }}>
          <CardHeader className="bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30 rounded-t-lg m-0 py-8 px-8">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-corporate-blue-500/10 rounded-lg group-hover:bg-corporate-blue-500/20 transition-colors duration-200">
                <Shield className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Seguridad y Privacidad
                </span>
                <Badge variant="secondary" className="ml-3 text-xs">
                  Protegido
                </Badge>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-3">
              Gestiona la seguridad de tu cuenta, sesiones activas y configuración de privacidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Security Overview Cards - Corporate Design System */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-corporate-blue-50/80 to-corporate-blue-100/40 dark:from-corporate-blue-950/80 dark:to-corporate-blue-900/40 rounded-xl p-6 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-corporate-blue-700 dark:text-corporate-blue-300">Puntuación de Seguridad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-corporate-blue-600 dark:text-corporate-blue-400">85%</span>
                  <Badge variant="outline" className="text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-300 dark:border-corporate-blue-700">
                    Buena
                  </Badge>
                </div>
              </div>

              <div className="bg-gradient-to-br from-corporate-blue-50/80 to-corporate-blue-100/40 dark:from-corporate-blue-950/80 dark:to-corporate-blue-900/40 rounded-xl p-6 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                    <Smartphone className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-corporate-blue-700 dark:text-corporate-blue-300">Sesiones Activas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-corporate-blue-600 dark:text-corporate-blue-400">2</span>
                  <Badge variant="outline" className="text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-300 dark:border-corporate-blue-700">
                    Dispositivos
                  </Badge>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-700/40 rounded-xl p-6 border border-slate-200/40 dark:border-slate-600/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-500/10 rounded-lg">
                    <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Eventos Recientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">3</span>
                  <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    Últimos 7d
                  </Badge>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-700/40 rounded-xl p-6 border border-slate-200/40 dark:border-slate-600/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-500/10 rounded-lg">
                    <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">2FA Estado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Inactivo</span>
                  <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                    Recomendado
                  </Badge>
                </div>
              </div>
            </div>

            {/* Security Configuration - Corporate Blue Theme */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Shield className="h-4 w-4 text-corporate-blue-500" />
                Configuración de Seguridad
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Password Security */}
                <div className="space-y-4">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Key className="h-4 w-4 text-corporate-blue-500" />
                    Seguridad de Contraseña
                  </h5>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Fortaleza de Contraseña</span>
                      <Badge variant="outline" className="text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-300 dark:border-corporate-blue-700">Fuerte</Badge>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                      <div className="bg-gradient-to-r from-corporate-blue-500 to-corporate-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Cambiar Contraseña
                    </Button>
                  </div>
                </div>

                {/* Two Factor Authentication */}
                <div className="space-y-4">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-corporate-blue-500" />
                    Autenticación de Dos Factores
                  </h5>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Estado 2FA</span>
                      <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">Inactivo</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Agrega una capa extra de seguridad a tu cuenta
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Configurar 2FA
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions - Corporate Blue Theme */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Smartphone className="h-4 w-4 text-corporate-blue-500" />
                Sesiones Activas
              </h4>
              
              <div className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                        <Smartphone className="h-4 w-4 text-corporate-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">MacBook Pro - Chrome</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Madrid, Spain • Activo ahora</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-300 dark:border-corporate-blue-700">Actual</Badge>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                        <Smartphone className="h-4 w-4 text-corporate-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">iPhone 15 Pro - Safari</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Madrid, Spain • hace 2h</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Terminar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Preferences & Configuration Section - CODEX Design System Compliant */}
        <Card className={`
          shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm
          transition-all duration-500 ease-smooth transform
          ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
          hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70
          overflow-hidden p-0
        `} style={{ transitionDelay: '200ms' }}>
          <CardHeader className="bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30 rounded-t-lg m-0 py-8 px-8">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-corporate-blue-500/10 rounded-lg group-hover:bg-corporate-blue-500/20 transition-colors duration-200">
                <Settings className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Preferencias y Configuración
                </span>
                <Badge variant="secondary" className="ml-3 text-xs">
                  Personalización
                </Badge>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-3">
              Personaliza tu experiencia CODEX y configura las preferencias del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {/* Appearance & Theme Settings */}
            <div className="space-y-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Palette className="h-4 w-4 text-corporate-blue-500" />
                Apariencia y Tema
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Theme Selection */}
                <div className="bg-gradient-to-br from-corporate-blue-50/80 to-corporate-blue-100/40 dark:from-corporate-blue-950/80 dark:to-corporate-blue-900/40 rounded-xl p-6 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                      <Monitor className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
                    </div>
                    <span className="font-medium text-corporate-blue-700 dark:text-corporate-blue-300">Tema de Interfaz</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-corporate-blue-200 dark:border-corporate-blue-700 hover:border-corporate-blue-400 transition-colors">
                      <Sun className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-xs font-medium">Claro</span>
                    </button>
                    <button className="flex flex-col items-center p-3 rounded-lg bg-corporate-blue-500 border border-corporate-blue-500 text-white">
                      <Monitor className="h-4 w-4 mb-1" />
                      <span className="text-xs font-medium">Auto</span>
                    </button>
                    <button className="flex flex-col items-center p-3 rounded-lg bg-white dark:bg-slate-800 border border-corporate-blue-200 dark:border-corporate-blue-700 hover:border-corporate-blue-400 transition-colors">
                      <Moon className="h-4 w-4 text-slate-600 mb-1" />
                      <span className="text-xs font-medium">Oscuro</span>
                    </button>
                  </div>
                </div>

                {/* Interface Density */}
                <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-800/80 dark:to-slate-700/40 rounded-xl p-6 border border-slate-200/40 dark:border-slate-600/40">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-500/10 rounded-lg">
                      <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Densidad de Interfaz</span>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Compacta</span>
                      <Switch />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Animaciones reducidas</span>
                      <Switch />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Language & Region */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Globe className="h-4 w-4 text-corporate-blue-500" />
                Idioma y Región
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Idioma de la Interfaz
                  </label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Zona Horaria
                  </label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                  </select>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Formato de Fecha
                  </label>
                  <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Bell className="h-4 w-4 text-corporate-blue-500" />
                Notificaciones
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300">Notificaciones por Email</h5>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Códigos generados</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Recibe confirmación cuando generes códigos</p>
                      </div>
                      <Switch defaultChecked />
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Alertas de seguridad</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Nuevos accesos y cambios importantes</p>
                      </div>
                      <Switch defaultChecked />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300">Notificaciones del Sistema</h5>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Actualizaciones</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Nuevas funciones y mejoras</p>
                      </div>
                      <Switch />
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mantenimiento</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ventanas de mantenimiento programado</p>
                      </div>
                      <Switch defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Generation Defaults */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <QrCode className="h-4 w-4 text-corporate-blue-500" />
                Configuración de Generación
              </h4>
              
              <div className="bg-gradient-to-br from-corporate-blue-50/80 to-corporate-blue-100/40 dark:from-corporate-blue-950/80 dark:to-corporate-blue-900/40 rounded-xl p-6 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="font-medium text-corporate-blue-700 dark:text-corporate-blue-300">Preferencias por Defecto</h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Formato predeterminado
                        </label>
                        <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                          <option value="qr">Código QR</option>
                          <option value="code128">Code 128</option>
                          <option value="ean13">EAN-13</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tamaño predeterminado
                        </label>
                        <select className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                          <option value="medium">Mediano (200x200)</option>
                          <option value="small">Pequeño (150x150)</option>
                          <option value="large">Grande (300x300)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-medium text-corporate-blue-700 dark:text-corporate-blue-300">Opciones Avanzadas</h5>
                    
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Incluir texto legible</span>
                        <Switch defaultChecked />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Guardar historial automáticamente</span>
                        <Switch defaultChecked />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Optimización automática</span>
                        <Switch />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility */}
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
                <Accessibility className="h-4 w-4 text-corporate-blue-500" />
                Accesibilidad
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200/50 dark:border-slate-700/50">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Opciones Visuales</h5>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Alto contraste</span>
                      <Switch />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Texto grande</span>
                      <Switch />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Reducir transparencias</span>
                      <Switch />
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200/50 dark:border-slate-700/50">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-4">Opciones de Interacción</h5>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Navegación por teclado</span>
                      <Switch defaultChecked />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Lectores de pantalla</span>
                      <Switch defaultChecked />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Confirmaciones de voz</span>
                      <Switch />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Limits Section - Already Enhanced */}
        <div className={`
          transition-all duration-500 ease-smooth transform
          ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        `} style={{ transitionDelay: '200ms' }}>
          <PlanLimitsSection 
            user={{
              role: user.role,
              apiUsage: user.apiUsage || 0,
              createdAt: user.createdAt || new Date().toISOString()
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Enhanced API Keys Section */}
        {isAdvancedMode && (
          <Card className={`
            shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm
            transition-all duration-500 ease-smooth transform
            ${heroAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70
          `} style={{ transitionDelay: '300ms' }}>
            <CardHeader className="bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-corporate-blue-500/10 rounded-lg">
                  <Key className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Claves API
                  </span>
                  <Badge variant="secondary" className="ml-3 text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900 border-corporate-blue-300 dark:border-corporate-blue-700">
                    Avanzado
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Gestiona tus claves de API para integración con servicios externos y automatización
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ApiKeySection
                currentApiKey={user.currentApiKey}
                isLoading={isLoading}
                onGenerateApiKey={handleGenerateApiKey}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}
