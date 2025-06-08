import React from 'react';
import { Control, Controller, FieldErrors, UseFormWatch, UseFormReset } from 'react-hook-form';
import { GenerateFormData } from '@/schemas/generate.schema';
import { Label } from '@/components/ui/label';
// import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// import { cn } from '@/lib/utils'; // Asegúrate que esta ruta sea correcta

interface AdvancedBarcodeOptionsProps {
  control: Control<GenerateFormData>;
  errors: FieldErrors<GenerateFormData>;
  watch: UseFormWatch<GenerateFormData>;
  isLoading: boolean;
  selectedType: string | undefined;
  reset: UseFormReset<GenerateFormData>;
}

export default function AdvancedBarcodeOptions({
  control,
  errors,
  // watch,
  isLoading,
  selectedType,
  // reset,
}: AdvancedBarcodeOptionsProps) {
  // Derivar estados como isQrCode aquí si es más limpio que pasarlos como props
  const isQrCode = selectedType === 'qrcode';
  // ... y así para otros tipos que tienen opciones avanzadas

  return (
    <div className="space-y-4">
      {/* ECL Level (if QR) - Movido desde Design */}
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

      {/* Renderizar opciones avanzadas según el tipo */}
      {isQrCode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* QR Version */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="qr-version">Versión QR</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Define el tamaño y capacidad del código QR (1-40). 'Auto' selecciona la versión
                  mínima necesaria.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.qr_version"
              control={control}
              defaultValue="Auto" // Default a Auto
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="qr-version" className="mt-1">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    {Array.from({ length: 40 }, (_, i) => i + 1).map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.qr_version && (
              <p className="mt-1 text-xs text-red-600">{errors.options.qr_version.message}</p>
            )}
          </div>
          {/* QR Mask Pattern */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="qr-mask">Máscara QR</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Patrón aplicado para mejorar la legibilidad (0-7). 'Auto' selecciona la mejor
                  máscara.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.qr_mask_pattern"
              control={control}
              defaultValue="Auto"
              render={({ field }) => (
                <Select
                  value={String(field.value)}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="qr-mask" className="mt-1">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    {Array.from({ length: 8 }, (_, i) => i).map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.qr_mask_pattern && (
              <p className="mt-1 text-xs text-red-600">{errors.options.qr_mask_pattern.message}</p>
            )}
          </div>
          {/* ECI Mode (Example Input) */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="eci-mode">Modo ECI</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  (Extended Channel Interpretation) Especifica interpretaciones de caracteres
                  especiales (ej. UTF-8). Dejar vacío si no se requiere.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.eci_mode"
              control={control}
              defaultValue="" // Default vacío
              render={({ field }) => (
                <Input
                  id="eci-mode"
                  type="text"
                  {...field}
                  placeholder="(Opcional)"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.eci_mode && (
              <p className="mt-1 text-xs text-red-600">{errors.options.eci_mode.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Renderizar opciones para Code 128 */}
      {selectedType === 'code128' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Code 128 Code Set */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="code128-codeset">Code Set</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Subconjunto de caracteres a usar (A: Mayúsculas/Control, B: Mayús/Minús/Números,
                  C: Solo Números pares). 'Auto' optimiza automáticamente.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.code128_codeset"
              control={control}
              defaultValue="Auto"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger id="code128-codeset" className="mt-1">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.code128_codeset && (
              <p className="mt-1 text-xs text-red-600">{errors.options.code128_codeset.message}</p>
            )}
          </div>
          {/* Code 128 GS1 Mode */}
          <div className="flex items-center space-x-2 pt-5">
            <Controller
              name="options.code128_gs1"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  id="code128-gs1"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="code128-gs1">Modo GS1-128 (FNC1)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Activa el modo GS1-128, insertando un carácter FNC1 al inicio para compatibilidad
                  con estándares GS1.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Renderizar opciones para EAN/UPC */}
      {(selectedType === 'ean13' ||
        selectedType === 'ean8' ||
        selectedType === 'upca' ||
        selectedType === 'upce') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* EAN/UPC Complement */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="ean-complement">Complemento (2/5 dígitos)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Añade un código suplementario de 2 o 5 dígitos (EAN-2 / EAN-5).</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.ean_upc_complement"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Input
                  id="ean-complement"
                  type="text"
                  {...field}
                  placeholder="Ej. 12"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.ean_upc_complement && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.ean_upc_complement.message}
              </p>
            )}
          </div>
          {/* HRI Position */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="ean-hri">Posición Texto</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Ubicación del texto legible (Human Readable Interpretation) respecto al código.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.ean_upc_hri_position"
              control={control}
              defaultValue="bottom"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger id="ean-hri" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom">Abajo</SelectItem>
                    <SelectItem value="top">Arriba</SelectItem>
                    <SelectItem value="none">Ninguno</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.ean_upc_hri_position && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.ean_upc_hri_position.message}
              </p>
            )}
          </div>
          {/* Quiet Zone */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="ean-quiet">Zona Silencio (módulos)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Espacio vacío mínimo requerido a los lados del código (en múltiplos del ancho del
                  módulo más estrecho).
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.ean_upc_quiet_zone"
              control={control}
              render={({ field }) => (
                <Input
                  id="ean-quiet"
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                  }
                  min="0"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.ean_upc_quiet_zone && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.ean_upc_quiet_zone.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Renderizar opciones para PDF417 */}
      {selectedType === 'pdf417' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Columns */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="pdf-cols">Columnas</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número de columnas de datos (1-30). Afecta el ancho.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.pdf417_columns"
              control={control}
              render={({ field }) => (
                <Input
                  id="pdf-cols"
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                  }
                  min="1"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.pdf417_columns && (
              <p className="mt-1 text-xs text-red-600">{errors.options.pdf417_columns.message}</p>
            )}
          </div>
          {/* Rows */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="pdf-rows">Filas</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Número de filas (3-90). Afecta la altura.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.pdf417_rows"
              control={control}
              render={({ field }) => (
                <Input
                  id="pdf-rows"
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                  }
                  min="3"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.pdf417_rows && (
              <p className="mt-1 text-xs text-red-600">{errors.options.pdf417_rows.message}</p>
            )}
          </div>
          {/* Security Level */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="pdf-sec">Nivel Seguridad</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Nivel de corrección de errores (0-8). Mayor nivel = más robustez, mayor tamaño.
                </p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.pdf417_security_level"
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value ?? '')}
                  onValueChange={(val) =>
                    field.onChange(val === '' ? undefined : parseInt(val, 10))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="pdf-sec" className="mt-1">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i).map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.pdf417_security_level && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.pdf417_security_level.message}
              </p>
            )}
          </div>
          {/* Compact */}
          <div className="flex items-center space-x-2 pt-5">
            <Controller
              name="options.pdf417_compact"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  id="pdf-compact"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="pdf-compact">Compacto</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Usa el modo compacto para reducir el tamaño si es posible.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Renderizar opciones para Data Matrix */}
      {selectedType === 'datamatrix' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Shape */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="dm-shape">Forma</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Forma preferida del símbolo Data Matrix.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.datamatrix_shape"
              control={control}
              defaultValue="Auto"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger id="dm-shape" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="Square">Cuadrado</SelectItem>
                    <SelectItem value="Rectangle">Rectangular</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.datamatrix_shape && (
              <p className="mt-1 text-xs text-red-600">{errors.options.datamatrix_shape.message}</p>
            )}
          </div>
          {/* Symbol Size */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="dm-size">Tamaño Símbolo</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tamaño específico del símbolo (ej. '144x144'). Dejar vacío para automático.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.datamatrix_symbol_size"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Input
                  id="dm-size"
                  type="text"
                  {...field}
                  placeholder="(Opcional)"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.datamatrix_symbol_size && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.datamatrix_symbol_size.message}
              </p>
            )}
          </div>
          {/* Encoding Mode */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="dm-enc">Modo Codificación</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Esquema de codificación a usar (ej. 'Base256'). Dejar vacío para automático.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.datamatrix_encoding_mode"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Input
                  id="dm-enc"
                  type="text"
                  {...field}
                  placeholder="(Opcional)"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.datamatrix_encoding_mode && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.datamatrix_encoding_mode.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Renderizar opciones para Code 39 */}
      {selectedType === 'code39' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Ratio */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="c39-ratio">Ratio (2.0-3.0)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Relación entre el ancho de las barras anchas y estrechas.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.code39_ratio"
              control={control}
              render={({ field }) => (
                <Input
                  id="c39-ratio"
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                  }
                  step="0.1"
                  min="2.0"
                  max="3.0"
                  disabled={isLoading}
                  className="mt-1"
                />
              )}
            />
            {errors.options?.code39_ratio && (
              <p className="mt-1 text-xs text-red-600">{errors.options.code39_ratio.message}</p>
            )}
          </div>
          {/* Check Digit */}
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="c39-check">Dígito Verificación</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Añade un dígito de verificación calculado usando Modulo 43.</p>
              </TooltipContent>
            </Tooltip>
            <Controller
              name="options.code39_check_digit"
              control={control}
              defaultValue="None"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <SelectTrigger id="c39-check" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">Ninguno</SelectItem>
                    <SelectItem value="Mod43">Mod43</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.options?.code39_check_digit && (
              <p className="mt-1 text-xs text-red-600">
                {errors.options.code39_check_digit.message}
              </p>
            )}
          </div>
          {/* Full ASCII */}
          <div className="flex items-center space-x-2 pt-5">
            <Controller
              name="options.code39_full_ascii"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Switch
                  id="c39-ascii"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="c39-ascii">Full ASCII</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Permite codificar todos los caracteres ASCII (usando combinaciones de caracteres).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Mensaje si no hay opciones avanzadas para el tipo seleccionado */}
      {!isQrCode &&
        selectedType !== 'code128' &&
        selectedType !== 'ean13' &&
        selectedType !== 'ean8' &&
        selectedType !== 'upca' &&
        selectedType !== 'upce' &&
        selectedType !== 'pdf417' &&
        selectedType !== 'datamatrix' &&
        selectedType !== 'code39' && (
          <p className="text-gray-500 italic">
            No hay opciones avanzadas disponibles para el tipo '{selectedType || '-'}'.
          </p>
        )}
    </div>
  );
}
