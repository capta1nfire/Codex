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
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative">
        {/* Main Login Card */}
        <Card className="shadow-2xl shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            {/* Logo and Brand */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                  CODEX
                </span>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-semibold text-foreground">
              Bienvenido de vuelta
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Inicia sesión para acceder a tu generador de códigos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Server Error Alert */}
            {serverError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`pl-10 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="usuario@ejemplo.com"
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`pl-10 pr-12 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Recordarme
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5"
                disabled={isLoading || Object.keys(errors).length > 0}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">¿No tienes cuenta?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-200 hover:-translate-y-0.5"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Crear cuenta nueva
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-4 flex justify-center space-x-6 text-sm text-muted-foreground">
          <a 
            href="#" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <HelpCircle className="h-3 w-3" />
            Ayuda
          </a>
          <a 
            href="#" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Shield className="h-3 w-3" />
            Privacidad
          </a>
          <a 
            href="#" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <FileText className="h-3 w-3" />
            Términos
          </a>
        </div>

        {/* Version Info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground/70">
            CODEX v1.1.0 - Sistema de Generación de Códigos
          </p>
        </div>
      </div>
    </div>
  );
}
