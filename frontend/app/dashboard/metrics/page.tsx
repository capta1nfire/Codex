"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import PerformanceChart from './components/performance-chart';
import BarcodeTypeMetrics from './components/barcode-type-metrics';
import CacheMetricsTable from './components/cache-metrics-table';

// Datos simulados para desarrollo
const SAMPLE_METRICS = {
  by_barcode_type: {
    qr: {
      avg_cache_hit_ms: 0.5,
      avg_generation_ms: 2.3,
      max_hit_ms: 1,
      max_generation_ms: 5,
      hit_count: 15,
      miss_count: 3,
      avg_data_size: 24,
      cache_hit_rate_percent: 83.3
    },
    code128: {
      avg_cache_hit_ms: 0.3,
      avg_generation_ms: 1.7,
      max_hit_ms: 0.8,
      max_generation_ms: 3,
      hit_count: 9,
      miss_count: 6,
      avg_data_size: 18,
      cache_hit_rate_percent: 60.0
    }
  },
  overall: {
    avg_response_ms: 1.2,
    max_response_ms: 5,
    total_requests: 33,
    cache_hit_rate_percent: 72.7
  },
  timestamp: "2025-04-09T20:02:00.440633-07:00"
};

// Definir una interfaz para las métricas
interface MetricsData {
  by_barcode_type: {
    [key: string]: {
      avg_cache_hit_ms: number;
      avg_generation_ms: number;
      max_hit_ms: number;
      max_generation_ms: number;
      hit_count: number;
      miss_count: number;
      avg_data_size: number;
      cache_hit_rate_percent: number;
    }
  };
  overall: {
    avg_response_ms: number;
    max_response_ms: number;
    total_requests: number;
    cache_hit_rate_percent: number;
  };
  cache_stats?: {
    hits: number;
    misses: number;
    cache_hit_rate_percent: number;
    cache_size: number;
  };
  timestamp: string;
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar los datos de métricas
  const fetchMetrics = async () => {
    setRefreshing(true);
    
    try {
      // Primero intentamos con el endpoint real del backend Node.js
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await fetch(`${backendUrl}/metrics`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Limpiar el timeout si la solicitud completa antes
        
        if (response.ok) {
          const rawData = await response.json();
          console.log('Datos recibidos del servicio Node.js:', rawData);
          
          // Usar directamente los datos ya que tienen el formato esperado
          setMetrics(rawData);  
          setLastUpdated(new Date().toLocaleTimeString() + ' (datos reales)');
          setIsLoading(false);
          setRefreshing(false);
          return; // Salimos de la función si todo está bien
        }
      } catch (connectionError) {
        console.warn('No se pudo conectar al servicio Node:', connectionError);
        // Continuamos con los datos de muestra
      }
      
      // Si fallamos al conectar o hay error, usamos los datos de muestra
      console.info('Usando datos de muestra para el dashboard');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular retraso
      setMetrics(SAMPLE_METRICS);
      setLastUpdated(new Date().toLocaleTimeString() + ' (datos de muestra)');
      
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar métricas al montar el componente
  useEffect(() => {
    fetchMetrics();
    
    // Actualizar automáticamente cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Estado de carga
  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard de Métricas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-[180px] rounded-lg" />
          <Skeleton className="h-[180px] rounded-lg" />
          <Skeleton className="h-[180px] rounded-lg" />
        </div>
        
        <Skeleton className="h-8 w-[400px] rounded-md mb-6" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Última actualización: {lastUpdated}
            </span>
          )}
          <Button 
            onClick={fetchMetrics} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
      </div>
      
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total de Solicitudes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.overall.total_requests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Cache Hit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.overall.cache_hit_rate_percent.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tiempo Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{metrics.overall.avg_response_ms.toFixed(2)} ms</p>
              </CardContent>
            </Card>
          </div>

          {metrics.cache_stats && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Caché</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hits</p>
                      <p className="text-2xl font-semibold">{metrics.cache_stats.hits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Misses</p>
                      <p className="text-2xl font-semibold">{metrics.cache_stats.misses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tamaño del Caché</p>
                      <p className="text-2xl font-semibold">{metrics.cache_stats.cache_size} entradas</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tasa de Cache Hit</p>
                      <p className="text-2xl font-semibold text-green-600">{metrics.cache_stats.cache_hit_rate_percent.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="byType">Por Tipo</TabsTrigger>
              <TabsTrigger value="detailed">Detalles</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento General</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <PerformanceChart metrics={metrics} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="byType" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas por Tipo de Código</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <BarcodeTypeMetrics metrics={metrics} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="detailed" className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Datos Detallados</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <CacheMetricsTable metrics={metrics} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}