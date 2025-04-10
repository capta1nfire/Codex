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

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar los datos de métricas
  const fetchMetrics = async () => {
    setRefreshing(true);
    
    try {
      // En un entorno de producción, descomentar esto:
      // const response = await fetch('http://localhost:3002/analytics/performance');
      // if (!response.ok) throw new Error('Error en la respuesta del servidor');
      // const data = await response.json();
      
      // Para desarrollo, usamos datos simulados
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular retraso
      const data = SAMPLE_METRICS;
      
      setMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
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