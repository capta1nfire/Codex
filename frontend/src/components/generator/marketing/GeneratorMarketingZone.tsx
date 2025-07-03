/**
 * GeneratorMarketingZone - Lazy-loaded marketing sections
 * 
 * Performance optimizations:
 * - Intersection Observer for viewport detection
 * - Lazy component loading
 * - Staggered animations
 */

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy load marketing components
const HeroSection = dynamic(() => import('./HeroSection'), {
  loading: () => <div className="h-96 animate-pulse bg-slate-100 dark:bg-slate-800" />
});

const FeaturesGrid = dynamic(() => import('./FeaturesGrid'), {
  loading: () => <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800" />
});

const UseCasesGrid = dynamic(() => import('./UseCasesGrid'), {
  loading: () => <div className="h-96 animate-pulse bg-slate-100 dark:bg-slate-800" />
});

const StatsSection = dynamic(() => import('./StatsSection'), {
  loading: () => <div className="h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
});

const Footer = dynamic(() => import('./Footer'), {
  loading: () => <div className="h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
});

interface MarketingSectionProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

// Intersection Observer wrapper for progressive loading
function MarketingSection({ 
  children, 
  threshold = 0.1, 
  rootMargin = '50px',
  className 
}: MarketingSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <div className="h-96" />}
    </div>
  );
}

export default function GeneratorMarketingZone() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <MarketingSection className="animate-fade-in">
        <HeroSection />
      </MarketingSection>

      {/* Features Grid */}
      <MarketingSection className="animate-fade-in">
        <FeaturesGrid />
      </MarketingSection>

      {/* Use Cases Grid */}
      <MarketingSection className="animate-fade-in">
        <UseCasesGrid />
      </MarketingSection>

      {/* Stats Section */}
      <MarketingSection className="animate-fade-in">
        <StatsSection />
      </MarketingSection>

      {/* Footer */}
      <MarketingSection className="animate-fade-in" threshold={0.5}>
        <Footer />
      </MarketingSection>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}