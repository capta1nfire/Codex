/**
 * UseCasesGrid - Popular use cases showcase
 * 
 * Design elements:
 * - Emoji-based visual hierarchy
 * - Hover animations
 * - Responsive grid
 */

import React from 'react';
import { cn } from '@/lib/utils';

const useCases = [
  { title: "Menús de Restaurante", icon: "🍽️", desc: "QR para menús digitales" },
  { title: "Tarjetas de Visita", icon: "💼", desc: "Información de contacto" },
  { title: "Inventario", icon: "📦", desc: "Control de productos" },
  { title: "Eventos", icon: "🎫", desc: "Tickets y entradas" },
  { title: "Marketing", icon: "📱", desc: "Campañas y promociones" },
  { title: "WiFi", icon: "📶", desc: "Acceso rápido a redes" },
  { title: "Pagos", icon: "💳", desc: "Transacciones seguras" },
  { title: "Educación", icon: "📚", desc: "Material educativo" }
];

export default function UseCasesGrid() {
  return (
    <section className="relative py-24 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">
          Casos de Uso Populares
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "group relative overflow-hidden",
                "bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/30",
                "p-6 rounded-lg",
                "border border-blue-100/30 dark:border-blue-900/30",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-lg",
                "hover:border-blue-300/50 dark:hover:border-blue-700/50",
                "animate-fade-in-scale"
              )}
              style={{
                animationDelay: `${idx * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Background animation on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-500" />
              
              {/* Content */}
              <div className="relative">
                <div className="text-3xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-scale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-scale {
          animation: fade-in-scale 0.4s ease-out;
        }
      `}</style>
    </section>
  );
}