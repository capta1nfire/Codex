import express, { Request, Response } from 'express';
import cors from 'cors';
// Importar os para obtener información del sistema
import * as os from 'os';
// ¡Ya NO importamos nada de 'rust_generator' aquí!

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001; // Puerto para este servidor Node.js
const RUST_SERVICE_URL = 'http://localhost:3002/generate'; // URL del microservicio Rust

// Mapeo de tipos de códigos de barras
const barcodeTypeMapping: Record<string, string> = {
  'qrcode': 'qr',
  'code128': 'code128',
  'pdf417': 'pdf417',
  'ean13': 'ean13',
  'upca': 'upca',
  'code39': 'code39',
  'datamatrix': 'datamatrix'
};

app.get('/', (req: Request, res: Response) => {
  // Mensaje actualizado para claridad
  res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
});

// Endpoint de salud para monitoreo
app.get('/health', async (req: Request, res: Response) => {
  // Información básica del sistema
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'codex-api-gateway',
    uptime: process.uptime(),
    memoryUsage: {
      total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
      processUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    }
  };

  // Verificar conexión con el servicio Rust
  try {
    const rustHealthCheck = await fetch('http://localhost:3002/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(1000) // Timeout de 1 segundo
    });
    
    if (rustHealthCheck.ok) {
      const rustHealth = await rustHealthCheck.json();
      healthData.dependencies = {
        rust_service: {
          status: 'ok',
          ...rustHealth
        }
      };
    } else {
      healthData.dependencies = {
        rust_service: {
          status: 'degraded',
          error: `HTTP ${rustHealthCheck.status}`
        }
      };
      healthData.status = 'degraded';
    }
  } catch (error) {
    // Si no podemos conectar con el servicio Rust
    healthData.dependencies = {
      rust_service: {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    };
    healthData.status = 'degraded';
  }
  
  // Enviar respuesta con el estado adecuado
  const statusCode = healthData.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthData);
});

// Ruta para generar códigos (ahora llama al servicio Rust vía HTTP)
app.post('/generate', async (req: Request, res: Response) => { // Handler ahora es async por el fetch
  // Usamos 'barcode_type' para coincidir con el struct de Rust
  const { barcode_type, data, options } = req.body;

  // Validación básica
  if (!barcode_type || !data) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros "barcode_type" o "data".' });
  }

  // Convertir el tipo usando el mapeo
  const rustBarcodeType = barcodeTypeMapping[barcode_type] || barcode_type;
  
  console.log(`Node API: Recibido ${barcode_type}. Convertido a ${rustBarcodeType} para Rust.`);
  console.log(`Llamando al servicio Rust en ${RUST_SERVICE_URL}...`);

  try {
    // --- Llamada HTTP al Microservicio Rust ---
    const rustResponse = await fetch(RUST_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode_type: rustBarcodeType, // Usamos el tipo convertido
        data: data,
        options: options || null
      }),
    });
    // ---------------------------------------

    // Verificar si la respuesta HTTP del servicio Rust fue OK
    if (!rustResponse.ok) {
      let errorBody = null;
      try { errorBody = await rustResponse.json(); } catch(e) { errorBody = { error: await rustResponse.text() || 'Error desconocido desde el servicio Rust' }; }
      console.error(`Error desde servicio Rust: Status ${rustResponse.status}`, errorBody);
      
      // Pasar la respuesta de error completa del servicio Rust al frontend
      if (errorBody) {
        return res.status(rustResponse.status).json(errorBody);
      }
      
      throw new Error(errorBody?.error || `El servicio Rust devolvió un error ${rustResponse.status}`);
    }

    // Obtener el JSON de la respuesta exitosa del servicio Rust
    const rustResult = await rustResponse.json();
    console.log("NODE DEBUG: Objeto rustResult recibido:", JSON.stringify(rustResult, null, 2));

    // --- VERIFICACIÓN CORRECTA ---
    // Verificar la estructura esperada: success:true Y svgString presente y es string
    if (rustResult.success && typeof rustResult.svgString === 'string') { // <-- Verifica svgString (camelCase)
      console.log('Node API: Recibida respuesta SVG exitosa desde Rust.');
      // Enviar la respuesta exitosa de vuelta al frontend
      return res.status(200).json({
        success: true,
        svgString: rustResult.svgString // <-- Reenvía svgString (camelCase)
      });
    } else {
      // Si el JSON de Rust no tenía la estructura correcta
      console.error('Respuesta inesperada o inválida desde servicio Rust:', rustResult);
      throw new Error('Respuesta inválida recibida desde el servicio de generación.'); // <-- Este es el error que veías
    }
    // --- FIN VERIFICACIÓN CORRECTA ---

  } catch (error) {
    // Manejar errores
    console.error('Error en el handler /generate de Node:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al contactar servicio de generación.';
    return res.status(500).json({ success: false, error: `Error interno: ${errorMessage}` });
  }
});

// Iniciar el servidor Node.js
app.listen(PORT, () => {
  console.log(`Servidor backend Node.js (API Gateway) escuchando en http://localhost:${PORT}`);
  console.log(`Listo para reenviar peticiones al servicio Rust en ${RUST_SERVICE_URL}`);
});