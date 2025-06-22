/**
 * Template Entity
 * Core business entity for Smart QR templates
 * Designed to be extensible for future features
 */

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
  colors: string[];
  angle?: number;
}

export interface LogoConfig {
  url: string;
  size: number;
  padding?: number;
  shape?: 'square' | 'circle' | 'rounded';
}

export interface TemplateConfig {
  gradient?: GradientConfig;
  eyeShape?: string;
  dataPattern?: string;
  logo?: LogoConfig;
  effects?: string[];
  frame?: {
    type: string;
    text?: string;
  };
  // Extensible for future properties
  [key: string]: any;
}

export interface TemplateAnalytics {
  usage: number;
  conversionRate: number;
  lastUsed: Date;
  averageGenerationTime?: number;
  userSatisfactionScore?: number;
}

export interface TemplateMetadata {
  domains: string[];
  priority: number;
  tags: string[];
  analytics: TemplateAnalytics;
  // Future: A/B testing variants
  variants?: Record<string, Partial<TemplateConfig>>;
  // Future: Conditional rules
  conditions?: Array<{
    rule: string;
    config: Partial<TemplateConfig>;
  }>;
}

export class Template {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string = '1.0.0',
    public readonly config: TemplateConfig,
    public readonly metadata: TemplateMetadata,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Check if a URL matches this template
   */
  matches(url: string): boolean {
    if (!this.isActive) return false;

    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = urlObj.hostname.toLowerCase();

      return this.metadata.domains.some((domain) => {
        const domainLower = domain.toLowerCase();
        return hostname === domainLower || hostname.endsWith(`.${domainLower}`);
      });
    } catch {
      // If URL parsing fails, try simple string matching
      const urlLower = url.toLowerCase();
      return this.metadata.domains.some((domain) => urlLower.includes(domain.toLowerCase()));
    }
  }

  /**
   * Check version compatibility for future migrations
   */
  isCompatibleWith(version: string): boolean {
    const [major] = this.version.split('.');
    const [requestedMajor] = version.split('.');
    return major === requestedMajor;
  }

  /**
   * Get template variant based on user or conditions
   * Ready for A/B testing in the future
   */
  getVariant(userId?: string, context?: any): TemplateConfig {
    // Future: Implement A/B testing logic
    // Future: Apply conditional rules based on context
    return this.config;
  }

  /**
   * Clone template with modifications
   * Useful for creating variations
   */
  clone(modifications: Partial<Template>): Template {
    return new Template(
      modifications.id || `${this.id}-clone`,
      modifications.name || this.name,
      modifications.version || this.version,
      { ...this.config, ...(modifications.config || {}) },
      { ...this.metadata, ...(modifications.metadata || {}) },
      modifications.isActive ?? this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update analytics data
   */
  recordUsage(): void {
    this.metadata.analytics.usage++;
    this.metadata.analytics.lastUsed = new Date();
  }

  /**
   * Get priority score for sorting templates
   */
  getPriorityScore(): number {
    const basePriority = this.metadata.priority;
    const usageBoost = Math.log10(this.metadata.analytics.usage + 1) * 10;
    const recencyBoost = this.wasUsedRecently() ? 5 : 0;

    return basePriority + usageBoost + recencyBoost;
  }

  private wasUsedRecently(): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.metadata.analytics.lastUsed > oneDayAgo;
  }
}

// Type guards
export function isTemplate(obj: any): obj is Template {
  return (
    obj instanceof Template ||
    (typeof obj === 'object' &&
      'id' in obj &&
      'name' in obj &&
      'config' in obj &&
      'metadata' in obj)
  );
}
