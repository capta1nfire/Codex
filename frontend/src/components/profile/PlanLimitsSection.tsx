'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Zap, 
  Star, 
  Check, 
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart,
} from 'lucide-react';

interface PlanLimitsSectionProps {
  user: {
    role: string;
    apiUsage: number;
    createdAt: string;
  };
  isLoading?: boolean;
}

// Configuración de planes con límites y características
const PLAN_CONFIG = {
  STARTER: {
    name: 'Plan Starter',
    icon: Star,
    color: 'bg-green-100 text-green-700 border-green-200',
    gradient: 'from-green-50 to-green-100',
    limits: {
      apiCalls: 100,
      monthlyGeneration: 50,
      bulkGeneration: 0,
      supportLevel: 'Comunidad'
    },
    features: [
      'Generación de QR básica',
      'Exportación PNG',
      'Soporte comunitario'
    ],
    restrictions: [
      'Sin exportación vectorial',
      'Sin generación en lote',
      'Sin analíticas'
    ]
  },
  PRO: {
    name: 'Plan Pro',
    icon: Zap,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    gradient: 'from-purple-50 to-purple-100',
    limits: {
      apiCalls: 5000,
      monthlyGeneration: 1000,
      bulkGeneration: 100,
      supportLevel: 'Email'
    },
    features: [
      'QR dinámicos limitados',
      'Exportación SVG/EPS',
      'Generación en lote básica',
      'Analíticas básicas',
      'Soporte por email'
    ],
    restrictions: [
      'Límites mensuales',
      'Sin white-label'
    ]
  },
  ENTERPRISE: {
    name: 'Plan Enterprise',
    icon: TrendingUp,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-slate-50 to-slate-100',
    limits: {
      apiCalls: 25000,
      monthlyGeneration: 5000,
      bulkGeneration: 1000,
      supportLevel: 'Prioritario'
    },
    features: [
      'QR dinámicos avanzados',
      'Todas las simbologías',
      'Generación en lote avanzada',
      'Analíticas completas',
      'Soporte prioritario',
      'API estándar'
    ],
    restrictions: [
      'Sin white-label completo'
    ]
  },
  ADMIN: {
    name: 'Administrador',
    icon: BarChart,
    color: 'bg-corporate-blue-100 text-corporate-blue-700 border-corporate-blue-200',
    gradient: 'from-corporate-blue-50 to-corporate-blue-100',
    limits: {
      apiCalls: 50000,
      monthlyGeneration: 10000,
      bulkGeneration: 5000,
      supportLevel: 'Técnico Dedicado'
    },
    features: [
      'Gestión de usuarios',
      'Dashboard administrativo',
      'Configuración del sistema',
      'Reportes avanzados',
      'Soporte técnico dedicado'
    ],
    restrictions: []
  },
  SUPERADMIN: {
    name: 'Super Administrador',
    icon: Shield,
    color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-300',
    gradient: 'from-yellow-50 to-amber-100',
    limits: {
      apiCalls: 'Ilimitado',
      monthlyGeneration: 'Ilimitado',
      bulkGeneration: 'Ilimitado',
      supportLevel: 'Control Total'
    },
    features: [
      'Control total del sistema',
      'Gestión de administradores',
      'Configuración avanzada',
      'Monitoreo completo',
      'Acceso a todas las funciones'
    ],
    restrictions: []
  }
};

export default function PlanLimitsSection({ user, isLoading = false }: PlanLimitsSectionProps) {
  const [usagePercentage, setUsagePercentage] = useState(0);
  
  // Mapeo de roles antiguos a nuevos para compatibilidad
  const mapRoleForPlan = (role: string): keyof typeof PLAN_CONFIG => {
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case 'USER': return 'STARTER';
      case 'PREMIUM': return 'ENTERPRISE'; 
      case 'ADVANCED': return 'PRO';
      case 'WEBADMIN': return 'ADMIN';
      case 'SUPERADMIN': return 'SUPERADMIN';
      default: return 'STARTER';
    }
  };
  
  const mappedRole = mapRoleForPlan(user.role);
  const currentPlan = PLAN_CONFIG[mappedRole];
  const IconComponent = currentPlan.icon;
  
  // Calcular porcentaje de uso
  useEffect(() => {
    if (typeof currentPlan.limits.apiCalls === 'number') {
      const percentage = Math.min((user.apiUsage / currentPlan.limits.apiCalls) * 100, 100);
      setUsagePercentage(percentage);
    }
  }, [user.apiUsage, currentPlan.limits.apiCalls]);

  // Determinar si necesita upgrade
  const needsUpgrade = usagePercentage > 80 && mappedRole === 'STARTER';
  const isNearLimit = usagePercentage > 60;

  if (isLoading) {
    return (
      <Card className="shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`
      shadow-corporate-lg border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-card/95 backdrop-blur-sm
      transition-all duration-500 ease-smooth transform
      hover:shadow-corporate-hero hover:border-corporate-blue-300/70 dark:hover:border-corporate-blue-600/70
      overflow-hidden p-0
    `}>
      <CardHeader className="bg-gradient-to-r from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border-b border-corporate-blue-200/30 dark:border-corporate-blue-700/30 rounded-t-lg m-0 py-8 px-8">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-corporate-blue-500/10 rounded-lg group-hover:bg-corporate-blue-500/20 transition-colors duration-200">
            <BarChart className="h-5 w-5 text-corporate-blue-600 dark:text-corporate-blue-400" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Plan y Límites
            </span>
            <Badge variant="secondary" className="ml-3 text-xs">
              {currentPlan.name}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400 mt-3">
          Gestiona tu plan actual y visualiza tus límites de uso y características
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8 p-8">
        {/* Plan Actual - Hero Card */}
        <div className={`
          relative p-6 rounded-xl border-2 transition-all duration-300 ease-smooth
          bg-gradient-to-br ${currentPlan.gradient}
          ${needsUpgrade ? 'border-amber-300 shadow-amber-500/20' : 'border-corporate-blue-200 shadow-corporate-blue-500/15'}
        `}>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${currentPlan.color} transition-transform duration-200 ease-smooth`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {currentPlan.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Plan actual activo
                </p>
              </div>
            </div>
            
            {mappedRole !== 'SUPERADMIN' && mappedRole !== 'ADMIN' && (
              <Button 
                variant="outline" 
                className="w-full bg-white border-2 border-corporate-blue-300 text-corporate-blue-700 hover:bg-corporate-blue-50 transition-all duration-200"
              >
                <Activity className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Button>
            )}
          </div>

          {/* Uso de API - Con alertas visuales */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Uso de API este mes
              </span>
              <div className="flex items-center gap-2">
                {isNearLimit && (
                  <AlertTriangle className={`h-4 w-4 ${needsUpgrade ? 'text-amber-500' : 'text-amber-600'}`} />
                )}
                <span className="text-sm font-mono">
                  {user.apiUsage.toLocaleString()} / {
                    typeof currentPlan.limits.apiCalls === 'number' 
                      ? currentPlan.limits.apiCalls.toLocaleString()
                      : currentPlan.limits.apiCalls
                  }
                </span>
              </div>
            </div>
            
            {typeof currentPlan.limits.apiCalls === 'number' && (
              <Progress 
                value={usagePercentage} 
                className={`h-3 transition-all duration-500 ease-smooth ${
                  needsUpgrade ? 'progress-warning' : isNearLimit ? 'progress-caution' : 'progress-normal'
                }`}
              />
            )}
            
            {needsUpgrade && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Activity className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  <strong>¡Cerca del límite!</strong> Considera actualizar tu plan para mayor capacidad.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Características del Plan */}
        <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Características Incluidas */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Características Incluidas
              </h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Límites y Restricciones */}
            {currentPlan.restrictions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-600" />
                  Restricciones
                </h4>
                <ul className="space-y-2">
                  {currentPlan.restrictions.map((restriction, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Límites Detallados */}
        <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 pt-8">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <BarChart className="h-4 w-4 text-corporate-blue-500" />
            Límites Detallados
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <div className="text-lg font-bold text-corporate-blue-600 dark:text-corporate-blue-400">
                {typeof currentPlan.limits.apiCalls === 'number' 
                  ? currentPlan.limits.apiCalls.toLocaleString()
                  : currentPlan.limits.apiCalls}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Llamadas API/mes</div>
            </div>
            <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {typeof currentPlan.limits.monthlyGeneration === 'number'
                  ? currentPlan.limits.monthlyGeneration.toLocaleString()
                  : currentPlan.limits.monthlyGeneration}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Generaciones/mes</div>
            </div>
            <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                {typeof currentPlan.limits.bulkGeneration === 'number'
                  ? currentPlan.limits.bulkGeneration.toLocaleString()
                  : currentPlan.limits.bulkGeneration}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Lote máximo</div>
            </div>
            <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {currentPlan.limits.supportLevel}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Soporte</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 