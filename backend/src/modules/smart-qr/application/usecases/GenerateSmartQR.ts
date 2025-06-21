/**
 * Generate Smart QR Use Case
 * Application layer that coordinates the Smart QR generation process
 * Handles the complete flow from request to response
 */

import { TemplateService } from '../../domain/services/TemplateService.js';
import { Template } from '../../domain/entities/Template.js';

export interface GenerateSmartQRRequest {
  url: string;
  userId?: string;
  userRole?: string;
  preferredTemplateId?: string;
  options?: {
    skipAnalysisDelay?: boolean;
    returnFullTemplate?: boolean;
  };
}

export interface GenerateSmartQRResponse {
  success: boolean;
  data?: {
    templateApplied: boolean;
    templateId?: string;
    templateName?: string;
    configuration: any;
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

export class GenerateSmartQRUseCase {
  constructor(private templateService: TemplateService) {}

  async execute(request: GenerateSmartQRRequest): Promise<GenerateSmartQRResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError
          }
        };
      }

      // Check if user is authenticated for Smart QR
      if (!request.userId) {
        return {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Smart QR requires user authentication'
          }
        };
      }

      // Apply smart template
      const result = await this.templateService.applySmartTemplate(
        request.url,
        request.userId,
        {
          isPremium: request.userRole === 'premium' || request.userRole === 'admin',
          skipLimitCheck: request.userRole === 'admin',
          preferredTemplateId: request.preferredTemplateId
        }
      );

      // Handle limit reached
      if (!result.success && result.message?.includes('limit')) {
        return {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: result.message,
            details: {
              remaining: result.remaining
            }
          }
        };
      }

      // Extract domain for metadata
      const domain = this.extractDomain(request.url);

      // Build response
      const response: GenerateSmartQRResponse = {
        success: true,
        data: {
          templateApplied: !!result.template,
          templateId: result.template?.id,
          templateName: result.template?.name,
          configuration: this.buildConfiguration(result),
          remaining: result.remaining,
          metadata: {
            analysisTime: Date.now() - startTime,
            domain,
            isKnownDomain: !!result.template
          }
        }
      };

      // Add full template data if requested (for admin/debugging)
      if (request.options?.returnFullTemplate && result.template) {
        response.data!.configuration._fullTemplate = result.template;
      }

      return response;

    } catch (error) {
      console.error('[GenerateSmartQR] Error:', error);
      
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate Smart QR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get available templates for a URL
   */
  async getAvailableTemplates(url: string): Promise<{
    templates: Array<{
      id: string;
      name: string;
      preview: string;
      tags: string[];
    }>;
    recommendedId?: string;
  }> {
    // Get all templates
    const allTemplates = await this.templateService.getAvailableTemplates();
    
    // Filter templates that match the URL
    const matchingTemplates = allTemplates.filter(t => t.matches(url));
    
    // Find the recommended one (highest priority)
    const recommended = matchingTemplates
      .sort((a, b) => b.getPriorityScore() - a.getPriorityScore())[0];

    return {
      templates: matchingTemplates.map(t => ({
        id: t.id,
        name: t.name,
        preview: this.generatePreview(t),
        tags: t.metadata.tags
      })),
      recommendedId: recommended?.id
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string, days: number = 7): Promise<{
    usage: any;
    favoriteTemplates: string[];
    remainingToday: number;
  }> {
    const usage = await this.templateService.getUserUsageStats(userId, days);
    
    // Future: Get favorite templates from user preferences
    const favoriteTemplates: string[] = [];

    // Get remaining for today
    const limitService = (this.templateService as any).limitService;
    const remainingToday = await limitService.getRemainingToday(userId);

    return {
      usage,
      favoriteTemplates,
      remainingToday
    };
  }

  private validateRequest(request: GenerateSmartQRRequest): string | null {
    if (!request.url || request.url.trim().length === 0) {
      return 'URL is required';
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    const normalizedUrl = request.url.startsWith('http') ? 
      request.url : `https://${request.url}`;
    
    if (!urlPattern.test(normalizedUrl)) {
      return 'Invalid URL format';
    }

    return null;
  }

  private extractDomain(url: string): string {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(normalizedUrl);
      return urlObj.hostname;
    } catch {
      return url.split('/')[0];
    }
  }

  private buildConfiguration(result: any): any {
    // If template was applied, return its config
    if (result.template && result.config) {
      return {
        ...result.config,
        _smartQR: {
          version: '1.0.0',
          templateApplied: true,
          templateId: result.template.id
        }
      };
    }

    // Return default config for non-template QRs
    return {
      _smartQR: {
        version: '1.0.0',
        templateApplied: false,
        reason: 'No template available for this domain'
      }
    };
  }

  private generatePreview(template: Template): string {
    const features: string[] = [];
    
    if (template.config.gradient) {
      features.push('Custom gradient');
    }
    if (template.config.logo) {
      features.push('Brand logo');
    }
    if (template.config.effects?.length) {
      features.push('Visual effects');
    }

    return features.join(' • ') || 'Standard design';
  }
}