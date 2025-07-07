/**
 * Placeholder Editor - QR Studio
 * 
 * Editor para personalizar el QR de ejemplo mostrado en la página principal.
 * Permite a SuperAdmin configurar apariencia, colores, efectos y más.
 * 
 * @principle Pilar 1: Seguridad - Solo accesible para SUPERADMIN
 * @principle Pilar 2: Robustez - Validación en tiempo real y manejo de errores
 * @principle Pilar 3: Simplicidad - Interfaz intuitiva con preview inmediato
 * @principle Pilar 4: Modularidad - Componentes reutilizables
 * @principle Pilar 5: Valor - Control total sobre la primera impresión
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioGuard, StudioFeature } from '@/components/studio/StudioGuard';
import { PlaceholderForm } from '@/components/studio/placeholder/PlaceholderForm';
import { PlaceholderPreview } from '@/components/studio/placeholder/PlaceholderPreview';
import { PlaceholderPresets } from '@/components/studio/placeholder/PlaceholderPresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Eye,
  Settings,
  Palette
} from 'lucide-react';
import { 
  StudioConfigType, 
  QRConfig, 
  DEFAULT_QR_CONFIG 
} from '@/types/studio.types';
import toast from 'react-hot-toast';
import { validateQRConfig } from '@/schemas/studio.schema';

export default function PlaceholderEditorPage() {
  const router = useRouter();
  const { 
    getConfigByType, 
    saveConfig, 
    isLoading,
    error,
    isDirty,
    setActiveConfig,
    activeConfig
  } = useStudio();
  
  const [localConfig, setLocalConfig] = useState<QRConfig>(DEFAULT_QR_CONFIG);
  const [previewKey, setPreviewKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    const existingConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
    if (existingConfig) {
      setLocalConfig(existingConfig.config as QRConfig);
      setActiveConfig(existingConfig);
    } else {
      // Si no existe, usar valores por defecto
      setLocalConfig(DEFAULT_QR_CONFIG);
    }
  }, [getConfigByType, setActiveConfig]);

  // Pilar 2: Manejo robusto del guardado
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validar antes de guardar
      const validation = validateQRConfig(localConfig);
      if (!validation.isValid) {
        toast.error('La configuración contiene errores. Revísala antes de guardar.');
        return;
      }
      
      await saveConfig({
        type: StudioConfigType.PLACEHOLDER,
        name: 'Configuración de Placeholder',
        description: 'QR de ejemplo mostrado en la página principal',
        config: localConfig,
      });
      
      // Forzar actualización del preview
      setPreviewKey(prev => prev + 1);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error al guardar la configuración. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear a valores por defecto
  const handleReset = () => {
    setLocalConfig(DEFAULT_QR_CONFIG);
    setPreviewKey(prev => prev + 1);
    toast.success('Configuración restablecida a valores por defecto');
  };

  // Aplicar preset
  const handleApplyPreset = (presetConfig: QRConfig) => {
    setLocalConfig(presetConfig);
    setPreviewKey(prev => prev + 1);
    toast.success('Preset aplicado exitosamente');
  };

  return (
    <StudioFeature feature="placeholder">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editor de Placeholder</h1>
            <p className="text-slate-600 mt-1">
              Personaliza el QR de ejemplo que ven todos los usuarios
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                <span>Cambios sin guardar</span>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Alert informativo */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Impacto del Placeholder</AlertTitle>
          <AlertDescription className="text-blue-700">
            Este QR es lo primero que ven los usuarios al entrar a la plataforma.
            Una buena configuración puede aumentar el engagement y mostrar las capacidades del sistema.
          </AlertDescription>
        </Alert>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contenido principal con tabs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Panel de edición */}
          <div>
            <Tabs defaultValue="design" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">
                  <Palette className="h-4 w-4 mr-2" />
                  Diseño
                </TabsTrigger>
                <TabsTrigger value="presets">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Presets
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Settings className="h-4 w-4 mr-2" />
                  Avanzado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalización Visual</CardTitle>
                    <CardDescription>
                      Configura colores, formas y estilos del QR
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PlaceholderForm
                      config={localConfig}
                      onChange={setLocalConfig}
                      onPreviewUpdate={() => setPreviewKey(prev => prev + 1)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="presets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuraciones Predefinidas</CardTitle>
                    <CardDescription>
                      Aplica estilos profesionales con un clic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PlaceholderPresets
                      onApply={handleApplyPreset}
                      currentConfig={localConfig}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración Avanzada</CardTitle>
                    <CardDescription>
                      Opciones expertas y optimizaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <Settings className="h-4 w-4" />
                        <AlertTitle>Próximamente</AlertTitle>
                        <AlertDescription>
                          Las opciones avanzadas estarán disponibles en la próxima actualización.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Panel de preview */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Vista Previa en Tiempo Real
                </CardTitle>
                <CardDescription>
                  Así se verá el QR en la página principal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PlaceholderPreview
                  key={previewKey}
                  config={localConfig}
                  showControls
                />
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Información del QR</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Contenido:</dt>
                    <dd className="font-mono text-xs">https://codex.example</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Corrección de errores:</dt>
                    <dd className="font-medium">{localConfig.error_correction || 'M'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Patrón de datos:</dt>
                    <dd className="font-medium">{localConfig.data_pattern || 'square'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Forma de ojos:</dt>
                    <dd className="font-medium">{localConfig.eye_shape || 'square'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudioFeature>
  );
}