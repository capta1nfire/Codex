/**
 * Pre-configured Style Templates
 * 
 * Curated templates for different industries and use cases.
 * These templates provide optimized configurations for scannability
 * while maintaining visual appeal.
 */

import { StyleTemplate } from '@/types/styleTemplates';

export const STYLE_TEMPLATES: StyleTemplate[] = [
  // ===== FREE TEMPLATES =====
  {
    id: 'tech-minimal',
    name: 'Tech Startup',
    category: 'tech',
    description: 'Minimalista y moderno para empresas tecnológicas',
    thumbnail: '/templates/tech-minimal.png',
    isPremium: false,
    config: {
      data_pattern: 'dots',
      eye_border_style: 'rounded_square',
      eye_center_style: 'dot',
      gradient: {
        enabled: true,
        gradient_type: 'conic',
        colors: ['#0066FF', '#9933FF'],
        apply_to_eyes: true,
        apply_to_data: true
      },
      colors: {
        foreground: '#000000',
        background: '#FFFFFF'
      }
    },
    industries: ['Software', 'SaaS', 'Apps', 'Startups'],
    tags: ['moderno', 'minimalista', 'tech', 'gradiente']
  },
  {
    id: 'restaurant-menu',
    name: 'Menú Digital',
    category: 'restaurant',
    description: 'Alto contraste para fácil escaneo en restaurantes',
    thumbnail: '/templates/restaurant-menu.png',
    isPremium: false,
    config: {
      data_pattern: 'rounded',
      eye_border_style: 'quarter_round',
      eye_center_style: 'circle',
      colors: {
        foreground: '#1A1A1A',
        background: '#FFFFFF'
      },
      frame: {
        frame_type: 'simple',
        text: 'Escanea para ver el menú',
        color: '#1A1A1A',
        text_position: 'bottom'
      }
    },
    industries: ['Restaurantes', 'Cafeterías', 'Bares', 'Food Trucks'],
    tags: ['menú', 'comida', 'delivery', 'alto contraste']
  },
  {
    id: 'retail-sale',
    name: 'Oferta Especial',
    category: 'retail',
    description: 'Llamativo para promociones y descuentos',
    thumbnail: '/templates/retail-sale.png',
    isPremium: false,
    config: {
      data_pattern: 'star',
      eye_border_style: 'thick_border',
      eye_center_style: 'square',
      gradient: {
        enabled: true,
        gradient_type: 'radial',
        colors: ['#FF1744', '#FF6B00'],
        apply_to_eyes: true,
        apply_to_data: false
      },
      colors: {
        foreground: '#FF1744',
        background: '#FFFFFF'
      },
      frame: {
        frame_type: 'rounded',
        text: '¡20% de descuento!',
        color: '#FF1744',
        text_position: 'top'
      }
    },
    industries: ['E-commerce', 'Tiendas', 'Retail', 'Moda'],
    tags: ['promoción', 'descuento', 'venta', 'llamativo']
  },
  {
    id: 'corporate-card',
    name: 'Tarjeta Digital',
    category: 'corporate',
    description: 'Profesional para tarjetas de presentación',
    thumbnail: '/templates/corporate-card.png',
    isPremium: false,
    config: {
      data_pattern: 'square',
      eye_border_style: 'square',
      eye_center_style: 'square',
      colors: {
        foreground: '#212121',
        background: '#FFFFFF'
      },
      effects: [{
        effect_type: 'shadow',
        config: { intensity: 20 }
      }]
    },
    industries: ['Consultoría', 'Finanzas', 'Legal', 'B2B'],
    tags: ['profesional', 'tarjeta', 'contacto', 'formal']
  },
  {
    id: 'event-ticket',
    name: 'Entrada Evento',
    category: 'event',
    description: 'Vibrante para tickets y pases de eventos',
    thumbnail: '/templates/event-ticket.png',
    isPremium: false,
    config: {
      data_pattern: 'dots',
      eye_border_style: 'circle',
      eye_center_style: 'dot',
      gradient: {
        enabled: true,
        gradient_type: 'linear',
        angle: 45,
        colors: ['#6A1B9A', '#E91E63', '#FFC107'],
        apply_to_eyes: true,
        apply_to_data: true
      },
      colors: {
        foreground: '#000000',
        background: '#FFFFFF'
      }
    },
    industries: ['Conciertos', 'Conferencias', 'Festivales', 'Teatro'],
    tags: ['ticket', 'entrada', 'evento', 'colorido']
  },

  // ===== PREMIUM TEMPLATES =====
  {
    id: 'luxury-premium',
    name: 'Marca de Lujo',
    category: 'corporate',
    description: 'Elegancia atemporal para marcas premium',
    thumbnail: '/templates/luxury-premium.png',
    isPremium: true,
    config: {
      data_pattern: 'diamond',
      eye_border_style: 'double_border',
      eye_center_style: 'square',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF'
      },
      effects: [
        {
          effect_type: 'shadow',
          config: { intensity: 30, color: '#000000' }
        },
        {
          effect_type: 'blur',
          config: { radius: 0.5, exclude_eyes: true }
        }
      ]
    },
    industries: ['Lujo', 'Joyería', 'Alta Costura', 'Premium'],
    tags: ['lujo', 'premium', 'elegante', 'sofisticado']
  },
  {
    id: 'creative-artist',
    name: 'Portfolio Artista',
    category: 'creative',
    description: 'Expresivo para artistas y creativos',
    thumbnail: '/templates/creative-artist.png',
    isPremium: true,
    config: {
      data_pattern: 'wave',
      eye_border_style: 'leaf',
      eye_center_style: 'star',
      gradient: {
        enabled: true,
        gradient_type: 'spiral',
        colors: ['#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50'],
        apply_to_eyes: true,
        apply_to_data: true
      },
      colors: {
        foreground: '#000000',
        background: '#FFFFFF'
      },
      effects: [{
        effect_type: 'glow',
        config: { color: '#9C27B0', intensity: 40 }
      }]
    },
    industries: ['Arte', 'Diseño', 'Fotografía', 'Música'],
    tags: ['artístico', 'creativo', 'portfolio', 'expresivo']
  },
  {
    id: 'restaurant-premium',
    name: 'Fine Dining',
    category: 'restaurant',
    description: 'Sofisticado para restaurantes de alta cocina',
    thumbnail: '/templates/restaurant-premium.png',
    isPremium: true,
    config: {
      data_pattern: 'circular',
      eye_border_style: 'cut_corner',
      eye_center_style: 'circle',
      gradient: {
        enabled: true,
        gradient_type: 'diamond',
        colors: ['#37474F', '#263238'],
        apply_to_eyes: true,
        apply_to_data: false
      },
      colors: {
        foreground: '#263238',
        background: '#FAFAFA'
      },
      frame: {
        frame_type: 'decorated',
        text: 'Reserva tu mesa',
        color: '#263238',
        text_position: 'bottom'
      }
    },
    industries: ['Fine Dining', 'Restaurantes Premium', 'Gastronomía'],
    tags: ['elegante', 'premium', 'restaurante', 'sofisticado']
  },
  {
    id: 'tech-ai',
    name: 'AI & Machine Learning',
    category: 'tech',
    description: 'Futurista para empresas de IA y ML',
    thumbnail: '/templates/tech-ai.png',
    isPremium: true,
    config: {
      data_pattern: 'mosaic',
      eye_border_style: 'hexagon',
      eye_center_style: 'dot',
      gradient: {
        enabled: true,
        gradient_type: 'conic',
        colors: ['#00E5FF', '#1DE9B6', '#76FF03'],
        apply_to_eyes: true,
        apply_to_data: true
      },
      colors: {
        foreground: '#000000',
        background: '#0A0A0A'
      },
      effects: [
        {
          effect_type: 'glow',
          config: { color: '#00E5FF', intensity: 60 }
        }
      ]
    },
    industries: ['AI', 'Machine Learning', 'Data Science', 'Tech'],
    tags: ['futurista', 'tecnología', 'ai', 'innovador']
  },
  {
    id: 'wedding-elegant',
    name: 'Boda Elegante',
    category: 'event',
    description: 'Romántico y elegante para bodas',
    thumbnail: '/templates/wedding-elegant.png',
    isPremium: true,
    config: {
      data_pattern: 'rounded',
      eye_border_style: 'heart',
      eye_center_style: 'heart',
      gradient: {
        enabled: true,
        gradient_type: 'radial',
        colors: ['#F8BBD0', '#E91E63', '#C2185B'],
        apply_to_eyes: true,
        apply_to_data: false
      },
      colors: {
        foreground: '#C2185B',
        background: '#FFF5F7'
      },
      frame: {
        frame_type: 'decorated',
        text: 'Save the Date',
        color: '#C2185B',
        text_position: 'top'
      }
    },
    industries: ['Bodas', 'Eventos Sociales', 'Celebraciones'],
    tags: ['boda', 'romántico', 'elegante', 'amor']
  }
];

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): StyleTemplate[] {
  if (category === 'all') return STYLE_TEMPLATES;
  return STYLE_TEMPLATES.filter(t => t.category === category);
}

// Helper function to get free templates
export function getFreeTemplates(): StyleTemplate[] {
  return STYLE_TEMPLATES.filter(t => !t.isPremium);
}

// Helper function to get premium templates
export function getPremiumTemplates(): StyleTemplate[] {
  return STYLE_TEMPLATES.filter(t => t.isPremium);
}