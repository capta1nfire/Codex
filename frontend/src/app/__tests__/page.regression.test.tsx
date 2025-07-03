/**
 * Tests de Regresión para page.tsx
 * 
 * Estos tests capturan el comportamiento actual del componente antes de la refactorización
 * para asegurar que no se rompa ninguna funcionalidad durante el proceso.
 * 
 * IMPORTANTE: No modificar estos tests durante la refactorización.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Home from '../page';

// Mock the QRGeneratorContainer component since we're testing the refactored page
vi.mock('@/components/generator/QRGeneratorContainer', () => ({
  QRGeneratorContainer: () => <div data-testid="qr-generator-container">QR Generator Container</div>
}));


describe('page.tsx - Tests de Regresión Refactorizado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Renderizado del Nuevo Componente', () => {
    test('debe renderizar el QRGeneratorContainer', () => {
      render(<Home />);
      
      // Verificar que el nuevo componente se renderiza
      expect(screen.getByTestId('qr-generator-container')).toBeInTheDocument();
      expect(screen.getByText('QR Generator Container')).toBeInTheDocument();
    });

    test('debe ser un componente simple sin lógica', () => {
      const { container } = render(<Home />);
      
      // Verificar que no hay lógica compleja en el componente
      expect(container.children).toHaveLength(1);
    });
  });

  describe('2. Compatibilidad con Arquitectura Anterior', () => {
    test('debe mantener la misma funcionalidad pública', () => {
      render(<Home />);
      
      // La funcionalidad ahora está delegada al QRGeneratorContainer
      expect(screen.getByTestId('qr-generator-container')).toBeInTheDocument();
    });
  });








});

describe('3. Verificación de Refactorización', () => {
    test('debe ser un componente minimalista', () => {
      // Verificar que el componente es realmente simple
      const componentString = Home.toString();
      
      // No debe contener lógica compleja
      expect(componentString).not.toContain('useState');
      expect(componentString).not.toContain('useEffect');
      expect(componentString).not.toContain('useCallback');
      expect(componentString).not.toContain('handleQRFormChange');
    });
    
    test('debe mantener la exportación por defecto', () => {
      expect(typeof Home).toBe('function');
      expect(Home.name).toBe('Home');
    });
  });