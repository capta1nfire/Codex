'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  RefreshCw, 
  ExternalLink,
  FileText,
  Shield,
  Sparkles
} from 'lucide-react';

export default function QuickActionsPanel() {
  const actions = [
    {
      title: 'Generar Código',
      description: 'QR o Barcode rápido',
      icon: Zap,
      href: '/',
      variant: 'default' as const,
      isPrimary: true
    },
    {
      title: 'API Docs',
      description: 'Documentación API',
      icon: FileText,
      href: 'http://localhost:3004/api-docs/',
      external: true,
      variant: 'outline' as const
    },
    {
      title: 'Limpiar Cache',
      description: 'Reset métricas Rust',
      icon: RefreshCw,
      action: 'clearCache',
      variant: 'outline' as const
    },
    {
      title: 'Health Check',
      description: 'Verificar servicios',
      icon: Shield,
      action: 'healthCheck',
      variant: 'outline' as const
    }
  ];

  const handleAction = async (actionType: string) => {
    switch (actionType) {
      case 'clearCache':
        try {
          const rustUrl = process.env.NEXT_PUBLIC_RUST_SERVICE_URL || 'http://localhost:3002';
          await fetch(`${rustUrl}/cache/clear`, { method: 'POST' });
          // Show success notification with enhanced feedback
          alert('✅ Cache limpiado exitosamente');
        } catch (error) {
          alert('❌ Error al limpiar cache');
        }
        break;
      case 'healthCheck':
        // Trigger health check across all services
        window.location.reload();
        break;
    }
  };

  return (
    <Card className="h-fit group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border hover:-translate-y-0.5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
          <Sparkles className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          Acciones Rápidas
        </CardTitle>
        <CardDescription className="transition-colors duration-200 group-hover:text-foreground/70">
          Herramientas y controles del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            
            // Enhanced styling for primary actions - "Hero Moments"
            const cardClasses = action.isPrimary 
              ? "p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 dark:from-blue-400/10 dark:to-blue-500/20 border-2 border-blue-200/50 hover:border-blue-300/70 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 group/action"
              : "p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/60 dark:from-muted/20 dark:to-muted/40 border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-sm group/action";

            if (action.href) {
              return (
                <a
                  key={action.title}
                  href={action.href}
                  target={action.external ? '_blank' : '_self'}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  className="block"
                >
                  <div className={cardClasses}>
                    <div className="flex items-center gap-3 w-full">
                      <div className={`${action.isPrimary ? 'p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20' : ''}`}>
                        <IconComponent className={`transition-all duration-200 group-hover/action:scale-110 ${
                          action.isPrimary 
                            ? 'h-5 w-5 text-blue-600 dark:text-blue-400' 
                            : 'h-4 w-4 shrink-0'
                        }`} />
                      </div>
                      <div className="text-left flex-1">
                        <div className={`font-medium transition-colors duration-200 ${
                          action.isPrimary 
                            ? 'text-blue-700 dark:text-blue-300 group-hover/action:text-blue-800 dark:group-hover/action:text-blue-200' 
                            : 'text-sm'
                        }`}>
                          {action.title}
                        </div>
                        <div className={`text-muted-foreground ${action.isPrimary ? 'text-sm' : 'text-xs'}`}>
                          {action.description}
                        </div>
                      </div>
                      {action.external && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground/60 group-hover/action:text-muted-foreground transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </a>
              );
            }

            return (
              <button
                key={action.title}
                onClick={() => action.action && handleAction(action.action)}
                className="w-full text-left"
              >
                <div className={cardClasses}>
                  <div className="flex items-center gap-3 w-full">
                    <div className={`${action.isPrimary ? 'p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20' : ''}`}>
                      <IconComponent className={`transition-all duration-200 group-hover/action:scale-110 ${
                        action.isPrimary 
                          ? 'h-5 w-5 text-blue-600 dark:text-blue-400' 
                          : 'h-4 w-4 shrink-0'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-medium transition-colors duration-200 ${
                        action.isPrimary 
                          ? 'text-blue-700 dark:text-blue-300 group-hover/action:text-blue-800 dark:group-hover/action:text-blue-200' 
                          : 'text-sm'
                      }`}>
                        {action.title}
                      </div>
                      <div className={`text-muted-foreground ${action.isPrimary ? 'text-sm' : 'text-xs'}`}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 