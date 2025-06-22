/**
 * Template Service
 * Core business logic for Smart QR template management
 * Orchestrates template selection, application, and analytics
 */

import { LimitService } from './LimitService.js';
import { eventBus, emitSmartQREvent } from '../../infrastructure/events/EventBus.js';
import { Template } from '../entities/Template.js';
import { ITemplateRepository } from '../repositories/ITemplateRepository.js';

export interface ApplyTemplateResult {
  success: boolean;
  template: Template | null;
  config: any;
  remaining: number;
  message?: string;
  analyticsData?: {
    processingTime: number;
    cacheHit: boolean;
  };
}

export interface TemplateServiceConfig {
  enableAnalytics: boolean;
  enableCaching: boolean;
  fakeAnalysisDelay: number; // Milliseconds to simulate "AI analysis"
}

export class TemplateService {
  constructor(
    private templateRepo: ITemplateRepository,
    private limitService: LimitService,
    private config: TemplateServiceConfig = {
      enableAnalytics: true,
      enableCaching: true,
      fakeAnalysisDelay: 1500,
    }
  ) {
    this.setupEventHandlers();
  }

  /**
   * Apply a smart template to a URL
   * Main entry point for Smart QR generation
   */
  async applySmartTemplate(
    url: string,
    userId?: string,
    options?: {
      isPremium?: boolean;
      isUnlimited?: boolean;
      skipLimitCheck?: boolean;
      preferredTemplateId?: string;
    }
  ): Promise<ApplyTemplateResult> {
    const startTime = Date.now();

    try {
      // 1. Check user limits
      if (userId && !options?.skipLimitCheck) {
        const limitCheck = await this.limitService.checkLimit(
          userId,
          options?.isPremium || false,
          options?.isUnlimited || false
        );

        if (!limitCheck.allowed) {
          return {
            success: false,
            template: null,
            config: {},
            remaining: 0,
            message: `Daily limit reached. Resets at ${limitCheck.resetAt.toLocaleTimeString()}`,
          };
        }
      }

      // 2. Normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // 3. Find matching template
      let template: Template | null = null;

      // Check if user requested specific template
      if (options?.preferredTemplateId) {
        template = await this.templateRepo.findById(options.preferredTemplateId);
        if (template && !template.matches(normalizedUrl)) {
          // Template doesn't match URL, ignore preference
          template = null;
        }
      }

      // Find by URL if no preferred template or it didn't match
      if (!template) {
        template = await this.templateRepo.findByUrl(normalizedUrl);
      }

      // 4. Emit analytics event
      emitSmartQREvent('smartqr.requested', {
        url: normalizedUrl,
        userId,
        templateFound: !!template,
        timestamp: new Date(),
      });

      // 5. If no template found, emit event for tracking
      if (!template) {
        const domain = this.extractDomain(normalizedUrl);
        emitSmartQREvent('smartqr.template.notfound', {
          url: normalizedUrl,
          domain,
          userId,
          timestamp: new Date(),
        });

        return {
          success: true,
          template: null,
          config: {},
          remaining: userId
            ? await this.limitService.getRemainingToday(
                userId,
                options?.isPremium,
                options?.isUnlimited
              )
            : 3,
          message: 'No smart template available for this URL',
        };
      }

      // 6. Apply fake analysis delay for UX
      if (this.config.fakeAnalysisDelay > 0) {
        await this.simulateAnalysis(this.config.fakeAnalysisDelay);
      }

      // 7. Get template configuration
      const config = template.getVariant(userId);

      // 8. Record usage
      if (userId) {
        await this.limitService.recordUsage(
          userId,
          {
            templateId: template.id,
            url: normalizedUrl,
            processingTimeMs: Date.now() - startTime,
          },
          options?.isUnlimited || false
        );
      }

      // 9. Update template analytics
      if (this.config.enableAnalytics) {
        await this.templateRepo.updateAnalytics(template.id, {
          incrementUsage: true,
          lastUsed: new Date(),
        });
      }

      // 10. Emit success event
      const processingTime = Date.now() - startTime;
      emitSmartQREvent('smartqr.generated', {
        templateId: template.id,
        userId,
        url: normalizedUrl,
        processingTime,
        timestamp: new Date(),
      });

      // 11. Return result
      const remaining = userId
        ? await this.limitService.getRemainingToday(
            userId,
            options?.isPremium,
            options?.isUnlimited
          )
        : 2;

      return {
        success: true,
        template,
        config: this.enrichConfig(config, template),
        remaining,
        message: `Applied ${template.name} template`,
        analyticsData: {
          processingTime,
          cacheHit: false, // Future: implement caching
        },
      };
    } catch (error) {
      // Emit error event
      emitSmartQREvent('smartqr.failed', {
        error: error as Error,
        userId,
        url,
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<Template | null> {
    return await this.templateRepo.findById(id);
  }

  /**
   * Get all available templates
   */
  async getAvailableTemplates(options?: {
    includeInactive?: boolean;
    tag?: string;
  }): Promise<Template[]> {
    const result = await this.templateRepo.findAll({
      filter: {
        isActive: options?.includeInactive ? undefined : true,
        tags: options?.tag ? [options.tag] : undefined,
      },
      sort: {
        field: 'priority',
        direction: 'desc',
      },
    });

    return result.data;
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<Template[]> {
    return await this.templateRepo.findMostUsed(limit);
  }

  /**
   * Get user's recently used templates
   */
  async getUserRecentTemplates(userId: string, limit: number = 5): Promise<Template[]> {
    // Future: implement user-specific tracking
    return await this.templateRepo.findRecentlyUsed(limit);
  }

  /**
   * Get template statistics
   */
  async getStatistics() {
    return await this.templateRepo.getStatistics();
  }

  /**
   * Check which domains don't have templates
   */
  async findUncoveredDomains(urls: string[]): Promise<string[]> {
    const domains = urls.map((url) => this.extractDomain(url));
    const uniqueDomains = [...new Set(domains)];
    return await this.templateRepo.findUncoveredDomains(uniqueDomains);
  }

  /**
   * Preview template configuration without applying
   */
  async previewTemplate(
    templateId: string,
    url: string
  ): Promise<{
    template: Template;
    config: any;
    preview: string;
  } | null> {
    const template = await this.templateRepo.findById(templateId);
    if (!template) return null;

    const config = template.getVariant();

    return {
      template,
      config: this.enrichConfig(config, template),
      preview: this.generatePreviewDescription(template, url),
    };
  }

  /**
   * Create or update a template (admin function)
   */
  async saveTemplate(template: Template): Promise<void> {
    await this.templateRepo.save(template);

    emitSmartQREvent('smartqr.analytics.track', {
      event: 'template.saved',
      properties: {
        templateId: template.id,
        isNew: !(await this.templateRepo.exists(template.id)),
      },
      timestamp: new Date(),
    });
  }

  /**
   * Delete a template (admin function)
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepo.delete(id);

    emitSmartQREvent('smartqr.analytics.track', {
      event: 'template.deleted',
      properties: { templateId: id },
      timestamp: new Date(),
    });
  }

  private normalizeUrl(url: string): string {
    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
      url = `https://${url}`;
    }

    // Remove trailing slash
    return url.replace(/\/$/, '');
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // Fallback for invalid URLs
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  private enrichConfig(config: any, template: Template): any {
    // Add metadata that might be useful for the QR generator
    return {
      ...config,
      _metadata: {
        templateId: template.id,
        templateName: template.name,
        templateVersion: template.version,
        appliedAt: new Date().toISOString(),
      },
    };
  }

  private async simulateAnalysis(delay: number): Promise<void> {
    // Fake delay to simulate "AI analysis"
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private generatePreviewDescription(template: Template, url: string): string {
    const domain = this.extractDomain(url);
    const features: string[] = [];

    if (template.config.gradient) {
      features.push(`${template.config.gradient.type} gradient`);
    }
    if (template.config.eyeShape) {
      features.push(`${template.config.eyeShape} corners`);
    }
    if (template.config.logo) {
      features.push('custom logo');
    }
    if (template.config.effects?.length) {
      features.push(`${template.config.effects.length} visual effects`);
    }

    return `Smart QR for ${domain} with ${features.join(', ')}`;
  }

  private setupEventHandlers(): void {
    // Listen for analytics events if enabled
    if (this.config.enableAnalytics) {
      eventBus.on('smartqr.generated', async (data) => {
        // Future: Send to analytics service
        console.log('[SmartQR Analytics] Generated:', data);
      });

      eventBus.on('smartqr.template.notfound', async (data) => {
        // Future: Track domains that need templates
        console.log('[SmartQR Analytics] Template not found for:', data.domain);
      });
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: string, days: number = 7) {
    return await this.limitService.getUsageStats(userId, days);
  }

  /**
   * Reset user usage (admin function)
   */
  async resetUserUsage(userId: string): Promise<void> {
    await this.limitService.resetUsage(userId);

    emitSmartQREvent('smartqr.analytics.track', {
      event: 'usage.reset',
      properties: { userId },
      userId,
      timestamp: new Date(),
    });
  }
}
