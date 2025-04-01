import express, { Request, Response } from 'express';
import cors from 'cors';
// ¡Ya NO importamos nada de 'rust_generator' aquí!

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001; // Puerto para este servidor Node.js
const RUST_SERVICE_URL = 'http://localhost:3002/generate'; // URL del microservicio Rust

app.get('/', (req: Request, res: Response) => {
  // Mensaje actualizado para claridad
  res.send('¡API Gateway Node.js funcionando! Llamando a Rust en puerto 3002 para generar.');
});

// Ruta para generar códigos (ahora llama al servicio Rust vía HTTP)
app.post('/generate', async (req: Request, res: Response) => { // Handler ahora es async por el fetch
  // Usamos 'barcode_type' para coincidir con el struct de Rust
  const { barcode_type, data, options } = req.body;

  // Validación básica
  if (!barcode_type || !data) {
    return res.status(400).json({ success: false, error: 'Faltan parámetros "barcode_type" o "data".' });
  }

  console.log(`Node API: Recibido ${barcode_type}. Llamando al servicio Rust en ${RUST_SERVICE_URL}...`);

  try {
    // --- Llamada HTTP al Microservicio Rust ---
    const rustResponse = await fetch(RUST_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode_type: barcode_type,
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