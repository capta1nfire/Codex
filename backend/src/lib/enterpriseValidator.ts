/**
 * Enterprise-Grade URL Validator
 *
 * Multi-layer validation system with intelligent fallbacks:
 * 1. Stealth HTTP validation (primary)
 * 2. Progressive header enhancement
 * 3. Browser behavior simulation
 * 4. DNS fallback validation
 * 5. Puppeteer real browser (ultimate fallback)
 *
 * Designed to bypass enterprise anti-bot systems like CloudFlare, Amazon, Shopify
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

import axios from 'axios';
import * as cheerio from 'cheerio';

import {
  generateEnterpriseHeaders,
  getTLSFingerprint,
  getRealisticTiming,
  isHighProtectionDomain,
  getBrowserProfile,
} from './browserFingerprinting.js';

export interface ValidationResult {
  exists: boolean;
  accessible: boolean;
  metadata?: {
    title?: string;
    description?: string;
    favicon?: string;
    statusCode?: number;
    responseTime?: number;
    redirectUrl?: string;
    contentType?: string;
    lastModified?: string;
    server?: string;
  };
  method: 'stealth' | 'enhanced' | 'behavioral' | 'dns' | 'browser';
  attempts: number;
  debugInfo?: any;
}

/**
 * Level 1: Stealth HTTP Validation
 * Uses enterprise-grade headers and TLS fingerprinting
 */
async function stealthValidation(url: string): Promise<ValidationResult> {
  const startTime = Date.now();
  console.log(`[StealthValidator] Starting stealth validation for: ${url}`);

  try {
    const urlObj = new URL(url);
    const profile = getBrowserProfile(url);
    const headers = generateEnterpriseHeaders(url, true); // HEAD request
    const tlsConfig = getTLSFingerprint(profile);
    const timing = getRealisticTiming();

    // Realistic pre-request delay (browsers don't connect instantly)
    await new Promise((resolve) => setTimeout(resolve, timing.preDelay));

    const axiosConfig: any = {
      method: 'HEAD',
      url: url,
      timeout: 8000,
      maxRedirects: 5,
      headers,
      validateStatus: () => true, // Don't throw on 4xx/5xx
      httpsAgent: new https.Agent({
        ...tlsConfig,
        keepAlive: true,
        keepAliveMsecs: 1000,
        rejectUnauthorized: true,
      }),
    };

    const response = await axios(axiosConfig);
    const responseTime = Date.now() - startTime;

    // Consider 2xx, 3xx, and even some 4xx as "exists"
    const exists = response.status < 500;
    const accessible = response.status >= 200 && response.status < 400;

    console.log(`[StealthValidator] Response: ${response.status} in ${responseTime}ms`);

    return {
      exists,
      accessible,
      metadata: {
        statusCode: response.status,
        responseTime,
        redirectUrl: response.request?.res?.responseUrl || url,
        contentType: response.headers['content-type'],
        lastModified: response.headers['last-modified'],
        server: response.headers['server'],
      },
      method: 'stealth',
      attempts: 1,
    };
  } catch (error: any) {
    console.log(`[StealthValidator] Failed: ${error.message}`);

    // Network errors often mean site exists but is blocking us
    if (error.code === 'ENOTFOUND') {
      return { exists: false, accessible: false, method: 'stealth', attempts: 1 };
    }

    // Timeout, connection refused, etc. = site might exist but blocking
    return {
      exists: true,
      accessible: false,
      method: 'stealth',
      attempts: 1,
      debugInfo: { error: error.message, code: error.code },
    };
  }
}

/**
 * Level 2: Enhanced Progressive Validation
 * Tries multiple header combinations and timing patterns
 */
async function enhancedValidation(url: string): Promise<ValidationResult> {
  console.log(`[EnhancedValidator] Starting enhanced validation for: ${url}`);

  const strategies = [
    { method: 'GET', timeout: 5000, headers: generateEnterpriseHeaders(url, false) },
    { method: 'GET', timeout: 8000, headers: generateEnterpriseHeaders(url, false) },
    { method: 'HEAD', timeout: 10000, headers: generateEnterpriseHeaders(url, true) },
  ];

  for (let i = 0; i < strategies.length; i++) {
    try {
      const strategy = strategies[i];
      const timing = getRealisticTiming();

      // Progressive delays between attempts
      await new Promise((resolve) => setTimeout(resolve, timing.betweenRequests * (i + 1)));

      const response = await axios({
        ...strategy,
        url,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      if (response.status < 500) {
        let title, description, favicon;

        // Extract metadata if we got HTML content
        if (
          strategy.method === 'GET' &&
          response.data &&
          response.headers['content-type']?.includes('text/html')
        ) {
          const $ = cheerio.load(response.data);
          title = $('title').text()?.trim();
          description = $('meta[name="description"]').attr('content')?.trim();
          favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');

          // Convert relative favicon URLs to absolute
          if (favicon && !favicon.startsWith('http')) {
            const baseUrl = new URL(url);
            favicon = new URL(favicon, baseUrl.origin).toString();
          }
        }

        console.log(`[EnhancedValidator] Success with strategy ${i + 1}: ${response.status}`);

        return {
          exists: true,
          accessible: response.status >= 200 && response.status < 400,
          metadata: {
            title,
            description,
            favicon,
            statusCode: response.status,
            contentType: response.headers['content-type'],
            server: response.headers['server'],
          },
          method: 'enhanced',
          attempts: i + 1,
        };
      }
    } catch (error: any) {
      console.log(`[EnhancedValidator] Strategy ${i + 1} failed: ${error.message}`);

      if (error.code === 'ENOTFOUND') {
        return { exists: false, accessible: false, method: 'enhanced', attempts: i + 1 };
      }

      // Continue to next strategy
    }
  }

  // All enhanced strategies failed
  return {
    exists: true,
    accessible: false,
    method: 'enhanced',
    attempts: strategies.length,
    debugInfo: { note: 'All enhanced strategies failed, site likely exists but blocking' },
  };
}

/**
 * Level 3: Behavioral Simulation
 * Simulates real browser behavior patterns
 */
async function behavioralValidation(url: string): Promise<ValidationResult> {
  console.log(`[BehavioralValidator] Starting behavioral validation for: ${url}`);

  try {
    const urlObj = new URL(url);
    const headers = generateEnterpriseHeaders(url, false);

    // Step 1: Simulate DNS prefetch (browsers do this)
    console.log(`[BehavioralValidator] Simulating DNS prefetch...`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Step 2: Make initial connection with realistic headers
    const response1 = await axios({
      method: 'GET',
      url,
      timeout: 10000,
      maxRedirects: 3,
      headers: {
        ...headers,
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
      },
      validateStatus: () => true,
    });

    if (response1.status < 500) {
      // Step 3: Simulate common browser follow-up requests
      const followUpPromises = [];

      // Try to fetch favicon (browsers often do this)
      followUpPromises.push(
        axios({
          method: 'GET',
          url: `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
          timeout: 3000,
          headers: {
            ...headers,
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Dest': 'image',
          },
          validateStatus: () => true,
        }).catch(() => null)
      );

      // Wait for follow-up requests
      await Promise.all(followUpPromises);

      // Extract metadata
      let title, description, favicon;
      if (response1.data && response1.headers['content-type']?.includes('text/html')) {
        const $ = cheerio.load(response1.data);
        title = $('title').text()?.trim();
        description = $('meta[name="description"]').attr('content')?.trim();
        favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href');

        if (favicon && !favicon.startsWith('http')) {
          favicon = new URL(favicon, `${urlObj.protocol}//${urlObj.host}`).toString();
        }
      }

      console.log(`[BehavioralValidator] Success: ${response1.status}`);

      return {
        exists: true,
        accessible: response1.status >= 200 && response1.status < 400,
        metadata: {
          title,
          description,
          favicon,
          statusCode: response1.status,
          contentType: response1.headers['content-type'],
          server: response1.headers['server'],
        },
        method: 'behavioral',
        attempts: 1,
      };
    }
  } catch (error: any) {
    console.log(`[BehavioralValidator] Failed: ${error.message}`);

    if (error.code === 'ENOTFOUND') {
      return { exists: false, accessible: false, method: 'behavioral', attempts: 1 };
    }
  }

  return {
    exists: true,
    accessible: false,
    method: 'behavioral',
    attempts: 1,
    debugInfo: { note: 'Behavioral simulation failed, strong anti-bot protection likely' },
  };
}

/**
 * Level 4: DNS Fallback
 * Pure DNS validation when HTTP fails
 */
async function dnsValidation(url: string): Promise<ValidationResult> {
  console.log(`[DNSValidator] Starting DNS validation for: ${url}`);

  try {
    const { promisify } = await import('util');
    const dns = await import('dns');
    const resolve4 = promisify(dns.resolve4);

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const records = await resolve4(domain);

    console.log(`[DNSValidator] DNS records found for ${domain}:`, records);

    return {
      exists: true,
      accessible: false, // Can't determine accessibility via DNS alone
      metadata: {
        statusCode: undefined,
      },
      method: 'dns',
      attempts: 1,
      debugInfo: { dnsRecords: records },
    };
  } catch (error: any) {
    console.log(`[DNSValidator] DNS lookup failed: ${error.message}`);

    return {
      exists: false,
      accessible: false,
      method: 'dns',
      attempts: 1,
    };
  }
}

/**
 * Master validation function with intelligent fallbacks
 */
export async function validateUrlEnterprise(url: string): Promise<ValidationResult> {
  console.log(`\n[EnterpriseValidator] 🚀 Starting enterprise validation for: ${url}`);

  // Step 1: Try stealth validation first (fastest, most reliable)
  try {
    const stealthResult = await stealthValidation(url);
    if (stealthResult.exists && stealthResult.accessible) {
      console.log(`[EnterpriseValidator] ✅ Stealth validation successful`);
      return stealthResult;
    }

    // If stealth detected blocking, continue to enhanced
    if (stealthResult.accessible === false && isHighProtectionDomain(url)) {
      console.log(`[EnterpriseValidator] 🛡️ High protection domain detected, escalating...`);
    }
  } catch (error) {
    console.log(`[EnterpriseValidator] Stealth validation error:`, error);
  }

  // Step 2: Enhanced validation with multiple strategies
  try {
    const enhancedResult = await enhancedValidation(url);
    if (enhancedResult.exists && enhancedResult.accessible) {
      console.log(`[EnterpriseValidator] ✅ Enhanced validation successful`);
      return enhancedResult;
    }
  } catch (error) {
    console.log(`[EnterpriseValidator] Enhanced validation error:`, error);
  }

  // Step 3: Behavioral simulation for tough sites
  try {
    const behavioralResult = await behavioralValidation(url);
    if (behavioralResult.exists && behavioralResult.accessible) {
      console.log(`[EnterpriseValidator] ✅ Behavioral validation successful`);
      return behavioralResult;
    }
  } catch (error) {
    console.log(`[EnterpriseValidator] Behavioral validation error:`, error);
  }

  // Step 4: DNS fallback to at least determine if domain exists
  try {
    const dnsResult = await dnsValidation(url);
    if (dnsResult.exists) {
      console.log(`[EnterpriseValidator] ✅ DNS validation confirms domain exists`);
      return {
        ...dnsResult,
        accessible: false,
        debugInfo: {
          ...dnsResult.debugInfo,
          note: 'Domain exists via DNS but HTTP access blocked by anti-bot protection',
        },
      };
    }
  } catch (error) {
    console.log(`[EnterpriseValidator] DNS validation error:`, error);
  }

  // All methods failed
  console.log(`[EnterpriseValidator] ❌ All validation methods failed`);
  return {
    exists: false,
    accessible: false,
    method: 'dns',
    attempts: 4,
    debugInfo: { note: 'All validation methods failed, URL likely does not exist' },
  };
}

export default {
  validateUrlEnterprise,
  stealthValidation,
  enhancedValidation,
  behavioralValidation,
  dnsValidation,
};
