import { useState, useCallback, useRef, useEffect } from 'react';

interface TypingTrackerOptions {
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  typingDebounceMs?: number;
}

interface TypingTrackerResult {
  isTyping: boolean;
  trackInput: (value: string) => void;
  resetTyping: () => void;
}

/**
 * Sophisticated typing tracker hook that monitors user input
 * and provides real-time typing state for UI optimizations
 */
export function useTypingTracker(options: TypingTrackerOptions = {}): TypingTrackerResult {
  const {
    onStartTyping,
    onStopTyping,
    typingDebounceMs = 150 // Faster than generation debounce for responsive UI
  } = options;

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<string>('');
  const hasStartedTypingRef = useRef(false);

  /**
   * Clean up any pending timeout
   */
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, []);

  /**
   * Handle the end of typing
   */
  const handleStopTyping = useCallback(() => {
    setIsTyping(false);
    hasStartedTypingRef.current = false;
    onStopTyping?.();
  }, [onStopTyping]);

  /**
   * Track input changes and manage typing state
   */
  const trackInput = useCallback((value: string) => {
    // Ignore if value hasn't changed
    if (value === lastValueRef.current) {
      return;
    }

    lastValueRef.current = value;

    // Clear any existing timeout
    clearTypingTimeout();

    // If not already typing, start typing
    if (!hasStartedTypingRef.current) {
      hasStartedTypingRef.current = true;
      setIsTyping(true);
      onStartTyping?.();
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, typingDebounceMs);
  }, [clearTypingTimeout, handleStopTyping, onStartTyping, typingDebounceMs]);

  /**
   * Manually reset typing state
   */
  const resetTyping = useCallback(() => {
    clearTypingTimeout();
    handleStopTyping();
    lastValueRef.current = '';
  }, [clearTypingTimeout, handleStopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTypingTimeout();
    };
  }, [clearTypingTimeout]);

  return {
    isTyping,
    trackInput,
    resetTyping
  };
}