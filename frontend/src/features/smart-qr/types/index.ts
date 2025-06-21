/**
 * Smart QR Types
 * Type definitions for the Smart QR feature
 */

export interface SmartQRTemplate {
  id: string;
  name: string;
  preview?: string;
  tags: string[];
  applied?: boolean;
}

export interface SmartQRConfig {
  gradient?: {
    type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
  };
  eyeShape?: string;
  dataPattern?: string;
  logo?: {
    url: string;
    size: number;
    padding?: number;
    shape?: 'square' | 'circle' | 'rounded';
  };
  effects?: string[];
  frame?: {
    type: string;
    text?: string;
  };
  _metadata?: {
    templateId: string;
    templateName: string;
    templateVersion: string;
    appliedAt: string;
  };
}

export interface SmartQRGenerateRequest {
  url: string;
  options?: {
    preferredTemplateId?: string;
    skipAnalysisDelay?: boolean;
  };
}

export interface SmartQRGenerateResponse {
  success: boolean;
  data?: {
    templateApplied: boolean;
    templateId?: string;
    templateName?: string;
    configuration: SmartQRConfig;
    remaining: number;
    metadata: {
      analysisTime: number;
      domain: string;
      isKnownDomain: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface SmartQRLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  isPremium: boolean;
}

export interface SmartQRStats {
  usage: {
    daily: Array<{ date: string; count: number }>;
    total: number;
    averagePerDay: number;
  };
  favoriteTemplates: string[];
  remainingToday: number;
}

export interface SmartQRState {
  isAnalyzing: boolean;
  template: SmartQRTemplate | null;
  config: SmartQRConfig | null;
  remaining: number;
  error: string | null;
  lastGeneratedUrl?: string;
}

export type SmartQRAnalysisStep = 
  | 'idle'
  | 'analyzing-url'
  | 'detecting-domain'
  | 'selecting-template'
  | 'applying-style'
  | 'complete';

export interface SmartQRAnalysisState {
  currentStep: SmartQRAnalysisStep;
  progress: number; // 0-100
  message: string;
}