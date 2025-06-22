/**
 * Client-side Validation Cache
 * 
 * Implements a LRU (Least Recently Used) cache for validation results
 * to reduce redundant API calls and improve performance.
 * 
 * @module validationCache
 * @since 2025-06-17
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  onEvict?: (key: string, value: any) => void;
}

export class ValidationCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: string, value: any) => void;
  
  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.onEvict = options.onEvict;
  }
  
  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count and move to end (LRU)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }
  
  /**
   * Set a value in cache
   */
  set(key: string, value: T): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      hits: 0,
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.value);
      });
    }
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
  } {
    let totalHits = 0;
    this.cache.forEach(entry => {
      totalHits += entry.hits;
    });
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalHits,
    };
  }
  
  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    // Map maintains insertion order, so first entry is oldest
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.delete(firstKey);
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }
}

// Singleton instances for different validation types
export const urlValidationCache = new ValidationCache({
  maxSize: 200,
  ttl: 10 * 60 * 1000, // 10 minutes for URL validations
});

export const qrValidationCache = new ValidationCache({
  maxSize: 500,
  ttl: 30 * 60 * 1000, // 30 minutes for QR validations
});

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    urlValidationCache.cleanup();
    qrValidationCache.cleanup();
  }, 60 * 1000); // Clean up every minute
}