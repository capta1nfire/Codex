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
import { Badge } from '@/components/ui/badge';
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

// Valores por defecto
const defaultFormValues: Partial<GenerateFormData> = {
  options: {
    scale: 4,
    fgcolor: '#000000',
    bgcolor: '#FFFFFF',
    height: 100,
    includetext: true,
    ecl: 'M',
    // ✨ CODEX Hero Gradient - Azul corporativo con negro, radial desde centro
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_color1: '#2563EB', // CODEX Corporate Blue en el centro
    gradient_color2: '#000000', // Negro en los costados para máximo contraste
    gradient_direction: 'top-bottom',
    gradient_borders: true,
    // Añadir defaults para opciones avanzadas si es necesario (o dejar undefined)
    qr_version: 'Auto',
    qr_mask_pattern: 'Auto',
    code128_codeset: 'Auto',
  },
};

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
            <Input
              type="color"
              value={field.value || defaultValue}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
              disabled={isLoading}
              aria-label={`Seleccionar ${label.toLowerCase()}`}
            />
            <Input
              type="text"
              value={field.value || defaultValue}
              disabled={isLoading}
              placeholder={defaultValue}
              onChange={(e) => field.onChange(e.target.value)}
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
                            <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
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
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Primera columna, segunda fila - Color 1 */}
                      <ColorInput 
                        name="options.gradient_color1" 
                        label="Color 1" 
                        defaultValue="#2563EB" 
                      />

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
                                  <Input
                                    type="color"
                                    value={field.value || "#000000"}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    className="w-8 h-8 p-0 border border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                                    disabled={isLoading}
                                  />
                                  <Input
                                    type="text"
                                    value={field.value || "#000000"}
                                    disabled={isLoading}
                                    placeholder="#000000"
                                    onChange={(e) => field.onChange(e.target.value)}
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
                            <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
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
            <div className="text-center py-8">
              <Settings2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Formas personalizadas próximamente</p>
            </div>
          </div>
        );
      
      case 'logo':
        return (
          <div className="animate-in fade-in-50 duration-200 space-y-4">
            <div className="text-center py-8">
              <Settings2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Agregar logo próximamente</p>
            </div>
          </div>
        );
      
      case 'advanced':
        return (
          <div className="animate-in fade-in-50 duration-200">
            <AdvancedBarcodeOptions
              control={control}
              errors={errors}
              watch={watch}
              isLoading={isLoading}
              selectedType={selectedType}
            />
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