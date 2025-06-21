/**
 * Smart QR Button Component
 * Main entry point for Smart QR feature
 */

import React, { useState } from 'react';
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

export const SmartQRButton: React.FC<SmartQRButtonProps> = ({
  url,
  onGenerate,
  className,
  disabled = false
}) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    if (!disabled && url) {
      setShowModal(true);
    }
  };

  const handleGenerate = (config: any) => {
    onGenerate?.(config);
    setShowModal(false);
  };

  const isLocked = !user;
  const isDisabled = disabled || !url || url.trim().length === 0;

  return (
    <>
      {/* Main container with teaser design */}
      <div className={cn(
        "mt-6 p-4 rounded-lg transition-all duration-200",
        "border-2 border-dashed",
        isLocked 
          ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20" 
          : "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30",
        "hover:border-blue-500 hover:bg-blue-50/70 dark:hover:border-blue-600 dark:hover:bg-blue-950/40",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isLocked 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-blue-200 dark:bg-blue-800/50"
            )}>
              <Sparkles className={cn(
                "h-5 w-5 transition-colors",
                isLocked 
                  ? "text-blue-500 dark:text-blue-400" 
                  : "text-blue-600 dark:text-blue-300"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                QR Inteligentes
                <span className="text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full font-medium">
                  Beta
                </span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Genera QR con estilo Instagram o YouTube automáticamente
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Button
              onClick={handleClick}
              disabled={isDisabled}
              variant={isLocked ? "outline" : "default"}
              className={cn(
                "relative transition-all duration-200",
                isLocked && "border-2",
                !isDisabled && !isLocked && "shadow-sm hover:shadow-md"
              )}
            >
              {isLocked && <Lock className="h-4 w-4 mr-2" />}
              {isLocked ? "Solo usuarios registrados" : "Generar QR Inteligente"}
            </Button>

            {/* Login prompt tooltip */}
            {showLoginPrompt && (
              <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 w-64 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Inicia sesión para continuar</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Los QR Inteligentes están disponibles solo para usuarios registrados.
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-8 -mt-2 w-0 h-0 
                  border-l-[6px] border-l-transparent
                  border-b-[8px] border-b-gray-900
                  border-r-[6px] border-r-transparent">
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features preview */}
        {user && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              ✨ Detección automática
            </span>
            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              🎨 Estilos personalizados
            </span>
            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              ⚡ 3 por día gratis
            </span>
          </div>
        )}
      </div>

      {/* Smart QR Modal */}
      {showModal && user && (
        <SmartQRModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          url={url}
          onGenerate={handleGenerate}
        />
      )}
    </>
  );
};