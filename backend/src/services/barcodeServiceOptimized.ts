// Importar el nuevo cliente HTTP con pooling
import { fetchWithPool } from '../lib/httpClient.js';

// Reemplazar fetch nativo con fetchWithPool en las líneas:
// - Línea 132: const rustResponse = await fetchWithPool(rustUrl, {
// - Línea 261: const rustResponse = await fetchWithPool(`${config.RUST_SERVICE_URL.replace('/generate', '/batch')}`, {
