/**
 * ColorPickerPopover Component
 * 
 * A robust color picker component that integrates @uiw/react-color-sketch
 * with a custom dropdown implementation for an enhanced user experience.
 * 
 * Follows IA_MANIFESTO principles:
 * - 🛡️ Secure: Validates all color inputs
 * - ⚙️ Robust: Handles errors gracefully with fallbacks
 * - ✨ Simple: Clean API matching native input
 * - 🏗️ Modular: Self-contained component
 * - ❤️ User Value: Intuitive interface with preset colors
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Lazy load the color picker to optimize bundle size
const Sketch = dynamic(
  () => import('@uiw/react-color-sketch').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="w-[220px] h-[250px] flex items-center justify-center">
        <div className="text-sm text-slate-500">Cargando...</div>
      </div>
    )
  }
);

interface ColorPickerPopoverProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

// Default preset colors - same as current implementation
const defaultPresetColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00',
  '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FF6600', '#9C27B0', '#4CAF50', '#2196F3',
  '#FF9800', '#795548', '#607D8B', '#E91E63'
];

// Validate hex color format for security
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Sanitize color value to prevent XSS
const sanitizeColor = (color: string): string => {
  const sanitized = color.trim().toUpperCase();
  return isValidHexColor(sanitized) ? sanitized : '#000000';
};

export function ColorPickerPopover({
  value,
  onChange,
  presetColors = defaultPresetColors,
  disabled = false,
  placeholder = '#000000',
  className,
  id,
  'aria-label': ariaLabel,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || placeholder);
  const [error, setError] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize sanitized value
  const sanitizedValue = useMemo(() => sanitizeColor(value || placeholder), [value, placeholder]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || placeholder);
  }, [value, placeholder]);


  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      // Add delay to prevent immediate closure
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Handle color selection from picker
  const handleColorChange = useCallback((color: { hex?: string }) => {
    if (!color.hex) return;
    
    const sanitized = sanitizeColor(color.hex);
    setInputValue(sanitized);
    setError(false);
    onChange(sanitized);
  }, [onChange]);

  // Handle manual input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (isValidHexColor(newValue)) {
      setError(false);
      onChange(sanitizeColor(newValue));
    } else {
      setError(true);
    }
  }, [onChange]);

  // Handle input blur - reset to valid value if invalid
  const handleInputBlur = useCallback(() => {
    if (!isValidHexColor(inputValue)) {
      setInputValue(sanitizedValue);
      setError(false);
    }
  }, [inputValue, sanitizedValue]);

  // Keyboard accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      e.preventDefault();
    }
  }, [open]);


  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2 items-center">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            "w-8 h-8 p-0 border-2",
            error && "border-red-500",
            "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-all duration-200"
          )}
          style={{ backgroundColor: sanitizedValue }}
          aria-label={ariaLabel || "Seleccionar color"}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="sr-only">Color actual: {sanitizedValue}</span>
        </Button>
        
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "h-8 text-sm flex-1",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        {error && (
          <span id={`${id}-error`} className="sr-only">
            Formato de color inválido. Use #RRGGBB
          </span>
        )}
      </div>

      {/* Custom Dropdown */}
      {open && !disabled && (
        <div 
          ref={pickerRef}
          className={cn(
            "absolute mt-2",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
          style={{ zIndex: 999999 }}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="color-picker-wrapper shadow-lg border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden relative bg-white dark:bg-slate-900">
            <Sketch
              color={sanitizedValue}
              onChange={handleColorChange}
              presetColors={presetColors}
              disableAlpha
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized component for performance
export default React.memo(ColorPickerPopover);