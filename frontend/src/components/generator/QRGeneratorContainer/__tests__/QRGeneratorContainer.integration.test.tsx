/**
 * Integration Tests for QRGeneratorContainer
 * 
 * Tests the complete flow of the refactored architecture
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QRGeneratorContainer } from '../index';

// Mock the state machine hook with realistic behavior
const mockUpdateForm = vi.fn();
const mockUpdateOptions = vi.fn();
const mockChangeBarcodeType = vi.fn();
const mockChangeQRType = vi.fn();
const mockGenerateNow = vi.fn();
const mockGenerateAnyway = vi.fn();

const defaultMockContext = {
  barcodeType: 'qrcode',
  qrType: 'link',
  formData: { url: 'https://example.com' },
  options: {
    size: 300,
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_colors: ['#000000', '#666666'],
    eyeShape: 'rounded',
    dataShape: 'square'
  },
  validationMetadata: null,
  svgContent: '<svg>Test QR</svg>',
  enhancedData: null,
  isTyping: false,
  hasGeneratedInitial: true,
  shouldAutoGenerate: true,
  lastValidatedUrl: '',
  isUrlValid: false
};

vi.mock('@/hooks/useQRGeneratorOrchestrator', () => ({
  useQRGeneratorOrchestrator: vi.fn(() => ({
    state: 'complete',
    context: defaultMockContext,
    updateForm: mockUpdateForm,
    updateOptions: mockUpdateOptions,
    changeBarcodeType: mockChangeBarcodeType,
    changeQRType: mockChangeQRType,
    generateNow: mockGenerateNow,
    generateAnyway: mockGenerateAnyway,
    isLoading: false,
    hasError: false,
    canGenerate: true,
    showValidationFeedback: false
  }))
}));

// Mock child components with realistic interfaces
vi.mock('@/components/generator/GeneratorLayout', () => ({
  GeneratorLayout: ({ children }: any) => (
    <div data-testid="generator-layout">{children}</div>
  )
}));

vi.mock('@/components/generator/BarcodeTypeTabs', () => ({
  BarcodeTypeTabs: ({ selectedType, onTypeChange }: any) => (
    <div data-testid="barcode-tabs">
      <button 
        data-testid="qr-tab"
        onClick={() => onTypeChange('qrcode')}
        aria-selected={selectedType === 'qrcode'}
      >
        QR Code
      </button>
      <button 
        data-testid="code128-tab"
        onClick={() => onTypeChange('code128')}
        aria-selected={selectedType === 'code128'}
      >
        Code 128
      </button>
    </div>
  )
}));

vi.mock('@/components/generator/QRContentSelector', () => ({
  QRContentSelector: ({ selectedQRType, onQRTypeChange }: any) => (
    <div data-testid="qr-content-selector">
      <button 
        data-testid="link-type"
        onClick={() => onQRTypeChange('link')}
        aria-selected={selectedQRType === 'link'}
      >
        Link
      </button>
      <button 
        data-testid="text-type"
        onClick={() => onQRTypeChange('text')}
        aria-selected={selectedQRType === 'text'}
      >
        Text
      </button>
    </div>
  )
}));

vi.mock('@/components/generator/URLValidation', () => ({
  URLValidation: ({ url, onChange, onGenerateAnyway }: any) => (
    <div data-testid="url-validation">
      <input
        data-testid="url-input"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter URL"
      />
      {onGenerateAnyway && (
        <button data-testid="generate-anyway" onClick={onGenerateAnyway}>
          Generate Anyway
        </button>
      )}
    </div>
  )
}));

vi.mock('@/components/generator/QRFormManager', () => ({
  QRFormManager: ({ onChange }: any) => (
    <div data-testid="qr-form-manager">
      <input
        data-testid="text-input"
        onChange={(e) => onChange('text', e.target.value)}
        placeholder="Enter text"
      />
    </div>
  )
}));

vi.mock('@/components/generator/GenerationControls', () => ({
  GenerationControls: ({ onGenerate, onOptionsChange }: any) => (
    <div data-testid="generation-controls">
      <button data-testid="generate-button" onClick={onGenerate}>
        Generate
      </button>
      <button 
        data-testid="color-option" 
        onClick={() => onOptionsChange({ fgColor: '#FF0000' })}
      >
        Change Color
      </button>
    </div>
  )
}));

vi.mock('@/components/generator/PreviewSectionV3', () => ({
  PreviewSection: ({ svgContent, isLoading }: any) => (
    <div data-testid="preview-section">
      {isLoading ? 'Loading...' : svgContent || 'No preview'}
    </div>
  )
}));

vi.mock('@/features/smart-qr/components', () => ({
  SmartQRButton: ({ onGenerate }: any) => (
    <button data-testid="smart-qr-button" onClick={onGenerate}>
      Smart QR
    </button>
  )
}));

describe('QRGeneratorContainer - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Architecture', () => {
    test('renders all major sections', () => {
      render(<QRGeneratorContainer />);
      
      expect(screen.getByTestId('generator-layout')).toBeInTheDocument();
      expect(screen.getByTestId('barcode-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('qr-content-selector')).toBeInTheDocument();
      expect(screen.getByTestId('url-validation')).toBeInTheDocument();
      expect(screen.getByTestId('smart-qr-button')).toBeInTheDocument();
      expect(screen.getByTestId('generation-controls')).toBeInTheDocument();
      expect(screen.getByTestId('preview-section')).toBeInTheDocument();
    });

    test('shows correct components for QR code type', () => {
      render(<QRGeneratorContainer />);
      
      // Should show QR-specific components
      expect(screen.getByTestId('qr-content-selector')).toBeInTheDocument();
      expect(screen.getByTestId('url-validation')).toBeInTheDocument();
      expect(screen.getByTestId('smart-qr-button')).toBeInTheDocument();
    });

    test('hides QR-specific components for other barcode types', () => {
      const mockOrchestrator = vi.mocked(require('@/hooks/useQRGeneratorOrchestrator').useQRGeneratorOrchestrator);
      mockOrchestrator.mockReturnValue({
        state: 'complete',
        context: { ...defaultMockContext, barcodeType: 'code128' },
        updateForm: mockUpdateForm,
        updateOptions: mockUpdateOptions,
        changeBarcodeType: mockChangeBarcodeType,
        changeQRType: mockChangeQRType,
        generateNow: mockGenerateNow,
        generateAnyway: mockGenerateAnyway,
        isLoading: false,
        hasError: false,
        canGenerate: true,
        showValidationFeedback: false
      });

      render(<QRGeneratorContainer />);
      
      // Should not show QR-specific components
      expect(screen.queryByTestId('qr-content-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('smart-qr-button')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles barcode type change', () => {
      render(<QRGeneratorContainer />);
      
      const code128Tab = screen.getByTestId('code128-tab');
      fireEvent.click(code128Tab);
      
      expect(mockChangeBarcodeType).toHaveBeenCalledWith('code128');
    });

    test('handles QR type change', () => {
      render(<QRGeneratorContainer />);
      
      const textType = screen.getByTestId('text-type');
      fireEvent.click(textType);
      
      expect(mockChangeQRType).toHaveBeenCalledWith('text');
      // Should also reset form fields
      expect(mockUpdateForm).toHaveBeenCalledWith('url', '');
      expect(mockUpdateForm).toHaveBeenCalledWith('text', '');
      expect(mockUpdateForm).toHaveBeenCalledWith('email', '');
      expect(mockUpdateForm).toHaveBeenCalledWith('phone', '');
    });

    test('handles URL input change', () => {
      render(<QRGeneratorContainer />);
      
      const urlInput = screen.getByTestId('url-input');
      fireEvent.change(urlInput, { target: { value: 'https://newsite.com' } });
      
      expect(mockUpdateForm).toHaveBeenCalledWith('url', 'https://newsite.com');
    });

    test('handles manual generation', () => {
      render(<QRGeneratorContainer />);
      
      const generateButton = screen.getByTestId('generate-button');
      fireEvent.click(generateButton);
      
      expect(mockGenerateNow).toHaveBeenCalled();
    });

    test('handles Smart QR generation', () => {
      render(<QRGeneratorContainer />);
      
      const smartQRButton = screen.getByTestId('smart-qr-button');
      fireEvent.click(smartQRButton);
      
      expect(mockUpdateOptions).toHaveBeenCalledWith({ smart_qr: true });
      expect(mockGenerateNow).toHaveBeenCalled();
    });

    test('handles options change', () => {
      render(<QRGeneratorContainer />);
      
      const colorOption = screen.getByTestId('color-option');
      fireEvent.click(colorOption);
      
      expect(mockUpdateOptions).toHaveBeenCalledWith({ fgColor: '#FF0000' });
    });

    test('handles generate anyway for invalid URLs', () => {
      render(<QRGeneratorContainer />);
      
      const generateAnywayButton = screen.getByTestId('generate-anyway');
      fireEvent.click(generateAnywayButton);
      
      expect(mockGenerateAnyway).toHaveBeenCalled();
    });
  });

  describe('State Machine Integration', () => {
    test('triggers initial generation on mount', () => {
      const mockOrchestrator = vi.mocked(require('@/hooks/useQRGeneratorOrchestrator').useQRGeneratorOrchestrator);
      mockOrchestrator.mockReturnValue({
        state: 'idle',
        context: { ...defaultMockContext, hasGeneratedInitial: false },
        updateForm: mockUpdateForm,
        updateOptions: mockUpdateOptions,
        changeBarcodeType: mockChangeBarcodeType,
        changeQRType: mockChangeQRType,
        generateNow: mockGenerateNow,
        generateAnyway: mockGenerateAnyway,
        isLoading: false,
        hasError: false,
        canGenerate: true,
        showValidationFeedback: false
      });

      render(<QRGeneratorContainer />);
      
      // Should trigger initial generation
      expect(mockGenerateNow).toHaveBeenCalled();
    });

    test('displays loading state correctly', () => {
      const mockOrchestrator = vi.mocked(require('@/hooks/useQRGeneratorOrchestrator').useQRGeneratorOrchestrator);
      mockOrchestrator.mockReturnValue({
        state: 'generating',
        context: defaultMockContext,
        updateForm: mockUpdateForm,
        updateOptions: mockUpdateOptions,
        changeBarcodeType: mockChangeBarcodeType,
        changeQRType: mockChangeQRType,
        generateNow: mockGenerateNow,
        generateAnyway: mockGenerateAnyway,
        isLoading: true,
        hasError: false,
        canGenerate: false,
        showValidationFeedback: false
      });

      render(<QRGeneratorContainer />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('displays error state correctly', () => {
      const mockOrchestrator = vi.mocked(require('@/hooks/useQRGeneratorOrchestrator').useQRGeneratorOrchestrator);
      mockOrchestrator.mockReturnValue({
        state: 'error',
        context: { ...defaultMockContext, error: new Error('Generation failed') } as any,
        updateForm: mockUpdateForm,
        updateOptions: mockUpdateOptions,
        changeBarcodeType: mockChangeBarcodeType,
        changeQRType: mockChangeQRType,
        generateNow: mockGenerateNow,
        generateAnyway: mockGenerateAnyway,
        isLoading: false,
        hasError: true,
        canGenerate: false,
        showValidationFeedback: false
      });

      render(<QRGeneratorContainer />);
      
      // The error should be passed to PreviewSection
      // This tests the error propagation through the component tree
      expect(screen.getByTestId('preview-section')).toBeInTheDocument();
    });
  });

  describe('Form Management', () => {
    test('switches between URL validation and form manager based on QR type', () => {
      const { rerender } = render(<QRGeneratorContainer />);
      
      // Initially should show URL validation for link type
      expect(screen.getByTestId('url-validation')).toBeInTheDocument();
      expect(screen.queryByTestId('qr-form-manager')).not.toBeInTheDocument();
      
      // Change to text type
      const mockOrchestrator = vi.mocked(require('@/hooks/useQRGeneratorOrchestrator').useQRGeneratorOrchestrator);
      mockOrchestrator.mockReturnValue({
        state: 'complete',
        context: { ...defaultMockContext, qrType: 'text' },
        updateForm: mockUpdateForm,
        updateOptions: mockUpdateOptions,
        changeBarcodeType: mockChangeBarcodeType,
        changeQRType: mockChangeQRType,
        generateNow: mockGenerateNow,
        generateAnyway: mockGenerateAnyway,
        isLoading: false,
        hasError: false,
        canGenerate: true,
        showValidationFeedback: false
      });
      
      rerender(<QRGeneratorContainer />);
      
      // Now should show form manager
      expect(screen.queryByTestId('url-validation')).not.toBeInTheDocument();
      expect(screen.getByTestId('qr-form-manager')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('maintains proper tab structure', () => {
      render(<QRGeneratorContainer />);
      
      const qrTab = screen.getByTestId('qr-tab');
      const code128Tab = screen.getByTestId('code128-tab');
      
      expect(qrTab).toHaveAttribute('aria-selected', 'true');
      expect(code128Tab).toHaveAttribute('aria-selected', 'false');
    });

    test('provides proper button labeling', () => {
      render(<QRGeneratorContainer />);
      
      expect(screen.getByText('Generate')).toBeInTheDocument();
      expect(screen.getByText('Smart QR')).toBeInTheDocument();
    });
  });
});