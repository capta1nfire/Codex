/**
 * Scannability Score Service
 *
 * Calculates a real-time score (0-100) to guide users towards
 * QR designs that maintain high scan rates while being creative.
 *
 * Based on ISO/IEC 18004 standards and industry best practices.
 */

import { QrCustomization } from '../types/qr.types.js';

export interface ScannabilityAnalysis {
  score: number; // 0-100
  issues: ValidationIssue[];
  recommendations: string[];
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  contrastRatio: number;
}

export interface ValidationIssue {
  type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
  severity: 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export class ScannabilityService {
  /**
   * Calculate the overall scannability score
   */
  calculateScore(options: QrCustomization): ScannabilityAnalysis {
    let score = 100;
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    let suggestedECC: 'L' | 'M' | 'Q' | 'H' | undefined;

    // 1. Check contrast (40% of score)
    const contrastResult = this.checkContrast(options);
    score -= contrastResult.penalty;
    if (contrastResult.issue) issues.push(contrastResult.issue);

    // 2. Check logo size (20% of score)
    const logoResult = this.checkLogoSize(options);
    score -= logoResult.penalty;
    if (logoResult.issue) issues.push(logoResult.issue);
    if (logoResult.suggestedECC) suggestedECC = logoResult.suggestedECC;

    // 3. Check pattern complexity (20% of score)
    const patternResult = this.checkPatternComplexity(options);
    score -= patternResult.penalty;
    if (patternResult.issue) issues.push(patternResult.issue);

    // 4. Check eye visibility (20% of score)
    const eyeResult = this.checkEyeVisibility(options);
    score -= eyeResult.penalty;
    if (eyeResult.issue) issues.push(eyeResult.issue);

    // 5. Check gradient complexity (bonus penalty)
    const gradientResult = this.checkGradientComplexity(options);
    score -= gradientResult.penalty;
    if (gradientResult.issue) issues.push(gradientResult.issue);

    // Generate recommendations based on score
    if (score < 90) {
      if (score < 70) {
        recommendations.push('Consider simplifying your design for better scanning reliability');
      }
      if (contrastResult.ratio < 7) {
        recommendations.push('Increase contrast between foreground and background colors');
      }
      if (options.logo && !suggestedECC) {
        recommendations.push('Use high error correction (H) when including logos');
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      issues,
      recommendations,
      suggestedECC,
      contrastRatio: contrastResult.ratio,
    };
  }

  /**
   * Check color contrast ratio
   */
  private checkContrast(options: QrCustomization): {
    penalty: number;
    ratio: number;
    issue?: ValidationIssue;
  } {
    const fg = options.colors?.foreground || '#000000';
    const bg = options.colors?.background || '#FFFFFF';

    const ratio = this.calculateContrastRatio(fg, bg);
    let penalty = 0;
    let issue: ValidationIssue | undefined;

    if (ratio < 3) {
      penalty = 40;
      issue = {
        type: 'contrast',
        severity: 'error',
        message: `Contrast ratio ${ratio.toFixed(1)}:1 is too low`,
        suggestion: 'Minimum contrast ratio should be 4.5:1 for reliable scanning',
      };
    } else if (ratio < 4.5) {
      penalty = 20;
      issue = {
        type: 'contrast',
        severity: 'warning',
        message: `Contrast ratio ${ratio.toFixed(1)}:1 is below recommended`,
        suggestion: 'Increase contrast to 4.5:1 or higher for best results',
      };
    } else if (ratio < 7) {
      penalty = 10;
      issue = {
        type: 'contrast',
        severity: 'warning',
        message: `Contrast ratio ${ratio.toFixed(1)}:1 is acceptable but could be better`,
        suggestion: 'Consider using 7:1 or higher for optimal scanning',
      };
    }

    return { penalty, ratio, issue };
  }

  /**
   * Check logo size and suggest error correction
   */
  private checkLogoSize(options: QrCustomization): {
    penalty: number;
    issue?: ValidationIssue;
    suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  } {
    const logoSize = options.logo_size_ratio || 0;
    let penalty = 0;
    let issue: ValidationIssue | undefined;
    let suggestedECC: 'L' | 'M' | 'Q' | 'H' | undefined;

    if (logoSize > 0.3) {
      penalty = 20;
      issue = {
        type: 'logo_size',
        severity: 'error',
        message: `Logo size ${(logoSize * 100).toFixed(0)}% exceeds maximum`,
        suggestion: 'Keep logo under 30% of QR code area',
      };
      suggestedECC = 'H';
    } else if (logoSize > 0.25) {
      penalty = 15;
      issue = {
        type: 'logo_size',
        severity: 'warning',
        message: `Logo size ${(logoSize * 100).toFixed(0)}% is large`,
        suggestion: 'Consider reducing to 25% or less',
      };
      suggestedECC = 'H';
    } else if (logoSize > 0.2) {
      penalty = 10;
      suggestedECC = 'H';
    } else if (logoSize > 0.15) {
      penalty = 5;
      suggestedECC = 'Q';
    } else if (logoSize > 0.1) {
      suggestedECC = 'M';
    }

    return { penalty, issue, suggestedECC };
  }

  /**
   * Check data pattern complexity
   */
  private checkPatternComplexity(options: QrCustomization): {
    penalty: number;
    issue?: ValidationIssue;
  } {
    const complexPatterns = ['wave', 'mosaic', 'random'];
    const moderatePatterns = ['star', 'cross', 'circular'];
    const pattern = options.data_pattern;

    let penalty = 0;
    let issue: ValidationIssue | undefined;

    if (pattern && complexPatterns.includes(pattern)) {
      penalty = 10;
      issue = {
        type: 'pattern_complexity',
        severity: 'warning',
        message: `Pattern '${pattern}' may reduce scan reliability`,
        suggestion: 'Consider simpler patterns like dots or rounded for better scanning',
      };
    } else if (pattern && moderatePatterns.includes(pattern)) {
      penalty = 5;
    }

    // Additional penalty for combining complex patterns with effects
    if (penalty > 0 && options.effects && options.effects.length > 0) {
      penalty += 5;
      if (issue) {
        issue.message += ' (especially with effects applied)';
      }
    }

    return { penalty, issue };
  }

  /**
   * Check eye/finder pattern visibility
   */
  private checkEyeVisibility(options: QrCustomization): {
    penalty: number;
    issue?: ValidationIssue;
  } {
    const ornamentalBorders = ['star', 'leaf', 'arrow'];
    const complexBorders = ['cross', 'hexagon'];

    const borderStyle = options.eye_border_style;
    const centerStyle = options.eye_center_style;

    let penalty = 0;
    let issue: ValidationIssue | undefined;

    // Check border style
    if (borderStyle && ornamentalBorders.includes(borderStyle)) {
      penalty = 10;
      issue = {
        type: 'eye_visibility',
        severity: 'warning',
        message: `Eye border style '${borderStyle}' may affect scanner recognition`,
        suggestion: 'Use structural styles like square, rounded_square, or circle for borders',
      };
    } else if (borderStyle && complexBorders.includes(borderStyle)) {
      penalty = 5;
    }

    // Additional penalty if center style is also complex
    if (centerStyle && ['star', 'diamond', 'cross'].includes(centerStyle) && penalty > 0) {
      penalty += 5;
      if (issue) {
        issue.message = 'Complex eye border and center combination reduces recognition';
      }
    }

    return { penalty, issue };
  }

  /**
   * Check gradient complexity
   */
  private checkGradientComplexity(options: QrCustomization): {
    penalty: number;
    issue?: ValidationIssue;
  } {
    const gradient = options.gradient;
    if (!gradient || gradient.enabled === false) return { penalty: 0 };

    let penalty = 0;
    let issue: ValidationIssue | undefined;

    // Complex gradient types
    if (['conic', 'spiral'].includes(gradient.gradient_type || '')) {
      penalty = 5;
    }

    // Too many colors
    if (gradient.colors && gradient.colors.length > 3) {
      penalty += 5;
      issue = {
        type: 'gradient_complexity',
        severity: 'warning',
        message: `Using ${gradient.colors.length} gradient colors may affect scanning`,
        suggestion: 'Limit gradients to 2-3 colors for best results',
      };
    }

    // Gradient on eyes can affect recognition
    if (gradient.apply_to_eyes) {
      penalty += 5;
      if (!issue) {
        issue = {
          type: 'gradient_complexity',
          severity: 'warning',
          message: 'Gradients on finder patterns may reduce scanner accuracy',
          suggestion: 'Consider applying gradients to data modules only',
        };
      }
    }

    return { penalty, issue };
  }

  /**
   * Calculate contrast ratio between two hex colors
   * Using WCAG 2.0 formula
   */
  private calculateContrastRatio(fg: string, bg: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = this.hexToRgb(hex);
      const [r, g, b] = rgb.map((val) => {
        const sRGB = val / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const fgLuminance = getLuminance(fg);
    const bgLuminance = getLuminance(bg);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const cleanHex = hex.replace('#', '');
    return [
      parseInt(cleanHex.substring(0, 2), 16),
      parseInt(cleanHex.substring(2, 4), 16),
      parseInt(cleanHex.substring(4, 6), 16),
    ];
  }
}

// Export singleton instance
export const scannabilityService = new ScannabilityService();
