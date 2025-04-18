import { AppError, ErrorCode } from './utils/errors';
import logger from './utils/logger';

// Crear un error con el nuevo código
const error = new AppError('Prueba de error', 404, ErrorCode.RESOURCE_NOT_FOUND);

// Imprimir en consola para verificar
console.log('Error creado con código correcto:');
console.log(JSON.stringify(error, null, 2));

// Registrar en el log
logger.error(`${error.errorCode}: ${error.message}`, {
  stack: error.stack,
  context: error.context,
});

console.log('Error registrado en logs correctamente con el código RESOURCE_NOT_FOUND'); 