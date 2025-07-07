/**
 * TemplatePreview - Preview de plantillas con datos de ejemplo
 * 
 * Muestra cómo se verá la plantilla con datos reales según el tipo.
 * Incluye ejemplos específicos para cada tipo de código QR.
 * 
 * @principle Pilar 1: Seguridad - Datos de ejemplo seguros
 * @principle Pilar 2: Robustez - Manejo de todos los tipos
 * @principle Pilar 3: Simplicidad - Preview claro y directo
 * @principle Pilar 4: Modularidad - Ejemplos por tipo
 * @principle Pilar 5: Valor - Visualización realista
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRConfig } from '@/types/studio.types';
import { PlaceholderPreview } from '@/components/studio/placeholder/PlaceholderPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye,
  RefreshCw,
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Code,
  FileText,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TemplatePreviewProps {
  templateType: string;
  config: QRConfig;
}

// Datos de ejemplo por tipo
const EXAMPLE_DATA = {
  url: {
    data: 'https://example.com/product/amazing-item',
    display: 'https://example.com/product/amazing-item',
    description: 'Enlace a página de producto'
  },
  wifi: {
    data: 'WIFI:T:WPA;S:MiRedWiFi;P:password123;;',
    display: 'Red: MiRedWiFi\nContraseña: password123\nSeguridad: WPA',
    description: 'Credenciales de red WiFi'
  },
  vcard: {
    data: `BEGIN:VCARD
VERSION:3.0
FN:Juan Pérez
ORG:Empresa ABC
TEL:+1234567890
EMAIL:juan@example.com
END:VCARD`,
    display: 'Juan Pérez\nEmpresa ABC\n+1234567890\njuan@example.com',
    description: 'Tarjeta de contacto vCard'
  },
  email: {
    data: 'mailto:info@example.com?subject=Consulta&body=Hola,%20tengo%20una%20consulta',
    display: 'Para: info@example.com\nAsunto: Consulta\nMensaje: Hola, tengo una consulta',
    description: 'Enviar correo electrónico'
  },
  phone: {
    data: 'tel:+1234567890',
    display: 'Llamar a: +1234567890',
    description: 'Número de teléfono'
  },
  sms: {
    data: 'sms:+1234567890?body=Hola%20desde%20QR',
    display: 'SMS a: +1234567890\nMensaje: Hola desde QR',
    description: 'Mensaje SMS predefinido'
  },
  location: {
    data: 'geo:40.7128,-74.0060',
    display: 'Latitud: 40.7128\nLongitud: -74.0060\n(Nueva York)',
    description: 'Coordenadas GPS'
  },
  event: {
    data: `BEGIN:VEVENT
SUMMARY:Reunión importante
DTSTART:20240315T100000Z
DTEND:20240315T110000Z
LOCATION:Sala de conferencias
END:VEVENT`,
    display: 'Evento: Reunión importante\nFecha: 15/03/2024 10:00\nLugar: Sala de conferencias',
    description: 'Evento de calendario'
  },
  crypto: {
    data: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001',
    display: 'Bitcoin\nDirección: 1A1zP1eP5Q...\nCantidad: 0.001 BTC',
    description: 'Dirección de Bitcoin'
  }
};

export function TemplatePreview({ templateType, config }: TemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'data' | 'raw'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  const exampleData = EXAMPLE_DATA[templateType as keyof typeof EXAMPLE_DATA] || EXAMPLE_DATA.url;

  // Copiar datos de ejemplo
  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(exampleData.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Datos de ejemplo copiados');
    } catch (err) {
      toast.error('Error al copiar los datos');
    }
  };

  // Descargar configuración
  const handleDownloadConfig = () => {
    const configWithType = {
      templateType,
      config,
      exampleData: exampleData.data
    };
    
    const blob = new Blob([JSON.stringify(configWithType, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${templateType}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Configuración descargada');
  };

  return (
    <div className="space-y-4">
      {/* Controles superiores */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="data">
              <FileText className="h-4 w-4 mr-2" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="raw">
              <Code className="h-4 w-4 mr-2" />
              QR Raw
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {viewMode === 'preview' && (
            <>
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadConfig}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenido según modo de vista */}
      {viewMode === 'preview' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Preview de Plantilla: {templateType.toUpperCase()}
            </CardTitle>
            <p className="text-sm text-slate-600">{exampleData.description}</p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Aquí podríamos usar PlaceholderPreview con los datos de ejemplo */}
            <div className={`p-6 ${deviceView === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="aspect-square bg-slate-100 rounded flex items-center justify-center">
                  <span className="text-slate-400">QR Code Preview</span>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="secondary">{templateType}</Badge>
                  <p className="text-sm text-slate-600 mt-2">
                    Escaneando este código se obtendrá:
                  </p>
                  <pre className="text-xs bg-slate-50 p-2 rounded mt-2 text-left overflow-x-auto">
                    {exampleData.display}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'data' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Datos de Ejemplo
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyData}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Datos codificados:</h4>
                <pre className="bg-slate-50 p-4 rounded text-sm overflow-x-auto">
                  {exampleData.data}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Vista para el usuario:</h4>
                <pre className="bg-blue-50 p-4 rounded text-sm">
                  {exampleData.display}
                </pre>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Estos son datos de ejemplo. En producción, los usuarios ingresarán 
                  sus propios datos que se codificarán con este formato.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'raw' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos QR Raw</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
              <div className="mb-2 text-slate-400"># Configuración de plantilla</div>
              <pre>{JSON.stringify(config, null, 2)}</pre>
              <div className="mt-4 mb-2 text-slate-400"># Datos de ejemplo</div>
              <pre>{exampleData.data}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}