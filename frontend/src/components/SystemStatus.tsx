'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface SystemInfo {
  total: string;
  free: string;
  processUsage: string;
}

interface ServiceStatus {
  status: string;
  uptime?: string;
  memoryUsage?: {
    total: string;
    free: string;
    processUsage: string;
  };
  url?: string;
  error?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
  uptime: number;
  memoryUsage: SystemInfo;
  dependencies?: {
    rust_service: ServiceStatus;
  };
  services?: {
    frontend?: ServiceStatus;
    backend?: ServiceStatus;
    rust?: ServiceStatus;
  };
}

export default function SystemStatus() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbUp, setDbUp] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await axios.get(`${backendUrl}/health`);
        setHealthData(response.data);
        setError(null);
        setDbUp(response.data.dependencies?.rust_service?.status === 'ok');
        setDbError(response.data.dependencies?.rust_service?.error);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('No se pudo cargar la información del sistema');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    if (isNaN(seconds)) return 'Desconocido';

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
    result += `${secs}s`;

    return result;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'ok':
        return 'bg-success text-success-foreground';
      case 'degraded':
        return 'bg-warning/10 text-warning border-warning';
      case 'error':
      case 'unavailable':
        return 'bg-destructive/10 text-destructive border-destructive';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-primary animate-pulse">Cargando información del sistema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
        <h3 className="font-bold">Error:</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="bg-warning/10 border border-warning rounded-lg p-4 text-warning">
        <p>No hay datos disponibles sobre el estado del sistema.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Estado del Sistema</h2>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(healthData.status)}`}
        >
          {healthData.status === 'ok'
            ? 'Todo Correcto'
            : healthData.status === 'degraded'
              ? 'Degradado'
              : 'Error'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">Información del Sistema</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tiempo activo:</span>
              <span className="font-mono">{formatUptime(healthData.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memoria Total:</span>
              <span className="font-mono">{healthData.memoryUsage.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memoria Libre:</span>
              <span className="font-mono">{healthData.memoryUsage.free}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uso de Memoria (Proceso):</span>
              <span className="font-mono">{healthData.memoryUsage.processUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Actualización:</span>
              <span className="font-mono">{new Date(healthData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">Estado de Servicios</h3>

          {/* Backend Service */}
          <div className="mb-4 border-b pb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">API Gateway (Backend)</span>
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor('ok')}`}
              >
                OK
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiempo activo:</span>
                <span className="font-mono">{formatUptime(healthData.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uso de memoria:</span>
                <span className="font-mono">{healthData.memoryUsage.processUsage}</span>
              </div>
            </div>
          </div>

          {/* Rust Service */}
          {healthData.dependencies?.rust_service && (
            <div className="mb-4 border-b pb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Servicio Rust</span>
                <div
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(healthData.dependencies.rust_service.status)}`}
                >
                  {healthData.dependencies.rust_service.status.toUpperCase()}
                </div>
              </div>
              {healthData.dependencies.rust_service.status === 'ok' ? (
                <div className="text-sm text-muted-foreground">
                  Servicio funcionando correctamente
                </div>
              ) : (
                <div className="text-sm text-destructive">
                  {healthData.dependencies.rust_service.error || 'Error en el servicio'}
                </div>
              )}
            </div>
          )}

          {/* Base de Datos */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Base de Datos</span>
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  dbUp === null
                    ? getStatusColor('unknown')
                    : dbUp
                      ? getStatusColor('ok')
                      : getStatusColor('error')
                }`}
              >
                {dbUp === null ? 'Cargando...' : dbUp ? 'Operativa' : 'Caída'}
              </div>
            </div>
            {dbError && <p className="text-destructive text-sm">{dbError}</p>}
          </div>

          {/* Frontend Service */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Frontend (Next.js)</span>
              <div
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor('ok')}`}
              >
                OK
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Interfaz de usuario funcionando correctamente
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground text-right">
        Actualización automática cada 60 segundos
      </div>
    </div>
  );
}
