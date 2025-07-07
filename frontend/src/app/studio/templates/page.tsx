/**
 * Template Editor - QR Studio
 * 
 * Editor para crear y gestionar plantillas de códigos QR personalizadas.
 * Permite configurar diferentes tipos (URL, WiFi, vCard, etc.) con estilos únicos.
 * 
 * @principle Pilar 1: Seguridad - Validación por tipo de datos
 * @principle Pilar 2: Robustez - Manejo de múltiples tipos de plantillas
 * @principle Pilar 3: Simplicidad - Interfaz unificada para todos los tipos
 * @principle Pilar 4: Modularidad - Componentes específicos por tipo
 * @principle Pilar 5: Valor - Plantillas reutilizables para usuarios
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioGuard, StudioFeature } from '@/components/studio/StudioGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2,
  Save,
  Plus,
  Trash2,
  Copy,
  FileText,
  Wifi,
  User,
  Link,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Globe,
  Info,
  Sparkles,
  Settings2
} from 'lucide-react';
import { 
  StudioConfigType, 
  QRConfig, 
  DEFAULT_QR_CONFIG 
} from '@/types/studio.types';
import toast from 'react-hot-toast';
import { TemplateForm } from '@/components/studio/templates/TemplateForm';
import { TemplatePreview } from '@/components/studio/templates/TemplatePreview';

// Tipos de plantillas disponibles
const TEMPLATE_TYPES = [
  {
    id: 'url',
    name: 'URL / Link',
    icon: Link,
    description: 'Enlaces a sitios web',
    color: 'blue',
  },
  {
    id: 'wifi',
    name: 'WiFi',
    icon: Wifi,
    description: 'Credenciales de red WiFi',
    color: 'purple',
  },
  {
    id: 'vcard',
    name: 'vCard',
    icon: User,
    description: 'Tarjeta de contacto',
    color: 'green',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    description: 'Enviar correo electrónico',
    color: 'red',
  },
  {
    id: 'phone',
    name: 'Teléfono',
    icon: Phone,
    description: 'Llamada telefónica',
    color: 'orange',
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: FileText,
    description: 'Mensaje de texto',
    color: 'pink',
  },
  {
    id: 'location',
    name: 'Ubicación',
    icon: MapPin,
    description: 'Coordenadas GPS',
    color: 'teal',
  },
  {
    id: 'event',
    name: 'Evento',
    icon: Calendar,
    description: 'Evento de calendario',
    color: 'indigo',
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: CreditCard,
    description: 'Dirección de criptomoneda',
    color: 'yellow',
  }
];

export default function TemplateEditorPage() {
  const router = useRouter();
  const { 
    getConfigByType, 
    saveConfig, 
    isLoading,
    error,
    configs
  } = useStudio();
  
  const [selectedType, setSelectedType] = useState<string>('url');
  const [templates, setTemplates] = useState<Record<string, QRConfig>>({});
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar plantillas existentes
  useEffect(() => {
    const templateConfigs = configs.filter(
      config => config.type === StudioConfigType.TEMPLATE
    );
    
    const templateMap: Record<string, QRConfig> = {};
    templateConfigs.forEach(config => {
      if (config.template_type) {
        templateMap[config.template_type] = config.config as QRConfig;
      }
    });
    
    setTemplates(templateMap);
  }, [configs]);

  // Pilar 3: Seleccionar tipo de plantilla
  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setActiveTemplate(typeId);
  };

  // Pilar 2: Guardar plantilla
  const handleSaveTemplate = async (typeId: string, config: QRConfig) => {
    setIsSaving(true);
    
    try {
      const templateType = TEMPLATE_TYPES.find(t => t.id === typeId);
      if (!templateType) throw new Error('Tipo de plantilla inválido');

      await saveConfig({
        type: StudioConfigType.TEMPLATE,
        name: `Plantilla ${templateType.name}`,
        description: `Configuración personalizada para códigos QR de tipo ${templateType.name}`,
        templateType: typeId,
        config: config,
      });
      
      toast.success(`Plantilla ${templateType.name} guardada exitosamente`);
      
      // Actualizar estado local
      setTemplates(prev => ({
        ...prev,
        [typeId]: config
      }));
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      toast.error('Error al guardar la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  // Pilar 5: Duplicar plantilla
  const handleDuplicateTemplate = (typeId: string) => {
    const template = templates[typeId];
    if (!template) return;
    
    // Por ahora solo copiamos al portapapeles
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    toast.success('Configuración copiada al portapapeles');
  };

  // Eliminar plantilla (resetear a default)
  const handleDeleteTemplate = async (typeId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    
    // Resetear a configuración por defecto
    await handleSaveTemplate(typeId, DEFAULT_QR_CONFIG);
    toast.success('Plantilla eliminada');
  };

  return (
    <StudioFeature feature="templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Editor de Plantillas
            </h1>
            <p className="text-slate-600 mt-1">
              Crea plantillas personalizadas para cada tipo de código QR
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {Object.keys(templates).length} plantillas activas
          </Badge>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Sistema de Plantillas</AlertTitle>
          <AlertDescription className="text-blue-700">
            Las plantillas definen el estilo visual predeterminado para cada tipo de código QR. 
            Los usuarios verán estos estilos aplicados automáticamente según el tipo de dato que ingresen.
          </AlertDescription>
        </Alert>

        {/* Template Type Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Tipos de Plantillas Disponibles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_TYPES.map((type) => {
              const Icon = type.icon;
              const hasTemplate = !!templates[type.id];
              const isActive = selectedType === type.id;
              
              return (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSelectType(type.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                        <Icon className={`h-5 w-5 text-${type.color}-600`} />
                      </div>
                      {hasTemplate && (
                        <Badge variant="success" className="text-xs">
                          Configurada
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-sm mb-1">{type.name}</h3>
                    <p className="text-xs text-slate-600">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Template Editor */}
        {selectedType && (
          <Card className="mt-6">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-slate-600" />
                  Configurando: {TEMPLATE_TYPES.find(t => t.id === selectedType)?.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(selectedType)}
                    disabled={!templates[selectedType]}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(selectedType)}
                    disabled={!templates[selectedType]}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleSaveTemplate(selectedType, templates[selectedType] || DEFAULT_QR_CONFIG);
                    }}
                    disabled={isSaving || isLoading || !templates[selectedType]}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Formulario de configuración */}
                <div>
                  <TemplateForm
                    templateType={selectedType}
                    config={templates[selectedType] || DEFAULT_QR_CONFIG}
                    onChange={(newConfig) => {
                      setTemplates(prev => ({
                        ...prev,
                        [selectedType]: newConfig
                      }));
                    }}
                    onPreviewUpdate={() => {
                      // Forzar actualización del preview si es necesario
                    }}
                  />
                </div>
                
                {/* Preview de la plantilla */}
                <div className="lg:sticky lg:top-24 lg:h-fit">
                  <TemplatePreview
                    templateType={selectedType}
                    config={templates[selectedType] || DEFAULT_QR_CONFIG}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudioFeature>
  );
}