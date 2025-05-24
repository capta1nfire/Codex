'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  // Download, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';
import axios from 'axios';

interface QuickStats {
  uptime: string;
  totalRequests: number;
  hitRate: number;
}

export default function QuickActionsPanel() {
  const [stats, setStats] = useState<QuickStats | null>(null);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
        const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';

        // Fetch backend health for uptime
        const healthResponse = await axios.get(`${backendUrl}/health`);
        
        // Fetch Rust analytics for cache metrics
        const analyticsResponse = await axios.get(`${rustUrl}/analytics/performance`);

        // Format uptime
        const uptimeSeconds = healthResponse.data.uptime || 0;
        const formatUptime = (seconds: number): string => {
          const days = Math.floor(seconds / (24 * 60 * 60));
          const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
          const minutes = Math.floor((seconds % (60 * 60)) / 60);
          
          if (days > 0) return `${days}d ${hours}h`;
          if (hours > 0) return `${hours}h ${minutes}m`;
          return `${minutes}m`;
        };

        setStats({
          uptime: formatUptime(uptimeSeconds),
          totalRequests: analyticsResponse.data.overall?.total_requests || 0,
          hitRate: analyticsResponse.data.overall?.cache_hit_rate_percent || 0
        });
      } catch (error) {
        console.error('Error fetching quick stats:', error);
        // Set fallback values if APIs are unavailable
        setStats({
          uptime: 'N/A',
          totalRequests: 0,
          hitRate: 0
        });
      }
    };

    fetchQuickStats();
    const interval = setInterval(fetchQuickStats, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  const actions = [
    {
      title: 'Generar Código',
      description: 'QR o Barcode rápido',
      icon: Zap,
      href: '/',
      variant: 'default' as const
    },
    {
      title: 'API Docs',
      description: 'Documentación API',
      icon: FileText,
      href: 'http://localhost:3004/api-docs/',
      external: true,
      variant: 'outline' as const
    },
    {
      title: 'Limpiar Cache',
      description: 'Reset métricas Rust',
      icon: RefreshCw,
      action: 'clearCache',
      variant: 'outline' as const
    },
    {
      title: 'Health Check',
      description: 'Verificar servicios',
      icon: Shield,
      action: 'healthCheck',
      variant: 'outline' as const
    }
  ];

  const handleAction = async (actionType: string) => {
    switch (actionType) {
      case 'clearCache':
        try {
          const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';
          await fetch(`${rustUrl}/cache/clear`, { method: 'POST' });
          // Show success notification
          alert('✅ Cache limpiado exitosamente');
        } catch (error) {
          alert('❌ Error al limpiar cache');
        }
        break;
      case 'healthCheck':
        // Trigger health check across all services
        window.location.reload();
        break;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Acciones Rápidas
        </CardTitle>
        <CardDescription>
          Controles frecuentes y enlaces útiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            
            if (action.href) {
              return (
                <a
                  key={action.title}
                  href={action.href}
                  target={action.external ? '_blank' : '_self'}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  <Button 
                    variant={action.variant}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <IconComponent className="h-4 w-4 shrink-0" />
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                      {action.external && <ExternalLink className="h-3 w-3 shrink-0" />}
                    </div>
                  </Button>
                </a>
              );
            }

            return (
              <Button
                key={action.title}
                variant={action.variant}
                onClick={() => action.action && handleAction(action.action)}
                className="w-full justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stats Rápidas
          </h4>
          {stats ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiempo Activo:</span>
                <span className="font-mono">{stats.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Peticiones Totales:</span>
                <span className="font-mono">{stats.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasa de Acierto:</span>
                <span className={`font-mono ${stats.hitRate >= 50 ? 'text-green-600' : stats.hitRate >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {stats.hitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargando stats...</span>
                <RefreshCw className="h-3 w-3 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 