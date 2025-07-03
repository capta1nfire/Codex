/**
 * Style Templates Types
 * 
 * Defines the structure for pre-configured QR code style templates
 * that help users create professional designs quickly.
 */

import { QRV3Customization } from '@/hooks/useQRGenerationV3';

export interface StyleTemplate {
  id: string;
  name: string;
  category: 'tech' | 'retail' | 'restaurant' | 'corporate' | 'creative' | 'event';
  description: string;
  thumbnail: string; // Pre-generated thumbnail URL
  isPremium: boolean;
  config: QRV3Customization & {
    // Additional template-specific options
    frame?: {
      frame_type: 'simple' | 'rounded' | 'decorated';
      text?: string;
      color: string;
      text_position: 'top' | 'bottom';
    };
  };
  industries: string[];
  tags: string[];
  // Analytics
  usageCount?: number;
  rating?: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'tech',
    name: 'Tecnología',
    description: 'Startups, SaaS, Apps',
    icon: '💻'
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Tiendas, E-commerce',
    icon: '🛍️'
  },
  {
    id: 'restaurant',
    name: 'Restaurantes',
    description: 'Menús, Delivery, Reservas',
    icon: '🍽️'
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Empresas, B2B, Profesional',
    icon: '🏢'
  },
  {
    id: 'creative',
    name: 'Creativo',
    description: 'Arte, Diseño, Eventos',
    icon: '🎨'
  },
  {
    id: 'event',
    name: 'Eventos',
    description: 'Bodas, Conferencias, Tickets',
    icon: '🎉'
  }
];