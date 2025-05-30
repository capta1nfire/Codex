'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Zap, BarChart3, Settings, Trash2 } from 'lucide-react';
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

interface CacheMetricsPanelProps {
  isAdvancedMode?: boolean;
}

export default function CacheMetricsPanel({ isAdvancedMode }: CacheMetricsPanelProps) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isConfigMode, setIsConfigMode] = useState(false);

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
    const interval = setInterval(fetchCacheStats, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const getHitRateColor = (rate: number) => {
    if (rate >= 70) return 'text-corporate-blue-700 dark:text-corporate-blue-300';
    if (rate >= 50) return 'text-corporate-blue-600 dark:text-corporate-blue-400';
    if (rate >= 20) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHitRateBadge = (rate: number) => {
    if (rate >= 70) return <Badge className="bg-corporate-blue-100 text-corporate-blue-700 dark:bg-corporate-blue-900 dark:text-corporate-blue-300">Excelente</Badge>;
    if (rate >= 50) return <Badge className="bg-corporate-blue-100 text-corporate-blue-700 dark:bg-corporate-blue-800 dark:text-corporate-blue-300">Bueno</Badge>;
    if (rate >= 20) return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Crítico</Badge>;
  };

  // ✅ Función para limpiar cache
  const handleClearCache = async () => {
    try {
      const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';
      await fetch(`${rustUrl}/cache/clear`, { method: 'POST' });
      
      // Mostrar feedback visual exitoso
      alert('✅ Cache limpiado exitosamente');
      
      // Actualizar métricas inmediatamente
      setIsLoading(true);
      setTimeout(() => {
        const fetchCacheStats = async () => {
          try {
            const response = await axios.get(`${rustUrl}/analytics/performance`);
            const data = response.data;
            
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
      }, 1000);
      
    } catch (error) {
      alert('❌ Error al limpiar cache');
      console.error('Error clearing cache:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full group/main hover:shadow-corporate-hero hover:shadow-corporate-blue-500/20 transition-all duration-300 border-corporate-blue-200/30 dark:border-corporate-blue-700/30 hover:border-corporate-blue-300/50 dark:hover:border-corporate-blue-600/50 hover:-translate-y-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg group-hover/main:text-corporate-blue-600 dark:group-hover/main:text-corporate-blue-400 transition-colors duration-200">
            <div className="p-1.5 bg-corporate-blue-500/10 rounded-lg">
              <RefreshCw className="h-4 w-4 text-corporate-blue-600 dark:text-corporate-blue-400 animate-pulse" />
            </div>
            Cache & Optimización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-corporate-blue-200 dark:border-corporate-blue-700 rounded-full"></div>
                <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-corporate-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-corporate-blue-600/70 dark:text-corporate-blue-400/70 text-sm animate-pulse">
                Analizando cache...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="h-full group/main hover:shadow-corporate-hero hover:shadow-corporate-blue-500/20 transition-all duration-300 border-corporate-blue-200/30 dark:border-corporate-blue-700/30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-corporate-blue-600 dark:text-corporate-blue-400">
            <div className="p-1.5 bg-corporate-blue-500/10 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </div>
            Cache & Optimización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-600 dark:text-slate-400">
            <p className="text-sm">No hay datos de cache disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full group/main hover:shadow-corporate-hero hover:shadow-corporate-blue-500/20 transition-all duration-300 border-corporate-blue-200/30 dark:border-corporate-blue-700/30 hover:border-corporate-blue-300/50 dark:hover:border-corporate-blue-600/50 hover:-translate-y-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg group-hover/main:text-corporate-blue-600 dark:group-hover/main:text-corporate-blue-400 transition-colors duration-200">
              <div className="p-1.5 bg-corporate-blue-500/10 rounded-lg group-hover/main:bg-corporate-blue-500/20 transition-colors duration-200">
                <Zap className="h-4 w-4 text-corporate-blue-600 dark:text-corporate-blue-400" />
              </div>
              Cache & Optimización
            </CardTitle>
            <CardDescription className="transition-colors duration-200 group-hover/main:text-foreground/70">
              Eficiencia del sistema de caché y optimizaciones automáticas.
              {isMounted && lastUpdate && (
                <span className="block text-xs mt-1 text-corporate-blue-600/60 dark:text-corporate-blue-400/60">
                  Actualizado: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          
          {/* Control de Configuración Avanzada */}
          {isAdvancedMode && (
            <button
              onClick={() => setIsConfigMode(!isConfigMode)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-corporate-blue-200/50 dark:border-corporate-blue-700/50 bg-corporate-blue-50/50 dark:bg-corporate-blue-950/50 hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600 hover:bg-corporate-blue-100/50 dark:hover:bg-corporate-blue-900/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 group/settings"
              title="Configuración de cache"
            >
              <Settings className="h-4 w-4 text-corporate-blue-600 dark:text-corporate-blue-400 transition-all duration-200 group-hover/settings:rotate-90" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Panel de Configuración Avanzada */}
        {isAdvancedMode && isConfigMode && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-corporate-blue-700 dark:text-corporate-blue-300 mb-3">
              <Settings className="h-4 w-4" />
              Gestión de Cache
            </h4>
            
            <button
              onClick={handleClearCache}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-50/80 to-red-100/50 dark:from-red-950/30 dark:to-red-900/40 border border-red-200/50 hover:border-red-300/70 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 group/clear mb-4"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4 transition-transform duration-200 group-hover/clear:scale-110" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm text-red-700 dark:text-red-300">
                  Limpiar Cache Completo
                </div>
                <div className="text-xs text-red-600/70 dark:text-red-400/70">
                  Resetear métricas y optimizaciones
                </div>
              </div>
            </button>
            
            <div className="border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30 mb-4"></div>
          </div>
        )}
        
        <div className="space-y-4">
          {/* Métrica Principal: Hit Rate (Único y prominente) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-corporate-blue-50/50 to-slate-50/50 dark:from-corporate-blue-950/50 dark:to-slate-950/50 border border-corporate-blue-200/40 dark:border-corporate-blue-700/40">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-corporate-blue-600 dark:text-corporate-blue-400" />
                <span className="text-sm font-semibold text-corporate-blue-700 dark:text-corporate-blue-300">
                  Eficiencia de Cache
                </span>
              </div>
              <div className={`text-3xl font-bold mb-2 ${getHitRateColor(stats.hitRate)}`}>
                {stats.hitRate.toFixed(1)}%
              </div>
              <div className="flex justify-center items-center gap-2">
                {stats.hitRate >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-corporate-blue-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                )}
                {getHitRateBadge(stats.hitRate)}
              </div>
            </div>
          </div>

          {/* Métricas Secundarias Optimizadas */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/40 dark:border-slate-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiempo de Respuesta</span>
                </div>
                <div className="text-lg font-mono font-semibold text-corporate-blue-600 dark:text-corporate-blue-400">
                  {stats.avgResponseTime.toFixed(1)}ms
                </div>
              </div>
            </div>
          </div>

          {/* Distribución por Tipos - Solo información única (sin duplicar requests totales) */}
          {stats.topTypes.length > 0 && (
            <div className="pt-3 border-t border-corporate-blue-200/30 dark:border-corporate-blue-700/30">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-corporate-blue-500" />
                Top Cache Performance
              </h4>
              
              <div className="space-y-2">
                {stats.topTypes.map((type, index) => (
                  <div 
                    key={type.type}
                    className="p-3 rounded-lg bg-white/60 dark:bg-slate-700/60 border border-slate-200/40 dark:border-slate-600/40 hover:border-corporate-blue-300/50 dark:hover:border-corporate-blue-600/50 transition-all duration-200 hover:shadow-md group/type"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-corporate-blue-500' :
                          index === 1 ? 'bg-corporate-blue-400' :
                          'bg-slate-400'
                        } transition-all duration-200 group-hover/type:scale-125`}></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{type.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs transition-all duration-200 group-hover/type:scale-105 ${getHitRateColor(type.hitRate)}`}
                        >
                          {type.hitRate.toFixed(1)}% cache
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