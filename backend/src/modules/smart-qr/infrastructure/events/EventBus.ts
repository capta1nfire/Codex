/**
 * Event Bus Implementation
 * Provides decoupled communication between components
 * Enables adding new features without modifying existing code
 */

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

// Define all possible events in the system
export interface SmartQREvents {
  'smartqr.requested': {
    url: string;
    userId?: string;
    templateFound: boolean;
    timestamp: Date;
  };
  'smartqr.generated': {
    templateId: string;
    userId?: string;
    url: string;
    processingTime: number;
    timestamp: Date;
  };
  'smartqr.failed': {
    error: Error;
    userId?: string;
    url: string;
    reason: string;
    timestamp: Date;
  };
  'smartqr.limit.reached': {
    userId: string;
    currentCount: number;
    limit: number;
    timestamp: Date;
  };
  'smartqr.template.notfound': {
    url: string;
    domain: string;
    userId?: string;
    timestamp: Date;
  };
  'smartqr.analytics.track': {
    event: string;
    properties: Record<string, any>;
    userId?: string;
    timestamp: Date;
  };
}

export class EventBus {
  private handlers: Map<keyof SmartQREvents, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];
  private maxHistorySize: number = 1000;

  /**
   * Subscribe to a specific event
   */
  on<K extends keyof SmartQREvents>(
    event: K,
    handler: EventHandler<SmartQREvents[K]>
  ): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    
    this.handlers.get(event)!.add(handler);

    return {
      unsubscribe: () => {
        this.handlers.get(event)?.delete(handler);
      }
    };
  }

  /**
   * Subscribe to a specific event (one time only)
   */
  once<K extends keyof SmartQREvents>(
    event: K,
    handler: EventHandler<SmartQREvents[K]>
  ): EventSubscription {
    const wrappedHandler: EventHandler = (data) => {
      handler(data);
      subscription.unsubscribe();
    };

    const subscription = this.on(event, wrappedHandler);
    return subscription;
  }

  /**
   * Subscribe to all events
   */
  onAll(handler: EventHandler<{ event: string; data: any }>): EventSubscription {
    this.globalHandlers.add(handler);

    return {
      unsubscribe: () => {
        this.globalHandlers.delete(handler);
      }
    };
  }

  /**
   * Emit an event asynchronously
   */
  emit<K extends keyof SmartQREvents>(event: K, data: SmartQREvents[K]): void {
    // Record in history
    this.recordEvent(event, data);

    // Emit asynchronously to avoid blocking
    setImmediate(() => {
      // Notify specific handlers
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          this.safeExecute(handler, data, event);
        });
      }

      // Notify global handlers
      this.globalHandlers.forEach(handler => {
        this.safeExecute(handler, { event, data }, 'global');
      });
    });
  }

  /**
   * Emit an event and wait for all handlers to complete
   */
  async emitAndWait<K extends keyof SmartQREvents>(
    event: K,
    data: SmartQREvents[K]
  ): Promise<void> {
    // Record in history
    this.recordEvent(event, data);

    const promises: Promise<void>[] = [];

    // Collect promises from specific handlers
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        promises.push(this.safeExecuteAsync(handler, data, event));
      });
    }

    // Collect promises from global handlers
    this.globalHandlers.forEach(handler => {
      promises.push(this.safeExecuteAsync(handler, { event, data }, 'global'));
    });

    await Promise.all(promises);
  }

  /**
   * Remove all handlers for a specific event
   */
  removeAllHandlers(event?: keyof SmartQREvents): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
      this.globalHandlers.clear();
    }
  }

  /**
   * Get event history
   */
  getHistory(event?: keyof SmartQREvents): Array<{ event: string; data: any; timestamp: Date }> {
    if (event) {
      return this.eventHistory.filter(h => h.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get handler count for debugging
   */
  getHandlerCount(event?: keyof SmartQREvents): number {
    if (event) {
      return this.handlers.get(event)?.size || 0;
    }
    
    let total = this.globalHandlers.size;
    this.handlers.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }

  private safeExecute(handler: EventHandler, data: any, context: string): void {
    try {
      const result = handler(data);
      // Handle async handlers
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`Async event handler error in ${context}:`, error);
        });
      }
    } catch (error) {
      console.error(`Event handler error in ${context}:`, error);
    }
  }

  private async safeExecuteAsync(
    handler: EventHandler,
    data: any,
    context: string
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      console.error(`Event handler error in ${context}:`, error);
    }
  }

  private recordEvent(event: string, data: any): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: new Date()
    });

    // Keep history size under control
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Helper function for typed event emission
export function emitSmartQREvent<K extends keyof SmartQREvents>(
  event: K,
  data: SmartQREvents[K]
): void {
  eventBus.emit(event, data);
}

// Decorators for automatic event emission (future use)
export function EmitEvent<K extends keyof SmartQREvents>(event: K) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Emit event with method result as data
      eventBus.emit(event, result);
      
      return result;
    };

    return descriptor;
  };
}