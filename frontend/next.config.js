const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Sentry deshabilitado temporalmente - proyecto no configurado en sentry.io
// Para reactivar:
// 1. Crear proyecto en sentry.io
// 2. Configurar SENTRY_ORG y SENTRY_PROJECT en .env
// 3. Cambiar ENABLE_SENTRY a 'true'
const ENABLE_SENTRY = process.env.ENABLE_SENTRY === 'true';

let withSentryConfig;
if (ENABLE_SENTRY) {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig;
} else {
  // Bypass Sentry completamente
  withSentryConfig = (config) => config;
}

const nextConfig = {
  // Enable modern optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable experimental features for stability
  experimental: {
    instrumentationHook: false
  },

  // Allow access from local network IPs
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  
  // Image optimization configuration
  images: {
    // Allow images from these domains
    domains: [
      'localhost',
      '127.0.0.1',
      'api.dicebear.com', // For default avatars if used
    ],
    // Additional remote patterns for more flexibility
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3004',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.dicebear.com',
        pathname: '/**',
      },
    ],
    // Enable modern image formats
    formats: ['image/webp', 'image/avif'],
    // Optimize images with these sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Security: limit image sizes
    minimumCacheTTL: 60,
    // Enable image optimization
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Aquí puedes añadir otras configuraciones de Next.js que necesites
  // Ejemplo:
  // reactStrictMode: true,
  // typescript: {
  //   ignoreBuildErrors: true, // Solo si es estrictamente necesario
  // },
  // eslint: {
  //   ignoreDuringBuilds: true, // Solo si es estrictamente necesario
  // }
};

const finalSentryOptions = {
  // Sentry desactivado temporalmente hasta configurar proyecto correctamente
  // Para reactivar: configurar org/project válidos en sentry.io

  org: process.env.SENTRY_ORG || 'capta1nfire',
  project: process.env.SENTRY_PROJECT || 'javascript-nextjs',

  // Desactivar upload de sourcemaps hasta tener proyecto válido
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN || process.env.DISABLE_SENTRY === 'true',
  },

  // Silenciar errores de Sentry en build
  silent: true,

  // Desactivar telemetría
  telemetry: false,

  // No fallar el build si Sentry falla
  hideSourceMaps: true,

  // Deshabilitar en desarrollo
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
};

// Envolver la configuración de Next.js (que ya incluye withBundleAnalyzer)
// con withSentryConfig y las opciones de Sentry consolidadas.
module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), finalSentryOptions);
