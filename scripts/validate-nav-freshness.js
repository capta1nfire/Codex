#!/usr/bin/env node

/**
 * validate-nav-freshness.js
 * 
 * Simple script to check if .nav.md might need updates
 * Run manually or in CI/CD pipeline
 */

import fs from 'fs';
import path from 'path';

// Configuration
const NAV_FILE = '.nav.md';
const LAST_UPDATE_PATTERN = /Last Updated: (\d{4}-\d{2}-\d{2})/;
const WARNING_DAYS = 30; // Warn if not updated in 30 days

// Directories to check for major changes
const WATCH_DIRS = [
  'frontend/src/app',
  'frontend/src/components',
  'backend/src/routes',
  'backend/src/services',
  'rust_generator/src'
];

function checkNavFreshness() {
  console.log('🔍 Checking .nav.md freshness...\n');

  // Check if .nav.md exists
  if (!fs.existsSync(NAV_FILE)) {
    console.error('❌ ERROR: .nav.md not found!');
    process.exit(1);
  }

  // Read .nav.md content
  const navContent = fs.readFileSync(NAV_FILE, 'utf8');
  
  // Extract last update date
  const dateMatch = navContent.match(LAST_UPDATE_PATTERN);
  if (!dateMatch) {
    console.warn('⚠️  WARNING: No "Last Updated" date found in .nav.md');
    console.log('   Add: <!-- Last Updated: YYYY-MM-DD -->');
    return;
  }

  const lastUpdate = new Date(dateMatch[1]);
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));

  console.log(`📅 Last Updated: ${dateMatch[1]} (${daysSinceUpdate} days ago)`);

  // Check if update might be needed based on time
  if (daysSinceUpdate > WARNING_DAYS) {
    console.warn(`\n⚠️  WARNING: .nav.md hasn't been updated in ${daysSinceUpdate} days`);
    console.log('   Consider reviewing if any major structural changes occurred.\n');
  } else {
    console.log('✅ Update recency: OK\n');
  }

  // Check for potential missing directories
  console.log('📁 Checking referenced directories...');
  
  const missingDirs = [];
  const navDirs = navContent.match(/`\/[^`]+\/`/g) || [];
  
  navDirs.forEach(dir => {
    const cleanPath = dir.replace(/`/g, '').replace(/^\//, '');
    if (cleanPath.includes('/') && !fs.existsSync(cleanPath)) {
      missingDirs.push(cleanPath);
    }
  });

  if (missingDirs.length > 0) {
    console.warn('\n⚠️  WARNING: These paths in .nav.md might be outdated:');
    missingDirs.forEach(dir => console.log(`   - ${dir}`));
  } else {
    console.log('✅ All referenced paths exist\n');
  }

  // Suggest next steps
  if (daysSinceUpdate > WARNING_DAYS || missingDirs.length > 0) {
    console.log('\n💡 Suggested actions:');
    console.log('   1. Review recent structural changes');
    console.log('   2. Update .nav.md if needed');
    console.log('   3. Update the "Last Updated" date');
    console.log('\n📝 Update command: nano .nav.md');
  } else {
    console.log('🎉 .nav.md appears to be up to date!');
  }
}

// Run the check
checkNavFreshness();