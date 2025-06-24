#!/usr/bin/env node

import fetch from 'node-fetch';

// Test directo de exclusión nativa
async function testExclusion() {
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

  console.log('Request body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ Success!');
      console.log('Exclusion info:', result.data?.metadata?.exclusion_info);
      console.log('Total modules:', result.data?.metadata?.total_modules);
      console.log('Data modules:', result.data?.metadata?.data_modules);
    } else {
      console.error('\n❌ Error:', response.status);
      console.error('Response:', result);
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testExclusion();