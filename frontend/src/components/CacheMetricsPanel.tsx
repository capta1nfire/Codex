'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Zap, BarChart3 } from 'lucide-react';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
            <RefreshCw className="h-5 w-5 animate-pulse transition-transform duration-200 group-hover:scale-110" />
            Métricas de Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground animate-pulse">Cargando métricas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
            <RefreshCw className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            Métricas de Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No hay datos de cache disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
          <RefreshCw className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          Métricas de Cache
        </CardTitle>
        <CardDescription className="transition-colors duration-200 group-hover:text-foreground/70">
          Rendimiento y eficiencia del sistema de caché
          {isMounted && lastUpdate && (
            <span className="block text-xs mt-1 text-muted-foreground/80 transition-colors duration-200 group-hover:text-muted-foreground">
              Última act: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Stats - Enhanced with corporate blue theme and animations */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hit Rate - Primary Metric */}
            <div className="text-center p-3 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/30 rounded-lg border border-blue-200/40 hover:border-blue-300/60 transition-all duration-200 group/hit">
              <div className={`text-2xl font-bold transition-colors duration-200 ${getHitRateColor(stats.hitRate)} group-hover/hit:scale-105 transform transition-transform`}>
                {stats.hitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600/60 dark:text-blue-400/60 mb-2">Hit Rate</div>
              <div className="flex justify-center items-center gap-2">
                {stats.hitRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600 transition-transform duration-200 group-hover/hit:scale-110" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 transition-transform duration-200 group-hover/hit:scale-110" />
                )}
                <div className="transition-transform duration-200 group-hover/hit:scale-105">
                  {getHitRateBadge(stats.hitRate)}
                </div>
              </div>
            </div>

            {/* Total Requests */}
            <div className="text-center p-3 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/30 rounded-lg border border-slate-200/40 hover:border-slate-300/60 transition-all duration-200 group/requests">
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 group-hover/requests:text-slate-800 dark:group-hover/requests:text-slate-200 transition-colors duration-200 group-hover/requests:scale-105 transform transition-transform">
                {stats.totalRequests.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600/60 dark:text-slate-400/60 mb-2">Total Requests</div>
              <div className="flex justify-center">
                <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400 transition-transform duration-200 group-hover/requests:scale-110" />
              </div>
            </div>
          </div>

          {/* Response Time Card */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50/30 to-green-50/20 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-200/50 hover:border-emerald-300/50 transition-all duration-200 hover:shadow-sm group/response">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600 transition-transform duration-200 group-hover/response:scale-110" />
                <span className="text-sm font-medium">Tiempo de Respuesta Promedio</span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 group-hover/response:text-emerald-800 dark:group-hover/response:text-emerald-200 transition-colors duration-200">
                {stats.avgResponseTime.toFixed(1)}ms
              </div>
            </div>
          </div>

          {/* Top Types Section - Enhanced */}
          {stats.topTypes.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <h4 className="text-sm font-medium text-foreground/90 flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" />
                Tipos Más Populares
              </h4>
              
              <div className="space-y-2">
                {stats.topTypes.map((type, index) => (
                  <div 
                    key={type.type}
                    className="p-2.5 rounded-lg bg-gradient-to-r from-muted/30 to-muted/60 dark:from-muted/20 dark:to-muted/40 border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-sm group/type"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-emerald-500' :
                          'bg-amber-500'
                        } transition-all duration-200 group-hover/type:scale-125`}></div>
                        <span className="text-sm font-medium capitalize">{type.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {type.requests} req
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs transition-all duration-200 group-hover/type:scale-105 ${getHitRateColor(type.hitRate)}`}
                        >
                          {type.hitRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 