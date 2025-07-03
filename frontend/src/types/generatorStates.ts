/**
 * Generator State Machine Types
 * 
 * Defines all states, events, and context for the QR/Barcode generator
 * orchestration state machine.
 */

// State definitions
export type GeneratorState = 
  | { value: 'idle'; context: GeneratorContext }
  | { value: 'typing'; context: GeneratorContext }
  | { value: 'validating'; context: GeneratorContext }
  | { value: 'ready'; context: GeneratorContext }
  | { value: 'generating'; context: GeneratorContext }
  | { value: 'complete'; context: GeneratorContext }
  | { value: 'error'; context: GeneratorContext & { error: Error } };

// Events that can trigger state transitions
export type GeneratorEvent =
  | { type: 'FORM_CHANGE'; field: string; value: any }
  | { type: 'START_TYPING' }
  | { type: 'STOP_TYPING' }
  | { type: 'START_VALIDATION'; url: string }
  | { type: 'VALIDATION_SUCCESS'; metadata: ValidationMetadata }
  | { type: 'VALIDATION_FAILURE'; error: string }
  | { type: 'GENERATE_ANYWAY' }
  | { type: 'START_GENERATION' }
  | { type: 'GENERATION_SUCCESS'; svgContent: string; enhancedData: any; scannabilityAnalysis: any }
  | { type: 'GENERATION_FAILURE'; error: Error }
  | { type: 'RESET' }
  | { type: 'CHANGE_BARCODE_TYPE'; barcodeType: string }
  | { type: 'CHANGE_QR_TYPE'; qrType: string }
  | { type: 'UPDATE_OPTIONS'; options: Partial<GenerationOptions> }
  | { type: 'SET_EDITING_INTENT'; isEditing: boolean; debounceTime?: number };

// Context that persists across states
export interface GeneratorContext {
  // Form data
  barcodeType: string;
  qrType: string;
  formData: Record<string, any>;
  options: GenerationOptions;
  
  // Validation state
  lastValidatedUrl: string;
  validationMetadata: ValidationMetadata | null;
  isUrlValid: boolean;
  
  // Generation state
  svgContent: string | null;
  enhancedData: any | null;
  scannabilityAnalysis: any | null;
  lastGeneratedData: string;
  hasGeneratedInitial: boolean;
  
  // UI state
  isTyping: boolean;
  hasUserStartedTyping: boolean;
  shouldAutoGenerate: boolean;
  isUserEditing: boolean;
  dynamicDebounceTime: number;
  
  // Timers (managed internally by machine)
  typingTimer?: NodeJS.Timeout;
  validationTimer?: NodeJS.Timeout;
  generationTimer?: NodeJS.Timeout;
  postValidationTimer?: NodeJS.Timeout;
}

// Validation metadata from URL validation
export interface ValidationMetadata {
  exists: boolean;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  error?: string;
}

// Generation options
export interface GenerationOptions {
  size: number;
  scale: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  fgColor: string;
  bgColor: string;
  logo?: string;
  logoSize?: number;
  gradient_enabled?: boolean;
  gradient_type?: 'linear' | 'radial';
  gradient_colors?: string[];
  gradient_direction?: number;
  eyeShape?: 'square' | 'rounded' | 'circle';
  dataShape?: 'square' | 'dots' | 'rounded';
  smart_qr?: boolean;
  frame?: {
    enabled?: boolean;
    frame_type?: 'simple' | 'rounded' | 'decorated' | 'bubble' | 'speech' | 'badge';
    text?: string;
    text_size?: number;
    text_font?: string;
    color?: string;
    background_color?: string;
    text_position?: 'top' | 'bottom' | 'left' | 'right';
    padding?: number;
    border_width?: number;
    corner_radius?: number;
  };
  [key: string]: any;
}

// Service definitions
export interface GeneratorServices {
  urlValidation: (context: GeneratorContext, event: GeneratorEvent) => Promise<ValidationMetadata>;
  generateBarcode: (context: GeneratorContext, event: GeneratorEvent) => Promise<{ svgContent: string; enhancedData: any }>;
  autoGeneration: (context: GeneratorContext, event: GeneratorEvent) => void;
}

// Guards for state transitions
export interface GeneratorGuards {
  canValidate: (context: GeneratorContext, event: GeneratorEvent) => boolean;
  shouldAutoGenerate: (context: GeneratorContext, event: GeneratorEvent) => boolean;
  isValidForm: (context: GeneratorContext, event: GeneratorEvent) => boolean;
  hasChangedData: (context: GeneratorContext, event: GeneratorEvent) => boolean;
}

// Actions for state transitions
export interface GeneratorActions {
  updateFormData: (context: GeneratorContext, event: GeneratorEvent) => GeneratorContext;
  clearValidation: (context: GeneratorContext) => GeneratorContext;
  setTypingState: (context: GeneratorContext, isTyping: boolean) => GeneratorContext;
  saveGeneratedData: (context: GeneratorContext, data: any) => GeneratorContext;
  resetState: (context: GeneratorContext) => GeneratorContext;
}

// Constants
export const TYPING_DEBOUNCE_MS = 800;
export const POST_VALIDATION_DELAY_MS = 1000;
export const AUTO_GENERATION_DELAY_MS = 1500;
export const VALIDATION_TIMEOUT_MS = 5000;
export const GENERATION_TIMEOUT_MS = 10000;