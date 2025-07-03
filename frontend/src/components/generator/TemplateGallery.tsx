/**
 * Template Gallery Component
 * 
 * Main gallery component for browsing and selecting style templates.
 * Includes filtering by category and premium/free status.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  X, 
  Filter,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateCard } from './TemplateCard';
import { STYLE_TEMPLATES, getTemplatesByCategory } from '@/data/styleTemplates';
import { TEMPLATE_CATEGORIES } from '@/types/styleTemplates';
import { StyleTemplate } from '@/types/styleTemplates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: StyleTemplate) => void;
  onClose?: () => void;
  selectedTemplateId?: string;
  userTier?: 'free' | 'premium' | 'enterprise';
  className?: string;
}

export function TemplateGallery({
  onSelectTemplate,
  onClose,
  selectedTemplateId,
  userTier = 'free',
  className
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = getTemplatesByCategory(selectedCategory);

    // Sort templates
    switch (sortBy) {
      case 'popular':
        templates = [...templates].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'name':
        templates = [...templates].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        // In a real app, you'd sort by creation date
        templates = [...templates].reverse();
        break;
    }

    return templates;
  }, [selectedCategory, sortBy]);

  // Count templates by type
  const freeCount = filteredTemplates.filter(t => !t.isPremium).length;
  const premiumCount = filteredTemplates.filter(t => t.isPremium).length;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle>Plantillas de Estilo</CardTitle>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona una plantilla profesional pre-configurada para comenzar rápidamente
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-1">
            <TabsTrigger value="all" className="text-xs">
              Todas
            </TabsTrigger>
            {TEMPLATE_CATEGORIES.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                <span className="hidden md:inline">{cat.name}</span>
                <span className="md:hidden">{cat.icon}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">
              {freeCount} Gratis
            </Badge>
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              {premiumCount} Premium
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="popular">Más populares</option>
              <option value="recent">Más recientes</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              isLocked={template.isPremium && userTier === 'free'}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay plantillas disponibles en esta categoría
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {userTier === 'free' && premiumCount > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  Desbloquea Plantillas Premium
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Accede a {premiumCount} plantillas exclusivas y funciones avanzadas
                </p>
              </div>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Actualizar Plan
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}