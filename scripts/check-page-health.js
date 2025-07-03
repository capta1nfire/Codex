#!/usr/bin/env node

/**
 * Page Health Checker
 * 
 * Monitors the health and metrics of page.tsx to ensure it stays clean
 * Run this as a pre-commit hook or in CI/CD
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const PAGE_PATH = path.join(__dirname, '../frontend/src/app/page.tsx');
const MAX_LINES = 50;
const MAX_CODE_LINES = 30;
const MAX_IMPORTS = 2;
const REQUIRED_TAGS = ['@protected', '@performance-critical', '@max-lines'];

class PageHealthChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.metrics = {};
  }

  checkFileExists() {
    if (!fs.existsSync(PAGE_PATH)) {
      this.errors.push('page.tsx not found!');
      return false;
    }
    return true;
  }

  analyzeFile() {
    const content = fs.readFileSync(PAGE_PATH, 'utf-8');
    const lines = content.split('\n');
    
    // Calculate metrics
    this.metrics.totalLines = lines.length;
    this.metrics.codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('*') && !trimmed.startsWith('//');
    }).length;
    
    this.metrics.imports = (content.match(/import\s+.+\s+from/g) || []).length;
    this.metrics.functions = (content.match(/function\s+\w+/g) || []).length;
    this.metrics.hooks = {
      useState: (content.match(/useState/g) || []).length,
      useEffect: (content.match(/useEffect/g) || []).length,
      useCallback: (content.match(/useCallback/g) || []).length,
      useMemo: (content.match(/useMemo/g) || []).length,
      useRef: (content.match(/useRef/g) || []).length
    };
    
    // Check for prohibited patterns
    this.checkSizeConstraints();
    this.checkComplexity(content);
    this.checkRequiredElements(content);
    this.checkProhibitedElements(content);
  }

  checkSizeConstraints() {
    if (this.metrics.totalLines > MAX_LINES) {
      this.errors.push(`File has ${this.metrics.totalLines} lines (max: ${MAX_LINES})`);
    }
    
    if (this.metrics.codeLines > MAX_CODE_LINES) {
      this.errors.push(`File has ${this.metrics.codeLines} code lines (max: ${MAX_CODE_LINES})`);
    }
    
    if (this.metrics.imports > MAX_IMPORTS) {
      this.errors.push(`File has ${this.metrics.imports} imports (max: ${MAX_IMPORTS})`);
    }
  }

  checkComplexity(content) {
    // Check for hooks
    Object.entries(this.metrics.hooks).forEach(([hook, count]) => {
      if (count > 0) {
        this.errors.push(`Found ${count} instance(s) of ${hook} - hooks are not allowed!`);
      }
    });
    
    // Check for conditionals
    if (content.includes('if (') || content.includes('if(')) {
      this.errors.push('Conditional logic detected - not allowed!');
    }
    
    // Check for loops
    if (content.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(/)) {
      this.errors.push('Loop detected - not allowed!');
    }
    
    // Check for event handlers
    if (content.match(/on[A-Z]\w+=/)) {
      this.errors.push('Event handler detected - not allowed!');
    }
  }

  checkRequiredElements(content) {
    // Check for required tags
    REQUIRED_TAGS.forEach(tag => {
      if (!content.includes(tag)) {
        this.errors.push(`Missing required tag: ${tag}`);
      }
    });
    
    // Check for use client
    if (!content.includes("'use client'")) {
      this.errors.push("Missing 'use client' directive");
    }
    
    // Check for QRGeneratorContainer
    if (!content.includes('<QRGeneratorContainer />')) {
      this.errors.push('Missing QRGeneratorContainer component');
    }
  }

  checkProhibitedElements(content) {
    // Check for multiple components
    const componentMatches = content.match(/<[A-Z]\w+/g) || [];
    if (componentMatches.length > 1) {
      this.warnings.push(`Found ${componentMatches.length} components - should only have QRGeneratorContainer`);
    }
    
    // Check for inline styles
    if (content.includes('style=')) {
      this.warnings.push('Inline styles detected - use Tailwind classes instead');
    }
    
    // Check for console logs
    if (content.includes('console.')) {
      this.errors.push('Console statement detected - remove before committing');
    }
  }

  generateReport() {
    console.log(chalk.bold.blue('\n📊 Page Health Check Report\n'));
    console.log(chalk.gray(`File: ${PAGE_PATH}`));
    console.log(chalk.gray(`Date: ${new Date().toISOString()}\n`));
    
    // Metrics
    console.log(chalk.bold('📈 Metrics:'));
    console.log(`  Total Lines: ${this.getMetricStatus(this.metrics.totalLines, MAX_LINES)}`);
    console.log(`  Code Lines: ${this.getMetricStatus(this.metrics.codeLines, MAX_CODE_LINES)}`);
    console.log(`  Imports: ${this.getMetricStatus(this.metrics.imports, MAX_IMPORTS)}`);
    console.log(`  Functions: ${this.getMetricStatus(this.metrics.functions, 1)}`);
    
    // Errors
    if (this.errors.length > 0) {
      console.log(chalk.bold.red('\n❌ Errors:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  Warnings:'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }
    
    // Summary
    const status = this.errors.length === 0 ? 
      chalk.green('✅ PASSED') : 
      chalk.red('❌ FAILED');
    
    console.log(chalk.bold(`\n📋 Status: ${status}`));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('\n🎉 page.tsx is healthy and well-protected!\n'));
    } else {
      console.log(chalk.red('\n🚨 page.tsx needs attention. Please fix the issues above.\n'));
    }
    
    // Return exit code
    return this.errors.length === 0 ? 0 : 1;
  }

  getMetricStatus(value, max) {
    const status = value <= max ? '✓' : '✗';
    const color = value <= max ? chalk.green : chalk.red;
    return color(`${value}/${max} ${status}`);
  }

  run() {
    console.log(chalk.bold.cyan('🏥 Running Page Health Check...\n'));
    
    if (!this.checkFileExists()) {
      console.error(chalk.red('Fatal: page.tsx not found!'));
      return 1;
    }
    
    this.analyzeFile();
    return this.generateReport();
  }
}

// Run the checker
const checker = new PageHealthChecker();
const exitCode = checker.run();
process.exit(exitCode);