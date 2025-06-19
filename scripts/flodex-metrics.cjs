#!/usr/bin/env node

/**
 * FLODEX Metrics Dashboard v1.0
 * 
 * Purpose: Track and measure the effectiveness of FLODEX architecture
 * Author: CODEX Development Team
 * Date: June 19, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Metric storage file
const METRICS_FILE = path.join(__dirname, '..', '.flodex-metrics.json');

class FLODEXMetrics {
  constructor() {
    this.metrics = null;
    this.startTime = Date.now();
  }

  async init() {
    try {
      const data = await fs.readFile(METRICS_FILE, 'utf8');
      this.metrics = JSON.parse(data);
    } catch (error) {
      // Initialize with empty metrics if file doesn't exist
      this.metrics = {
        firstRun: new Date().toISOString(),
        lastRun: new Date().toISOString(),
        runs: [],
        aggregates: {
          avgDocumentationRatio: 0,
          avgServiceIndependence: 0,
          totalCrossServiceFeatures: 0,
          complianceTrend: []
        }
      };
    }
  }

  async save() {
    await fs.writeFile(METRICS_FILE, JSON.stringify(this.metrics, null, 2));
  }

  // Metric 1: Documentation to Code Ratio
  async measureDocumentationRatio() {
    const services = ['backend', 'frontend', 'rust_generator'];
    const results = {};

    for (const service of services) {
      try {
        // Count lines of code (excluding node_modules, tests)
        const { stdout: codeLines } = await execPromise(
          `find ${service} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.rs" \\) | grep -v node_modules | grep -v test | xargs wc -l | tail -1 | awk '{print $1}'`
        );

        // Count lines of documentation
        const { stdout: docLines } = await execPromise(
          `find ${service} -name "*.md" | grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}'`
        );

        const code = parseInt(codeLines) || 0;
        const docs = parseInt(docLines) || 0;
        const ratio = code > 0 ? ((docs / code) * 100).toFixed(2) : 0;

        results[service] = {
          codeLines: code,
          docLines: docs,
          ratio: parseFloat(ratio)
        };
      } catch (error) {
        results[service] = { codeLines: 0, docLines: 0, ratio: 0 };
      }
    }

    return results;
  }

  // Metric 2: Service Independence Score
  async measureServiceIndependence() {
    const services = ['backend', 'frontend', 'rust_generator'];
    const dependencies = {};

    for (const service of services) {
      const crossImports = [];
      
      // Check for cross-service imports
      for (const otherService of services) {
        if (service !== otherService) {
          try {
            const { stdout } = await execPromise(
              `grep -r "from.*${otherService}" ${service} --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | wc -l`
            );
            const count = parseInt(stdout) || 0;
            if (count > 0) {
              crossImports.push({ from: otherService, count });
            }
          } catch (error) {
            // No cross imports found
          }
        }
      }

      dependencies[service] = {
        crossImports,
        independenceScore: crossImports.length === 0 ? 100 : 0
      };
    }

    return dependencies;
  }

  // Metric 3: Cross-Service Feature Tracking
  async measureCrossServiceFeatures() {
    try {
      const featuresDir = path.join('docs', 'flodex', 'features');
      const features = [];
      
      try {
        const files = await fs.readdir(featuresDir);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(featuresDir, file), 'utf8');
            const lines = content.split('\n');
            
            // Extract feature info from markdown
            const titleLine = lines.find(line => line.startsWith('# Feature:'));
            const title = titleLine ? titleLine.replace('# Feature:', '').trim() : file;
            
            // Count affected services
            const affectedServices = [];
            if (content.includes('Backend Changes:')) affectedServices.push('backend');
            if (content.includes('Frontend Changes:')) affectedServices.push('frontend');
            if (content.includes('Rust Generator Changes:')) affectedServices.push('rust_generator');
            
            features.push({
              name: title,
              file: file,
              affectedServices,
              serviceCount: affectedServices.length
            });
          }
        }
      } catch (error) {
        // Features directory doesn't exist yet
      }
      
      return {
        total: features.length,
        features,
        avgServicesPerFeature: features.length > 0 
          ? (features.reduce((sum, f) => sum + f.serviceCount, 0) / features.length).toFixed(2)
          : 0
      };
    } catch (error) {
      return { total: 0, features: [], avgServicesPerFeature: 0 };
    }
  }

  // Metric 4: FLODEX Compliance Score
  async measureCompliance() {
    try {
      const { stdout } = await execPromise('./scripts/validate-flodex.sh');
      
      // Parse the output to extract pass/warn/fail counts
      const passMatch = stdout.match(/Passed[^:]*:\s*(\d+)/);
      const warnMatch = stdout.match(/Warnings[^:]*:\s*(\d+)/);
      const failMatch = stdout.match(/Errors[^:]*:\s*(\d+)/);
      
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const warnings = warnMatch ? parseInt(warnMatch[1]) : 0;
      const errors = failMatch ? parseInt(failMatch[1]) : 0;
      
      const total = passed + warnings + errors;
      const score = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
      
      return {
        passed,
        warnings,
        errors,
        total,
        complianceScore: parseFloat(score)
      };
    } catch (error) {
      return { passed: 0, warnings: 0, errors: 0, total: 0, complianceScore: 0 };
    }
  }

  // Metric 5: Development Velocity
  async measureVelocity() {
    try {
      // Get commit count in last 7 days
      const { stdout: commitCount } = await execPromise(
        'git log --oneline --since="7 days ago" | wc -l'
      );
      
      // Get changed files in last 7 days
      const { stdout: changedFiles } = await execPromise(
        'git log --since="7 days ago" --name-only --pretty=format: | sort | uniq | grep -v "^$" | wc -l'
      );
      
      // Count changes by service
      const services = ['backend', 'frontend', 'rust_generator'];
      const changesByService = {};
      
      for (const service of services) {
        const { stdout } = await execPromise(
          `git log --since="7 days ago" --name-only --pretty=format: | grep "^${service}/" | sort | uniq | wc -l`
        );
        changesByService[service] = parseInt(stdout) || 0;
      }
      
      return {
        commitsLast7Days: parseInt(commitCount) || 0,
        filesChangedLast7Days: parseInt(changedFiles) || 0,
        changesByService,
        crossServiceChanges: Object.values(changesByService).filter(v => v > 0).length > 1
      };
    } catch (error) {
      return {
        commitsLast7Days: 0,
        filesChangedLast7Days: 0,
        changesByService: {},
        crossServiceChanges: false
      };
    }
  }

  // Display methods
  displayHeader() {
    console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.blue}${' '.repeat(25)}FLODEX Metrics Dashboard v1.0${' '.repeat(26)}${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
    console.log();
  }

  displayMetric(title, value, unit = '', status = 'neutral') {
    const statusColor = status === 'good' ? colors.green : 
                       status === 'warning' ? colors.yellow : 
                       status === 'bad' ? colors.red : colors.cyan;
    
    console.log(`${colors.bright}${title}:${colors.reset} ${statusColor}${value}${unit}${colors.reset}`);
  }

  displaySection(title) {
    console.log();
    console.log(`${colors.blue}${title}${colors.reset}`);
    console.log(`${colors.gray}${'-'.repeat(title.length)}${colors.reset}`);
  }

  displayDocumentationRatio(data) {
    this.displaySection('📚 Documentation to Code Ratio');
    
    let totalRatio = 0;
    let serviceCount = 0;
    
    for (const [service, metrics] of Object.entries(data)) {
      const status = metrics.ratio >= 10 ? 'good' : metrics.ratio >= 5 ? 'warning' : 'bad';
      console.log(`  ${service}: ${this.getStatusIcon(status)} ${metrics.ratio}% (${metrics.docLines} docs / ${metrics.codeLines} code)`);
      totalRatio += metrics.ratio;
      serviceCount++;
    }
    
    const avgRatio = serviceCount > 0 ? (totalRatio / serviceCount).toFixed(2) : 0;
    const avgStatus = avgRatio >= 10 ? 'good' : avgRatio >= 5 ? 'warning' : 'bad';
    console.log();
    this.displayMetric('  Average Ratio', avgRatio, '%', avgStatus);
  }

  displayIndependence(data) {
    this.displaySection('🏛️ Service Independence Score');
    
    let totalScore = 0;
    let serviceCount = 0;
    
    for (const [service, metrics] of Object.entries(data)) {
      const icon = metrics.independenceScore === 100 ? '✅' : '❌';
      console.log(`  ${service}: ${icon} ${metrics.independenceScore}%`);
      
      if (metrics.crossImports.length > 0) {
        for (const imp of metrics.crossImports) {
          console.log(`    ${colors.red}⚠️  Imports from ${imp.from}: ${imp.count} times${colors.reset}`);
        }
      }
      
      totalScore += metrics.independenceScore;
      serviceCount++;
    }
    
    const avgScore = serviceCount > 0 ? (totalScore / serviceCount).toFixed(2) : 0;
    const avgStatus = avgScore === 100 ? 'good' : avgScore >= 50 ? 'warning' : 'bad';
    console.log();
    this.displayMetric('  Average Independence', avgScore, '%', avgStatus);
  }

  displayCrossServiceFeatures(data) {
    this.displaySection('🌉 Cross-Service Features');
    
    this.displayMetric('  Total Features', data.total);
    this.displayMetric('  Avg Services per Feature', data.avgServicesPerFeature);
    
    if (data.features.length > 0) {
      console.log('\n  Recent Features:');
      data.features.slice(0, 3).forEach(feature => {
        console.log(`    • ${feature.name} (${feature.serviceCount} services)`);
      });
    }
  }

  displayCompliance(data) {
    this.displaySection('✅ FLODEX Compliance Score');
    
    console.log(`  ${colors.green}Passed: ${data.passed}${colors.reset}`);
    console.log(`  ${colors.yellow}Warnings: ${data.warnings}${colors.reset}`);
    console.log(`  ${colors.red}Errors: ${data.errors}${colors.reset}`);
    console.log();
    
    const status = data.complianceScore >= 90 ? 'good' : 
                   data.complianceScore >= 70 ? 'warning' : 'bad';
    this.displayMetric('  Compliance Score', data.complianceScore, '%', status);
  }

  displayVelocity(data) {
    this.displaySection('🚀 Development Velocity (Last 7 Days)');
    
    this.displayMetric('  Commits', data.commitsLast7Days);
    this.displayMetric('  Files Changed', data.filesChangedLast7Days);
    
    console.log('\n  Changes by Service:');
    for (const [service, count] of Object.entries(data.changesByService)) {
      console.log(`    ${service}: ${count} files`);
    }
    
    const crossServiceIcon = data.crossServiceChanges ? '⚠️' : '✅';
    console.log(`\n  Cross-Service Changes: ${crossServiceIcon} ${data.crossServiceChanges ? 'Yes' : 'No'}`);
  }

  displayTrends() {
    if (this.metrics.runs.length > 1) {
      this.displaySection('📈 Trends');
      
      const current = this.metrics.runs[this.metrics.runs.length - 1];
      const previous = this.metrics.runs[this.metrics.runs.length - 2];
      
      // Compare compliance scores
      const complianceDiff = current.compliance.complianceScore - previous.compliance.complianceScore;
      const complianceTrend = complianceDiff > 0 ? '↑' : complianceDiff < 0 ? '↓' : '→';
      const complianceColor = complianceDiff > 0 ? colors.green : complianceDiff < 0 ? colors.red : colors.gray;
      
      console.log(`  Compliance: ${complianceColor}${complianceTrend} ${complianceDiff > 0 ? '+' : ''}${complianceDiff.toFixed(2)}%${colors.reset}`);
      
      // Show last 5 compliance scores
      const recentScores = this.metrics.runs.slice(-5).map(r => r.compliance.complianceScore);
      console.log(`  Recent: ${recentScores.map(s => s.toFixed(0)).join(' → ')}`);
    }
  }

  getStatusIcon(status) {
    return status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  }

  async run() {
    await this.init();
    
    this.displayHeader();
    console.log(`${colors.gray}Analyzing FLODEX architecture metrics...${colors.reset}\n`);
    
    // Collect all metrics
    const docRatio = await this.measureDocumentationRatio();
    const independence = await this.measureServiceIndependence();
    const features = await this.measureCrossServiceFeatures();
    const compliance = await this.measureCompliance();
    const velocity = await this.measureVelocity();
    
    // Display results
    this.displayDocumentationRatio(docRatio);
    this.displayIndependence(independence);
    this.displayCrossServiceFeatures(features);
    this.displayCompliance(compliance);
    this.displayVelocity(velocity);
    
    // Store metrics run
    const runData = {
      timestamp: new Date().toISOString(),
      docRatio,
      independence,
      features,
      compliance,
      velocity
    };
    
    this.metrics.runs.push(runData);
    this.metrics.lastRun = runData.timestamp;
    
    // Keep only last 30 runs
    if (this.metrics.runs.length > 30) {
      this.metrics.runs = this.metrics.runs.slice(-30);
    }
    
    // Update aggregates
    const avgDocRatio = this.metrics.runs.reduce((sum, r) => {
      const values = Object.values(r.docRatio).map(v => v.ratio);
      return sum + (values.reduce((s, v) => s + v, 0) / values.length);
    }, 0) / this.metrics.runs.length;
    
    const avgIndependence = this.metrics.runs.reduce((sum, r) => {
      const values = Object.values(r.independence).map(v => v.independenceScore);
      return sum + (values.reduce((s, v) => s + v, 0) / values.length);
    }, 0) / this.metrics.runs.length;
    
    this.metrics.aggregates = {
      avgDocumentationRatio: avgDocRatio.toFixed(2),
      avgServiceIndependence: avgIndependence.toFixed(2),
      totalCrossServiceFeatures: features.total,
      complianceTrend: this.metrics.runs.slice(-10).map(r => r.compliance.complianceScore)
    };
    
    // Display trends if we have history
    this.displayTrends();
    
    // Summary
    this.displaySection('📊 Summary');
    const executionTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`  Execution Time: ${executionTime}s`);
    console.log(`  Data Points Collected: ${this.metrics.runs.length}`);
    
    // Save metrics
    await this.save();
    
    console.log(`\n${colors.gray}Metrics saved to ${METRICS_FILE}${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
  }
}

// Main execution
if (require.main === module) {
  const metrics = new FLODEXMetrics();
  metrics.run().catch(error => {
    console.error(`${colors.red}Error running metrics:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = FLODEXMetrics;