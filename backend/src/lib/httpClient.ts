import { Agent, fetch as undiciFetch } from 'undici';

// Configurar agente HTTP con connection pooling
export const httpAgent = new Agent({
  connections: 100, // Máximo de conexiones por origen
  pipelining: 10, // Requests en pipeline por conexión
  keepAliveTimeout: 60000, // 60 segundos de keep-alive
  keepAliveMaxTimeout: 600000, // 10 minutos máximo
  connect: {
    timeout: 10000, // 10 segundos para conectar
  },
  bodyTimeout: 30000, // 30 segundos para el body
  headersTimeout: 10000, // 10 segundos para headers
});

// Función wrapper para fetch con connection pooling
export async function fetchWithPool(url: string, options: any = {}) {
  return undiciFetch(url, {
    ...options,
    dispatcher: httpAgent,
  });
}

// Función para cerrar el pool al terminar
export async function closeHttpPool() {
  await httpAgent.close();
}
