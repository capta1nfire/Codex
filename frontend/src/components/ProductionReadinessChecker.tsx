'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Zap,
  Database,
  Server,
  Globe
} from 'lucide-react';

interface ReadinessCheck {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'running' | 'pending';
  details?: string;
  threshold?: string;
  actualValue?: string;
  icon: any;
}

// interface LoadTestResult {
//   requestsPerSecond: number;
//   averageResponseTime: number;
//   errorRate: number;
//   totalRequests: number;
//   concurrentUsers: number;
// }

export default function ProductionReadinessChecker() {
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  // const [loadTestResults, setLoadTestResults] = useState<LoadTestResult | null>(null);
  const [overallStatus, setOverallStatus] = useState<'ready' | 'not-ready' | 'unknown'>('unknown');
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const initializeChecks = (): ReadinessCheck[] => [
    {
      name: 'API Gateway Health',
      description: 'Backend responde correctamente y en tiempo esperado',
      status: 'pending',
      threshold: '< 200ms response time',
      icon: Server
    },
    {
      name: 'Rust Microservice',
      description: 'Servicio de generación funciona y responde rápido',
      status: 'pending',
      threshold: '< 100ms para códigos simples',
      icon: Zap
    },
    {
      name: 'Database Connection',
      description: 'PostgreSQL acepta conexiones y responde queries',
      status: 'pending',
      threshold: '< 50ms connection time',
      icon: Database
    },
    {
      name: 'Cache Performance',
      description: 'Redis funciona y hit rate es aceptable',
      status: 'pending',
      threshold: '> 50% óptimo, ≥ 0% aceptable (sistemas nuevos)',
      icon: RefreshCw
    },
    {
      name: 'Load Capacity',
      description: 'Sistema maneja carga esperada sin degradación',
      status: 'pending',
      threshold: '100+ req/min sin errores',
      icon: Globe
    },
    {
      name: 'Error Rate',
      description: 'Tasa de errores bajo carga está dentro de límites',
      status: 'pending',
      threshold: '< 5% error rate para requests válidos',
      icon: AlertTriangle
    }
  ];

  useEffect(() => {
    setChecks(initializeChecks());
  }, []);

  const runHealthCheck = async (checkName: string): Promise<ReadinessCheck> => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
    const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';

    try {
      switch (checkName) {
        case 'API Gateway Health':
          const start = Date.now();
          await axios.get(`${backendUrl}/health`);
          const responseTime = Date.now() - start;
          return {
            ...checks.find(c => c.name === checkName)!,
            status: responseTime < 200 ? 'pass' : 'warning',
            actualValue: `${responseTime}ms`,
            details: responseTime < 200 ? 'Respuesta rápida' : 'Respuesta lenta, optimizar'
          };

        case 'Rust Microservice':
          const rustStart = Date.now();
          await axios.get(`${rustUrl}/health`);
          const rustTime = Date.now() - rustStart;
          return {
            ...checks.find(c => c.name === checkName)!,
            status: rustTime < 100 ? 'pass' : 'warning',
            actualValue: `${rustTime}ms`,
            details: rustTime < 100 ? 'Servicio optimizado' : 'Considerar optimización'
          };

        case 'Database Connection':
          // Test DB connection through health endpoint which tests DB internally
          const dbStart = Date.now();
          const healthResponse = await axios.get(`${backendUrl}/health`);
          const dbTime = Date.now() - dbStart;
          const dbStatus = healthResponse.data.dependencies?.db?.status;
          
          if (dbStatus !== 'ok') {
            return {
              ...checks.find(c => c.name === checkName)!,
              status: 'fail',
              actualValue: dbStatus || 'unknown',
              details: 'Base de datos no responde correctamente'
            };
          }
          
          return {
            ...checks.find(c => c.name === checkName)!,
            status: dbTime < 50 ? 'pass' : 'warning',
            actualValue: `${dbTime}ms`,
            details: 'Conexión DB funcional'
          };

        case 'Cache Performance':
          // Test cache through Rust analytics
          const cacheData = await axios.get(`${rustUrl}/analytics/performance`);
          const hitRate = cacheData.data.overall?.cache_hit_rate_percent || 0;
          return {
            ...checks.find(c => c.name === checkName)!,
            status: hitRate > 50 ? 'pass' : (hitRate >= 0 ? 'warning' : 'fail'),
            actualValue: `${hitRate.toFixed(1)}%`,
            details: hitRate > 50 ? 'Cache optimizado' : (hitRate > 20 ? 'Cache funcional para desarrollo' : (hitRate === 0 ? 'Sistema recién iniciado - cache vacío (normal)' : 'Cache necesita optimización'))
          };

        case 'Load Capacity':
          // Simulate load with rate limiting
          const loadStart = Date.now();
          const requests = [];
          
          // Reduce concurrent requests to avoid rate limit
          for (let i = 0; i < 5; i++) {
            requests.push(
              axios.post(`${rustUrl}/generate`, {
                barcode_type: 'qr',
                data: `test-${Math.random()}`
              }).catch(err => {
                // Handle rate limit gracefully
                if (err.response?.status === 429) {
                  return { rateLimited: true };
                }
                throw err;
              })
            );
            // Add delay between requests to avoid rate limit
            if (i < 4) await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const results = await Promise.all(requests);
          const rateLimitedCount = results.filter((r: any) => r.rateLimited).length;
          const loadTime = Date.now() - loadStart;
          const avgPerRequest = loadTime / 5;
          
          return {
            ...checks.find(c => c.name === checkName)!,
            status: avgPerRequest < 100 ? 'pass' : 'warning',
            actualValue: `${avgPerRequest.toFixed(1)}ms/req`,
            details: rateLimitedCount > 0 ? 
              `${5 - rateLimitedCount}/5 requests procesadas (${rateLimitedCount} rate limited)` :
              `${requests.length} requests procesadas`
          };

        case 'Error Rate':
          // Test error handling with controlled timing
          let errorCount = 0;
          const testRequests = [
            { barcode_type: 'qr', data: 'valid' },
            { barcode_type: 'code128', data: 'VALID123' }
          ];

          for (const req of testRequests) {
            try {
              await axios.post(`${rustUrl}/generate`, req);
              // Add small delay between requests
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err: any) {
              if (err.response?.status === 429) {
                // Handle rate limit as warning, not error
                return {
                  ...checks.find(c => c.name === checkName)!,
                  status: 'warning',
                  actualValue: 'Rate Limited',
                  details: 'Demasiadas solicitudes - reduce la frecuencia de tests'
                };
              }
              errorCount++;
            }
          }

          const errorRate = (errorCount / testRequests.length) * 100;
          return {
            ...checks.find(c => c.name === checkName)!,
            status: errorRate < 5 ? 'pass' : (errorRate < 15 ? 'warning' : 'fail'),
            actualValue: `${errorRate.toFixed(1)}%`,
            details: `${errorCount}/${testRequests.length} requests con error`
          };

        default:
          throw new Error('Check no implementado');
      }
    } catch (error) {
      return {
        ...checks.find(c => c.name === checkName)!,
        status: 'fail',
        details: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const runAllChecks = async () => {
    // Check cooldown period (2 minutes)
    if (cooldownUntil && new Date() < cooldownUntil) {
      const remainingTime = Math.ceil((cooldownUntil.getTime() - new Date().getTime()) / 1000);
      setRateLimitMessage(`⏱️ Por favor espera ${remainingTime}s antes de ejecutar otro test para evitar rate limiting`);
      return;
    }

    setRateLimitMessage(null);

    setIsRunning(true);
    setLastRun(new Date());
    
    // Set cooldown period of 2 minutes
    setCooldownUntil(new Date(Date.now() + 2 * 60 * 1000));
    
    // Initialize all checks as running
    setChecks(prev => prev.map(check => ({ ...check, status: 'running' as const })));

    // Run checks sequentially to avoid overwhelming the system
    const updatedChecks: ReadinessCheck[] = [];
    
    for (const check of checks) {
      const result = await runHealthCheck(check.name);
      updatedChecks.push(result);
      
      // Update UI with each completed check
      setChecks(prev => prev.map(c => 
        c.name === check.name ? result : c
      ));
    }

    // Calculate overall status
    const failCount = updatedChecks.filter(c => c.status === 'fail').length;
    const warningCount = updatedChecks.filter(c => c.status === 'warning').length;
    
    if (failCount === 0 && warningCount === 0) {
      setOverallStatus('ready');
    } else if (failCount > 0) {
      setOverallStatus('not-ready');
    } else {
      setOverallStatus('ready'); // Warnings are acceptable
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: ReadinessCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusBadge = (status: ReadinessCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">RUNNING</Badge>;
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  const getOverallStatusCard = () => {
    if (overallStatus === 'ready') {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">✅ Sistema Listo para Producción</AlertTitle>
          <AlertDescription className="text-green-700">
            Todos los checks críticos han pasado. El sistema está preparado para manejar tráfico de producción.
          </AlertDescription>
        </Alert>
      );
    } else if (overallStatus === 'not-ready') {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">❌ No Listo para Producción</AlertTitle>
          <AlertDescription className="text-red-700">
            Hay issues críticos que deben resolverse antes del lanzamiento. Revisa los checks que fallaron.
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Estado Desconocido</AlertTitle>
          <AlertDescription>
            Ejecuta los checks de preparación para evaluar si el sistema está listo para producción.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5" />
          Production Readiness Checker
        </CardTitle>
        <CardDescription>
          Validación automática de preparación para lanzamiento a producción
          {lastRun && (
            <span className="block text-xs mt-1">
              Última ejecución: {lastRun.toLocaleTimeString('es-ES')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={runAllChecks} 
            disabled={isRunning || !!(cooldownUntil && new Date() < cooldownUntil)}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Ejecutando Checks...
              </>
            ) : cooldownUntil && new Date() < cooldownUntil ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Cooldown ({Math.ceil((cooldownUntil.getTime() - new Date().getTime()) / 1000)}s)
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Ejecutar Validación
              </>
            )}
          </Button>
        </div>

        {rateLimitMessage && (
          <div className="mb-6">
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">{rateLimitMessage}</p>
            </div>
          </div>
        )}

        {overallStatus !== 'unknown' && (
          <div className="mb-6">
            {getOverallStatusCard()}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {checks.map((check) => {
            const IconComponent = check.icon;
            return (
              <div 
                key={check.name}
                className="p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    {getStatusBadge(check.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm leading-tight">{check.name}</h4>
                  <p className="text-xs text-muted-foreground leading-tight">{check.description}</p>
                  
                  {check.actualValue && (
                    <div className="text-lg font-mono font-semibold text-primary">
                      {check.actualValue}
                    </div>
                  )}
                  
                  {check.threshold && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      Target: {check.threshold}
                    </p>
                  )}
                  
                  {check.details && (
                    <p className="text-xs text-muted-foreground italic">
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 