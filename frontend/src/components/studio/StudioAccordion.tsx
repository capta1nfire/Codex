/**
 * Studio Accordion Component
 * 
 * Componente acordeón para organizar las secciones de QR Studio de manera
 * más limpia y escalable. Agrupa todas las funcionalidades relacionadas.
 * 
 * @principle Pilar 3: Simplicidad - Navegación intuitiva y organizada
 * @principle Pilar 4: Modularidad - Componente reutilizable y extensible
 * @principle Pilar 5: Valor - Mejor UX para el SuperAdmin
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Settings,
  Palette,
  FileText,
  Shield,
  Zap,
  Activity,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useStudio } from './StudioProvider';

interface StudioSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: StudioSectionItem[];
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'success' | 'destructive';
  };
}

interface StudioSectionItem {
  title: string;
  description: string;
  href: string;
  completed?: boolean;
  external?: boolean;
}

export function StudioAccordion() {
  const { configs } = useStudio();
  const pathname = usePathname();
  const router = useRouter();

  // Calcular estadísticas para badges
  const stats = {
    global: configs.filter(c => c.type === 'GLOBAL').length,
    templates: configs.filter(c => c.type === 'TEMPLATE').length,
    placeholder: configs.filter(c => c.type === 'PLACEHOLDER').length,
  };

  const sections: StudioSection[] = [
    {
      id: 'configuration',
      title: 'Configuración Global',
      description: 'Valores por defecto y configuraciones base',
      icon: Settings,
      color: 'text-blue-600',
      badge: stats.global > 0 ? 
        { text: 'Configurado', variant: 'success' } : 
        { text: 'Pendiente', variant: 'secondary' },
      items: [
        {
          title: 'Configuración Global',
          description: 'Valores por defecto para todos los QR',
          href: '/studio/global',
          completed: stats.global > 0
        },
        {
          title: 'Permisos y Roles',
          description: 'Gestión de accesos y permisos',
          href: '/studio/permissions',
          completed: false
        }
      ]
    },
    {
      id: 'customization',
      title: 'Personalización Visual',
      description: 'Diseño, colores y efectos visuales',
      icon: Palette,
      color: 'text-purple-600',
      badge: stats.placeholder > 0 ? 
        { text: 'Personalizado', variant: 'success' } : 
        { text: 'Por defecto', variant: 'secondary' },
      items: [
        {
          title: 'Editor de Placeholder',
          description: 'QR de ejemplo en página principal',
          href: '/studio/placeholder',
          completed: stats.placeholder > 0
        },
        {
          title: 'Efectos y Filtros',
          description: 'Efectos visuales avanzados',
          href: '/studio/effects',
          completed: false
        }
      ]
    },
    {
      id: 'templates',
      title: 'Plantillas y Dominios',
      description: 'Configuraciones específicas por plataforma',
      icon: FileText,
      color: 'text-green-600',
      badge: { text: `${stats.templates} activas`, variant: 'default' },
      items: [
        {
          title: 'Editor de Plantillas',
          description: 'Crear y editar plantillas',
          href: '/studio/templates',
          completed: stats.templates > 0
        },
        {
          title: 'Lista de Plantillas',
          description: 'Ver todas las plantillas existentes',
          href: '/studio/templates/list',
          completed: false
        }
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoreo y Analytics',
      description: 'Estadísticas y actividad del sistema',
      icon: Activity,
      color: 'text-orange-600',
      badge: { text: 'En desarrollo', variant: 'secondary' },
      items: [
        {
          title: 'Dashboard Analytics',
          description: 'Estadísticas de uso y rendimiento',
          href: '/studio/analytics',
          completed: false
        },
        {
          title: 'Logs del Sistema',
          description: 'Historial de cambios y actividad',
          href: '/studio/logs',
          completed: false
        }
      ]
    }
  ];

  // Determinar qué acordeón debe estar abierto por defecto
  const getDefaultValue = () => {
    for (const section of sections) {
      for (const item of section.items) {
        if (pathname.startsWith(item.href)) {
          return section.id;
        }
      }
    }
    return 'configuration'; // Por defecto
  };

  const [value, setValue] = useState(getDefaultValue());

  const handleItemClick = (href: string, external?: boolean) => {
    if (external) {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">QR Studio</h2>
          <Badge variant="default" className="bg-blue-600">
            SuperAdmin
          </Badge>
        </div>

        <Accordion 
          type="single" 
          value={value} 
          onValueChange={setValue}
          className="space-y-2"
        >
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className={`h-5 w-5 ${section.color}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">
                          {section.title}
                        </span>
                        {section.badge && (
                          <Badge variant={section.badge.variant} className="text-xs">
                            {section.badge.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pb-4">
                  <div className="space-y-2 ml-8">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className={`
                          flex items-center justify-between p-3 rounded-md
                          hover:bg-slate-50 transition-colors cursor-pointer
                          ${pathname === item.href ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                        onClick={() => handleItemClick(item.href, item.external)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center">
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-slate-900">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {pathname === item.href && (
                            <Badge variant="default" className="text-xs bg-blue-600">
                              Activo
                            </Badge>
                          )}
                          {item.external ? (
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Acciones rápidas */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-700">Acciones Rápidas</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/studio/placeholder')}
              className="justify-start"
            >
              <Palette className="h-4 w-4 mr-2" />
              Editor QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/studio/global')}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Config Global
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StudioAccordion;