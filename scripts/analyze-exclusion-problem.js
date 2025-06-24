#!/usr/bin/env node

/**
 * Analyze the QR scanning problem with native exclusion
 * Compare QR with and without exclusion to identify the issue
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeExclusionProblem() {
  console.log('🔬 Analyzing QR Exclusion Scanning Problem\n');
  
  // Test data that should be easily scannable
  const testData = 'HELLO';
  
  console.log('1️⃣ Generating QR WITHOUT logo (baseline)...');
  const baselineRequest = {
    data: testData,
    options: {
      customization: {
        eye_shape: 'square',
        data_pattern: 'square',
        colors: {
          foreground: '#000000',
          background: '#FFFFFF'
        }
      }
    }
  };
  
  const baselineResponse = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(baselineRequest)
  });
  
  const baselineResult = await baselineResponse.json();
  
  if (!baselineResult.success) {
    console.error('❌ Baseline generation failed:', baselineResult.error);
    return;
  }
  
  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('2️⃣ Generating QR WITH logo and exclusion...');
  const exclusionRequest = {
    data: testData,
    options: {
      customization: {
        eye_shape: 'square',
        data_pattern: 'square',
        colors: {
          foreground: '#000000',
          background: '#FFFFFF'
        },
        logo: {
          data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZGMDAwMCIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IndoaXRlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=',
          size_percentage: 20,
          padding: 0,
          shape: 'square'
        },
        logo_size_ratio: 0.20
      }
    }
  };
  
  const exclusionResponse = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exclusionRequest)
  });
  
  const exclusionResult = await exclusionResponse.json();
  
  if (!exclusionResult.success) {
    console.error('❌ Exclusion generation failed:', exclusionResult.error);
    return;
  }
  
  // Compare the paths
  console.log('\n📊 Path Comparison:');
  console.log('Baseline path length:', baselineResult.data?.paths?.data?.length || 0);
  console.log('Exclusion path length:', exclusionResult.data?.paths?.data?.length || 0);
  
  if (exclusionResult.data?.metadata?.exclusion_info) {
    console.log('\n🎯 Exclusion Info:');
    console.log('Excluded modules:', exclusionResult.data.metadata.exclusion_info.excluded_modules);
    console.log('Occlusion %:', exclusionResult.data.metadata.exclusion_info.occlusion_percentage);
    console.log('ECL:', exclusionResult.data.metadata.exclusion_info.selected_ecl);
  }
  
  // Analyze the difference
  const baselinePath = baselineResult.data?.paths?.data || '';
  const exclusionPath = exclusionResult.data?.paths?.data || '';
  
  // Count modules in each path
  const baselineModules = (baselinePath.match(/M\d+\s+\d+/g) || []).length;
  const exclusionModules = (exclusionPath.match(/M\d+\s+\d+/g) || []).length;
  
  console.log('\n📈 Module Count:');
  console.log('Baseline modules:', baselineModules);
  console.log('Exclusion modules:', exclusionModules);
  console.log('Difference:', baselineModules - exclusionModules);
  
  // Create comparison HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>QR Exclusion Analysis</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin: 40px 0;
    }
    .qr-box {
      background: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .qr-box h2 {
      margin: 0 0 20px 0;
      color: #333;
    }
    .stats {
      text-align: left;
      margin-top: 20px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    svg { 
      max-width: 300px; 
      height: auto; 
      border: 1px solid #ddd;
    }
    .debug-info {
      background: #e9ecef;
      padding: 20px;
      border-radius: 5px;
      margin-top: 20px;
      font-family: monospace;
      font-size: 12px;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>QR Exclusion Zone Analysis</h1>
    <p>Testing QR code: <strong>${testData}</strong></p>
    
    <div class="comparison">
      <div class="qr-box">
        <h2>Baseline (No Logo)</h2>
        ${createSVG(baselineResult.data, false)}
        <div class="stats">
          <p><strong>Modules:</strong> ${baselineModules}</p>
          <p><strong>Path length:</strong> ${baselinePath.length} chars</p>
          <p><strong>Should scan:</strong> ✅ YES</p>
        </div>
      </div>
      
      <div class="qr-box">
        <h2>With Logo + Exclusion</h2>
        ${createSVG(exclusionResult.data, true)}
        <div class="stats">
          <p><strong>Modules:</strong> ${exclusionModules}</p>
          <p><strong>Path length:</strong> ${exclusionPath.length} chars</p>
          <p><strong>Excluded:</strong> ${baselineModules - exclusionModules} modules</p>
          ${exclusionResult.data?.metadata?.exclusion_info ? `
            <p><strong>Occlusion:</strong> ${exclusionResult.data.metadata.exclusion_info.occlusion_percentage.toFixed(2)}%</p>
            <p><strong>ECL:</strong> ${exclusionResult.data.metadata.exclusion_info.selected_ecl}</p>
          ` : ''}
        </div>
      </div>
    </div>
    
    ${baselineModules - exclusionModules > 0 ? `
    <div class="warning">
      <h3>⚠️ Potential Issue Detected</h3>
      <p>The exclusion is removing ${baselineModules - exclusionModules} modules from the QR code.</p>
      <p>This may be affecting critical data needed for scanning.</p>
    </div>
    ` : ''}
    
    <div class="error">
      <h3>🔍 Debugging Steps:</h3>
      <ol>
        <li>Test scanning both QR codes with your phone</li>
        <li>If the baseline scans but the exclusion doesn't, the issue is with module removal</li>
        <li>Check if excluded modules contain critical data patterns</li>
        <li>Verify that the ECL compensation is sufficient</li>
      </ol>
    </div>
    
    <div class="debug-info">
      <h3>Debug Information</h3>
      <p><strong>Baseline first 200 chars:</strong><br>${baselinePath.substring(0, 200)}...</p>
      <p><strong>Exclusion first 200 chars:</strong><br>${exclusionPath.substring(0, 200)}...</p>
    </div>
  </div>
</body>
</html>`;
  
  // Save results
  const outputDir = path.join(__dirname, '..', 'test-output', 'exclusion-analysis');
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(
    path.join(outputDir, 'analysis.html'),
    htmlContent
  );
  
  await fs.writeFile(
    path.join(outputDir, 'baseline.json'),
    JSON.stringify(baselineResult, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'exclusion.json'),
    JSON.stringify(exclusionResult, null, 2)
  );
  
  console.log('\n📁 Analysis saved to: test-output/exclusion-analysis/');
  console.log('🌐 Open analysis.html in your browser');
  console.log('\n🤔 Key Question: Does the baseline QR scan but the exclusion QR doesn\'t?');
}

function createSVG(data, hasLogo) {
  if (!data) return '<p>No data</p>';
  
  const size = data.metadata.total_modules;
  const viewBox = `0 0 ${size} ${size}`;
  
  let svg = `<svg width="300" height="300" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  svg += `<path d="${data.paths.data}" fill="black" shape-rendering="crispEdges"/>`;
  
  data.paths.eyes.forEach(eye => {
    svg += `<path d="${eye.path}" fill="black" shape-rendering="crispEdges"/>`;
  });
  
  if (hasLogo && data.overlays?.logo) {
    const logo = data.overlays.logo;
    const logoSize = size * logo.size;
    svg += `<rect x="${logo.x}" y="${logo.y}" width="${logoSize}" height="${logoSize}" fill="white" stroke="red" stroke-width="0.5" opacity="0.8"/>`;
    svg += `<text x="${logo.x + logoSize/2}" y="${logo.y + logoSize/2}" text-anchor="middle" dy="0.3em" font-size="${logoSize/4}" fill="red">LOGO</text>`;
  }
  
  svg += '</svg>';
  return svg;
}

// Run analysis
analyzeExclusionProblem().catch(console.error);