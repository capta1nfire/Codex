/**
 * useStudioWebSocket Hook
 * 
 * Hook para gestionar conexión WebSocket con QR Studio.
 * Maneja reconexiones automáticas y sincronización en tiempo real.
 * 
 * @principle Pilar 1: Seguridad - Autenticación JWT requerida
 * @principle Pilar 2: Robustez - Manejo de reconexiones
 * @principle Pilar 3: Simplicidad - API simple para componentes
 * @principle Pilar 4: Modularidad - Hook reutilizable
 * @principle Pilar 5: Valor - Actualizaciones instantáneas
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { StudioConfig, StudioConfigType } from '@/types/studio.types';

interface StudioWebSocketHook {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  subscribeToConfig: (type: StudioConfigType, templateType?: string) => void;
  unsubscribeFromConfig: (type: StudioConfigType, templateType?: string) => void;
  requestSync: () => void;
  connectionStats: {
    reconnectAttempts: number;
    lastConnected: Date | null;
    latency: number;
  };
}

interface ConfigUpdateEvent {
  action: 'create' | 'update' | 'delete';
  config: StudioConfig | { id: string; type: StudioConfigType };
  userId: string;
  timestamp: string;
}

interface UseStudioWebSocketOptions {
  onConfigUpdate?: (event: ConfigUpdateEvent) => void;
  onSyncComplete?: (configs: StudioConfig[]) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useStudioWebSocket(_options: UseStudioWebSocketOptions = {}): StudioWebSocketHook {
  // WebSocket functionality is temporarily disabled
  // Options are prefixed with _ to indicate they're intentionally unused

  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected] = useState(false);
  const [isConnecting] = useState(false);
  const [error] = useState<string | null>(null);
  const [reconnectAttempts] = useState(0);
  const [lastConnected] = useState<Date | null>(null);
  const [latency] = useState(0);

  // Cleanup función - simplified since WebSocket is disabled
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Conectar WebSocket
  // TEMPORALMENTE DESHABILITADO: WebSocket no está completamente implementado
  // Todo el código de conexión ha sido comentado para evitar errores de tipos
  // en código que nunca se ejecuta
  const connect = useCallback(async () => {
    // WebSocket functionality is temporarily disabled
    // This is a no-op function
    return;
  }, []);

  // Suscribirse a configuración específica
  const subscribeToConfig = useCallback((type: StudioConfigType, templateType?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:config', { type, templateType });
    }
  }, []);

  // Desuscribirse de configuración
  const unsubscribeFromConfig = useCallback((type: StudioConfigType, templateType?: string) => {
    if (socketRef.current?.connected) {
      const room = templateType ? `studio:${type}:${templateType}` : `studio:${type}`;
      socketRef.current.emit('unsubscribe:config', { room });
    }
  }, []);

  // Solicitar sincronización completa - WebSocket is disabled
  const requestSync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request:sync');
    } else {
      console.warn('WebSocket is temporarily disabled');
    }
  }, []);

  // Efecto para conectar/desconectar
  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      connect();
    }

    return cleanup;
  }, [user, connect, cleanup]);

  return {
    isConnected,
    isConnecting,
    error,
    subscribeToConfig,
    unsubscribeFromConfig,
    requestSync,
    connectionStats: {
      reconnectAttempts,
      lastConnected,
      latency,
    },
  };
}