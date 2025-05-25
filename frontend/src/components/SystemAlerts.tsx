'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, X, AlertCircle, Info } from 'lucide-react';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';

export const SystemAlerts: React.FC = () => {
  const { alerts, dismissAlert } = useSystemAlerts();
  
  const visibleAlerts = alerts.filter(alert => !alert.dismissed).slice(0, 5);

  const getAlertIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getAlertColors = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm space-y-2">
      {/* ✅ Alertas Activas */}
      {visibleAlerts.map((alert) => {
        const IconComponent = getAlertIcon(alert.type);
        const alertColors = getAlertColors(alert.type);
        
        return (
          <Card key={alert.id} className={`border shadow-lg ${alertColors}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs mt-1 break-words">{alert.message}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-2 p-1 hover:bg-black hover:bg-opacity-10 rounded flex-shrink-0"
                  title="Descartar alerta"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ✅ Indicador de más alertas */}
      {alerts.filter(alert => !alert.dismissed).length > 5 && (
        <Card className="border shadow-lg bg-gray-50 border-gray-200">
          <CardContent className="p-2 text-center">
            <div className="text-xs text-gray-600">
              +{alerts.filter(alert => !alert.dismissed).length - 5} alertas más
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemAlerts; 