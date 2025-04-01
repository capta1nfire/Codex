import express, { Request, Response } from 'express';
import cors from 'cors';

const rust_generator = require('rust_generator');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

async function initializeWasm() {
    try {
        // Verifica si hay una función init y llámala si existe
        if (typeof rust_generator.init === 'function') {
            await rust_generator.init();
            console.log('Módulo WASM inicializado explícitamente con init()');
        } else {
            console.log('No se encontró función init, asumiendo inicialización implícita');
        }

        // Inspecciona el módulo para confirmar qué está disponible
        console.log('Claves en rust_generator:', Object.keys(rust_generator));
        if (rust_generator.__wasm) {
            console.log('Claves en rust_generator.__wasm:', Object.keys(rust_generator.__wasm));
        }
        console.log('Tipo de generate_code:', typeof rust_generator.generate_code);

        // Verifica si generate_code está disponible
        if (typeof rust_generator.generate_code !== 'function') {
            throw new Error("La función 'generate_code' no está disponible en el módulo WASM");
        }
    } catch (error) {
        // Tipamos error como Error para acceder a .message
        console.error('¡¡ERROR CRÍTICO al inicializar WASM!!:', (error as Error).message);
        process.exit(1); // Sale del proceso si falla la inicialización
    }
}

async function main() {
    // Inicializa el módulo WASM antes de configurar rutas
    await initializeWasm();

    // Ruta de prueba
    app.get('/', (req: Request, res: Response) => {
        res.send('¡El backend (Node + Rust/WASM) está funcionando!');
    });

    // Ruta para generar códigos
    app.post('/generate', async (req: Request, res: Response) => {
        const { type, data, options } = req.body;

        if (!type || !data) {
            return res.status(400).json({ success: false, error: 'Faltan parámetros "type" o "data"' });
        }

        const width_hint = options?.width || 200;
        const height_hint = options?.height || 200;

        try {
            // Llama a generate_code de forma asíncrona
            const base64_string = await rust_generator.generate_code(type, data, width_hint, height_hint);
            res.status(200).json({
                success: true,
                imageDataUrl: `data:image/png;base64,${base64_string}`
            });
        } catch (error) {
            console.error('Error al generar código con WASM:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            res.status(500).json({
                success: false,
                error: `Error interno al generar código: ${errorMessage}`
            });
        }
    });

    // Inicia el servidor
    app.listen(PORT, () => {
        console.log(`Servidor backend Node.js escuchando en http://localhost:${PORT}`);
        console.log('Núcleo Rust/WASM listo y esperando llamadas');
    });
}

// Ejecuta la función principal
main().catch((error: Error) => {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
});