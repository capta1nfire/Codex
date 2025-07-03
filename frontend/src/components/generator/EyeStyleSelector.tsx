'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QR_V3_EYE_BORDER_STYLES, QR_V3_EYE_CENTER_STYLES } from '@/constants/qrV3Options';

interface EyeStyleSelectorProps {
  borderStyle?: string;
  centerStyle?: string;
  onBorderStyleChange: (style: string) => void;
  onCenterStyleChange: (style: string) => void;
}

export const EyeStyleSelector: React.FC<EyeStyleSelectorProps> = ({
  borderStyle = 'square',
  centerStyle = 'square',
  onBorderStyleChange,
  onCenterStyleChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estilos de Ojos Separados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="eye-border-style">Estilo del Borde</Label>
          <Select value={borderStyle} onValueChange={onBorderStyleChange}>
            <SelectTrigger id="eye-border-style">
              <SelectValue placeholder="Seleccionar estilo de borde" />
            </SelectTrigger>
            <SelectContent>
              {QR_V3_EYE_BORDER_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span>{style.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eye-center-style">Estilo del Centro</Label>
          <Select value={centerStyle} onValueChange={onCenterStyleChange}>
            <SelectTrigger id="eye-center-style">
              <SelectValue placeholder="Seleccionar estilo de centro" />
            </SelectTrigger>
            <SelectContent>
              {QR_V3_EYE_CENTER_STYLES.map((style) => (
                <SelectItem key={style.value} value={style.value}>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span>{style.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> Ahora puedes personalizar el borde y el centro de los ojos de forma independiente.
            Esto te permite crear combinaciones únicas como un borde en forma de corazón con un centro circular.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};