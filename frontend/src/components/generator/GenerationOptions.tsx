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

// Importar dinámicamente AdvancedBarcodeOptions
const AdvancedBarcodeOptions = dynamic(() => import('./AdvancedBarcodeOptions'), {
  ssr: false,
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
  const [activeTab, setActiveTab] = useState<string>('color');
  
  // Memoizar el cambio de tab para evitar re-renders
  const handleTabChange = useCallback((tabId: string) => {
    // Solo actualizar el estado local, no disparar cambios en el formulario
    setActiveTab(tabId);
  }, []);
  
  // Calculate conditional visibility
  const isQrCode = selectedType === 'qrcode';


  // ColorInput como componente interno memoizado
  const ColorInput = React.memo(({ 
    name, 
    label, 
    defaultValue 
  }: { 
    name: 'options.fgcolor' | 'options.bgcolor' | 'options.gradient_color1' | 'options.gradient_color2'; 
    label: string; 
    defaultValue: string;
  }) => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</Label>
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
              className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
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

  // Definir los tabs - memoizado para evitar recreación
  const tabs = useMemo(() => [
    {
      id: 'color',
      name: 'COLOR',
      icon: Palette,
    },
    {
      id: 'shapes',
      name: 'SHAPES',
      icon: Settings2,
    },
    {
      id: 'logo',
      name: 'LOGO',
      icon: Settings2,
    },
    {
      id: 'advanced',
      name: 'ADVANCED',
      icon: Settings2,
    },
  ], []);

  // Memoizar el contenido de cada tab para evitar re-renders
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'color':
        return (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            {/* QR Code Color Options */}
            {isQrCode && (
              <div className="space-y-4">
                {/* Color Mode Toggle - Centered with better styling */}
                <div className="flex justify-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <Controller
                    name="options.gradient_enabled"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                            !field.value 
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" 
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          )}
                        >
                          Sólido
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                            field.value 
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" 
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                          )}
                        >
                          Gradiente
                        </button>
                      </div>
                    )}
                  />
                </div>

                {/* Color Controls */}
                {!watch('options.gradient_enabled') ? (
                  // Solid Colors Mode - 2 columnas
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput 
                      name="options.fgcolor" 
                      label="Color Principal" 
                      defaultValue="#000000" 
                    />
                    <ColorInput 
                      name="options.bgcolor" 
                      label="Color Fondo" 
                      defaultValue="#FFFFFF" 
                    />
                  </div>
                ) : (
                  // Gradient Mode - Organizado en una fila de 4 columnas
                  <div className="space-y-4">
                    {/* Grid de 2x2 para opciones de color */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Primera columna, primera fila - Tipo de gradiente */}
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Tipo de gradiente</Label>
                        <Controller
                          name="options.gradient_type"
                          control={control}
                          defaultValue="radial"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Trigger form re-generation
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }} 
                              disabled={isLoading}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="radial">
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                                    Radial
                                  </span>
                                </SelectItem>
                                <SelectItem value="linear">
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                                    Lineal
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Segunda columna, primera fila - Aplicar bordes */}
                      <div className="flex items-end">
                        <div className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Aplicar bordes al gradiente</Label>
                            <Controller
                              name="options.gradient_borders"
                              control={control}
                              defaultValue={true}
                              render={({ field }) => (
                                  <Switch
                                    checked={field.value ?? true}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      // Trigger form re-generation
                                      setTimeout(() => {
                                        const currentFormValues = getValues();
                                        onSubmit(currentFormValues);
                                      }, 100);
                                    }}
                                    disabled={isLoading}
                                    className="data-[state=checked]:bg-blue-600"
                                  />
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Primera columna, segunda fila - Color 1 */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Color 1</Label>
                        <Controller
                          name="options.gradient_color1"
                          control={control}
                          defaultValue="#2563EB"
                          render={({ field }) => (
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={field.value || "#2563EB"}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Trigger form re-generation
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
                                value={field.value || "#2563EB"}
                                disabled={isLoading}
                                placeholder="#2563EB"
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  // Trigger form re-generation
                                  setTimeout(() => {
                                    const currentFormValues = getValues();
                                    onSubmit(currentFormValues);
                                  }, 100);
                                }}
                                className="h-8 text-sm flex-1"
                              />
                            </div>
                          )}
                        />
                      </div>

                      {/* Segunda columna, segunda fila - Color 2 con botón intercambiar */}
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Color 2</Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Controller
                              name="options.gradient_color2"
                              control={control}
                              defaultValue="#000000"
                              render={({ field }) => (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={field.value || "#000000"}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      // Trigger form re-generation
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
                                    value={field.value || "#000000"}
                                    disabled={isLoading}
                                    placeholder="#000000"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      // Trigger form re-generation
                                      setTimeout(() => {
                                        const currentFormValues = getValues();
                                        onSubmit(currentFormValues);
                                      }, 100);
                                    }}
                                    className="h-8 text-sm flex-1"
                                  />
                                </div>
                              )}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSwapColors}
                            disabled={isLoading}
                            className="w-8 h-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-center transition-all border border-blue-200 dark:border-blue-800"
                            title="Intercambiar colores"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dirección del gradiente (solo para linear) */}
                    {watch('options.gradient_type') === 'linear' && (
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Dirección del gradiente</Label>
                        <Controller
                          name="options.gradient_direction"
                          control={control}
                          defaultValue="top-bottom"
                          render={({ field }) => (
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Trigger form re-generation
                                setTimeout(() => {
                                  const currentFormValues = getValues();
                                  onSubmit(currentFormValues);
                                }, 100);
                              }} 
                              disabled={isLoading}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top-bottom">↓ Vertical</SelectItem>
                                <SelectItem value="left-right">→ Horizontal</SelectItem>
                                <SelectItem value="diagonal">↘ Diagonal</SelectItem>
                              </SelectContent>
                            </Select>
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
                <ColorInput 
                  name="options.fgcolor" 
                  label="Color Principal" 
                  defaultValue="#000000" 
                />
                <ColorInput 
                  name="options.bgcolor" 
                  label="Color Fondo" 
                  defaultValue="#FFFFFF" 
                />
              </div>
            )}
          </div>
        );
      
      case 'shapes':
        return (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            {/* Eye Shapes Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Forma de Ojos (Esquinas)
              </Label>
              <Controller
                name="options.eye_shape"
                control={control}
                defaultValue="square"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'square', label: 'Cuadrado', icon: '◼' },
                      { value: 'rounded_square', label: 'Redondeado', icon: '▢' },
                      { value: 'circle', label: 'Círculo', icon: '●' },
                      { value: 'dot', label: 'Punto', icon: '•' },
                      { value: 'leaf', label: 'Hoja', icon: '🍃' },
                      { value: 'bars-horizontal', label: 'Barras Horiz.', icon: '☰' },
                      { value: 'bars-vertical', label: 'Barras Vert.', icon: '☷' },
                      { value: 'star', label: 'Estrella', icon: '⭐' },
                      { value: 'diamond', label: 'Diamante', icon: '◆' },
                      { value: 'cross', label: 'Cruz', icon: '➕' },
                      { value: 'hexagon', label: 'Hexágono', icon: '⬢' },
                      { value: 'heart', label: 'Corazón', icon: '❤️' },
                      { value: 'shield', label: 'Escudo', icon: '🛡️' },
                      { value: 'crystal', label: 'Cristal', icon: '💎' },
                      { value: 'flower', label: 'Flor', icon: '🌸' },
                      { value: 'arrow', label: 'Flecha', icon: '⬆️' },
                      { value: 'custom', label: 'Personalizado', icon: '✨' },
                    ].map((shape) => (
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
            </div>

            {/* Data Pattern Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Patrón de Datos
              </Label>
              <Controller
                name="options.data_pattern"
                control={control}
                defaultValue="square"
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'square', label: 'Cuadrado', preview: '■' },
                      { value: 'dots', label: 'Puntos', preview: '●' },
                      { value: 'rounded', label: 'Redondeado', preview: '▢' },
                      { value: 'vertical', label: 'Vertical', preview: '|||' },
                      { value: 'horizontal', label: 'Horizontal', preview: '===' },
                      { value: 'diamond', label: 'Diamante', preview: '◆' },
                      { value: 'circular', label: 'Circular', preview: '○' },
                      { value: 'star', label: 'Estrella', preview: '★' },
                      { value: 'cross', label: 'Cruz', preview: '➕' },
                      { value: 'random', label: 'Aleatorio', preview: '?' },
                      { value: 'wave', label: 'Onda', preview: '∿' },
                      { value: 'mosaic', label: 'Mosaico', preview: '▦' },
                    ].map((pattern) => (
                      <button
                        key={pattern.value}
                        type="button"
                        onClick={() => field.onChange(pattern.value)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                          field.value === pattern.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <span className="text-2xl mb-1 font-mono">{pattern.preview}</span>
                        <span className="text-xs font-medium">{pattern.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
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
                                          field.onChange(reader.result);
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
                    defaultValue={false}
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
  }, [activeTab, control, errors, watch, isLoading, selectedType, reset, isQrCode, handleSwapColors]);

  return (
    <div className="space-y-3">
      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 flex-1 justify-center",
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {tabContent}
      </div>
    </div>
  );
}

// Función de comparación personalizada para React.memo
const arePropsEqual = (prevProps: GenerationOptionsProps, nextProps: GenerationOptionsProps) => {
  // Comparar solo las props que realmente deberían causar un re-render
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.selectedType === nextProps.selectedType
    // No comparar funciones ni objetos complejos que cambian frecuentemente
    // Las funciones watch, setValue, etc. son estables gracias a react-hook-form
  );
};

// Exportar el componente memoizado con comparación personalizada
export default React.memo(GenerationOptions, arePropsEqual);