/**
 * URL Validation Input Component
 * 
 * Handles URL input with real-time validation feedback.
 * This is a pure presentation component that receives all state via props.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Loader2, Link2 } from 'lucide-react';
import { ValidationMetadata } from '@/types/generatorStates';
import { useEditingIntent } from '@/hooks/useEditingIntent';

interface URLValidationInputProps {
  url: string;
  onChange: (value: string) => void;
  isValidating: boolean;
  validationMetadata: ValidationMetadata | null;
  showFeedback: boolean;
  onGenerateAnyway?: () => void;
  onEditingIntentChange?: (isEditing: boolean) => void;
  className?: string;
}

export function URLValidationInput({
  url,
  onChange,
  isValidating,
  validationMetadata,
  showFeedback,
  onGenerateAnyway,
  onEditingIntentChange,
  className
}: URLValidationInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<string>(url);
  
  // Use editing intent detection
  const editingIntent = useEditingIntent({
    onIntentChange: onEditingIntentChange
  });

  // Determine validation state
  const getValidationState = () => {
    if (!showFeedback || !url) return 'idle';
    if (isValidating) return 'validating';
    if (validationMetadata?.exists) return 'valid';
    if (validationMetadata?.exists === false) return 'invalid';
    return 'idle';
  };

  const validationState = getValidationState();

  // Get feedback message
  const getFeedbackMessage = () => {
    if (!url) {
      return 'Ingresa o pega el enlace que quieres compartir';
    }

    switch (validationState) {
      case 'validating':
        return 'Validando URL...';
      case 'valid':
        return `✓ ${validationMetadata?.title || 'URL válida'}`;
      case 'invalid':
        return validationMetadata?.error || 'No se pudo acceder a esta URL';
      default:
        return '';
    }
  };

  const feedbackMessage = getFeedbackMessage();

  // Get input border color based on state
  const getInputClassName = () => {
    return cn(
      'transition-all duration-200',
      {
        'border-slate-300 focus:border-blue-500': validationState === 'idle',
        'border-blue-500 focus:border-blue-600': validationState === 'validating',
        'border-green-500 focus:border-green-600': validationState === 'valid',
        'border-amber-500 focus:border-amber-600': validationState === 'invalid',
      },
      className
    );
  };

  // Get icon based on state
  const getIcon = () => {
    switch (validationState) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'valid':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Link2 className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => {
            const newValue = e.target.value;
            const oldValue = previousValueRef.current;
            
            // Track value changes for intent detection
            editingIntent.handleChange(newValue, oldValue);
            previousValueRef.current = newValue;
            
            onChange(newValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={editingIntent.handlers.onKeyDown}
          onSelect={editingIntent.handlers.onSelect}
          onMouseDown={editingIntent.handlers.onMouseDown}
          placeholder="https://tu-sitio-web.com"
          className={getInputClassName()}
          aria-label="URL para generar código QR"
          aria-invalid={validationState === 'invalid'}
          aria-describedby="url-feedback"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {getIcon()}
        </div>
      </div>

      {/* Feedback Message */}
      {(showFeedback || !url) && (
        <div
          id="url-feedback"
          className={cn(
            'text-sm transition-all duration-200',
            {
              'text-slate-500': !url || validationState === 'idle',
              'text-blue-600': validationState === 'validating',
              'text-green-600': validationState === 'valid',
              'text-amber-600': validationState === 'invalid',
            }
          )}
        >
          {feedbackMessage}
        </div>
      )}

      {/* Generate Anyway Option */}
      {validationState === 'invalid' && onGenerateAnyway && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateAnyway}
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            Generar de todas formas
          </Button>
          <span className="text-xs text-slate-500">
            El código QR funcionará aunque la URL no esté accesible ahora
          </span>
        </div>
      )}

      {/* URL Metadata Preview */}
      {validationState === 'valid' && validationMetadata && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            {validationMetadata.favicon && (
              <img
                src={validationMetadata.favicon}
                alt=""
                className="w-6 h-6 rounded"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-green-900 dark:text-green-100 truncate">
                {validationMetadata.title}
              </h4>
              {validationMetadata.description && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
                  {validationMetadata.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}