#!/usr/bin/env node

/**
 * Script para limpiar el caché de API Keys expiradas
 * Uso: npm run cleanup-cache
 */

import { apiKeyCache } from '../lib/apiKeyCache.js';
import logger from '../utils/logger.js';

async function cleanupCache() {
  try {
    logger.info('🧹 Iniciando limpieza de caché de API Keys...');
    
    // Obtener estadísticas antes de la limpieza
    const statsBefore = await apiKeyCache.getStats();
    logger.info(`📊 Estadísticas antes de limpieza:`, statsBefore);
    
    // Ejecutar limpieza
    await apiKeyCache.cleanup();
    
    // Obtener estadísticas después de la limpieza
    const statsAfter = await apiKeyCache.getStats();
    logger.info(`📊 Estadísticas después de limpieza:`, statsAfter);
    
    const cleaned = statsBefore.totalEntries - statsAfter.totalEntries;
    logger.info(`✅ Limpieza completada. Entradas eliminadas: ${cleaned}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante la limpieza del caché:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupCache();
} 