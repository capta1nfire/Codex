/**
 * Hook for detecting user editing intent
 * 
 * This hook monitors user interactions to intelligently determine
 * when to pause automatic regeneration, allowing smooth editing
 * without visual interruptions.
 */

import { useRef, useCallback, useEffect } from 'react';

interface EditingState {
  isSelecting: boolean;
  consecutiveDeletes: number;
  lastKeyTime: number;
  lastValueLength: number;
  selectionStart: number | null;
  selectionEnd: number | null;
}

interface UseEditingIntentOptions {
  onIntentChange?: (isEditing: boolean) => void;
}

export function useEditingIntent(options: UseEditingIntentOptions = {}) {
  const stateRef = useRef<EditingState>({
    isSelecting: false,
    consecutiveDeletes: 0,
    lastKeyTime: 0,
    lastValueLength: 0,
    selectionStart: null,
    selectionEnd: null,
  });

  const editingTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect if user is in "editing mode" based on behavior patterns
  const isInEditingMode = useCallback(() => {
    const state = stateRef.current;
    const now = Date.now();
    
    // User is selecting text
    if (state.isSelecting) return true;
    
    // User deleted multiple characters quickly (bulk editing)
    if (state.consecutiveDeletes >= 2) return true; // Reduced from 3 to 2
    
    // User has active text selection
    if (state.selectionStart !== null && 
        state.selectionEnd !== null && 
        state.selectionStart !== state.selectionEnd) {
      return true;
    }
    
    // User is typing quickly (less than 300ms between keystrokes)
    if (now - state.lastKeyTime < 300 && state.lastKeyTime > 0) {
      return true;
    }
    
    return false;
  }, []);

  // Handle keyboard events to track deletion patterns
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeSinceLastKey = now - stateRef.current.lastKeyTime;
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // If deleting quickly (within 500ms), increment counter
      if (timeSinceLastKey < 500) {
        stateRef.current.consecutiveDeletes++;
      } else {
        stateRef.current.consecutiveDeletes = 1;
      }
      
      // Notify editing intent for bulk deletes (reduced threshold)
      if (stateRef.current.consecutiveDeletes >= 2) {
        options.onIntentChange?.(true);
      }
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/Cmd+A detected - user wants to select all
      stateRef.current.isSelecting = true;
      options.onIntentChange?.(true);
    } else {
      // Check if user is typing quickly
      if (timeSinceLastKey < 300 && stateRef.current.lastKeyTime > 0) {
        // User is typing quickly, notify editing intent
        options.onIntentChange?.(true);
      }
      // Any non-delete key resets delete counter
      stateRef.current.consecutiveDeletes = 0;
    }
    
    stateRef.current.lastKeyTime = now;
  }, [options]);

  // Track selection changes
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    stateRef.current.selectionStart = input.selectionStart;
    stateRef.current.selectionEnd = input.selectionEnd;
    
    // If user has selected text, mark as selecting
    if (input.selectionStart !== input.selectionEnd) {
      stateRef.current.isSelecting = true;
      options.onIntentChange?.(true);
    }
  }, [options]);

  // Handle mouse events for selection detection
  const handleMouseDown = useCallback(() => {
    // User might be starting a selection
    stateRef.current.isSelecting = true;
    
    // Clear after a delay if no selection happened
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }
    
    editingTimeoutRef.current = setTimeout(() => {
      const state = stateRef.current;
      // If no actual selection was made, clear selecting flag
      if (state.selectionStart === state.selectionEnd) {
        state.isSelecting = false;
      }
    }, 500);
  }, []);

  // Handle value changes to detect bulk operations
  const handleChange = useCallback((newValue: string, oldValue: string) => {
    const lengthDiff = Math.abs(newValue.length - oldValue.length);
    const now = Date.now();
    
    // Large difference indicates paste or bulk delete
    if (lengthDiff > 5) {
      stateRef.current.consecutiveDeletes = 0; // Reset counter
      stateRef.current.isSelecting = false; // Selection completed
      // Notify editing for bulk operations
      options.onIntentChange?.(true);
    } else {
      // For normal typing, check if it's rapid
      const timeSinceLastChange = now - stateRef.current.lastKeyTime;
      if (timeSinceLastChange < 400) {
        // Rapid typing detected - activate editing mode temporarily
        options.onIntentChange?.(true);
      }
    }
    
    // Update stored length
    stateRef.current.lastValueLength = newValue.length;
    
    // Always check current editing state after change
    const currentlyEditing = isInEditingMode();
    console.log('[useEditingIntent] handleChange:', {
      newValue,
      oldValue,
      lengthDiff,
      timeSinceLastChange: now - stateRef.current.lastKeyTime,
      currentlyEditing,
      willNotifyEditing: lengthDiff > 5 || (now - stateRef.current.lastKeyTime < 400)
    });
  }, [isInEditingMode, options]);

  // Calculate smart debounce time based on user behavior
  const getSmartDebounceTime = useCallback(() => {
    const state = stateRef.current;
    
    // User is selecting or bulk editing
    if (isInEditingMode()) {
      return 1200; // Reduced from 2000ms to 1200ms for editing
    }
    
    // User just deleted something
    if (state.consecutiveDeletes > 0) {
      return 1000; // Reduced from 1500ms to 1000ms after deletions
    }
    
    // Normal typing
    return 600; // Reduced from 800ms to 600ms for standard debounce
  }, [isInEditingMode]);

  // Reset editing state after a period of inactivity
  const resetEditingState = useCallback(() => {
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }
    
    editingTimeoutRef.current = setTimeout(() => {
      stateRef.current.isSelecting = false;
      stateRef.current.consecutiveDeletes = 0;
      options.onIntentChange?.(false);
    }, 800); // Reduced from 2000ms to 800ms
  }, [options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Event handlers to attach to input
    handlers: {
      onKeyDown: handleKeyDown,
      onSelect: handleSelect,
      onMouseDown: handleMouseDown,
    },
    
    // Methods
    handleChange,
    getSmartDebounceTime,
    isInEditingMode,
    resetEditingState,
    
    // State
    isEditing: isInEditingMode(),
  };
}