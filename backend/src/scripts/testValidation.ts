#!/usr/bin/env node
/**
 * Unified URL Validation Test Script
 *
 * Combines the best of both validation scripts with flexible modes:
 * - quick: Fast validation of essential URLs (default)
 * - full: Comprehensive validation of all URLs
 * - category: Test specific category
 */

import axios from 'axios';
import chalk from 'chalk';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const VALIDATE_ENDPOINT = `${API_URL}/api/validate`;

// Essential URLs for quick testing (25 URLs max to avoid rate limits)
const ESSENTIAL_URLS = {
  core: ['google.com', 'github.com', 'stackoverflow.com', 'amazon.com', 'cloudflare.com'],
  shortDomains: ['x.com', 'bit.ly', 't.co'],
  educational: ['mit.edu', 'stanford.edu', 'univalle.edu.co'],
  government: ['usa.gov', 'nasa.gov'],
  newTLDs: ['example.app', 'my.dev'],
  international: ['google.co.uk', 'baidu.cn'],
  edgeCases: ['localhost:3000', 'sub.domain.example.com', '192.168.1.1'],
  invalid: [
    'this-domain-definitely-does-not-exist-12345.com',
    'invalid-url-test-99999.org',
    'domain with spaces.com',
  ],
};

// Full URL set for comprehensive testing
const FULL_URL_SET = {
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
    'j.mp',
  ],
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
    'stackoverflow.com',
  ],
  educational: [
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
    'cambridge.ac.uk',
  ],
  government: [
    'usa.gov',
    'whitehouse.gov',
    'nasa.gov',
    'nih.gov',
    'cdc.gov',
    'fbi.gov',
    'state.gov',
    'irs.gov',
  ],
  newTLDs: [
    'example.app',
    'my.dev',
    'awesome.tech',
    'startup.io',
    'creative.design',
    'blog.blog',
    'shop.store',
    'platform.ai',
  ],
  international: [
    'google.co.uk',
    'amazon.co.jp',
    'baidu.cn',
    'yandex.ru',
    'mercadolibre.com.ar',
    'lemonde.fr',
    'spiegel.de',
  ],
  edgeCases: [
    'localhost',
    'localhost:3000',
    '192.168.1.1',
    '10.0.0.1:8080',
    'sub.domain.example.com',
    'very.deep.sub.domain.example.com',
    'domain-with-hyphens.com',
    'domain with spaces.com',
    'https://example.com',
    'xn--9ca.com',
  ],
  invalid: [
    'this-domain-definitely-does-not-exist-12345.com',
    'invalid-url-test-99999.org',
    'domain_with_underscores.com',
    'domain with spaces.com',
    '123.456.789.012',
    'definitely-not-a-scam.com',
    'faceb00k.com',
  ],
};

interface TestResult {
  url: string;
  success: boolean;
  exists: boolean;
  method: string;
  responseTime: number;
  statusCode?: number;
  hasMetadata: boolean;
  favicon?: string;
  title?: string;
  error?: string;
}

interface TestOptions {
  mode: 'quick' | 'full' | 'category';
  category?: string;
  verbose?: boolean;
}

async function testUrl(url: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Ensure URL has protocol
    const urlToValidate = url.includes('://') ? url : `https://${url}`;

    const response = await axios.post(
      VALIDATE_ENDPOINT,
      { url: urlToValidate },
      {
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      return {
        url,
        success: true,
        exists: data.exists,
        method: data.validationMethod || data.method || 'unknown',
        responseTime,
        statusCode: data.statusCode,
        hasMetadata: !!(data.title || data.description || data.favicon),
        favicon: data.favicon,
        title: data.title,
      };
    } else if (response.status === 429) {
      return {
        url,
        success: false,
        exists: false,
        method: 'error',
        responseTime,
        hasMetadata: false,
        error: 'Rate limit exceeded',
      };
    } else {
      return {
        url,
        success: false,
        exists: false,
        method: 'error',
        responseTime,
        hasMetadata: false,
        error: response.data.error?.message || response.data.error || 'Unknown error',
      };
    }
  } catch (error: any) {
    return {
      url,
      success: false,
      exists: false,
      method: 'error',
      responseTime: Date.now() - startTime,
      hasMetadata: false,
      error: error.message,
    };
  }
}

async function testCategory(categoryName: string, urls: string[], verbose: boolean = false) {
  console.log(chalk.bold.blue(`\nTesting ${categoryName}:`));
  console.log(chalk.dim('─'.repeat(60)));

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const url of urls) {
    const result = await testUrl(url);
    results.push(result);

    // Determine test result
    const isExpectedInvalid =
      categoryName.toLowerCase().includes('invalid') ||
      url.includes('does-not-exist') ||
      url.includes('spaces') ||
      url.includes('_');

    let testPassed = false;
    let status = '';

    if (result.exists && !isExpectedInvalid) {
      testPassed = true;
      status = chalk.green('✓');
      passed++;
    } else if (!result.exists && isExpectedInvalid) {
      testPassed = true;
      status = chalk.green('✓');
      passed++;
    } else if (result.error?.includes('Rate limit')) {
      status = chalk.yellow('⚠');
    } else {
      status = chalk.red('✗');
      failed++;
    }

    // Display result
    const urlDisplay = url.padEnd(40);
    const methodDisplay = result.method.padEnd(6);
    const timeDisplay = `${result.responseTime}ms`.padStart(6);
    const faviconDisplay = result.favicon ? chalk.green('🎨') : '';
    const metadataInfo = result.hasMetadata
      ? `${faviconDisplay} ${result.title ? chalk.dim(result.title.substring(0, 30) + '...') : ''}`
      : '';

    if (verbose || !testPassed || result.error) {
      console.log(
        `${status} ${urlDisplay} [${methodDisplay}] ${timeDisplay} ${metadataInfo} ${
          result.error ? chalk.red(`(${result.error})`) : ''
        }`
      );
    } else {
      console.log(`${status} ${urlDisplay} [${methodDisplay}] ${timeDisplay} ${metadataInfo}`);
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { results, passed, failed };
}

async function checkRateLimit(): Promise<{ canProceed: boolean; remaining: number }> {
  try {
    const response = await axios.post(
      VALIDATE_ENDPOINT,
      { url: 'https://example.com' },
      { timeout: 5000, validateStatus: () => true }
    );

    const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '100');
    return {
      canProceed: remaining >= 20,
      remaining,
    };
  } catch {
    return { canProceed: true, remaining: 100 };
  }
}

async function runTests(options: TestOptions) {
  console.log(chalk.bold.blue('\n🧪 URL Validation Test Suite'));
  console.log(chalk.dim(`Mode: ${options.mode}`));
  console.log(chalk.dim(`API: ${API_URL}`));
  console.log(chalk.dim(`Time: ${new Date().toISOString()}\n`));

  // Check rate limit
  const rateLimit = await checkRateLimit();
  if (!rateLimit.canProceed) {
    console.log(chalk.red('❌ Rate limit too low to run tests'));
    console.log(chalk.yellow(`Remaining requests: ${rateLimit.remaining}`));
    process.exit(1);
  }

  console.log(chalk.green(`✓ Rate limit OK (${rateLimit.remaining} requests remaining)\n`));

  let totalPassed = 0;
  let totalFailed = 0;
  let totalUrls = 0;
  let totalWithFavicon = 0;
  let totalWithMetadata = 0;
  const allResults: TestResult[] = [];

  // Select URL set based on mode
  let urlSet: Record<string, string[]>;

  if (options.mode === 'quick') {
    urlSet = ESSENTIAL_URLS;
  } else if (options.mode === 'full') {
    urlSet = FULL_URL_SET;
  } else if (options.mode === 'category' && options.category) {
    const category = options.category.toLowerCase();
    const fullCategory = FULL_URL_SET[category as keyof typeof FULL_URL_SET];
    if (!fullCategory) {
      console.log(chalk.red(`Category '${options.category}' not found`));
      console.log(chalk.yellow('Available categories:', Object.keys(FULL_URL_SET).join(', ')));
      process.exit(1);
    }
    urlSet = { [options.category]: fullCategory };
  } else {
    urlSet = ESSENTIAL_URLS;
  }

  // Test each category
  for (const [category, urls] of Object.entries(urlSet)) {
    const { results, passed, failed } = await testCategory(category, urls, options.verbose);
    totalPassed += passed;
    totalFailed += failed;
    totalUrls += urls.length;

    // Collect metadata statistics
    results.forEach((result) => {
      allResults.push(result);
      if (result.favicon) totalWithFavicon++;
      if (result.hasMetadata) totalWithMetadata++;
    });
  }

  // Summary
  console.log(chalk.dim('\n' + '═'.repeat(60) + '\n'));
  console.log(chalk.bold('Summary:'));
  console.log(`  Total URLs tested: ${totalUrls}`);
  console.log(`  ${chalk.green(`Passed: ${totalPassed}`)}`);
  console.log(`  ${chalk.red(`Failed: ${totalFailed}`)}`);
  console.log(`  Success rate: ${((totalPassed / totalUrls) * 100).toFixed(1)}%`);

  console.log(chalk.dim('\n  Metadata extraction:'));
  console.log(
    `  With favicon: ${chalk.green(totalWithFavicon)} (${((totalWithFavicon / totalPassed) * 100).toFixed(1)}%)`
  );
  console.log(
    `  With metadata: ${chalk.green(totalWithMetadata)} (${((totalWithMetadata / totalPassed) * 100).toFixed(1)}%)`
  );

  // Show URLs that should have favicon but don't (for debugging)
  if (options.verbose) {
    const missingFavicon = allResults.filter((r) => r.exists && r.accessible && !r.favicon);
    if (missingFavicon.length > 0) {
      console.log(chalk.yellow('\n  URLs accessible but without favicon:'));
      missingFavicon.forEach((r) => {
        console.log(`    - ${r.url}`);
      });
    }
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

// Parse command line arguments
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    mode: 'quick',
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--mode' || arg === '-m') {
      const mode = args[++i];
      if (mode === 'quick' || mode === 'full' || mode === 'category') {
        options.mode = mode;
      }
    } else if (arg === '--category' || arg === '-c') {
      options.category = args[++i];
      options.mode = 'category';
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
URL Validation Test Suite

Usage: npx tsx testValidation.ts [options]

Options:
  -m, --mode <mode>      Test mode: quick (default), full, category
  -c, --category <name>  Test specific category (sets mode to 'category')
  -v, --verbose          Show detailed output
  -h, --help             Show this help message

Examples:
  npx tsx testValidation.ts                    # Quick test (default)
  npx tsx testValidation.ts --mode full        # Full test suite
  npx tsx testValidation.ts -c educational     # Test educational domains
  npx tsx testValidation.ts -m quick -v        # Quick test with details

Available categories:
  ${Object.keys(FULL_URL_SET).join(', ')}
      `);
      process.exit(0);
    }
  }

  return options;
}

// Run tests
const options = parseArgs();
runTests(options).catch(console.error);
