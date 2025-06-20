import express from 'express';
import { z } from 'zod';
import dns from 'dns/promises';
import https from 'https';
import http from 'http';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { redis } from '../lib/redis.js';

const router = express.Router();

// Schema de validación
const validateUrlSchema = z.object({
  url: z.string().min(1)
});

interface UrlMetadata {
  exists: boolean;
  title?: string;
  description?: string;
  favicon?: string;
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
  const startTime = Date.now();
  
  console.log(`[URL Validation] Starting validation for: ${normalizedUrl}`);
  
  // Estrategia 1: Verificación DNS completa
  const domainExists = await checkDomainExists(domain);
  console.log(`[URL Validation] DNS check for ${domain}: ${domainExists ? 'EXISTS' : 'NOT FOUND'}`);
  
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
      
      console.log(`[URL Validation] HTTP response - Status: ${res.statusCode}, Exists: ${exists}, Time: ${Date.now() - startTime}ms`);
      
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
      console.log(`[URL Validation] HTTP error - ${error.code || error.message}, DNS exists: ${domainExists}`);
      
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
        console.log(`[URL Validation] Timeout but DNS exists, assuming site exists`);
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
 * Obtiene metadata de una URL
 */
async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const normalizedUrl = normalizeUrl(url);
  
  console.log(`[fetchUrlMetadata] Starting for URL: ${url}`);
  
  // Check cache first
  const cacheKey = `url_metadata:${normalizedUrl}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    const cachedData = JSON.parse(cached);
    // If cached result says URL doesn't exist and it's a known problematic domain,
    // skip cache and re-validate
    const problematicDomains = ['facebook.com', 'www.facebook.com', 'meta.com'];
    const domain = extractDomain(url);
    if (!cachedData.exists && problematicDomains.includes(domain)) {
      console.log(`[fetchUrlMetadata] Skipping cache for problematic domain: ${domain}`);
    } else {
      console.log(`[fetchUrlMetadata] Found in cache: ${cacheKey}`);
      return cachedData;
    }
  }

  console.log(`[fetchUrlMetadata] Not in cache, checking URL...`);
  // First check if URL is reachable with our smart strategy
  const urlCheck = await checkUrlResponds(url);
  
  if (!urlCheck.exists) {
    // Cache negative results for shorter time (30 seconds)
    await redis.setEx(cacheKey, 30, JSON.stringify(urlCheck));
    return urlCheck;
  }

  // If URL exists, try to enrich with metadata
  try {
    // Try to fetch the page with timeout
    const response = await axios.get(normalizedUrl, {
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      // Don't throw on 4xx/5xx to get status codes
      validateStatus: () => true
    });

    const result: UrlMetadata = {
      exists: urlCheck.exists, // Use the smart check result
      statusCode: response.status || urlCheck.statusCode
    };

    // Parse HTML for metadata if successful
    if (response.status < 400 && response.data) {
      const $ = cheerio.load(response.data);
      
      // Extract title
      result.title = $('title').text().trim() || 
                    $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content') ||
                    urlCheck.title; // Fallback to domain name
      
      // Extract description
      result.description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content');
      
      // Extract favicon
      let favicon = $('link[rel="icon"]').attr('href') ||
                   $('link[rel="shortcut icon"]').attr('href') ||
                   $('link[rel="apple-touch-icon"]').attr('href');
      
      if (favicon) {
        // Make favicon URL absolute
        if (favicon.startsWith('//')) {
          favicon = `https:${favicon}`;
        } else if (favicon.startsWith('/')) {
          const urlObj = new URL(normalizedUrl);
          favicon = `${urlObj.origin}${favicon}`;
        } else if (!favicon.startsWith('http')) {
          const urlObj = new URL(normalizedUrl);
          favicon = `${urlObj.origin}/${favicon}`;
        }
        result.favicon = favicon;
      } else {
        // Fallback to Google's favicon service if no favicon found
        const urlObj = new URL(normalizedUrl);
        result.favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      }
    } else {
      // Use basic data from smart check if we can't fetch full page
      result.title = urlCheck.title || extractDomain(url);
      // Still try to get favicon via Google
      const urlObj = new URL(normalizedUrl);
      result.favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    }

    // Cache successful results for 24 hours
    await redis.setEx(cacheKey, 86400, JSON.stringify(result));
    return result;

  } catch (error: any) {
    // If we can't get metadata but URL exists (according to DNS), return basic info
    if (urlCheck.exists) {
      const result: UrlMetadata = {
        exists: true,
        title: urlCheck.title || extractDomain(url),
        error: `Metadata fetch failed: ${error.code || error.message}`,
        // Still try to get favicon via Google
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(url)}&sz=64`
      };
      // Cache with shorter TTL since we couldn't get full metadata
      await redis.setEx(cacheKey, 300, JSON.stringify(result));
      return result;
    }
    
    // URL doesn't exist
    const result: UrlMetadata = {
      exists: false,
      error: error.code || error.message
    };
    
    // Cache network errors for 30 seconds
    await redis.setEx(cacheKey, 30, JSON.stringify(result));
    return result;
  }
}

/**
 * Endpoint para validar URLs
 */
router.post('/check-url', async (req, res) => {
  try {
    const { url } = validateUrlSchema.parse(req.body);
    
    console.log(`[/check-url] Validating URL: ${url}`);
    
    // Quick response for common test domains
    const testDomains = ['localhost', '127.0.0.1', '0.0.0.0', 'example.com'];
    const domain = extractDomain(url);
    if (testDomains.includes(domain)) {
      return res.json({
        exists: true,
        title: domain,
        description: 'Local or test domain'
      });
    }

    const metadata = await fetchUrlMetadata(url);
    console.log(`[/check-url] Result for ${url}:`, JSON.stringify(metadata, null, 2));
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