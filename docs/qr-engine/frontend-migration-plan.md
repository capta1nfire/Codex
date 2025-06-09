# Plan de Migración Frontend - QR Engine v2

## 📋 Resumen Ejecutivo
Plan integral para migrar el frontend del motor de generación QR antiguo al nuevo QR Engine v2, incluyendo actualización de endpoints, nuevas características de personalización, y reemplazo completo de estadísticas en el dashboard.

## 🎯 Objetivos
1. **Migración completa** del frontend al QR Engine v2
2. **Exponer nuevas capacidades** de personalización avanzada
3. **Reemplazar estadísticas** del motor antiguo con métricas v2
4. **Mejorar UX** con preview en tiempo real y feedback de rendimiento
5. **Mantener compatibilidad** durante la transición

## 📊 Fases de Implementación

### Fase 1: Preparación y Análisis (2-3 horas)
**Objetivo**: Mapear todos los puntos de integración y preparar la migración

#### Tareas:
1. **Auditoría de código actual**
   - [ ] Identificar todos los usos de `/api/generate`
   - [ ] Mapear componentes que usan generación QR
   - [ ] Documentar estructura actual de requests/responses
   - [ ] Revisar estadísticas actuales en dashboard

2. **Análisis de compatibilidad**
   - [ ] Comparar schemas old vs v2
   - [ ] Identificar breaking changes
   - [ ] Planear estrategia de migración gradual

3. **Documentación técnica**
   - [ ] Crear mapping de endpoints old → v2
   - [ ] Documentar nuevas opciones de personalización
   - [ ] Preparar guía de migración para el equipo

### Fase 2: Actualización de API Client (3-4 horas)
**Objetivo**: Crear nueva capa de API para QR Engine v2

#### Implementación:

1. **Crear nuevo módulo API** (`frontend/src/lib/api/qrEngineV2.ts`)
```typescript
interface QrEngineV2Api {
  // Generación principal
  generate: (request: QrRequestV2) => Promise<QrOutputV2>;
  
  // Batch processing
  generateBatch: (requests: QrRequestV2[]) => Promise<BatchResponse>;
  
  // Validación
  validate: (data: string, options?: QrOptions) => Promise<ValidationResult>;
  
  // Preview en tiempo real
  preview: (request: QrRequestV2) => Promise<PreviewResponse>;
  
  // Cache management
  cache: {
    getStats: () => Promise<CacheStats>;
    clear: (pattern?: string) => Promise<ClearResult>;
    warm: (patterns: string[]) => Promise<WarmResult>;
  };
  
  // Analytics
  getPerformanceMetrics: () => Promise<PerformanceMetrics>;
}
```

2. **Definir tipos TypeScript**
```typescript
interface QrRequestV2 {
  data: string;
  size: number;
  customization?: QrCustomization;
}

interface QrCustomization {
  // Formas básicas
  eyeShape?: 'square' | 'circle' | 'rounded';
  dataPattern?: 'square' | 'dots' | 'rounded';
  
  // Colores
  foregroundColor?: string;
  backgroundColor?: string;
  eyeColor?: string;
  
  // Características avanzadas
  gradient?: GradientOptions;
  logo?: LogoOptions;
  frame?: FrameOptions;
  effects?: EffectOptions[];
}

interface QrOutputV2 {
  data: string; // SVG content
  format: 'svg' | 'png';
  metadata: {
    generationTimeMs: number;
    complexityLevel: 'basic' | 'medium' | 'advanced' | 'ultra';
    featuresUsed: string[];
    qualityScore: number;
    cached: boolean;
  };
}
```

3. **Implementar adaptador de migración**
```typescript
// Adapter para mantener compatibilidad
class QrApiAdapter {
  async generateWithFallback(request: any): Promise<any> {
    try {
      // Intentar v2 primero
      return await qrEngineV2.generate(this.adaptRequestToV2(request));
    } catch (error) {
      // Fallback a API antigua si falla
      console.warn('Falling back to legacy API', error);
      return await legacyApi.generate(request);
    }
  }
}
```

### Fase 3: Actualización de Hooks (3-4 horas)
**Objetivo**: Migrar hooks de React para usar nueva API

#### Archivos a actualizar:
1. **`useBarcodeGeneration.ts`** → **`useQrGenerationV2.ts`**
```typescript
export const useQrGenerationV2 = () => {
  const [stats, setStats] = useState<GenerationStats>();
  
  const generateQr = useCallback(async (request: QrRequestV2) => {
    const startTime = performance.now();
    
    try {
      const response = await qrEngineV2.generate(request);
      
      // Actualizar estadísticas locales
      setStats(prev => ({
        totalGenerated: (prev?.totalGenerated || 0) + 1,
        averageTime: calculateAverage(prev, response.metadata.generationTimeMs),
        cacheHitRate: response.metadata.cached ? 
          updateCacheHitRate(prev) : prev?.cacheHitRate || 0,
        lastGenerationTime: response.metadata.generationTimeMs
      }));
      
      return response;
    } catch (error) {
      // Manejo de errores mejorado
      throw new QrGenerationError(error);
    }
  }, []);
  
  // Funciones adicionales
  const validateData = useCallback(async (data: string) => {
    return await qrEngineV2.validate(data);
  }, []);
  
  const previewQr = useCallback(async (request: QrRequestV2) => {
    return await qrEngineV2.preview(request);
  }, []);
  
  return {
    generateQr,
    validateData,
    previewQr,
    stats,
    isLoading,
    error
  };
};
```

2. **`useQRContentGeneration.ts`** - Actualizar para nuevas opciones
3. **`useBarcodeTypes.ts`** - Mantener pero marcar QR para usar v2

### Fase 4: Actualización de Componentes UI (4-5 horas)
**Objetivo**: Exponer nuevas capacidades de personalización

#### Componentes nuevos/actualizados:

1. **`AdvancedQrCustomizer.tsx`**
```typescript
interface Props {
  value: QrCustomization;
  onChange: (customization: QrCustomization) => void;
  showPreview?: boolean;
}

export const AdvancedQrCustomizer: React.FC<Props> = ({ 
  value, 
  onChange,
  showPreview = true 
}) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Básico</TabsTrigger>
        <TabsTrigger value="colors">Colores</TabsTrigger>
        <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        <TabsTrigger value="effects">Efectos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic">
        <BasicCustomization value={value} onChange={onChange} />
      </TabsContent>
      
      <TabsContent value="colors">
        <ColorCustomization value={value} onChange={onChange} />
      </TabsContent>
      
      <TabsContent value="advanced">
        <AdvancedFeatures value={value} onChange={onChange} />
      </TabsContent>
      
      <TabsContent value="effects">
        <VisualEffects value={value} onChange={onChange} />
      </TabsContent>
      
      {showPreview && (
        <QrPreviewPanel customization={value} />
      )}
    </Tabs>
  );
};
```

2. **`QrGenerationMetrics.tsx`**
```typescript
export const QrGenerationMetrics: React.FC = () => {
  const { stats } = useQrGenerationV2();
  const { cacheStats } = useCacheStats();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Tiempo de Generación"
        value={`${stats?.lastGenerationTime || 0}ms`}
        trend={calculateTrend(stats?.averageTime)}
        icon={<Clock className="h-4 w-4" />}
      />
      
      <MetricCard
        title="Cache Hit Rate"
        value={`${(cacheStats?.hitRate || 0).toFixed(1)}%`}
        subtitle={`${cacheStats?.hits || 0} hits / ${cacheStats?.misses || 0} misses`}
        icon={<Database className="h-4 w-4" />}
      />
      
      <MetricCard
        title="QR Generados"
        value={formatNumber(stats?.totalGenerated || 0)}
        subtitle="Última hora"
        icon={<QrCode className="h-4 w-4" />}
      />
    </div>
  );
};
```

3. **Actualizar `PreviewSection.tsx`**
   - Añadir preview en tiempo real
   - Mostrar nivel de complejidad
   - Indicador de cache hit/miss

### Fase 5: Migración del Dashboard (4-5 horas)
**Objetivo**: Reemplazar completamente estadísticas antiguas con métricas v2

#### Cambios en Dashboard:

1. **Nuevo Dashboard Layout** (`app/dashboard/page.tsx`)
```typescript
export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Métricas principales v2 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">QR Engine v2 Metrics</h2>
        <QrEngineMetrics />
      </section>
      
      {/* Performance Analytics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Performance Analytics</h2>
        <PerformanceCharts />
      </section>
      
      {/* Cache Statistics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Distributed Cache</h2>
        <CacheStatistics />
      </section>
      
      {/* System Health */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">System Health</h2>
        <SystemHealthMonitor />
      </section>
    </DashboardLayout>
  );
}
```

2. **`QrEngineMetrics.tsx`** - Panel principal de métricas
```typescript
const QrEngineMetrics = () => {
  const { data: metrics } = useQuery({
    queryKey: ['qr-engine-metrics'],
    queryFn: qrEngineV2.getPerformanceMetrics,
    refetchInterval: 5000 // Actualizar cada 5 segundos
  });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Throughput */}
      <MetricCard
        title="Throughput"
        value={`${metrics?.throughput || 0} QR/s`}
        chart={<SparklineChart data={metrics?.throughputHistory} />}
        status={getThroughputStatus(metrics?.throughput)}
      />
      
      {/* Response Time */}
      <MetricCard
        title="Response Time"
        value={`${metrics?.avgResponseTime || 0}ms`}
        subtitle={`P95: ${metrics?.p95ResponseTime}ms`}
        chart={<ResponseTimeChart data={metrics?.responseTimeHistory} />}
        status={getResponseTimeStatus(metrics?.avgResponseTime)}
      />
      
      {/* Complexity Distribution */}
      <MetricCard
        title="Complexity Mix"
        chart={<PieChart data={metrics?.complexityDistribution} />}
        subtitle="Last 1000 requests"
      />
      
      {/* Error Rate */}
      <MetricCard
        title="Success Rate"
        value={`${(metrics?.successRate || 0).toFixed(2)}%`}
        status={metrics?.successRate > 99.5 ? 'success' : 'warning'}
        chart={<SuccessRateChart data={metrics?.successRateHistory} />}
      />
    </div>
  );
};
```

3. **`CacheStatistics.tsx`** - Panel de cache Redis
```typescript
const CacheStatistics = () => {
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: qrEngineV2.cache.getStats,
    refetchInterval: 10000
  });
  
  const clearCache = useMutation({
    mutationFn: qrEngineV2.cache.clear,
    onSuccess: () => {
      queryClient.invalidateQueries(['cache-stats']);
      toast.success('Cache cleared successfully');
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redis Cache Performance</CardTitle>
        <CardDescription>
          Distributed cache statistics and management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Hit Rate Gauge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cache Hit Rate</p>
              <p className="text-2xl font-bold">
                {(cacheStats?.hitRate || 0).toFixed(1)}%
              </p>
            </div>
            <CircularProgress value={cacheStats?.hitRate || 0} />
          </div>
          
          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Memory Usage</span>
              <span>{formatBytes(cacheStats?.memoryBytes || 0)}</span>
            </div>
            <Progress 
              value={(cacheStats?.memoryBytes || 0) / (1024 * 1024 * 100) * 100} 
              className="h-2"
            />
          </div>
          
          {/* Key Statistics */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Statistic
              label="Total Keys"
              value={formatNumber(cacheStats?.totalKeys || 0)}
            />
            <Statistic
              label="Hits"
              value={formatNumber(cacheStats?.hits || 0)}
            />
            <Statistic
              label="Misses"
              value={formatNumber(cacheStats?.misses || 0)}
            />
          </div>
          
          {/* Cache Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearCache.mutate()}
              disabled={clearCache.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => warmCache.mutate(defaultPatterns)}
            >
              <Flame className="h-4 w-4 mr-2" />
              Warm Cache
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

4. **Charts y visualizaciones**
   - Response time histogram
   - Throughput timeline
   - Cache hit rate gauge
   - Complexity distribution pie chart
   - Error rate trends

### Fase 6: Testing y Validación (3-4 horas)
**Objetivo**: Asegurar migración sin problemas

#### Testing Plan:

1. **Unit Tests**
   - [ ] Tests para nuevo API client
   - [ ] Tests para hooks v2
   - [ ] Tests para adaptadores

2. **Integration Tests**
   - [ ] E2E tests para generación QR
   - [ ] Tests de fallback a API antigua
   - [ ] Tests de manejo de errores

3. **Performance Tests**
   - [ ] Comparar tiempos old vs v2
   - [ ] Validar mejoras de cache
   - [ ] Stress test con alta concurrencia

4. **User Acceptance Tests**
   - [ ] Validar todas las personalizaciones
   - [ ] Verificar preview en tiempo real
   - [ ] Confirmar estadísticas correctas

### Fase 7: Despliegue y Migración (2-3 horas)
**Objetivo**: Lanzamiento controlado

#### Estrategia de despliegue:

1. **Feature Flag Implementation**
```typescript
const QR_ENGINE_V2_ENABLED = process.env.NEXT_PUBLIC_QR_ENGINE_V2 === 'true';

export const useQrGeneration = QR_ENGINE_V2_ENABLED 
  ? useQrGenerationV2 
  : useLegacyQrGeneration;
```

2. **Rollout progresivo**
   - 10% usuarios → validar métricas
   - 50% usuarios → monitorear errores
   - 100% usuarios → migración completa

3. **Monitoreo post-deploy**
   - Error rates
   - Performance metrics
   - User feedback
   - Cache efficiency

### Fase 8: Limpieza y Optimización (2 horas)
**Objetivo**: Remover código legacy

1. **Después de validación completa**
   - [ ] Remover endpoints antiguos
   - [ ] Eliminar componentes legacy
   - [ ] Limpiar tipos no usados
   - [ ] Actualizar documentación

2. **Optimizaciones finales**
   - [ ] Bundle size optimization
   - [ ] Lazy loading de features avanzadas
   - [ ] Cache de componentes pesados

## 📅 Timeline Estimado

| Fase | Duración | Dependencias |
|------|----------|--------------|
| Fase 1: Preparación | 2-3 horas | - |
| Fase 2: API Client | 3-4 horas | Fase 1 |
| Fase 3: Hooks | 3-4 horas | Fase 2 |
| Fase 4: UI Components | 4-5 horas | Fase 3 |
| Fase 5: Dashboard | 4-5 horas | Fase 3 |
| Fase 6: Testing | 3-4 horas | Fases 2-5 |
| Fase 7: Despliegue | 2-3 horas | Fase 6 |
| Fase 8: Limpieza | 2 horas | Fase 7 |

**Total estimado: 23-32 horas**

## 🎯 Criterios de Éxito

1. **Funcionalidad**
   - ✅ Todas las generaciones QR funcionan con v2
   - ✅ Nuevas personalizaciones disponibles
   - ✅ Preview en tiempo real funcional

2. **Performance**
   - ✅ Tiempo de generación < 50ms (P95)
   - ✅ Cache hit rate > 80%
   - ✅ Zero downtime durante migración

3. **User Experience**
   - ✅ UI intuitiva para personalizaciones
   - ✅ Feedback visual de performance
   - ✅ Dashboard con métricas en tiempo real

4. **Calidad**
   - ✅ 100% test coverage en código nuevo
   - ✅ Zero errores críticos post-deploy
   - ✅ Documentación actualizada

## 🚀 Beneficios Esperados

1. **Performance**
   - 10x mejora en tiempo de generación (cached)
   - 5x mejora en throughput
   - 80% reducción en CPU usage

2. **Features**
   - Gradientes personalizables
   - Logos embebidos
   - Marcos decorativos
   - Efectos visuales
   - Validación mejorada

3. **Operaciones**
   - Métricas en tiempo real
   - Cache management
   - Better error handling
   - Performance insights

4. **Developer Experience**
   - TypeScript types actualizados
   - API más limpia
   - Mejor documentación
   - Testing mejorado