#!/usr/bin/env node

// Script para precachar todos los datos por defecto del generador de códigos
// Esto asegura que siempre haya cache hits para los valores predeterminados

const defaultConfigs = [
  {
    name: "QR Code",
    config: {
      barcode_type: "qrcode",
      data: "https://tu-sitio-web.com",
      options: {
        scale: 4,
        gradient_enabled: true,
        gradient_type: "radial",
        gradient_color1: "#2563EB",
        gradient_color2: "#000000",
        ecl: "M"
      }
    }
  },
  {
    name: "Code128",
    config: {
      barcode_type: "code128",
      data: "CODE128 Ejemplo 123",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "PDF417",
    config: {
      barcode_type: "pdf417",
      data: "Texto de ejemplo un poco más largo para PDF417.",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF"
      }
    }
  },
  {
    name: "EAN13",
    config: {
      barcode_type: "ean13",
      data: "978020137962",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "EAN8",
    config: {
      barcode_type: "ean8",
      data: "1234567",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "UPCA",
    config: {
      barcode_type: "upca",
      data: "03600029145",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "UPCE",
    config: {
      barcode_type: "upce",
      data: "012345",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "Code39",
    config: {
      barcode_type: "code39",
      data: "CODE-39-EJEMPLO",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "Code93",
    config: {
      barcode_type: "code93",
      data: "CODE 93 EXAMPLE",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "Codabar",
    config: {
      barcode_type: "codabar",
      data: "A123456789B",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "ITF",
    config: {
      barcode_type: "itf",
      data: "123456789012",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF",
        height: 100,
        includetext: true
      }
    }
  },
  {
    name: "DataMatrix",
    config: {
      barcode_type: "datamatrix",
      data: "DataMatrix ejemplo 123",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF"
      }
    }
  },
  {
    name: "Aztec",
    config: {
      barcode_type: "aztec",
      data: "Texto de ejemplo para Aztec",
      options: {
        scale: 4,
        fgcolor: "#000000",
        bgcolor: "#FFFFFF"
      }
    }
  }
];

async function precacheDefaults() {
  console.log('🚀 Iniciando precaching de datos por defecto...\n');
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3004';
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of defaultConfigs) {
    try {
      console.log(`📝 Precaching ${item.name}...`);
      
      const response = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item.config)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${item.name} - Generado y cacheado`);
        successCount++;
      } else {
        console.log(`❌ ${item.name} - Error HTTP ${response.status}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`💥 ${item.name} - Error: ${error.message}`);
      errorCount++;
    }
    
    // Pequeña pausa para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Resultados del precaching:`);
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📈 Total: ${defaultConfigs.length}`);
  
  if (successCount === defaultConfigs.length) {
    console.log('\n🎉 ¡Todos los datos por defecto han sido precacheados!');
    console.log('💡 Ahora deberías ver Cache Hit Rate > 0% cuando uses valores por defecto.');
  } else {
    console.log('\n⚠️  Algunos elementos no se pudieron precachear. Verifica los logs de errores.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  precacheDefaults().catch(console.error);
}

module.exports = { precacheDefaults, defaultConfigs }; 