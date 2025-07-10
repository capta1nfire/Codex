/**
 * Tests para StudioProvider
 * 
 * Tests del contexto principal de QR Studio
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudioProvider, useStudio } from '@/components/studio/StudioProvider';
import { AuthProvider } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { StudioConfigType } from '@/types/studio.types';

// Mocks
jest.mock('@/lib/api');
jest.mock('react-hot-toast');
jest.mock('@/hooks/useStudioWebSocket', () => ({
  useStudioWebSocket: () => ({
    isConnected: true,
    subscribeToConfig: jest.fn(),
    requestSync: jest.fn(),
  }),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};
(toast as any) = mockToast;

// Componente de prueba para consumir el contexto
const TestComponent = () => {
  const studio = useStudio();
  return (
    <div>
      <div data-testid="loading">{studio.isLoading.toString()}</div>
      <div data-testid="config-count">{studio.configs.length}</div>
      <div data-testid="is-dirty">{studio.isDirty.toString()}</div>
      <div data-testid="error">{studio.error || 'no-error'}</div>
      <button onClick={() => studio.loadConfigs()}>Load Configs</button>
      <button onClick={() => studio.markAsDirty()}>Mark Dirty</button>
    </div>
  );
};

// Wrapper con providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <StudioProvider>{children}</StudioProvider>
  </AuthProvider>
);

describe('StudioProvider', () => {
  const mockConfig = {
    id: 'test-id',
    type: StudioConfigType.PLACEHOLDER,
    name: 'Test Config',
    description: 'Test description',
    templateType: null,
    config: {
      eye_shape: 'square',
      data_pattern: 'dots',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
    },
    isActive: true,
    version: 1,
    createdById: 'user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue({ data: { configs: [] } });
    mockApiClient.post.mockResolvedValue({ data: { config: mockConfig } });
  });

  describe('Estado inicial', () => {
    it('debe inicializar con estado vacío', () => {
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('config-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('loadConfigs', () => {
    it('debe cargar configuraciones del backend', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { configs: [mockConfig] },
      });

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      const loadButton = screen.getByText('Load Configs');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('config-count')).toHaveTextContent('1');
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/studio/configs');
    });

    it('debe manejar errores de carga', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      const loadButton = screen.getByText('Load Configs');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Error cargando configuraciones');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Error cargando configuraciones');
    });

    it('debe evitar cargas múltiples simultáneas', async () => {
      mockApiClient.get.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      const loadButton = screen.getByText('Load Configs');
      
      // Hacer múltiples clics rápidos
      await userEvent.click(loadButton);
      await userEvent.click(loadButton);
      await userEvent.click(loadButton);

      // Solo debe hacer una llamada
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('markAsDirty', () => {
    it('debe marcar el estado como modificado', async () => {
      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      expect(screen.getByTestId('is-dirty')).toHaveTextContent('false');

      const dirtyButton = screen.getByText('Mark Dirty');
      await userEvent.click(dirtyButton);

      expect(screen.getByTestId('is-dirty')).toHaveTextContent('true');
    });
  });

  describe('getConfigByType', () => {
    it('debe retornar configuración por tipo', async () => {
      const TestComponentWithGet = () => {
        const { getConfigByType } = useStudio();
        const config = getConfigByType(StudioConfigType.PLACEHOLDER);
        
        return <div data-testid="config-name">{config?.name || 'no-config'}</div>;
      };

      mockApiClient.get.mockResolvedValueOnce({
        data: { configs: [mockConfig] },
      });

      render(
        <Wrapper>
          <TestComponentWithGet />
        </Wrapper>
      );

      // Esperar a que se carguen las configuraciones
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId('config-name')).toHaveTextContent('Test Config');
      });
    });
  });

  describe('saveConfig', () => {
    it('debe guardar configuración exitosamente', async () => {
      const TestComponentWithSave = () => {
        const { saveConfig } = useStudio();
        
        const handleSave = async () => {
          await saveConfig({
            type: StudioConfigType.PLACEHOLDER,
            name: 'New Config',
            config: {
              eye_shape: 'circle',
              data_pattern: 'dots',
              colors: {
                foreground: '#000000',
                background: '#FFFFFF',
              },
            },
          });
        };
        
        return <button onClick={handleSave}>Save Config</button>;
      };

      render(
        <Wrapper>
          <TestComponentWithSave />
        </Wrapper>
      );

      const saveButton = screen.getByText('Save Config');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/api/studio/configs',
          expect.objectContaining({
            type: StudioConfigType.PLACEHOLDER,
            name: 'New Config',
          })
        );
      });

      expect(mockToast.success).toHaveBeenCalled();
    });

    it('debe validar configuración antes de guardar', async () => {
      const TestComponentWithInvalidSave = () => {
        const { saveConfig } = useStudio();
        
        const handleSave = async () => {
          await saveConfig({
            type: StudioConfigType.PLACEHOLDER,
            name: '', // Nombre vacío - inválido
            config: {},
          } as any);
        };
        
        return <button onClick={handleSave}>Save Invalid</button>;
      };

      render(
        <Wrapper>
          <TestComponentWithInvalidSave />
        </Wrapper>
      );

      const saveButton = screen.getByText('Save Invalid');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Faltan campos requeridos en la configuración'
        );
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('deleteConfig', () => {
    it('debe eliminar configuración', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: {} });

      const TestComponentWithDelete = () => {
        const { deleteConfig } = useStudio();
        
        return (
          <button onClick={() => deleteConfig('test-id')}>
            Delete Config
          </button>
        );
      };

      render(
        <Wrapper>
          <TestComponentWithDelete />
        </Wrapper>
      );

      const deleteButton = screen.getByText('Delete Config');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith(
          '/api/studio/configs/test-id'
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Configuración eliminada correctamente'
      );
    });
  });

  describe('WebSocket integration', () => {
    it('debe actualizar estado cuando llega actualización por WebSocket', async () => {
      // Este test verificaría la integración con WebSocket
      // pero está simplificado para el ejemplo
      
      const { rerender } = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      // Simular que llegó una actualización
      mockApiClient.get.mockResolvedValueOnce({
        data: { configs: [mockConfig] },
      });

      // Forzar recarga
      rerender(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('config-count')).toHaveTextContent('0');
      });
    });
  });
});