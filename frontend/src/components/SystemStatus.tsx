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

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003';
        const response = await axios.get(`${backendUrl}/health`);
        setHealthData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError('No se pudo cargar la información del sistema');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Actualizar cada 30 segundos

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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'error':
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-blue-600 animate-pulse">Cargando información del sistema...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <h3 className="font-bold">Error:</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        <p>No hay datos disponibles sobre el estado del sistema.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-md p-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Estado del Sistema</h2>
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
        <div className="border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 text-gray-700">Información del Sistema</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo activo:</span>
              <span className="font-mono">{formatUptime(healthData.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memoria Total:</span>
              <span className="font-mono">{healthData.memoryUsage.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memoria Libre:</span>
              <span className="font-mono">{healthData.memoryUsage.free}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uso de Memoria (Proceso):</span>
              <span className="font-mono">{healthData.memoryUsage.processUsage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última Actualización:</span>
              <span className="font-mono">{new Date(healthData.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 text-gray-700">Estado de Servicios</h3>

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
                <span className="text-gray-600">Tiempo activo:</span>
                <span className="font-mono">{formatUptime(healthData.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uso de memoria:</span>
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
                <div className="text-sm text-gray-600">Servicio funcionando correctamente</div>
              ) : (
                <div className="text-sm text-red-600">
                  {healthData.dependencies.rust_service.error || 'Error en el servicio'}
                </div>
              )}
            </div>
          )}

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
            <div className="text-sm text-gray-600">
              Interfaz de usuario funcionando correctamente
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-right">
        Actualización automática cada 30 segundos
      </div>
    </div>
  );
}
