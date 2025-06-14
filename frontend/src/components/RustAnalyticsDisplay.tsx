'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';

// --- Interfaces ajustadas para coincidir con la respuesta real de Rust ---

interface TypePerformance {
  avg_cache_hit_ms: number | null; // Puede ser null si hit_count es 0
  avg_generation_ms: number | null; // Puede ser null si miss_count es 0
  max_hit_ms: number;
  max_generation_ms: number;
  hit_count: number;
  miss_count: number;
  avg_data_size: number | null; // Coincide con JSON, puede ser null
  cache_hit_rate_percent: number;
}

interface OverallPerformance {
  avg_response_ms: number | null;
  max_response_ms: number;
  total_requests: number;
  cache_hit_rate_percent: number;
}

interface RustAnalyticsData {
  by_barcode_type: {
    [key: string]: TypePerformance; // Clave es el tipo de código (e.g., "qrcode")
  };
  overall: OverallPerformance;
  timestamp: string; // Coincide con JSON
}

// --- NUEVO: Interfaces para monitoreo en tiempo real ---
interface RequestTracker {
  timestamp: number;
  requestsInLastMinute: number;
  requestsInLastHour: number;
  recentRequests: number[]; // timestamps de las últimas 60 peticiones
}

// --- Fin Interfaces Ajustadas ---

// Helper para formatear duración (maneja null)
const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || isNaN(ms)) return '-';
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

// Helper para formatear tamaño (maneja null)
// const formatSize = (bytes: number | null | undefined): string => {
//   if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
//   if (bytes < 1024) return `${bytes} B`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
// };

// Helper para formatear porcentaje (maneja null/undefined)
const formatPercentage = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined || isNaN(rate)) return '-';
  // Asumiendo que el rate de Rust ya está en porcentaje (0-100)
  return `${rate.toFixed(1)}%`;
};

export default function RustAnalyticsDisplay() {
  const [analyticsData, setAnalyticsData] = useState<RustAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // --- NUEVO: Estados para monitoreo en tiempo real ---
  const [requestTracker, setRequestTracker] = useState<RequestTracker>({
    timestamp: Date.now(),
    requestsInLastMinute: 0,
    requestsInLastHour: 0,
    recentRequests: []
  });
  const [lastTotalRequests, setLastTotalRequests] = useState<number>(0);
  const [alertLevel, setAlertLevel] = useState<'none' | 'warning' | 'critical'>('none');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- NUEVO: Función para detectar y actualizar actividad de peticiones ---
  const updateRequestActivity = (currentTotal: number) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    
    // Calcular nuevas peticiones desde la última actualización
    const newRequests = currentTotal - lastTotalRequests;
    
    setRequestTracker(prev => {
      // Agregar timestamps de nuevas peticiones
      const newTimestamps = Array(newRequests).fill(0).map(() => now);
      const allRequests = [...prev.recentRequests, ...newTimestamps];
      
      // Filtrar peticiones de la última hora
      const recentRequests = allRequests.filter(timestamp => timestamp > oneHourAgo);
      
      // Contar peticiones del último minuto
      const requestsInLastMinute = recentRequests.filter(timestamp => timestamp > oneMinuteAgo).length;
      
      // Determinar nivel de alerta
      let newAlertLevel: 'none' | 'warning' | 'critical' = 'none';
      if (requestsInLastMinute > 10) {
        newAlertLevel = 'critical'; // Más de 10 peticiones por minuto es crítico
      } else if (requestsInLastMinute > 5) {
        newAlertLevel = 'warning'; // Más de 5 por minuto es sospechoso
      }
      
      setAlertLevel(newAlertLevel);
      
      return {
        timestamp: now,
        requestsInLastMinute,
        requestsInLastHour: recentRequests.length,
        recentRequests: recentRequests.slice(-100) // Mantener solo las últimas 100
      };
    });
    
    setLastTotalRequests(currentTotal);
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const rustServiceUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL;
      if (!rustServiceUrl) {
        setError('La URL del servicio Rust no está configurada (NEXT_PUBLIC_RUST_SERVICE_URL).');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get<RustAnalyticsData>(
          `${rustServiceUrl}/analytics/performance`
        );
        setAnalyticsData(response.data);
        
        // --- NUEVO: Actualizar rastreador de actividad ---
        if (response.data.overall.total_requests !== lastTotalRequests) {
          updateRequestActivity(response.data.overall.total_requests);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching Rust analytics data:', err);
        if (!analyticsData) {
          setError('No se pudo cargar la información de rendimiento del servicio Rust.');
        } else {
          setError('Error al actualizar la información de rendimiento.');
        }
      } finally {
        if (isLoading) setIsLoading(false);
      }
    };

    fetchAnalyticsData();
    // 🚨 REDUCIDO: De 60s a 5 minutos para reducir spam crítico
    const interval = setInterval(fetchAnalyticsData, 300000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <Card className="h-full group/main hover:shadow-corporate-hero hover:shadow-corporate-blue-500/20 transition-all duration-300 border-corporate-blue-200/30 dark:border-corporate-blue-700/30 hover:border-corporate-blue-300/50 dark:hover:border-corporate-blue-600/50 hover:-translate-y-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg group-hover/main:text-corporate-blue-600 dark:group-hover/main:text-corporate-blue-400 transition-colors duration-200">
          <div className="p-1.5 bg-corporate-blue-500/10 rounded-lg group-hover/main:bg-corporate-blue-500/20 transition-colors duration-200">
            <Activity className="h-4 w-4 text-corporate-blue-600 dark:text-corporate-blue-400" />
          </div>
          Monitor de Performance
        </CardTitle>
        <CardDescription className="transition-colors duration-200 group-hover/main:text-foreground/70">
          Análisis en tiempo real del generador Rust y detección de anomalías.
          {isMounted && analyticsData && (
            <span className="block text-xs mt-1 text-corporate-blue-600/60 dark:text-corporate-blue-400/60">
              Actualizado: {new Date(analyticsData.timestamp).toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
        {error && !isLoading && <p className="mt-2 text-sm text-destructive">Error: {error}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-corporate-blue-200 dark:border-corporate-blue-700 rounded-full"></div>
                <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-corporate-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-corporate-blue-600/70 dark:text-corporate-blue-400/70 text-sm animate-pulse">
                Analizando rendimiento...
              </p>
            </div>
          </div>
        ) : !analyticsData ? (
          <></>
        ) : (
          <div className="space-y-4">
            {/* --- MEJORADO: Monitor de Actividad con Estilo Corporativo --- */}
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all duration-300",
              alertLevel === 'critical' 
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-corporate-lg" 
                : alertLevel === 'warning'
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 shadow-corporate-lg"
                : "bg-corporate-blue-50 dark:bg-corporate-blue-950/20 border-corporate-blue-200 dark:border-corporate-blue-800 shadow-corporate-lg"
            )}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Activity className={cn(
                    "h-4 w-4",
                    alertLevel === 'critical' ? "text-red-600 animate-spin" :
                    alertLevel === 'warning' ? "text-amber-600" : "text-corporate-blue-600"
                  )} />
                  Actividad en Tiempo Real
                </h4>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  alertLevel === 'critical' ? "border-red-300 text-red-700 animate-pulse" :
                  alertLevel === 'warning' ? "border-amber-300 text-amber-700" :
                  "border-corporate-blue-300 text-corporate-blue-700"
                )}>
                  {alertLevel === 'none' ? 'Normal' : alertLevel === 'warning' ? 'Alerta' : 'CRÍTICO'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <div className={cn(
                    "text-xl font-bold mb-1",
                    alertLevel === 'critical' ? "text-red-600" :
                    alertLevel === 'warning' ? "text-amber-600" : "text-corporate-blue-600"
                  )}>
                    {requestTracker.requestsInLastMinute}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Último minuto</div>
                </div>
                
                <div className="text-center p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-xl font-bold text-corporate-blue-600 mb-1">
                    {requestTracker.requestsInLastHour}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Última hora</div>
                </div>
                
                <div className="text-center p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  <div className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {analyticsData.overall.total_requests}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
                </div>
              </div>

              {/* Alerta detallada con estilo corporativo */}
              {alertLevel !== 'none' && (
                <div className={cn(
                  "p-3 rounded-lg text-xs border-l-4",
                  alertLevel === 'critical' 
                    ? "bg-red-100 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-200"
                    : "bg-amber-100 dark:bg-amber-950/30 border-amber-500 text-amber-800 dark:text-amber-200"
                )}>
                  <div className="font-semibold flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    {alertLevel === 'critical' ? 'PROBLEMA DETECTADO:' : 'ADVERTENCIA:'}
                  </div>
                  <div>
                    {alertLevel === 'critical' 
                      ? `${requestTracker.requestsInLastMinute} peticiones/min detectadas. Posible spam o auto-regeneración excesiva.`
                      : `Actividad elevada: ${requestTracker.requestsInLastMinute} peticiones/min. Monitorear para evitar saturación.`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* --- CONSOLIDADO: Métricas de Rendimiento (Eliminando duplicados) --- */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
              <h4 className="font-semibold text-sm text-corporate-blue-700 dark:text-corporate-blue-300 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Rendimiento del Sistema
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Cache Hit Rate:</span>
                    <Badge variant="outline" className="text-xs bg-corporate-blue-100 dark:bg-corporate-blue-900">
                      {formatPercentage(analyticsData.overall.cache_hit_rate_percent)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Tiempo Promedio:</span>
                    <span className="text-xs font-mono text-corporate-blue-600 dark:text-corporate-blue-400">
                      {formatDuration(analyticsData.overall.avg_response_ms)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Tiempo Máximo:</span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {formatDuration(analyticsData.overall.max_response_ms)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Tipos Activos:</span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {Object.keys(analyticsData.by_barcode_type).length} códigos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- OPTIMIZADO: Top 3 Tipos Más Usados (Información única) --- */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/40 dark:border-slate-700/40">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
                Distribución por Tipo
              </h4>
              
              <div className="space-y-2">
                {Object.entries(analyticsData.by_barcode_type)
                  .sort(([,a], [,b]) => (b.hit_count + b.miss_count) - (a.hit_count + a.miss_count))
                  .slice(0, 3)
                  .map(([type, stats], index) => (
                  <div key={type} className="flex justify-between items-center p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-corporate-blue-500' :
                        index === 1 ? 'bg-corporate-blue-400' :
                        'bg-slate-400'
                      }`}></div>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-corporate-blue-600 dark:text-corporate-blue-400">
                        {stats.hit_count + stats.miss_count}
                      </span>
                      <span className="text-xs text-slate-500">req</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
