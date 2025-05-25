'use client';

import { useState, useEffect, useCallback } from 'react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  persistent: boolean;
}

interface SystemAlerts {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  hasUnreadAlerts: boolean;
  criticalAlertsCount: number;
}

export const useSystemAlerts = (): SystemAlerts => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      dismissed: false
    };

    setAlerts(prev => {
      // ✅ Avoid duplicate alerts
      const existingAlert = prev.find(alert => 
        alert.title === newAlert.title && 
        alert.message === newAlert.message && 
        !alert.dismissed
      );
      
      if (existingAlert) {
        return prev;
      }

      // ✅ Keep only last 50 alerts to prevent memory issues
      const updatedAlerts = [newAlert, ...prev].slice(0, 50);
      
      // ✅ Auto-dismiss non-persistent alerts after 10 seconds
      if (!newAlert.persistent) {
        setTimeout(() => {
          dismissAlert(newAlert.id);
        }, 10000);
      }
      
      return updatedAlerts;
    });

    // ✅ Show browser notification for critical errors
    if (alertData.type === 'error' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`CODEX: ${alertData.title}`, {
          body: alertData.message,
          icon: '/favicon.ico',
          tag: 'codex-system-alert'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`CODEX: ${alertData.title}`, {
              body: alertData.message,
              icon: '/favicon.ico',
              tag: 'codex-system-alert'
            });
          }
        });
      }
    }
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, dismissed: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const hasUnreadAlerts = alerts.some(alert => !alert.dismissed);
  const criticalAlertsCount = alerts.filter(alert => 
    alert.type === 'error' && !alert.dismissed
  ).length;

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAlerts,
    hasUnreadAlerts,
    criticalAlertsCount
  };
};

// ✅ NUEVO: Hook específico para monitoreo del sistema
export const useSystemMonitoring = () => {
  const { addAlert } = useSystemAlerts();
  const [lastSystemCheck, setLastSystemCheck] = useState<Date | null>(null);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'down'>('operational');

  const checkSystemHealth = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3004/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.ok) {
        const data = await response.json();
        setLastSystemCheck(new Date());
        
        // ✅ Check for status changes
        if (data.status !== systemStatus) {
          const previousStatus = systemStatus;
          setSystemStatus(data.status);
          
          // ✅ Alert on status degradation
          if (data.status === 'down' && previousStatus !== 'down') {
            addAlert({
              type: 'error',
              title: 'Sistema Caído',
              message: 'El sistema presenta múltiples fallas críticas. Revisar servicios inmediatamente.',
              persistent: true
            });
          } else if (data.status === 'degraded' && previousStatus === 'operational') {
            addAlert({
              type: 'warning',
              title: 'Sistema Degradado',
              message: 'Algunos servicios presentan problemas. Monitorear de cerca.',
              persistent: false
            });
          } else if (data.status === 'operational' && previousStatus !== 'operational') {
            addAlert({
              type: 'info',
              title: 'Sistema Recuperado',
              message: 'Todos los servicios han vuelto a la normalidad.',
              persistent: false
            });
          }

          // ✅ Alert on specific service failures
          if (data.dependencies) {
            Object.entries(data.dependencies).forEach(([service, status]: [string, any]) => {
              if (status.status === 'down') {
                addAlert({
                  type: 'error',
                  title: `Servicio Caído: ${service}`,
                  message: status.error || `El servicio ${service} no está disponible`,
                  persistent: true
                });
              }
            });
          }
        }
      } else {
        // ✅ Backend is not responding
        if (systemStatus !== 'down') {
          setSystemStatus('down');
          addAlert({
            type: 'error',
            title: 'Backend No Disponible',
            message: `Error HTTP ${response.status}: No se puede conectar al backend`,
            persistent: true
          });
        }
      }
    } catch (error: any) {
      // ✅ Network or other errors
      if (systemStatus !== 'down') {
        setSystemStatus('down');
        addAlert({
          type: 'error',
          title: 'Error de Conectividad',
          message: `No se puede verificar el estado del sistema: ${error.message}`,
          persistent: true
        });
      }
    }
  }, [addAlert, systemStatus]);

  useEffect(() => {
    // ✅ Initial check
    checkSystemHealth();
    
    // ✅ Check every 15 seconds
    const interval = setInterval(checkSystemHealth, 15000);
    
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  return {
    lastSystemCheck,
    systemStatus,
    checkSystemHealth
  };
}; 