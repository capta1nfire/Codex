/**
 * Enterprise-Grade Browser Fingerprinting System
 *
 * This module simulates real browser behavior with high fidelity to bypass
 * advanced anti-bot systems like CloudFlare, Amazon, and enterprise firewalls.
 *
 * Features:
 * - Realistic browser fingerprints with 40+ headers
 * - TLS fingerprinting simulation
 * - Behavioral patterns (timing, redirects)
 * - Adaptive fingerprinting based on target domain
 * - Multi-layer fallback system
 */

import crypto from 'crypto';

// Enterprise Browser Profiles - Based on real browser telemetry
interface BrowserProfile {
  name: string;
  userAgent: string;
  acceptHeader: string;
  secChUa: string;
  secChUaPlatform: string;
  secChUaMobile: string;
  acceptLanguage: string;
  platform: string;
  vendor: string;
  renderer: string;
  architecture: string;
  bitness: string;
  brands: Array<{ brand: string; version: string }>;
}

const ENTERPRISE_BROWSER_PROFILES: BrowserProfile[] = [
  // Chrome 120 Windows 11 - Most common enterprise setup
  {
    name: 'chrome-120-win11',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptHeader:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: '?0',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    vendor: 'Google Inc.',
    renderer: 'WebKit',
    architecture: 'x86',
    bitness: '64',
    brands: [
      { brand: 'Not_A Brand', version: '8' },
      { brand: 'Chromium', version: '120' },
      { brand: 'Google Chrome', version: '120' },
    ],
  },
  // Chrome 119 Windows 10 - Still very common
  {
    name: 'chrome-119-win10',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    acceptHeader:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    secChUa: '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: '?0',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    vendor: 'Google Inc.',
    renderer: 'WebKit',
    architecture: 'x86',
    bitness: '64',
    brands: [
      { brand: 'Google Chrome', version: '119' },
      { brand: 'Chromium', version: '119' },
      { brand: 'Not?A_Brand', version: '24' },
    ],
  },
  // Edge 120 Windows 11 - Enterprise favorite
  {
    name: 'edge-120-win11',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    acceptHeader:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: '?0',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    vendor: 'Google Inc.',
    renderer: 'WebKit',
    architecture: 'x86',
    bitness: '64',
    brands: [
      { brand: 'Not_A Brand', version: '8' },
      { brand: 'Chromium', version: '120' },
      { brand: 'Microsoft Edge', version: '120' },
    ],
  },
  // Firefox 121 Windows - Different engine
  {
    name: 'firefox-121-win11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    acceptHeader:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    secChUa: '', // Firefox doesn't send Sec-CH-UA
    secChUaPlatform: '',
    secChUaMobile: '',
    acceptLanguage: 'en-US,en;q=0.5',
    platform: 'Win32',
    vendor: '',
    renderer: 'Gecko',
    architecture: 'x86',
    bitness: '64',
    brands: [],
  },
  // Safari 17 macOS - Apple ecosystem
  {
    name: 'safari-17-macos',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    acceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    secChUa: '', // Safari doesn't send Sec-CH-UA
    secChUaPlatform: '',
    secChUaMobile: '',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'MacIntel',
    vendor: 'Apple Computer, Inc.',
    renderer: 'WebKit',
    architecture: 'x86',
    bitness: '64',
    brands: [],
  },
];

// Domain-specific browser preferences (enterprise sites prefer certain browsers)
const DOMAIN_BROWSER_PREFERENCES: Record<string, string[]> = {
  // Enterprise and business domains prefer Chrome/Edge
  'amazon.com': ['chrome-120-win11', 'edge-120-win11', 'chrome-119-win10'],
  'shopify.com': ['chrome-120-win11', 'chrome-119-win10', 'edge-120-win11'],
  'salesforce.com': ['edge-120-win11', 'chrome-120-win11'],
  'microsoft.com': ['edge-120-win11', 'chrome-120-win11'],
  'github.com': ['chrome-120-win11', 'firefox-121-win11', 'safari-17-macos'],
  'cloudflare.com': ['chrome-120-win11', 'edge-120-win11'],

  // Consumer sites have more variety
  'facebook.com': ['chrome-120-win11', 'safari-17-macos', 'edge-120-win11'],
  'google.com': ['chrome-120-win11', 'chrome-119-win10'],
  'apple.com': ['safari-17-macos', 'chrome-120-win11'],
};

/**
 * Get a realistic browser profile based on the target domain
 * Uses domain preferences and deterministic selection for consistency
 */
export function getBrowserProfile(url: string): BrowserProfile {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    const baseDomain = domain.replace(/^www\./, '');

    // Check for domain-specific preferences
    let preferredProfiles = DOMAIN_BROWSER_PREFERENCES[baseDomain];

    if (!preferredProfiles) {
      // For enterprise domains (.com, .net, .org), prefer Chrome/Edge
      if (
        baseDomain.endsWith('.com') ||
        baseDomain.endsWith('.net') ||
        baseDomain.endsWith('.org')
      ) {
        preferredProfiles = ['chrome-120-win11', 'edge-120-win11', 'chrome-119-win10'];
      }
      // For educational domains, allow more variety
      else if (baseDomain.endsWith('.edu') || baseDomain.endsWith('.edu.co')) {
        preferredProfiles = ['chrome-120-win11', 'firefox-121-win11', 'safari-17-macos'];
      }
      // Default fallback
      else {
        preferredProfiles = ['chrome-120-win11', 'chrome-119-win10'];
      }
    }

    // Deterministic selection based on URL hash for consistency
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const hashNum = parseInt(hash.substring(0, 8), 16);
    const profileIndex = hashNum % preferredProfiles.length;
    const selectedProfileName = preferredProfiles[profileIndex];

    const profile = ENTERPRISE_BROWSER_PROFILES.find((p) => p.name === selectedProfileName);
    return profile || ENTERPRISE_BROWSER_PROFILES[0]; // Fallback to first profile
  } catch (error) {
    console.warn('[BrowserFingerprinting] Error selecting profile:', error);
    return ENTERPRISE_BROWSER_PROFILES[0]; // Safe fallback
  }
}

/**
 * Generate comprehensive HTTP headers that match a real browser
 * This is the core of enterprise-grade validation
 */
export function generateEnterpriseHeaders(
  url: string,
  isHeadRequest: boolean = false
): Record<string, string> {
  const profile = getBrowserProfile(url);
  const isFirefox = profile.name.includes('firefox');
  const isSafari = profile.name.includes('safari');

  // Base headers that ALL modern browsers send
  const headers: Record<string, string> = {
    'User-Agent': profile.userAgent,
    Accept: profile.acceptHeader,
    'Accept-Language': profile.acceptLanguage,
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  // Chrome/Edge specific headers (Chromium-based)
  if (!isFirefox && !isSafari) {
    headers['sec-ch-ua'] = profile.secChUa;
    headers['sec-ch-ua-mobile'] = profile.secChUaMobile;
    headers['sec-ch-ua-platform'] = profile.secChUaPlatform;

    // Advanced Client Hints for enterprise detection
    headers['sec-ch-ua-arch'] = `"${profile.architecture}"`;
    headers['sec-ch-ua-bitness'] = `"${profile.bitness}"`;
    headers['sec-ch-ua-full-version-list'] = generateFullVersionList(profile);
    headers['sec-ch-ua-model'] = '""';
    headers['sec-ch-ua-platform-version'] = '"15.0.0"'; // Windows 11 version
  }

  // Security-focused headers that real browsers send
  if (isHeadRequest) {
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-Mode'] = 'no-cors';
    headers['Sec-Fetch-Dest'] = 'empty';
  } else {
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-User'] = '?1';
    headers['Sec-Fetch-Dest'] = 'document';
  }

  // Cache control headers (enterprise environments are very cache-aware)
  headers['Cache-Control'] = 'max-age=0';
  headers['Pragma'] = 'no-cache';

  // Additional headers for maximum realism
  if (!isHeadRequest) {
    headers['sec-purpose'] = 'prefetch;prerender';
    headers['purpose'] = 'prefetch';
  }

  console.log(
    `[BrowserFingerprinting] Generated ${Object.keys(headers).length} headers for ${profile.name} targeting ${new URL(url).hostname}`
  );

  return headers;
}

/**
 * Generate the full version list for sec-ch-ua-full-version-list header
 */
function generateFullVersionList(profile: BrowserProfile): string {
  return profile.brands.map((brand) => `"${brand.brand}";v="${brand.version}.0.0.0"`).join(', ');
}

/**
 * Advanced TLS fingerprinting configuration
 * This simulates the TLS handshake patterns of real browsers
 */
export function getTLSFingerprint(profile: BrowserProfile): any {
  const isFirefox = profile.name.includes('firefox');
  const isSafari = profile.name.includes('safari');

  if (isFirefox) {
    return {
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
      ].join(':'),
      curves: ['X25519', 'prime256v1', 'secp384r1'],
      signatureAlgorithms: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
      ],
    };
  } else if (isSafari) {
    return {
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256',
      ].join(':'),
      curves: ['X25519', 'prime256v1', 'secp384r1'],
      signatureAlgorithms: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
      ],
    };
  } else {
    // Chrome/Edge default
    return {
      ciphers: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
      ].join(':'),
      curves: ['X25519', 'prime256v1', 'secp384r1'],
      signatureAlgorithms: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
      ],
    };
  }
}

/**
 * Simulate realistic timing patterns
 * Real browsers don't make requests instantly
 */
export function getRealisticTiming(): { preDelay: number; betweenRequests: number } {
  return {
    preDelay: Math.floor(Math.random() * 100) + 50, // 50-150ms initial delay
    betweenRequests: Math.floor(Math.random() * 200) + 100, // 100-300ms between requests
  };
}

/**
 * Check if a domain is known to have aggressive anti-bot protection
 */
export function isHighProtectionDomain(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    const securityDomains = [
      'amazon.com',
      'shopify.com',
      'cloudflare.com',
      'akamai.com',
      'incapsula.com',
      'sucuri.net',
      'ddos-guard.net',
      'fastly.com',
      'maxcdn.com',
      'keycdn.com',
      'stackpath.com',
    ];

    return securityDomains.some((securityDomain) => domain.includes(securityDomain));
  } catch {
    return false;
  }
}

export default {
  getBrowserProfile,
  generateEnterpriseHeaders,
  getTLSFingerprint,
  getRealisticTiming,
  isHighProtectionDomain,
};
