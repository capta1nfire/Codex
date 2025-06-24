#!/usr/bin/env node

/**
 * Script de prueba para validar la implementación de zona de exclusión nativa
 * 
 * Genera múltiples QR codes con diferentes configuraciones de logo para validar:
 * 1. Selección dinámica de ECL
 * 2. Exclusión correcta de módulos
 * 3. Escaneabilidad de los códigos generados
 */

import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const API_BASE_URL = 'http://localhost:3004';
const OUTPUT_DIR = path.join(__dirname, '..', 'test-output', 'native-exclusion');
const TEST_LOGO_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAwNjZjYyIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzAiIGZpbGw9IndoaXRlIj5MT0dPPC90ZXh0Pgo8L3N2Zz4=';

// Casos de prueba
const TEST_CASES = [
  {
    name: 'small-logo-5',
    data: 'https://example.com/test/small-logo',
    logoSizeRatio: 0.05,
    expectedEcl: 'L',
    description: 'Logo muy pequeño (5%)'
  },
  {
    name: 'small-logo-10',
    data: 'https://example.com/test/small-logo-10',
    logoSizeRatio: 0.10,
    expectedEcl: 'L',
    description: 'Logo pequeño (10%)'
  },
  {
    name: 'medium-logo-15',
    data: 'https://example.com/test/medium-logo-15',
    logoSizeRatio: 0.15,
    expectedEcl: 'M',
    description: 'Logo mediano (15%)'
  },
  {
    name: 'medium-logo-20',
    data: 'https://example.com/test/medium-logo-20',
    logoSizeRatio: 0.20,
    expectedEcl: 'M',
    description: 'Logo mediano-grande (20%)'
  },
  {
    name: 'large-logo-25',
    data: 'https://example.com/test/large-logo-25',
    logoSizeRatio: 0.25,
    expectedEcl: 'Q',
    description: 'Logo grande (25%)'
  },
  {
    name: 'xlarge-logo-30',
    data: 'https://example.com/test/xlarge-logo-30',
    logoSizeRatio: 0.30,
    expectedEcl: 'H',
    description: 'Logo extra grande (30%)'
  },
  {
    name: 'long-data-small-logo',
    data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    logoSizeRatio: 0.15,
    expectedEcl: 'M',
    description: 'Datos largos con logo pequeño'
  },
  {
    name: 'unicode-data-medium-logo',
    data: '🚀 CÓDEX Project - Sistema de Códigos QR Avanzado 🎯 ¡Funciona con emojis! 🎉',
    logoSizeRatio: 0.20,
    expectedEcl: 'M',
    description: 'Datos Unicode con logo mediano'
  }
];

// Función para generar un QR con exclusión nativa
async function generateQRWithExclusion(testCase) {
  const requestBody = {
    data: testCase.data,
    options: {
      customization: {
        eye_shape: 'rounded_square',
        data_pattern: 'dots',
        colors: {
          foreground: '#000000',
          background: '#FFFFFF'
        },
        logo: {
          data: TEST_LOGO_URL,
          size_percentage: testCase.logoSizeRatio * 100,
          padding: 2,
          shape: 'circle'
        },
        logo_size_ratio: testCase.logoSizeRatio
      }
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/v3/qr/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Generation failed');
    }

    return result.data;
  } catch (error) {
    console.error(`Error generating QR for ${testCase.name}:`, error.message);
    throw error;
  }
}

// Función para generar HTML de visualización
function generateHTML(qrData, testCase) {
  const { paths, styles, metadata, untouchable_zones } = qrData;
  const viewBox = `0 0 ${metadata.total_modules} ${metadata.total_modules}`;
  
  // Construir SVG manualmente
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="400" height="400">
      <rect width="${metadata.total_modules}" height="${metadata.total_modules}" fill="white"/>
      <path d="${paths.data}" fill="${styles.data.fill}" />
      ${paths.eyes.map(eye => `<path d="${eye.path}" fill="${styles.eyes.fill}" />`).join('')}
    </svg>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>${testCase.name} - Native Exclusion Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .qr-container {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .qr-box {
            flex: 1;
            text-align: center;
        }
        .qr-box svg {
            border: 1px solid #ddd;
        }
        .metadata {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
        .exclusion-info {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .success { color: #4caf50; }
        .warning { color: #ff9800; }
        .error { color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${testCase.description}</h1>
        <div class="metadata">
            <strong>Test Case:</strong> ${testCase.name}<br>
            <strong>Data:</strong> ${testCase.data.substring(0, 50)}${testCase.data.length > 50 ? '...' : ''}<br>
            <strong>Logo Size Ratio:</strong> ${(testCase.logoSizeRatio * 100).toFixed(0)}%<br>
            <strong>Expected ECL:</strong> ${testCase.expectedEcl}
        </div>
        
        ${metadata.exclusion_info ? `
        <div class="exclusion-info">
            <h3>Exclusion Information</h3>
            <strong>Selected ECL:</strong> <span class="${metadata.exclusion_info.selected_ecl === testCase.expectedEcl ? 'success' : 'warning'}">${metadata.exclusion_info.selected_ecl}</span><br>
            <strong>Excluded Modules:</strong> ${metadata.exclusion_info.excluded_modules}<br>
            <strong>Affected Codewords:</strong> ${metadata.exclusion_info.affected_codewords}<br>
            <strong>Occlusion Percentage:</strong> ${metadata.exclusion_info.occlusion_percentage.toFixed(2)}%<br>
            <strong>ECL Override:</strong> ${metadata.exclusion_info.ecl_override ? 'Yes' : 'No'}
        </div>
        ` : ''}
        
        <div class="qr-container">
            <div class="qr-box">
                <h3>Generated QR Code</h3>
                ${svgContent}
                <p>QR Version: ${metadata.version}</p>
                <p>Modules: ${metadata.data_modules}×${metadata.data_modules}</p>
            </div>
        </div>
        
        ${untouchable_zones && untouchable_zones.length > 0 ? `
        <div class="metadata">
            <h3>Untouchable Zones</h3>
            <p>Total zones: ${untouchable_zones.length}</p>
            <details>
                <summary>View zones</summary>
                <pre>${JSON.stringify(untouchable_zones, null, 2)}</pre>
            </details>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `;
}

// Función principal
async function main() {
  console.log('🚀 Starting Native Exclusion Zone Tests...\n');
  
  // Crear directorio de salida
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`📊 Testing: ${testCase.name} - ${testCase.description}`);
    
    try {
      // Generar QR
      const qrData = await generateQRWithExclusion(testCase);
      
      // Validar resultado
      const exclusionInfo = qrData.metadata?.exclusion_info;
      const success = exclusionInfo && exclusionInfo.selected_ecl === testCase.expectedEcl;
      
      if (success) {
        console.log(`✅ Success: ECL ${exclusionInfo.selected_ecl} (expected ${testCase.expectedEcl})`);
      } else {
        console.log(`⚠️  Warning: ECL ${exclusionInfo?.selected_ecl || 'N/A'} (expected ${testCase.expectedEcl})`);
      }
      
      console.log(`   - Excluded modules: ${exclusionInfo?.excluded_modules || 0}`);
      console.log(`   - Occlusion: ${exclusionInfo?.occlusion_percentage?.toFixed(2) || 0}%`);
      
      // Guardar HTML
      const html = generateHTML(qrData, testCase);
      const outputPath = path.join(OUTPUT_DIR, `${testCase.name}.html`);
      await fs.writeFile(outputPath, html);
      
      results.push({
        testCase: testCase.name,
        success,
        actualEcl: exclusionInfo?.selected_ecl,
        expectedEcl: testCase.expectedEcl,
        occlusionPercentage: exclusionInfo?.occlusion_percentage,
        excludedModules: exclusionInfo?.excluded_modules
      });
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    console.log(''); // Línea en blanco entre tests
  }
  
  // Generar resumen
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'test-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generar índice HTML
  const indexHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Native Exclusion Zone Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        .success { background: #d4edda; }
        .warning { background: #fff3cd; }
        .error { background: #f8d7da; }
    </style>
</head>
<body>
    <h1>Native Exclusion Zone Test Results</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Total Tests: ${summary.totalTests} | Passed: ${summary.passed} | Failed: ${summary.failed}</p>
    
    <table>
        <tr>
            <th>Test Case</th>
            <th>Status</th>
            <th>Expected ECL</th>
            <th>Actual ECL</th>
            <th>Occlusion %</th>
            <th>Excluded Modules</th>
            <th>View</th>
        </tr>
        ${results.map(r => `
        <tr class="${r.success ? 'success' : (r.error ? 'error' : 'warning')}">
            <td>${r.testCase}</td>
            <td>${r.success ? '✅' : (r.error ? '❌' : '⚠️')}</td>
            <td>${r.expectedEcl || '-'}</td>
            <td>${r.actualEcl || '-'}</td>
            <td>${r.occlusionPercentage ? r.occlusionPercentage.toFixed(2) + '%' : '-'}</td>
            <td>${r.excludedModules || '-'}</td>
            <td>${r.error ? r.error : `<a href="${r.testCase}.html">View</a>`}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>
  `;
  
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
  
  console.log('\n✨ Test completed!');
  console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
  console.log(`🌐 Open ${path.join(OUTPUT_DIR, 'index.html')} to view results`);
}

// Ejecutar el script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { generateQRWithExclusion, TEST_CASES };