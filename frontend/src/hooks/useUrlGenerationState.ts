/**
 * URL Generation State Machine Hook
 * 
 * Manages the complex state transitions for URL validation and QR generation
 * to prevent race conditions and ensure consistent behavior.
 * 
 * State Flow:
 * IDLE -> TYPING -> VALIDATING -> READY_TO_GENERATE -> GENERATING -> COMPLETE
 *                      |-> VALIDATION_ERROR
 * 
 * @module useUrlGenerationState
 * @since 2025-06-17
 */

import { useState, useCallback, useRef } from 'react';

export type GenerationState = 
  | 'IDLE'                // No input or default value
  | 'TYPING'              // User is actively typing
  | 'VALIDATING'          // URL validation in progress
  | 'VALIDATION_ERROR'    // URL validation failed
  | 'READY_TO_GENERATE'   // Validation complete, ready to generate
  | 'GENERATING'          // QR code generation in progress
  | 'COMPLETE';           // Generation complete

interface StateTransition {
  from: GenerationState[];
  to: GenerationState;
  condition?: () => boolean;
}

const validTransitions: StateTransition[] = [
  // From IDLE
  { from: ['IDLE'], to: 'TYPING' },
  
  // From TYPING
  { from: ['TYPING'], to: 'VALIDATING' },
  { from: ['TYPING'], to: 'IDLE' },
  
  // From VALIDATING
  { from: ['VALIDATING'], to: 'READY_TO_GENERATE' },
  { from: ['VALIDATING'], to: 'VALIDATION_ERROR' },
  { from: ['VALIDATING'], to: 'TYPING' }, // User continues typing
  
  // From VALIDATION_ERROR
  { from: ['VALIDATION_ERROR'], to: 'TYPING' },
  { from: ['VALIDATION_ERROR'], to: 'IDLE' },
  
  // From READY_TO_GENERATE
  { from: ['READY_TO_GENERATE'], to: 'GENERATING' },
  { from: ['READY_TO_GENERATE'], to: 'TYPING' }, // User modifies input
  { from: ['READY_TO_GENERATE'], to: 'IDLE' },
  
  // From GENERATING
  { from: ['GENERATING'], to: 'COMPLETE' },
  { from: ['GENERATING'], to: 'TYPING' }, // User interrupts
  
  // From COMPLETE
  { from: ['COMPLETE'], to: 'TYPING' },
  { from: ['COMPLETE'], to: 'IDLE' },
];

interface UseUrlGenerationStateOptions {
  onStateChange?: (newState: GenerationState, oldState: GenerationState) => void;
}

export function useUrlGenerationState(options: UseUrlGenerationStateOptions = {}) {
  const [state, setState] = useState<GenerationState>('IDLE');
  const stateRef = useRef<GenerationState>('IDLE');
  
  const transitionTo = useCallback((newState: GenerationState) => {
    const currentState = stateRef.current;
    
    // Check if transition is valid
    const isValidTransition = validTransitions.some(
      transition => 
        transition.from.includes(currentState) && 
        transition.to === newState &&
        (!transition.condition || transition.condition())
    );
    
    if (!isValidTransition) {
      console.warn(
        `Invalid state transition attempted: ${currentState} -> ${newState}`
      );
      return false;
    }
    
    // Update state
    stateRef.current = newState;
    setState(newState);
    
    // Notify listener
    options.onStateChange?.(newState, currentState);
    
    return true;
  }, [options]);
  
  // Convenience methods for common transitions
  const startTyping = useCallback(() => {
    return transitionTo('TYPING');
  }, [transitionTo]);
  
  const startValidating = useCallback(() => {
    return transitionTo('VALIDATING');
  }, [transitionTo]);
  
  const validationComplete = useCallback((success: boolean) => {
    if (success) {
      return transitionTo('READY_TO_GENERATE');
    } else {
      return transitionTo('VALIDATION_ERROR');
    }
  }, [transitionTo]);
  
  const startGenerating = useCallback(() => {
    return transitionTo('GENERATING');
  }, [transitionTo]);
  
  const generationComplete = useCallback(() => {
    return transitionTo('COMPLETE');
  }, [transitionTo]);
  
  const reset = useCallback(() => {
    return transitionTo('IDLE');
  }, [transitionTo]);
  
  // State queries
  const canGenerate = state === 'READY_TO_GENERATE';
  const isProcessing = state === 'VALIDATING' || state === 'GENERATING';
  const hasError = state === 'VALIDATION_ERROR';
  const isTyping = state === 'TYPING';
  const isComplete = state === 'COMPLETE';
  
  return {
    // Current state
    state,
    
    // State transitions
    startTyping,
    startValidating,
    validationComplete,
    startGenerating,
    generationComplete,
    reset,
    transitionTo,
    
    // State queries
    canGenerate,
    isProcessing,
    hasError,
    isTyping,
    isComplete,
  };
}