'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    const interval = setInterval(fetchAnalyticsData, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <Card className="h-full group/main hover:shadow-md hover:shadow-primary/5 transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg group-hover/main:text-primary transition-colors duration-200">
          <RefreshCw className="h-5 w-5 transition-transform duration-200 group-hover/main:scale-110" />
          Métricas de Performance
        </CardTitle>
        <CardDescription className="transition-colors duration-200 group-hover:text-foreground/70">
          Métricas de caché y rendimiento de generación de códigos. Actualizado cada 60s.
          {isMounted && analyticsData && (
            <span className="block text-xs mt-1 transition-colors duration-200 group-hover:text-muted-foreground">
              Última act: {new Date(analyticsData.timestamp).toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
        {error && !isLoading && <p className="mt-2 text-sm text-destructive">Error: {error}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground animate-pulse">
              Cargando análisis de rendimiento...
            </p>
          </div>
        ) : !analyticsData ? (
          <></>
        ) : (
          <div className="space-y-3">
            {/* Main Stats - Más enfocado en métricas clave */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-950/10 dark:to-slate-900/20 rounded-lg border border-border/30 hover:border-border/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group/requests">
                <div className="text-2xl font-bold text-foreground group-hover/requests:text-foreground transition-all duration-200 group-hover/requests:scale-105">
                  {analyticsData.overall.total_requests}
                </div>
                <div className="text-xs text-muted-foreground/70 mb-2">Peticiones Totales</div>
                <div className="flex justify-center">
                  <RefreshCw className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover/requests:scale-110" />
                </div>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-950/10 dark:to-slate-900/20 rounded-lg border border-border/30 hover:border-border/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group/cache">
                <div className="text-2xl font-bold text-foreground transition-all duration-200 group-hover/cache:scale-105">
                  {formatPercentage(analyticsData.overall.cache_hit_rate_percent)}
                </div>
                <div className="text-xs text-muted-foreground/70 mb-2">Eficiencia Cache</div>
                <div className="flex justify-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse transition-transform duration-200 group-hover/cache:scale-125"></div>
                </div>
              </div>
            </div>

            {/* Performance Stats consolidado */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-card/50 to-card/80 hover:from-card/80 hover:to-card/100 border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group/performance">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm transition-colors duration-200 group-hover/performance:text-primary">Métricas de Rendimiento</h4>
                <RefreshCw className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover/performance:scale-110 group-hover/performance:text-primary" />
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground transition-colors duration-200 group-hover/performance:text-foreground/70">Respuesta Promedio:</span>
                  <span className="font-mono transition-colors duration-200 group-hover/performance:text-primary">{formatDuration(analyticsData.overall.avg_response_ms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground transition-colors duration-200 group-hover/performance:text-foreground/70">Respuesta Máxima:</span>
                  <span className="font-mono transition-colors duration-200 group-hover/performance:text-primary">{formatDuration(analyticsData.overall.max_response_ms)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground transition-colors duration-200 group-hover/performance:text-foreground/70">Tipos Activos:</span>
                  <span className="font-mono transition-colors duration-200 group-hover/performance:text-primary">{Object.keys(analyticsData.by_barcode_type).length} códigos</span>
                </div>
              </div>
            </div>

            {/* Top Types - Solo cantidad de requests, sin duplicar hit rates */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-card/50 to-card/80 hover:from-card/80 hover:to-card/100 border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group/distribution">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm transition-colors duration-200 group-hover/distribution:text-primary">Distribución por Tipo</h4>
                <div className="text-xs text-muted-foreground transition-colors duration-200 group-hover/distribution:text-foreground/70">
                  Top 3 más usados
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                {Object.entries(analyticsData.by_barcode_type)
                  .sort(([,a], [,b]) => (b.hit_count + b.miss_count) - (a.hit_count + a.miss_count))
                  .slice(0, 3)
                  .map(([type, stats], index) => (
                  <div key={type} className="flex justify-between p-1 rounded transition-colors duration-200 group-hover/distribution:bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-transform duration-200 group-hover/distribution:scale-125 ${
                        index === 0 ? 'bg-slate-400 animate-pulse' :
                        index === 1 ? 'bg-slate-500 animate-pulse' :
                        'bg-slate-600 animate-pulse'
                      }`}></div>
                      <span className="text-muted-foreground font-mono transition-colors duration-200 group-hover/distribution:text-foreground/80">{type}:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono transition-colors duration-200 group-hover/distribution:text-primary">{stats.hit_count + stats.miss_count} req</span>
                      <span className="font-mono text-muted-foreground transition-colors duration-200 group-hover/distribution:text-foreground/80">{stats.hit_count}</span>
                      <span className="text-muted-foreground transition-colors duration-200 group-hover/distribution:text-foreground/60">/</span>
                      <span className="font-mono text-muted-foreground transition-colors duration-200 group-hover/distribution:text-foreground/80">{stats.miss_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Indicator compacto */}
            <div className="p-2 rounded-lg bg-gradient-to-br from-card/50 to-card/80 hover:from-card/80 hover:to-card/100 border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 group/status">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse transition-transform duration-200 group-hover/status:scale-125"></div>
                <span className="text-muted-foreground transition-colors duration-200 group-hover/status:text-foreground/70">Rust service analytics</span>
                {isMounted && analyticsData && (
                  <span className="ml-auto font-mono text-muted-foreground transition-colors duration-200 group-hover/status:text-primary">
                    {new Date(analyticsData.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
