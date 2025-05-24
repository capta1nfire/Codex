const { withSentryConfig } = require('@sentry/nextjs');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Enable modern optimizations
  reactStrictMode: true,
  swcMinify: true,
  
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
  // Opciones de Sentry configuradas por el asistente y otras configuraciones deseadas:
  // Para todas las opciones disponibles, consulta:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'capta1nfire',
  project: 'javascript-nextjs',

  // Solo mostrar logs de subida de source maps en CI
  silent: !process.env.CI,

  // Subir un conjunto más amplio de source maps para mejores stack traces (aumenta el tiempo de build)
  widenClientFileUpload: true,

  // Enrutar las solicitudes del navegador a Sentry a través de una reescritura de Next.js para eludir ad-blockers.
  // Esto puede aumentar la carga de tu servidor y tu factura de hosting.
  // Nota: Verifica que la ruta configurada no coincida con tu middleware de Next.js.
  tunnelRoute: '/monitoring',

  // Eliminar automáticamente las declaraciones del logger de Sentry para reducir el tamaño del bundle
  disableLogger: true,

  // Habilita la instrumentación automática de Vercel Cron Monitors.
  automaticVercelMonitors: true,
};

// Envolver la configuración de Next.js (que ya incluye withBundleAnalyzer)
// con withSentryConfig y las opciones de Sentry consolidadas.
module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), finalSentryOptions);
