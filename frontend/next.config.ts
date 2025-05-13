import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsHmrCache: false,
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
export default withSentryConfig(withBundleAnalyzer(nextConfig), finalSentryOptions);
