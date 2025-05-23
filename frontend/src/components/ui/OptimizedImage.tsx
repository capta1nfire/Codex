'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  aspectRatio?: 'square' | '16/9' | '4/3' | '3/2' | 'auto';
  containerClassName?: string;
}

/**
 * OptimizedImage - A wrapper around next/image with additional optimizations
 * 
 * Features:
 * - Automatic WebP/AVIF format selection
 * - Built-in loading states
 * - Error handling with fallback
 * - Responsive sizing
 * - Accessibility improvements
 * - Performance optimizations
 */
export default function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showPlaceholder = true,
  aspectRatio = 'auto',
  containerClassName,
  className,
  priority = false,
  quality = 85,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
    }
  };

  // Generate container classes based on aspect ratio
  const getContainerClasses = () => {
    const baseClasses = 'relative overflow-hidden';
    
    switch (aspectRatio) {
      case 'square':
        return `${baseClasses} aspect-square`;
      case '16/9':
        return `${baseClasses} aspect-video`;
      case '4/3':
        return `${baseClasses} aspect-[4/3]`;
      case '3/2':
        return `${baseClasses} aspect-[3/2]`;
      default:
        return baseClasses;
    }
  };

  // Loading placeholder
  const LoadingPlaceholder = () => (
    <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  // Error placeholder
  const ErrorPlaceholder = () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs">Error al cargar imagen</p>
      </div>
    </div>
  );

  return (
    <div className={cn(getContainerClasses(), containerClassName)}>
      {/* Loading state */}
      {isLoading && showPlaceholder && <LoadingPlaceholder />}
      
      {/* Error state */}
      {hasError && !fallbackSrc && <ErrorPlaceholder />}
      
      {/* Main image */}
      {!hasError && (
        <Image
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          quality={quality}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          // Performance optimizations
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyOiiuZdqo/Hb9YOGr0v2E5oqR3Ci3vz+mGq9EWTJ9EQVQJjswO7c/pj6vRB4wUwFzHl3V1KMFbT9XfPP8AbJ9E55Hw="
          {...props}
        />
      )}
    </div>
  );
} 