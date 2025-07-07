/**
 * StudioSidebar - Navigation Sidebar for QR Studio
 * 
 * Navegación lateral para las diferentes secciones de QR Studio
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Settings,
  Palette,
  FileText,
  Zap,
  ArrowLeft,
  Database,
  Shield,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/studio',
    icon: Settings,
    description: 'Vista general y estadísticas',
  },
  {
    name: 'Configuración Global',
    href: '/studio/global',
    icon: Database,
    description: 'Valores por defecto para todos los QR',
  },
  {
    name: 'Editor de Placeholder',
    href: '/studio/placeholder',
    icon: Palette,
    description: 'Personalizar QR de ejemplo',
  },
  {
    name: 'Plantillas',
    href: '/studio/templates',
    icon: FileText,
    description: 'Configurar plantillas por dominio',
  },
  {
    name: 'Efectos y Estilos',
    href: '/studio/effects',
    icon: Zap,
    description: 'Gestionar efectos visuales',
  },
  {
    name: 'Permisos',
    href: '/studio/permissions',
    icon: Shield,
    description: 'Configurar acceso Premium',
  },
];

export function StudioSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900">QR Studio</h2>
          <Link
            href="/"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Volver al generador"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-start px-3 py-2 rounded-lg transition-colors group',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 mr-3 mt-0.5 flex-shrink-0',
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <div className="flex-1">
                  <div className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-blue-700' : 'text-slate-900'
                  )}>
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Modo SuperAdmin</p>
              <p className="text-xs text-amber-700 mt-1">
                Cambios afectan a todos los usuarios
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}