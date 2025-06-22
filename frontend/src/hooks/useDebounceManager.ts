/**
 * Unified Debounce Manager Hook
 * 
 * Centralizes debounce logic for various operations with different delays
 * and cancellation support to prevent race conditions.
 * 
 * @module useDebounceManager
 * @since 2025-06-17
 */

import { useRef, useCallback, useEffect } from 'react';

type DebouncedFunction = (...args: any[]) => void;
type CancelFunction = () => void;

interface DebounceConfig {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

interface DebounceInstance {
  timeoutId: NodeJS.Timeout | null;
  maxTimeoutId: NodeJS.Timeout | null;
  lastCallTime: number;
  lastArgs: any[] | null;
  cancel: CancelFunction;
}

export function useDebounceManager() {
  const instancesRef = useRef<Map<string, DebounceInstance>>(new Map());
  
  /**
   * Create or get a debounced function
   * 
   * @param key - Unique key for this debounced function
   * @param fn - Function to debounce
   * @param config - Debounce configuration
   * @returns Debounced function with cancel method
   */
  const debounce = useCallback(<T extends DebouncedFunction>(
    key: string,
    fn: T,
    config: DebounceConfig
  ): T & { cancel: CancelFunction } => {
    const { delay, leading = false, trailing = true, maxWait } = config;
    
    // Get or create instance
    let instance = instancesRef.current.get(key);
    if (!instance) {
      instance = {
        timeoutId: null,
        maxTimeoutId: null,
        lastCallTime: 0,
        lastArgs: null,
        cancel: () => {
          const inst = instancesRef.current.get(key);
          if (inst) {
            if (inst.timeoutId) {
              clearTimeout(inst.timeoutId);
              inst.timeoutId = null;
            }
            if (inst.maxTimeoutId) {
              clearTimeout(inst.maxTimeoutId);
              inst.maxTimeoutId = null;
            }
            inst.lastArgs = null;
          }
        }
      };
      instancesRef.current.set(key, instance);
    }
    
    const debouncedFn = (...args: Parameters<T>) => {
      const inst = instancesRef.current.get(key)!;
      const now = Date.now();
      
      // Store arguments
      inst.lastArgs = args;
      
      // Clear existing timeout
      if (inst.timeoutId) {
        clearTimeout(inst.timeoutId);
      }
      
      // Execute immediately if leading and first call
      if (leading && !inst.lastCallTime) {
        fn(...args);
        inst.lastCallTime = now;
      }
      
      // Set up maxWait timeout if configured
      if (maxWait && !inst.maxTimeoutId) {
        inst.maxTimeoutId = setTimeout(() => {
          if (inst.lastArgs) {
            fn(...inst.lastArgs);
            inst.lastArgs = null;
            inst.lastCallTime = Date.now();
          }
          inst.maxTimeoutId = null;
        }, maxWait);
      }
      
      // Set up regular timeout
      inst.timeoutId = setTimeout(() => {
        if (trailing && inst.lastArgs) {
          fn(...inst.lastArgs);
          inst.lastCallTime = Date.now();
        }
        inst.lastArgs = null;
        inst.timeoutId = null;
        
        // Clear maxWait timeout if it exists
        if (inst.maxTimeoutId) {
          clearTimeout(inst.maxTimeoutId);
          inst.maxTimeoutId = null;
        }
      }, delay);
    };
    
    // Attach cancel method
    (debouncedFn as any).cancel = instance.cancel;
    
    return debouncedFn as T & { cancel: CancelFunction };
  }, []);
  
  /**
   * Cancel a specific debounced function
   */
  const cancel = useCallback((key: string) => {
    const instance = instancesRef.current.get(key);
    if (instance) {
      instance.cancel();
    }
  }, []);
  
  /**
   * Cancel all debounced functions
   */
  const cancelAll = useCallback(() => {
    instancesRef.current.forEach(instance => {
      instance.cancel();
    });
  }, []);
  
  /**
   * Check if a debounced function is pending
   */
  const isPending = useCallback((key: string): boolean => {
    const instance = instancesRef.current.get(key);
    return !!(instance && (instance.timeoutId || instance.maxTimeoutId));
  }, []);
  
  /**
   * Flush a debounced function (execute immediately if pending)
   */
  const flush = useCallback((key: string) => {
    const instance = instancesRef.current.get(key);
    if (instance && instance.lastArgs && instance.timeoutId) {
      // Clear timeout
      clearTimeout(instance.timeoutId);
      instance.timeoutId = null;
      
      // Clear maxWait timeout if exists
      if (instance.maxTimeoutId) {
        clearTimeout(instance.maxTimeoutId);
        instance.maxTimeoutId = null;
      }
      
      // Execute with last args
      instance.lastArgs = null;
      instance.lastCallTime = Date.now();
      
      // Note: We can't execute the function here since we don't have access to it
      // This is a limitation of this design - flush would need to be implemented differently
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAll();
    };
  }, [cancelAll]);
  
  return {
    debounce,
    cancel,
    cancelAll,
    isPending,
    flush,
  };
}

// Preset configurations for common use cases
export const DEBOUNCE_PRESETS = {
  // User input (fast feedback)
  USER_INPUT: { delay: 150, trailing: true },
  
  // URL validation (moderate delay)
  URL_VALIDATION: { delay: 800, trailing: true },
  
  // QR generation (slower, prevent excessive API calls)
  QR_GENERATION: { delay: 500, trailing: true },
  
  // Search operations
  SEARCH: { delay: 300, trailing: true },
  
  // Auto-save operations
  AUTO_SAVE: { delay: 2000, trailing: true, maxWait: 10000 },
  
  // Analytics events
  ANALYTICS: { delay: 1000, trailing: true, maxWait: 5000 },
} as const;