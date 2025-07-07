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
    eyeBorderStyle?: string;
    eyeCenterStyle?: string;
    eyeColor?: string;
    dataPattern?: string;
    dataColor?: string;
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
    name: 'Instagram Premium',
    domains: ['instagram.com', 'www.instagram.com'],
    priority: 100,
    tags: ['social', 'photo', 'popular', 'premium'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#833AB4', '#FD1D1D', '#2563EB', '#FCAF45'],
        angle: 45,
        applyToEyes: false, // NO aplicar gradiente a los ojos
      },
      // Usar estilos separados como los valores por defecto
      eyeBorderStyle: 'circle',
      eyeCenterStyle: 'circle',
      eyeColor: '#833AB4', // Color sólido púrpura para los ojos
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  // Instagram variations with different eye shapes for testing
  {
    id: 'instagram-square',
    name: 'Instagram Square Eyes',
    domains: ['test.instagram.square'],
    priority: 99,
    tags: ['social', 'photo', 'test', 'square'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'square',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-rounded-square',
    name: 'Instagram Rounded Square Eyes',
    domains: ['test.instagram.rounded'],
    priority: 98,
    tags: ['social', 'photo', 'test', 'rounded-square'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'rounded-square',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-circle',
    name: 'Instagram Circle Eyes',
    domains: ['test.instagram.circle'],
    priority: 97,
    tags: ['social', 'photo', 'test', 'circle'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'circle',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-dot',
    name: 'Instagram Dot Eyes',
    domains: ['test.instagram.dot'],
    priority: 96,
    tags: ['social', 'photo', 'test', 'dot'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'dot',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-star',
    name: 'Instagram Star Eyes',
    domains: ['test.instagram.star'],
    priority: 95,
    tags: ['social', 'photo', 'test', 'star'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'star',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-diamond',
    name: 'Instagram Diamond Eyes',
    domains: ['test.instagram.diamond'],
    priority: 94,
    tags: ['social', 'photo', 'test', 'diamond'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'diamond',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-heart',
    name: 'Instagram Heart Eyes',
    domains: ['test.instagram.heart'],
    priority: 93,
    tags: ['social', 'photo', 'test', 'heart'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'heart',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
        size: 0.2,
        padding: 8,
        shape: 'rounded_square',
      },
      effects: [],
    },
  },
  {
    id: 'instagram-hexagon',
    name: 'Instagram Hexagon Eyes',
    domains: ['test.instagram.hexagon'],
    priority: 92,
    tags: ['social', 'photo', 'test', 'hexagon'],
    config: {
      gradient: {
        type: 'radial',
        colors: ['#833AB4', '#FD1D1D', '#FCAF45', '#F77737', '#FF5E3A'],
        angle: 45,
      },
      eyeShape: 'hexagon',
      dataPattern: 'dots',
      logo: {
        url: '/logos/instagram-official.svg',
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
        url: '/logos/youtube-official.svg',
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
        url: '/logos/linkedin-official.svg',
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
        url: '/logos/tiktok-official.svg',
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
        url: '/logos/twitter-official.svg',
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
        url: '/logos/facebook-official.svg',
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
