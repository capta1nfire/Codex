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
      {/* Glassmorphism container */}
      <div className={cn(
        "relative p-5 rounded-xl transition-all duration-300",
        "bg-white/30 dark:bg-gray-900/30",
        "backdrop-blur-md backdrop-saturate-150",
        "border border-white/20 dark:border-white/10",
        "shadow-xl shadow-black/5",
        "hover:shadow-2xl hover:bg-white/40 dark:hover:bg-gray-900/40",
        className
      )}>
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Row 1: Icon and title */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Smart QR
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-medium">
                BETA
              </span>
            </h3>
          </div>
          
          {/* Row 2: Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered professional styles
          </p>
          
          {/* Row 3: Button */}
          <Button
            onClick={handleClick}
            disabled={isDisabled}
            variant="default"
            size="sm"
            className={cn(
              "transition-all duration-200",
              isLocked && "opacity-80"
            )}
          >
            {isLocked ? (
              <>
                <Lock className="h-3 w-3 mr-1.5" />
                Sign in
              </>
            ) : (
              "Try now →"
            )}
          </Button>

          {/* Login prompt */}
          {showLoginPrompt && (
            <div className="absolute top-full mt-2 p-2 bg-slate-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
              Sign in to use Smart QR
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          )}
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