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
  Settings,
  Palette,
  Monitor,
  Smartphone,
  Copy,
  Check,
  Download
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
    loadConfigs,
    isLoading,
    error,
    isDirty,
    setActiveConfig,
    activeConfig,
    markAsDirty
  } = useStudio();
  
  const [localConfig, setLocalConfig] = useState<QRConfig>(DEFAULT_QR_CONFIG);
  const [previewKey, setPreviewKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para los controles del preview
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [qrMetadata, setQrMetadata] = useState<any>(null);

  // Track if we've already initialized to prevent duplicate loads
  const [hasInitialized, setHasInitialized] = useState(false);

  // Cargar configuración existente cuando StudioProvider termine de cargar
  useEffect(() => {
    // Solo ejecutar cuando no estamos cargando y no hemos inicializado aún
    if (isLoading || hasInitialized) {
      return;
    }
    
    const existingConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
    
    if (existingConfig) {
      setLocalConfig(existingConfig.config as QRConfig);
      setActiveConfig(existingConfig);
    } else {
      // Si no existe, usar valores por defecto
      setLocalConfig(DEFAULT_QR_CONFIG);
    }
    
    // Mark as initialized
    setHasInitialized(true);
  }, [isLoading, hasInitialized, getConfigByType, setActiveConfig]); // Depend on loading state and initialization

  // Pilar 2: Manejo robusto del guardado
  const handleSave = async () => {
    
    setIsSaving(true);
    try {
      // Validar antes de guardar
      const validation = validateQRConfig(localConfig);
      console.log('[PlaceholderEditorPage] Validation result:', validation);
      
      if (!validation.isValid) {
        console.error('[PlaceholderEditorPage] Validation failed:', validation);
        console.error('[PlaceholderEditorPage] Validation errors:', JSON.stringify(validation.errors, null, 2));
        
        // Mostrar errores específicos
        const errorMessages = Object.entries(validation.errors || {}).map(([field, message]) => 
          `${field}: ${message}`
        ).join('\n');
        
        toast.error(`Errores de validación:\n${errorMessages}`);
        return;
      }
      
      const configToSave = {
        type: StudioConfigType.PLACEHOLDER,
        name: 'Configuración de Placeholder',
        description: 'QR de ejemplo mostrado en la página principal',
        config: localConfig,
      };
      
      console.log('[PlaceholderEditorPage] Sending config to save:', configToSave);
      
      await saveConfig(configToSave);
      
      console.log('[PlaceholderEditorPage] Save completed successfully');
      
      // Forzar actualización del preview
      setPreviewKey(prev => prev + 1);
      
      // Verificar que se guardó correctamente y recargar configuraciones
      setTimeout(async () => {
        // Recargar configuraciones desde el servidor
        if (loadConfigs) {
          console.log('[PlaceholderEditorPage] Reloading configs after save...');
          await loadConfigs();
        }
        
        const savedConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
        console.log('[PlaceholderEditorPage] After save verification:', {
          savedConfig,
          savedConfigDetails: savedConfig ? JSON.stringify(savedConfig.config, null, 2) : 'No config'
        });
      }, 1000);
      
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('[PlaceholderEditorPage] Error guardando configuración:', error);
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

  // Copiar configuración al portapapeles
  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(localConfig, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Configuración copiada al portapapeles');
    } catch (err) {
      toast.error('No se pudo copiar la configuración');
    }
  };

  // Descargar QR como SVG
  const handleDownload = () => {
    // Simular un click en el botón de descarga interno del PlaceholderPreview
    const event = new MouseEvent('click', { bubbles: true });
    const internalDownloadBtn = document.querySelector('[data-download-internal]');
    if (internalDownloadBtn) {
      internalDownloadBtn.dispatchEvent(event);
    } else {
      toast.error('QR aún no generado');
    }
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

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contenido principal con tabs */}
        <div className="grid gap-6 lg:grid-cols-[60%_40%]">
          {/* Panel de edición */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Personalización Visual</CardTitle>
                <CardDescription>
                  Configura colores, formas y estilos del QR
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    <PlaceholderForm
                      config={localConfig}
                      onChange={(newConfig) => {
                        console.log('[PlaceholderEditorPage] Config changed:', {
                          oldConfig: localConfig,
                          newConfig,
                          changes: JSON.stringify(newConfig) !== JSON.stringify(localConfig)
                        });
                        setLocalConfig(newConfig);
                        // Marcar como dirty cuando hay cambios
                        if (markAsDirty) {
                          markAsDirty();
                        }
                      }}
                      onPreviewUpdate={() => setPreviewKey(prev => prev + 1)}
                    />
                  </TabsContent>

                  <TabsContent value="presets" className="space-y-4">
                    <PlaceholderPresets
                      onApply={handleApplyPreset}
                      currentConfig={localConfig}
                    />
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-4">
                      <Alert>
                        <Settings className="h-4 w-4" />
                        <AlertTitle>Próximamente</AlertTitle>
                        <AlertDescription>
                          Las opciones avanzadas estarán disponibles en la próxima actualización.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Información del QR */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Información del QR</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-600">Contenido:</dt>
                    <dd className="font-mono text-xs">https://tu-sitio-web.com</dd>
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
                    <dd className="font-medium">
                      {localConfig.use_separated_eye_styles 
                        ? `Borde: ${localConfig.eye_border_style || 'square'}, Centro: ${localConfig.eye_center_style || 'square'}`
                        : localConfig.eye_shape || localConfig.eye_border_style || 'square'}
                    </dd>
                  </div>
                  {qrMetadata && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Versión:</dt>
                        <dd className="font-medium">{qrMetadata.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Módulos:</dt>
                        <dd className="font-medium">{qrMetadata.total_modules}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-600">Tiempo:</dt>
                        <dd className="font-medium">{qrMetadata.generation_time_ms}ms</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Panel de preview */}
          <div className="lg:sticky lg:top-24 lg:h-[85vh]">
            <Card className="overflow-hidden h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vista Previa en Tiempo Real</CardTitle>
                    <CardDescription>
                      Así se verá el QR en la página principal
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant={viewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200" />
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyConfig}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        id="placeholder-download-btn"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <PlaceholderPreview
                  key={previewKey}
                  config={localConfig}
                  showControls={false}
                  viewMode={viewMode}
                  onDownload={setPreviewKey}
                  onMetadataChange={setQrMetadata}
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </StudioFeature>
  );
}