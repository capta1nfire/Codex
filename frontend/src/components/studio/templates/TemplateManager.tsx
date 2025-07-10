/**
 * TemplateManager - Gestor de plantillas guardadas
 * 
 * Lista, gestiona y permite operaciones sobre las plantillas existentes.
 * Incluye búsqueda, filtrado y acciones rápidas.
 * 
 * @principle Pilar 1: Seguridad - Confirmación para acciones destructivas
 * @principle Pilar 2: Robustez - Manejo de estados y errores
 * @principle Pilar 3: Simplicidad - Interfaz clara y directa
 * @principle Pilar 4: Modularidad - Componente independiente
 * @principle Pilar 5: Valor - Gestión eficiente de plantillas
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Copy,
  Trash2,
  Edit,
  Download,
  Upload,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudioConfig } from '@/types/studio.types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TemplateManagerProps {
  templates: StudioConfig[];
  onEdit: (template: StudioConfig) => void;
  onDuplicate: (template: StudioConfig) => void;
  onDelete: (templateId: string) => void;
  onExport: (template: StudioConfig) => void;
  isLoading?: boolean;
}

// Íconos por tipo de plantilla
const TEMPLATE_ICONS: Record<string, any> = {
  url: '🔗',
  wifi: '📶',
  vcard: '👤',
  email: '📧',
  phone: '📞',
  sms: '💬',
  location: '📍',
  event: '📅',
  crypto: '₿'
};

export function TemplateManager({
  templates,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
  isLoading = false
}: TemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  // Filtrar plantillas
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (template.templateType?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesFilter = !filterType || template.templateType === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [templates, searchTerm, filterType]);

  // Obtener tipos únicos
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(templates.map(t => t.templateType).filter(Boolean)));
  }, [templates]);

  const handleDelete = (template: StudioConfig) => {
    if (confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"?`)) {
      onDelete(template.id);
      toast.success('Plantilla eliminada');
    }
  };

  const handleExport = (template: StudioConfig) => {
    onExport(template);
    toast.success('Plantilla exportada');
  };

  const handleDuplicate = (template: StudioConfig) => {
    onDuplicate(template);
    toast.success('Plantilla duplicada');
  };

  if (templates.length === 0 && !isLoading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-slate-400 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay plantillas guardadas</h3>
          <p className="text-sm text-slate-600">
            Comienza creando tu primera plantilla personalizada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {uniqueTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType(null)}>
                Todos los tipos
              </DropdownMenuItem>
              {uniqueTypes.map(type => (
                <DropdownMenuItem 
                  key={type}
                  onClick={() => setFilterType(type)}
                >
                  {TEMPLATE_ICONS[type || ''] || '📄'} {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Lista de plantillas */}
      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {TEMPLATE_ICONS[template.templateType || ''] || '📄'}
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(template)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(template)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">
                  {template.templateType || 'general'}
                </Badge>
                
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    Actualizada {formatDistanceToNow(new Date(template.updatedAt), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
                
                <Badge variant="outline" className="ml-auto">
                  v{template.version}
                </Badge>
                
                {template.isActive && (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activa
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && searchTerm && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-slate-600">
              No se encontraron plantillas que coincidan con "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}