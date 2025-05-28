import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio base para almacenar avatares (relativo a la raíz del proyecto)
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/avatars');

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Lista de avatares predeterminados con nombres de robot
export const DEFAULT_AVATARS = [
  'Vector', // Antes default1
  'Cygnus', // Antes default2
  'Apex', // Antes default3
  'Rivet', // Antes default4
  'Socket', // Antes default5
  'Bolt', // Antes default6
];

export class AvatarService {
  /**
   * Procesa y guarda una imagen de avatar
   * @param file Archivo de imagen subido
   * @returns URL relativa del avatar guardado
   */
  async saveAvatar(file: Express.Multer.File): Promise<string> {
    try {
      // Generar nombre único para el archivo
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      const outputPath = path.join(UPLOADS_DIR, filename);

      // Procesar y optimizar la imagen con sharp
      let sharpInstance = sharp(file.buffer).resize(200, 200);

      // Mantener PNG si es PNG, convertir otros a JPEG
      if (file.mimetype === 'image/png') {
        sharpInstance = sharpInstance.png({ quality: 90, compressionLevel: 6 }); // Mantener PNG, ajustar compresión si es necesario
      } else {
        sharpInstance = sharpInstance.jpeg({ quality: 90 }); // Convertir a JPEG (JPGs, etc.)
      }

      await sharpInstance.toFile(outputPath);

      // Devolver la ruta relativa
      return `/uploads/avatars/${filename}`;
    } catch (error) {
      console.error('Error al procesar el avatar:', error);
      throw new Error('No se pudo procesar la imagen de avatar');
    }
  }

  /**
   * Elimina un avatar existente
   * @param avatarUrl URL del avatar a eliminar
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Solo eliminar si es un avatar personalizado (no predeterminado)
      if (avatarUrl && !avatarUrl.includes('default')) {
        const filePath = path.join(process.cwd(), avatarUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error al eliminar el avatar:', error);
      // No lanzar error, simplemente registrar
    }
  }

  /**
   * Obtiene la URL de un avatar predeterminado
   * @param avatarType Nombre del robot (tipo de avatar)
   * @returns URL del avatar predeterminado
   */
  getDefaultAvatarUrl(avatarType: string): string {
    // Validar que es un nombre de robot válido
    if (DEFAULT_AVATARS.includes(avatarType)) {
      // Necesitamos mapear el nombre del robot al nombre del archivo original
      // Esto asume que los nombres de robot corresponden en orden a default1.png, default2.png, etc.
      const index = DEFAULT_AVATARS.indexOf(avatarType);
      const filename = `default${index + 1}.png`;
      return `/static/avatars/${filename}`;
    }
    // Devolver el primer avatar predeterminado (Vector) si no es válido
    return `/static/avatars/default1.png`;
  }
}

export const avatarService = new AvatarService();
