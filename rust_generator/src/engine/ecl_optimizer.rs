// engine/ecl_optimizer.rs - Optimizador dinámico de nivel de corrección de errores

use qrcodegen::{QrCode as QrCodeGen, QrCodeEcc};
use super::error::{QrError, QrResult};
use super::geometry::{LogoExclusionZone, count_excludable_modules};
use super::zones::{calculate_untouchable_zones, is_module_untouchable};
use super::types::ErrorCorrectionLevel;

/// Información sobre la capacidad de corrección de errores
#[derive(Debug, Clone)]
pub struct EclCapacity {
    /// Nivel de corrección
    pub level: ErrorCorrectionLevel,
    /// Porcentaje de codewords que puede recuperar
    pub recovery_percentage: f32,
    /// Número total de codewords de datos
    pub data_codewords: usize,
    /// Número total de codewords de corrección
    pub ecc_codewords: usize,
    /// Número total de codewords
    pub total_codewords: usize,
}

/// Resultado del análisis de oclusión
#[derive(Debug, Clone)]
pub struct OcclusionAnalysis {
    /// Número de módulos ocluidos
    pub occluded_modules: usize,
    /// Número de codewords afectados
    pub affected_codewords: usize,
    /// Porcentaje de oclusión
    pub occlusion_percentage: f32,
    /// ECL mínimo recomendado
    pub recommended_ecl: ErrorCorrectionLevel,
    /// Versión del QR analizado
    pub qr_version: u8,
}

/// Optimizador de ECL basado en zona de exclusión
pub struct EclOptimizer {
    /// Margen de seguridad (porcentaje adicional)
    safety_margin: f32,
}

impl EclOptimizer {
    /// Crea un nuevo optimizador con margen de seguridad por defecto (5%)
    pub fn new() -> Self {
        Self {
            safety_margin: 0.05,
        }
    }
    
    /// Crea un optimizador con margen de seguridad personalizado
    pub fn with_safety_margin(safety_margin: f32) -> Self {
        Self { safety_margin }
    }
    
    /// Determina el ECL óptimo para un logo de tamaño dado
    pub fn determine_optimal_ecl(
        &self,
        data: &str,
        logo_size_ratio: f32,
        ecl_override: Option<ErrorCorrectionLevel>,
    ) -> QrResult<(ErrorCorrectionLevel, OcclusionAnalysis)> {
        // Si hay override, usarlo directamente
        if let Some(ecl) = ecl_override {
            let analysis = self.analyze_with_ecl(data, logo_size_ratio, ecl)?;
            return Ok((ecl, analysis));
        }
        
        // Empezar con ECL Medium como punto de partida
        let mut current_ecl = ErrorCorrectionLevel::Medium;
        let mut iterations = 0;
        const MAX_ITERATIONS: u8 = 3;
        
        loop {
            iterations += 1;
            if iterations > MAX_ITERATIONS {
                return Err(QrError::EncodingError(
                    "No se pudo estabilizar el ECL después de 3 iteraciones".into()
                ));
            }
            
            // Analizar con el ECL actual
            let analysis = self.analyze_with_ecl(data, logo_size_ratio, current_ecl)?;
            
            // Si el ECL recomendado es el mismo que el actual, hemos convergido
            if analysis.recommended_ecl == current_ecl {
                return Ok((current_ecl, analysis));
            }
            
            // Actualizar ECL y continuar
            current_ecl = analysis.recommended_ecl;
        }
    }
    
    /// Analiza la oclusión con un ECL específico
    fn analyze_with_ecl(
        &self,
        data: &str,
        logo_size_ratio: f32,
        ecl: ErrorCorrectionLevel,
    ) -> QrResult<OcclusionAnalysis> {
        // Generar QR con el ECL dado
        let qr_ecl = map_error_correction(ecl);
        let qr = QrCodeGen::encode_text(data, qr_ecl)
            .map_err(|e| QrError::EncodingError(format!("{:?}", e)))?;
        
        let version = qr.version().value();
        let size = qr.size() as u16;
        
        // Calcular zonas intocables
        let untouchable_zones = calculate_untouchable_zones(version);
        
        // Crear zona de exclusión del logo
        let center = size as f64 / 2.0;
        let logo_size = (size as f64 * logo_size_ratio as f64) / 2.0;
        let logo_zone = LogoExclusionZone::new(
            super::geometry::LogoShape::Square,
            center,
            center,
            logo_size,
        );
        
        // Contar módulos excluibles
        let excludable_modules = count_excludable_modules(version, &logo_zone, &untouchable_zones);
        
        // Calcular codewords afectados
        let modules_per_codeword = 8; // Cada codeword son 8 bits/módulos
        let affected_codewords = (excludable_modules + modules_per_codeword - 1) / modules_per_codeword;
        
        // Obtener capacidad del ECL
        let capacity = get_ecl_capacity(version, ecl)?;
        
        // Calcular porcentaje de oclusión
        let occlusion_percentage = (affected_codewords as f32 / capacity.total_codewords as f32) * 100.0;
        
        // Determinar ECL recomendado con margen de seguridad
        let required_percentage = occlusion_percentage + (self.safety_margin * 100.0);
        let recommended_ecl = select_ecl_for_percentage(required_percentage);
        
        Ok(OcclusionAnalysis {
            occluded_modules: excludable_modules,
            affected_codewords,
            occlusion_percentage,
            recommended_ecl,
            qr_version: version,
        })
    }
}

/// Obtiene la capacidad de corrección para una versión y ECL específicos
fn get_ecl_capacity(version: u8, ecl: ErrorCorrectionLevel) -> QrResult<EclCapacity> {
    // Tabla simplificada de capacidades
    // En producción, esto debería venir de la especificación completa ISO/IEC 18004
    let (data_codewords, total_codewords) = match (version, ecl) {
        // Version 1
        (1, ErrorCorrectionLevel::Low) => (19, 26),
        (1, ErrorCorrectionLevel::Medium) => (16, 26),
        (1, ErrorCorrectionLevel::Quartile) => (13, 26),
        (1, ErrorCorrectionLevel::High) => (9, 26),
        
        // Version 2
        (2, ErrorCorrectionLevel::Low) => (34, 44),
        (2, ErrorCorrectionLevel::Medium) => (28, 44),
        (2, ErrorCorrectionLevel::Quartile) => (22, 44),
        (2, ErrorCorrectionLevel::High) => (16, 44),
        
        // Version 5
        (5, ErrorCorrectionLevel::Low) => (106, 134),
        (5, ErrorCorrectionLevel::Medium) => (84, 134),
        (5, ErrorCorrectionLevel::Quartile) => (60, 134),
        (5, ErrorCorrectionLevel::High) => (46, 134),
        
        // Version 10
        (10, ErrorCorrectionLevel::Low) => (293, 346),
        (10, ErrorCorrectionLevel::Medium) => (231, 346),
        (10, ErrorCorrectionLevel::Quartile) => (163, 346),
        (10, ErrorCorrectionLevel::High) => (125, 346),
        
        // Para otras versiones, usar aproximación
        _ => {
            let base_capacity = 4 + version as usize * 16;
            match ecl {
                ErrorCorrectionLevel::Low => ((base_capacity as f32 * 0.85) as usize, base_capacity),
                ErrorCorrectionLevel::Medium => ((base_capacity as f32 * 0.70) as usize, base_capacity),
                ErrorCorrectionLevel::Quartile => ((base_capacity as f32 * 0.50) as usize, base_capacity),
                ErrorCorrectionLevel::High => ((base_capacity as f32 * 0.35) as usize, base_capacity),
            }
        }
    };
    
    let ecc_codewords = total_codewords - data_codewords;
    let recovery_percentage = match ecl {
        ErrorCorrectionLevel::Low => 7.0,
        ErrorCorrectionLevel::Medium => 15.0,
        ErrorCorrectionLevel::Quartile => 25.0,
        ErrorCorrectionLevel::High => 30.0,
    };
    
    Ok(EclCapacity {
        level: ecl,
        recovery_percentage,
        data_codewords,
        ecc_codewords,
        total_codewords,
    })
}

/// Selecciona el ECL mínimo para un porcentaje de oclusión dado
fn select_ecl_for_percentage(percentage: f32) -> ErrorCorrectionLevel {
    if percentage <= 7.0 {
        ErrorCorrectionLevel::Low
    } else if percentage <= 15.0 {
        ErrorCorrectionLevel::Medium
    } else if percentage <= 25.0 {
        ErrorCorrectionLevel::Quartile
    } else {
        ErrorCorrectionLevel::High
    }
}

/// Mapea nuestro enum a qrcodegen
fn map_error_correction(ecl: ErrorCorrectionLevel) -> QrCodeEcc {
    match ecl {
        ErrorCorrectionLevel::Low => QrCodeEcc::Low,
        ErrorCorrectionLevel::Medium => QrCodeEcc::Medium,
        ErrorCorrectionLevel::Quartile => QrCodeEcc::Quartile,
        ErrorCorrectionLevel::High => QrCodeEcc::High,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_ecl_selection() {
        assert_eq!(select_ecl_for_percentage(5.0), ErrorCorrectionLevel::Low);
        assert_eq!(select_ecl_for_percentage(10.0), ErrorCorrectionLevel::Medium);
        assert_eq!(select_ecl_for_percentage(20.0), ErrorCorrectionLevel::Quartile);
        assert_eq!(select_ecl_for_percentage(28.0), ErrorCorrectionLevel::High);
    }
    
    #[test]
    fn test_ecl_capacity() {
        let capacity = get_ecl_capacity(1, ErrorCorrectionLevel::Medium).unwrap();
        assert_eq!(capacity.data_codewords, 16);
        assert_eq!(capacity.total_codewords, 26);
        assert_eq!(capacity.ecc_codewords, 10);
        assert_eq!(capacity.recovery_percentage, 15.0);
    }
    
    #[test]
    fn test_optimizer_with_small_logo() {
        let optimizer = EclOptimizer::new();
        let data = "https://example.com";
        
        // Logo pequeño (10% del QR)
        let (ecl, analysis) = optimizer.determine_optimal_ecl(data, 0.1, None).unwrap();
        
        // Con un logo tan pequeño, debería recomendar ECL Low
        assert_eq!(ecl, ErrorCorrectionLevel::Low);
        assert!(analysis.occlusion_percentage < 7.0);
    }
}