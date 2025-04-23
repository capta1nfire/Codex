'use client';

import { useEffect, useState } from 'react';

// Puedes configurar la URL base de tu backend en env
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';

export default function StatusPage() {
  const [dbUp, setDbUp] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${BASE_URL}/metrics`, { cache: 'no-store' });
        const text = await res.text();
        const match = text.match(/^codex_backend_db_up\s+(\d+)/m);
        setDbUp(match ? Number(match[1]) === 1 : false);
      } catch {
        setError('Error al obtener estado de la DB');
      }
    };
    fetchStatus();
    // Refrescar cada 10 segundos
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard de Estado</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Estado de la Base de Datos</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {dbUp === null ? (
          <p className="text-gray-600">Cargando estado...</p>
        ) : (
          <div className="flex items-center">
            <span
              className={`inline-block w-4 h-4 mr-2 rounded-full ${dbUp ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <p className={`text-lg font-medium ${dbUp ? 'text-green-700' : 'text-red-700'}`}>{dbUp ? 'Operativa' : 'Caída'}</p>
          </div>
        )}
      </div>
    </main>
  );
} 