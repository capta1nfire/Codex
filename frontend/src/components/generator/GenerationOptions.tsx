'use client';

import React from 'react';
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
import { Disclosure, Tab } from '@headlessui/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GenerateFormData } from '@/schemas/generate.schema';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Importar dinámicamente AdvancedBarcodeOptions
const AdvancedBarcodeOptions = dynamic(() => import('./AdvancedBarcodeOptions'), {
  // Opcional: componente de carga
  // loading: () => <p className="text-sm text-gray-500">Cargando opciones avanzadas...</p>,
  ssr: false, // Generalmente bueno para componentes del lado del cliente con mucha interactividad
});

// Copiar/Importar los valores por defecto (o pasar como prop)
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
  // Calculate conditional visibility based on selectedType
  const is1DBarcode = selectedType
    ? !['qrcode', 'pdf417', 'datamatrix', 'aztec'].includes(selectedType)
    : false;
  const isHeightRelevant = selectedType
    ? !['qrcode', 'datamatrix', 'aztec'].includes(selectedType)
    : false;
  const isQrCode = selectedType === 'qrcode';

  // Define content for different sections
  const appearanceOptions = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
      {/* Scale */}
      <div>
        <Label htmlFor="scale-slider">Escala ({watch('options.scale')})</Label>
        <Controller
          name="options.scale"
          control={control}
          defaultValue={4}
          render={({ field }) => (
            <Slider
              id="scale-slider"
              min={1}
              max={10}
              step={1}
              value={[field.value ?? 4]}
              onValueChange={(value) => field.onChange(value[0])}
              disabled={isLoading}
              className="mt-2"
            />
          )}
        />
        {errors.options?.scale && (
          <p className="mt-1 text-xs text-red-600">{errors.options.scale.message}</p>
        )}
      </div>
      {/* Colors */}
      <div>
        <Label htmlFor="fgcolor-input">Color Frente</Label>
        <Controller
          name="options.fgcolor"
          control={control}
          defaultValue="#000000"
          render={({ field }) => (
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="fgcolor-input"
                type="text"
                {...field}
                disabled={isLoading}
                placeholder="#000000"
                className={`flex-grow ${errors.options?.fgcolor ? 'border-red-500' : ''}`}
              />
              <Input
                type="color"
                value={field.value || '#000000'}
                onChange={field.onChange}
                className="w-10 h-10 p-0 border-none cursor-pointer"
                disabled={isLoading}
                aria-label="Seleccionar color de frente"
              />
            </div>
          )}
        />
        {errors.options?.fgcolor && (
          <p className="mt-1 text-xs text-red-600">{errors.options.fgcolor.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="bgcolor-input">Color Fondo</Label>
        <Controller
          name="options.bgcolor"
          control={control}
          defaultValue="#FFFFFF"
          render={({ field }) => (
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="bgcolor-input"
                type="text"
                {...field}
                disabled={isLoading}
                placeholder="#FFFFFF"
                className={`flex-grow ${errors.options?.bgcolor ? 'border-red-500' : ''}`}
              />
              <Input
                type="color"
                value={field.value || '#FFFFFF'}
                onChange={field.onChange}
                className="w-10 h-10 p-0 border-none cursor-pointer"
                disabled={isLoading}
                aria-label="Seleccionar color de fondo"
              />
            </div>
          )}
        />
        {errors.options?.bgcolor && (
          <p className="mt-1 text-xs text-red-600">{errors.options.bgcolor.message}</p>
        )}
      </div>
    </div>
  );

  const displayOptions = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
      {/* Height (if relevant) */}
      {isHeightRelevant && (
        <div>
          <Label htmlFor="height-slider">Altura ({watch('options.height')}px)</Label>
          <Controller
            name="options.height"
            control={control}
            defaultValue={100}
            render={({ field }) => (
              <Slider
                id="height-slider"
                min={10}
                max={500}
                step={10}
                value={[field.value ?? 100]}
                onValueChange={(value) => field.onChange(value[0])}
                disabled={isLoading}
                className="mt-2"
              />
            )}
          />
          {errors.options?.height && (
            <p className="mt-1 text-xs text-red-600">{errors.options.height.message}</p>
          )}
        </div>
      )}
      {/* Include Text (if 1D) */}
      {is1DBarcode && (
        <div className="flex items-center space-x-2 pt-5">
          <Controller
            name="options.includetext"
            control={control}
            defaultValue={true}
            render={({ field }) => (
              <Switch
                id="show-text-switch"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
          <Label htmlFor="show-text-switch">Mostrar Texto</Label>
        </div>
      )}
      {/* ECL Level (if QR) */}
      {isQrCode && (
        <div>
          <Label htmlFor="ecl-select">Nivel Corrección QR</Label>
          <Controller
            name="options.ecl"
            control={control}
            defaultValue="M"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger id="ecl-select" className="mt-1">
                  <SelectValue placeholder="Selecciona nivel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L (Bajo)</SelectItem>
                  <SelectItem value="M">M (Medio)</SelectItem>
                  <SelectItem value="Q">Q (Alto)</SelectItem>
                  <SelectItem value="H">H (Máximo)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.options?.ecl && (
            <p className="mt-1 text-xs text-red-600">{errors.options.ecl.message}</p>
          )}
        </div>
      )}
    </div>
  );

  const handleResetOptions = () => {
    // Resetea solo el campo 'options' a sus valores por defecto
    reset(
      { ...watch(), options: defaultFormValues.options },
      { keepDefaultValues: false, keepValues: false }
    );
    toast.success('Opciones restablecidas');
  };

  return (
    <TooltipProvider>
      <Disclosure
        as="div"
        defaultOpen
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      >
        {() => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-lg font-semibold text-left text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
              <span>Opciones de Personalización</span>
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-4 text-sm text-gray-500 space-y-6 border-t border-gray-200">
              {/* MOSTRAR SIEMPRE LA VISTA DE PESTAÑAS */}
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-lg bg-muted p-1 mb-4">
                  {['Apariencia', 'Visualización', 'Avanzado'].map((category) => (
                    <Tab
                      key={category}
                      className={({ selected }) =>
                        cn(
                          'w-full rounded-md py-2 px-3 text-sm font-medium leading-5',
                          'ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          selected
                            ? 'bg-primary text-primary-foreground shadow'
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                        )
                      }
                    >
                      {category}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-2 space-y-6">
                  <Tab.Panel className="space-y-6">{appearanceOptions}</Tab.Panel>
                  <Tab.Panel className="space-y-6">{displayOptions}</Tab.Panel>
                  <Tab.Panel className="space-y-6">
                    <AdvancedBarcodeOptions
                      control={control}
                      errors={errors}
                      watch={watch}
                      isLoading={isLoading}
                      selectedType={selectedType}
                      reset={reset}
                    />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetOptions}
                  disabled={isLoading}
                >
                  Restablecer Opciones
                </Button>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </TooltipProvider>
  );
}
