/**
 * Usage Entity
 * Tracks Smart QR usage per user for rate limiting and analytics
 */

export interface UsageMetadata {
  templateId?: string;
  url: string;
  generatedAt: Date;
  processingTimeMs?: number;
  userAgent?: string;
  ipAddress?: string;
}

export class Usage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly count: number,
    public readonly metadata: UsageMetadata[] = [],
    public readonly dailyLimit: number = 3
  ) {}

  /**
   * Check if user can generate more Smart QRs today
   */
  canGenerate(): boolean {
    return this.count < this.dailyLimit;
  }

  /**
   * Get remaining generations for today
   */
  getRemainingToday(): number {
    return Math.max(0, this.dailyLimit - this.count);
  }

  /**
   * Record a new usage
   */
  recordUsage(metadata: UsageMetadata): Usage {
    if (!this.canGenerate()) {
      throw new Error('Daily limit reached');
    }

    return new Usage(
      this.id,
      this.userId,
      this.date,
      this.count + 1,
      [...this.metadata, metadata],
      this.dailyLimit
    );
  }

  /**
   * Check if usage is for today
   */
  isToday(): boolean {
    const today = new Date();
    return (
      this.date.getFullYear() === today.getFullYear() &&
      this.date.getMonth() === today.getMonth() &&
      this.date.getDate() === today.getDate()
    );
  }

  /**
   * Get usage statistics
   */
  getStats() {
    const templateUsage = this.metadata.reduce(
      (acc, meta) => {
        if (meta.templateId) {
          acc[meta.templateId] = (acc[meta.templateId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const avgProcessingTime =
      this.metadata
        .filter((m) => m.processingTimeMs)
        .reduce((sum, m) => sum + (m.processingTimeMs || 0), 0) /
        this.metadata.filter((m) => m.processingTimeMs).length || 0;

    return {
      totalUsage: this.count,
      remaining: this.getRemainingToday(),
      templateBreakdown: templateUsage,
      averageProcessingTime: avgProcessingTime,
      lastUsed: this.metadata[this.metadata.length - 1]?.generatedAt,
    };
  }

  /**
   * Check if user is approaching limit (for warnings)
   */
  isApproachingLimit(): boolean {
    return this.count === this.dailyLimit - 1;
  }

  /**
   * Get usage for specific template
   */
  getTemplateUsage(templateId: string): number {
    return this.metadata.filter((m) => m.templateId === templateId).length;
  }

  /**
   * Create empty usage for new day
   */
  static createForToday(userId: string, dailyLimit: number = 3): Usage {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Usage(
      `usage_${userId}_${today.toISOString().split('T')[0]}`,
      userId,
      today,
      0,
      [],
      dailyLimit
    );
  }
}

// Aggregated usage stats for analytics
export interface UsageStats {
  userId: string;
  period: 'day' | 'week' | 'month' | 'all';
  totalGenerated: number;
  uniqueTemplates: number;
  mostUsedTemplate?: string;
  averagePerDay: number;
  peakUsageDay?: Date;
  urlDomains: Record<string, number>;
}

// Type guard
export function isUsage(obj: any): obj is Usage {
  return (
    obj instanceof Usage ||
    (typeof obj === 'object' && 'userId' in obj && 'date' in obj && 'count' in obj)
  );
}
