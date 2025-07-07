/**
 * TemplateForm - Formulario de configuración de plantillas
 * 
 * Permite configurar el estilo visual de una plantilla QR.
 * Incluye configuración específica según el tipo de dato.
 * 
 * @principle Pilar 1: Seguridad - Validación específica por tipo
 * @principle Pilar 2: Robustez - Manejo de configuraciones complejas
 * @principle Pilar 3: Simplicidad - Interfaz unificada
 * @principle Pilar 4: Modularidad - Secciones independientes
 * @principle Pilar 5: Valor - Configuración intuitiva
 */

'use client';

import { useCallback, useState } from 'react';
import { QRConfig } from '@/types/studio.types';
import { PlaceholderForm } from '@/components/studio/placeholder/PlaceholderForm';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings,
  Palette,
  Type,
  Shield,
  Zap,
  Info,
  Wifi,
  User,
  Link,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard
} from 'lucide-react';

interface TemplateFormProps {
  templateType: string;
  config: QRConfig;
  onChange: (config: QRConfig) => void;
  onPreviewUpdate: () => void;
}

// Configuraciones específicas por tipo
const TYPE_SPECIFIC_CONFIG = {
  url: {
    icon: Link,
    fields: [
      { id: 'redirect_tracking', label: 'Habilitar tracking', type: 'switch' },
      { id: 'url_shortener', label: 'Acortador de URL', type: 'switch' },
      { id: 'preview_enabled', label: 'Vista previa del sitio', type: 'switch' },
    ]
  },
  wifi: {
    icon: Wifi,
    fields: [
      { id: 'security_type', label: 'Tipo de seguridad', type: 'select', 
        options: ['WPA/WPA2', 'WEP', 'Sin seguridad'] },
      { id: 'hidden_network', label: 'Red oculta', type: 'switch' },
      { id: 'auto_connect', label: 'Conexión automática', type: 'switch' },
    ]
  },
  vcard: {
    icon: User,
    fields: [
      { id: 'photo_enabled', label: 'Incluir foto', type: 'switch' },
      { id: 'social_links', label: 'Enlaces sociales', type: 'switch' },
      { id: 'company_logo', label: 'Logo de empresa', type: 'switch' },
    ]
  },
  email: {
    icon: Mail,
    fields: [
      { id: 'subject_template', label: 'Plantilla de asunto', type: 'text' },
      { id: 'body_template', label: 'Plantilla de mensaje', type: 'text' },
      { id: 'cc_enabled', label: 'Permitir CC', type: 'switch' },
    ]
  },
  phone: {
    icon: Phone,
    fields: [
      { id: 'country_code', label: 'Código de país predeterminado', type: 'text' },
      { id: 'whatsapp_option', label: 'Opción WhatsApp', type: 'switch' },
      { id: 'call_tracking', label: 'Tracking de llamadas', type: 'switch' },
    ]
  },
  sms: {
    icon: Mail,
    fields: [
      { id: 'message_template', label: 'Plantilla de mensaje', type: 'text' },
      { id: 'char_limit', label: 'Límite de caracteres', type: 'number' },
      { id: 'unicode_support', label: 'Soporte Unicode', type: 'switch' },
    ]
  },
  location: {
    icon: MapPin,
    fields: [
      { id: 'map_provider', label: 'Proveedor de mapas', type: 'select',
        options: ['Google Maps', 'Apple Maps', 'OpenStreetMap'] },
      { id: 'show_directions', label: 'Mostrar direcciones', type: 'switch' },
      { id: 'custom_marker', label: 'Marcador personalizado', type: 'switch' },
    ]
  },
  event: {
    icon: Calendar,
    fields: [
      { id: 'calendar_type', label: 'Tipo de calendario', type: 'select',
        options: ['iCal', 'Google Calendar', 'Outlook'] },
      { id: 'reminder_enabled', label: 'Recordatorio automático', type: 'switch' },
      { id: 'timezone_support', label: 'Soporte de zona horaria', type: 'switch' },
    ]
  },
  crypto: {
    icon: CreditCard,
    fields: [
      { id: 'network', label: 'Red predeterminada', type: 'select',
        options: ['Bitcoin', 'Ethereum', 'USDT', 'Personalizada'] },
      { id: 'amount_field', label: 'Campo de cantidad', type: 'switch' },
      { id: 'qr_logo', label: 'Logo de crypto', type: 'switch' },
    ]
  }
};

export function TemplateForm({ 
  templateType, 
  config, 
  onChange, 
  onPreviewUpdate 
}: TemplateFormProps) {
  const [typeConfig, setTypeConfig] = useState<Record<string, any>>({});
  
  // Obtener configuración específica del tipo
  const typeSpecific = TYPE_SPECIFIC_CONFIG[templateType as keyof typeof TYPE_SPECIFIC_CONFIG];
  const TypeIcon = typeSpecific?.icon || Settings;
  
  // Actualizar configuración específica del tipo
  const updateTypeConfig = useCallback((field: string, value: any) => {
    setTypeConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Aquí podrías agregar la lógica para guardar en la configuración principal
    // Por ahora solo actualizamos el estado local
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Estilo Visual
          </TabsTrigger>
          <TabsTrigger value="specific" className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4" />
            Configuración Específica
          </TabsTrigger>
        </TabsList>

        {/* Tab de Estilo Visual */}
        <TabsContent value="style" className="mt-4">
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Configuración Visual de la Plantilla
                </h3>
                <p className="text-xs text-slate-500">
                  Define el estilo predeterminado para códigos QR de tipo {templateType}
                </p>
              </div>
              
              {/* Reutilizamos el PlaceholderForm para la configuración visual */}
              <PlaceholderForm
                config={config}
                onChange={onChange}
                onPreviewUpdate={onPreviewUpdate}
              />
            </div>
          </Card>
        </TabsContent>

        {/* Tab de Configuración Específica */}
        <TabsContent value="specific" className="mt-4">
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <TypeIcon className="h-4 w-4" />
                  Opciones Específicas de {templateType.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">
                  Configuraciones que aplican solo a este tipo de código
                </p>
              </div>

              {typeSpecific ? (
                <div className="space-y-4">
                  {typeSpecific.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm">{field.label}</Label>
                      
                      {field.type === 'switch' && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={typeConfig[field.id] || false}
                            onCheckedChange={(checked) => updateTypeConfig(field.id, checked)}
                          />
                          <span className="text-sm text-slate-600">
                            {typeConfig[field.id] ? 'Activado' : 'Desactivado'}
                          </span>
                        </div>
                      )}
                      
                      {field.type === 'text' && (
                        <Input
                          type="text"
                          value={typeConfig[field.id] || ''}
                          onChange={(e) => updateTypeConfig(field.id, e.target.value)}
                          placeholder={`Ingresa ${field.label.toLowerCase()}`}
                          className="max-w-md"
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <Input
                          type="number"
                          value={typeConfig[field.id] || ''}
                          onChange={(e) => updateTypeConfig(field.id, parseInt(e.target.value))}
                          placeholder="0"
                          className="max-w-32"
                        />
                      )}
                      
                      {field.type === 'select' && field.options && (
                        <Select
                          value={typeConfig[field.id] || field.options[0]}
                          onValueChange={(value) => updateTypeConfig(field.id, value)}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No hay configuraciones específicas disponibles para este tipo de plantilla.
                  </AlertDescription>
                </Alert>
              )}

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Información de la Plantilla
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Tipo:</span>
                    <Badge variant="secondary" className="ml-2">
                      {templateType}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-600">Estado:</span>
                    <Badge variant="success" className="ml-2">
                      Activa
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-600">Corrección de errores:</span>
                    <span className="ml-2 font-medium">{config.error_correction || 'M'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Efectos activos:</span>
                    <span className="ml-2 font-medium">
                      {config.effects?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}