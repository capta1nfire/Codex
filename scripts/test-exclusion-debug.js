#!/usr/bin/env node

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test detallado de exclusión nativa
async function testExclusionDetailed() {
  const requestBody = {
    data: "https://example.com/test",
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
          size_percentage: 25,
          padding: 2,
          shape: 'circle'
        },
        logo_size_ratio: 0.25
      }
    }
  };

  console.log('🔍 Testing Native Exclusion Zone...\n');
  console.log('Request URL: http://localhost:3004/api/v3/qr/enhanced');
  console.log('Logo size ratio:', requestBody.options.customization.logo_size_ratio);

  try {
    const response = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    // Guardar respuesta completa para análisis
    const outputPath = path.join(__dirname, '..', 'test-output', 'exclusion-debug.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('\n✅ Request successful!');
      console.log('Response saved to:', outputPath);
      
      // Analizar metadata
      const metadata = result.data?.metadata;
      console.log('\n📊 Metadata Analysis:');
      console.log('- Total modules:', metadata?.total_modules);
      console.log('- Data modules:', metadata?.data_modules);
      console.log('- QR Version:', metadata?.version);
      console.log('- Error correction:', metadata?.error_correction);
      console.log('- Generation time:', metadata?.generation_time_ms, 'ms');
      
      // Analizar exclusion_info
      console.log('\n🎯 Exclusion Info:');
      if (metadata?.exclusion_info) {
        console.log('✅ EXCLUSION INFO FOUND!');
        console.log('- Excluded modules:', metadata.exclusion_info.excluded_modules);
        console.log('- Affected codewords:', metadata.exclusion_info.affected_codewords);
        console.log('- Occlusion percentage:', metadata.exclusion_info.occlusion_percentage, '%');
        console.log('- Selected ECL:', metadata.exclusion_info.selected_ecl);
        console.log('- ECL override:', metadata.exclusion_info.ecl_override);
      } else {
        console.log('❌ NO EXCLUSION INFO FOUND');
        console.log('Metadata keys:', Object.keys(metadata || {}));
      }
      
      // Verificar si hay zonas intocables
      if (result.data?.untouchable_zones) {
        console.log('\n🔒 Untouchable zones:', result.data.untouchable_zones.length);
      }
      
    } else {
      console.error('\n❌ Request failed');
      console.error('Status:', response.status);
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testExclusionDetailed();