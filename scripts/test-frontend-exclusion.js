#!/usr/bin/env node

/**
 * Test script to verify native exclusion zone integration from frontend
 * This simulates what the frontend sends to verify the full pipeline works
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simulate frontend request with logo and proper ratio
async function testFrontendExclusion() {
  console.log('🧪 Testing Frontend Native Exclusion Zone Integration\n');
  
  const testCases = [
    {
      name: 'small-logo-test',
      logoSizePercentage: 15,
      expectedExclusion: true
    },
    {
      name: 'medium-logo-test', 
      logoSizePercentage: 25,
      expectedExclusion: true
    },
    {
      name: 'large-logo-test',
      logoSizePercentage: 30,
      expectedExclusion: true
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   Logo size: ${testCase.logoSizePercentage}%`);
    
    // Build request exactly as frontend would
    const requestBody = {
      data: 'https://codex.example.com/test',
      options: {
        customization: {
          eye_shape: 'rounded_square',
          data_pattern: 'dots',
          colors: {
            foreground: '#000000',
            background: '#FFFFFF'
          },
          logo: {
            data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNjZjYyIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IndoaXRlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=',
            size_percentage: testCase.logoSizePercentage,
            padding: 2,
            shape: 'circle'
          },
          // This should be added by the hook
          logo_size_ratio: testCase.logoSizePercentage / 100
        }
      }
    };
    
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
        const hasExclusionInfo = result.data?.metadata?.exclusion_info !== undefined;
        const exclusionData = result.data?.metadata?.exclusion_info;
        
        console.log(`   ✅ Request successful`);
        console.log(`   Exclusion info present: ${hasExclusionInfo ? 'YES' : 'NO'}`);
        
        if (exclusionData) {
          console.log(`   📊 Exclusion details:`);
          console.log(`      - Excluded modules: ${exclusionData.excluded_modules}`);
          console.log(`      - Occlusion: ${exclusionData.occlusion_percentage.toFixed(2)}%`);
          console.log(`      - Selected ECL: ${exclusionData.selected_ecl}`);
        }
        
        results.push({
          testCase: testCase.name,
          success: hasExclusionInfo === testCase.expectedExclusion,
          hasExclusionInfo,
          exclusionData
        });
        
        // Save response for debugging
        const outputDir = path.join(__dirname, '..', 'test-output', 'frontend-exclusion');
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(
          path.join(outputDir, `${testCase.name}.json`),
          JSON.stringify(result, null, 2)
        );
        
      } else {
        console.log(`   ❌ Request failed:`, result.error);
        results.push({
          testCase: testCase.name,
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Network error:`, error.message);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  const passed = results.filter(r => r.success).length;
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${results.length - passed}`);
  
  if (passed === results.length) {
    console.log('\n🎉 All tests passed! Native exclusion zone is working end-to-end!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
  
  // Save summary
  const summaryPath = path.join(__dirname, '..', 'test-output', 'frontend-exclusion', 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    results
  }, null, 2));
  
  console.log(`\nDetailed results saved to: ${summaryPath}`);
}

// Run the test
testFrontendExclusion().catch(console.error);