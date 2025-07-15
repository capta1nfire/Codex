/**
 * Smart QR Button Component
 * Main entry point for Smart QR feature
 * Now with isolated state management to prevent conflicts
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { SmartQRModal } from './SmartQRModal';

interface SmartQRButtonProps {
  url: string;
  onGenerate?: (config: any) => void;
  className?: string;
  disabled?: boolean;
}

const SmartQRButtonComponent: React.FC<SmartQRButtonProps> = ({
  url,
  onGenerate,
  className,
  disabled = false
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = useCallback(() => {
    if (!user) {
      setShowLoginPrompt(true);
      const timer = setTimeout(() => setShowLoginPrompt(false), 3000);
      return () => clearTimeout(timer);
    }

    if (!disabled && url) {
      setShowModal(true);
    }
  }, [user, disabled, url]);

  const handleGenerate = useCallback((config: any) => {
    onGenerate?.(config);
    setShowModal(false);
  }, [onGenerate]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const isLocked = !user;
  const isDisabled = disabled || !url || url.trim().length === 0;

  return (
    <>
      {/* AI-inspired modern container */}
      <div className={cn(
        "relative p-6 rounded-2xl transition-all duration-500",
        "bg-gradient-to-br from-white/90 via-blue-50/20 to-purple-50/20",
        "dark:from-slate-900/50 dark:via-blue-950/20 dark:to-purple-950/20",
        "border border-gradient-to-br from-blue-200/30 to-purple-200/30",
        "dark:from-blue-800/30 dark:to-purple-800/30",
        "backdrop-blur-xl shadow-lg",
        "hover:shadow-2xl hover:scale-[1.02]",
        "before:absolute before:inset-0 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-blue-400/10 before:to-purple-400/10",
        "before:blur-xl before:-z-10",
        className
      )}>
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          {/* Fila 1: Ícono animado */}
          <div className="relative">
            <div className="absolute inset-0 animate-pulse">
              <Sparkles className="h-8 w-8 text-blue-400/20 dark:text-blue-300/20" />
            </div>
            <Sparkles className="h-8 w-8 text-transparent bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text relative z-10" 
                     strokeWidth={1.5} 
                     stroke="url(#gradient)" />
            {/* Gradient definition for the icon */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Fila 2: Título con badge */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center justify-center gap-2">
              Smart QR
              <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200/50 dark:border-blue-700/50">
                BETA
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
              Estilos profesionales con IA
            </p>
          </div>
          
          {/* Fila 3: Botón */}
          <div className="relative">
            <Button
              onClick={handleClick}
              disabled={isDisabled}
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300",
                "px-6 py-2.5 rounded-full",
                "text-sm font-medium",
                isLocked 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" 
                  : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105",
                !isDisabled && !isLocked && "hover:from-blue-600 hover:to-purple-600",
                "transform-gpu"
              )}
            >
              {isLocked ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Iniciar sesión
                </>
              ) : (
                "Probar ahora →"
              )}
            </Button>

            {/* Simplified login prompt */}
            {showLoginPrompt && (
              <div className="absolute top-full right-0 mt-2 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
                Inicia sesión para usar Smart QR
                <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smart QR Modal - only render when open and user exists */}
      {showModal && user && (
        <SmartQRModal
          isOpen={showModal}
          onClose={handleCloseModal}
          url={url}
          onGenerate={handleGenerate}
        />
      )}
    </>
  );
};

// Memoize with custom comparison
const arePropsEqual = (prevProps: SmartQRButtonProps, nextProps: SmartQRButtonProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className &&
    prevProps.onGenerate === nextProps.onGenerate
  );
};

export const SmartQRButton = React.memo(SmartQRButtonComponent, arePropsEqual);