import express from 'express';
import { z } from 'zod';
import dns from 'dns/promises';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = express.Router();

// Schema de validación
const validateUrlSchema = z.object({
  url: z.string().min(1)
});

interface UrlMetadata {
  exists: boolean;
  title?: string;
  statusCode?: number;
  error?: string;
}

/**
 * Normaliza una URL agregando protocolo si no existe
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extrae el dominio de una URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(normalizeUrl(url));
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Verifica si un dominio existe via DNS con múltiples estrategias
 */
async function checkDomainExists(domain: string): Promise<boolean> {
  // Lista de tipos de registros DNS a verificar
  const dnsChecks = [
    () => dns.resolve4(domain),
    () => dns.resolve6(domain),
    () => dns.resolveCname(domain),
    () => dns.resolveMx(domain),
    () => dns.resolveTxt(domain),
    () => dns.resolveNs(domain),
    () => dns.resolveSoa(domain),
  ];

  // Si CUALQUIER tipo de registro DNS existe, el dominio existe
  for (const check of dnsChecks) {
    try {
      await check();
      return true;
    } catch {
      // Continuar con el siguiente tipo
    }
  }

  return false;
}

/**
 * Verifica si una URL responde con estrategias inteligentes
 */
async function checkUrlResponds(url: string): Promise<UrlMetadata> {
  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(url);
  
  // Estrategia 1: Verificación DNS completa
  const domainExists = await checkDomainExists(domain);
  
  // Estrategia 2: Verificación HTTP incluso si DNS falla
  // Algunos dominios (como x.com) pueden tener DNS especiales
  return new Promise((resolve) => {
    const urlObj = new URL(normalizedUrl);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: 3000, // Reducir timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close' // Cerrar conexión inmediatamente
      }
    };

    const req = protocol.request(urlObj, options, (res) => {
      // Considerar CUALQUIER respuesta HTTP como "sitio existe"
      // Incluso 403, 401, 503, etc. significan que hay un servidor
      const exists = res.statusCode !== undefined;
      
      const result: UrlMetadata = {
        exists: exists,
        statusCode: res.statusCode
      };
      
      // Si obtenemos respuesta HTTP, el sitio existe
      // independientemente del código de estado
      if (exists && !domainExists) {
        result.title = domain; // DNS falló pero HTTP respondió
      }
      
      // Cerrar conexión inmediatamente para evitar hanging
      res.destroy();
      req.destroy();
      
      resolve(result);
    });

    req.on('error', (error: any) => {
      // Si el error es de conexión pero DNS existe, 
      // podría ser un firewall o restricción
      if (domainExists && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT')) {
        resolve({
          exists: true, // DNS existe, asumimos que el sitio existe
          error: 'Connection blocked or timed out',
          title: domain
        });
      } else {
        resolve({
          exists: false,
          error: error.code || error.message
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      // Si hay DNS pero timeout, el sitio probablemente existe
      // pero está lento o bloqueado
      if (domainExists) {
        resolve({
          exists: true,
          error: 'Timeout but domain exists',
          title: domain
        });
      } else {
        resolve({
          exists: false,
          error: 'Timeout'
        });
      }
    });

    // Timeout manual más agresivo para casos como x.com
    req.setTimeout(3000, () => {
      req.abort();
    });

    req.end();
  });
}

/**
 * Endpoint para validar URLs (versión simplificada)
 */
router.post('/check-url', async (req, res) => {
  try {
    const { url } = validateUrlSchema.parse(req.body);
    
    // Quick response for local/test domains only
    const testDomains = ['localhost', '127.0.0.1', '0.0.0.0', 'example.com'];
    const domain = extractDomain(url);
    
    if (testDomains.includes(domain)) {
      return res.json({
        exists: true,
        title: domain,
        description: 'Local or test domain'
      });
    }

    const metadata = await checkUrlResponds(url);
    return res.json(metadata);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    console.error('URL validation error:', error);
    return res.status(500).json({ error: 'Failed to validate URL' });
  }
});

export default router;