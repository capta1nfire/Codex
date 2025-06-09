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

// Implementación de to_svg para QrCode
impl QrCode {
    /// Convierte el QR a SVG básico
    pub fn to_svg(&self) -> String {
        self.to_svg_with_options(10, None, None, None, None)
    }
    
    /// Convierte el QR a SVG con opciones avanzadas
    pub fn to_svg_with_options(
        &self, 
        module_size: usize,
        logo_result: Option<&crate::engine::customizer::LogoIntegrationResult>,
        frame_info: Option<&crate::engine::customizer::FrameInfo>,
        effects_info: Option<&crate::engine::customizer::EffectsInfo>,
        customization: Option<&QrCustomization>,
    ) -> String {
        let quiet_zone_size = self.quiet_zone * module_size;
        let image_size = (self.size * module_size) + (2 * quiet_zone_size);
        
        // Para tamaños grandes, usar renderizado optimizado
        let use_optimized_rendering = image_size > 1000;
        
        let mut svg = format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {} {}" width="{}" height="{}">"#,
            image_size, image_size, image_size, image_size
        );
        
        // Añadir definiciones de filtros si existen
        if let Some(effects) = effects_info {
            svg.push_str("<defs>");
            svg.push_str(&effects.filter_definitions);
            svg.push_str("</defs>");
        }
        
        // Fondo
        let bg_color = customization
            .and_then(|c| c.colors.as_ref())
            .map(|c| c.background.as_str())
            .unwrap_or("white");
            
        svg.push_str(&format!(
            r#"<rect width="{}" height="{}" fill="{}"/>"#,
            image_size, image_size, bg_color
        ));
        
        // Color de módulos
        let fg_color = customization
            .and_then(|c| c.colors.as_ref())
            .map(|c| c.foreground.as_str())
            .unwrap_or("black");
        
        // Aplicar filtros al grupo si existen
        let filter_attr = if let Some(effects) = effects_info {
            if !effects.filter_ids.is_empty() {
                let filter_refs = effects.filter_ids.iter()
                    .map(|id| format!("url(#{})", id))
                    .collect::<Vec<_>>()
                    .join(" ");
                format!(r#" style="filter: {}""#, filter_refs)
            } else {
                String::new()
            }
        } else {
            String::new()
        };
        
        // Grupo principal para los módulos del QR
        svg.push_str(&format!(r#"<g fill="{}"{}>"#, fg_color, filter_attr));
        
        // Módulos del QR
        if use_optimized_rendering && self.size > 100 {
            // Renderizado optimizado para QRs grandes
            svg.push_str(&self.render_modules_optimized(module_size, quiet_zone_size));
        } else {
            // Renderizado estándar para QRs pequeños
            for (y, row) in self.matrix.iter().enumerate() {
                for (x, &module) in row.iter().enumerate() {
                    if module {
                        let x_pos = (x * module_size) + quiet_zone_size;
                        let y_pos = (y * module_size) + quiet_zone_size;
                        
                        svg.push_str(&format!(
                            r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                            x_pos, y_pos, module_size, module_size
                        ));
                    }
                }
            }
        }
        
        svg.push_str("</g>");
        
        // Renderizar logo si existe
        if let Some(logo_info) = logo_result {
            svg.push_str(&self.render_logo_svg(logo_info, module_size, quiet_zone_size));
        }
        
        // Renderizar marco si existe
        if let Some(frame) = frame_info {
            let frame_renderer = crate::shapes::FrameRenderer::new(module_size as u32);
            let frame_svg = frame_renderer.render_frame(
                image_size,
                frame.frame_type,
                frame.text.as_deref(),
                frame.text_position,
                &frame.color,
            );
            svg.push_str(&frame_svg);
        }
        
        svg.push_str("</svg>");
        svg
    }
    
    /// Renderiza el logo como parte del SVG
    fn render_logo_svg(
        &self, 
        logo_info: &crate::engine::customizer::LogoIntegrationResult, 
        module_size: usize,
        quiet_zone_size: usize,
    ) -> String {
        use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
        
        // Convertir la imagen del logo a base64
        let mut png_bytes = Vec::new();
        if let Ok(_) = logo_info.logo_image.write_to(
            &mut std::io::Cursor::new(&mut png_bytes), 
            image::ImageOutputFormat::Png
        ) {
            let base64_logo = BASE64.encode(&png_bytes);
            
            // Calcular posición y tamaño en píxeles SVG
            let x = (logo_info.logo_area.x * module_size) + quiet_zone_size;
            let y = (logo_info.logo_area.y * module_size) + quiet_zone_size;
            let width = logo_info.logo_area.width * module_size;
            let height = logo_info.logo_area.height * module_size;
            
            // Agregar fondo blanco opcional para el logo
            let mut logo_svg = String::new();
            
            // Fondo blanco con borde redondeado
            logo_svg.push_str(&format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="white" rx="4" ry="4" opacity="0.9"/>"#,
                x - 4, y - 4, width + 8, height + 8
            ));
            
            // Imagen del logo
            logo_svg.push_str(&format!(
                r#"<image x="{}" y="{}" width="{}" height="{}" href="data:image/png;base64,{}" preserveAspectRatio="xMidYMid meet"/>"#,
                x, y, width, height, base64_logo
            ));
            
            logo_svg
        } else {
            String::new()
        }
    }
    
    /// Renderizado optimizado para QRs grandes
    fn render_modules_optimized(&self, module_size: usize, quiet_zone_size: usize) -> String {
        use rayon::prelude::*;
        
        // Dividir el QR en chunks para procesamiento paralelo
        const CHUNK_SIZE: usize = 50;
        let chunks: Vec<_> = self.matrix
            .par_chunks(CHUNK_SIZE)
            .enumerate()
            .map(|(chunk_y, rows)| {
                let mut chunk_svg = String::with_capacity(rows.len() * 100);
                let y_offset = chunk_y * CHUNK_SIZE;
                
                for (y, row) in rows.iter().enumerate() {
                    let mut path_d = String::new();
                    let mut in_path = false;
                    let mut path_start_x = 0;
                    let actual_y = y_offset + y;
                    
                    // Combinar módulos consecutivos en paths
                    for (x, &module) in row.iter().enumerate() {
                        if module && !in_path {
                            in_path = true;
                            path_start_x = x;
                        } else if !module && in_path {
                            // Terminar el path actual
                            let x_pos = (path_start_x * module_size) + quiet_zone_size;
                            let y_pos = (actual_y * module_size) + quiet_zone_size;
                            let width = (x - path_start_x) * module_size;
                            
                            chunk_svg.push_str(&format!(
                                r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                                x_pos, y_pos, width, module_size
                            ));
                            in_path = false;
                        }
                    }
                    
                    // Si terminamos la fila en un path
                    if in_path {
                        let x_pos = (path_start_x * module_size) + quiet_zone_size;
                        let y_pos = (actual_y * module_size) + quiet_zone_size;
                        let width = (row.len() - path_start_x) * module_size;
                        
                        chunk_svg.push_str(&format!(
                            r#"<rect x="{}" y="{}" width="{}" height="{}"/>"#,
                            x_pos, y_pos, width, module_size
                        ));
                    }
                }
                
                chunk_svg
            })
            .collect();
        
        // Combinar todos los chunks
        chunks.join("")
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