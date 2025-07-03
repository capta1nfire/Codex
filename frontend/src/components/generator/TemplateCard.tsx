/**
 * Template Card Component
 * 
 * Individual card for displaying style templates with preview
 * and selection functionality.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StyleTemplate } from '@/types/styleTemplates';

interface TemplateCardProps {
  template: StyleTemplate;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect: () => void;
  className?: string;
}

export function TemplateCard({
  template,
  isSelected = false,
  isLocked = false,
  onSelect,
  className
}: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-200 hover:shadow-lg',
        isSelected && 'ring-2 ring-blue-600 shadow-lg',
        isLocked && 'opacity-75',
        className
      )}
      onClick={() => !isLocked && onSelect()}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden">
          {/* Placeholder for actual QR preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-4xl">{template.category === 'tech' ? '💻' : 
                                           template.category === 'retail' ? '🛍️' :
                                           template.category === 'restaurant' ? '🍽️' :
                                           template.category === 'corporate' ? '🏢' :
                                           template.category === 'creative' ? '🎨' : '🎉'}</span>
            </div>
          </div>

          {/* Premium Badge */}
          {template.isPremium && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600">
              <Star className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}

          {/* Selected Indicator */}
          {isSelected && (
            <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">{template.name}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Usage indicator */}
          {template.usageCount && template.usageCount > 100 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <span>Popular</span>
              <span>•</span>
              <span>{template.usageCount > 1000 ? `${Math.floor(template.usageCount / 1000)}k` : template.usageCount} usos</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}