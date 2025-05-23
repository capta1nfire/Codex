'use client';

import { Controller, Control, FieldErrors } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GenerateFormData } from '@/schemas/generate.schema'; // Asumiendo que este schema define la forma

// Lista completa de tipos soportados
const ALL_BARCODE_TYPES = [
  { value: 'qrcode', label: 'QR Code' },
  { value: 'code128', label: 'Code 128' },
  { value: 'pdf417', label: 'PDF417' },
  { value: 'datamatrix', label: 'Data Matrix' },
  { value: 'aztec', label: 'Aztec Code' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upca', label: 'UPC-A' },
  { value: 'upce', label: 'UPC-E' },
  { value: 'code39', label: 'Code 39' },
  { value: 'code93', label: 'Code 93' },
  { value: 'codabar', label: 'Codabar' },
  { value: 'itf', label: 'ITF (Interleaved 2 of 5)' },
];

// Lista limitada para usuarios gratuitos
const BASIC_BARCODE_TYPES = [
  { value: 'qrcode', label: 'QR Code' },
  { value: 'code128', label: 'Code 128' },
  { value: 'ean13', label: 'EAN-13' },
];

interface BarcodeTypeSelectorProps {
  control: Control<GenerateFormData>;
  isLoading: boolean;
  handleTypeChange: (newType: string) => void;
  errors: FieldErrors<GenerateFormData>;
}

export default function BarcodeTypeSelector({
  control,
  isLoading,
  handleTypeChange,
  errors,
}: BarcodeTypeSelectorProps) {
  // Determinar qué lista de tipos mostrar
  const availableTypes = ALL_BARCODE_TYPES; // Mostrar todos los tipos a todos los usuarios

  return (
    <div>
      <Label htmlFor="barcode-type" className="text-lg font-semibold mb-2 block">
        Tipo de Código
      </Label>
      <Controller
        name="barcode_type"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={handleTypeChange} disabled={isLoading}>
            <SelectTrigger
              id="barcode-type"
              className={`w-full ${errors.barcode_type ? 'border-red-500' : ''}`}
              aria-invalid={errors.barcode_type ? 'true' : 'false'}
            >
              <SelectValue placeholder="Selecciona un tipo..." />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors.barcode_type && (
        <p className="mt-1 text-sm text-red-600">{errors.barcode_type.message}</p>
      )}
    </div>
  );
}
