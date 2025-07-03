#!/usr/bin/env node

/**
 * Page Health Checker (Simple Version)
 * No external dependencies required
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_PATH = path.join(__dirname, '../frontend/src/app/page.tsx');
const MAX_LINES = 50;
const MAX_CODE_LINES = 30;
const MAX_IMPORTS = 2;

console.log('\n📊 Page Health Check Report\n');
console.log(`File: ${PAGE_PATH}`);
console.log(`Date: ${new Date().toISOString()}\n`);

if (!fs.existsSync(PAGE_PATH)) {
  console.error('❌ FATAL: page.tsx not found!');
  process.exit(1);
}

const content = fs.readFileSync(PAGE_PATH, 'utf-8');
const lines = content.split('\n');

// Calculate metrics
const totalLines = lines.length;
const codeLines = lines.filter(line => {
  const trimmed = line.trim();
  return trimmed && !trimmed.startsWith('*') && !trimmed.startsWith('//');
}).length;

const imports = (content.match(/import\s+.+\s+from/g) || []).length;

// Report
console.log('📈 Metrics:');
console.log(`  Total Lines: ${totalLines}/${MAX_LINES} ${totalLines <= MAX_LINES ? '✓' : '✗'}`);
console.log(`  Code Lines: ${codeLines}/${MAX_CODE_LINES} ${codeLines <= MAX_CODE_LINES ? '✓' : '✗'}`);
console.log(`  Imports: ${imports}/${MAX_IMPORTS} ${imports <= MAX_IMPORTS ? '✓' : '✗'}`);

// Check for violations
const violations = [];

// Extract only code lines (no comments)
const codeOnly = lines
  .filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
  .join('\n');

if (totalLines > MAX_LINES) violations.push(`Too many lines: ${totalLines}`);
if (codeLines > MAX_CODE_LINES) violations.push(`Too much code: ${codeLines} lines`);
if (imports > MAX_IMPORTS) violations.push(`Too many imports: ${imports}`);
if (codeOnly.includes('useState')) violations.push('Contains useState');
if (codeOnly.includes('useEffect')) violations.push('Contains useEffect');

if (violations.length === 0) {
  console.log('\n✅ PASSED - page.tsx is healthy!\n');
  process.exit(0);
} else {
  console.log('\n❌ FAILED - Issues found:');
  violations.forEach(v => console.log(`  • ${v}`));
  console.log('');
  process.exit(1);
}