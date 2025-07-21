'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Controller, Control, FieldErrors, UseFormWatch, UseFormReset, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GenerateFormData } from '@/schemas/generate.schema';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { 
  Palette, 
  Settings2, 
  ArrowLeftRight
} from 'lucide-react';
import { 
  QR_V3_GRADIENTS, 
  QR_V3_EYE_SHAPES, 
  QR_V3_DATA_PATTERNS,
  QR_V3_EYE_BORDER_STYLES,
  QR_V3_EYE_CENTER_STYLES
} from '@/constants/qrV3Options';
import { DATA_PATTERN_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';


// Importar dinámicamente AdvancedBarcodeOptions
const AdvancedBarcodeOptions = dynamic(() => import('./AdvancedBarcodeOptions'), {
  ssr: false,
});

// Importar dinámicamente ColorPickerPopover para optimizar bundle
const ColorPickerPopover = dynamic(() => import('@/components/ui/color-picker-popover'), {
  ssr: false,
  loading: () => <div className="h-8 w-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
});

interface GenerationOptionsProps {
  control: Control<GenerateFormData>;
  errors: FieldErrors<GenerateFormData>;
  watch: UseFormWatch<GenerateFormData>;
  isLoading: boolean;
  selectedType: string | undefined;
  reset: UseFormReset<GenerateFormData>;
  setValue: UseFormSetValue<GenerateFormData>;
  getValues: UseFormGetValues<GenerateFormData>;
  onSubmit: (data: GenerateFormData) => void;
  onToggleSection?: (section: string) => void;
  showV2Features?: boolean;
}

function GenerationOptions({
  control,
  errors,
  watch,
  isLoading,
  selectedType,
  reset,
  setValue,
  getValues,
  onSubmit,
}: GenerationOptionsProps) {
  
  // Estado para el tab activo - aislado para evitar re-renders del padre
  const [activeTab, setActiveTab] = useState<string>('shapes');
  
  // Memoizar el cambio de tab para evitar re-renders
  const handleTabChange = useCallback((tabId: string) => {
    // Solo actualizar el estado local, no disparar cambios en el formulario
    setActiveTab(tabId);
  }, []);
  
  // Calculate conditional visibility
  const isQrCode = selectedType === 'qrcode';
  
  // Watch the separated eye styles toggle specifically
  const useSeparatedEyeStyles = watch('options.use_separated_eye_styles') ?? true;
  
  // Force re-render when toggle changes
  React.useEffect(() => {
    const subscription = watch(() => {
      // Re-render will happen automatically when the value changes
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  
  // Establecer valor inicial para estilos separados si no está definido
  React.useEffect(() => {
    const currentValue = getValues('options.use_separated_eye_styles');
    console.log('[GenerationOptions] Initial use_separated_eye_styles value:', currentValue);
    if (currentValue === undefined || currentValue === null || currentValue === false) {
      console.log('[GenerationOptions] Setting use_separated_eye_styles to true (was:', currentValue, ')');
      setValue('options.use_separated_eye_styles', true, { shouldValidate: false });
      // Forzar actualización del valor
      setTimeout(() => {
        const newValue = getValues('options.use_separated_eye_styles');
        console.log('[GenerationOptions] After setValue, new value is:', newValue);
        if (!newValue) {
          setValue('options.use_separated_eye_styles', true, { shouldValidate: true });
        }
      }, 100);
    }
  }, [getValues, setValue]);


  // ColorInput como componente interno memoizado
  const ColorInput = React.memo(({ 
    name, 
    label, 
    defaultValue 
  }: { 
    name: 'options.fgcolor' | 'options.gradient_color1' | 'options.gradient_color2' | 'options.bgcolor'; 
    label: string; 
    defaultValue: string;
  }) => (
    <div className="space-y-1">
      <Label className="text-sm text-slate-600 dark:text-slate-400">{label}</Label>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={field.value || defaultValue}
              onChange={(e) => {
                field.onChange(e.target.value);
                // Trigger form re-generation
                setTimeout(() => {
                  const currentFormValues = getValues();
                  onSubmit(currentFormValues);
                }, 100);
              }}
              className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded-md cursor-pointer"
              disabled={isLoading}
              aria-label={`Seleccionar ${label.toLowerCase()}`}
            />
            <Input
              type="text"
              value={field.value || defaultValue}
              disabled={isLoading}
              placeholder={defaultValue}
              onChange={(e) => {
                field.onChange(e.target.value);
                // Trigger form re-generation
                setTimeout(() => {
                  const currentFormValues = getValues();
                  onSubmit(currentFormValues);
                }, 100);
              }}
              className={cn(
                "h-8 text-sm flex-1",
                errors.options?.[name.split('.')[1] as keyof typeof errors.options] 
                  ? 'border-destructive' 
                  : 'focus:border-blue-500'
              )}
            />
          </div>
        )}
      />
    </div>
  ));
  ColorInput.displayName = 'ColorInput';

  // Memoizar el handler de intercambio de colores
  const handleSwapColors = useCallback(() => {
    const color1 = watch('options.gradient_color1') || '#2563EB';
    const color2 = watch('options.gradient_color2') || '#000000';
    // Usar batch update para evitar múltiples re-renders
    setValue('options.gradient_color1', color2, { shouldValidate: false });
    setValue('options.gradient_color2', color1, { shouldValidate: false });
    // Solo generar después de ambas actualizaciones
    const currentFormValues = getValues();
    onSubmit(currentFormValues);
  }, [watch, setValue, getValues, onSubmit]);

  // Colores predefinidos para selección rápida
  const presetColors = useMemo(() => [
    '#000000', // Negro
    '#FFFFFF', // Blanco
    '#FF0000', // Rojo
    '#00FF00', // Verde
    '#0000FF', // Azul
    '#FFFF00', // Amarillo
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF6B6B', // Rojo suave
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul cielo
    '#F7DC6F', // Amarillo suave
    '#BB8FCE', // Púrpura suave
    '#85C1E2', // Azul claro
    '#F8C471', // Naranja suave
    '#82E0AA', // Verde menta
  ], []);

  // Componente de paleta de colores predefinidos
  const ColorPresets = React.memo(({ onColorSelect, currentColor }: { 
    onColorSelect: (color: string) => void;
    currentColor?: string;
  }) => (
    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-md">
      {presetColors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onColorSelect(color)}
          className={cn(
            "w-6 h-6 rounded border-2 transition-all duration-200",
            currentColor === color 
              ? "border-blue-500 scale-110 shadow-md" 
              : "border-transparent hover:border-slate-400"
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  ));
  ColorPresets.displayName = 'ColorPresets';

  // Definir los tabs - memoizado para evitar recreación
  const tabs = useMemo(() => [
    {
      id: 'shapes',
      name: 'Shapes',
      icon: Settings2,
    },
    {
      id: 'color',
      name: 'Color',
      icon: Palette,
    },
    {
      id: 'logo',
      name: 'Logo',
      icon: Settings2,
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: Settings2,
    },
  ], []);

  // Memoizar el contenido de cada tab para evitar re-renders
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'color':
        return (
          <div className="space-y-3 animate-in fade-in-50 duration-300">
            {/* QR Code Color Options */}
            {isQrCode && (
              <div className="space-y-3">
                {/* Compact Color Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Controller
                    name="options.gradient_enabled"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/50 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={cn(
                            "px-3 py-1 rounded text-sm font-medium transition-all duration-200",
                            !field.value 
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" 
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          Sólido
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={cn(
                            "px-3 py-1 rounded text-sm font-medium transition-all duration-200",
                            field.value 
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" 
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          Gradiente
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* Color Controls - Only show when gradient is disabled */}
                {!watch('options.gradient_enabled') && (
                  // Solid Color Mode - Compact layout
                  <div className="space-y-3">
                    {/* Colors in 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Foreground Color */}
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Color principal</Label>
                        <Controller
                          name="options.fgcolor"
                          control={control}
                          defaultValue="#000000"
                          render={({ field }) => (
                            <ColorPickerPopover
                              value={field.value || "#000000"}
                              onChange={(color) => {
                                field.onChange(color);
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              disabled={isLoading}
                              placeholder="#000000"
                              id="qr-fg-color"
                              aria-label="Color principal del código QR"
                            />
                          )}
                        />
                      </div>
                      
                      {/* Background Color */}
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Color de fondo</Label>
                        <Controller
                          name="options.bgcolor"
                          control={control}
                          defaultValue="#FFFFFF"
                          render={({ field }) => (
                            <ColorPickerPopover
                              value={field.value || "#FFFFFF"}
                              onChange={(color) => {
                                field.onChange(color);
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              presetColors={presetColors}
                              disabled={isLoading}
                              placeholder="#FFFFFF"
                              aria-label="Color de fondo"
                            />
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Background Options */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-900/30">
                      <Label htmlFor="transparent-bg" className="text-sm cursor-pointer text-slate-600 dark:text-slate-400">
                        Fondo transparente
                      </Label>
                      <Controller
                        name="options.transparent_background"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <Switch
                            id="transparent-bg"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              // 🚨 CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
                              // This toggle ONLY changes the visual appearance of the QR background
                              // It does NOT regenerate the QR code to avoid unnecessary backend calls
                              // The change is instant and handled purely in the frontend
                              // ⚠️ DO NOT add onSubmit() or any form regeneration here ⚠️
                              field.onChange(checked);
                            }}
                            className="data-[state=checked]:bg-blue-600 scale-90"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Gradient Options - QR Only */}
                {watch('options.gradient_enabled') && isQrCode && (
                  <div className="space-y-3 animate-in fade-in-50 duration-200">
                    {/* Gradient Type Selection */}
                    <Controller
                      name="options.gradient_type"
                      control={control}
                      defaultValue="linear"
                      render={({ field }) => (
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { value: 'linear', label: 'Linear', icon: '⬢' },
                            { value: 'radial', label: 'Radial', icon: '◉' },
                            { value: 'conic', label: 'Conic', icon: '◐' },
                            { value: 'diamond', label: 'Diamond', icon: '◆' },
                            { value: 'spiral', label: 'Spiral', icon: '🌀' },
                          ].map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                field.onChange(type.value);
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
                                field.value === type.value
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                              )}
                            >
                              <span className="text-lg mb-0.5">{type.icon}</span>
                              <span className="text-xs">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />

                    {/* Gradient Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Color 1</Label>
                        <Controller
                          name="options.gradient_color1"
                          control={control}
                          defaultValue="#FF0066"
                          render={({ field }) => (
                            <ColorPickerPopover
                              value={field.value || "#FF0066"}
                              onChange={(color) => {
                                field.onChange(color);
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              presetColors={presetColors}
                              disabled={isLoading}
                              placeholder="#FF0066"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Color 2</Label>
                        <Controller
                          name="options.gradient_color2"
                          control={control}
                          defaultValue="#6600FF"
                          render={({ field }) => (
                            <ColorPickerPopover
                              value={field.value || "#6600FF"}
                              onChange={(color) => {
                                field.onChange(color);
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              presetColors={presetColors}
                              disabled={isLoading}
                              placeholder="#6600FF"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Swap Colors Button */}
                    <button
                      type="button"
                      onClick={handleSwapColors}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                      </svg>
                      <span className="text-sm font-medium">Intercambiar colores</span>
                    </button>

                    {/* Gradient Angle (for linear gradients) */}
                    {watch('options.gradient_type') === 'linear' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-slate-600 dark:text-slate-400">
                            Ángulo del gradiente
                          </Label>
                          <span className="text-sm font-medium">
                            {watch('options.gradient_angle') ?? 90}°
                          </span>
                        </div>
                        <Controller
                          name="options.gradient_angle"
                          control={control}
                          defaultValue={90}
                          render={({ field }) => (
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="15"
                              value={field.value !== undefined ? field.value : 90}
                              onChange={(e) => {
                                field.onChange(Number(e.target.value));
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              disabled={isLoading}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((field.value !== undefined ? field.value : 90) / 360) * 100}%, #e2e8f0 ${((field.value !== undefined ? field.value : 90) / 360) * 100}%, #e2e8f0 100%)`
                              }}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Solid Colors for Non-QR Codes */}
            {!isQrCode && (
              <div className="grid grid-cols-2 gap-3">
                {/* Foreground Color */}
                <div className="space-y-1">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Color principal</Label>
                  <Controller
                    name="options.fgcolor"
                    control={control}
                    defaultValue="#000000"
                    render={({ field }) => (
                      <ColorPickerPopover
                        value={field.value || "#000000"}
                        onChange={(color) => {
                          field.onChange(color);
                          setTimeout(() => {
                            const currentFormValues = getValues();
                            onSubmit(currentFormValues);
                          }, 100);
                        }}
                        presetColors={presetColors}
                        disabled={isLoading}
                        placeholder="#000000"
                        aria-label="Color principal del código de barras"
                      />
                    )}
                  />
                </div>
                
                {/* Background Color */}
                <div className="space-y-1">
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Color de fondo</Label>
                  <Controller
                    name="options.bgcolor"
                    control={control}
                    defaultValue="#FFFFFF"
                    render={({ field }) => (
                      <ColorPickerPopover
                        value={field.value || "#FFFFFF"}
                        onChange={(color) => {
                          field.onChange(color);
                          setTimeout(() => {
                            const currentFormValues = getValues();
                            onSubmit(currentFormValues);
                          }, 100);
                        }}
                        presetColors={presetColors}
                        disabled={isLoading}
                        placeholder="#FFFFFF"
                        aria-label="Color de fondo del código de barras"
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'shapes':
        return (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            {/* General Section - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Gradient Toggle */}
              <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg">
                <Controller
                  name="options.gradient_enabled"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Gradiente</Label>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setTimeout(() => {
                            const currentFormValues = getValues();
                            onSubmit(currentFormValues);
                          }, 100);
                        }}
                        disabled={isLoading}
                        className="scale-90"
                      />
                    </div>
                  )}
                />
              </div>

              {/* Column 2: Background Color */}
              <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg">
                <Controller
                  name="options.bgcolor"
                  control={control}
                  defaultValue="#FFFFFF"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Fondo</Label>
                      <ColorPickerPopover
                        value={field.value || "#FFFFFF"}
                        onChange={(color) => {
                          field.onChange(color);
                          setTimeout(() => {
                            const currentFormValues = getValues();
                            onSubmit(currentFormValues);
                          }, 100);
                        }}
                        presetColors={presetColors}
                        disabled={isLoading}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  )}
                />
              </div>

              {/* Column 3: Transparent Background */}
              <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg">
                <Controller
                  name="options.transparent_background"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Transparencia</Label>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                        }}
                        disabled={isLoading}
                        className="scale-90"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Data Pattern Section - 2 columns layout */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Patrón de Datos
              </Label>
              <div className="flex items-start gap-4">
                {/* Left column: Pattern selector (49%) */}
                <div style={{ width: '49%' }}>
                  <Controller
                    name="options.data_pattern"
                    control={control}
                    defaultValue="square"
                    render={({ field }) => (
                      <div className="grid grid-cols-6 gap-2">
                        {QR_V3_DATA_PATTERNS.map((pattern) => {
                          const svgPath = DATA_PATTERN_SVG_PATHS[pattern.value as keyof typeof DATA_PATTERN_SVG_PATHS];
                          if (!svgPath) return null;
                          
                          return (
                            <button
                              key={pattern.value}
                              type="button"
                              onClick={() => {
                                console.log('[GenerationOptions] 🎯 Data pattern clicked:', {
                                  oldValue: field.value,
                                  newValue: pattern.value,
                                  patternLabel: pattern.label
                                });
                                field.onChange(pattern.value);
                                
                                // Verificar cambio y regenerar
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  console.log('[GenerationOptions] 🎯 Data pattern after change:', {
                                    data_pattern: currentFormValues.options?.data_pattern,
                                    willSubmit: true
                                  });
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              className={cn(
                                "aspect-square flex items-center justify-center p-3 rounded-lg border-2 transition-all backdrop-blur-md backdrop-saturate-150 shadow-sm",
                                field.value === pattern.value
                                  ? "border-blue-500 bg-white/30 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 shadow-md"
                                  : "border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 bg-white/30 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500"
                              )}
                              title={pattern.label}
                            >
                              <svg 
                                width="24" 
                                height="24" 
                                viewBox="0 0 3 3" 
                                fill="currentColor"
                              >
                                <path d={svgPath} fillRule="evenodd"/>
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>
                
                {/* Visual separator */}
                <div className="flex self-stretch">
                  <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="w-px bg-white dark:bg-slate-600"></div>
                </div>
                
                {/* Right column: Gradient controls (49%) */}
                <div className="space-y-3" style={{ width: '49%' }}>
                  {/* Only show gradient controls if gradient is enabled */}
                  {watch('options.gradient_enabled') && (
                    <>
                      {/* Gradient Colors - Individual glassmorphism */}
                      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <Controller
                            name="options.gradient_color1"
                            control={control}
                            defaultValue="#2563EB"
                            render={({ field }) => (
                              <ColorPickerPopover
                                value={field.value || "#2563EB"}
                                onChange={(color) => {
                                  field.onChange(color);
                                  console.log('[Main Gradient] Color1 changed to:', color);
                                  console.log('[Main Gradient] Eye border gradient:', getValues('options.eye_border_color_gradient'));
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                presetColors={presetColors}
                                disabled={isLoading}
                                placeholder="#2563EB"
                                aria-label="Color de inicio del gradiente"
                              />
                            )}
                          />
                          
                          <button
                            type="button"
                            onClick={handleSwapColors}
                            disabled={isLoading}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 rounded-md"
                            title="Intercambiar colores"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                          </button>
                          
                          <Controller
                            name="options.gradient_color2"
                            control={control}
                            defaultValue="#000000"
                            render={({ field }) => (
                              <ColorPickerPopover
                                value={field.value || "#000000"}
                                onChange={(color) => {
                                  field.onChange(color);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                presetColors={presetColors}
                                disabled={isLoading}
                                placeholder="#000000"
                                aria-label="Color de fin del gradiente"
                              />
                            )}
                          />
                        </div>
                      </div>

                      {/* Gradient Type - No container glassmorphism */}
                      <div className="space-y-1">
                        <Controller
                          name="options.gradient_type"
                          control={control}
                          defaultValue="radial"
                          render={({ field }) => (
                            <div className="grid grid-cols-6 gap-1">
                              {QR_V3_GRADIENTS.map((gradient) => (
                                <button
                                  key={gradient.value}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(gradient.value);
                                    setTimeout(() => {
                                      const currentFormValues = getValues();
                                      onSubmit(currentFormValues);
                                    }, 100);
                                  }}
                                  disabled={isLoading}
                                  className={cn(
                                    "aspect-square flex items-center justify-center p-3 rounded-lg border-2 transition-all backdrop-blur-md backdrop-saturate-150 shadow-sm",
                                    field.value === gradient.value
                                      ? "border-blue-500 bg-white/30 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500 shadow-md"
                                      : "border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 bg-white/30 dark:bg-gray-900/30 text-gray-400 dark:text-gray-500"
                                  )}
                                  title={gradient.label}
                                >
                                  {gradient.value === 'linear' && (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                      <defs>
                                        <linearGradient id="linear-icon" x1="0%" y1="0%" x2="100%" y2="100%">
                                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                                          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                                        </linearGradient>
                                      </defs>
                                      <rect width="24" height="24" fill="url(#linear-icon)" rx="3" />
                                    </svg>
                                  )}
                                  {gradient.value === 'radial' && (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                      <defs>
                                        <radialGradient id="radial-icon">
                                          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
                                        </radialGradient>
                                      </defs>
                                      <circle cx="12" cy="12" r="10" fill="url(#radial-icon)" />
                                    </svg>
                                  )}
                                  {gradient.value === 'conic' && (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                      <defs>
                                        <linearGradient id="conic-icon" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                                          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
                                        </linearGradient>
                                      </defs>
                                      <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="url(#conic-icon)" />
                                    </svg>
                                  )}
                                  {gradient.value === 'diamond' && (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                      <defs>
                                        <radialGradient id="diamond-icon" cx="50%" cy="50%">
                                          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                                          <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
                                        </radialGradient>
                                      </defs>
                                      <path d="M12 3 L21 12 L12 21 L3 12 Z" fill="url(#diamond-icon)" />
                                    </svg>
                                  )}
                                  {gradient.value === 'spiral' && (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                      <path d="M12 3 Q18 6 18 12 Q15 18 9 18 Q3 15 3 9 Q6 3 12 3" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        fill="none"
                                        opacity="0.8"
                                      />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        />
                      </div>

                      {/* Gradient Angle Slider - Only show for linear gradients */}
                      {watch('options.gradient_type') === 'linear' && (
                        <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Ángulo</Label>
                          <Controller
                            name="options.gradient_angle"
                            control={control}
                            defaultValue={90}
                            render={({ field }) => (
                              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {field.value !== undefined ? field.value : 90}°
                              </span>
                            )}
                          />
                        </div>
                        <Controller
                          name="options.gradient_angle"
                          control={control}
                          defaultValue={90}
                          render={({ field }) => (
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="15"
                              value={field.value !== undefined ? field.value : 90}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                console.log(`[GenerationOptions] 🔴 ANGLE SLIDER CHANGED - START:`, {
                                  newValue: value,
                                  fieldName: 'options.gradient_angle',
                                  rawTargetValue: e.target.value,
                                  currentFieldValue: field.value,
                                  timestamp: new Date().toISOString()
                                });
                                
                                // Aplicar el cambio al field
                                field.onChange(value);
                                
                                // Log inmediato para verificar el cambio
                                console.log(`[GenerationOptions] 🟡 ANGLE CHANGE - After field.onChange:`, {
                                  newAngle: value,
                                  fieldValue: field.value,
                                  gradientType: getValues('options.gradient_type'),
                                  gradientEnabled: getValues('options.gradient_enabled'),
                                  fullOptions: getValues('options')
                                });
                                
                                // Force immediate re-render
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  console.log(`[GenerationOptions] 🟢 ANGLE CHANGE - Before submit:`, {
                                    gradient_angle: currentFormValues.options?.gradient_angle,
                                    gradient_type: currentFormValues.options?.gradient_type,
                                    gradient_enabled: currentFormValues.options?.gradient_enabled,
                                    willSubmit: true
                                  });
                                  
                                  // Log el objeto completo que se enviará
                                  console.log(`[GenerationOptions] 📤 ANGLE CHANGE - Full submission data:`, {
                                    data: currentFormValues.data,
                                    barcode_type: currentFormValues.barcode_type,
                                    options: {
                                      gradient_enabled: currentFormValues.options?.gradient_enabled,
                                      gradient_type: currentFormValues.options?.gradient_type,
                                      gradient_angle: currentFormValues.options?.gradient_angle,
                                      gradient_color1: currentFormValues.options?.gradient_color1,
                                      gradient_color2: currentFormValues.options?.gradient_color2
                                    }
                                  });
                                  
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              disabled={isLoading}
                              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((field.value !== undefined ? field.value : 90) / 360) * 100}%, #e2e8f0 ${((field.value !== undefined ? field.value : 90) / 360) * 100}%, #e2e8f0 100%)`
                              }}
                            />
                          )}
                        />
                      </div>
                      )}

                      {/* Gradient Options - Individual glassmorphism */}
                      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50/50 dark:bg-slate-900/50">
                          <Label htmlFor="gradient-borders-data" className="text-xs cursor-pointer text-slate-600 dark:text-slate-400">
                            Bordes
                          </Label>
                          <Controller
                            name="options.gradient_borders"
                            control={control}
                            defaultValue={false}
                            render={({ field }) => (
                              <Switch
                                id="gradient-borders-data"
                                checked={field.value ?? false}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                disabled={isLoading}
                                className="data-[state=checked]:bg-blue-600 scale-75"
                              />
                            )}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50/50 dark:bg-slate-900/50">
                          <Label htmlFor="gradient-per-module-data" className="text-xs cursor-pointer text-slate-600 dark:text-slate-400">
                            Por Módulo
                          </Label>
                          <Controller
                            name="options.gradient_per_module"
                            control={control}
                            defaultValue={false}
                            render={({ field }) => (
                              <Switch
                                id="gradient-per-module-data"
                                checked={field.value ?? false}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                disabled={isLoading}
                                className="data-[state=checked]:bg-blue-600 scale-75"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Horizontal separator */}
            <div className="w-full">
              <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
              <div className="h-px bg-white dark:bg-slate-600 w-full"></div>
            </div>

            {/* Eye Shapes Section - 2 columns layout like Data Pattern */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Forma de Ojos (Esquinas)
                </Label>
                <Controller
                  name="options.use_separated_eye_styles"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => {
                    return (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="separated-eyes" className="text-xs text-slate-600 dark:text-slate-400">
                        Estilos separados
                      </Label>
                      <Switch
                        id="separated-eyes"
                        checked={field.value !== false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // Clear unified style when enabling separated styles
                          if (checked) {
                            setValue('options.eye_shape', undefined, { shouldValidate: true });
                            // Set default values for separated styles
                            setValue('options.eye_border_style', 'square', { shouldValidate: true });
                            setValue('options.eye_center_style', 'square', { shouldValidate: true });
                          } else {
                            // Clear separated styles when disabling
                            setValue('options.eye_border_style', undefined, { shouldValidate: true });
                            setValue('options.eye_center_style', undefined, { shouldValidate: true });
                            // Set default unified style
                            setValue('options.eye_shape', 'square', { shouldValidate: true });
                          }
                          // Force immediate form update and re-render
                          setValue('options.use_separated_eye_styles', checked, { shouldValidate: true });
                          
                          // Trigger form re-generation with delay to ensure state is updated
                          setTimeout(() => {
                            const currentFormValues = getValues();
                            onSubmit(currentFormValues);
                          }, 0);
                        }}
                        className="scale-90"
                      />
                    </div>
                    );
                  }}
                />
              </div>

              {/* Unified Eye Shape Selection */}
              {(!useSeparatedEyeStyles && false) && (
                <Controller
                  key="unified-style"
                  name="options.eye_shape"
                  control={control}
                  defaultValue="square"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {QR_V3_EYE_SHAPES.map((shape) => (
                        <button
                          key={shape.value}
                          type="button"
                          onClick={() => field.onChange(shape.value)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                            field.value === shape.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          )}
                        >
                          <span className="text-2xl mb-1">{shape.icon}</span>
                          <span className="text-xs font-medium">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
              )}

              {/* Separated Eye Styles - 2 Column Layout like Data Pattern */}
              {(useSeparatedEyeStyles || true) && (
                <div className="flex items-start gap-4">
                  {/* Left column: Eye style selectors (49%) */}
                  <div style={{ width: '49%' }} className="space-y-4">
                    {/* Eye Border Style */}
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        Estilo del Borde
                      </Label>
                      <Controller
                        name="options.eye_border_style"
                        control={control}
                        defaultValue="square"
                        render={({ field }) => (
                          <div className="grid grid-cols-5 gap-2">
                            {QR_V3_EYE_BORDER_STYLES.slice(0, 10).map((style) => (
                              <button
                                key={style.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(style.value);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                className={cn(
                                  "aspect-square flex items-center justify-center p-3 rounded-lg border-2 transition-all backdrop-blur-md backdrop-saturate-150 shadow-sm",
                                  field.value === style.value
                                    ? "border-blue-500 bg-white/30 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 shadow-md"
                                    : "border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 bg-white/30 dark:bg-gray-900/30 text-gray-500 dark:text-gray-500"
                                )}
                                disabled={isLoading}
                                title={style.label}
                              >
                                <span className="text-xl">{style.icon}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>

                    {/* Eye Center Style */}
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        Estilo del Centro
                      </Label>
                      <Controller
                        name="options.eye_center_style"
                        control={control}
                        defaultValue="square"
                        render={({ field }) => (
                          <div className="grid grid-cols-5 gap-2">
                            {QR_V3_EYE_CENTER_STYLES.map((style) => (
                              <button
                                key={style.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(style.value);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                className={cn(
                                  "aspect-square flex items-center justify-center p-3 rounded-lg border-2 transition-all backdrop-blur-md backdrop-saturate-150 shadow-sm",
                                  field.value === style.value
                                    ? "border-blue-500 bg-white/30 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 shadow-md"
                                    : "border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20 bg-white/30 dark:bg-gray-900/30 text-gray-500 dark:text-gray-500"
                                )}
                                disabled={isLoading}
                                title={style.label}
                              >
                                <span className="text-xl">{style.icon}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Visual separator */}
                  <div className="flex self-stretch">
                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                    <div className="w-px bg-white dark:bg-slate-600"></div>
                  </div>
                  
                  {/* Right column: Color controls (49%) */}
                  <div className="space-y-3" style={{ width: '49%' }}>
                      {/* Eye Borders/Frames Color Control */}
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                          Color del Borde
                        </Label>
                    <Controller
                      name="options.eye_border_color_mode"
                      control={control}
                      defaultValue="gradient"
                      render={({ field: modeField }) => {
                        const mode = modeField.value || 'inherit';
                        
                        return (
                          <div className="space-y-2">
                            {/* Compact Mode Selection */}
                            <Select 
                              value={mode} 
                              onValueChange={(value) => {
                                modeField.onChange(value);
                                // Clear other fields when mode changes
                                if (value === 'inherit') {
                                  setValue('options.eye_border_color_solid', undefined);
                                  setValue('options.eye_border_color_gradient', undefined);
                                } else if (value === 'gradient') {
                                  // Pre-load gradient colors from main gradient
                                  const mainColor1 = getValues('options.gradient_color1') || '#000000';
                                  const mainColor2 = getValues('options.gradient_color2') || '#666666';
                                  setValue('options.eye_border_color_gradient', {
                                    color1: mainColor1,
                                    color2: mainColor2
                                  });
                                }
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">Heredar del patrón</SelectItem>
                                <SelectItem value="solid">Color sólido</SelectItem>
                                <SelectItem value="gradient">Gradiente</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Solid Color Option */}
                            {mode === 'solid' && (
                              <div className="animate-in slide-in-from-top-1 duration-200">
                                <Controller
                                  name="options.eye_border_color_solid"
                                  control={control}
                                  defaultValue="#000000"
                                  render={({ field }) => (
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="color"
                                        value={field.value || '#000000'}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          setTimeout(() => {
                                            const currentFormValues = getValues();
                                            onSubmit(currentFormValues);
                                          }, 100);
                                        }}
                                        className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                        disabled={isLoading}
                                      />
                                      <Input
                                        type="text"
                                        value={field.value || '#000000'}
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          setTimeout(() => {
                                            const currentFormValues = getValues();
                                            onSubmit(currentFormValues);
                                          }, 100);
                                        }}
                                        disabled={isLoading}
                                        placeholder="#000000"
                                        className="h-8 text-xs flex-1"
                                      />
                                    </div>
                                  )}
                                />
                              </div>
                            )}

                            {/* Gradient Option - Compact */}
                            {mode === 'gradient' && (
                              <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <Controller
                                    name="options.eye_border_color_gradient.color1"
                                    control={control}
                                    defaultValue="#0066FF"
                                    render={({ field }) => (
                                      <div className="flex gap-1 items-center">
                                        <input
                                          type="color"
                                          value={field.value || '#0066FF'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            console.log('[Eye Border Gradient] Color1 changed to:', e.target.value);
                                            console.log('[Eye Border Gradient] Main gradient color1:', getValues('options.gradient_color1'));
                                            console.log('[Eye Border Gradient] Full eye border gradient:', getValues('options.eye_border_color_gradient'));
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          className="w-6 h-6 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                          disabled={isLoading}
                                        />
                                        <Input
                                          type="text"
                                          value={field.value || '#0066FF'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          disabled={isLoading}
                                          placeholder="#0066FF"
                                          className="h-6 text-xs flex-1"
                                        />
                                      </div>
                                    )}
                                  />
                                  <Controller
                                    name="options.eye_border_color_gradient.color2"
                                    control={control}
                                    defaultValue="#00FF66"
                                    render={({ field }) => (
                                      <div className="flex gap-1 items-center">
                                        <input
                                          type="color"
                                          value={field.value || '#00FF66'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          className="w-6 h-6 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                          disabled={isLoading}
                                        />
                                        <Input
                                          type="text"
                                          value={field.value || '#00FF66'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          disabled={isLoading}
                                          placeholder="#00FF66"
                                          className="h-6 text-xs flex-1"
                                        />
                                      </div>
                                    )}
                                  />
                                </div>
                                
                                {/* Swap Colors Button for Eye Border */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const color1 = getValues('options.eye_border_color_gradient.color1');
                                    const color2 = getValues('options.eye_border_color_gradient.color2');
                                    setValue('options.eye_border_color_gradient.color1', color2);
                                    setValue('options.eye_border_color_gradient.color2', color1);
                                    setTimeout(() => {
                                      const currentFormValues = getValues();
                                      onSubmit(currentFormValues);
                                    }, 100);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 mt-2"
                                  disabled={isLoading}
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                                  </svg>
                                  <span className="text-xs font-medium">Intercambiar</span>
                                </button>
                                
                                {/* Angle Control for Eye Border Gradient */}
                                <div className="mt-2">
                                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                    Ángulo del Gradiente
                                  </Label>
                                  <Controller
                                    name="options.eye_border_color_gradient.angle"
                                    control={control}
                                    defaultValue={0}
                                    render={({ field }) => (
                                      <div className="flex gap-2 items-center">
                                        <Input
                                          type="range"
                                          min="0"
                                          max="360"
                                          step="15"
                                          value={field.value || 0}
                                          onChange={(e) => {
                                            field.onChange(Number(e.target.value));
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          disabled={isLoading}
                                          className="flex-1"
                                        />
                                        <div className="w-12 text-xs text-right">
                                          {field.value || 0}°
                                        </div>
                                      </div>
                                    )}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    </div>
                    
                    {/* Eye Center Color Control */}
                    <div>
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        Color del Centro
                      </Label>
                      <Controller
                        name="options.eye_color_mode"
                        control={control}
                        defaultValue="gradient"
                        render={({ field: modeField }) => {
                          const mode = modeField.value || 'inherit';
                          
                          return (
                            <div className="space-y-2">
                              {/* Compact Mode Selection */}
                              <Select 
                                value={mode} 
                                onValueChange={(value) => {
                                  modeField.onChange(value);
                                  // Clear other fields when mode changes
                                  if (value === 'inherit') {
                                    setValue('options.eye_color_solid', undefined);
                                    setValue('options.eye_color_gradient', undefined);
                                  } else if (value === 'gradient') {
                                    // Pre-load gradient colors from main gradient
                                    const mainColor1 = getValues('options.gradient_color1') || '#000000';
                                    const mainColor2 = getValues('options.gradient_color2') || '#666666';
                                    setValue('options.eye_color_gradient', {
                                      color1: mainColor1,
                                      color2: mainColor2
                                    });
                                  }
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                disabled={isLoading}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Heredar del patrón</SelectItem>
                                  <SelectItem value="solid">Color sólido</SelectItem>
                                  <SelectItem value="gradient">Gradiente</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Solid Color Option */}
                              {mode === 'solid' && (
                                <div className="animate-in slide-in-from-top-1 duration-200">
                                  <Controller
                                    name="options.eye_color_solid"
                                    control={control}
                                    defaultValue="#000000"
                                    render={({ field }) => (
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="color"
                                          value={field.value || '#000000'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                          disabled={isLoading}
                                        />
                                        <Input
                                          type="text"
                                          value={field.value || '#000000'}
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setTimeout(() => {
                                              const currentFormValues = getValues();
                                              onSubmit(currentFormValues);
                                            }, 100);
                                          }}
                                          disabled={isLoading}
                                          placeholder="#000000"
                                          className="h-8 text-xs flex-1"
                                        />
                                      </div>
                                    )}
                                  />
                                </div>
                              )}

                              {/* Gradient Option - Compact */}
                              {mode === 'gradient' && (
                                <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Controller
                                      name="options.eye_color_gradient.color1"
                                      control={control}
                                      defaultValue="#FF0066"
                                      render={({ field }) => (
                                        <div className="flex gap-1 items-center">
                                          <input
                                            type="color"
                                            value={field.value || '#FF0066'}
                                            onChange={(e) => {
                                              field.onChange(e.target.value);
                                              setTimeout(() => {
                                                const currentFormValues = getValues();
                                                onSubmit(currentFormValues);
                                              }, 100);
                                            }}
                                            className="w-6 h-6 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                            disabled={isLoading}
                                          />
                                          <Input
                                            type="text"
                                            value={field.value || '#FF0066'}
                                            onChange={(e) => {
                                              field.onChange(e.target.value);
                                              setTimeout(() => {
                                                const currentFormValues = getValues();
                                                onSubmit(currentFormValues);
                                              }, 100);
                                            }}
                                            disabled={isLoading}
                                            placeholder="#FF0066"
                                            className="h-6 text-xs flex-1"
                                          />
                                        </div>
                                      )}
                                    />
                                    <Controller
                                      name="options.eye_color_gradient.color2"
                                      control={control}
                                      defaultValue="#6600FF"
                                      render={({ field }) => (
                                        <div className="flex gap-1 items-center">
                                          <input
                                            type="color"
                                            value={field.value || '#6600FF'}
                                            onChange={(e) => {
                                              field.onChange(e.target.value);
                                              setTimeout(() => {
                                                const currentFormValues = getValues();
                                                onSubmit(currentFormValues);
                                              }, 100);
                                            }}
                                            className="w-6 h-6 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                            disabled={isLoading}
                                          />
                                          <Input
                                            type="text"
                                            value={field.value || '#6600FF'}
                                            onChange={(e) => {
                                              field.onChange(e.target.value);
                                              setTimeout(() => {
                                                const currentFormValues = getValues();
                                                onSubmit(currentFormValues);
                                              }, 100);
                                            }}
                                            disabled={isLoading}
                                            placeholder="#6600FF"
                                            className="h-6 text-xs flex-1"
                                          />
                                        </div>
                                      )}
                                    />
                                  </div>
                                  
                                  {/* Swap Colors Button for Eye Center */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const color1 = getValues('options.eye_color_gradient.color1');
                                      const color2 = getValues('options.eye_color_gradient.color2');
                                      setValue('options.eye_color_gradient.color1', color2);
                                      setValue('options.eye_color_gradient.color2', color1);
                                      setTimeout(() => {
                                        const currentFormValues = getValues();
                                        onSubmit(currentFormValues);
                                      }, 100);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 mt-2"
                                    disabled={isLoading}
                                  >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                                    </svg>
                                    <span className="text-xs font-medium">Intercambiar</span>
                                  </button>
                                  
                                  {/* Angle Control for Eye Center Gradient */}
                                  <div className="mt-2">
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                      Ángulo del Gradiente
                                    </Label>
                                    <Controller
                                      name="options.eye_color_gradient.angle"
                                      control={control}
                                      defaultValue={0}
                                      render={({ field }) => (
                                        <div className="flex gap-2 items-center">
                                          <Input
                                            type="range"
                                            min="0"
                                            max="360"
                                            step="15"
                                            value={field.value || 0}
                                            onChange={(e) => {
                                              field.onChange(Number(e.target.value));
                                              setTimeout(() => {
                                                const currentFormValues = getValues();
                                                onSubmit(currentFormValues);
                                              }, 100);
                                            }}
                                            disabled={isLoading}
                                            className="flex-1"
                                          />
                                          <div className="w-12 text-xs text-right">
                                            {field.value || 0}°
                                          </div>
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'logo':
        return (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Logo del QR
              </Label>
              
              {/* Upload Area */}
              <Controller
                name="options.logo_enabled"
                control={control}
                defaultValue={false}
                render={({ field: enableField }) => (
                  <div className="space-y-3">
                    {/* Enable Logo Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <Label htmlFor="logo-enabled" className="text-sm font-medium cursor-pointer">
                        Agregar Logo
                      </Label>
                      <Switch
                        id="logo-enabled"
                        checked={enableField.value}
                        onCheckedChange={enableField.onChange}
                      />
                    </div>

                    {/* Logo Configuration */}
                    {enableField.value && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {/* File Upload */}
                        <Controller
                          name="options.logo_data"
                          control={control}
                          render={({ field }) => (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Settings2 className="w-8 h-8 mb-2 text-slate-400" />
                                    <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">
                                      <span className="font-semibold">Click para subir</span>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      PNG, JPG, SVG (MAX. 2MB)
                                    </p>
                                  </div>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file && file.size <= 2 * 1024 * 1024) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          console.log('🖼️ [GenerationOptions] Logo loaded:', {
                                            size: file.size,
                                            type: file.type,
                                            dataLength: reader.result?.toString().length || 0
                                          });
                                          field.onChange(reader.result);
                                          // Also update logo_enabled if not already set
                                          const logoEnabledField = control._fields['options.logo_enabled'];
                                          if (logoEnabledField && !logoEnabledField._f.value) {
                                            control.setValue('options.logo_enabled', true);
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              {field.value && (
                                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <span className="text-sm text-green-600 dark:text-green-400">Logo cargado</span>
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(null)}
                                    className="text-sm text-red-600 hover:text-red-700"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        />

                        {/* Logo Size */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tamaño del Logo</Label>
                          <Controller
                            name="options.logo_size"
                            control={control}
                            defaultValue={20}
                            render={({ field }) => (
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="10"
                                  max="30"
                                  step="5"
                                  value={field.value}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12">
                                  {field.value}%
                                </span>
                              </div>
                            )}
                          />
                        </div>

                        {/* Logo Shape */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Forma del Marco</Label>
                          <Controller
                            name="options.logo_shape"
                            control={control}
                            defaultValue="square"
                            render={({ field }) => (
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { value: 'square', label: 'Cuadrado', icon: '⬜' },
                                  { value: 'circle', label: 'Círculo', icon: '⚪' },
                                  { value: 'rounded_square', label: 'Redondeado', icon: '🔲' },
                                ].map((shape) => (
                                  <button
                                    key={shape.value}
                                    type="button"
                                    onClick={() => field.onChange(shape.value)}
                                    className={cn(
                                      "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all",
                                      field.value === shape.value
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-slate-200 dark:border-slate-700"
                                    )}
                                  >
                                    <span className="text-xl mb-1">{shape.icon}</span>
                                    <span className="text-xs">{shape.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        </div>

                        {/* Logo Padding */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Espacio alrededor</Label>
                          <Controller
                            name="options.logo_padding"
                            control={control}
                            defaultValue={5}
                            render={({ field }) => (
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={field.value}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-12">
                                  {field.value}px
                                </span>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        );
      
      case 'advanced':
        return (
          <div className="animate-in fade-in-50 duration-200">
            {isQrCode ? (
              // QR Advanced Options - Effects and Frame
              <div className="space-y-4">
                {/* Visual Effects */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Efectos Visuales
                  </Label>
                  <Controller
                    name="options.effects"
                    control={control}
                    defaultValue={[]}
                    render={({ field }) => {
                      type EffectType = "shadow" | "glow" | "blur" | "noise" | "vintage";
                      const selectedEffects: EffectType[] = field.value || [];
                      const toggleEffect = (effect: EffectType) => {
                        const newEffects = selectedEffects.includes(effect)
                          ? selectedEffects.filter((e) => e !== effect)
                          : [...selectedEffects, effect];
                        field.onChange(newEffects);
                      };
                      
                      const effects: Array<{ value: EffectType; label: string; icon: string }> = [
                        { value: 'shadow', label: 'Sombra', icon: '🌑' },
                        { value: 'glow', label: 'Brillo', icon: '✨' },
                        { value: 'blur', label: 'Desenfoque', icon: '🌫️' },
                        { value: 'noise', label: 'Ruido', icon: '📺' },
                        { value: 'vintage', label: 'Vintage', icon: '📷' },
                      ];
                      
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {effects.map((effect) => (
                            <button
                              key={effect.value}
                              type="button"
                              onClick={() => toggleEffect(effect.value)}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                selectedEffects.includes(effect.value)
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                              )}
                            >
                              <span className="text-lg">{effect.icon}</span>
                              <span className="text-sm font-medium">{effect.label}</span>
                            </button>
                          ))}
                        </div>
                      );
                    }}
                  />
                </div>

                {/* Frame Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Marco Decorativo
                  </Label>
                  <Controller
                    name="options.frame_enabled"
                    control={control}
                    defaultValue={true}
                    render={({ field: enableField }) => (
                      <div className="space-y-3">
                        {/* Enable Frame Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <Label htmlFor="frame-enabled" className="text-sm font-medium cursor-pointer">
                            Agregar Marco
                          </Label>
                          <Switch
                            id="frame-enabled"
                            checked={enableField.value}
                            onCheckedChange={enableField.onChange}
                          />
                        </div>

                        {/* Frame Configuration */}
                        {enableField.value && (
                          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Frame Style */}
                            <Controller
                              name="options.frame_style"
                              control={control}
                              defaultValue="simple"
                              render={({ field }) => (
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { value: 'simple', label: 'Simple', icon: '⬜' },
                                    { value: 'rounded', label: 'Redondeado', icon: '🔲' },
                                    { value: 'bubble', label: 'Burbuja', icon: '💬' },
                                    { value: 'speech', label: 'Diálogo', icon: '🗨️' },
                                    { value: 'badge', label: 'Insignia', icon: '🏷️' },
                                  ].map((style) => (
                                    <button
                                      key={style.value}
                                      type="button"
                                      onClick={() => field.onChange(style.value)}
                                      className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg border-2 transition-all",
                                        field.value === style.value
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                          : "border-slate-200 dark:border-slate-700"
                                      )}
                                    >
                                      <span>{style.icon}</span>
                                      <span className="text-xs">{style.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            />

                            {/* Frame Text */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Texto del Marco</Label>
                              <Controller
                                name="options.frame_text"
                                control={control}
                                defaultValue="SCAN ME"
                                render={({ field }) => (
                                  <Input
                                    {...field}
                                    placeholder="Ej: SCAN ME, ESCANÉAME"
                                    className="text-sm"
                                  />
                                )}
                              />
                            </div>

                            {/* Text Position */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Posición del Texto</Label>
                              <Controller
                                name="options.frame_text_position"
                                control={control}
                                defaultValue="bottom"
                                render={({ field }) => (
                                  <div className="grid grid-cols-4 gap-1">
                                    {[
                                      { value: 'top', label: 'Arriba', icon: '⬆️' },
                                      { value: 'bottom', label: 'Abajo', icon: '⬇️' },
                                      { value: 'left', label: 'Izq', icon: '⬅️' },
                                      { value: 'right', label: 'Der', icon: '➡️' },
                                    ].map((pos) => (
                                      <button
                                        key={pos.value}
                                        type="button"
                                        onClick={() => field.onChange(pos.value)}
                                        className={cn(
                                          "p-2 rounded text-xs transition-all border",
                                          field.value === pos.value
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-slate-200 dark:border-slate-700"
                                        )}
                                      >
                                        {pos.icon}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Fixed Size Control - QR v3 Optimization */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tamaño Fijo del QR
                  </Label>
                  <Controller
                    name="options.fixed_size"
                    control={control}
                    defaultValue="auto"
                    render={({ field }) => (
                      <div className="space-y-3">
                        {/* Fixed Size Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex-1">
                            <Label htmlFor="fixed-size-enabled" className="text-sm font-medium cursor-pointer">
                              Usar Tamaño Fijo
                            </Label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Garantiza que todos los QR tengan el mismo tamaño exacto
                            </p>
                          </div>
                          <Switch
                            id="fixed-size-enabled"
                            checked={field.value !== 'auto'}
                            onCheckedChange={(checked) => {
                              field.onChange(checked ? 'medium' : 'auto');
                              setTimeout(() => {
                                const currentFormValues = getValues();
                                onSubmit(currentFormValues);
                              }, 100);
                            }}
                          />
                        </div>

                        {/* Size Selection */}
                        {field.value !== 'auto' && (
                          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                            {[
                              { value: 'small', label: 'Pequeño', desc: 'v1-5', icon: '🔸' },
                              { value: 'medium', label: 'Mediano', desc: 'v6-10', icon: '🔶' },
                              { value: 'large', label: 'Grande', desc: 'v11-15', icon: '🔷' },
                              { value: 'extra_large', label: 'Extra Grande', desc: 'v16-25', icon: '🔵' },
                            ].map((size) => (
                              <button
                                key={size.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(size.value);
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                                  field.value === size.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                )}
                              >
                                <span className="text-2xl mb-1">{size.icon}</span>
                                <span className="text-sm font-medium">{size.label}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{size.desc}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            <strong>Nota:</strong> El tamaño fijo garantiza uniformidad en lotes. Si los datos no caben, se reducirá automáticamente el nivel de corrección de errores.
                          </p>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            ) : (
              // Non-QR Advanced Options
              <AdvancedBarcodeOptions
                control={control}
                errors={errors}
                watch={watch}
                reset={reset}
                isLoading={isLoading}
                selectedType={selectedType}
              />
            )}
          </div>
        );
      
      default:
        return null;
    }
  }, [activeTab, control, errors, watch, isLoading, selectedType, reset, isQrCode, handleSwapColors, getValues, onSubmit, setValue, presetColors, useSeparatedEyeStyles]);

  return (
    <div className="space-y-3">
      {/* Tabs Navigation - Clean Pills Style */}
      <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-md backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-sm p-1 rounded-full flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-full",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabContent}
      </div>
    </div>
  );
}

// Función de comparación personalizada para React.memo
const arePropsEqual = (prevProps: GenerationOptionsProps, nextProps: GenerationOptionsProps) => {
  // Always re-render when these props change
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.selectedType !== nextProps.selectedType) return false;
  
  // For form changes, we need to allow re-renders
  // React Hook Form's watch will trigger re-renders internally
  // So we should not block them here
  return false; // Always allow re-render for now to fix the toggle issue
};

// Exportar el componente memoizado con comparación personalizada
export default React.memo(GenerationOptions, arePropsEqual);