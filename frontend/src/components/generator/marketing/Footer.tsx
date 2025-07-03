/**
 * Footer - Simple footer with links
 * 
 * Design principles:
 * - Minimalist approach
 * - Accessible links
 * - Smooth hover effects
 */

import React from 'react';
import { cn } from '@/lib/utils';

const footerLinks = [
  { label: 'Términos', href: '#' },
  { label: 'Privacidad', href: '#' },
  { label: 'Contacto', href: '#' },
  { label: 'API', href: '#' }
];

export default function Footer() {
  return (
    <footer className="relative py-16 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm border-t border-slate-200/30 dark:border-slate-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <p className="mb-4 animate-fade-in">
            © 2025 CODEX - Generador Profesional de Códigos
          </p>
          
          <div className="flex justify-center gap-6 text-sm">
            {footerLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "hover:text-blue-600 dark:hover:text-blue-400",
                  "transition-all duration-200",
                  "hover:scale-105",
                  "animate-fade-in"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </footer>
  );
}