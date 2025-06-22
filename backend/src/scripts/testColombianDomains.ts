#!/usr/bin/env node
/**
 * Colombian Educational Domains Test Script
 * Tests specifically .edu.co domains
 */

import axios from 'axios';

// Test configuration
const API_URL = process.env.BACKEND_URL || 'http://localhost:3004';
const VALIDATE_ENDPOINT = `${API_URL}/api/validate/check-url`;

// Colombian educational domains
const COLOMBIAN_EDU_DOMAINS = [
  'univalle.edu.co',
  'unal.edu.co',
  'javeriana.edu.co',
  'uniandes.edu.co',
  'udea.edu.co',
  'uninorte.edu.co',
  'icesi.edu.co',
  'eafit.edu.co',
  'urosario.edu.co',
  'unab.edu.co',
  'uptc.edu.co',
  'utp.edu.co',
  'ucaldas.edu.co',
  'uniquindio.edu.co',
  'udea.edu.co',
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

// Validate a single URL
async function validateUrl(url: string): Promise<{
  url: string;
  exists: boolean;
  statusCode?: number;
  title?: string;
  error?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      VALIDATE_ENDPOINT,
      { url },
      {
        timeout: 20000, // 20 seconds for .edu.co domains
        validateStatus: () => true,
      }
    );

    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      return {
        url,
        exists: response.data.exists,
        statusCode: response.data.statusCode,
        title: response.data.title,
        error: response.data.error,
        responseTime,
      };
    } else {
      return {
        url,
        exists: false,
        error: response.data.error || `HTTP ${response.status}`,
        responseTime,
      };
    }
  } catch (error: any) {
    return {
      url,
      exists: false,
      error: error.message,
      responseTime: Date.now() - startTime,
    };
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}\n🇨🇴 Colombian Educational Domains Test${colors.reset}`);
  console.log(`${colors.dim}Testing against: ${API_URL}${colors.reset}`);
  console.log(`${colors.dim}Started at: ${new Date().toISOString()}${colors.reset}`);
  console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const domain of COLOMBIAN_EDU_DOMAINS) {
    process.stdout.write(`Testing ${domain.padEnd(25)} ... `);

    const result = await validateUrl(domain);

    if (result.exists) {
      successCount++;
      console.log(
        `${colors.green}✓ EXISTS${colors.reset} ` +
          `[${result.statusCode || 'N/A'}] ` +
          `${colors.dim}${result.title || 'No title'} ` +
          `(${result.responseTime}ms)${colors.reset}`
      );
    } else if (result.error?.includes('SSL certificate')) {
      // Special handling for SSL issues
      successCount++;
      console.log(
        `${colors.yellow}✓ EXISTS (SSL)${colors.reset} ` +
          `${colors.dim}${result.error} ` +
          `(${result.responseTime}ms)${colors.reset}`
      );
    } else {
      failureCount++;
      console.log(
        `${colors.red}✗ NOT FOUND${colors.reset} ` +
          `${colors.dim}${result.error || 'Unknown error'} ` +
          `(${result.responseTime}ms)${colors.reset}`
      );
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  console.log(`\n${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`Total tested: ${COLOMBIAN_EDU_DOMAINS.length}`);
  console.log(`${colors.green}Successful: ${successCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failureCount}${colors.reset}`);
  console.log(`Success rate: ${((successCount / COLOMBIAN_EDU_DOMAINS.length) * 100).toFixed(1)}%`);
  console.log(`\n${colors.dim}Completed at: ${new Date().toISOString()}${colors.reset}`);
}

// Run
main().catch(console.error);
