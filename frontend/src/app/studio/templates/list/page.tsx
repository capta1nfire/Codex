/**
 * Template List - Lista de todas las plantillas
 * 
 * Vista general de todas las plantillas guardadas con opciones de gestión.
 * 
 * @principle Pilar 1: Seguridad - Solo SuperAdmin puede acceder
 * @principle Pilar 2: Robustez - Manejo de estados y carga
 * @principle Pilar 3: Simplicidad - Lista clara y funcional
 * @principle Pilar 4: Modularidad - Componentes reutilizables
 * @principle Pilar 5: Valor - Gestión centralizada
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioGuard, StudioFeature } from '@/components/studio/StudioGuard';
import { TemplateManager } from '@/components/studio/templates/TemplateManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  ArrowLeft,
  FileText,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { StudioConfigType, StudioConfig } from '@/types/studio.types';
import toast from 'react-hot-toast';

export default function TemplateListPage() {
  const router = useRouter();
  const { configs, deleteConfig, isLoading, loadConfigs } = useStudio();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrar solo las plantillas
  const templates = configs.filter(
    config => config.type === StudioConfigType.TEMPLATE
  );

  // Refrescar plantillas
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadConfigs();
      toast.success('Plantillas actualizadas');
    } catch (error) {
      toast.error('Error al actualizar plantillas');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navegar al editor
  const handleEdit = (template: StudioConfig) => {
    router.push(`/studio/templates?type=${template.templateType}`);
  };

  // Duplicar plantilla
  const handleDuplicate = (template: StudioConfig) => {
    // Por ahora solo mostramos un mensaje
    toast('Función de duplicar próximamente disponible');
  };

  // Exportar plantilla
  const handleExport = (template: StudioConfig) => {
    const data = {
      name: template.name,
      description: template.description,
      templateType: template.templateType,
      config: template.config,
      version: template.version,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.templateType}-v${template.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importar plantillas
  const handleImport = () => {
    toast('Función de importar próximamente disponible');
  };

  // Exportar todas
  const handleExportAll = () => {
    if (templates.length === 0) {
      toast.error('No hay plantillas para exportar');
      return;
    }

    const data = {
      templates: templates.map(t => ({
        name: t.name,
        description: t.description,
        templateType: t.templateType,
        config: t.config,
        version: t.version
      })),
      exportedAt: new Date().toISOString(),
      totalTemplates: templates.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${templates.length} plantillas exportadas`);
  };

  return (
    <StudioFeature feature="templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/studio/templates')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Gestión de Plantillas
              </h1>
              <p className="text-slate-600 mt-1">
                Administra todas las plantillas de códigos QR
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              disabled={templates.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => router.push('/studio/templates')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total de Plantillas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-slate-500 mt-1">
                Plantillas configuradas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Tipos Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(templates.map(t => t.templateType)).size}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tipos de códigos configurados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Última Actualización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {templates.length > 0 
                  ? new Date(
                      Math.max(...templates.map(t => new Date(t.updatedAt).getTime()))
                    ).toLocaleDateString('es')
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Modificación más reciente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de plantillas */}
        <TemplateManager
          templates={templates}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={deleteConfig}
          onExport={handleExport}
          isLoading={isLoading}
        />
      </div>
    </StudioFeature>
  );
}