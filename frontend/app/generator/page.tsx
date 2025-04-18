"use client"; // Necesario para usar hooks como useState y manejar eventos

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaz para el error estructurado devuelto por el backend
interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
  details?: Array<{
    msg: string;
    param: string;
    location: string;
    value?: string;
  }>;
}

// Modal componente
function HealthModal({ isOpen, onClose, healthData }: { isOpen: boolean; onClose: () => void; healthData: any }) {
  if (!isOpen || !healthData) return null;

  // Calcular tiempo activo
  const minutes = Math.floor(healthData.uptime / 60);
  const seconds = Math.floor(healthData.uptime % 60);
  
  // Determinar colores para estado
  const getStatusColor = (status: string) => {
    return status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Estado del Sistema</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Estado general - ahora con el mismo estilo que las otras secciones */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-2">API Gateway</h4>
            <div className="flex items-center">
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData.status)}`}>
                {healthData.status.toUpperCase()}
              </div>
              <span className="ml-2 text-xs text-gray-500">{healthData.service}</span>
            </div>
          </div>
          
          {/* Servicio Rust - mantiene su estilo */}
          {healthData.dependencies?.rust_service && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-2">Servicio Rust</h4>
              <div className="flex items-center">
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData.dependencies.rust_service.status)}`}>
                  {healthData.dependencies.rust_service.status.toUpperCase()}
                </div>
                <span className="ml-2 text-xs text-gray-500">servicio-generador</span>
                {healthData.dependencies.rust_service.error && (
                  <span className="ml-2 text-xs text-red-500">{healthData.dependencies.rust_service.error}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Información del sistema - ahora con el mismo fondo que los otros */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-2">Información del Sistema</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Tiempo activo:</div>
              <div className="font-mono">{minutes}m {seconds}s</div>
              
              {healthData.memoryUsage && (
                <>
                  <div className="text-gray-500">Memoria (proceso):</div>
                  <div className="font-mono">{healthData.memoryUsage.processUsage}</div>
                  
                  <div className="text-gray-500">Memoria total:</div>
                  <div className="font-mono">{healthData.memoryUsage.total}</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GeneratorRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-500">Redirigiendo al generador...</p>
    </div>
  );
}