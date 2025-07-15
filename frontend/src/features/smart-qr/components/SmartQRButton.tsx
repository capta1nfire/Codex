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
      {/* Minimalist container - Elegant and subtle */}
      <div className={cn(
        "p-4 rounded-lg transition-all duration-300",
        "bg-white/80 dark:bg-slate-900/30",
        "border border-slate-200/50 dark:border-slate-800/50",
        "hover:shadow-md hover:border-slate-300/70 dark:hover:border-slate-700/70",
        "backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                QR Inteligentes
                <span className="text-[9px] px-1 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">
                  BETA
                </span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Estilos profesionales automáticos
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Button
              onClick={handleClick}
              disabled={isDisabled}
              variant="ghost"
              size="sm"
              className={cn(
                "relative transition-all duration-300",
                "text-xs font-medium px-3 py-1.5 h-auto",
                isLocked 
                  ? "text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300" 
                  : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                !isDisabled && !isLocked && "hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
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
                Inicia sesión para usar QR Inteligentes
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