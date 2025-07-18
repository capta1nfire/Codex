/**
 * StudioProvider - Context Provider for QR Studio
 * 
 * Gestiona el estado global de QR Studio, incluyendo configuraciones,
 * plantillas y comunicación con el backend.
 * 
 * @principle Pilar 1: Seguridad - Validación y sanitización de datos
 * @principle Pilar 2: Robustez - Manejo exhaustivo de errores y estados
 * @principle Pilar 3: Simplicidad - API clara y directa
 * @principle Pilar 4: Modularidad - Separación de responsabilidades
 * @principle Pilar 5: Valor - Estado confiable y reactivo
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  StudioState, 
  StudioActions, 
  StudioContextValue,
  StudioConfig,
  QRConfig,
  StudioConfigType,
  TemplateType,
  DEFAULT_QR_CONFIG,
  validateStudioConfig,
  validateQRConfig
} from '@/types/studio.types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useStudioWebSocket } from '@/hooks/useStudioWebSocket';

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

interface StudioProviderProps {
  children: React.ReactNode;
}

export function StudioProvider({ children }: StudioProviderProps) {
  const { user } = useAuth();
  const [state, setState] = useState<StudioState>({
    configs: [],
    activeConfig: null,
    isLoading: false,
    error: null,
    isDirty: false,
  });
  
  // Refs para evitar múltiples llamadas
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  
  // Integrar WebSocket para sincronización en tiempo real
  const { isConnected, subscribeToConfig, requestSync } = useStudioWebSocket({
    onConfigUpdate: (event) => {
      // Actualizar estado local cuando llega una actualización
      if (event.action === 'delete') {
        setState(prev => ({
          ...prev,
          configs: prev.configs.filter(c => c.id !== event.config.id),
          activeConfig: prev.activeConfig?.id === event.config.id ? null : prev.activeConfig,
        }));
      } else {
        // Para create/update, recargar configuraciones
        loadConfigs();
      }
    },
    onSyncComplete: (configs) => {
      // Actualizar todas las configuraciones desde sincronización
      setState(prev => ({
        ...prev,
        configs,
        isLoading: false,
      }));
    },
  });
  
  // Pilar 2: Función helper para actualizar estado de forma segura
  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Pilar 1: Validación antes de establecer configuración activa
  const setActiveConfigSafe = useCallback((config: StudioConfig | null) => {
    if (config) {
      try {
        const validatedConfig = validateStudioConfig(config);
        updateState({ activeConfig: validatedConfig, isDirty: false });
      } catch (error) {
        console.error('Configuración inválida:', error);
        toast.error('La configuración seleccionada no es válida');
      }
    } else {
      updateState({ activeConfig: null, isDirty: false });
    }
  }, [updateState]);

  // Cargar configuraciones del backend con protección contra llamadas múltiples
  const loadConfigs = useCallback(async () => {
    // Pilar 2: Evitar llamadas múltiples
    if (isLoadingRef.current) {
      return;
    }
    
    // También verificar si ya hemos cargado
    if (hasLoadedRef.current && state.configs.length > 0) {
      return;
    }
    
    isLoadingRef.current = true;
    updateState({ isLoading: true, error: null });
    
    try {
      const response = await api.get<{ configs: any[] }>('/api/studio/configs');
      
      // Pilar 1: Validar datos recibidos
      const validatedConfigs = response.configs.map((config: any) => {
        try {
          return validateStudioConfig(config);
        } catch (error) {
          console.warn('Configuración inválida omitida:', config.id, error);
          return null;
        }
      }).filter(Boolean) as StudioConfig[];
      
      // Configs validated successfully
      
      updateState({
        configs: validatedConfigs,
        isLoading: false,
        error: null,
      });
      
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('[StudioProvider] Error loading configs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error cargando configuraciones';
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      
      // Pilar 5: Feedback útil al usuario
      toast.error('Error cargando configuraciones');
    } finally {
      isLoadingRef.current = false;
    }
  }, [updateState, state.configs.length]);

  // Guardar configuración con validación
  const saveConfig = useCallback(async (config: Partial<StudioConfig>) => {
    console.log('[StudioProvider] saveConfig called with:', {
      type: config.type,
      name: config.name,
      configKeys: config.config ? Object.keys(config.config) : [],
      fullConfig: JSON.stringify(config, null, 2)
    });
    
    // Pilar 1: Validar antes de enviar
    if (!config.type || !config.name || !config.config) {
      console.error('[StudioProvider] Missing required fields:', { type: config.type, name: config.name, hasConfig: !!config.config });
      toast.error('Faltan campos requeridos en la configuración');
      return;
    }
    
    // Pilar 1: Validar configuración QR
    try {
      if (config.config) {
        validateQRConfig(config.config);
        console.log('[StudioProvider] QR config validated successfully');
      }
    } catch (error) {
      console.error('[StudioProvider] QR config validation failed:', error);
      toast.error('La configuración QR contiene valores inválidos');
      return;
    }
    
    updateState({ isLoading: true, error: null });
    
    try {
      // Pilar 2: Robustez - Construir objeto completo con valores por defecto
      const configToSave = {
        ...config,
        isActive: config.isActive ?? true,
        createdById: config.createdById || user?.id || '',
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('[StudioProvider] Sending to API:', configToSave);
      
      const response = await api.post<{ config: any }>('/api/studio/configs', configToSave);
      
      console.log('[StudioProvider] API response:', response);
      
      const savedConfig = validateStudioConfig(response.config);
      
      console.log('[StudioProvider] Validated saved config:', savedConfig);
      
      // Actualizar estado con la configuración guardada
      setState(prev => {
        const updatedConfigs = prev.configs.filter(c => {
          // Comparar por tipo y templateType para actualizar el correcto
          if (savedConfig.type === StudioConfigType.TEMPLATE) {
            return !(c.type === savedConfig.type && c.templateType === savedConfig.templateType);
          }
          return c.type !== savedConfig.type;
        });
        
        const newConfigs = [...updatedConfigs, savedConfig];
        console.log('[StudioProvider] Updated configs:', newConfigs);
        console.log('[StudioProvider] State will have', newConfigs.length, 'configs');
        
        return {
          ...prev,
          configs: newConfigs,
          activeConfig: savedConfig,
          isLoading: false,
          isDirty: false,
          error: null,
        };
      });
      
      // Toast de éxito se muestra en el componente que llama a saveConfig
      // para evitar duplicación de notificaciones
    } catch (error) {
      console.error('[StudioProvider] Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error guardando configuración';
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      
      toast.error(errorMessage);
    }
  }, [updateState]);

  // Eliminar configuración
  const deleteConfig = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await api.delete(`/api/studio/configs/${id}`);
      
      setState(prev => ({
        ...prev,
        configs: prev.configs.filter(c => c.id !== id),
        activeConfig: prev.activeConfig?.id === id ? null : prev.activeConfig,
        isLoading: false,
      }));
      
      toast.success('Configuración eliminada correctamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error eliminando configuración';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      toast.error(errorMessage);
    }
  }, []);

  // Establecer configuración activa
  const setActiveConfig = useCallback((config: StudioConfig) => {
    setActiveConfigSafe(config);
  }, [setActiveConfigSafe]);
  
  // Pilar 4: Marcar como modificado cuando cambia la configuración activa
  const markAsDirty = useCallback(() => {
    updateState({ isDirty: true });
  }, [updateState]);

  // Resetear a valores por defecto
  const resetToDefaults = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await api.post('/api/studio/configs/reset');
      await loadConfigs();
      
      toast.success('Configuraciones reseteadas a valores por defecto');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error reseteando configuraciones';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      toast.error(errorMessage);
    }
  }, [loadConfigs]);

  // Aplicar configuración a todas las plantillas
  const applyToAll = useCallback(async (config: QRConfig) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await api.post('/api/studio/configs/apply-all', { config });
      await loadConfigs();
      
      toast({
        title: 'Éxito',
        description: 'Configuración aplicada a todas las plantillas',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error aplicando configuración';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      toast.error(errorMessage);
    }
  }, [loadConfigs]);

  // Helpers
  const getConfigByType = useCallback((type: StudioConfigType, templateType?: TemplateType) => {
    const config = state.configs.find(c => 
      c.type === type && 
      (!templateType || c.templateType === templateType)
    );
    return config;
  }, [state.configs]);

  const getPlaceholderConfig = useCallback((): QRConfig => {
    const placeholderConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
    return placeholderConfig?.config || DEFAULT_QR_CONFIG;
  }, [getConfigByType]);

  const getTemplateConfig = useCallback((template: TemplateType): QRConfig => {
    const templateConfig = getConfigByType(StudioConfigType.TEMPLATE, template);
    const globalConfig = getConfigByType(StudioConfigType.GLOBAL);
    
    // Merge: global -> template específico
    return {
      ...DEFAULT_QR_CONFIG,
      ...(globalConfig?.config || {}),
      ...(templateConfig?.config || {}),
    };
  }, [getConfigByType]);

  // Pilar 2: Cargar configuraciones al montar con protección
  useEffect(() => {
    // Cargar configuraciones para todos los usuarios (necesarias para el placeholder)
    // Solo SUPERADMIN puede editar, pero todos necesitan leer
    if (user && !hasLoadedRef.current && !isLoadingRef.current) {
      loadConfigs();
    }
  }, [user]); // Remove loadConfigs from deps to prevent loops
  
  // Pilar 2: Limpiar estado al desmontar
  useEffect(() => {
    return () => {
      isLoadingRef.current = false;
      hasLoadedRef.current = false;
    };
  }, []);

  const value: StudioContextValue = {
    ...state,
    loadConfigs,
    saveConfig,
    deleteConfig,
    setActiveConfig,
    resetToDefaults,
    applyToAll,
    getConfigByType,
    getPlaceholderConfig,
    getTemplateConfig,
    markAsDirty,
    canEdit: user?.role === 'SUPERADMIN', // Pilar 1: Verificación de permisos
    canDelete: user?.role === 'SUPERADMIN', // Pilar 1: Verificación de permisos
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio debe ser usado dentro de StudioProvider');
  }
  return context;
}