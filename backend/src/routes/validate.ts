import express from 'express';
import { z } from 'zod';
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
 * Verifica si una URL existe via HEAD request con reintentos
 */
async function checkUrlWithRetry(url: string, retries = 2): Promise<{ exists: boolean; statusCode?: number }> {
  const normalizedUrl = normalizeUrl(url);
  const startTime = Date.now();
  
  console.log(`[URL Validation] Starting validation for: ${normalizedUrl}`);
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.head(normalizedUrl, {
        timeout: 3000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't retry on client errors
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CODEX-Validator/1.0)'
        }
      });
      
      const result = { 
        exists: response.status < 400,
        statusCode: response.status 
      };
      
      console.log(`[URL Validation] Success - URL: ${normalizedUrl}, Status: ${response.status}, Exists: ${result.exists}, Time: ${Date.now() - startTime}ms`);
      
      return result;
    } catch (error: any) {
      console.log(`[URL Validation] Attempt ${i + 1}/${retries + 1} failed - URL: ${normalizedUrl}, Error: ${error.code || error.message}`);
      
      // If it's the last retry, return false
      if (i === retries) {
        console.log(`[URL Validation] Final failure - URL: ${normalizedUrl}, Total time: ${Date.now() - startTime}ms`);
        return { exists: false };
      }
      
      // Wait before retry with exponential backoff
      const waitTime = 500 * (i + 1);
      console.log(`[URL Validation] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return { exists: false };
}

/**
 * Obtiene metadata de una URL
 */
async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache first
  const cacheKey = `url_metadata:${normalizedUrl}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // First check if URL is reachable with HEAD request
  const headCheck = await checkUrlWithRetry(url);
  
  if (!headCheck.exists) {
    const result = {
      exists: false,
      error: 'URL is not reachable',
      statusCode: headCheck.statusCode
    };
    // Cache negative results for shorter time (30 seconds)
    await redis.setEx(cacheKey, 30, JSON.stringify(result));
    return result;
  }

  try {
    // Try to fetch the page with timeout
    const response = await axios.get(normalizedUrl, {
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CODEX-Validator/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      // Don't throw on 4xx/5xx to get status codes
      validateStatus: () => true
    });

    const result: UrlMetadata = {
      exists: response.status < 400,
      statusCode: response.status
    };

    // Parse HTML for metadata if successful
    if (response.status < 400 && response.data) {
      const $ = cheerio.load(response.data);
      
      // Extract title
      result.title = $('title').text().trim() || 
                    $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="twitter:title"]').attr('content');
      
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
    }

    // Cache successful results for 24 hours
    await redis.setEx(cacheKey, 86400, JSON.stringify(result));
    return result;

  } catch (error: any) {
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