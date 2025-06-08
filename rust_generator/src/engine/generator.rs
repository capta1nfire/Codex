// engine/generator.rs - Generador base de códigos QR

use qrcodegen::{QrCode as QrCodeGen, QrCodeEcc};
use super::types::*;
use super::error::{QrError, QrResult};

/// Constantes de configuración
const MIN_SIZE: u32 = 100;
const MAX_SIZE: u32 = 4000;
const MAX_DATA_LENGTH: usize = 2953; // Límite QR v40
const DEFAULT_QUIET_ZONE: usize = 4;

/// Generador principal de códigos QR
pub struct QrGenerator {
    /// Zona de silencio por defecto
    quiet_zone: usize,
}

impl QrGenerator {
    pub fn new() -> Self {
        Self {
            quiet_zone: DEFAULT_QUIET_ZONE,
        }
    }
    
    /// Genera un código QR básico
    pub fn generate_basic(&self, data: &str, size: u32) -> QrResult<QrCode> {
        // Validaciones
        self.validate_input(data, size)?;
        
        // Determinar nivel de corrección de errores por defecto
        let ecl = self.determine_error_correction(data);
        
        // Generar código QR con qrcodegen
        let qr = QrCodeGen::encode_text(data, ecl)
            .map_err(|e| QrError::EncodingError(format!("{:?}", e)))?;
        
        // Convertir a nuestra estructura interna
        let matrix = self.qr_to_matrix(&qr);
        
        Ok(QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
        })
    }
    
    /// Genera con nivel de corrección específico
    pub fn generate_with_ecl(
        &self, 
        data: &str, 
        size: u32, 
        ecl: ErrorCorrectionLevel
    ) -> QrResult<QrCode> {
        self.validate_input(data, size)?;
        
        let qr_ecl = self.map_error_correction(ecl);
        let qr = QrCodeGen::encode_text(data, qr_ecl)
            .map_err(|e| QrError::EncodingError(format!("{:?}", e)))?;
        
        let matrix = self.qr_to_matrix(&qr);
        
        Ok(QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
        })
    }
    
    /// Valida los datos de entrada
    fn validate_input(&self, data: &str, size: u32) -> QrResult<()> {
        // Validar longitud
        if data.is_empty() {
            return Err(QrError::InvalidCharacters);
        }
        
        if data.len() > MAX_DATA_LENGTH {
            return Err(QrError::DataTooLong(data.len(), MAX_DATA_LENGTH));
        }
        
        // Validar tamaño
        if size < MIN_SIZE || size > MAX_SIZE {
            return Err(QrError::InvalidSize(size, MIN_SIZE, MAX_SIZE));
        }
        
        // Validar caracteres (qrcodegen lo hace internamente también)
        // Por ahora confiamos en qrcodegen
        
        Ok(())
    }
    
    /// Determina el nivel de corrección automáticamente
    fn determine_error_correction(&self, data: &str) -> QrCodeEcc {
        // Lógica simple: usar Medium por defecto, High para URLs
        if data.starts_with("http://") || data.starts_with("https://") {
            QrCodeEcc::High
        } else if data.len() > 100 {
            QrCodeEcc::Low  // Datos largos = menos corrección para caber
        } else {
            QrCodeEcc::Medium
        }
    }
    
    /// Mapea nuestro enum a qrcodegen
    fn map_error_correction(&self, ecl: ErrorCorrectionLevel) -> QrCodeEcc {
        match ecl {
            ErrorCorrectionLevel::Low => QrCodeEcc::Low,
            ErrorCorrectionLevel::Medium => QrCodeEcc::Medium,
            ErrorCorrectionLevel::Quartile => QrCodeEcc::Quartile,
            ErrorCorrectionLevel::High => QrCodeEcc::High,
        }
    }
    
    /// Convierte QrCodeGen a nuestra matriz
    fn qr_to_matrix(&self, qr: &QrCodeGen) -> Vec<Vec<bool>> {
        let size = qr.size() as usize;
        let mut matrix = vec![vec![false; size]; size];
        
        for y in 0..size {
            for x in 0..size {
                matrix[y][x] = qr.get_module(x as i32, y as i32);
            }
        }
        
        matrix
    }
    
    /// Calcula el tamaño óptimo del módulo para el tamaño deseado
    pub fn calculate_module_size(&self, qr_size: usize, target_size: u32) -> u32 {
        let qr_with_quiet = qr_size + (self.quiet_zone * 2);
        let module_size = target_size / qr_with_quiet as u32;
        
        // Asegurar al menos 1 pixel por módulo
        module_size.max(1)
    }
}

// Implementación temporal de to_svg para QrCode
impl QrCode {
    pub fn to_svg(&self) -> String {
        let module_size = 10; // Tamaño de cada módulo en píxeles
        let quiet_zone_size = self.quiet_zone * module_size;
        let image_size = (self.size * module_size) + (2 * quiet_zone_size);
        
        let mut svg = format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {} {}" width="{}" height="{}">"#,
            image_size, image_size, image_size, image_size
        );
        
        // Fondo blanco
        svg.push_str(&format!(
            r#"<rect width="{}" height="{}" fill="white"/>"#,
            image_size, image_size
        ));
        
        // Módulos negros
        for (y, row) in self.matrix.iter().enumerate() {
            for (x, &module) in row.iter().enumerate() {
                if module {
                    let x_pos = (x * module_size) + quiet_zone_size;
                    let y_pos = (y * module_size) + quiet_zone_size;
                    
                    svg.push_str(&format!(
                        r#"<rect x="{}" y="{}" width="{}" height="{}" fill="black"/>"#,
                        x_pos, y_pos, module_size, module_size
                    ));
                }
            }
        }
        
        svg.push_str("</svg>");
        svg
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_generation() {
        let generator = QrGenerator::new();
        let result = generator.generate_basic("Hello, World!", 400);
        
        assert!(result.is_ok());
        let qr = result.unwrap();
        assert!(qr.size > 0);
        assert_eq!(qr.matrix.len(), qr.size);
    }
    
    #[test]
    fn test_url_generation() {
        let generator = QrGenerator::new();
        let result = generator.generate_basic("https://example.com", 400);
        
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_empty_data() {
        let generator = QrGenerator::new();
        let result = generator.generate_basic("", 400);
        
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), QrError::InvalidCharacters));
    }
    
    #[test]
    fn test_size_validation() {
        let generator = QrGenerator::new();
        
        // Tamaño muy pequeño
        let result = generator.generate_basic("test", 50);
        assert!(result.is_err());
        
        // Tamaño muy grande
        let result = generator.generate_basic("test", 5000);
        assert!(result.is_err());
    }
}