/**
 * Initial Templates Configuration
 * Default templates for Phase 1 - Instagram and YouTube
 * Easy to add more templates by adding to this array
 */

export interface TemplateDefinition {
  id: string;
  name: string;
  domains: string[];
  priority: number;
  tags: string[];
  config: {
    gradient?: {
      type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
      colors: string[];
      angle?: number;
    };
    eyeShape?: string;
    dataPattern?: string;
    logo?: {
      url: string;
      size: number;
      padding?: number;
      shape?: 'square' | 'circle' | 'rounded_square';
    };
    effects?: string[];
    frame?: {
      type: string;
      text?: string;
    };
  };
}

export const INITIAL_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'instagram-v1',
    name: 'Instagram Style',
    domains: ['instagram.com', 'www.instagram.com'],
    priority: 100,
    tags: ['social', 'photo', 'popular'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D'],
        angle: 45,
      },
      eyeShape: 'leaf',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-fixed.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'youtube-v1',
    name: 'YouTube Style',
    domains: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
    priority: 95,
    tags: ['social', 'video', 'popular'],
    config: {
      gradient: {
        type: 'linear',
        colors: ['#FF0000', '#CC0000'],
        angle: 90,
      },
      eyeShape: 'square',
      dataPattern: 'square',
      logo: {
        url: '/logos/youtube.svg',
        size: 0.25,
        padding: 8,
        shape: 'square',
      },
      frame: {
        type: 'simple',
        text: 'Watch on YouTube',
      },
    },
  },
];

// Future templates (for easy addition)
export const FUTURE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'linkedin-v1',
    name: 'LinkedIn Professional',
    domains: ['linkedin.com', 'www.linkedin.com'],
    priority: 90,
    tags: ['professional', 'business', 'social'],
    config: {
      gradient: {
        type: 'linear',
        colors: ['#0077B5', '#004471'],
        angle: 135,
      },
      eyeShape: 'square',
      dataPattern: 'square',
      logo: {
        url: '/logos/linkedin.svg',
        size: 0.28,
        padding: 12,
        shape: 'rounded_square',
      },
      effects: ['professional-border'],
    },
  },
  {
    id: 'tiktok-v1',
    name: 'TikTok Vibrant',
    domains: ['tiktok.com', 'www.tiktok.com'],
    priority: 85,
    tags: ['social', 'video', 'trending'],
    config: {
      gradient: {
        type: 'linear',
        colors: ['#FF0050', '#00F2EA', '#000000'],
        angle: 45,
      },
      eyeShape: 'rounded_square',
      dataPattern: 'circular',
      logo: {
        url: '/logos/tiktok.svg',
        size: 0.3,
        padding: 10,
        shape: 'circle',
      },
      effects: ['glow', 'vibrant'],
    },
  },
  {
    id: 'twitter-v1',
    name: 'Twitter/X Minimal',
    domains: ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'],
    priority: 88,
    tags: ['social', 'news', 'minimal'],
    config: {
      gradient: {
        type: 'linear',
        colors: ['#1DA1F2', '#14171A'],
        angle: 180,
      },
      eyeShape: 'circle',
      dataPattern: 'dots',
      logo: {
        url: '/logos/twitter.svg',
        size: 0.25,
        padding: 8,
        shape: 'circle',
      },
    },
  },
  {
    id: 'facebook-v1',
    name: 'Facebook Classic',
    domains: ['facebook.com', 'www.facebook.com', 'fb.com', 'm.facebook.com'],
    priority: 92,
    tags: ['social', 'classic'],
    config: {
      gradient: {
        type: 'linear',
        colors: ['#1877F2', '#0C63D4'],
        angle: 90,
      },
      eyeShape: 'rounded_square',
      dataPattern: 'square',
      logo: {
        url: '/logos/facebook.svg',
        size: 0.3,
        padding: 10,
        shape: 'rounded_square',
      },
    },
  },
  {
    id: 'whatsapp-v1',
    name: 'WhatsApp Green',
    domains: ['whatsapp.com', 'wa.me', 'web.whatsapp.com'],
    priority: 87,
    tags: ['messaging', 'communication'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#25D366', '#128C7E'],
        angle: 0,
      },
      eyeShape: 'rounded_square',
      dataPattern: 'dots',
      logo: {
        url: '/logos/whatsapp.svg',
        size: 0.3,
        padding: 10,
        shape: 'circle',
      },
      frame: {
        type: 'bubble',
        text: 'Chat on WhatsApp',
      },
    },
  },
  {
    id: 'spotify-v1',
    name: 'Spotify Vibes',
    domains: ['spotify.com', 'open.spotify.com'],
    priority: 82,
    tags: ['music', 'entertainment'],
    config: {
      gradient: {
        type: 'conic',
        colors: ['#1DB954', '#191414', '#1DB954'],
        angle: 0,
      },
      eyeShape: 'circle',
      dataPattern: 'wave',
      logo: {
        url: '/logos/spotify.svg',
        size: 0.28,
        padding: 10,
        shape: 'circle',
      },
      effects: ['music-wave'],
    },
  },
];

// Template categories for future dashboard
export const TEMPLATE_CATEGORIES = {
  social: {
    name: 'Social Media',
    icon: 'users',
    templates: [
      'instagram-v1',
      'youtube-v1',
      'linkedin-v1',
      'tiktok-v1',
      'twitter-v1',
      'facebook-v1',
    ],
  },
  professional: {
    name: 'Professional',
    icon: 'briefcase',
    templates: ['linkedin-v1'],
  },
  communication: {
    name: 'Communication',
    icon: 'message-circle',
    templates: ['whatsapp-v1'],
  },
  entertainment: {
    name: 'Entertainment',
    icon: 'music',
    templates: ['spotify-v1', 'youtube-v1', 'tiktok-v1'],
  },
};

// Helper function to validate logo paths exist
export function getLogoPath(logoUrl: string): string {
  // In production, these should be served from CDN or public folder
  const baseUrl = process.env.LOGO_BASE_URL || '/public';
  return `${baseUrl}${logoUrl}`;
}
