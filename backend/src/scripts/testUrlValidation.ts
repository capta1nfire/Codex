#!/usr/bin/env node
/**
 * URL Validation Test Script
 * Tests various domain types, TLDs, and edge cases
 */

import axios from 'axios';
import chalk from 'chalk';

// Test configuration
const API_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const VALIDATE_ENDPOINT = `${API_URL}/api/validate/check-url`;

// Test categories with various URLs
const TEST_URLS = {
  // Short domain names
  shortDomains: [
    'x.com',
    'y.com',
    'z.co',
    'a.io',
    'i.am',
    'go.to',
    'fb.me',
    'bit.ly',
    't.co',
    'j.mp'
  ],

  // Popular domains
  popularDomains: [
    'google.com',
    'facebook.com',
    'youtube.com',
    'twitter.com',
    'instagram.com',
    'linkedin.com',
    'reddit.com',
    'wikipedia.org',
    'amazon.com',
    'netflix.com',
    'spotify.com',
    'github.com',
    'stackoverflow.com'
  ],

  // Less popular but valid domains
  lesserKnownDomains: [
    'duckduckgo.com',
    'protonmail.com',
    'signal.org',
    'lichess.org',
    'archive.org',
    'wolframalpha.com',
    'khanacademy.org',
    'coursera.org',
    'edx.org'
  ],

  // Educational domains (.edu)
  educationalDomains: [
    'mit.edu',
    'stanford.edu',
    'harvard.edu',
    'berkeley.edu',
    'yale.edu',
    'princeton.edu',
    'cornell.edu',
    'columbia.edu',
    'ucla.edu',
    'oxford.ac.uk',
    'cambridge.ac.uk'
  ],

  // Organization domains (.org)
  organizationDomains: [
    'mozilla.org',
    'apache.org',
    'wikimedia.org',
    'debian.org',
    'fsf.org',
    'eff.org',
    'creativecommons.org',
    'python.org',
    'nodejs.org',
    'rust-lang.org'
  ],

  // Government domains (.gov)
  governmentDomains: [
    'usa.gov',
    'whitehouse.gov',
    'nasa.gov',
    'nih.gov',
    'cdc.gov',
    'fbi.gov',
    'cia.gov',
    'state.gov',
    'treasury.gov',
    'irs.gov'
  ],

  // New TLDs
  newTLDs: [
    'example.app',
    'my.dev',
    'awesome.tech',
    'startup.io',
    'creative.design',
    'blog.blog',
    'shop.store',
    'my.email',
    'project.work',
    'idea.life',
    'business.company',
    'service.cloud',
    'platform.ai',
    'solution.software'
  ],

  // Country code TLDs
  countryCodeTLDs: [
    'google.co.uk',
    'amazon.co.jp',
    'baidu.cn',
    'yandex.ru',
    'mercadolibre.com.ar',
    'globo.com.br',
    'lemonde.fr',
    'spiegel.de',
    'corriere.it',
    'elpais.es',
    'aftonbladet.se',
    'vg.no',
    'stuff.co.nz',
    'smh.com.au'
  ],

  // Special cases and edge cases
  edgeCases: [
    'localhost',
    'localhost:3000',
    '192.168.1.1',
    '10.0.0.1:8080',
    'test.localhost',
    'my-site.local',
    'example.test',
    'sub.domain.example.com',
    'deep.sub.domain.example.com',
    'very.deep.sub.domain.example.com',
    'xn--e1afmkfd.xn--p1ai', // Cyrillic domain
    'xn--9ca.com', // é.com
    '🌮.ws', // Emoji domain
    'domain-with-hyphens.com',
    'domain_with_underscores.com', // Invalid
    'domain with spaces.com', // Invalid
    'https://example.com', // With protocol
    'http://example.com:8080/path', // With port and path
    'ftp://files.example.com', // Different protocol
    'a'.repeat(63) + '.com', // Max label length
    'a'.repeat(253) + '.com', // Near max domain length
    '123.456.789.012', // Invalid IP
    '1234:5678:90ab:cdef::', // IPv6
  ],

  // Social media specific
  socialMediaDomains: [
    'facebook.com/mypage',
    'instagram.com/user',
    'twitter.com/handle',
    'linkedin.com/in/profile',
    'youtube.com/channel/123',
    'tiktok.com/@user',
    'pinterest.com/user/boards',
    'snapchat.com/add/user',
    'twitch.tv/streamer',
    'discord.gg/invite'
  ],

  // Suspicious or potentially problematic
  suspiciousDomains: [
    'faceb00k.com',
    'g00gle.com',
    'arnazon.com',
    'paypaI.com', // with capital I
    'secure-bank.fake.com',
    'your-bank-security.com',
    'definitely-not-a-scam.com',
    'free-money-here.biz',
    'click-here-now.info'
  ]
};

// ANSI color codes for output
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
  bold: chalk.bold
};

// Statistics
let stats = {
  total: 0,
  valid: 0,
  invalid: 0,
  errors: 0,
  byCategory: {} as Record<string, { total: number; valid: number; invalid: number; errors: number }>
};

// Validate a single URL
async function validateUrl(url: string): Promise<{
  url: string;
  isValid: boolean;
  exists?: boolean;
  error?: string;
  statusCode?: number;
  title?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await axios.post(
      VALIDATE_ENDPOINT,
      { url },
      { 
        timeout: 10000,
        validateStatus: () => true // Don't throw on HTTP errors
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.exists !== undefined) {
      return {
        url,
        isValid: true,
        exists: response.data.exists,
        title: response.data.title,
        statusCode: response.data.statusCode,
        responseTime
      };
    } else if (response.status === 429) {
      // Rate limit error
      return {
        url,
        isValid: false,
        error: response.data.error?.message || 'Rate limit exceeded',
        responseTime
      };
    } else {
      // Handle error response format
      let errorMessage = 'Invalid URL';
      if (response.data.error) {
        errorMessage = typeof response.data.error === 'string' 
          ? response.data.error 
          : response.data.error.message || JSON.stringify(response.data.error);
      }
      return {
        url,
        isValid: false,
        error: errorMessage,
        responseTime
      };
    }
  } catch (error: any) {
    return {
      url,
      isValid: false,
      error: error.message || 'Network error',
      responseTime: Date.now() - startTime
    };
  }
}

// Test a category of URLs
async function testCategory(categoryName: string, urls: string[]) {
  console.log(`\n${colors.bold.blue(`Testing ${categoryName}:`)} ${colors.dim(`(${urls.length} URLs)`)}`);
  console.log(colors.dim('─'.repeat(80)));
  
  // Initialize category stats
  stats.byCategory[categoryName] = { total: 0, valid: 0, invalid: 0, errors: 0 };
  
  for (const url of urls) {
    const result = await validateUrl(url);
    
    // Update statistics
    stats.total++;
    stats.byCategory[categoryName].total++;
    
    // Format output
    let status = '';
    let details = '';
    
    if (result.isValid) {
      stats.valid++;
      stats.byCategory[categoryName].valid++;
      
      if (result.exists) {
        status = colors.success('✓ VALID & EXISTS');
        details = colors.dim(`${result.statusCode || 'N/A'} - ${result.title || 'No title'}`);
      } else {
        status = colors.warning('✓ VALID (not reachable)');
        details = colors.dim('Domain valid but not accessible');
      }
    } else if (result.error && typeof result.error === 'string' && result.error.includes('Network error')) {
      stats.errors++;
      stats.byCategory[categoryName].errors++;
      status = colors.error('✗ ERROR');
      details = colors.dim(result.error);
    } else {
      stats.invalid++;
      stats.byCategory[categoryName].invalid++;
      status = colors.error('✗ INVALID');
      details = colors.dim(result.error || 'Invalid format');
    }
    
    // Print result
    console.log(
      `${status.padEnd(30)} ${url.padEnd(40)} ${details} ${colors.dim(`(${result.responseTime}ms)`)}`
    );
    
    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Print summary statistics
function printSummary() {
  console.log(`\n${colors.bold.blue('Summary:')}`);
  console.log(colors.dim('═'.repeat(80)));
  
  console.log(`Total URLs tested: ${colors.bold(stats.total.toString())}`);
  console.log(`Valid: ${colors.success(stats.valid.toString())} (${((stats.valid / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Invalid: ${colors.error(stats.invalid.toString())} (${((stats.invalid / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Errors: ${colors.warning(stats.errors.toString())} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);
  
  console.log(`\n${colors.bold('By Category:')}`);
  console.log(colors.dim('─'.repeat(80)));
  
  for (const [category, catStats] of Object.entries(stats.byCategory)) {
    const validPercent = ((catStats.valid / catStats.total) * 100).toFixed(1);
    console.log(
      `${category.padEnd(25)} - ` +
      `Valid: ${colors.success(catStats.valid.toString().padStart(3))}/${catStats.total} (${validPercent}%) ` +
      `Invalid: ${colors.error(catStats.invalid.toString().padStart(3))} ` +
      `Errors: ${colors.warning(catStats.errors.toString().padStart(3))}`
    );
  }
}

// Check rate limit status
async function checkRateLimit(): Promise<{ canProceed: boolean; remaining: number; resetTime?: Date }> {
  try {
    // Make a test request to check rate limit
    const response = await axios.post(
      VALIDATE_ENDPOINT,
      { url: 'https://example.com' },
      { 
        timeout: 5000,
        validateStatus: () => true
      }
    );
    
    const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0');
    const resetTimestamp = parseInt(response.headers['x-ratelimit-reset'] || '0');
    
    if (response.status === 429) {
      return {
        canProceed: false,
        remaining: 0,
        resetTime: new Date(resetTimestamp * 1000)
      };
    }
    
    // Need at least 20 requests to run meaningful tests
    return {
      canProceed: remaining >= 20,
      remaining,
      resetTime: resetTimestamp ? new Date(resetTimestamp * 1000) : undefined
    };
  } catch (error) {
    // If we can't check, assume we can proceed
    return { canProceed: true, remaining: 100 };
  }
}

// Main execution
async function main() {
  console.log(colors.bold.blue('\n🔍 URL Validation Test Suite'));
  console.log(colors.dim(`Testing against: ${API_URL}`));
  console.log(colors.dim(`Started at: ${new Date().toISOString()}`));
  
  // Check rate limit before proceeding
  const rateLimit = await checkRateLimit();
  if (!rateLimit.canProceed) {
    console.log(colors.error('\n❌ Rate limit exceeded!'));
    console.log(colors.warning(`Remaining requests: ${rateLimit.remaining}`));
    if (rateLimit.resetTime) {
      const waitTime = Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000);
      console.log(colors.warning(`Rate limit resets at: ${rateLimit.resetTime.toISOString()}`));
      console.log(colors.warning(`Please wait ${waitTime} seconds before running tests.`));
    }
    console.log(colors.info('\n💡 Tip: Use a smaller test set or wait for rate limit reset.'));
    process.exit(1);
  }
  
  console.log(colors.success(`\n✓ Rate limit check passed. ${rateLimit.remaining} requests remaining.`));
  
  try {
    // Test each category
    await testCategory('Short Domains', TEST_URLS.shortDomains);
    await testCategory('Popular Domains', TEST_URLS.popularDomains);
    await testCategory('Lesser Known Domains', TEST_URLS.lesserKnownDomains);
    await testCategory('Educational (.edu)', TEST_URLS.educationalDomains);
    await testCategory('Organizations (.org)', TEST_URLS.organizationDomains);
    await testCategory('Government (.gov)', TEST_URLS.governmentDomains);
    await testCategory('New TLDs', TEST_URLS.newTLDs);
    await testCategory('Country Code TLDs', TEST_URLS.countryCodeTLDs);
    await testCategory('Edge Cases', TEST_URLS.edgeCases);
    await testCategory('Social Media', TEST_URLS.socialMediaDomains);
    await testCategory('Suspicious Domains', TEST_URLS.suspiciousDomains);
    
    // Print summary
    printSummary();
    
    console.log(colors.dim(`\nCompleted at: ${new Date().toISOString()}`));
    console.log(colors.success('\n✨ Test suite completed!'));
    
  } catch (error) {
    console.error(colors.error('\n❌ Test suite failed:'), error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);

export { TEST_URLS, validateUrl };