// standards/decoder.rs - Decodificador y verificador de códigos QR

use crate::engine::error::{QrError, QrResult};
use crate::standards::gs1::{Gs1Parser, ApplicationIdentifier};
use image::{DynamicImage, GrayImage};
use std::time::Instant;

/// Datos decodificados de un código QR
#[derive(Debug, Clone)]
pub struct DecodedData {
    /// Contenido raw decodificado
    pub raw_data: String,
    /// Tipo de contenido detectado
    pub content_type: ContentType,
    /// Datos GS1 parseados (si aplica)
    pub gs1_elements: Option<Vec<(ApplicationIdentifier, String)>>,
    /// Metadatos de decodificación
    pub metadata: DecodeMetadata,
    /// Calidad de decodificación
    pub quality: DecodeQuality,
}

/// Tipo de contenido del QR
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContentType {
    Text,
    Url,
    Email,
    Phone,
    Sms,
    Wifi,
    Gs1,
    VCard,
    Unknown,
}

/// Metadatos del proceso de decodificación
#[derive(Debug, Clone)]
pub struct DecodeMetadata {
    /// Tiempo de decodificación en ms
    pub decode_time_ms: u64,
    /// Versión del QR (tamaño)
    pub qr_version: u8,
    /// Nivel de corrección de errores detectado
    pub error_correction: String,
    /// Número de módulos de datos
    pub data_modules: usize,
    /// Máscara aplicada
    pub mask_pattern: u8,
}

/// Calidad de la decodificación
#[derive(Debug, Clone)]
pub struct DecodeQuality {
    /// Puntuación general (0.0 - 1.0)
    pub overall_score: f32,
    /// Contraste del símbolo
    pub symbol_contrast: f32,
    /// Uniformidad de la cuadrícula
    pub grid_uniformity: f32,
    /// Daño detectado
    pub damage_assessment: DamageLevel,
    /// Métricas detalladas
    pub metrics: QualityMetrics,
}

/// Nivel de daño detectado
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DamageLevel {
    None,
    Minor,
    Moderate,
    Severe,
}

/// Métricas de calidad detalladas
#[derive(Debug, Clone)]
pub struct QualityMetrics {
    /// Desviación del módulo
    pub module_deviation: f32,
    /// Distorsión de perspectiva
    pub perspective_distortion: f32,
    /// Ruido en la imagen
    pub noise_level: f32,
    /// Calidad de los patrones de búsqueda
    pub finder_pattern_quality: f32,
    /// Calidad de los patrones de alineación
    pub alignment_pattern_quality: f32,
}

/// Decodificador de códigos QR
pub struct QrDecoder {
    gs1_parser: Gs1Parser,
    enable_quality_analysis: bool,
    enable_error_recovery: bool,
}

impl QrDecoder {
    pub fn new() -> Self {
        Self {
            gs1_parser: Gs1Parser::new(),
            enable_quality_analysis: true,
            enable_error_recovery: true,
        }
    }
    
    /// Decodifica un código QR desde una imagen
    pub fn decode_image(&self, image: &DynamicImage) -> QrResult<DecodedData> {
        let start_time = Instant::now();
        
        // Convertir a escala de grises
        let gray_image = image.to_luma8();
        
        // Intentar decodificar con rxing (por ahora, simulado)
        let (raw_data, qr_info) = self.decode_with_rxing(&gray_image)?;
        
        // Detectar tipo de contenido
        let content_type = self.detect_content_type(&raw_data);
        
        // Parsear GS1 si aplica
        let gs1_elements = if content_type == ContentType::Gs1 {
            match self.gs1_parser.parse(&raw_data) {
                Ok(elements) => Some(elements),
                Err(_) => None,
            }
        } else {
            None
        };
        
        // Analizar calidad si está habilitado
        let quality = if self.enable_quality_analysis {
            self.analyze_quality(&gray_image, &qr_info)?
        } else {
            self.create_default_quality()
        };
        
        let decode_time_ms = start_time.elapsed().as_millis() as u64;
        
        Ok(DecodedData {
            raw_data,
            content_type,
            gs1_elements,
            metadata: DecodeMetadata {
                decode_time_ms,
                qr_version: qr_info.version,
                error_correction: qr_info.error_correction.clone(),
                data_modules: qr_info.data_modules,
                mask_pattern: qr_info.mask_pattern,
            },
            quality,
        })
    }
    
    /// Decodifica un código QR desde SVG (convierte a imagen primero)
    pub fn decode_svg(&self, svg_data: &str) -> QrResult<DecodedData> {
        // Por ahora, retornamos un error ya que necesitaríamos resvg o similar
        Err(QrError::DecodingError("Decodificación SVG no implementada aún".to_string()))
    }
    
    /// Verifica que el contenido decodificado coincida con el esperado
    pub fn verify_content(&self, decoded: &DecodedData, expected: &str) -> bool {
        decoded.raw_data == expected
    }
    
    /// Decodifica usando rxing (simulado por ahora)
    fn decode_with_rxing(&self, image: &GrayImage) -> QrResult<(String, QrInfo)> {
        // TODO: Integrar rxing real cuando esté configurado
        // Por ahora, simulamos una decodificación exitosa
        
        // En una implementación real:
        // let mut hints = HashMap::new();
        // hints.insert(DecodeHintType::TryHarder, DecodeHintValue::TryHarder(true));
        // let result = detect_multiple_in_luma(image, &hints)?;
        
        // Simulación para desarrollo
        Ok((
            "\\FNC1010123456789012817251231210ABC123".to_string(),
            QrInfo {
                version: 5,
                error_correction: "H".to_string(),
                data_modules: 134,
                mask_pattern: 2,
            }
        ))
    }
    
    /// Detecta el tipo de contenido
    fn detect_content_type(&self, data: &str) -> ContentType {
        if data.starts_with("\\FNC1") || data.contains("(01)") {
            ContentType::Gs1
        } else if data.starts_with("http://") || data.starts_with("https://") {
            ContentType::Url
        } else if data.starts_with("mailto:") {
            ContentType::Email
        } else if data.starts_with("tel:") {
            ContentType::Phone
        } else if data.starts_with("smsto:") || data.starts_with("sms:") {
            ContentType::Sms
        } else if data.starts_with("WIFI:") {
            ContentType::Wifi
        } else if data.starts_with("BEGIN:VCARD") {
            ContentType::VCard
        } else if data.chars().all(|c| c.is_ascii_graphic() || c.is_whitespace()) {
            ContentType::Text
        } else {
            ContentType::Unknown
        }
    }
    
    /// Analiza la calidad del código QR
    fn analyze_quality(&self, image: &GrayImage, qr_info: &QrInfo) -> QrResult<DecodeQuality> {
        let contrast = self.calculate_contrast(image);
        let uniformity = self.calculate_grid_uniformity(image, qr_info.version);
        let damage = self.assess_damage(image);
        let metrics = self.calculate_quality_metrics(image, qr_info)?;
        
        // Calcular puntuación general
        let overall_score = (contrast * 0.3 + uniformity * 0.3 + 
                            metrics.finder_pattern_quality * 0.2 +
                            (1.0 - metrics.noise_level) * 0.2).min(1.0).max(0.0f32);
        
        Ok(DecodeQuality {
            overall_score,
            symbol_contrast: contrast,
            grid_uniformity: uniformity,
            damage_assessment: damage,
            metrics,
        })
    }
    
    /// Calcula el contraste del símbolo
    fn calculate_contrast(&self, image: &GrayImage) -> f32 {
        let mut min_brightness = 255u8;
        let mut max_brightness = 0u8;
        
        for pixel in image.pixels() {
            let brightness = pixel[0];
            min_brightness = min_brightness.min(brightness);
            max_brightness = max_brightness.max(brightness);
        }
        
        if max_brightness > min_brightness {
            (max_brightness - min_brightness) as f32 / 255.0
        } else {
            0.0
        }
    }
    
    /// Calcula la uniformidad de la cuadrícula
    fn calculate_grid_uniformity(&self, _image: &GrayImage, _version: u8) -> f32 {
        // Simplificado: en producción, analizaríamos la regularidad de los módulos
        0.85
    }
    
    /// Evalúa el nivel de daño
    fn assess_damage(&self, image: &GrayImage) -> DamageLevel {
        // Simplificado: analizar áreas blancas/negras irregulares
        let total_pixels = (image.width() * image.height()) as f32;
        let mut irregular_pixels = 0;
        
        // Contar píxeles que no son claramente blancos o negros
        for pixel in image.pixels() {
            let brightness = pixel[0];
            if brightness > 50 && brightness < 200 {
                irregular_pixels += 1;
            }
        }
        
        let damage_ratio = irregular_pixels as f32 / total_pixels;
        
        if damage_ratio < 0.05 {
            DamageLevel::None
        } else if damage_ratio < 0.15 {
            DamageLevel::Minor
        } else if damage_ratio < 0.30 {
            DamageLevel::Moderate
        } else {
            DamageLevel::Severe
        }
    }
    
    /// Calcula métricas de calidad detalladas
    fn calculate_quality_metrics(&self, image: &GrayImage, _qr_info: &QrInfo) -> QrResult<QualityMetrics> {
        // Implementación simplificada
        Ok(QualityMetrics {
            module_deviation: 0.05,
            perspective_distortion: 0.02,
            noise_level: self.calculate_noise_level(image),
            finder_pattern_quality: 0.95,
            alignment_pattern_quality: 0.90,
        })
    }
    
    /// Calcula el nivel de ruido
    fn calculate_noise_level(&self, image: &GrayImage) -> f32 {
        // Simplificado: calcular varianza local
        let mut variance_sum = 0.0;
        let sample_size = 100;
        let step = (image.width() / 10).max(1);
        
        for y in (0..image.height()).step_by(step as usize).take(sample_size) {
            for x in (0..image.width()).step_by(step as usize).take(sample_size) {
                let center = image.get_pixel(x, y)[0] as f32;
                let mut local_variance = 0.0;
                let mut count = 0;
                
                // Calcular varianza en ventana 3x3
                for dy in -1..=1 {
                    for dx in -1..=1 {
                        let nx = (x as i32 + dx).max(0).min(image.width() as i32 - 1) as u32;
                        let ny = (y as i32 + dy).max(0).min(image.height() as i32 - 1) as u32;
                        let neighbor = image.get_pixel(nx, ny)[0] as f32;
                        local_variance += (neighbor - center).powi(2);
                        count += 1;
                    }
                }
                
                variance_sum += local_variance / count as f32;
            }
        }
        
        (variance_sum / (sample_size * sample_size) as f32 / 255.0).min(1.0)
    }
    
    /// Crea una calidad por defecto
    fn create_default_quality(&self) -> DecodeQuality {
        DecodeQuality {
            overall_score: 0.8,
            symbol_contrast: 0.9,
            grid_uniformity: 0.85,
            damage_assessment: DamageLevel::None,
            metrics: QualityMetrics {
                module_deviation: 0.05,
                perspective_distortion: 0.0,
                noise_level: 0.1,
                finder_pattern_quality: 0.95,
                alignment_pattern_quality: 0.9,
            },
        }
    }
    
    /// Genera un reporte de verificación
    pub fn generate_verification_report(&self, decoded: &DecodedData) -> String {
        let mut report = String::new();
        
        report.push_str("=== REPORTE DE VERIFICACIÓN DE CÓDIGO QR ===\n\n");
        
        // Información básica
        report.push_str("INFORMACIÓN BÁSICA:\n");
        report.push_str(&format!("  Tipo de contenido: {:?}\n", decoded.content_type));
        report.push_str(&format!("  Longitud de datos: {} caracteres\n", decoded.raw_data.len()));
        report.push_str(&format!("  Tiempo de decodificación: {}ms\n", decoded.metadata.decode_time_ms));
        report.push_str("\n");
        
        // Información técnica
        report.push_str("INFORMACIÓN TÉCNICA:\n");
        report.push_str(&format!("  Versión QR: {}\n", decoded.metadata.qr_version));
        report.push_str(&format!("  Corrección de errores: {}\n", decoded.metadata.error_correction));
        report.push_str(&format!("  Módulos de datos: {}\n", decoded.metadata.data_modules));
        report.push_str(&format!("  Patrón de máscara: {}\n", decoded.metadata.mask_pattern));
        report.push_str("\n");
        
        // Calidad
        report.push_str("ANÁLISIS DE CALIDAD:\n");
        report.push_str(&format!("  Puntuación general: {:.1}%\n", decoded.quality.overall_score * 100.0));
        report.push_str(&format!("  Contraste: {:.1}%\n", decoded.quality.symbol_contrast * 100.0));
        report.push_str(&format!("  Uniformidad: {:.1}%\n", decoded.quality.grid_uniformity * 100.0));
        report.push_str(&format!("  Nivel de daño: {:?}\n", decoded.quality.damage_assessment));
        report.push_str("\n");
        
        // Métricas detalladas
        report.push_str("MÉTRICAS DETALLADAS:\n");
        report.push_str(&format!("  Desviación de módulo: {:.2}%\n", decoded.quality.metrics.module_deviation * 100.0));
        report.push_str(&format!("  Distorsión: {:.2}%\n", decoded.quality.metrics.perspective_distortion * 100.0));
        report.push_str(&format!("  Nivel de ruido: {:.2}%\n", decoded.quality.metrics.noise_level * 100.0));
        report.push_str(&format!("  Calidad patrones búsqueda: {:.1}%\n", decoded.quality.metrics.finder_pattern_quality * 100.0));
        report.push_str("\n");
        
        // Contenido GS1 si aplica
        if let Some(gs1_elements) = &decoded.gs1_elements {
            report.push_str("CONTENIDO GS1:\n");
            for (ai, value) in gs1_elements {
                report.push_str(&format!("  {:?}: {}\n", ai, value));
            }
            report.push_str("\n");
        }
        
        // Recomendaciones
        report.push_str("RECOMENDACIONES:\n");
        if decoded.quality.symbol_contrast < 0.7 {
            report.push_str("  ⚠️  Mejorar contraste entre módulos claros y oscuros\n");
        }
        if decoded.quality.damage_assessment != DamageLevel::None {
            report.push_str("  ⚠️  Se detectó daño en el símbolo, verificar impresión\n");
        }
        if decoded.quality.metrics.noise_level > 0.2 {
            report.push_str("  ⚠️  Alto nivel de ruido, mejorar calidad de captura/impresión\n");
        }
        if decoded.quality.overall_score >= 0.9 {
            report.push_str("  ✓ Código QR de alta calidad\n");
        }
        
        report
    }
}

/// Información del QR decodificado
struct QrInfo {
    version: u8,
    error_correction: String,
    data_modules: usize,
    mask_pattern: u8,
}

impl Default for QrDecoder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_content_type_detection() {
        let decoder = QrDecoder::new();
        
        assert_eq!(decoder.detect_content_type("https://example.com"), ContentType::Url);
        assert_eq!(decoder.detect_content_type("mailto:test@example.com"), ContentType::Email);
        assert_eq!(decoder.detect_content_type("\\FNC1010123456789"), ContentType::Gs1);
        assert_eq!(decoder.detect_content_type("Hello World"), ContentType::Text);
    }
    
    #[test]
    fn test_quality_calculation() {
        let decoder = QrDecoder::new();
        
        // Crear imagen de prueba
        let image = GrayImage::from_fn(100, 100, |x, y| {
            if (x / 10 + y / 10) % 2 == 0 {
                image::Luma([0u8])
            } else {
                image::Luma([255u8])
            }
        });
        
        let contrast = decoder.calculate_contrast(&image);
        assert!(contrast > 0.9); // Debe tener alto contraste
    }
}