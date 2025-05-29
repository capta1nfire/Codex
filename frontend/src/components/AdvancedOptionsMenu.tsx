'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Settings, X, Shield, FileText, ExternalLink, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/useAuth';
import { WebAdminOnly, PremiumOnly } from '@/components/auth/RoleGuard';

interface AdvancedOptionsMenuProps {
  isAdvancedMode: boolean;
  onAdvancedModeChange: (enabled: boolean) => void;
  className?: string;
}

const AdvancedOptionsMenu: React.FC<AdvancedOptionsMenuProps> = ({
  isAdvancedMode,
  onAdvancedModeChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, userRole } = usePermissions();

  // ✅ Cerrar menú al hacer clic fuera (siguiendo patrones UX)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // ✅ Manejar navegación por teclado (Accesibilidad WCAG)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAdvancedToggle = () => {
    onAdvancedModeChange(!isAdvancedMode);
    // Mantener menú abierto para que usuario vea el cambio
  };

  return (
    <div className={cn("relative", className)}>
      {/* ✅ Botón Hamburguesa - Siguiendo Corporate Styling */}
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        className={cn(
          // Base corporativo
          "flex items-center justify-center w-10 h-10 rounded-lg",
          "border border-border/50 bg-card/50",
          
          // Microinteracciones corporativas (200ms duration)
          "transition-all duration-200 ease-out",
          
          // Estados hover corporativos
          "hover:border-corporate-blue-300 hover:bg-corporate-blue-50/50",
          "hover:shadow-md hover:shadow-corporate-blue-500/10",
          "hover:-translate-y-0.5 hover:scale-105",
          
          // Estados focus para accesibilidad
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500 focus-visible:ring-offset-2",
          
          // Estados activos
          isOpen && "border-corporate-blue-400 bg-corporate-blue-100/50 shadow-md"
        )}
        aria-label="Menú de opciones avanzadas"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* ✅ Ícono con rotación sutil */}
        <Menu 
          className={cn(
            "h-5 w-5 text-foreground/70 transition-all duration-200",
            "hover:text-corporate-blue-600",
            isOpen && "text-corporate-blue-600 rotate-90"
          )} 
        />
      </button>

      {/* ✅ Dropdown Menu - Corporate Glass Pattern */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            // Positioning
            "absolute top-12 right-0 z-50",
            "min-w-[280px]",
            
            // Corporate glass styling
            "bg-card/95 backdrop-blur-sm border border-border/60",
            "rounded-lg shadow-lg shadow-corporate-blue-500/10",
            
            // Animación de entrada suave
            "animate-in slide-in-from-top-2 duration-200"
          )}
          role="menu"
          aria-labelledby="options-menu"
        >
          {/* ✅ Header del menú */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-corporate-blue-600" />
              <span className="font-medium text-sm text-foreground">
                Configuración
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-md",
                "hover:bg-muted transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500"
              )}
              aria-label="Cerrar menú"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>

          {/* ✅ Contenido del menú */}
          <div className="p-4">
            {/* ✅ Opciones Avanzadas Toggle - Solo Premium/Advanced */}
            <PremiumOnly>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground flex items-center gap-2">
                    Opciones Avanzadas
                    <Crown className="h-3 w-3 text-purple-500" />
                  </div>
                </div>

                {/* ✅ Toggle Switch - Corporate Styling */}
                <button
                  onClick={handleAdvancedToggle}
                  className={cn(
                    // Base toggle switch
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
                    "border-2 border-transparent transition-colors duration-200 ease-in-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500 focus-visible:ring-offset-2",
                    
                    // Estados del toggle
                    isAdvancedMode 
                      ? "bg-corporate-blue-500 hover:bg-corporate-blue-600" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  role="switch"
                  aria-checked={isAdvancedMode}
                  aria-labelledby="advanced-options-label"
                >
                  <span
                    className={cn(
                      // Base slider
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg",
                      "ring-0 transition-transform duration-200 ease-in-out",
                      
                      // Posición del slider
                      isAdvancedMode ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* ✅ Estado visual del modo actual */}
              <div className={cn(
                "mt-3 p-2 rounded-md text-xs border transition-all duration-200",
                isAdvancedMode 
                  ? "bg-corporate-blue-50 border-corporate-blue-200 text-corporate-blue-700"
                  : "bg-muted/50 border-border/50 text-muted-foreground"
              )}>
                {isAdvancedMode ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-corporate-blue-500 rounded-full"></div>
                    Opciones avanzadas activadas
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    Modo estándar
                  </div>
                )}
              </div>
            </PremiumOnly>

            {/* ✅ Divisor */}
            <div className="border-t border-border/30 my-4"></div>

            {/* ✅ Rol del usuario */}
            {user && (
              <div className="mb-4 p-2 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2">
                  {userRole === 'SUPERADMIN' && <Crown className="h-4 w-4 text-red-600" />}
                  {userRole === 'ADMIN' && <Crown className="h-4 w-4 text-orange-600" />}
                  {userRole === 'ENTERPRISE' && <Crown className="h-4 w-4 text-amber-600" />}
                  {userRole === 'PRO' && <Crown className="h-4 w-4 text-purple-600" />}
                  {userRole === 'STARTER' && <Users className="h-4 w-4 text-blue-600" />}
                  <span className="text-xs font-medium text-foreground">
                    {user.firstName} ({userRole})
                  </span>
                </div>
              </div>
            )}

            {/* ✅ Navegación a Production Readiness - Solo Premium/Admin */}
            <PremiumOnly>
              <Link
                href="/production-readiness"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg mb-3",
                  "border border-border/50 bg-card/30",
                  "hover:border-corporate-blue-300 hover:bg-corporate-blue-50/50",
                  "hover:shadow-md hover:shadow-corporate-blue-500/10",
                  "transition-all duration-200 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500 focus-visible:ring-offset-2"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-corporate-blue-100 text-corporate-blue-600">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">
                    Production Readiness
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Validar preparación para producción
                  </div>
                </div>
                <Crown className="h-3 w-3 text-purple-500" />
              </Link>
            </PremiumOnly>

            {/* ✅ API Docs */}
            <a
              href="http://localhost:3004/api-docs/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg mb-3",
                "border border-border/50 bg-card/30",
                "hover:border-corporate-blue-300 hover:bg-corporate-blue-50/50",
                "hover:shadow-md hover:shadow-corporate-blue-500/10",
                "transition-all duration-200 hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-blue-500 focus-visible:ring-offset-2"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-corporate-blue-100 text-corporate-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-foreground">
                  API Docs
                </div>
                <div className="text-xs text-muted-foreground">
                  Documentación de la API
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
            </a>

            {/* ✅ Opciones de WebAdmin */}
            <WebAdminOnly>
              <div className="border-t border-border/30 my-4"></div>
              
              <div className="mb-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Panel WebAdmin
                  </span>
                </div>
              </div>

              <Link
                href="/webadmin/users"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg mb-2",
                  "border border-amber-200/50 bg-amber-50/30",
                  "hover:border-amber-300 hover:bg-amber-100/50",
                  "hover:shadow-md hover:shadow-amber-500/10",
                  "transition-all duration-200 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">
                    Gestión de Usuarios
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gestión técnica de usuarios
                  </div>
                </div>
                <Crown className="h-3 w-3 text-amber-500" />
              </Link>

              <Link
                href="/webadmin/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 w-full p-3 rounded-lg",
                  "border border-amber-200/50 bg-amber-50/30",
                  "hover:border-amber-300 hover:bg-amber-100/50",
                  "hover:shadow-md hover:shadow-amber-500/10",
                  "transition-all duration-200 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">
                    Configuración Sistema
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ajustes globales del sistema
                  </div>
                </div>
                <Crown className="h-3 w-3 text-amber-500" />
              </Link>
            </WebAdminOnly>
          </div>
        </div>
      )}

      {/* ✅ Backdrop sutil cuando está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default AdvancedOptionsMenu; 