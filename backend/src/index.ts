import express, { Request, Response } from 'express';
import QRCode from 'qrcode';

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
  app.post('/generate', async (req: Request, res: Response) => { // <--- ¡ESTA ES LA LÍNEA CLAVE QUE FALTABA/ESTABA INCOMPLETA!
      // 1. Extraer datos del cuerpo de la solicitud
      const { type, data, options } = req.body;
  
      // 2. Validación básica de entrada
      if (!type || !data) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros "type" o "data".' });
      }
  
      // 3. Lógica específica por tipo de código
      if (type === 'qrcode') {
        try {
          // Generar QR como Data URL (Base64)
          const qrDataURL = await QRCode.toDataURL(data, options || {});
  
          // Enviar respuesta exitosa con la imagen en Base64
          return res.status(200).json({ success: true, imageDataUrl: qrDataURL });
  
        } catch (err) {
          // Manejar errores durante la generación del QR
          console.error('Error generando QR:', err);
          return res.status(500).json({ success: false, error: 'Error interno al generar el código QR.' });
        }
      } else {
        // Si no es qrcode, por ahora devolvemos un error
        return res.status(400).json({ success: false, error: `Tipo de código "${type}" aún no soportado.` });
      }
  });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});