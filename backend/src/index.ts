import express, { Request, Response } from 'express';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

// Crear la aplicación Express
const app = express();
app.use(express.json());

// Definir el puerto en el que escuchará el servidor
// Usamos 3001 para evitar conflictos si el frontend usa 3000
const PORT = process.env.PORT || 3001;

// Ruta de prueba simple para la raíz '/'
app.get('/', (req: Request, res: Response) => {
    res.send('¡El backend está funcionando!');
  });
  
  // Ruta para generar códigos  <---- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ ANTES O ENCIMA
  app.post('/generate', async (req: Request, res: Response) => {
    // 1. Extraer datos del cuerpo de la solicitud
    const { type, data, options } = req.body;
  
    // 2. Validación básica de entrada
    if (!type || !data) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros "type" o "data".' });
    }
  
    // 3. Lógica específica por tipo de código
    if (type === 'qrcode') {
      try {
        const qrDataURL = await QRCode.toDataURL(data, options || {});
        return res.status(200).json({ success: true, imageDataUrl: qrDataURL });
      } catch (err) {
        console.error('Error generando QR:', err);
        return res.status(500).json({ success: false, error: 'Error interno al generar el código QR.' });
      }
    } else if (type === 'code128') {
      try {
        const pngBuffer = await bwipjs.toBuffer({
          bcid: 'code128',        // Barcode id
          text: data,             // Text to encode
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
          ...(options || {}),
        });
        const barcodeDataURL = `data:image/png;base64,${pngBuffer.toString('base64')}`;
        return res.status(200).json({ success: true, imageDataUrl: barcodeDataURL });
      } catch (err) {
        console.error('Error generando Code128:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        return res.status(500).json({ success: false, error: `Error interno al generar Code128: ${errorMessage}` });
      }
    } else if (type === 'pdf417') { // <--- NUEVO BLOQUE PARA PDF417
      try {
        // Generar PDF417 como buffer PNG
        const pngBuffer = await bwipjs.toBuffer({
          bcid: 'pdf417',       // Barcode id
          text: data,           // Text to encode
          scale: 3,             // Scaling factor
          ratio: 3,             // Aspect ratio (height/width module) typical for PDF417
          // PDF417 tiene opciones específicas como 'columns', 'rows', 'eclevel'
          // Puedes añadirlas aquí o pasarlas vía 'options' desde la solicitud
          ...(options || {}),
        });
  
        // Convertir el buffer a Base64 Data URL
        const pdf417DataURL = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  
        // Enviar respuesta exitosa
        return res.status(200).json({ success: true, imageDataUrl: pdf417DataURL });
  
      } catch (err) {
        // Manejar errores durante la generación del PDF417
        console.error('Error generando PDF417:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        // Podrías necesitar parsear errores específicos de bwip-js para PDF417 si son comunes
        return res.status(500).json({ success: false, error: `Error interno al generar PDF417: ${errorMessage}` });
      }
    } else {
      // Si no es un tipo conocido, devolvemos un error
      // TODO: Añadir lógica para otros tipos de códigos de barras aquí
      return res.status(400).json({ success: false, error: `Tipo de código "${type}" aún no soportado.` });
    }
  }); // Fin de app.post('/generate', ...)

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});