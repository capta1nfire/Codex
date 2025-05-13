'use client'; // Error components must be Client Components

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* 
          Este es un componente de error global muy básico.
          Puedes personalizarlo para que coincida con el estilo de tu aplicación.
          Considera mostrar un mensaje más amigable al usuario.
        */}
        <h2>¡Algo salió mal!</h2>
        <p>
          Se ha registrado un error. Por favor, intenta recargar la página o contacta a soporte si
          el problema persiste.
        </p>
        <button
          onClick={
            // Intentar recuperarse intentando re-renderizar el segmento
            () => reset()
          }
        >
          Intentar de nuevo
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '20px' }}>
            <summary>Detalles del Error (Solo Desarrollo)</summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f0f0f0',
                padding: '10px',
                borderRadius: '5px',
              }}
            >
              {error?.message}
              {error?.stack && `\n\nStack Trace:\n${error.stack}`}
              {error?.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </body>
    </html>
  );
}
