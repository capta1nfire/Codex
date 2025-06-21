/**
 * In-Memory Template Repository Implementation
 * Phase 1 implementation with hardcoded templates
 * Easy to replace with database implementation later
 */

import { Template, TemplateConfig, TemplateMetadata } from '../../domain/entities/Template.js';
import {
  ITemplateRepository,
  TemplateFilter,
  TemplateSortOptions,
  PaginationOptions,
  PaginatedResult,
  TemplateNotFoundError,
  TemplateDuplicateError
} from '../../domain/repositories/ITemplateRepository.js';

export class InMemoryTemplateRepository implements ITemplateRepository {
  private templates: Map<string, Template>;
  
  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Instagram Template
    const instagramTemplate = new Template(
      'instagram-v1',
      'Instagram Style',
      '1.0.0',
      {
        gradient: {
          type: 'radial',
          colors: ['#833AB4', '#FD1D1D', '#FCAF45'],
          angle: 45
        },
        eyeShape: 'rounded',
        dataPattern: 'dots',
        logo: {
          url: '/logos/instagram.svg',
          size: 0.3,
          padding: 10,
          shape: 'rounded'
        },
        effects: ['subtle-shadow']
      },
      {
        domains: ['instagram.com', 'www.instagram.com'],
        priority: 100,
        tags: ['social', 'photo', 'popular'],
        analytics: {
          usage: 0,
          conversionRate: 0,
          lastUsed: new Date()
        }
      }
    );

    // YouTube Template
    const youtubeTemplate = new Template(
      'youtube-v1',
      'YouTube Style',
      '1.0.0',
      {
        gradient: {
          type: 'linear',
          colors: ['#FF0000', '#CC0000'],
          angle: 90
        },
        eyeShape: 'square',
        dataPattern: 'square',
        logo: {
          url: '/logos/youtube.svg',
          size: 0.25,
          padding: 8,
          shape: 'square'
        },
        frame: {
          type: 'simple',
          text: 'Watch on YouTube'
        }
      },
      {
        domains: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
        priority: 95,
        tags: ['social', 'video', 'popular'],
        analytics: {
          usage: 0,
          conversionRate: 0,
          lastUsed: new Date()
        }
      }
    );

    this.templates.set(instagramTemplate.id, instagramTemplate);
    this.templates.set(youtubeTemplate.id, youtubeTemplate);
  }

  async findById(id: string): Promise<Template | null> {
    return this.templates.get(id) || null;
  }

  async findByUrl(url: string): Promise<Template | null> {
    // Find all matching templates
    const matches: Template[] = [];
    
    for (const template of this.templates.values()) {
      if (template.matches(url)) {
        matches.push(template);
      }
    }

    // Return highest priority match
    if (matches.length === 0) return null;
    
    return matches.sort((a, b) => b.getPriorityScore() - a.getPriorityScore())[0];
  }

  async findAll(options?: {
    filter?: TemplateFilter;
    sort?: TemplateSortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<Template>> {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (options?.filter) {
      templates = this.applyFilter(templates, options.filter);
    }

    // Apply sorting
    if (options?.sort) {
      templates = this.applySort(templates, options.sort);
    }

    const total = templates.length;

    // Apply pagination
    if (options?.pagination) {
      const { page, limit } = options.pagination;
      const start = (page - 1) * limit;
      templates = templates.slice(start, start + limit);
    }

    return {
      data: templates,
      total,
      page: options?.pagination?.page || 1,
      totalPages: options?.pagination ? Math.ceil(total / options.pagination.limit) : 1
    };
  }

  async findByTag(tag: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(template =>
      template.metadata.tags.includes(tag)
    );
  }

  async findMostUsed(limit: number): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => b.metadata.analytics.usage - a.metadata.analytics.usage)
      .slice(0, limit);
  }

  async findRecentlyUsed(limit: number): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(t => t.metadata.analytics.usage > 0)
      .sort((a, b) => 
        b.metadata.analytics.lastUsed.getTime() - a.metadata.analytics.lastUsed.getTime()
      )
      .slice(0, limit);
  }

  async save(template: Template): Promise<void> {
    this.templates.set(template.id, template);
  }

  async saveMany(templates: Template[]): Promise<void> {
    for (const template of templates) {
      await this.save(template);
    }
  }

  async delete(id: string): Promise<void> {
    if (!this.templates.has(id)) {
      throw new TemplateNotFoundError(id);
    }
    this.templates.delete(id);
  }

  async updateAnalytics(id: string, analytics: {
    incrementUsage?: boolean;
    conversionRate?: number;
    lastUsed?: Date;
  }): Promise<void> {
    const template = await this.findById(id);
    if (!template) {
      throw new TemplateNotFoundError(id);
    }

    if (analytics.incrementUsage) {
      template.metadata.analytics.usage++;
    }
    if (analytics.conversionRate !== undefined) {
      template.metadata.analytics.conversionRate = analytics.conversionRate;
    }
    if (analytics.lastUsed) {
      template.metadata.analytics.lastUsed = analytics.lastUsed;
    }

    await this.save(template);
  }

  async findUncoveredDomains(domains: string[]): Promise<string[]> {
    const uncovered: string[] = [];
    
    for (const domain of domains) {
      const template = await this.findByUrl(domain);
      if (!template) {
        uncovered.push(domain);
      }
    }
    
    return uncovered;
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    totalUsage: number;
    averageUsagePerTemplate: number;
    mostUsedTemplateId: string | null;
    templatesByTag: Record<string, number>;
  }> {
    const templates = Array.from(this.templates.values());
    const active = templates.filter(t => t.isActive).length;
    const totalUsage = templates.reduce((sum, t) => sum + t.metadata.analytics.usage, 0);
    
    const templatesByTag: Record<string, number> = {};
    templates.forEach(t => {
      t.metadata.tags.forEach(tag => {
        templatesByTag[tag] = (templatesByTag[tag] || 0) + 1;
      });
    });

    const mostUsed = templates
      .filter(t => t.metadata.analytics.usage > 0)
      .sort((a, b) => b.metadata.analytics.usage - a.metadata.analytics.usage)[0];

    return {
      total: templates.length,
      active,
      totalUsage,
      averageUsagePerTemplate: templates.length > 0 ? totalUsage / templates.length : 0,
      mostUsedTemplateId: mostUsed?.id || null,
      templatesByTag
    };
  }

  async search(query: string): Promise<Template[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(queryLower) ||
      template.metadata.domains.some(d => d.includes(queryLower)) ||
      template.metadata.tags.some(t => t.includes(queryLower))
    );
  }

  async exists(id: string): Promise<boolean> {
    return this.templates.has(id);
  }

  async findTemplatesNeedingReview(): Promise<Template[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Array.from(this.templates.values()).filter(template => {
      // Low conversion rate
      if (template.metadata.analytics.usage > 10 && 
          template.metadata.analytics.conversionRate < 0.1) {
        return true;
      }
      
      // Not used recently
      if (template.metadata.analytics.lastUsed < thirtyDaysAgo) {
        return true;
      }

      return false;
    });
  }

  async clone(id: string, newId: string, modifications?: Partial<Template>): Promise<Template> {
    const original = await this.findById(id);
    if (!original) {
      throw new TemplateNotFoundError(id);
    }

    if (await this.exists(newId)) {
      throw new TemplateDuplicateError(newId);
    }

    const cloned = original.clone({ ...modifications, id: newId });
    await this.save(cloned);
    
    return cloned;
  }

  async bulkUpdate(updates: Array<{ id: string; changes: Partial<Template> }>): Promise<void> {
    for (const { id, changes } of updates) {
      const template = await this.findById(id);
      if (!template) {
        throw new TemplateNotFoundError(id);
      }

      // Apply changes
      const updated = new Template(
        id,
        changes.name || template.name,
        changes.version || template.version,
        { ...template.config, ...(changes.config || {}) },
        { ...template.metadata, ...(changes.metadata || {}) },
        changes.isActive ?? template.isActive,
        template.createdAt,
        new Date()
      );

      await this.save(updated);
    }
  }

  private applyFilter(templates: Template[], filter: TemplateFilter): Template[] {
    return templates.filter(template => {
      if (filter.isActive !== undefined && template.isActive !== filter.isActive) {
        return false;
      }
      
      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some(tag => template.metadata.tags.includes(tag));
        if (!hasTag) return false;
      }

      if (filter.domains && filter.domains.length > 0) {
        const hasDomain = filter.domains.some(domain => 
          template.metadata.domains.includes(domain)
        );
        if (!hasDomain) return false;
      }

      if (filter.minUsage !== undefined && 
          template.metadata.analytics.usage < filter.minUsage) {
        return false;
      }

      if (filter.maxUsage !== undefined && 
          template.metadata.analytics.usage > filter.maxUsage) {
        return false;
      }

      return true;
    });
  }

  private applySort(templates: Template[], sort: TemplateSortOptions): Template[] {
    const sorted = [...templates];
    const direction = sort.direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sort.field) {
        case 'usage':
          return (a.metadata.analytics.usage - b.metadata.analytics.usage) * direction;
        case 'priority':
          return (a.metadata.priority - b.metadata.priority) * direction;
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
        case 'lastUsed':
          return (a.metadata.analytics.lastUsed.getTime() - 
                  b.metadata.analytics.lastUsed.getTime()) * direction;
        default:
          return 0;
      }
    });

    return sorted;
  }
}