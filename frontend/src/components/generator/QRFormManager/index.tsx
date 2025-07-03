/**
 * QR Form Manager
 * 
 * Manages form rendering based on barcode type and QR content type.
 * Delegates to specific form components while maintaining a unified interface.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRForm } from '../QRForms';
import { BarcodeValidators } from '@/lib/barcodeValidation';

interface QRFormManagerProps {
  barcodeType: string;
  qrType: string;
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onEditingIntentChange?: (isEditing: boolean) => void;
}

export function QRFormManager({
  barcodeType,
  qrType,
  formData,
  onChange,
  onEditingIntentChange
}: QRFormManagerProps) {
  // For QR codes, use the existing QRForm component
  if (barcodeType === 'qrcode') {
    return (
      <QRForm
        type={qrType}
        data={formData}
        onChange={(field: string, value: any) => onChange(field, value)}
        isLoading={false}
        onEditingIntentChange={onEditingIntentChange}
      />
    );
  }

  // For other barcode types, render appropriate input
  return <BarcodeDataInput
    barcodeType={barcodeType}
    value={formData.data || ''}
    onChange={(value) => onChange('data', value)}
  />;
}

/**
 * Barcode Data Input
 * Renders appropriate input for non-QR barcode types
 */
interface BarcodeDataInputProps {
  barcodeType: string;
  value: string;
  onChange: (value: string) => void;
}

function BarcodeDataInput({ barcodeType, value, onChange }: BarcodeDataInputProps) {
  // Get validator for barcode type
  const validator = BarcodeValidators[barcodeType];
  const placeholder = getPlaceholder(barcodeType);
  const helperText = getHelperText(barcodeType);
  
  // Validate current value
  const validation = validator ? validator(value) : { isValid: true };
  const showError = value.length > 0 && !validation.isValid;

  const inputElement = (
    <Input
      type="text"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      className={showError ? 'border-red-500' : ''}
      aria-invalid={showError}
      aria-describedby={`${barcodeType}-helper`}
    />
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`${barcodeType}-input`}>
        Datos para {getBarcodeLabel(barcodeType)}
      </Label>
      
      {inputElement}
      
      <div id={`${barcodeType}-helper`} className="space-y-1">
        {helperText && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {helperText}
          </p>
        )}
        
        {showError && validation.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {validation.error}
          </p>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getBarcodeLabel(type: string): string {
  const labels: Record<string, string> = {
    'code128': 'Code 128',
    'code39': 'Code 39',
    'ean13': 'EAN-13',
    'ean8': 'EAN-8',
    'upca': 'UPC-A',
    'upce': 'UPC-E',
    'itf': 'ITF-14',
    'msi': 'MSI',
    'pharmacode': 'Pharmacode',
    'datamatrix': 'Data Matrix',
    'pdf417': 'PDF417',
    'aztec': 'Aztec Code'
  };
  return labels[type] || type.toUpperCase();
}

function getPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    'code128': 'ABC123456',
    'code39': 'CODE39TEXT',
    'ean13': '1234567890123',
    'ean8': '12345678',
    'upca': '123456789012',
    'upce': '1234567',
    'itf': '12345678901234',
    'msi': '123456',
    'pharmacode': '12345',
    'datamatrix': 'Texto o datos para codificar',
    'pdf417': 'Texto largo o datos estructurados',
    'aztec': 'Datos para código Aztec'
  };
  return placeholders[type] || 'Ingresa los datos';
}

function getHelperText(type: string): string {
  const helpers: Record<string, string> = {
    'ean13': 'Debe ser exactamente 13 dígitos',
    'ean8': 'Debe ser exactamente 8 dígitos',
    'upca': 'Debe ser exactamente 12 dígitos',
    'upce': 'Debe ser 6, 7 u 8 dígitos',
    'itf': 'Debe ser un número par de dígitos (mínimo 4)',
    'code39': 'Solo letras mayúsculas, números y caracteres especiales: - . $ / + % *',
    'pharmacode': 'Número entre 3 y 131070',
    'datamatrix': 'Soporta texto, números y datos binarios',
    'pdf417': 'Ideal para grandes cantidades de texto o datos',
    'aztec': 'Código 2D compacto para datos de tamaño medio'
  };
  return helpers[type] || '';
}