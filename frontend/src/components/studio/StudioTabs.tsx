/**
 * Studio Tabs Component
 * 
 * Componente de navegación con tabs horizontales para QR Studio
 * Organiza las secciones de manera clara y accesible
 * 
 * @principle Pilar 3: Simplicidad - Navegación intuitiva con tabs
 * @principle Pilar 4: Modularidad - Componente reutilizable
 * @principle Pilar 5: Valor - Mejor UX con navegación clara
 */

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Palette,
  FileText,
  Shield,
  Zap,
  Activity,
  Database,
  Image,
  Layout,
  Globe,
  BarChart3,
  Lock,
  Star,
  ArrowRight
} from 'lucide-react';
import { useStudio } from './StudioProvider';

interface TabSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  items: TabItem[];
}

interface TabItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  status?: 'active' | 'pending' | 'development';
}

export function StudioTabs() {
  const { configs } = useStudio();
  const router = useRouter();
  const pathname = usePathname();

  // Calcular estadísticas
  const stats = {
    global: configs.filter(c => c.type === 'GLOBAL').length,
    templates: configs.filter(c => c.type === 'TEMPLATE').length,
    placeholder: configs.filter(c => c.type === 'PLACEHOLDER').length,
  };

  const sections: TabSection[] = [
    {
      id: 'config',
      label: 'Configuración',
      icon: Settings,
      description: 'Configuraciones globales y permisos del sistema',
      color: 'blue',
      items: [
        {
          title: 'Configuración Global',
          description: 'Define los valores por defecto para todos los códigos QR del sistema',
          href: '/studio/global',
          icon: Database,
          badge: stats.global > 0 ? 'Configurado' : 'Pendiente',
          status: stats.global > 0 ? 'active' : 'pending'
        },
        {
          title: 'Permisos y Roles',
          description: 'Gestiona el acceso y permisos de los usuarios del sistema',
          href: '/studio/permissions',
          icon: Shield,
          status: 'development'
        }
      ]
    },
    {
      id: 'visual',
      label: 'Personalización',
      icon: Palette,
      description: 'Diseño visual, efectos y plantillas',
      color: 'purple',
      items: [
        {
          title: 'Editor de Placeholder',
          description: 'Personaliza el código QR de ejemplo en la página principal',
          href: '/studio/placeholder',
          icon: Image,
          badge: stats.placeholder > 0 ? 'Personalizado' : 'Por defecto',
          status: stats.placeholder > 0 ? 'active' : 'pending'
        },
        {
          title: 'Efectos y Filtros',
          description: 'Configura efectos visuales avanzados para los códigos QR',
          href: '/studio/effects',
          icon: Zap,
          status: 'development'
        },
        {
          title: 'Temas Visuales',
          description: 'Gestiona temas y estilos predefinidos',
          href: '/studio/themes',
          icon: Layout,
          status: 'development'
        }
      ]
    },
    {
      id: 'templates',
      label: 'Plantillas',
      icon: FileText,
      description: 'Gestión de plantillas por dominio',
      color: 'green',
      items: [
        {
          title: 'Editor de Plantillas',
          description: 'Crea y edita plantillas personalizadas por dominio',
          href: '/studio/templates',
          icon: FileText,
          badge: `${stats.templates} activas`,
          status: stats.templates > 0 ? 'active' : 'pending'
        },
        {
          title: 'Lista de Plantillas',
          description: 'Visualiza y gestiona todas las plantillas existentes',
          href: '/studio/templates/list',
          icon: Layout,
          status: 'active'
        },
        {
          title: 'Dominios',
          description: 'Configura reglas específicas por dominio',
          href: '/studio/domains',
          icon: Globe,
          status: 'development'
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Monitoreo',
      icon: Activity,
      description: 'Estadísticas y monitoreo del sistema',
      color: 'orange',
      items: [
        {
          title: 'Dashboard Analytics',
          description: 'Visualiza estadísticas de uso y rendimiento del sistema',
          href: '/studio/analytics',
          icon: BarChart3,
          status: 'development'
        },
        {
          title: 'Logs del Sistema',
          description: 'Revisa el historial de cambios y actividad',
          href: '/studio/logs',
          icon: Activity,
          status: 'development'
        },
        {
          title: 'Seguridad',
          description: 'Monitorea eventos de seguridad y accesos',
          href: '/studio/security',
          icon: Lock,
          status: 'development'
        }
      ]
    }
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'development':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        icon: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:border-blue-300 dark:hover:border-blue-700'
      },
      purple: {
        icon: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:border-purple-300 dark:hover:border-purple-700'
      },
      green: {
        icon: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:border-green-300 dark:hover:border-green-700'
      },
      orange: {
        icon: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:border-orange-300 dark:hover:border-orange-700'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6 h-auto p-1 bg-slate-100 dark:bg-slate-800">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const colors = getColorClasses(section.color);
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex flex-col gap-1 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900"
              >
                <IconComponent className={`h-5 w-5 ${colors.icon}`} />
                <span className="text-sm font-medium">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sections.map((section) => {
          const colors = getColorClasses(section.color);
          return (
            <TabsContent key={section.id} value={section.id} className="mt-0">
              <div className="space-y-4">
                {/* Descripción de la sección */}
                <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {section.description}
                  </p>
                </div>

                {/* Grid de items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <Card
                        key={index}
                        className={`
                          cursor-pointer transition-all duration-200 
                          hover:shadow-lg hover:scale-[1.02]
                          ${colors.border} ${colors.hover}
                          ${pathname === item.href ? `${colors.bg} ring-2 ring-offset-2 ring-${section.color}-500` : ''}
                        `}
                        onClick={() => handleNavigate(item.href)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <ItemIcon className={`h-5 w-5 ${colors.icon}`} />
                            </div>
                            {item.badge && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(item.status)}`}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.status === 'development' && (
                              <Badge variant="outline" className="text-xs">
                                En desarrollo
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base mt-3">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm">
                            {item.description}
                          </CardDescription>
                          <div className="mt-4 flex items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                            {pathname === item.href ? (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Página actual
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                                Ir a la página
                                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export default StudioTabs;