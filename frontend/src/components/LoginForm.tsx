'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { QrCode, Eye, EyeOff, Mail, Lock, LogIn, UserPlus, HelpCircle, Shield, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/schemas/auth.schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/30 dark:bg-grid-slate-800/30 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative animate-in fade-in-0 zoom-in-95 duration-500">
        {/* Main Login Card */}
        <Card className="shadow-2xl shadow-blue-500/10 border-border/50 bg-card/95 backdrop-blur-md hover:shadow-blue-500/15 transition-all duration-300">
          <CardHeader className="text-center pb-5">
            {/* Logo and Brand - Enhanced */}
            <div className="flex justify-center mb-3 animate-in fade-in-0 zoom-in-95 duration-700 delay-100">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:scale-105 transition-transform duration-300">
                <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  CODEX
                </span>
              </div>
            </div>
            
            <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-200">
              <CardTitle className="text-2xl font-semibold text-foreground">
                Bienvenido de vuelta
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Inicia sesión para acceder a tu generador de códigos
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            {/* Server Error Alert */}
            {serverError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              </div>
            )}

            <form name="loginForm" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field - Enhanced */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`pl-10 transition-all duration-200 focus:scale-[1.02] group-hover:border-blue-300 dark:group-hover:border-blue-600 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : 'focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="usuario@ejemplo.com"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <HelpCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field - Enhanced */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`pl-10 pr-12 transition-all duration-200 focus:scale-[1.02] group-hover:border-blue-300 dark:group-hover:border-blue-600 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : 'focus:border-blue-500 focus:ring-blue-500/20'}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-500 transition-all duration-200 hover:scale-110"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                    <HelpCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password - Compact */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                  />
                  <Label htmlFor="remember" className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Recordarme
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button - Enhanced */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 border border-blue-500/20"
                disabled={isLoading || Object.keys(errors).length > 0}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    <span>Iniciar sesión</span>
                    <span className="text-blue-200">⚡</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Divider - Compact */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">¿No tienes cuenta?</span>
              </div>
            </div>

            {/* Register Link - Enhanced */}
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-border/50 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Crear cuenta nueva
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer Links - Compact */}
        <div className="mt-3 flex justify-center space-x-6 text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-500">
          <a 
            href="#" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 hover:scale-105 transform duration-200"
          >
            <HelpCircle className="h-3 w-3" />
            Ayuda
          </a>
          <a 
            href="#" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 hover:scale-105 transform duration-200"
          >
            <Shield className="h-3 w-3" />
            Privacidad
          </a>
          <a 
            href="#" 
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 hover:scale-105 transform duration-200"
          >
            <FileText className="h-3 w-3" />
            Términos
          </a>
        </div>

        {/* Version Info - Compact */}
        <div className="mt-1 text-center animate-in fade-in-0 duration-700 delay-600">
          <p className="text-xs text-muted-foreground/70">
            CODEX v1.1.0 - Sistema de Generación de Códigos
          </p>
        </div>
      </div>
    </div>
  );
}
