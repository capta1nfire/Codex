import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Ajusta tracesSampleRate según sea necesario para el monitoreo del rendimiento en producción
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // Ajusta profilesSampleRate para el perfilado en producción
  profilesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // La depuración puede ser útil en desarrollo pero ruidosa en producción
  debug: process.env.NODE_ENV === 'development',

  // Habilitar Replay para la grabación de sesiones (opcional)
  // replaysOnErrorSampleRate: 1.0,
  // replaysSessionSampleRate: 0.1,
  // redactAllText: true, // Considerar para privacidad
  // redactAllInputs: true, // Considerar para privacidad

  // Descomentar lo siguiente para habilitar la carga de todos los chunks de JS necesarios para Replay
  //   replayFeatures: ['replay', 'error-monitoring', 'performance-monitoring'],

  // Subir source maps solo en builds de producción para evitar sobrecargar Sentry
  // La configuración de `withSentryConfig` en `next.config.ts` (corregido) se encarga de esto.

  // Ignorar ciertos errores si es necesario
  // ignoreErrors: ["TypeError: Failed to fetch"],

  // Definir una función `beforeSend` para modificar o descartar eventos
  // beforeSend(event, hint) {
  //   // Ejemplo: no enviar errores de un tipo específico
  //   if (event.exception && event.exception.values && event.exception.values[0].type === 'ChunkLoadError') {
  //     return null;
  //   }
  //   return event;
  // },
});

// Router transition tracking is handled automatically by Sentry Next.js integration
// export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
