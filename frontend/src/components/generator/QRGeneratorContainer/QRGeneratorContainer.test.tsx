/**
 * Tests for QR Generator Container
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QRGeneratorContainer } from './index';

// Mock the orchestrator hook
const mockUpdateForm = jest.fn();
const mockUpdateOptions = jest.fn();
const mockChangeBarcodeType = jest.fn();
const mockChangeQRType = jest.fn();
const mockGenerateNow = jest.fn();
const mockGenerateAnyway = jest.fn();
const mockReset = jest.fn();

jest.mock('@/hooks/useQRGeneratorOrchestrator', () => ({
  useQRGeneratorOrchestrator: () => ({
    state: 'idle',
    context: {
      barcodeType: 'qrcode',
      qrType: 'link',
      formData: { url: 'https://example.com' },
      options: {
        size: 300,
        fgColor: '#000000',
        bgColor: '#FFFFFF'
      },
      validationMetadata: null,
      svgContent: '<svg>test</svg>',
      enhancedData: null,
      isTyping: false,
      hasGeneratedInitial: false
    },
    updateForm: mockUpdateForm,
    updateOptions: mockUpdateOptions,
    changeBarcodeType: mockChangeBarcodeType,
    changeQRType: mockChangeQRType,
    generateNow: mockGenerateNow,
    generateAnyway: mockGenerateAnyway,
    reset: mockReset,
    isLoading: false,
    hasError: false,
    canGenerate: true,
    showValidationFeedback: false,
    needsUrlValidation: true
  })
}));

// Mock child components
jest.mock('../GeneratorLayout', () => ({
  GeneratorLayout: ({ children }: any) => <div data-testid="generator-layout">{children}</div>
}));

jest.mock('../URLValidation', () => ({
  URLValidation: ({ onChange, url }: any) => (
    <input
      data-testid="url-input"
      value={url}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

jest.mock('../QRFormManager', () => ({
  QRFormManager: () => <div data-testid="qr-form-manager">Form Manager</div>
}));

jest.mock('../GenerationControls', () => ({
  GenerationControls: ({ onGenerate }: any) => (
    <button data-testid="generate-button" onClick={onGenerate}>Generate</button>
  )
}));

jest.mock('../PreviewSectionV3', () => ({
  PreviewSection: () => <div data-testid="preview-section">Preview</div>
}));

jest.mock('../BarcodeTypeTabs', () => ({
  BarcodeTypeTabs: ({ onTypeChange }: any) => (
    <div data-testid="barcode-tabs">
      <button onClick={() => onTypeChange('qrcode')}>QR Code</button>
      <button onClick={() => onTypeChange('code128')}>Code 128</button>
    </div>
  )
}));

jest.mock('../QRContentSelector', () => ({
  QRContentSelector: ({ onTypeChange }: any) => (
    <div data-testid="qr-content-selector">
      <button onClick={() => onTypeChange('link')}>Link</button>
      <button onClick={() => onTypeChange('text')}>Text</button>
    </div>
  )
}));

jest.mock('@/features/smart-qr/components', () => ({
  SmartQRButton: ({ onClick }: any) => (
    <button data-testid="smart-qr-button" onClick={onClick}>Smart QR</button>
  )
}));

describe('QRGeneratorContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all main components', () => {
    render(<QRGeneratorContainer />);
    
    expect(screen.getByTestId('generator-layout')).toBeInTheDocument();
    expect(screen.getByTestId('barcode-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('qr-content-selector')).toBeInTheDocument();
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByTestId('smart-qr-button')).toBeInTheDocument();
    expect(screen.getByTestId('generate-button')).toBeInTheDocument();
    expect(screen.getByTestId('preview-section')).toBeInTheDocument();
  });

  test('generates initial QR on mount', () => {
    render(<QRGeneratorContainer />);
    
    expect(mockGenerateNow).toHaveBeenCalledTimes(1);
  });

  test('handles barcode type change', () => {
    render(<QRGeneratorContainer />);
    
    const code128Button = screen.getByText('Code 128');
    fireEvent.click(code128Button);
    
    expect(mockChangeBarcodeType).toHaveBeenCalledWith('code128');
  });

  test('handles QR content type change', () => {
    render(<QRGeneratorContainer />);
    
    const textButton = screen.getByText('Text');
    fireEvent.click(textButton);
    
    expect(mockChangeQRType).toHaveBeenCalledWith('text');
    expect(mockUpdateForm).toHaveBeenCalledWith('url', '');
    expect(mockUpdateForm).toHaveBeenCalledWith('text', '');
    expect(mockUpdateForm).toHaveBeenCalledWith('email', '');
    expect(mockUpdateForm).toHaveBeenCalledWith('phone', '');
  });

  test('handles URL input change', async () => {
    render(<QRGeneratorContainer />);
    
    const urlInput = screen.getByTestId('url-input');
    await userEvent.type(urlInput, 'https://new-site.com');
    
    expect(mockUpdateForm).toHaveBeenCalledWith('url', expect.stringContaining('new-site.com'));
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

  test('shows URL validation for QR link type', () => {
    render(<QRGeneratorContainer />);
    
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-form-manager')).not.toBeInTheDocument();
  });

  test('shows form manager for non-link QR types', () => {
    // Mock different QR type
    jest.mocked(useQRGeneratorOrchestrator).mockReturnValue({
      ...jest.mocked(useQRGeneratorOrchestrator)(),
      context: {
        ...jest.mocked(useQRGeneratorOrchestrator)().context,
        qrType: 'text'
      }
    } as any);
    
    render(<QRGeneratorContainer />);
    
    expect(screen.queryByTestId('url-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('qr-form-manager')).toBeInTheDocument();
  });

  test('hides QR content selector for non-QR barcodes', () => {
    // Mock different barcode type
    jest.mocked(useQRGeneratorOrchestrator).mockReturnValue({
      ...jest.mocked(useQRGeneratorOrchestrator)(),
      context: {
        ...jest.mocked(useQRGeneratorOrchestrator)().context,
        barcodeType: 'code128'
      }
    } as any);
    
    render(<QRGeneratorContainer />);
    
    expect(screen.queryByTestId('qr-content-selector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('smart-qr-button')).not.toBeInTheDocument();
  });
});