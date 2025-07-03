/**
 * StatsSection - Statistics showcase
 * 
 * Modern features:
 * - Animated counters
 * - Gradient numbers
 * - Responsive grid
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const stats = [
  { value: '1M+', label: 'Códigos Generados', duration: 2000 },
  { value: '15', label: 'Tipos de Código', duration: 1500 },
  { value: '99.9%', label: 'Disponibilidad', duration: 2500 },
  { value: '24/7', label: 'Soporte', duration: 1000 }
];

interface CounterProps {
  end: string;
  duration: number;
}

function AnimatedCounter({ end, duration }: CounterProps) {
  const [count, setCount] = useState('0');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Extract numeric part
    const numericEnd = parseFloat(end.replace(/[^0-9.]/g, ''));
    const suffix = end.replace(/[0-9.]/g, '');
    
    if (isNaN(numericEnd)) {
      setCount(end);
      return;
    }

    const increment = numericEnd / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericEnd) {
        setCount(`${numericEnd}${suffix}`);
        clearInterval(timer);
      } else {
        setCount(`${Math.floor(current)}${suffix}`);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, isVisible]);

  return <div ref={ref}>{count}</div>;
}

export default function StatsSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "group",
                "animate-fade-in-up"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className={cn(
                "text-4xl font-bold mb-2",
                "bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400",
                "bg-clip-text text-transparent",
                "transition-all duration-300",
                "group-hover:scale-110"
              )}>
                <AnimatedCounter end={stat.value} duration={stat.duration} />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}