'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import axios from 'axios';

interface CacheStats {
  hitRate: number;
  totalRequests: number;
  avgResponseTime: number;
  topTypes: Array<{
    type: string;
    requests: number;
    hitRate: number;
  }>;
}

export default function CacheMetricsPanel() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchCacheStats = async () => {
      try {
        const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.get(`${rustUrl}/analytics/performance`);
        const data = response.data;

        // Process the data to get cache-focused metrics
        const processedStats: CacheStats = {
          hitRate: data.overall?.cache_hit_rate_percent || 0,
          totalRequests: data.overall?.total_requests || 0,
          avgResponseTime: data.overall?.avg_response_ms || 0,
          topTypes: Object.entries(data.by_barcode_type || {})
            .map(([type, stats]: [string, any]) => ({
              type,
              requests: stats.hit_count + stats.miss_count,
              hitRate: stats.cache_hit_rate_percent || 0
            }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 3)
        };

        setStats(processedStats);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching cache stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  const getHitRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    if (rate >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHitRateBadge = (rate: number) => {
    if (rate >= 70) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (rate >= 50) return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
    if (rate >= 20) return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Bajo</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Métricas de Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground text-sm">Cargando métricas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Métricas de Cache
        </CardTitle>
        <CardDescription>
          Performance de caché Rust
          {lastUpdate && (
            <span className="block text-xs mt-1">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="space-y-3">
            {/* Main Stats - Más compacto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold ${getHitRateColor(stats.hitRate)}`}>
                  {stats.hitRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Tasa de Acierto</div>
                <div className="mt-1">{getHitRateBadge(stats.hitRate)}</div>
              </div>
              
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {stats.avgResponseTime?.toFixed(1) || 0}ms
                </div>
                <div className="text-xs text-muted-foreground">Respuesta Prom</div>
                <div className="mt-1">
                  {stats.avgResponseTime < 50 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mx-auto" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-yellow-600 mx-auto" />
                  )}
                </div>
              </div>
            </div>

            {/* Requests Counter y Top Types combinados para ahorrar espacio */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Stats Rápidas</h4>
                <span className="text-lg font-semibold">{stats.totalRequests}</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peticiones Totales:</span>
                  <span className="font-mono">{stats.totalRequests}</span>
                </div>
                {stats.topTypes.slice(0, 2).map((type) => (
                  <div key={type.type} className="flex justify-between">
                    <span className="text-muted-foreground">{type.type}:</span>
                    <span className="font-mono">{type.hitRate.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cache Status Indicator compacto */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Cache activo</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 