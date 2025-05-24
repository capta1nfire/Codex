'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Database, Monitor, Zap } from 'lucide-react';

interface SystemInfo {
  total: string;
  free: string;
  processUsage: string;
}

interface ServiceStatus {
  status: string;
  uptime?: string;
  memoryUsage?: {
    total: string;
    free: string;
    processUsage: string;
  };
  url?: string;
  error?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  uptime: number;
  memoryUsage: SystemInfo;
  dependencies?: {
    rust_service: ServiceStatus;
  };
  services?: {
    frontend?: ServiceStatus;
    backend?: ServiceStatus;
    rust?: ServiceStatus;
  };
}

export default function SystemStatus() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbUp, setDbUp] = useState<boolean | null>(null);
  // const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await axios.get(`${backendUrl}/health`);
        setHealthData(response.data);
        setError(null);
        setDbUp(response.data.dependencies?.rust_service?.status === 'ok');
        // setDbError(response.data.dependencies?.rust_service?.error);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('No se pudo cargar la información del sistema');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    if (isNaN(seconds)) return 'Desconocido';

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
    result += `${secs}s`;

    return result;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
        return <Badge variant="outline" className="!bg-green-50 !text-green-800 !border-green-200">Operativo</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="!bg-yellow-100 !text-yellow-800 !border-yellow-200">Degradado</Badge>;
      case 'error':
      case 'unavailable':
        return <Badge variant="outline" className="!bg-red-100 !text-red-800 !border-red-200">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5 animate-pulse" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground text-sm">Cargando información...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <h3 className="font-bold">Error:</h3>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-warning">
            <p className="text-sm">No hay datos disponibles sobre el estado del sistema.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Monitor className="h-5 w-5" />
          Estado del Sistema
        </CardTitle>
        <CardDescription>
          Información del sistema y estado de servicios
          <span className="block text-xs mt-1">
            Actualizado: {new Date(healthData.timestamp).toLocaleTimeString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Stats - Estilo CacheMetrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${healthData.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {healthData.status === 'ok' ? '✓' : '✗'}
              </div>
              <div className="text-xs text-muted-foreground">Estado</div>
              <div className="mt-1">{getStatusBadge(healthData.status)}</div>
            </div>
            
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatUptime(healthData.uptime)}
              </div>
              <div className="text-xs text-muted-foreground">Tiempo Activo</div>
              <div className="mt-1">
                <Server className="h-4 w-4 text-blue-600 mx-auto" />
              </div>
            </div>
          </div>

          {/* System Stats compacto */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Info del Sistema</h4>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memoria Total:</span>
                <span className="font-mono">{healthData.memoryUsage.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uso Proceso:</span>
                <span className="font-mono">{healthData.memoryUsage.processUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memoria Libre:</span>
                <span className="font-mono">{healthData.memoryUsage.free}</span>
              </div>
            </div>
          </div>

          {/* Services Status compacto */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Servicios</h4>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Backend:</span>
                <Badge variant="outline" className="!bg-green-50 !text-green-800 !border-green-200 text-xs py-0">OK</Badge>
              </div>
              
              {healthData.dependencies?.rust_service && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rust:</span>
                  {getStatusBadge(healthData.dependencies.rust_service.status)}
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database:</span>
                {dbUp === null ? (
                  <Badge variant="outline" className="text-xs py-0">Loading...</Badge>
                ) : dbUp ? (
                  <Badge variant="outline" className="!bg-green-50 !text-green-800 !border-green-200 text-xs py-0">UP</Badge>
                ) : (
                  <Badge variant="outline" className="!bg-red-100 !text-red-800 !border-red-200 text-xs py-0">DOWN</Badge>
                )}
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frontend:</span>
                <Badge variant="outline" className="!bg-green-50 !text-green-800 !border-green-200 text-xs py-0">OK</Badge>
              </div>
            </div>
          </div>

          {/* Status Indicator compacto */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${healthData.status === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-muted-foreground">
                {healthData.status === 'ok' ? 'Sistema operativo' : 'Sistema con problemas'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
