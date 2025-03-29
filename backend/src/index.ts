import express, { Request, Response } from 'express';

// Crear la aplicación Express
const app = express();

// Definir el puerto en el que escuchará el servidor
// Usamos 3001 para evitar conflictos si el frontend usa 3000
const PORT = process.env.PORT || 3001;

// Ruta de prueba simple para la raíz '/'
app.get('/', (req: Request, res: Response) => {
  res.send('¡El backend está funcionando!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});