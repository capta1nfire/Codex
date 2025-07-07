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
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { StudioConfig, StudioConfigType } from '@/types/studio.types';
import toast from 'react-hot-toast';

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

export function useStudioWebSocket(options: UseStudioWebSocketOptions = {}): StudioWebSocketHook {
  const {
    onConfigUpdate,
    onSyncComplete,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const { user, getAccessToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [latency, setLatency] = useState(0);

  // Cleanup función
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Conectar WebSocket
  const connect = useCallback(async () => {
    // TEMPORALMENTE DESHABILITADO: WebSocket no está completamente implementado
    return;
    
    // Solo SuperAdmin puede conectarse
    if (!user || user.role !== 'SUPERADMIN') {
      return;
    }

    // Evitar conexiones múltiples
    if (isConnecting || isConnected || socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }

      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', {
        path: '/ws/studio',
        auth: { token },
        transports: ['websocket'],
        reconnection: false, // Manejamos reconexión manualmente
      });

      // Eventos de conexión
      socket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setLastConnected(new Date());
        setReconnectAttempts(0);
        setError(null);
        toast.success('Conectado a Studio WebSocket');
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Servidor cerró la conexión
          setError('Desconectado por el servidor');
        }
        
        // Intentar reconectar si está habilitado
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectDelay);
        }
      });

      socket.on('connect_error', (err) => {
        setIsConnecting(false);
        setError(err.message);
        
        if (err.message === 'Insufficient permissions') {
          toast.error('Permisos insuficientes para Studio WebSocket');
          cleanup();
        }
      });

      // Eventos de Studio
      socket.on('config:update', (event: ConfigUpdateEvent) => {
        if (onConfigUpdate) {
          onConfigUpdate(event);
        }
        
        // Mostrar notificación según la acción
        const actionText = {
          create: 'creada',
          update: 'actualizada',
          delete: 'eliminada',
        }[event.action];
        
        toast.success(`Configuración ${actionText}`);
      });

      socket.on('sync:complete', (data: { configs: StudioConfig[]; timestamp: string }) => {
        if (onSyncComplete) {
          onSyncComplete(data.configs);
        }
      });

      socket.on('subscribed', (data: { room: string; type: string; templateType?: string }) => {
        console.log(`Suscrito a: ${data.room}`);
      });

      // Medir latencia
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          const start = Date.now();
          socket.emit('ping');
          socket.once('pong', () => {
            setLatency(Date.now() - start);
          });
        }
      }, 5000);

      socket.on('disconnect', () => {
        clearInterval(pingInterval);
      });

      socketRef.current = socket;
    } catch (err) {
      setIsConnecting(false);
      setError(err instanceof Error ? err.message : 'Error conectando WebSocket');
      // toast.error('Error conectando a Studio WebSocket');
    }
  }, [
    user,
    getAccessToken,
    isConnecting,
    isConnected,
    autoReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
    onConfigUpdate,
    onSyncComplete,
    cleanup,
  ]);

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

  // Solicitar sincronización completa
  const requestSync = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('request:sync');
    } else {
      toast.error('No hay conexión WebSocket activa');
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