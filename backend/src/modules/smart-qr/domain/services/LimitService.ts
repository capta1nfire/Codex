/**
 * Limit Service
 * Manages usage limits for Smart QR generation
 * Currently uses Redis for fast access, can be replaced with database
 */

import { redis } from '../../../../lib/redis.js';
import { Usage } from '../entities/Usage.js';
import { eventBus } from '../../infrastructure/events/EventBus.js';

export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export interface LimitServiceConfig {
  dailyLimit: number;
  premiumDailyLimit?: number;
  resetHour?: number; // Hour of day to reset (0-23)
}

export class LimitService {
  private config: Required<LimitServiceConfig>;

  constructor(config: LimitServiceConfig) {
    this.config = {
      dailyLimit: config.dailyLimit,
      premiumDailyLimit: config.premiumDailyLimit || config.dailyLimit * 2,
      resetHour: config.resetHour || 0
    };
  }

  /**
   * Check if a user can generate a Smart QR
   */
  async checkLimit(userId: string, isPremium: boolean = false): Promise<LimitCheckResult> {
    const key = this.getUserKey(userId);
    const count = await this.getCurrentCount(key);
    const limit = isPremium ? this.config.premiumDailyLimit : this.config.dailyLimit;
    const resetAt = this.getResetTime();

    const allowed = count < limit;
    const remaining = Math.max(0, limit - count);

    // Emit event if limit reached
    if (!allowed) {
      eventBus.emit('smartqr.limit.reached', {
        userId,
        currentCount: count,
        limit,
        timestamp: new Date()
      });
    }

    return {
      allowed,
      remaining,
      resetAt,
      limit
    };
  }

  /**
   * Record usage when a Smart QR is generated
   */
  async recordUsage(userId: string, metadata?: {
    templateId?: string;
    url: string;
    processingTimeMs?: number;
  }): Promise<number> {
    const key = this.getUserKey(userId);
    
    // Increment counter
    const newCount = await redis.incr(key);
    
    // Set expiration on first use of the day
    if (newCount === 1) {
      const ttl = this.getSecondsUntilReset();
      await redis.expire(key, ttl);
    }

    // Store detailed usage data if metadata provided
    if (metadata) {
      await this.storeUsageMetadata(userId, metadata);
    }

    return newCount;
  }

  /**
   * Get remaining usage for today
   */
  async getRemainingToday(userId: string, isPremium: boolean = false): Promise<number> {
    const key = this.getUserKey(userId);
    const count = await this.getCurrentCount(key);
    const limit = isPremium ? this.config.premiumDailyLimit : this.config.dailyLimit;
    
    return Math.max(0, limit - count);
  }

  /**
   * Get current usage count
   */
  async getCurrentUsage(userId: string): Promise<number> {
    const key = this.getUserKey(userId);
    return await this.getCurrentCount(key);
  }

  /**
   * Reset usage for a user (admin function)
   */
  async resetUsage(userId: string): Promise<void> {
    const key = this.getUserKey(userId);
    await redis.del(key);
    
    // Also clear metadata
    const metadataKey = this.getMetadataKey(userId);
    await redis.del(metadataKey);
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string, days: number = 7): Promise<{
    daily: Array<{ date: string; count: number }>;
    total: number;
    averagePerDay: number;
  }> {
    const stats: Array<{ date: string; count: number }> = [];
    let total = 0;

    // Get historical data for past days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = this.getDateString(date);
      const key = `smartqr:usage:${userId}:${dateStr}`;
      
      const count = await this.getCurrentCount(key);
      stats.push({ date: dateStr, count });
      total += count;
    }

    return {
      daily: stats.reverse(),
      total,
      averagePerDay: total / days
    };
  }

  /**
   * Bulk check limits for multiple users
   */
  async bulkCheckLimits(userIds: string[]): Promise<Map<string, LimitCheckResult>> {
    const results = new Map<string, LimitCheckResult>();
    
    // Use pipeline for efficiency
    const pipeline = redis.pipeline();
    const keys = userIds.map(id => this.getUserKey(id));
    
    keys.forEach(key => pipeline.get(key));
    
    const counts = await pipeline.exec();
    
    userIds.forEach((userId, index) => {
      const count = parseInt(counts?.[index]?.[1] as string || '0');
      const limit = this.config.dailyLimit; // Default to regular limit
      
      results.set(userId, {
        allowed: count < limit,
        remaining: Math.max(0, limit - count),
        resetAt: this.getResetTime(),
        limit
      });
    });

    return results;
  }

  /**
   * Adjust limit for specific user (temporary override)
   */
  async setTemporaryLimit(userId: string, limit: number, duration: number): Promise<void> {
    const key = `smartqr:limit:override:${userId}`;
    await redis.setex(key, duration, limit.toString());
  }

  /**
   * Get effective limit for user
   */
  async getEffectiveLimit(userId: string, isPremium: boolean = false): Promise<number> {
    // Check for temporary override
    const overrideKey = `smartqr:limit:override:${userId}`;
    const override = await redis.get(overrideKey);
    
    if (override) {
      return parseInt(override);
    }

    return isPremium ? this.config.premiumDailyLimit : this.config.dailyLimit;
  }

  private async getCurrentCount(key: string): Promise<number> {
    const value = await redis.get(key);
    return parseInt(value || '0');
  }

  private getUserKey(userId: string): string {
    const dateStr = this.getDateString();
    return `smartqr:usage:${userId}:${dateStr}`;
  }

  private getMetadataKey(userId: string): string {
    const dateStr = this.getDateString();
    return `smartqr:metadata:${userId}:${dateStr}`;
  }

  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  private getResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.config.resetHour, 0, 0, 0);
    return tomorrow;
  }

  private getSecondsUntilReset(): number {
    const now = new Date();
    const reset = this.getResetTime();
    return Math.floor((reset.getTime() - now.getTime()) / 1000);
  }

  private async storeUsageMetadata(userId: string, metadata: {
    templateId?: string;
    url: string;
    processingTimeMs?: number;
  }): Promise<void> {
    const key = this.getMetadataKey(userId);
    const data = {
      ...metadata,
      timestamp: new Date().toISOString()
    };

    // Store as list in Redis
    await redis.rpush(key, JSON.stringify(data));
    
    // Set expiration if this is the first entry
    const length = await redis.llen(key);
    if (length === 1) {
      const ttl = this.getSecondsUntilReset();
      await redis.expire(key, ttl);
    }
  }

  /**
   * Get detailed usage for a specific day
   */
  async getDetailedUsage(userId: string, date?: Date): Promise<Usage | null> {
    const targetDate = date || new Date();
    const dateStr = this.getDateString(targetDate);
    const countKey = `smartqr:usage:${userId}:${dateStr}`;
    const metadataKey = `smartqr:metadata:${userId}:${dateStr}`;

    const count = await this.getCurrentCount(countKey);
    if (count === 0) return null;

    // Get metadata
    const metadataList = await redis.lrange(metadataKey, 0, -1);
    const metadata = metadataList.map(item => JSON.parse(item));

    return new Usage(
      `usage_${userId}_${dateStr}`,
      userId,
      targetDate,
      count,
      metadata,
      this.config.dailyLimit
    );
  }
}