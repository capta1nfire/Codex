'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Database, Monitor, Zap, Globe, TrendingUp } from 'lucide-react';

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

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await axios.get(`${backendUrl}/health`);
        setHealthData(response.data);
        setError(null);
        setDbUp(response.data.dependencies?.rust_service?.status === 'ok');
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

  if (isLoading) {
    return (
      <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
            <Monitor className="h-5 w-5 animate-pulse transition-transform duration-200 group-hover:scale-110" />
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
      <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
            <Monitor className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
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
      <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
            <Monitor className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
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
    <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
          <Monitor className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          Estado del Sistema
        </CardTitle>
        <CardDescription className="transition-colors duration-200 group-hover:text-foreground/70">
          Información del sistema y estado de servicios
          <span className="block text-xs mt-1 text-muted-foreground/80 transition-colors duration-200 group-hover:text-muted-foreground">
            Actualizado: {new Date(healthData.timestamp).toLocaleTimeString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Stats - Enhanced with corporate blue theme and subtle animations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg border border-border/40 hover:border-border/60 transition-all duration-200 group/status">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  healthData.status === 'ok' 
                    ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm animate-pulse' 
                    : 'bg-red-500 shadow-red-500/50 shadow-sm'
                }`}></div>
                <div className={`text-lg font-bold transition-all duration-200 ${
                  healthData.status === 'ok' 
                    ? 'text-emerald-600 group-hover/status:text-emerald-700' 
                    : 'text-red-600'
                }`}>
                  {healthData.status === 'ok' ? 'OPERATIVO' : 'ERROR'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground/70 mb-2">Estado General</div>
              <div className="flex justify-center">
                {healthData.status === 'ok' ? (
                  <Zap className="h-4 w-4 text-emerald-600 transition-transform duration-200 group-hover/status:scale-110" />
                ) : (
                  <Monitor className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/30 rounded-lg border border-blue-200/40 hover:border-blue-300/60 transition-all duration-200 group/uptime">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200 group-hover/uptime:text-blue-700 dark:group-hover/uptime:text-blue-300">
                {formatUptime(healthData.uptime)}
              </div>
              <div className="text-xs text-blue-600/60 dark:text-blue-400/60 mb-2">Tiempo Activo</div>
              <div className="flex justify-center">
                <Server className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-hover/uptime:scale-110" />
              </div>
            </div>
          </div>

          {/* Enhanced Services Section - Following Corporate Blue Theme */}
          <div className="pt-3 border-t border-border/50">
            <h4 className="text-sm font-medium text-foreground/90 flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" />
              Servicios del Sistema
            </h4>
            
            {/* Memory Card - Corporate Blue Theme */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-950/30 border border-slate-200/50 hover:border-blue-300/50 transition-all duration-200 hover:shadow-sm group/mem mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-hover/mem:scale-110" />
                  <span className="text-sm font-medium">Memoria RAM</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-blue-700 dark:text-blue-300">
                    {healthData.memoryUsage.processUsage}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthData.memoryUsage.free} libre de {healthData.memoryUsage.total}
                  </div>
                </div>
              </div>
            </div>

            {/* Service Status Cards */}
            <div className="space-y-2">
              {/* Frontend Service */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50/30 to-green-50/20 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-200/50 hover:border-emerald-300/50 transition-all duration-200 hover:shadow-sm group/frontend">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600 transition-transform duration-200 group-hover/frontend:scale-110" />
                    <span className="text-sm font-medium">Frontend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-emerald-600">OPERATIVO</span>
                  </div>
                </div>
              </div>

              {/* Backend Service */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-violet-50/30 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/50 hover:border-violet-300/50 transition-all duration-200 hover:shadow-sm group/backend">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-violet-600 transition-transform duration-200 group-hover/backend:scale-110" />
                    <span className="text-sm font-medium">Backend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-emerald-600">OPERATIVO</span>
                  </div>
                </div>
              </div>

              {/* Rust Generator Service */}
              {healthData.dependencies?.rust_service && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50/30 to-yellow-50/20 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/50 hover:border-amber-300/50 transition-all duration-200 hover:shadow-sm group/rust">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600 transition-transform duration-200 group-hover/rust:scale-110" />
                      <span className="text-sm font-medium">Rust Generator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        healthData.dependencies.rust_service.status === 'ok' 
                          ? 'bg-emerald-500 animate-pulse' 
                          : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-bold ${
                        healthData.dependencies.rust_service.status === 'ok' 
                          ? 'text-emerald-600' 
                          : 'text-red-600'
                      }`}>
                        {healthData.dependencies.rust_service.status === 'ok' ? 'OPERATIVO' : 'ERROR'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Database Service */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-50/30 to-teal-50/20 dark:from-cyan-950/30 dark:to-teal-950/20 border border-cyan-200/50 hover:border-cyan-300/50 transition-all duration-200 hover:shadow-sm group/db">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-600 transition-transform duration-200 group-hover/db:scale-110" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      dbUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-sm font-bold ${
                      dbUp ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {dbUp === null ? 'CARGANDO...' : dbUp ? 'OPERATIVO' : 'ERROR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
