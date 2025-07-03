/**
 * GeneratorWorkspace - Main workspace area with cards and preview
 * 
 * Modern UI/UX principles:
 * - Responsive grid layout
 * - Card-based design for visual hierarchy
 * - Sticky preview for constant visibility
 * - Smooth transitions between states
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GeneratorWorkspaceProps {
  children: React.ReactNode;
  className?: string;
}

export function GeneratorWorkspace({ children, className }: GeneratorWorkspaceProps) {
  return (
    <main className={cn(
      "w-full max-w-7xl mx-auto",
      "px-4 sm:px-6 lg:px-8",
      "py-6 sm:py-8 lg:py-10",
      className
    )}>
      {/* Responsive grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {children}
      </div>
    </main>
  );
}