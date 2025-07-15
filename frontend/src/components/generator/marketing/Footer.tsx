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
          <p className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            © 2025 QReable - Make it QReable
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
                  "animate-in fade-in slide-in-from-bottom-2 duration-300",
                  index === 0 && "delay-0",
                  index === 1 && "delay-75",
                  index === 2 && "delay-150",
                  index === 3 && "delay-200"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}