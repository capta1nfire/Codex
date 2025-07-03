/**
 * FeaturesGrid - Three main features showcase
 * 
 * Modern design patterns:
 * - Glass morphism cards
 * - Icon animations
 * - Hover effects
 */

import React from 'react';
import { Zap, Database, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Zap,
    title: 'Generación Rápida',
    description: 'Motor optimizado para crear códigos al instante',
    color: 'blue'
  },
  {
    icon: Database,
    title: 'Múltiples Formatos',
    description: 'Soporte para QR, Code128, EAN13 y más',
    color: 'purple'
  },
  {
    icon: Sparkles,
    title: 'Personalización Total',
    description: 'Colores, tamaños y estilos personalizables',
    color: 'pink'
  }
];

export default function FeaturesGrid() {
  return (
    <section className="relative bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-950/30 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group relative",
                "bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm",
                "p-8 rounded-xl",
                "border border-blue-100/40 dark:border-blue-900/40",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-2xl",
                "hover:border-blue-300/60 dark:hover:border-blue-700/60",
                "animate-fade-in-up"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 transition-all duration-300 pointer-events-none" />
              
              {/* Icon container */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                "transition-all duration-300",
                "group-hover:scale-110 group-hover:rotate-3",
                feature.color === 'blue' && "bg-blue-100 dark:bg-blue-900",
                feature.color === 'purple' && "bg-purple-100 dark:bg-purple-900",
                feature.color === 'pink' && "bg-pink-100 dark:bg-pink-900"
              )}>
                <feature.icon className={cn(
                  "w-6 h-6",
                  feature.color === 'blue' && "text-blue-600 dark:text-blue-400",
                  feature.color === 'purple' && "text-purple-600 dark:text-purple-400",
                  feature.color === 'pink' && "text-pink-600 dark:text-pink-400"
                )} />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.description}
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
            transform: translateY(30px);
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