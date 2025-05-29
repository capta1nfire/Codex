'use client';

import React, { useState } from 'react';
import { Controller, Control, FieldErrors, UseFormWatch, UseFormReset } from 'react-hook-form';
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
  Eye
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
}

export default function GenerationOptions({
  control,
  errors,
  watch,
  isLoading,
  selectedType,
  reset,
}: GenerationOptionsProps) {
  const [expandedSection, setExpandedSection] = useState<string>('appearance');
  
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
        className="pb-3 cursor-pointer"
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
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
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
    name: 'options.fgcolor' | 'options.bgcolor'; 
    label: string; 
    defaultValue: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                {...field}
                disabled={isLoading}
                placeholder={defaultValue}
                className={cn(
                  "h-9 pr-12 transition-all duration-200 focus:scale-[1.01]",
                  errors.options?.[name.split('.')[1] as keyof typeof errors.options] 
                    ? 'border-destructive' 
                    : 'focus:border-blue-500'
                )}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <Input
                  type="color"
                  value={field.value || defaultValue}
                  onChange={field.onChange}
                  className="w-7 h-7 p-0 border-0 rounded cursor-pointer"
                  disabled={isLoading}
                  aria-label={`Seleccionar ${label.toLowerCase()}`}
                />
              </div>
            </div>
            <div 
              className="w-9 h-9 rounded border-2 border-slate-200 dark:border-slate-700"
              style={{ backgroundColor: field.value || defaultValue }}
            />
          </div>
        )}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Appearance Section */}
      <SectionCard
        id="appearance"
        title="Apariencia"
        subtitle="Colores y escala visual"
        icon={Palette}
        isOpen={expandedSection === 'appearance'}
        badgeText="Esencial"
      >
        <div className="space-y-6">
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

          {/* Color Inputs */}
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
        <div className="space-y-6">
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
      <div className="pt-2">
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
