import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { GenerateFormData } from '@/schemas/generate.schema';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Shapes, Sparkles, Frame } from 'lucide-react';

interface QRv2AdvancedOptionsProps {
  control: Control<GenerateFormData>;
  isLoading: boolean;
}

// Eye shape options
const eyeShapeOptions = [
  { value: 'square', label: 'Square' },
  { value: 'rounded-square', label: 'Rounded Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'dot', label: 'Dot' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'star', label: 'Star' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'heart', label: 'Heart' },
  { value: 'hexagon', label: 'Hexagon' },
];

// Data pattern options
const dataPatternOptions = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'vertical', label: 'Vertical Lines' },
  { value: 'horizontal', label: 'Horizontal Lines' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circular', label: 'Circular' },
  { value: 'star', label: 'Star' },
  { value: 'wave', label: 'Wave' },
];

// Effect options
const effectOptions = [
  { value: 'shadow', label: 'Shadow' },
  { value: 'glow', label: 'Glow' },
  { value: 'blur', label: 'Blur' },
  { value: 'noise', label: 'Noise' },
  { value: 'vintage', label: 'Vintage' },
];

// Frame options
const frameOptions = [
  { value: 'none', label: 'None' },
  { value: 'simple', label: 'Simple' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'bubble', label: 'Bubble' },
  { value: 'speech', label: 'Speech' },
  { value: 'badge', label: 'Badge' },
];

export default function QRv2AdvancedOptions({
  control,
  isLoading,
}: QRv2AdvancedOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Eye Shapes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Eye Shapes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="options.eye_shape"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select eye shape" />
                </SelectTrigger>
                <SelectContent>
                  {eyeShapeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </CardContent>
      </Card>

      {/* Data Patterns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shapes className="w-4 h-4" />
            Data Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="options.data_pattern"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select data pattern" />
                </SelectTrigger>
                <SelectContent>
                  {dataPatternOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </CardContent>
      </Card>

      {/* Effects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Visual Effects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {effectOptions.map((effect) => (
            <div key={effect.value} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`effect-${effect.value}`}>{effect.label}</Label>
                <Controller
                  name={`options.effects.${effect.value}.enabled` as any}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id={`effect-${effect.value}`}
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
              </div>
              
              {/* Effect intensity when enabled */}
              <Controller
                name={`options.effects.${effect.value}.enabled` as any}
                control={control}
                render={({ field: enabledField }) => (
                  enabledField.value && (
                    <Controller
                      name={`options.effects.${effect.value}.intensity` as any}
                      control={control}
                      defaultValue={1.0}
                      render={({ field }) => (
                        <div className="flex items-center gap-2 pl-4">
                          <Label className="text-xs">Intensity</Label>
                          <Input
                            type="number"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={field.value || 1.0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="w-20 h-8"
                            disabled={isLoading}
                          />
                        </div>
                      )}
                    />
                  )
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Frames */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Frame className="w-4 h-4" />
            Frame Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="options.frame_style"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frame style" />
                </SelectTrigger>
                <SelectContent>
                  {frameOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          
          {/* Frame text when frame is selected */}
          <Controller
            name="options.frame_style"
            control={control}
            render={({ field: frameField }) => (
              <>
                {frameField.value && (
                  <Controller
                    name="options.frame_text"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label className="text-xs">Frame Text (optional)</Label>
                        <Input
                          type="text"
                          placeholder="Scan Me!"
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="h-8"
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  />
                )}
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}