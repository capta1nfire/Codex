'use client';

import React, { useState, useEffect } from 'react';
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
    gradient_borders: true,
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
  
  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState<string>('color');
  
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
        onClick={() => setActiveTab(id)}
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
    <div className="space-y-1">
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</Label>
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
              onChange={(e) => field.onChange(e.target.value)}
              className={cn(
                "h-8 pl-10 text-sm",
                errors.options?.[name.split('.')[1] as keyof typeof errors.options] 
                  ? 'border-destructive' 
                  : 'focus:border-blue-500'
              )}
            />
            <div className="absolute left-1 top-1/2 -translate-y-1/2">
              <Input
                type="color"
                value={field.value || defaultValue}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-6 h-6 p-0 border-2 border-slate-200 dark:border-slate-600 rounded cursor-pointer"
                disabled={isLoading}
                aria-label={`Seleccionar ${label.toLowerCase()}`}
              />
            </div>
          </div>
        )}
      />
    </div>
  );

  // Definir los tabs
  const tabs = [
    {
      id: 'color',
      name: 'COLOR',
      icon: Palette,
    },
    {
      id: 'design',
      name: 'DESIGN',
      icon: Eye,
    },
    {
      id: 'advanced',
      name: 'ADVANCED',
      icon: Settings2,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      <div className="min-h-[300px]">
        {/* COLOR Tab */}
        {activeTab === 'color' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Color Mode Selection - Simplified */}
            {isQrCode && (
              <div className="space-y-3">
                {/* Simple Color Mode Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Modo de Color</Label>
                  <Controller
                    name="options.gradient_enabled"
                    control={control}
                    defaultValue={true}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs transition-colors",
                          !field.value ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500"
                        )}>
                          Sólido
                        </span>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                        <span className={cn(
                          "text-xs transition-colors",
                          field.value ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500"
                        )}>
                          Gradiente
                        </span>
                      </div>
                    )}
                  />
                </div>

                {/* Color Controls */}
                {!watch('options.gradient_enabled') ? (
                  // Solid Colors Mode
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
                ) : (
                  // Gradient Mode - Simplified
                  <div className="space-y-3">
                    {/* Gradient Type */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tipo</Label>
                      <Controller
                        name="options.gradient_type"
                        control={control}
                        defaultValue="radial"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="linear">Lineal</SelectItem>
                              <SelectItem value="radial">Radial</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {/* Gradient Colors with Swap */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Colores</Label>
                        <button
                          type="button"
                          onClick={() => {
                            const color1 = watch('options.gradient_color1') || '#2563EB';
                            const color2 = watch('options.gradient_color2') || '#000000';
                            setValue('options.gradient_color1', color2, { shouldValidate: true });
                            setValue('options.gradient_color2', color1, { shouldValidate: true });
                          }}
                          disabled={isLoading}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          title="Intercambiar colores"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          Intercambiar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ColorInput 
                          name="options.gradient_color1" 
                          label="Primario" 
                          defaultValue="#2563EB" 
                        />
                        <ColorInput 
                          name="options.gradient_color2" 
                          label="Secundario" 
                          defaultValue="#000000" 
                        />
                      </div>
                    </div>

                    {/* Gradient Direction - Only for linear */}
                    {watch('options.gradient_type') === 'linear' && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Dirección</Label>
                        <Controller
                          name="options.gradient_direction"
                          control={control}
                          defaultValue="top-bottom"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                              <SelectTrigger className="h-9">
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

                    {/* Gradient Borders - Simplified */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Bordes</Label>
                      <Controller
                        name="options.gradient_borders"
                        control={control}
                        defaultValue={true}
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
        )}

        {/* DESIGN Tab */}
        {activeTab === 'design' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Height (if relevant) */}
            {isHeightRelevant && (
              <div>
                <div className="flex items-center justify-between mb-2">
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
                    <div className="space-y-1">
                      <Slider
                        min={10}
                        max={500}
                        step={10}
                        value={[field.value ?? 100]}
                        onValueChange={(value) => field.onChange(value[0])}
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>10px</span>
                        <span>500px</span>
                      </div>
                    </div>
                  )}
                />
              </div>
            )}

            {/* Include Text (if 1D) */}
            {is1DBarcode && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Mostrar Texto</Label>
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
              <div>
                <Label className="text-sm font-medium mb-2 block">Corrección de Errores</Label>
                <Controller
                  name="options.ecl"
                  control={control}
                  defaultValue="M"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">L - Bajo (~7%)</SelectItem>
                        <SelectItem value="M">M - Medio (~15%)</SelectItem>
                        <SelectItem value="Q">Q - Alto (~25%)</SelectItem>
                        <SelectItem value="H">H - Máximo (~30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* ADVANCED Tab */}
        {activeTab === 'advanced' && (
          <div className="animate-in fade-in-50 duration-200">
            <AdvancedBarcodeOptions
              control={control}
              errors={errors}
              watch={watch}
              isLoading={isLoading}
              selectedType={selectedType}
              reset={reset}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        {/* Primary Action - Regenerate */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => {
            const currentValues = getValues();
            onSubmit(currentValues);
          }}
          disabled={isLoading || !watch('data')}
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
          {isLoading ? 'Generando...' : 'Regenerar'}
        </Button>
        
        {/* Secondary Action - Reset */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetOptions}
          disabled={isLoading}
          className="w-full h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
