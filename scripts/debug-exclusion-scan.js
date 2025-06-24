#!/usr/bin/env node

/**
 * Debug script to test QR scanning with native exclusion
 * Generates QRs with different settings to identify scanning issues
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugExclusionScanning() {
  console.log('🔍 Debugging QR Scanning with Native Exclusion\n');
  
  const testCases = [
    {
      name: 'no-logo-baseline',
      description: 'QR without logo (should always scan)',
      hasLogo: false,
      logoSize: 0
    },
    {
      name: 'small-logo-10',
      description: 'Small logo 10% (minimal exclusion)',
      hasLogo: true,
      logoSize: 10
    },
    {
      name: 'medium-logo-20',
      description: 'Medium logo 20% (moderate exclusion)',
      hasLogo: true,
      logoSize: 20
    },
    {
      name: 'large-logo-25',
      description: 'Large logo 25% (high exclusion)',
      hasLogo: true,
      logoSize: 25
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    
    const requestBody = {
      data: 'https://codex.test/scan-verification',
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
    
    // Add logo if needed
    if (testCase.hasLogo) {
      requestBody.options.customization.logo = {
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZGMDAwMCIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IndoaXRlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=',
        size_percentage: testCase.logoSize,
        padding: 0,
        shape: 'square'
      };
      requestBody.options.customization.logo_size_ratio = testCase.logoSize / 100;
    }
    
    try {
      const response = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const exclusionInfo = result.data?.metadata?.exclusion_info;
        
        console.log('   ✅ Generated successfully');
        
        if (exclusionInfo) {
          console.log(`   📊 Exclusion stats:`);
          console.log(`      - Excluded modules: ${exclusionInfo.excluded_modules}`);
          console.log(`      - Occlusion: ${exclusionInfo.occlusion_percentage.toFixed(2)}%`);
          console.log(`      - ECL: ${exclusionInfo.selected_ecl}`);
          console.log(`      - Affected codewords: ${exclusionInfo.affected_codewords}`);
        } else {
          console.log('   ℹ️  No exclusion (no logo)');
        }
        
        // Create HTML for visual inspection
        const svgContent = createSVGFromEnhancedData(result.data, testCase);
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>QR Debug: ${testCase.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    h1 { color: #333; }
    .qr-container {
      margin: 20px 0;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
    }
    .stats {
      text-align: left;
      background: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      color: #ff6b00;
      font-weight: bold;
      margin: 10px 0;
    }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${testCase.name}</h1>
    <p>${testCase.description}</p>
    
    <div class="qr-container">
      ${svgContent}
    </div>
    
    ${exclusionInfo ? `
    <div class="stats">
      <h3>Exclusion Statistics:</h3>
      <p><strong>Excluded Modules:</strong> ${exclusionInfo.excluded_modules}</p>
      <p><strong>Occlusion Rate:</strong> ${exclusionInfo.occlusion_percentage.toFixed(2)}%</p>
      <p><strong>Error Correction:</strong> ${exclusionInfo.selected_ecl}</p>
      <p><strong>Affected Codewords:</strong> ${exclusionInfo.affected_codewords}</p>
    </div>
    ` : '<p>No exclusion applied (no logo)</p>'}
    
    <div class="warning">
      ⚠️ Test this QR with multiple scanner apps
    </div>
    
    <p>Data encoded: ${requestBody.data}</p>
  </div>
</body>
</html>`;
        
        // Save files
        const outputDir = path.join(__dirname, '..', 'test-output', 'debug-exclusion');
        await fs.mkdir(outputDir, { recursive: true });
        
        await fs.writeFile(
          path.join(outputDir, `${testCase.name}.html`),
          htmlContent
        );
        
        await fs.writeFile(
          path.join(outputDir, `${testCase.name}.json`),
          JSON.stringify(result, null, 2)
        );
        
      } else {
        console.log('   ❌ Generation failed:', result.error);
      }
      
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }
  
  console.log('\n📁 Debug files saved to: test-output/debug-exclusion/');
  console.log('🔍 Open the HTML files and test scanning with your phone');
  console.log('\n⚠️  Important checks:');
  console.log('   1. Does the baseline (no logo) scan correctly?');
  console.log('   2. At what logo size does scanning fail?');
  console.log('   3. Are there visual artifacts in the QR pattern?');
}

function createSVGFromEnhancedData(data, testCase) {
  if (!data) return '<p>No data</p>';
  
  const totalSize = data.metadata.total_modules;
  const viewBox = `0 0 ${totalSize} ${totalSize}`;
  
  // Create basic SVG
  let svg = `<svg width="300" height="300" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;
  
  // White background
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="white"/>`;
  
  // Data path
  svg += `<path d="${data.paths.data}" fill="black" shape-rendering="crispEdges"/>`;
  
  // Eye paths
  data.paths.eyes.forEach(eye => {
    svg += `<path d="${eye.path}" fill="black" shape-rendering="crispEdges"/>`;
  });
  
  // Add logo if present (for visual reference)
  if (testCase.hasLogo && data.overlays?.logo) {
    const logo = data.overlays.logo;
    const logoSize = totalSize * logo.size;
    const logoX = logo.x;
    const logoY = logo.y;
    
    // Logo background (white)
    svg += `<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" fill="white" opacity="1"/>`;
    
    // Logo placeholder
    svg += `<rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" fill="#ff0000" opacity="0.3"/>`;
    svg += `<text x="${logoX + logoSize/2}" y="${logoY + logoSize/2}" text-anchor="middle" dy="0.3em" font-size="${logoSize/3}" fill="black">LOGO</text>`;
  }
  
  svg += '</svg>';
  
  return svg;
}

// Run debug
debugExclusionScanning().catch(console.error);