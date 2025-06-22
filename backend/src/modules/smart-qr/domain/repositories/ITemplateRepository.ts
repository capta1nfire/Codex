/**
 * Template Repository Interface
 * Defines the contract for template data access
 * Implementation agnostic - can be in-memory, database, or external service
 */

import { Template } from '../entities/Template.js';

export interface TemplateFilter {
  tags?: string[];
  isActive?: boolean;
  domains?: string[];
  minUsage?: number;
  maxUsage?: number;
}

export interface TemplateSortOptions {
  field: 'usage' | 'priority' | 'name' | 'createdAt' | 'lastUsed';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ITemplateRepository {
  /**
   * Find template by ID
   */
  findById(id: string): Promise<Template | null>;

  /**
   * Find template that matches a given URL
   * Should return highest priority template if multiple match
   */
  findByUrl(url: string): Promise<Template | null>;

  /**
   * Find all templates
   */
  findAll(options?: {
    filter?: TemplateFilter;
    sort?: TemplateSortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<Template>>;

  /**
   * Find templates by tag
   */
  findByTag(tag: string): Promise<Template[]>;

  /**
   * Find most used templates
   */
  findMostUsed(limit: number): Promise<Template[]>;

  /**
   * Find recently used templates
   */
  findRecentlyUsed(limit: number): Promise<Template[]>;

  /**
   * Save or update a template
   */
  save(template: Template): Promise<void>;

  /**
   * Save multiple templates
   */
  saveMany(templates: Template[]): Promise<void>;

  /**
   * Delete a template
   */
  delete(id: string): Promise<void>;

  /**
   * Update template analytics
   */
  updateAnalytics(
    id: string,
    analytics: {
      incrementUsage?: boolean;
      conversionRate?: number;
      lastUsed?: Date;
    }
  ): Promise<void>;

  /**
   * Find templates without coverage for given domains
   */
  findUncoveredDomains(domains: string[]): Promise<string[]>;

  /**
   * Get template statistics
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    totalUsage: number;
    averageUsagePerTemplate: number;
    mostUsedTemplateId: string | null;
    templatesByTag: Record<string, number>;
  }>;

  /**
   * Search templates by name or domain
   */
  search(query: string): Promise<Template[]>;

  /**
   * Check if a template exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get templates that need review (low conversion, old, etc.)
   */
  findTemplatesNeedingReview(): Promise<Template[]>;

  /**
   * Clone a template
   */
  clone(id: string, newId: string, modifications?: Partial<Template>): Promise<Template>;

  /**
   * Bulk update templates
   */
  bulkUpdate(
    updates: Array<{
      id: string;
      changes: Partial<Template>;
    }>
  ): Promise<void>;
}

// Error types for repository operations
export class TemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`Template with id ${id} not found`);
    this.name = 'TemplateNotFoundError';
  }
}

export class TemplateDuplicateError extends Error {
  constructor(id: string) {
    super(`Template with id ${id} already exists`);
    this.name = 'TemplateDuplicateError';
  }
}

export class TemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateValidationError';
  }
}
