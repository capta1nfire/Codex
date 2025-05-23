'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
const formatSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Análisis de Rendimiento (Servicio Rust)</CardTitle>
        <CardDescription>
          Métricas de caché y rendimiento de generación de códigos. Actualizado cada 60s.
          {/* Usar 'timestamp' en lugar de 'last_updated_at' */}
          {analyticsData &&
            ` Última act: ${new Date(analyticsData.timestamp).toLocaleTimeString()}`}
        </CardDescription>
        {/* Usar text-destructive para error */}
        {error && !isLoading && <p className="mt-2 text-sm text-destructive">Error: {error}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            {/* Usar text-muted-foreground para carga */}
            <p className="text-muted-foreground animate-pulse">
              Cargando análisis de rendimiento...
            </p>
          </div>
        ) : !analyticsData ? (
          <></>
        ) : (
          <div className="space-y-6">
            {/* Sección de Estadísticas Globales (usando 'overall') */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas Globales (Overall)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  {/* Usar text-muted-foreground */}
                  <span className="font-medium text-muted-foreground">
                    Peticiones Totales:
                  </span>{' '}
                  {analyticsData.overall.total_requests}
                </div>
                <div>
                  {/* Usar text-muted-foreground */}
                  <span className="font-medium text-muted-foreground">Cache Hit Rate:</span>{' '}
                  {formatPercentage(analyticsData.overall.cache_hit_rate_percent)}
                </div>
                <div>
                  {/* Usar text-muted-foreground */}
                  <span className="font-medium text-muted-foreground">Ø Duración Resp.:</span>{' '}
                  {formatDuration(analyticsData.overall.avg_response_ms)}
                </div>
                <div>
                  {/* Usar text-muted-foreground */}
                  <span className="font-medium text-muted-foreground">
                    Máx Duración Resp.:
                  </span>{' '}
                  {formatDuration(analyticsData.overall.max_response_ms)}
                </div>
                {/* Podríamos añadir más datos de 'overall' si los hubiera */}
              </CardContent>
            </Card>

            {/* Sección de Rendimiento por Tipo (usando 'by_barcode_type') */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento por Tipo de Código</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Hits</TableHead>
                      <TableHead className="text-right">Misses</TableHead>
                      <TableHead className="text-right">Hit Rate</TableHead>
                      <TableHead className="text-right">Ø Dur. Hit</TableHead>
                      <TableHead className="text-right">Ø Dur. Miss</TableHead>
                      <TableHead className="text-right">Ø Tamaño</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Usar 'by_barcode_type' y acceder a sus propiedades */}
                    {Object.entries(analyticsData.by_barcode_type).map(([type, stats]) => (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell className="text-right">{stats.hit_count}</TableCell>
                        <TableCell className="text-right">{stats.miss_count}</TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(stats.cache_hit_rate_percent)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDuration(stats.avg_cache_hit_ms)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDuration(stats.avg_generation_ms)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatSize(stats.avg_data_size)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
