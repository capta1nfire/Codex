# Guía de Compatibilidad - Migración QR Engine v2

## 🔄 Mapeo de Transformación API

### Request Transformation

```typescript
// Transformer class para mantener compatibilidad
export class QrV2RequestTransformer {
  /**
   * Transforma request del formato antiguo al nuevo QR v2
   */
  static transformToV2(oldRequest: OldGenerateRequest): QrRequestV2 {
    const { barcode_type, data, options = {} } = oldRequest;
    
    // Solo procesar QR codes
    if (barcode_type !== 'qrcode') {
      throw new Error('QR Engine v2 only supports QR codes');
    }
    
    // Transformar scale a size (scale 2 = 300px default)
    const size = options.scale ? options.scale * 150 : 300;
    
    // Construir customization object
    const customization: QrCustomization = {};
    
    // Colores básicos
    if (options.fgcolor) customization.foregroundColor = options.fgcolor;
    if (options.bgcolor) customization.backgroundColor = options.bgcolor;
    
    // Gradiente (restructurar)
    if (options.gradient_enabled && options.gradient_colors?.length >= 2) {
      customization.gradient = {
        type: options.gradient_type || 'linear',
        colors: options.gradient_colors,
        angle: options.gradient_direction === 'horizontal' ? 0 : 
               options.gradient_direction === 'vertical' ? 90 : 
               options.gradient_direction === 'diagonal' ? 45 : 0
      };
    }
    
    // Error correction level mapping
    const eclMapping: Record<string, string> = {
      'L': 'low',
      'M': 'medium',
      'Q': 'quartile',
      'H': 'high'
    };
    
    return {
      data,
      size,
      customization: Object.keys(customization).length > 0 ? customization : undefined
    };
  }
}
```

### Response Transformation

```typescript
export class QrV2ResponseTransformer {
  /**
   * Transforma response v2 al formato antiguo para compatibilidad
   */
  static transformToOld(v2Response: QrOutputV2): OldGenerateResponse {
    return {
      svg: v2Response.data,
      cached: v2Response.metadata.cached,
      // Campos opcionales para transición gradual
      _v2_metadata: v2Response.metadata
    };
  }
  
  /**
   * Extrae metadata adicional para nuevo UI
   */
  static extractEnhancedData(v2Response: QrOutputV2): EnhancedQrData {
    return {
      svg: v2Response.data,
      performance: {
        generationTime: v2Response.metadata.generationTimeMs,
        complexity: v2Response.metadata.complexityLevel,
        cached: v2Response.metadata.cached
      },
      quality: {
        score: v2Response.metadata.qualityScore,
        features: v2Response.metadata.featuresUsed
      }
    };
  }
}
```

## 📦 TypeScript Types Completos

### Types para QR Engine v2

```typescript
// src/types/qrEngineV2.types.ts

// Request types
export interface QrRequestV2 {
  data: string;
  size: number;
  customization?: QrCustomization;
}

export interface QrCustomization {
  // Basic shapes
  eyeShape?: 'square' | 'circle' | 'rounded';
  dataPattern?: 'square' | 'dots' | 'rounded';
  
  // Colors
  foregroundColor?: string;
  backgroundColor?: string;
  eyeColor?: string;
  
  // Advanced features
  gradient?: GradientOptions;
  logo?: LogoOptions;
  frame?: FrameOptions;
  effects?: EffectOptions[];
}

export interface GradientOptions {
  type: 'linear' | 'radial';
  colors: string[];
  angle?: number;        // For linear gradients
  centerX?: number;      // For radial gradients (0-1)
  centerY?: number;      // For radial gradients (0-1)
}

export interface LogoOptions {
  data: string;          // Base64 encoded image
  size?: number;         // Size in pixels (default: 50)
  padding?: number;      // Padding around logo (default: 5)
  backgroundColor?: string; // Background for logo area
}

export interface FrameOptions {
  style: 'simple' | 'rounded' | 'ornamental';
  color?: string;
  width?: number;
  text?: string;
  textPosition?: 'top' | 'bottom';
  textStyle?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
  };
}

export interface EffectOptions {
  type: 'shadow' | 'glow' | 'blur' | '3d';
  intensity?: number;    // 0-1
  color?: string;
  offset?: { x: number; y: number }; // For shadow/3d
}

// Response types
export interface QrOutputV2 {
  data: string;          // SVG or base64 PNG
  format: 'svg' | 'png';
  metadata: QrMetadata;
}

export interface QrMetadata {
  generationTimeMs: number;
  complexityLevel: ComplexityLevel;
  featuresUsed: string[];
  qualityScore: number;  // 0-1
  cached: boolean;
}

export type ComplexityLevel = 'basic' | 'medium' | 'advanced' | 'ultra';

// Batch types
export interface BatchQrRequest {
  requests: Array<QrRequestV2 & { id: string }>;
  options?: BatchOptions;
}

export interface BatchOptions {
  maxConcurrent?: number;
  failFast?: boolean;
  includeMetadata?: boolean;
}

export interface BatchQrResponse {
  results: BatchResult[];
  summary: BatchSummary;
}

export interface BatchResult {
  id: string;
  success: boolean;
  data?: string;
  error?: string;
  metadata?: QrMetadata;
}

export interface BatchSummary {
  total: number;
  successful: number;
  failed: number;
  totalTimeMs: number;
  averageTimeMs: number;
}

// Cache types
export interface CacheStats {
  totalKeys: number;
  memoryBytes: number;
  memoryMb: number;
  prefix: string;
  hits: number;
  misses: number;
  hitRate: number;
  mode: 'standalone' | 'cluster' | 'sentinel';
}

// Validation types
export interface ValidationRequest {
  data: string;
  type?: string;
  options?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  suggestions?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

// Preview types
export interface PreviewRequest {
  data: string;
  customization?: Partial<QrCustomization>;
  quality?: 'low' | 'medium' | 'high';
}

export interface PreviewResponse {
  preview: string;       // Low quality SVG for fast preview
  estimatedSize: number;
  complexity: ComplexityLevel;
}

// Error types
export interface QrErrorV2 {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}
```

## 🔌 Adapter Implementation

### Full Backward Compatible Adapter

```typescript
// src/lib/api/qrAdapter.ts

import { qrEngineV2Api } from './qrEngineV2';
import { generatorApi } from './api';

export class QrGenerationAdapter {
  private useV2: boolean;
  
  constructor() {
    // Feature flag or env variable
    this.useV2 = process.env.NEXT_PUBLIC_USE_QR_V2 === 'true';
  }
  
  async generate(request: OldGenerateRequest): Promise<OldGenerateResponse> {
    // Only handle QR codes with v2
    if (this.useV2 && request.barcode_type === 'qrcode') {
      try {
        // Transform to v2 format
        const v2Request = QrV2RequestTransformer.transformToV2(request);
        
        // Call v2 API
        const v2Response = await qrEngineV2Api.generate(v2Request);
        
        // Transform back for compatibility
        return QrV2ResponseTransformer.transformToOld(v2Response);
      } catch (error) {
        console.warn('QR v2 failed, falling back to legacy', error);
        // Fallback to old API
        return generatorApi.generateCode(request);
      }
    }
    
    // Use old API for non-QR or if v2 disabled
    return generatorApi.generateCode(request);
  }
  
  // New v2-only methods
  async generateV2Direct(request: QrRequestV2): Promise<QrOutputV2> {
    return qrEngineV2Api.generate(request);
  }
  
  async validateQr(data: string, options?: any): Promise<ValidationResult> {
    return qrEngineV2Api.validate({ data, options });
  }
  
  async previewQr(request: PreviewRequest): Promise<PreviewResponse> {
    return qrEngineV2Api.preview(request);
  }
  
  async getCacheStats(): Promise<CacheStats> {
    return qrEngineV2Api.cache.getStats();
  }
}

// Singleton instance
export const qrAdapter = new QrGenerationAdapter();
```

## 🎛️ Feature Flag Strategy

```typescript
// src/lib/featureFlags.ts

export const QrFeatureFlags = {
  // Main v2 engine toggle
  USE_QR_ENGINE_V2: process.env.NEXT_PUBLIC_QR_ENGINE_V2 === 'true',
  
  // Gradual feature rollout
  ENABLE_QR_SHAPES: process.env.NEXT_PUBLIC_QR_SHAPES === 'true',
  ENABLE_QR_LOGOS: process.env.NEXT_PUBLIC_QR_LOGOS === 'true',
  ENABLE_QR_FRAMES: process.env.NEXT_PUBLIC_QR_FRAMES === 'true',
  ENABLE_QR_EFFECTS: process.env.NEXT_PUBLIC_QR_EFFECTS === 'true',
  ENABLE_BATCH_GENERATION: process.env.NEXT_PUBLIC_QR_BATCH === 'true',
  ENABLE_REAL_TIME_PREVIEW: process.env.NEXT_PUBLIC_QR_PREVIEW === 'true',
  
  // Dashboard features
  SHOW_V2_METRICS: process.env.NEXT_PUBLIC_SHOW_V2_METRICS === 'true',
  SHOW_CACHE_PANEL: process.env.NEXT_PUBLIC_SHOW_CACHE_PANEL === 'true',
  
  // Performance features
  ENABLE_REQUEST_BATCHING: process.env.NEXT_PUBLIC_REQUEST_BATCHING === 'true',
  CACHE_PREVIEW_REQUESTS: process.env.NEXT_PUBLIC_CACHE_PREVIEWS === 'true',
  
  // Get all enabled features
  getEnabledFeatures(): string[] {
    const features = [];
    if (this.ENABLE_QR_SHAPES) features.push('shapes');
    if (this.ENABLE_QR_LOGOS) features.push('logos');
    if (this.ENABLE_QR_FRAMES) features.push('frames');
    if (this.ENABLE_QR_EFFECTS) features.push('effects');
    return features;
  }
};
```

## 🧪 Testing Strategy

### Parallel Testing Approach

```typescript
// src/__tests__/qrMigration.test.ts

describe('QR Engine Migration Tests', () => {
  describe('Compatibility Layer', () => {
    it('should transform old request to v2 format correctly', () => {
      const oldRequest = {
        barcode_type: 'qrcode',
        data: 'test',
        options: {
          scale: 2,
          fgcolor: '#000000',
          gradient_enabled: true,
          gradient_colors: ['#FF0000', '#00FF00'],
          gradient_direction: 'horizontal'
        }
      };
      
      const v2Request = QrV2RequestTransformer.transformToV2(oldRequest);
      
      expect(v2Request).toEqual({
        data: 'test',
        size: 300,
        customization: {
          foregroundColor: '#000000',
          gradient: {
            type: 'linear',
            colors: ['#FF0000', '#00FF00'],
            angle: 0
          }
        }
      });
    });
    
    it('should handle v2 response transformation', () => {
      const v2Response: QrOutputV2 = {
        data: '<svg>...</svg>',
        format: 'svg',
        metadata: {
          generationTimeMs: 15,
          complexityLevel: 'medium',
          featuresUsed: ['gradient'],
          qualityScore: 0.95,
          cached: true
        }
      };
      
      const oldResponse = QrV2ResponseTransformer.transformToOld(v2Response);
      
      expect(oldResponse.svg).toBe('<svg>...</svg>');
      expect(oldResponse.cached).toBe(true);
    });
  });
  
  describe('Feature Detection', () => {
    it('should correctly identify v2 features', () => {
      const features = QrFeatureFlags.getEnabledFeatures();
      expect(features).toBeInstanceOf(Array);
    });
  });
});
```

## 📊 Performance Comparison Tests

```typescript
// scripts/performance-comparison.ts

async function compareEnginePerformance() {
  const testData = 'https://example.com/test';
  const iterations = 1000;
  
  // Test old engine
  console.log('Testing OLD engine...');
  const oldStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await generatorApi.generateCode({
      barcode_type: 'qrcode',
      data: `${testData}/${i}`
    });
  }
  const oldTime = performance.now() - oldStart;
  
  // Test new engine
  console.log('Testing NEW engine...');
  const newStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await qrEngineV2Api.generate({
      data: `${testData}/${i}`,
      size: 300
    });
  }
  const newTime = performance.now() - newStart;
  
  // Results
  console.log(`
Performance Comparison (${iterations} iterations):
OLD Engine: ${oldTime.toFixed(2)}ms total, ${(oldTime/iterations).toFixed(2)}ms average
NEW Engine: ${newTime.toFixed(2)}ms total, ${(newTime/iterations).toFixed(2)}ms average
Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(1)}%
  `);
}
```

## ✅ Migration Checklist

### Pre-Migration
- [ ] All types defined and reviewed
- [ ] Adapter class implemented
- [ ] Feature flags configured
- [ ] Tests written for transformers
- [ ] Performance baseline established

### During Migration
- [ ] Enable v2 for 10% users
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix any compatibility issues

### Post-Migration
- [ ] Remove old API calls
- [ ] Clean up adapter code
- [ ] Update documentation
- [ ] Remove feature flags
- [ ] Archive old code

Esta guía proporciona todo lo necesario para una migración segura y gradual al QR Engine v2.