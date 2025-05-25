'use client';

import React from 'react';

interface GridArea {
  component: React.ComponentType<any>;
  gridArea: string;
  className?: string;
  props?: any;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
    ultrawide?: number;
  };
}

interface DashboardLayoutProps {
  areas: GridArea[];
  className?: string;
}

export default function DashboardLayout({ areas, className = '' }: DashboardLayoutProps) {
  return (
    <div className={`
      w-full p-4 sm:p-6 lg:p-8
      grid gap-4 sm:gap-6 lg:gap-6
      
      /* Responsive grid system */
      grid-cols-1
      md:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      2xl:grid-cols-5
      
      /* Auto-sized rows */
      auto-rows-max
      
      /* Align items to start */
      items-start
      
      ${className}
    `}>
      {areas.map((area, index) => {
        const Component = area.component;
        return (
          <div
            key={`dashboard-area-${index}`}
            className={`
              ${area.className || ''}
              
              /* Default: span 1 column */
              col-span-1
              
              /* Responsive spanning with specific classes */
              ${area.span?.mobile === 1 ? 'col-span-1' : ''}
              ${area.span?.mobile === 2 ? 'col-span-2' : ''}
              ${area.span?.mobile === 3 ? 'col-span-3' : ''}
              
              ${area.span?.tablet === 1 ? 'md:col-span-1' : ''}
              ${area.span?.tablet === 2 ? 'md:col-span-2' : ''}
              ${area.span?.tablet === 3 ? 'md:col-span-3' : ''}
              
              ${area.span?.desktop === 1 ? 'lg:col-span-1' : ''}
              ${area.span?.desktop === 2 ? 'lg:col-span-2' : ''}
              ${area.span?.desktop === 3 ? 'lg:col-span-3' : ''}
              
              ${area.span?.wide === 1 ? 'xl:col-span-1' : ''}
              ${area.span?.wide === 2 ? 'xl:col-span-2' : ''}
              ${area.span?.wide === 3 ? 'xl:col-span-3' : ''}
              ${area.span?.wide === 4 ? 'xl:col-span-4' : ''}
              
              ${area.span?.ultrawide === 1 ? '2xl:col-span-1' : ''}
              ${area.span?.ultrawide === 2 ? '2xl:col-span-2' : ''}
              ${area.span?.ultrawide === 3 ? '2xl:col-span-3' : ''}
              ${area.span?.ultrawide === 4 ? '2xl:col-span-4' : ''}
              ${area.span?.ultrawide === 5 ? '2xl:col-span-5' : ''}
              
              /* Smooth transitions */
              transition-all duration-300 ease-in-out
            `}
            
            >
              <Component {...(area.props || {})} />
            </div>
        );
      })}
    </div>
  );
}

/* Utility hook for responsive layout management */
export function useDashboardLayout() {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide'>('desktop');
  
  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else if (width < 1280) setScreenSize('desktop');
      else if (width < 1920) setScreenSize('wide');
      else setScreenSize('ultrawide');
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return { screenSize };
}

/* Layout presets for different screen sizes */
export const layoutPresets = {
  ultrawide: {
    columns: 5,
    areas: [
      'readiness readiness status quick notifications',
      'analytics analytics cache alerts performance',
      'logs errors custom1 custom2 custom3'
    ]
  },
  wide: {
    columns: 4,
    areas: [
      'readiness readiness status quick',
      'analytics analytics cache alerts'
    ]
  },
  desktop: {
    columns: 3,
    areas: [
      'readiness status quick',
      'analytics cache alerts'
    ]
  },
  tablet: {
    columns: 2,
    areas: [
      'readiness status',
      'analytics cache'
    ]
  },
  mobile: {
    columns: 1,
    areas: [
      'readiness',
      'status',
      'analytics'
    ]
  }
}; 