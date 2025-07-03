/**
 * URL Validation API
 *
 * This module provides reliable URL validation to enhance user experience
 * by verifying links before QR code generation.
 *
 * Features:
 * - Fast validation with smart fallbacks
 * - Realistic browser headers
 * - Redis caching for performance
 * - Metadata extraction (title, description, favicon)
 * - Distinction between "not exists" vs "not accessible"
 *
 * Updated: June 30, 2025 - Simplified for performance and maintainability
 */

import express from 'express';
import { z } from 'zod';

import { validateUrlEnterprise, ValidationResult } from '../lib/enterpriseValidator.js';
import { redis } from '../lib/redis.js';

const router = express.Router();

// Request validation schema
const validateRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  forceRefresh: z.boolean().optional().default(false),
  timeout: z.number().min(1000).max(30000).optional().default(10000),
  allowInsecure: z.boolean().optional().default(false),
});

interface UrlMetadata {
  exists: boolean;
  accessible: boolean;
  title?: string;
  description?: string;
  favicon?: string;
  statusCode?: number;
  responseTime?: number;
  redirectUrl?: string;
  lastModified?: string;
  server?: string;
  cached: boolean;
  validationMethod: 'quick' | 'enhanced' | 'dns';
  attempts: number;
  debugInfo?: any;
}

/**
 * Normalize URL for consistent caching and processing
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'fbclid',
      'gclid',
      'ref',
      'source',
    ];
    trackingParams.forEach((param) => urlObj.searchParams.delete(param));

    // Normalize protocol to https if no specific protocol given
    if (urlObj.protocol === 'http:' && !url.toLowerCase().startsWith('http://')) {
      urlObj.protocol = 'https:';
    }

    // Remove trailing slash for consistency
    if (urlObj.pathname === '/') {
      urlObj.pathname = '';
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Generate cache key for URL validation results
 */
function getCacheKey(url: string): string {
  const normalizedUrl = normalizeUrl(url);
  return `url_validation:v3:${Buffer.from(normalizedUrl).toString('base64')}`;
}

/**
 * Convert enterprise validation result to API response format
 */
function formatValidationResult(result: ValidationResult, cached: boolean = false): UrlMetadata {
  return {
    exists: result.exists,
    accessible: result.accessible,
    title: result.metadata?.title,
    description: result.metadata?.description,
    favicon: result.metadata?.favicon,
    statusCode: result.metadata?.statusCode,
    responseTime: result.metadata?.responseTime,
    redirectUrl: result.metadata?.redirectUrl,
    lastModified: result.metadata?.lastModified,
    server: result.metadata?.server,
    cached,
    validationMethod: result.method,
    attempts: result.attempts,
    debugInfo: result.debugInfo,
  };
}

/**
 * POST /validate
 * Enterprise-grade URL validation endpoint
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request
    const validation = validateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const { url, forceRefresh, timeout } = validation.data;
    const normalizedUrl = normalizeUrl(url);
    const cacheKey = getCacheKey(normalizedUrl);

    console.log(`\n[URLValidation] 🚀 Enterprise validation request for: ${normalizedUrl}`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      try {
        const cachedResult = await redis.get(cacheKey);
        if (cachedResult) {
          const parsedResult = JSON.parse(cachedResult);
          console.log(`[URLValidation] ⚡ Cache hit for: ${normalizedUrl}`);

          return res.json({
            success: true,
            data: {
              ...parsedResult,
              cached: true,
              responseTime: Date.now() - startTime,
            },
          });
        }
      } catch (cacheError) {
        console.warn('[URLValidation] Cache read error:', cacheError);
      }
    }

    // Perform enterprise validation
    console.log(`[URLValidation] 🔍 Starting enterprise validation...`);
    const validationResult = await validateUrlEnterprise(normalizedUrl);

    // Format result
    const formattedResult = formatValidationResult(validationResult, false);
    formattedResult.responseTime = Date.now() - startTime;

    // Cache the result
    try {
      const cacheTime = formattedResult.exists ? 300 : 60; // 5min for existing, 1min for non-existing
      await redis.setEx(cacheKey, cacheTime, JSON.stringify(formattedResult));
      console.log(`[URLValidation] 💾 Cached result for ${cacheTime}s`);
    } catch (cacheError) {
      console.warn('[URLValidation] Cache write error:', cacheError);
    }

    // Log result summary
    console.log(`[URLValidation] ✅ Validation complete:`, {
      url: normalizedUrl,
      exists: formattedResult.exists,
      accessible: formattedResult.accessible,
      method: formattedResult.validationMethod,
      attempts: formattedResult.attempts,
      responseTime: formattedResult.responseTime + 'ms',
      statusCode: formattedResult.statusCode,
      favicon: formattedResult.favicon,
      title: formattedResult.title,
    });

    return res.json({
      success: true,
      data: formattedResult,
    });
  } catch (error: any) {
    console.error('[URLValidation] ❌ Validation error:', error);

    return res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: error.message,
      responseTime: Date.now() - startTime,
    });
  }
});

/**
 * GET /health
 * Health check endpoint for validation service
 */
router.get('/health', async (req, res) => {
  try {
    // Test with a known good URL
    const testResult = await validateUrlEnterprise('https://google.com');

    return res.json({
      success: true,
      status: 'healthy',
      capabilities: {
        headValidation: true,
        getValidation: true,
        dnsValidation: true,
        metadataExtraction: true,
        redisCaching: true,
        smartFallbacks: true,
      },
      testResult: {
        url: 'https://google.com',
        exists: testResult.exists,
        method: testResult.method,
        responseTime: testResult.metadata?.responseTime,
      },
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * GET /stats
 * Get validation statistics and cache metrics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get cache statistics
    const cacheKeys = await redis.keys('url_validation:v3:*');

    return res.json({
      success: true,
      stats: {
        cachedUrls: cacheKeys.length,
        cacheKeyPattern: 'url_validation:v3:*',
        features: {
          validationMethods: 3,
          fallbackLevels: 3,
          defaultTimeout: 3000,
          maxTimeout: 5000,
          cacheTtl: '60-300s',
          metadataFields: ['title', 'description', 'favicon'],
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /cache
 * Clear validation cache
 */
router.delete('/cache', async (req, res) => {
  try {
    const cacheKeys = await redis.keys('url_validation:v3:*');

    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
    }

    return res.json({
      success: true,
      message: `Cleared ${cacheKeys.length} cached validation results`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
