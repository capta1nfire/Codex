'use client';

import React, { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GenerateFormData } from '@/schemas/generate.schema';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { 
  Palette, 
  Settings2, 
  RotateCcw, 
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowLeftRight,
  RefreshCw
} from 'lucide-react';

// Importar dinámicamente AdvancedBarcodeOptions
const AdvancedBarcodeOptions = dynamic(() => import('./AdvancedBarcodeOptions'), {
  // Opcional: componente de carga
  // loading: () => <p className="text-sm text-gray-500">Cargando opciones avanzadas...</p>,
  ssr: false, // Generalmente bueno para componentes del lado del cliente con mucha interactividad
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
    // Añadir defaults para opciones avanzadas si es necesario (o dejar undefined)
    qr_version: 'Auto',
    qr_mask_pattern: 'Auto',
    code128_codeset: 'Auto',
    // ...otros defaults...
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
  expandedSection: string;
  setExpandedSection: (section: string) => void;
}

export default function GenerationOptions({
  control,
  errors,
  watch,
  isLoading,
  selectedType,
  reset,
  setValue,
  getValues,
  onSubmit,
  expandedSection,
  setExpandedSection,
}: GenerationOptionsProps) {
  
  // Calculate conditional visibility
  const is1DBarcode = selectedType
    ? !['qrcode', 'pdf417', 'datamatrix', 'aztec'].includes(selectedType)
    : false;
  const isHeightRelevant = selectedType
    ? !['qrcode', 'datamatrix', 'aztec'].includes(selectedType)
    : false;
  const isQrCode = selectedType === 'qrcode';

  const handleResetOptions = () => {
    reset(
      { ...watch(), options: defaultFormValues.options },
      { keepDefaultValues: false, keepValues: false }
    );
    toast.success('Opciones restablecidas', {
      icon: '✨',
      style: {
        background: '#f0f9ff',
        color: '#0369a1',
        border: '1px solid #0284c7',
      },
    });
  };

  const SectionCard = ({ 
    id, 
    title, 
    subtitle, 
    icon: Icon, 
    children, 
    isOpen, 
    badgeText 
  }: {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    children: React.ReactNode;
    isOpen: boolean;
    badgeText?: string;
  }) => (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isOpen ? "border-blue-200 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20" : "hover:border-slate-300 dark:hover:border-slate-600"
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer"
        onClick={() => setExpandedSection(isOpen ? '' : id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors duration-200",
              isOpen 
                ? "bg-blue-100 dark:bg-blue-900/30" 
                : "bg-slate-100 dark:bg-slate-800"
            )}>
              <Icon className={cn(
                "h-4 w-4 transition-colors duration-200",
                isOpen 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-slate-600 dark:text-slate-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{title}</CardTitle>
                {badgeText && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {badgeText}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0 pb-2 px-4 animate-in slide-in-from-top-2 duration-200">
          {children}
        </CardContent>
      )}
    </Card>
  );

  const ColorInput = ({ 
    name, 
    label, 
    defaultValue 
  }: { 
    name: 'options.fgcolor' | 'options.bgcolor' | 'options.gradient_color1' | 'options.gradient_color2'; 
    label: string; 
    defaultValue: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <div className="relative">
            <Input
              type="text"
              value={field.value || defaultValue}
              disabled={isLoading}
              placeholder={defaultValue}
              onChange={(e) => {
                field.onChange(e.target.value);
                // ✅ CORREGIDO: Eliminada auto-regeneración que causaba spam de peticiones
                // Solo actualizar el valor, no regenerar automáticamente
              }}
              className={cn(
                "h-9 pl-12 transition-all duration-200 focus:scale-[1.01]",
                errors.options?.[name.split('.')[1] as keyof typeof errors.options] 
                  ? 'border-destructive' 
                  : 'focus:border-blue-500'
              )}
            />
            <div className="absolute left-1 top-1/2 -translate-y-1/2">
              <Input
                type="color"
                value={field.value || defaultValue}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  // ✅ CORREGIDO: Eliminada auto-regeneración que causaba spam de peticiones
                  // Solo actualizar el valor, no regenerar automáticamente
                }}
                className="w-7 h-7 p-0 border-2 border-slate-200 dark:border-slate-600 rounded-md cursor-pointer transition-all duration-200 hover:scale-110 hover:border-blue-400"
                disabled={isLoading}
                aria-label={`Seleccionar ${label.toLowerCase()}`}
              />
            </div>
          </div>
        )}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Appearance & Colors Section - Merged */}
      <SectionCard
        id="appearance"
        title="Apariencia y Colores"
        subtitle="Configuración visual y efectos de color"
        icon={Palette}
        isOpen={expandedSection === 'appearance'}
        badgeText="Esencial"
      >
        <div className="space-y-4">
          {/* Scale Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Escala</Label>
              <Badge variant="outline" className="text-xs">
                {watch('options.scale')}x
              </Badge>
            </div>
            <Controller
              name="options.scale"
              control={control}
              defaultValue={4}
              render={({ field }) => (
                <div className="space-y-2">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value ?? 4]}
                    onValueChange={(value) => field.onChange(value[0])}
                    disabled={isLoading}
                    className="transition-all duration-200 hover:scale-[1.01]"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Pequeño (1x)</span>
                    <span>Grande (10x)</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Color Mode Selection - New */}
          {isQrCode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-950/30 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <div>
                  <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Modo de Color</Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Elegir entre colores sólidos o efectos de gradiente
                  </p>
                </div>
                <Controller
                  name="options.gradient_enabled"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-600">
                      <span className={cn(
                        "text-xs font-semibold transition-colors px-2 py-1 rounded",
                        !field.value 
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" 
                          : "text-slate-500 dark:text-slate-400"
                      )}>
                        Sólido
                      </span>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // ✅ CORREGIDO: Eliminada auto-regeneración que causaba spam de peticiones
                          // Solo actualizar el valor, no regenerar automáticamente
                        }}
                        disabled={isLoading}
                      />
                      <span className={cn(
                        "text-xs font-semibold transition-colors px-2 py-1 rounded",
                        field.value 
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" 
                          : "text-slate-500 dark:text-slate-400"
                      )}>
                        Gradiente
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* Conditional Content Based on Mode */}
              {!watch('options.gradient_enabled') ? (
                // Solid Colors Mode
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
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
                </div>
              ) : (
                // Gradient Mode
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Gradient Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Gradiente</Label>
                    <Controller
                      name="options.gradient_type"
                      control={control}
                      defaultValue="radial"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                          <SelectTrigger className="h-9 transition-all duration-200 focus:scale-[1.01]">
                            <SelectValue placeholder="Selecciona tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Lineal</SelectItem>
                            <SelectItem value="radial">Radial (desde el centro)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Gradient Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput 
                      name="options.gradient_color1" 
                      label="Color Central" 
                      defaultValue="#2563EB" 
                    />
                    <ColorInput 
                      name="options.gradient_color2" 
                      label="Color Exterior" 
                      defaultValue="#000000" 
                    />
                  </div>

                  {/* Swap Colors Button */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const color1 = watch('options.gradient_color1') || '#2563EB';
                        const color2 = watch('options.gradient_color2') || '#000000';
                        // Intercambiar los colores
                        setValue('options.gradient_color1', color2, { shouldValidate: true });
                        setValue('options.gradient_color2', color1, { shouldValidate: true });
                        
                        // ✅ CORREGIDO: Eliminada auto-regeneración que causaba spam de peticiones
                        // Solo actualizar los valores, no regenerar automáticamente
                      }}
                      disabled={isLoading}
                      className="h-8 px-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 hover:scale-105 group"
                      title="Intercambiar colores del gradiente"
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1.5 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-xs font-medium">Invertir Colores</span>
                    </Button>
                  </div>

                  {/* Gradient Direction - Solo para linear */}
                  {watch('options.gradient_type') === 'linear' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dirección</Label>
                      <Controller
                        name="options.gradient_direction"
                        control={control}
                        defaultValue="top-bottom"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                            <SelectTrigger className="h-9 transition-all duration-200 focus:scale-[1.01]">
                              <SelectValue placeholder="Selecciona dirección..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top-bottom">↓ Vertical (arriba-abajo)</SelectItem>
                              <SelectItem value="left-right">→ Horizontal (izquierda-derecha)</SelectItem>
                              <SelectItem value="diagonal">↘ Diagonal</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  {/* Gradient Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Vista Previa</Label>
                    <div className="h-12 rounded-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div 
                        className="w-full h-full"
                        style={{
                          background: watch('options.gradient_type') === 'radial' 
                            ? `radial-gradient(circle, ${watch('options.gradient_color1') || '#2563EB'} 0%, ${watch('options.gradient_color2') || '#000000'} 100%)`
                            : watch('options.gradient_direction') === 'left-right'
                            ? `linear-gradient(to right, ${watch('options.gradient_color1') || '#2563EB'} 0%, ${watch('options.gradient_color2') || '#000000'} 100%)`
                            : watch('options.gradient_direction') === 'diagonal'
                            ? `linear-gradient(135deg, ${watch('options.gradient_color1') || '#2563EB'} 0%, ${watch('options.gradient_color2') || '#000000'} 100%)`
                            : `linear-gradient(to bottom, ${watch('options.gradient_color1') || '#2563EB'} 0%, ${watch('options.gradient_color2') || '#000000'} 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Gradient Borders Control */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                    <div>
                      <Label className="text-sm font-medium text-slate-800 dark:text-slate-200">Bordes de Separación</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Mostrar bordes sutiles entre elementos del código
                      </p>
                    </div>
                    <Controller
                      name="options.gradient_borders"
                      control={control}
                      defaultValue={false}
                      render={({ field }) => (
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Solid Colors for Non-QR Codes */}
          {!isQrCode && (
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
          )}
        </div>
      </SectionCard>

      {/* Display Section */}
      <SectionCard
        id="display"
        title="Visualización"
        subtitle="Opciones de formato y presentación"
        icon={Eye}
        isOpen={expandedSection === 'display'}
        badgeText={`${selectedType?.toUpperCase()}`}
      >
        <div className="space-y-4">
          {/* Height (if relevant) */}
          {isHeightRelevant && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Altura</Label>
                <Badge variant="outline" className="text-xs">
                  {watch('options.height')}px
                </Badge>
              </div>
              <Controller
                name="options.height"
                control={control}
                defaultValue={100}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Slider
                      min={10}
                      max={500}
                      step={10}
                      value={[field.value ?? 100]}
                      onValueChange={(value) => field.onChange(value[0])}
                      disabled={isLoading}
                      className="transition-all duration-200 hover:scale-[1.01]"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Bajo (10px)</span>
                      <span>Alto (500px)</span>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {/* Include Text (if 1D) */}
          {is1DBarcode && (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Mostrar Texto</Label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Incluir texto legible debajo del código
                </p>
              </div>
              <Controller
                name="options.includetext"
                control={control}
                defaultValue={true}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </div>
          )}

          {/* ECL Level (if QR) */}
          {isQrCode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nivel de Corrección de Errores</Label>
              <Controller
                name="options.ecl"
                control={control}
                defaultValue="M"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <SelectTrigger className="h-9 transition-all duration-200 focus:scale-[1.01]">
                      <SelectValue placeholder="Selecciona nivel..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">
                        <div className="flex items-center justify-between w-full">
                          <span>L - Bajo</span>
                          <Badge variant="secondary" className="ml-2 text-xs">~7%</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="M">
                        <div className="flex items-center justify-between w-full">
                          <span>M - Medio</span>
                          <Badge variant="secondary" className="ml-2 text-xs">~15%</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="Q">
                        <div className="flex items-center justify-between w-full">
                          <span>Q - Alto</span>
                          <Badge variant="secondary" className="ml-2 text-xs">~25%</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="H">
                        <div className="flex items-center justify-between w-full">
                          <span>H - Máximo</span>
                          <Badge variant="secondary" className="ml-2 text-xs">~30%</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Mayor corrección permite recuperar el código aunque esté parcialmente dañado
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Advanced Section */}
      <SectionCard
        id="advanced"
        title="Opciones Avanzadas"
        subtitle="Configuración específica del formato"
        icon={Settings2}
        isOpen={expandedSection === 'advanced'}
        badgeText="Experto"
      >
        <AdvancedBarcodeOptions
          control={control}
          errors={errors}
          watch={watch}
          isLoading={isLoading}
          selectedType={selectedType}
          reset={reset}
        />
      </SectionCard>

      {/* Reset Button */}
      <div className="pt-2 space-y-2">
        {/* ✅ OPTIMIZADO: Botón de regeneración manual que solo ejecuta cuando es necesario */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => {
            const currentValues = getValues();
            console.log('[Regenerar Manual] Ejecutando onSubmit con valores actuales:', currentValues);
            onSubmit(currentValues);
          }}
          disabled={isLoading || !watch('data')}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-[1.01]"
        >
          <RefreshCw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
          {isLoading ? 'Generando...' : 'Regenerar Código'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetOptions}
          disabled={isLoading}
          className="w-full h-9 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-[1.01]"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Restablecer a Valores por Defecto
        </Button>
      </div>
    </div>
  );
}
