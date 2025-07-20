// engine/generator.rs - Generador base de códigos QR

use qrcodegen::{QrCode as QrCodeGen, QrCodeEcc, QrSegment, Version};
use super::types::*;
use super::error::{QrError, QrResult};
use super::segmenter::ContentSegmenter;
use crate::shapes::eyes::{EyeShapeRenderer, EyePosition, EyeComponent};

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
        self.generate_basic_with_options(data, size, true)
    }
    
    /// Genera un código QR básico con opción de segmentación
    pub fn generate_basic_with_options(&self, data: &str, size: u32, use_segmentation: bool) -> QrResult<QrCode> {
        // Validaciones
        self.validate_input(data, size)?;
        
        // Determinar nivel de corrección de errores por defecto
        let ecl = self.determine_error_correction(data);
        
        // Generar código QR con segmentación si está habilitada
        let qr = if use_segmentation {
            self.generate_with_segmentation(data, ecl)?
        } else {
            QrCodeGen::encode_text(data, ecl)
                .map_err(|e| QrError::EncodingError(format!("{:?}", e)))?
        };
        
        // Convertir a nuestra estructura interna
        let matrix = self.qr_to_matrix(&qr);
        
        Ok(QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
            logo_zone: None,
        })
    }
    
    /// Genera con nivel de corrección específico
    pub fn generate_with_ecl(
        &self, 
        data: &str, 
        size: u32, 
        ecl: ErrorCorrectionLevel
    ) -> QrResult<QrCode> {
        self.generate_with_ecl_and_options(data, size, ecl, true)
    }
    
    /// Genera con nivel de corrección específico y opción de segmentación
    pub fn generate_with_ecl_and_options(
        &self, 
        data: &str, 
        size: u32, 
        ecl: ErrorCorrectionLevel,
        use_segmentation: bool
    ) -> QrResult<QrCode> {
        self.validate_input(data, size)?;
        
        let qr_ecl = self.map_error_correction(ecl);
        let qr = if use_segmentation {
            self.generate_with_segmentation(data, qr_ecl)?
        } else {
            QrCodeGen::encode_text(data, qr_ecl)
                .map_err(|e| QrError::EncodingError(format!("{:?}", e)))?
        };
        
        let matrix = self.qr_to_matrix(&qr);
        
        Ok(QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
            logo_zone: None,
        })
    }
    
    /// Genera con ECL dinámico optimizado para logo
    pub fn generate_with_dynamic_ecl(
        &self,
        data: &str,
        size: u32,
        logo_size_ratio: f32,
        ecl_override: Option<ErrorCorrectionLevel>,
    ) -> QrResult<(QrCode, super::ecl_optimizer::OcclusionAnalysis)> {
        self.generate_with_dynamic_ecl_and_boost(data, size, logo_size_ratio, ecl_override, true)
    }
    
    /// Genera con ECL dinámico optimizado para logo con opción de boost
    pub fn generate_with_dynamic_ecl_and_boost(
        &self,
        data: &str,
        size: u32,
        logo_size_ratio: f32,
        ecl_override: Option<ErrorCorrectionLevel>,
        enable_boost: bool,
    ) -> QrResult<(QrCode, super::ecl_optimizer::OcclusionAnalysis)> {
        self.validate_input(data, size)?;
        
        // Usar el optimizador para determinar el ECL óptimo
        let optimizer = super::ecl_optimizer::EclOptimizer::new();
        let (optimal_ecl, mut analysis) = optimizer.determine_optimal_ecl(
            data,
            logo_size_ratio,
            ecl_override,
        )?;
        
        // Generar el QR con el ECL óptimo y boost si está habilitado
        let qr_ecl = self.map_error_correction(optimal_ecl);
        let qr = if enable_boost {
            self.generate_with_segmentation_and_boost(data, qr_ecl, true)?
        } else {
            self.generate_with_segmentation_and_boost(data, qr_ecl, false)?
        };
        
        let matrix = self.qr_to_matrix(&qr);
        
        // Si se aplicó boost, actualizar el análisis
        if enable_boost {
            // Comprobar si se aplicó boost comparando tamaños
            let qr_no_boost = self.generate_with_segmentation_and_boost(data, qr_ecl, false)?;
            if qr.size() == qr_no_boost.size() && qr.version() == qr_no_boost.version() {
                // Se aplicó boost, actualizar el ECL recomendado
                analysis.recommended_ecl = match optimal_ecl {
                    ErrorCorrectionLevel::Low => ErrorCorrectionLevel::Medium,
                    ErrorCorrectionLevel::Medium => ErrorCorrectionLevel::Quartile,
                    ErrorCorrectionLevel::Quartile => ErrorCorrectionLevel::High,
                    ErrorCorrectionLevel::High => ErrorCorrectionLevel::High,
                };
            }
        }
        
        let mut qr_code = QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
            logo_zone: None,
        };
        
        // Crear y almacenar la zona del logo
        let qr_size = qr_code.size as f64;
        let center = qr_size / 2.0;
        let logo_size = (qr_size * logo_size_ratio as f64) / 2.0;
        qr_code.logo_zone = Some(super::geometry::LogoExclusionZone::new(
            super::geometry::LogoShape::Square,
            center,
            center,
            logo_size,
        ));
        
        Ok((qr_code, analysis))
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
    
    /// Genera un código QR con boost ECL automático
    pub fn generate_with_boost_ecl(
        &self,
        data: &str,
        size: u32,
        min_ecl: ErrorCorrectionLevel,
    ) -> QrResult<(QrCode, BoostInfo)> {
        self.validate_input(data, size)?;
        
        let qr_ecl = self.map_error_correction(min_ecl);
        
        // Generar con boost habilitado
        let qr = self.generate_with_segmentation_and_boost(data, qr_ecl, true)?;
        
        // Detectar si se aplicó boost comparando con versión sin boost
        let qr_no_boost = self.generate_with_segmentation_and_boost(data, qr_ecl, false)?;
        
        let boost_applied = qr.size() == qr_no_boost.size() && qr.version() == qr_no_boost.version();
        
        // Calcular métricas de boost
        let boost_info = BoostInfo {
            original_ecl: min_ecl,
            // No podemos saber exactamente el ECL final de qrcodegen, 
            // pero sabemos que fue mejorado si el tamaño es el mismo
            final_ecl: if boost_applied {
                // Estimar basado en el ECL inicial
                match min_ecl {
                    ErrorCorrectionLevel::Low => ErrorCorrectionLevel::Medium,
                    ErrorCorrectionLevel::Medium => ErrorCorrectionLevel::Quartile,
                    ErrorCorrectionLevel::Quartile => ErrorCorrectionLevel::High,
                    ErrorCorrectionLevel::High => ErrorCorrectionLevel::High,
                }
            } else {
                min_ecl
            },
            boost_applied,
            version: qr.version().value() as i16,
            modules_count: qr.size() * qr.size(),
        };
        
        let matrix = self.qr_to_matrix(&qr);
        
        Ok((QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
            logo_zone: None,
        }, boost_info))
    }
    
    /// Genera un código QR usando segmentación optimizada
    fn generate_with_segmentation(&self, data: &str, ecl: QrCodeEcc) -> QrResult<QrCodeGen> {
        self.generate_with_segmentation_and_boost(data, ecl, true)
    }
    
    /// Genera un código QR usando segmentación optimizada con opción de boost ECL
    fn generate_with_segmentation_and_boost(&self, data: &str, ecl: QrCodeEcc, boost_ecl: bool) -> QrResult<QrCodeGen> {
        // Crear segmentador
        let segmenter = ContentSegmenter::new();
        
        // Analizar y segmentar el contenido
        let segments = segmenter.analyze_and_segment(data)
            .map_err(|e| QrError::EncodingError(e))?;
        
        // Generar QR con segmentos optimizados y boost ECL si está habilitado
        QrCodeGen::encode_segments_advanced(
            &segments,
            ecl,
            Version::MIN,  // Versión mínima automática
            Version::MAX,  // Versión máxima automática
            None,          // Máscara automática
            boost_ecl      // Aplicar boost ECL!
        )
        .map_err(|e| QrError::EncodingError(format!("Segmentation encoding failed: {:?}", e)))
    }
    
    /// Genera con tamaño fijo (para batch uniforme)
    pub fn generate_with_fixed_size(
        &self,
        data: &str,
        size: u32,
        qr_size: QrSize,
        ecl: Option<ErrorCorrectionLevel>,
    ) -> QrResult<QrCode> {
        self.validate_input(data, size)?;
        
        // Determinar ECL base
        let qr_ecl = if let Some(ecl) = ecl {
            self.map_error_correction(ecl)
        } else {
            self.determine_error_correction(data)
        };
        
        // Obtener rango de versiones para el tamaño solicitado
        let (min_ver, max_ver) = qr_size.version_range();
        
        // Crear segmentador
        let segmenter = ContentSegmenter::new();
        let segments = segmenter.analyze_and_segment(data)
            .map_err(|e| QrError::EncodingError(e))?;
        
        // Intentar generar con el rango de versiones especificado
        let qr = match QrCodeGen::encode_segments_advanced(
            &segments,
            qr_ecl,
            Version::new(min_ver as u8),
            Version::new(max_ver as u8),
            None,  // Máscara automática
            true   // Siempre aplicar boost ECL con tamaño fijo
        ) {
            Ok(qr) => qr,
            Err(_) => {
                // Si no cabe con el ECL solicitado, intentar con ECL más bajo
                let lower_ecl = match qr_ecl {
                    QrCodeEcc::High => QrCodeEcc::Quartile,
                    QrCodeEcc::Quartile => QrCodeEcc::Medium,
                    QrCodeEcc::Medium => QrCodeEcc::Low,
                    QrCodeEcc::Low => {
                        return Err(QrError::ValidationError(format!(
                            "Los datos son demasiado largos para el tamaño {:?} solicitado",
                            qr_size
                        )));
                    }
                };
                
                QrCodeGen::encode_segments_advanced(
                    &segments,
                    lower_ecl,
                    Version::new(min_ver as u8),
                    Version::new(max_ver as u8),
                    None,
                    true
                )
                .map_err(|_| QrError::ValidationError(format!(
                    "Los datos no caben en el tamaño {:?} incluso con ECL bajo",
                    qr_size
                )))?
            }
        };
        
        let matrix = self.qr_to_matrix(&qr);
        
        Ok(QrCode {
            matrix,
            size: qr.size() as usize,
            quiet_zone: self.quiet_zone,
            customization: None,
            logo_zone: None,
        })
    }
    
    /// Genera con segmentación, boost ECL y versión específica
    fn generate_with_segmentation_boost_and_version(
        &self, 
        data: &str, 
        ecl: QrCodeEcc, 
        min_version: Version,
        max_version: Version,
        boost_ecl: bool
    ) -> QrResult<QrCodeGen> {
        // Crear segmentador
        let segmenter = ContentSegmenter::new();
        
        // Analizar y segmentar el contenido
        let segments = segmenter.analyze_and_segment(data)
            .map_err(|e| QrError::EncodingError(e))?;
        
        // Generar QR con segmentos optimizados, boost ECL y versión específica
        QrCodeGen::encode_segments_advanced(
            &segments,
            ecl,
            min_version,
            max_version,
            None,          // Máscara automática
            boost_ecl      // Aplicar boost ECL si está habilitado
        )
        .map_err(|e| QrError::EncodingError(format!("Fixed size encoding failed: {:?}", e)))
    }
}

// Implementación de to_svg para QrCode
impl QrCode {
    /// Convierte el QR a datos estructurados con zona de exclusión
    pub fn to_structured_data_with_exclusion(
        &self, 
        logo_zone: Option<&super::geometry::LogoExclusionZone>
    ) -> crate::engine::types::QrStructuredOutput {
        use std::time::Instant;
        use sha2::{Sha256, Digest};
        
        let start = Instant::now();
        let mut path_data = String::new();
        let mut excluded_count = 0;
        
        // Obtener zonas intocables si hay logo
        let untouchable_zones = if logo_zone.is_some() {
            let version = self.get_version();
            super::zones::calculate_untouchable_zones(version)
        } else {
            vec![]
        };
        
        // Generar path data excluyendo módulos en zona de logo
        for y in 0..self.size {
            for x in 0..self.size {
                if self.matrix[y][x] {
                    // Verificar si el módulo debe ser excluido
                    let should_exclude = if let Some(zone) = logo_zone {
                        super::geometry::is_module_excludable(
                            x as u16, 
                            y as u16, 
                            zone, 
                            &untouchable_zones
                        )
                    } else {
                        false
                    };
                    
                    if should_exclude {
                        excluded_count += 1;
                        // No agregar este módulo al path
                        continue;
                    }
                    
                    // Offset por quiet zone en coordenadas
                    let x_pos = x + self.quiet_zone;
                    let y_pos = y + self.quiet_zone;
                    path_data.push_str(&format!("M{} {}h1v1H{}z", x_pos, y_pos, x_pos));
                }
            }
        }
        
        // Calcular hash del contenido para cache
        let mut hasher = Sha256::new();
        hasher.update(&path_data);
        let content_hash = format!("{:x}", hasher.finalize());
        
        // Construir estructura con información de exclusión
        let mut output = self.to_structured_data();
        output.path_data = path_data;
        output.metadata.content_hash = content_hash;
        output.metadata.generation_time_ms = start.elapsed().as_millis() as u64;
        
        // Agregar información de exclusión si se excluyeron módulos
        if excluded_count > 0 && logo_zone.is_some() {
            // Esta información ya debería venir del proceso de generación con ECL dinámico
            // Por ahora solo actualizamos el contador
            if let Some(ref mut exclusion) = output.metadata.exclusion_info {
                exclusion.excluded_modules = excluded_count;
            }
            
            // Convertir zonas intocables a formato de salida
            output.untouchable_zones = Some(
                untouchable_zones.iter().map(|zone| {
                    crate::engine::types::UntouchableZoneInfo {
                        zone_type: format!("{:?}", zone.zone_type),
                        x: zone.x,
                        y: zone.y,
                        width: zone.width,
                        height: zone.height,
                    }
                }).collect()
            );
        }
        
        output
    }
    
    /// Obtiene la versión del código QR basado en su tamaño
    fn get_version(&self) -> u8 {
        match self.size {
            21 => 1,
            25 => 2,
            29 => 3,
            33 => 4,
            37 => 5,
            41 => 6,
            45 => 7,
            49 => 8,
            53 => 9,
            57 => 10,
            _ => ((self.size - 21) / 4 + 1) as u8,
        }
    }
    
    /// Convierte el QR a SVG básico
    pub fn to_svg(&self) -> String {
        // Usar la customización almacenada en el QrCode
        self.to_svg_with_options(10, None, None, None, self.customization.as_ref())
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
        // PERO: Si hay stroke habilitado, usar renderizado estándar para que cada módulo tenga bordes visibles
        let has_stroke = if let Some(custom) = customization {
            let stroke_enabled = custom.gradient.as_ref()
                .and_then(|g| g.stroke_style.as_ref())
                .map(|s| s.enabled)
                .unwrap_or(false);
            tracing::info!("Checking stroke: customization present, stroke_enabled = {}", stroke_enabled);
            stroke_enabled
        } else {
            tracing::info!("Checking stroke: no customization present");
            false
        };
        let use_optimized_rendering = self.size > 25 && !has_stroke; // No optimizar si hay bordes
        tracing::info!("QR size: {}, has_stroke: {}, use_optimized_rendering: {}", self.size, has_stroke, use_optimized_rendering);
        
        let mut svg = format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {} {}" width="{}" height="{}">"#,
            image_size, image_size, image_size, image_size
        );
        
        // Inicializar sección de definiciones
        let mut has_defs = false;
        let mut defs_content = String::new();
        
        // Añadir definiciones de gradiente si existen
        let gradient_fill = if let Some(custom) = customization {
            if let Some(gradient_opts) = &custom.gradient {
                tracing::info!("Processing gradient: enabled={}, type={:?}, colors={:?}", 
                    gradient_opts.enabled, gradient_opts.gradient_type, gradient_opts.colors);
                
                if gradient_opts.enabled {
                    has_defs = true;
                    let gradient_processor = crate::processing::GradientProcessor::new();
                    let gradient = self.create_gradient_from_options(&gradient_processor, gradient_opts, Some(image_size));
                    
                    tracing::info!("Created gradient with fill_reference: {}", gradient.fill_reference);
                    
                    defs_content.push_str(&gradient.svg_definition);
                    Some(gradient.fill_reference)
                } else {
                    tracing::info!("Gradient not enabled");
                    None
                }
            } else {
                tracing::info!("No gradient options found");
                None
            }
        } else {
            tracing::info!("No customization found");
            None
        };
        
        // Añadir definiciones de filtros si existen
        if let Some(effects) = effects_info {
            has_defs = true;
            defs_content.push_str(&effects.filter_definitions);
        }
        
        // Escribir sección defs si hay contenido
        if has_defs {
            svg.push_str("<defs>");
            svg.push_str(&defs_content);
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
        
        // Color o gradiente para módulos
        let fill_color = if let Some(ref grad_fill) = gradient_fill {
            grad_fill.as_str()
        } else {
            customization
                .and_then(|c| c.colors.as_ref())
                .map(|c| c.foreground.as_str())
                .unwrap_or("black")
        };
        
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
        
        // Verificar si tenemos formas de ojos personalizadas
        let has_custom_eyes = customization
            .and_then(|c| c.eye_shape.as_ref())
            .is_some();
        
        // Verificar si tenemos patrones personalizados
        let data_pattern = customization.and_then(|c| c.data_pattern);
        
        // Si hay formas de ojos personalizadas o patrones, renderizar por separado
        if has_custom_eyes || data_pattern.is_some() {
            // Renderizar módulos de datos con patrón (excluyendo ojos)
            // Aplicar bordes si están configurados en el gradiente
            let stroke_attrs = if let Some(custom) = customization {
                if let Some(gradient_opts) = &custom.gradient {
                    if let Some(stroke_style) = &gradient_opts.stroke_style {
                        if stroke_style.enabled && gradient_fill.is_some() {
                            let color = stroke_style.color.as_deref().unwrap_or("white");
                            let width = stroke_style.width.unwrap_or(0.5);
                            let opacity = stroke_style.opacity.unwrap_or(0.3);
                            format!(r#" stroke="{}" stroke-width="{}" stroke-opacity="{}""#, color, width, opacity)
                        } else {
                            String::new()
                        }
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            };
            
            svg.push_str(&format!(r#"<g fill="{}"{}{}>"#, fill_color, filter_attr, stroke_attrs));
            self.render_data_modules_with_pattern(&mut svg, module_size, quiet_zone_size, data_pattern);
            svg.push_str("</g>");
            
            // Renderizar ojos personalizados
            if let Some(eye_shape) = customization.and_then(|c| c.eye_shape.as_ref()) {
                let default_eye_color = customization
                    .and_then(|c| c.colors.as_ref())
                    .map(|c| c.foreground.as_str())
                    .unwrap_or(fill_color);
                    
                let eye_colors = customization
                    .and_then(|c| c.colors.as_ref())
                    .and_then(|c| c.eye_colors.as_ref());
                    
                svg.push_str(&self.render_custom_eyes(
                    *eye_shape, 
                    default_eye_color,
                    eye_colors,
                    customization.and_then(|c| c.eye_border_gradient.as_ref()),
                    customization.and_then(|c| c.eye_center_gradient.as_ref()),
                    module_size, 
                    quiet_zone_size
                ));
            }
        } else {
            // Renderizado normal sin ojos personalizados
            // Aplicar bordes si están configurados en el gradiente
            let stroke_attrs = if let Some(custom) = customization {
                if let Some(gradient_opts) = &custom.gradient {
                    if let Some(stroke_style) = &gradient_opts.stroke_style {
                        if stroke_style.enabled && gradient_fill.is_some() {
                            let color = stroke_style.color.as_deref().unwrap_or("white");
                            let width = stroke_style.width.unwrap_or(0.5);
                            let opacity = stroke_style.opacity.unwrap_or(0.3);
                            format!(r#" stroke="{}" stroke-width="{}" stroke-opacity="{}""#, color, width, opacity)
                        } else {
                            String::new()
                        }
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                }
            } else {
                String::new()
            };
            
            svg.push_str(&format!(r#"<g fill="{}"{}{}>"#, fill_color, filter_attr, stroke_attrs));
            
            // Módulos del QR
            if use_optimized_rendering {
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
        }
        
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
    
    /// Crea un gradiente desde las opciones de personalización
    fn create_gradient_from_options(
        &self,
        processor: &crate::processing::GradientProcessor,
        options: &GradientOptions,
        canvas_size: Option<usize>,
    ) -> crate::engine::types::Gradient {
        use crate::engine::types::Color;
        
        tracing::info!("🎯 create_gradient_from_options called with: type={:?}, angle={:?}, colors={:?}", 
            options.gradient_type, options.angle, options.colors);
        
        // Convertir colores hex a struct Color
        let colors: Vec<Color> = options.colors.iter()
            .map(|hex| self.hex_to_color(hex))
            .collect();
        
        if colors.len() < 2 {
            // Fallback si no hay suficientes colores
            let black = Color { r: 0, g: 0, b: 0, a: 255 };
            let gray = Color { r: 128, g: 128, b: 128, a: 255 };
            return processor.create_linear_gradient(&black, &gray, 0.0);
        }
        
        match options.gradient_type {
            GradientType::Linear => {
                let angle = options.angle.unwrap_or(90.0);
                tracing::info!("🎯 Creating LINEAR gradient with angle: {}", angle);
                processor.create_linear_gradient_with_size(
                    &colors[0],
                    &colors[1],
                    angle as f64,
                    canvas_size,
                )
            },
            GradientType::Radial => {
                processor.create_radial_gradient_with_size(
                    &colors[0],
                    &colors[1],
                    0.5, // center_x - valor por defecto
                    0.5, // center_y - valor por defecto
                    0.5, // radius - valor por defecto
                    canvas_size,
                )
            },
            GradientType::Diamond => {
                // Gradiente diamante real
                processor.create_diamond_gradient(
                    &colors[0],
                    &colors[1],
                    canvas_size,
                )
            },
            GradientType::Conic | GradientType::Spiral => {
                // Usar todos los colores para gradiente cónico
                processor.create_conical_gradient(
                    &colors,
                    0.5, // center_x - valor por defecto
                    0.5, // center_y - valor por defecto
                )
            },
        }
    }
    
    /// Convierte color hex a struct Color
    fn hex_to_color(&self, hex: &str) -> crate::engine::types::Color {
        use crate::engine::types::Color;
        
        let hex = hex.trim_start_matches('#');
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);
        let a = if hex.len() >= 8 {
            u8::from_str_radix(&hex[6..8], 16).unwrap_or(255)
        } else {
            255
        };
        
        Color { r, g, b, a }
    }
    
    /// Renderiza los módulos de datos (excluyendo áreas de ojos)
    fn render_data_modules(&self, svg: &mut String, module_size: usize, quiet_zone_size: usize) {
        self.render_data_modules_with_pattern(svg, module_size, quiet_zone_size, None);
    }
    
    /// Renderiza los módulos de datos con patrón personalizado
    fn render_data_modules_with_pattern(
        &self, 
        svg: &mut String, 
        module_size: usize, 
        quiet_zone_size: usize,
        pattern: Option<DataPattern>
    ) {
        // Si hay un patrón personalizado, usar PatternRenderer
        if let Some(data_pattern) = pattern {
            use crate::shapes::PatternRenderer;
            
            let pattern_renderer = PatternRenderer::new(module_size as u32);
            let pattern_svg = pattern_renderer.render_matrix_with_pattern(
                &self.matrix,
                data_pattern,
                "inherit", // Heredar color del grupo padre
                true // Excluir ojos
            );
            
            // Aplicar transformación para el quiet zone
            svg.push_str(&format!(
                r#"<g transform="translate({}, {})">{}</g>"#,
                quiet_zone_size, quiet_zone_size, pattern_svg
            ));
        } else {
            // Renderizado estándar con cuadrados
            let eye_size = 7;
            let qr_size = self.size;
            
            for (y, row) in self.matrix.iter().enumerate() {
                for (x, &module) in row.iter().enumerate() {
                    if module {
                        // Verificar si está en el área de un ojo
                        let in_top_left = x < eye_size && y < eye_size;
                        let in_top_right = x >= qr_size - eye_size && y < eye_size;
                        let in_bottom_left = x < eye_size && y >= qr_size - eye_size;
                        
                        if !in_top_left && !in_top_right && !in_bottom_left {
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
        }
    }
    
    /// Renderiza ojos personalizados
    fn render_custom_eyes(
        &self, 
        eye_shape: EyeShape, 
        default_color: &str,
        eye_colors: Option<&EyeColors>,
        eye_border_gradient: Option<&GradientOptions>,
        eye_center_gradient: Option<&GradientOptions>,
        module_size: usize, 
        quiet_zone_size: usize
    ) -> String {
        let mut svg = String::new();
        let eye_renderer = EyeShapeRenderer::new(module_size as u32);
        let qr_size = self.size;
        
        // Calcular posiciones reales de los ojos
        let eye_positions = [
            (EyePosition::TopLeft, 0, 0),
            (EyePosition::TopRight, qr_size - 7, 0),
            (EyePosition::BottomLeft, 0, qr_size - 7),
        ];
        
        svg.push_str(&format!(r#"<g transform="translate({}, {})">"#, quiet_zone_size, quiet_zone_size));
        
        for (position, x_offset, y_offset) in &eye_positions {
            // Determinar colores/gradientes para este ojo específico
            let (outer_fill, inner_fill) = {
                // Primero verificar si hay gradientes específicos para bordes/centros
                let outer_gradient_fill = if eye_border_gradient.is_some() {
                    Some("url(#grad_eye_border)".to_string())
                } else if let Some(eye_colors) = eye_colors {
                    if eye_colors.outer_gradient.is_some() {
                        Some("url(#grad_eye_outer)".to_string())
                    } else {
                        None
                    }
                } else {
                    None
                };
                
                let inner_gradient_fill = if eye_center_gradient.is_some() {
                    Some("url(#grad_eye_center)".to_string())
                } else if let Some(eye_colors) = eye_colors {
                    if eye_colors.inner_gradient.is_some() {
                        Some("url(#grad_eye_inner)".to_string())
                    } else {
                        None
                    }
                } else {
                    None
                };
                
                // Si no hay gradientes, usar colores sólidos
                if outer_gradient_fill.is_none() && inner_gradient_fill.is_none() {
                    let (outer_color, inner_color) = if let Some(eye_colors) = eye_colors {
                        // Verificar si hay colores por ojo individual
                        if let Some(per_eye) = &eye_colors.per_eye {
                            match position {
                                EyePosition::TopLeft => {
                                    if let Some(colors) = &per_eye.top_left {
                                        (colors.outer.as_str(), colors.inner.as_str())
                                    } else {
                                        // Usar colores generales de ojos
                                        (
                                            eye_colors.outer.as_deref().unwrap_or(default_color),
                                            eye_colors.inner.as_deref().unwrap_or(default_color)
                                        )
                                    }
                                }
                                EyePosition::TopRight => {
                                    if let Some(colors) = &per_eye.top_right {
                                        (colors.outer.as_str(), colors.inner.as_str())
                                    } else {
                                        (
                                            eye_colors.outer.as_deref().unwrap_or(default_color),
                                            eye_colors.inner.as_deref().unwrap_or(default_color)
                                        )
                                    }
                                }
                                EyePosition::BottomLeft => {
                                    if let Some(colors) = &per_eye.bottom_left {
                                        (colors.outer.as_str(), colors.inner.as_str())
                                    } else {
                                        (
                                            eye_colors.outer.as_deref().unwrap_or(default_color),
                                            eye_colors.inner.as_deref().unwrap_or(default_color)
                                        )
                                    }
                                }
                            }
                        } else {
                            // Usar colores generales para todos los ojos
                            (
                                eye_colors.outer.as_deref().unwrap_or(default_color),
                                eye_colors.inner.as_deref().unwrap_or(default_color)
                            )
                        }
                    } else {
                        // Sin colores personalizados, usar el color por defecto
                        (default_color, default_color)
                    };
                    
                    (outer_color.to_string(), inner_color.to_string())
                } else {
                    // Usar gradientes donde estén definidos, colores sólidos donde no
                    let outer = outer_gradient_fill.unwrap_or_else(|| {
                        if let Some(eye_colors) = eye_colors {
                            eye_colors.outer.as_deref().unwrap_or(default_color).to_string()
                        } else {
                            default_color.to_string()
                        }
                    });
                    
                    let inner = inner_gradient_fill.unwrap_or_else(|| {
                        if let Some(eye_colors) = eye_colors {
                            eye_colors.inner.as_deref().unwrap_or(default_color).to_string()
                        } else {
                            default_color.to_string()
                        }
                    });
                    
                    (outer, inner)
                }
            };
            
            // Aplicar transformación para la posición del ojo
            svg.push_str(&format!(
                r#"<g transform="translate({}, {})">"#, 
                x_offset * module_size, 
                y_offset * module_size
            ));
            
            // Renderizar marco exterior del ojo usando EyeShapeRenderer
            svg.push_str(&eye_renderer.render_to_svg_path(
                eye_shape, 
                *position, 
                EyeComponent::Outer, 
                &outer_fill
            ));
            
            // Renderizar punto interior del ojo usando EyeShapeRenderer
            svg.push_str(&eye_renderer.render_to_svg_path(
                eye_shape, 
                *position, 
                EyeComponent::Inner, 
                &inner_fill
            ));
            
            svg.push_str("</g>");
        }
        
        svg.push_str("</g>");
        svg
    }
    
    /// Convierte el QR a datos estructurados para QR v3
    pub fn to_structured_data(&self) -> crate::engine::types::QrStructuredOutput {
        use std::time::Instant;
        use sha2::{Sha256, Digest};
        
        let start = Instant::now();
        let mut path_data = String::new();
        
        // Generar path data sin quiet zone
        for y in 0..self.size {
            for x in 0..self.size {
                if self.matrix[y][x] {
                    // Offset por quiet zone en coordenadas
                    let x_pos = x + self.quiet_zone;
                    let y_pos = y + self.quiet_zone;
                    path_data.push_str(&format!("M{} {}h1v1H{}z", x_pos, y_pos, x_pos));
                }
            }
        }
        
        // Calcular hash del contenido para cache
        let mut hasher = Sha256::new();
        hasher.update(&path_data);
        let content_hash = format!("{:x}", hasher.finalize());
        
        // Determinar versión QR basada en tamaño
        let version = match self.size {
            21 => 1,
            25 => 2,
            29 => 3,
            33 => 4,
            37 => 5,
            41 => 6,
            45 => 7,
            49 => 8,
            53 => 9,
            57 => 10,
            _ => ((self.size - 21) / 4 + 1) as u8, // Fórmula general
        };
        
        // Determinar nivel de corrección basado en customization
        let error_correction = self.customization
            .as_ref()
            .and_then(|c| c.error_correction)
            .map(|ecl| match ecl {
                ErrorCorrectionLevel::Low => "L",
                ErrorCorrectionLevel::Medium => "M",
                ErrorCorrectionLevel::Quartile => "Q",
                ErrorCorrectionLevel::High => "H",
            })
            .unwrap_or("M")
            .to_string();
        
        let generation_time_ms = start.elapsed().as_millis() as u64;
        
        crate::engine::types::QrStructuredOutput {
            path_data,
            total_modules: (self.size + 2 * self.quiet_zone) as u32,
            data_modules: self.size as u32,
            version,
            error_correction,
            metadata: crate::engine::types::QrStructuredMetadata {
                generation_time_ms,
                quiet_zone: self.quiet_zone as u32,
                content_hash,
                total_modules: (self.size + 2 * self.quiet_zone) as u32,
                data_modules: self.size as u32,
                version: match self.size {
                    21 => 1,
                    25 => 2,
                    29 => 3,
                    33 => 4,
                    37 => 5,
                    41 => 6,
                    45 => 7,
                    49 => 8,
                    53 => 9,
                    57 => 10,
                    _ => ((self.size - 21) / 4 + 1) as u32,
                },
                error_correction: self.customization
                    .as_ref()
                    .and_then(|c| c.error_correction)
                    .map(|ecl| match ecl {
                        ErrorCorrectionLevel::Low => "L",
                        ErrorCorrectionLevel::Medium => "M",
                        ErrorCorrectionLevel::Quartile => "Q",
                        ErrorCorrectionLevel::High => "H",
                    })
                    .unwrap_or("M")
                    .to_string(),
                exclusion_info: None,
            },
            untouchable_zones: None,
        }
    }
    
    /// Convierte el QR a datos estructurados Enhanced para v3
    pub fn to_enhanced_data(&self) -> crate::engine::types::QrEnhancedOutput {
        self.to_enhanced_data_with_exclusion(None)
    }
    
    /// Convierte el QR a datos estructurados Enhanced para v3 con información de exclusión opcional
    pub fn to_enhanced_data_with_exclusion(&self, exclusion_info: Option<crate::engine::types::ExclusionInfo>) -> crate::engine::types::QrEnhancedOutput {
        use std::time::Instant;
        use sha2::{Sha256, Digest};
        
        let start = Instant::now();
        
        // Generar paths separados (con exclusión si hay logo_zone)
        let paths = self.generate_enhanced_paths_with_exclusion(self.logo_zone.as_ref());
        
        // Construir estilos basados en customization
        let styles = self.build_styles();
        
        // Construir definiciones (gradientes, efectos)
        let definitions = self.build_definitions();
        
        // Construir overlays (logo, frame)
        let overlays = self.build_overlays();
        
        // Calcular hash para cache
        let mut hasher = Sha256::new();
        hasher.update(&paths.data);
        for eye in &paths.eyes {
            hasher.update(&eye.path);
        }
        let content_hash = format!("{:x}", hasher.finalize());
        
        let generation_time_ms = start.elapsed().as_millis() as u64;
        
        crate::engine::types::QrEnhancedOutput {
            paths,
            styles,
            definitions,
            overlays,
            metadata: crate::engine::types::QrStructuredMetadata {
                generation_time_ms,
                quiet_zone: self.quiet_zone as u32,
                content_hash,
                total_modules: (self.size + 2 * self.quiet_zone) as u32,
                data_modules: self.size as u32,
                version: match self.size {
                    21 => 1,
                    25 => 2,
                    29 => 3,
                    33 => 4,
                    37 => 5,
                    41 => 6,
                    45 => 7,
                    49 => 8,
                    53 => 9,
                    57 => 10,
                    _ => ((self.size - 21) / 4 + 1) as u32,
                },
                error_correction: self.customization
                    .as_ref()
                    .and_then(|c| c.error_correction)
                    .map(|ecl| match ecl {
                        ErrorCorrectionLevel::Low => "L",
                        ErrorCorrectionLevel::Medium => "M",
                        ErrorCorrectionLevel::Quartile => "Q",
                        ErrorCorrectionLevel::High => "H",
                    })
                    .unwrap_or("M")
                    .to_string(),
                exclusion_info,
            },
        }
    }
    
    /// Genera paths separados para datos y ojos
    fn generate_enhanced_paths(&self) -> crate::engine::types::QrPaths {
        self.generate_enhanced_paths_with_exclusion(None)
    }
    
    /// Genera paths separados para datos y ojos con soporte para exclusión
    fn generate_enhanced_paths_with_exclusion(&self, logo_zone: Option<&super::geometry::LogoExclusionZone>) -> crate::engine::types::QrPaths {
        let mut data_path = String::new();
        let mut data_modules = Vec::new();
        let mut eye_paths = Vec::new();
        
        // Identificar regiones de ojos
        let eye_regions = self.identify_eye_regions();
        
        // Obtener zonas intocables si hay logo
        let untouchable_zones = if logo_zone.is_some() {
            let version = self.get_version();
            super::zones::calculate_untouchable_zones(version)
        } else {
            vec![]
        };
        
        // Obtener el patrón de datos configurado
        let data_pattern = self.customization.as_ref()
            .and_then(|c| c.data_pattern)
            .unwrap_or(DataPattern::Square);
            
        // Verificar si tenemos gradiente por módulo habilitado
        let per_module_gradient = self.customization.as_ref()
            .and_then(|c| c.gradient.as_ref())
            .map(|g| g.per_module)
            .unwrap_or(false);
            
        eprintln!("[DEBUG] per_module_gradient = {}", per_module_gradient);
        
        // Generar path optimizado para datos (excluyendo ojos y zona de logo si aplica)
        for y in 0..self.size {
            for x in 0..self.size {
                if self.matrix[y][x] && !self.is_in_eye_region(x, y, &eye_regions) {
                    // Verificar si el módulo debe ser excluido por el logo
                    let should_exclude = if let Some(zone) = logo_zone {
                        super::geometry::is_module_excludable(
                            x as u16, 
                            y as u16, 
                            zone, 
                            &untouchable_zones
                        )
                    } else {
                        false
                    };
                    
                    if should_exclude {
                        // No agregar este módulo al path
                        continue;
                    }
                    let x_pos = x + self.quiet_zone;
                    let y_pos = y + self.quiet_zone;
                    
                    // Si per_module_gradient está habilitado, generar módulos individuales
                    if per_module_gradient {
                        let module_path = self.generate_module_path(x_pos, y_pos, data_pattern);
                        eprintln!("[DEBUG] Adding module at ({}, {})", x_pos, y_pos);
                        data_modules.push(crate::engine::types::QrDataModule {
                            x: x_pos as u32,
                            y: y_pos as u32,
                            path: module_path,
                        });
                    } else {
                        // Generar patrón concatenado para path único
                        match data_pattern {
                        DataPattern::Dots => {
                            // Círculo con radio 0.4 (40% del módulo)
                            let cx = x_pos as f32 + 0.5;
                            let cy = y_pos as f32 + 0.5;
                            let r = 0.4;
                            data_path.push_str(&format!(
                                "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                                cx, cy, r, r, r, r * 2.0, r, r, r * 2.0
                            ));
                        },
                        DataPattern::Rounded => {
                            // Cuadrado redondeado
                            data_path.push_str(&format!(
                                "M{}.25 {}h0.5a0.25 0.25 0 0 1 0.25 0.25v0.5a0.25 0.25 0 0 1 -0.25 0.25h-0.5a0.25 0.25 0 0 1 -0.25 -0.25v-0.5a0.25 0.25 0 0 1 0.25 -0.25z",
                                x_pos, y_pos
                            ));
                        },
                        DataPattern::Vertical => {
                            // Línea vertical (60% del ancho)
                            let width = 0.6;
                            let offset = (1.0 - width) / 2.0;
                            data_path.push_str(&format!(
                                "M{} {}h{}v1h-{}z",
                                x_pos as f32 + offset, y_pos, width, width
                            ));
                        },
                        DataPattern::Horizontal => {
                            // Línea horizontal (60% de la altura)
                            let height = 0.6;
                            let offset = (1.0 - height) / 2.0;
                            data_path.push_str(&format!(
                                "M{} {}h1v{}h-1z",
                                x_pos, y_pos as f32 + offset, height
                            ));
                        },
                        DataPattern::Diamond => {
                            // Diamante (más denso)
                            let cx = x_pos as f32 + 0.5;
                            let cy = y_pos as f32 + 0.5;
                            let half = 0.52; // Aumentado de 0.45 a 0.52 para mayor densidad
                            data_path.push_str(&format!(
                                "M{} {}L{} {}L{} {}L{} {}z",
                                cx, cy - half,
                                cx + half, cy,
                                cx, cy + half,
                                cx - half, cy
                            ));
                        },
                        DataPattern::Circular => {
                            // Círculo con borde hueco interno
                            let cx = x_pos as f32 + 0.5;
                            let cy = y_pos as f32 + 0.5;
                            let outer_r = 0.45;
                            let inner_r = 0.2;
                            data_path.push_str(&format!(
                                "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0M{} {}m-{} 0a{} {} 0 1 1 {} 0a{} {} 0 1 1 -{} 0z",
                                cx, cy, outer_r, outer_r, outer_r, outer_r * 2.0, outer_r, outer_r, outer_r * 2.0,
                                cx, cy, inner_r, inner_r, inner_r, inner_r * 2.0, inner_r, inner_r, inner_r * 2.0
                            ));
                        },
                        DataPattern::Star => {
                            // Estrella EXACTA del usuario para patrón de datos
                            let base_x = x_pos as f32;
                            let base_y = y_pos as f32;
                            
                            // El path original va de x=44.282 a x=96.884 (ancho=52.602) y de y=15.023 a y=67.479 (alto=52.456)
                            // Para módulo 1x1 con espaciado reducido, usar 90% del espacio disponible
                            let path_width: f32 = 52.602;
                            let path_height: f32 = 52.456;
                            let available_space: f32 = 0.9; // 90% del módulo para espaciado reducido
                            let scale = available_space / path_width.max(path_height);
                            
                            // Centrar la estrella en el módulo
                            let center_x = base_x + 0.5;
                            let center_y = base_y + 0.5;
                            let path_center_x = 44.282 + path_width / 2.0;
                            let path_center_y = 15.023 + path_height / 2.0;
                            
                            let sc = |coord: f32| -> f32 { (coord - path_center_x) * scale + center_x };
                            let scy = |coord: f32| -> f32 { (coord - path_center_y) * scale + center_y };
                            
                            // Construir el path EXACTO por concatenación
                            let mut star_path = String::new();
                            
                            // M67.833,16.838
                            star_path.push_str(&format!("M{},{}", sc(67.833), scy(16.838)));
                            
                            // C68.304,15.737 69.386,15.023 70.583,15.023
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(68.304), scy(15.737), sc(69.386), scy(15.023), sc(70.583), scy(15.023)));
                            
                            // C71.78,15.023 72.862,15.737 73.333,16.838
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(71.78), scy(15.023), sc(72.862), scy(15.737), sc(73.333), scy(16.838)));
                            
                            // L79.521,31.297
                            star_path.push_str(&format!("L{},{}", sc(79.521), scy(31.297)));
                            
                            // L95.185,32.713
                            star_path.push_str(&format!("L{},{}", sc(95.185), scy(32.713)));
                            
                            // C96.377,32.821 97.39,33.63 97.76,34.768
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(96.377), scy(32.821), sc(97.39), scy(33.63), sc(97.76), scy(34.768)));
                            
                            // C98.13,35.907 97.785,37.156 96.884,37.945
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(98.13), scy(35.907), sc(97.785), scy(37.156), sc(96.884), scy(37.945)));
                            
                            // L85.045,48.297
                            star_path.push_str(&format!("L{},{}", sc(85.045), scy(48.297)));
                            
                            // L88.538,63.632
                            star_path.push_str(&format!("L{},{}", sc(88.538), scy(63.632)));
                            
                            // C88.804,64.799 88.348,66.013 87.379,66.717
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(88.804), scy(64.799), sc(88.348), scy(66.013), sc(87.379), scy(66.717)));
                            
                            // C86.411,67.42 85.116,67.479 84.088,66.865
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(86.411), scy(67.42), sc(85.116), scy(67.479), sc(84.088), scy(66.865)));
                            
                            // L70.583,58.804
                            star_path.push_str(&format!("L{},{}", sc(70.583), scy(58.804)));
                            
                            // L57.079,66.865
                            star_path.push_str(&format!("L{},{}", sc(57.079), scy(66.865)));
                            
                            // C56.05,67.479 54.756,67.42 53.787,66.717
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(56.05), scy(67.479), sc(54.756), scy(67.42), sc(53.787), scy(66.717)));
                            
                            // C52.818,66.013 52.363,64.799 52.629,63.632
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(52.818), scy(66.013), sc(52.363), scy(64.799), sc(52.629), scy(63.632)));
                            
                            // L56.122,48.297
                            star_path.push_str(&format!("L{},{}", sc(56.122), scy(48.297)));
                            
                            // L44.282,37.945
                            star_path.push_str(&format!("L{},{}", sc(44.282), scy(37.945)));
                            
                            // C43.381,37.156 43.036,35.907 43.406,34.768
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(43.381), scy(37.156), sc(43.036), scy(35.907), sc(43.406), scy(34.768)));
                            
                            // C43.776,33.63 44.79,32.821 45.982,32.713
                            star_path.push_str(&format!("C{},{} {},{} {},{}",
                                sc(43.776), scy(33.63), sc(44.79), scy(32.821), sc(45.982), scy(32.713)));
                            
                            // L61.646,31.297
                            star_path.push_str(&format!("L{},{}", sc(61.646), scy(31.297)));
                            
                            // Z para cerrar
                            star_path.push_str("Z");
                            
                            data_path.push_str(&star_path);
                        },
                        DataPattern::Cross => {
                            // Cruz
                            let thickness = 0.3;
                            let length = 0.8;
                            let offset = (1.0 - length) / 2.0;
                            let cross_offset = (1.0 - thickness) / 2.0;
                            data_path.push_str(&format!(
                                "M{} {}h{}v{}h-{}zM{} {}v{}h{}v-{}z",
                                x_pos as f32 + offset, y_pos as f32 + cross_offset,
                                length, thickness, length,
                                x_pos as f32 + cross_offset, y_pos as f32 + offset,
                                length, thickness, length
                            ));
                        },
                        DataPattern::Random => {
                            // Patrón pseudo-aleatorio basado en posición
                            let variant = (x * 7 + y * 13) % 4;
                            match variant {
                                0 => {
                                    // Círculo
                                    let cx = x_pos as f32 + 0.5;
                                    let cy = y_pos as f32 + 0.5;
                                    let r = 0.4;
                                    data_path.push_str(&format!(
                                        "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                                        cx, cy, r, r, r, r * 2.0, r, r, r * 2.0
                                    ));
                                },
                                1 => {
                                    // Cuadrado redondeado
                                    data_path.push_str(&format!(
                                        "M{}.25 {}h0.5a0.25 0.25 0 0 1 0.25 0.25v0.5a0.25 0.25 0 0 1 -0.25 0.25h-0.5a0.25 0.25 0 0 1 -0.25 -0.25v-0.5a0.25 0.25 0 0 1 0.25 -0.25z",
                                        x_pos, y_pos
                                    ));
                                },
                                2 => {
                                    // Diamante
                                    let cx = x_pos as f32 + 0.5;
                                    let cy = y_pos as f32 + 0.5;
                                    let half = 0.45;
                                    data_path.push_str(&format!(
                                        "M{} {}L{} {}L{} {}L{} {}z",
                                        cx, cy - half, cx + half, cy, cx, cy + half, cx - half, cy
                                    ));
                                },
                                _ => {
                                    // Cuadrado estándar
                                    data_path.push_str(&format!("M{} {}h1v1h-1z", x_pos, y_pos));
                                }
                            }
                        },
                        DataPattern::Wave => {
                            // Patrón de onda
                            let wave_height = 0.3;
                            let cy = y_pos as f32 + 0.5;
                            data_path.push_str(&format!(
                                "M{} {}Q{} {} {} {}T{} {}L{} {}L{} {}z",
                                x_pos, cy - wave_height / 2.0,
                                x_pos as f32 + 0.25, cy - wave_height,
                                x_pos as f32 + 0.5, cy - wave_height / 2.0,
                                x_pos + 1, cy - wave_height / 2.0,
                                x_pos + 1, cy + wave_height / 2.0,
                                x_pos, cy + wave_height / 2.0
                            ));
                        },
                        DataPattern::Mosaic => {
                            // Patrón de mosaico
                            let is_checker = (x + y) % 2 == 0;
                            if is_checker {
                                // 4 cuadrados pequeños
                                let half = 0.5;
                                data_path.push_str(&format!(
                                    "M{} {}h{}v{}h-{}zM{} {}h{}v{}h-{}z",
                                    x_pos, y_pos, half, half, half,
                                    x_pos as f32 + half, y_pos as f32 + half, half, half, half
                                ));
                            } else {
                                // Círculo con borde
                                let cx = x_pos as f32 + 0.5;
                                let cy = y_pos as f32 + 0.5;
                                let r = 0.35;
                                let stroke_width = 0.15;
                                data_path.push_str(&format!(
                                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0M{} {}m-{} 0a{} {} 0 1 1 {} 0a{} {} 0 1 1 -{} 0z",
                                    cx, cy, r, r, r, r * 2.0, r, r, r * 2.0,
                                    cx, cy, r - stroke_width, r - stroke_width, r - stroke_width, 
                                    (r - stroke_width) * 2.0, r - stroke_width, r - stroke_width, (r - stroke_width) * 2.0
                                ));
                            }
                        },
                        DataPattern::Square => {
                            // Patrón cuadrado estándar (optimizado para renderizado rápido)
                            let mut width = 1;
                            while x + width < self.size && 
                                  self.matrix[y][x + width] && 
                                  !self.is_in_eye_region(x + width, y, &eye_regions) {
                                width += 1;
                            }
                            
                            if width > 1 {
                                data_path.push_str(&format!("M{} {}h{}v1H{}z", x_pos, y_pos, width, x_pos));
                                // Saltar los módulos ya procesados
                                for _ in 1..width {
                                    if x + 1 < self.size {
                                        // Skip processed modules
                                    }
                                }
                            } else {
                                data_path.push_str(&format!("M{} {}h1v1H{}z", x_pos, y_pos, x_pos));
                            }
                        },
                        DataPattern::SquareSmall => {
                            // Cuadrado pequeño (80% del tamaño del módulo, centrado)
                            let size = 0.8;
                            let offset = (1.0 - size) / 2.0;
                            data_path.push_str(&format!(
                                "M{} {}h{}v{}h-{}z",
                                x_pos as f32 + offset, 
                                y_pos as f32 + offset, 
                                size, 
                                size, 
                                size
                            ));
                        },
                        DataPattern::Squircle => {
                            // Squircle - cuadrado con esquinas super-redondeadas
                            let padding = 0.03; // Reducido a 0.03 para módulos más grandes (94% del espacio)
                            let size = 1.0 - 2.0 * padding;
                            let x0 = x_pos as f32 + padding;
                            let y0 = y_pos as f32 + padding;
                            
                            data_path.push_str(&format!(
                                "M{} {}Q{} {} {} {}L{} {}Q{} {} {} {}L{} {}Q{} {} {} {}L{} {}Q{} {} {} {}z",
                                // Punto inicial (parte superior del lado izquierdo)
                                x0, y0 + size * 0.5,
                                // Esquina superior izquierda
                                x0, y0, x0 + size * 0.5, y0,
                                // Lado superior
                                x0 + size * 0.5, y0,
                                // Esquina superior derecha
                                x0 + size, y0, x0 + size, y0 + size * 0.5,
                                // Lado derecho
                                x0 + size, y0 + size * 0.5,
                                // Esquina inferior derecha
                                x0 + size, y0 + size, x0 + size * 0.5, y0 + size,
                                // Lado inferior
                                x0 + size * 0.5, y0 + size,
                                // Esquina inferior izquierda
                                x0, y0 + size, x0, y0 + size * 0.5
                            ));
                        }
                    }
                    } // Cierre del else
                }
            }
        }
        
        // Generar paths para cada ojo
        for (eye_type, region) in eye_regions.iter() {
            // Verificar si tenemos estilos separados para usar la nueva estructura
            if let Some(customization) = &self.customization {
                // Get eye colors for this specific eye
                let (border_color, center_color) = self.get_eye_colors_for_type(eye_type, customization);
                
                // Check if we should use separated structure (for styles or gradients)
                let should_use_separated = customization.eye_border_style.is_some() 
                    || customization.eye_center_style.is_some()
                    || customization.eye_border_gradient.is_some()
                    || customization.eye_center_gradient.is_some();
                    
                if should_use_separated {
                    // Usar la nueva estructura separada
                    let (border_path, center_path, border_shape, center_shape) = 
                        self.generate_eye_paths_separated(region, eye_type);
                    
                    eye_paths.push(crate::engine::types::QrEyePath {
                        eye_type: eye_type.clone(),
                        path: String::new(), // Vacío para la nueva estructura
                        border_path: Some(border_path),
                        center_path: Some(center_path),
                        shape: customization.eye_shape.map(|s| format!("{:?}", s)), // Legacy
                        border_shape: Some(border_shape),
                        center_shape: Some(center_shape),
                        border_color,
                        center_color,
                    });
                } else {
                    // Usar la estructura legacy
                    let eye_path = self.generate_eye_path(region, eye_type);
                    eye_paths.push(crate::engine::types::QrEyePath {
                        eye_type: eye_type.clone(),
                        path: eye_path,
                        border_path: None,
                        center_path: None,
                        shape: customization.eye_shape.map(|s| format!("{:?}", s)),
                        border_shape: None,
                        center_shape: None,
                        border_color,
                        center_color,
                    });
                }
            } else {
                // Sin personalización, usar estructura legacy con valores por defecto
                let eye_path = self.generate_eye_path(region, eye_type);
                eye_paths.push(crate::engine::types::QrEyePath {
                    eye_type: eye_type.clone(),
                    path: eye_path,
                    border_path: None,
                    center_path: None,
                    shape: None,
                    border_shape: None,
                    center_shape: None,
                    border_color: None,
                    center_color: None,
                });
            }
        }
        
        eprintln!("[DEBUG] Total data_modules: {}", data_modules.len());
        eprintln!("[DEBUG] data_path length: {}", data_path.len());
        
        crate::engine::types::QrPaths {
            data: data_path,
            data_modules,
            eyes: eye_paths,
        }
    }
    
    /// Genera el path SVG para un módulo individual
    fn generate_module_path(&self, x_pos: usize, y_pos: usize, pattern: DataPattern) -> String {
        match pattern {
            DataPattern::Dots => {
                // Círculo con radio 0.4 (40% del módulo)
                let cx = x_pos as f32 + 0.5;
                let cy = y_pos as f32 + 0.5;
                let r = 0.4;
                format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                    cx, cy, r, r, r, r * 2.0, r, r, r * 2.0
                )
            },
            DataPattern::Rounded => {
                // Cuadrado redondeado
                format!(
                    "M{}.25 {}h0.5a0.25 0.25 0 0 1 0.25 0.25v0.5a0.25 0.25 0 0 1 -0.25 0.25h-0.5a0.25 0.25 0 0 1 -0.25 -0.25v-0.5a0.25 0.25 0 0 1 0.25 -0.25z",
                    x_pos, y_pos
                )
            },
            DataPattern::Vertical => {
                // Línea vertical (60% del ancho)
                let width = 0.6;
                let offset = (1.0 - width) / 2.0;
                format!(
                    "M{} {}h{}v1h-{}z",
                    x_pos as f32 + offset, y_pos, width, width
                )
            },
            DataPattern::Horizontal => {
                // Línea horizontal (60% de la altura)
                let height = 0.6;
                let offset = (1.0 - height) / 2.0;
                format!(
                    "M{} {}h1v{}h-1z",
                    x_pos, y_pos as f32 + offset, height
                )
            },
            DataPattern::Diamond => {
                // Diamante (más denso)
                let cx = x_pos as f32 + 0.5;
                let cy = y_pos as f32 + 0.5;
                let half = 0.52;
                format!(
                    "M{} {}L{} {}L{} {}L{} {}z",
                    cx, cy - half,
                    cx + half, cy,
                    cx, cy + half,
                    cx - half, cy
                )
            },
            DataPattern::Circular => {
                // Círculo con borde hueco interno
                let cx = x_pos as f32 + 0.5;
                let cy = y_pos as f32 + 0.5;
                let outer_r = 0.45;
                let inner_r = 0.2;
                format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0M{} {}m-{} 0a{} {} 0 1 1 {} 0a{} {} 0 1 1 -{} 0z",
                    cx, cy, outer_r, outer_r, outer_r, outer_r * 2.0, outer_r, outer_r, outer_r * 2.0,
                    cx, cy, inner_r, inner_r, inner_r, inner_r * 2.0, inner_r, inner_r, inner_r * 2.0
                )
            },
            DataPattern::Star => {
                // Estrella EXACTA del usuario para patrón de datos
                let base_x = x_pos as f32;
                let base_y = y_pos as f32;
                
                // El path original va de x=44.282 a x=96.884 (ancho=52.602) y de y=15.023 a y=67.479 (alto=52.456)
                // Para módulo 1x1 con espaciado reducido, usar 90% del espacio disponible
                let path_width: f32 = 52.602;
                let path_height: f32 = 52.456;
                let available_space: f32 = 0.9; // 90% del módulo para espaciado reducido
                let scale = available_space / path_width.max(path_height);
                
                // Centrar la estrella en el módulo
                let center_x = base_x + 0.5;
                let center_y = base_y + 0.5;
                let path_center_x = 44.282 + path_width / 2.0;
                let path_center_y = 15.023 + path_height / 2.0;
                
                let sc = |coord: f32| -> f32 { (coord - path_center_x) * scale + center_x };
                let scy = |coord: f32| -> f32 { (coord - path_center_y) * scale + center_y };
                
                // Construir el path EXACTO por concatenación
                let mut star_path = String::new();
                
                // M67.833,16.838
                star_path.push_str(&format!("M{},{}", sc(67.833), scy(16.838)));
                
                // C68.304,15.737 69.386,15.023 70.583,15.023
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(68.304), scy(15.737), sc(69.386), scy(15.023), sc(70.583), scy(15.023)));
                
                // C71.78,15.023 72.862,15.737 73.333,16.838
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(71.78), scy(15.023), sc(72.862), scy(15.737), sc(73.333), scy(16.838)));
                
                // L79.521,31.297
                star_path.push_str(&format!("L{},{}", sc(79.521), scy(31.297)));
                
                // L95.185,32.713
                star_path.push_str(&format!("L{},{}", sc(95.185), scy(32.713)));
                
                // C96.377,32.821 97.39,33.63 97.76,34.768
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(96.377), scy(32.821), sc(97.39), scy(33.63), sc(97.76), scy(34.768)));
                
                // C98.13,35.907 97.785,37.156 96.884,37.945
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(98.13), scy(35.907), sc(97.785), scy(37.156), sc(96.884), scy(37.945)));
                
                // L85.045,48.297
                star_path.push_str(&format!("L{},{}", sc(85.045), scy(48.297)));
                
                // L88.538,63.632
                star_path.push_str(&format!("L{},{}", sc(88.538), scy(63.632)));
                
                // C88.804,64.799 88.348,66.013 87.379,66.717
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(88.804), scy(64.799), sc(88.348), scy(66.013), sc(87.379), scy(66.717)));
                
                // C86.411,67.42 85.116,67.479 84.088,66.865
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(86.411), scy(67.42), sc(85.116), scy(67.479), sc(84.088), scy(66.865)));
                
                // L70.583,58.804
                star_path.push_str(&format!("L{},{}", sc(70.583), scy(58.804)));
                
                // L57.079,66.865
                star_path.push_str(&format!("L{},{}", sc(57.079), scy(66.865)));
                
                // C56.05,67.479 54.756,67.42 53.787,66.717
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(56.05), scy(67.479), sc(54.756), scy(67.42), sc(53.787), scy(66.717)));
                
                // C52.818,66.013 52.363,64.799 52.629,63.632
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(52.818), scy(66.013), sc(52.363), scy(64.799), sc(52.629), scy(63.632)));
                
                // L56.122,48.297
                star_path.push_str(&format!("L{},{}", sc(56.122), scy(48.297)));
                
                // L44.282,37.945
                star_path.push_str(&format!("L{},{}", sc(44.282), scy(37.945)));
                
                // C43.381,37.156 43.036,35.907 43.406,34.768
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(43.381), scy(37.156), sc(43.036), scy(35.907), sc(43.406), scy(34.768)));
                
                // C43.776,33.63 44.79,32.821 45.982,32.713
                star_path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(43.776), scy(33.63), sc(44.79), scy(32.821), sc(45.982), scy(32.713)));
                
                // L61.646,31.297
                star_path.push_str(&format!("L{},{}", sc(61.646), scy(31.297)));
                
                // Z para cerrar
                star_path.push_str("Z");
                
                star_path
            },
            DataPattern::Cross => {
                // Cruz
                let thickness = 0.3;
                let length = 0.8;
                let offset = (1.0 - length) / 2.0;
                let cross_offset = (1.0 - thickness) / 2.0;
                format!(
                    "M{} {}h{}v{}h-{}zM{} {}v{}h{}v-{}z",
                    x_pos as f32 + offset, y_pos as f32 + cross_offset,
                    length, thickness, length,
                    x_pos as f32 + cross_offset, y_pos as f32 + offset,
                    length, thickness, length
                )
            },
            DataPattern::Random => {
                // Patrón pseudo-aleatorio basado en posición
                let x = x_pos - self.quiet_zone;
                let y = y_pos - self.quiet_zone;
                let variant = (x * 7 + y * 13) % 4;
                match variant {
                    0 => {
                        // Círculo
                        let cx = x_pos as f32 + 0.5;
                        let cy = y_pos as f32 + 0.5;
                        let r = 0.4;
                        format!(
                            "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                            cx, cy, r, r, r, r * 2.0, r, r, r * 2.0
                        )
                    },
                    1 => {
                        // Cuadrado redondeado
                        format!(
                            "M{}.25 {}h0.5a0.25 0.25 0 0 1 0.25 0.25v0.5a0.25 0.25 0 0 1 -0.25 0.25h-0.5a0.25 0.25 0 0 1 -0.25 -0.25v-0.5a0.25 0.25 0 0 1 0.25 -0.25z",
                            x_pos, y_pos
                        )
                    },
                    2 => {
                        // Diamante
                        let cx = x_pos as f32 + 0.5;
                        let cy = y_pos as f32 + 0.5;
                        let half = 0.45;
                        format!(
                            "M{} {}L{} {}L{} {}L{} {}z",
                            cx, cy - half, cx + half, cy, cx, cy + half, cx - half, cy
                        )
                    },
                    _ => {
                        // Cuadrado estándar
                        format!("M{} {}h1v1h-1z", x_pos, y_pos)
                    }
                }
            },
            DataPattern::Wave => {
                // Patrón de onda
                let wave_height = 0.3;
                let cy = y_pos as f32 + 0.5;
                format!(
                    "M{} {}Q{} {} {} {}T{} {}L{} {}L{} {}z",
                    x_pos, cy - wave_height / 2.0,
                    x_pos as f32 + 0.25, cy - wave_height,
                    x_pos as f32 + 0.5, cy - wave_height / 2.0,
                    x_pos + 1, cy - wave_height / 2.0,
                    x_pos + 1, cy + wave_height / 2.0,
                    x_pos, cy + wave_height / 2.0
                )
            },
            DataPattern::Mosaic => {
                // Patrón de mosaico
                let x = x_pos - self.quiet_zone;
                let y = y_pos - self.quiet_zone;
                let is_checker = (x + y) % 2 == 0;
                if is_checker {
                    // 4 cuadrados pequeños
                    let half = 0.5;
                    format!(
                        "M{} {}h{}v{}h-{}zM{} {}h{}v{}h-{}z",
                        x_pos, y_pos, half, half, half,
                        x_pos as f32 + half, y_pos as f32 + half, half, half, half
                    )
                } else {
                    // Círculo con borde
                    let cx = x_pos as f32 + 0.5;
                    let cy = y_pos as f32 + 0.5;
                    let r = 0.35;
                    let stroke_width = 0.15;
                    format!(
                        "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0M{} {}m-{} 0a{} {} 0 1 1 {} 0a{} {} 0 1 1 -{} 0z",
                        cx, cy, r, r, r, r * 2.0, r, r, r * 2.0,
                        cx, cy, r - stroke_width, r - stroke_width, r - stroke_width, 
                        (r - stroke_width) * 2.0, r - stroke_width, r - stroke_width, (r - stroke_width) * 2.0
                    )
                }
            },
            DataPattern::Squircle => {
                // Squircle - cuadrado con esquinas super-redondeadas
                let padding = 0.03; // Reducido a 0.03 para módulos más grandes (94% del espacio)
                let size = 1.0 - 2.0 * padding;
                let x0 = x_pos as f32 + padding;
                let y0 = y_pos as f32 + padding;
                
                format!(
                    "M{} {}Q{} {} {} {}L{} {}Q{} {} {} {}L{} {}Q{} {} {} {}L{} {}Q{} {} {} {}z",
                    // Punto inicial (parte superior del lado izquierdo)
                    x0, y0 + size * 0.5,
                    // Esquina superior izquierda
                    x0, y0, x0 + size * 0.5, y0,
                    // Lado superior
                    x0 + size * 0.5, y0,
                    // Esquina superior derecha
                    x0 + size, y0, x0 + size, y0 + size * 0.5,
                    // Lado derecho
                    x0 + size, y0 + size * 0.5,
                    // Esquina inferior derecha
                    x0 + size, y0 + size, x0 + size * 0.5, y0 + size,
                    // Lado inferior
                    x0 + size * 0.5, y0 + size,
                    // Esquina inferior izquierda
                    x0, y0 + size, x0, y0 + size * 0.5
                )
            },
            DataPattern::Square | DataPattern::SquareSmall => {
                // Cuadrado estándar
                if pattern == DataPattern::SquareSmall {
                    let size = 0.8;
                    let offset = (1.0 - size) / 2.0;
                    format!(
                        "M{} {}h{}v{}h-{}z",
                        x_pos as f32 + offset, 
                        y_pos as f32 + offset, 
                        size, 
                        size, 
                        size
                    )
                } else {
                    format!("M{} {}h1v1h-1z", x_pos, y_pos)
                }
            }
        }
    }
    
    /// Identifica las regiones de los ojos
    fn identify_eye_regions(&self) -> Vec<(String, EyeRegion)> {
        let mut regions = Vec::new();
        
        // Top-left eye
        regions.push(("top_left".to_string(), EyeRegion { x: 0, y: 0, size: 7 }));
        
        // Top-right eye
        regions.push(("top_right".to_string(), EyeRegion { x: self.size - 7, y: 0, size: 7 }));
        
        // Bottom-left eye
        regions.push(("bottom_left".to_string(), EyeRegion { x: 0, y: self.size - 7, size: 7 }));
        
        regions
    }
    
    /// Verifica si una coordenada está en una región de ojo
    fn is_in_eye_region(&self, x: usize, y: usize, regions: &[(String, EyeRegion)]) -> bool {
        for (_, region) in regions {
            if x >= region.x && x < region.x + region.size &&
               y >= region.y && y < region.y + region.size {
                return true;
            }
        }
        false
    }
    
    /// Get eye colors for a specific eye type
    fn get_eye_colors_for_type(&self, eye_type: &str, customization: &QrCustomization) -> (Option<String>, Option<String>) {
        eprintln!("[DEBUG] get_eye_colors_for_type called for eye: {}", eye_type);
        
        // Check for gradient references first
        let border_gradient_ref = if customization.eye_border_gradient.is_some() {
            Some("url(#grad_eye_border)".to_string())
        } else {
            None
        };
        
        let center_gradient_ref = if customization.eye_center_gradient.is_some() {
            Some("url(#grad_eye_center)".to_string())
        } else {
            None
        };
        
        // If gradients are defined, they take precedence
        if border_gradient_ref.is_some() || center_gradient_ref.is_some() {
            eprintln!("[DEBUG] Using gradient references: border={:?}, center={:?}", border_gradient_ref, center_gradient_ref);
        }
        
        if let Some(colors) = customization.colors.as_ref() {
            eprintln!("[DEBUG] customization.colors exists");
            
            if let Some(eye_colors) = colors.eye_colors.as_ref() {
                eprintln!("[DEBUG] eye_colors found: outer={:?}, inner={:?}", eye_colors.outer, eye_colors.inner);
                
                // Check for per-eye colors first
                if let Some(per_eye) = eye_colors.per_eye.as_ref() {
                    eprintln!("[DEBUG] per_eye colors found");
                    match eye_type {
                        "top_left" => {
                            if let Some(eye_pair) = per_eye.top_left.as_ref() {
                                eprintln!("[DEBUG] Returning per-eye colors for top_left: outer={}, inner={}", eye_pair.outer, eye_pair.inner);
                                return (
                                    border_gradient_ref.clone().or(Some(eye_pair.outer.clone())), 
                                    center_gradient_ref.clone().or(Some(eye_pair.inner.clone()))
                                );
                            }
                        }
                        "top_right" => {
                            if let Some(eye_pair) = per_eye.top_right.as_ref() {
                                eprintln!("[DEBUG] Returning per-eye colors for top_right: outer={}, inner={}", eye_pair.outer, eye_pair.inner);
                                return (
                                    border_gradient_ref.clone().or(Some(eye_pair.outer.clone())), 
                                    center_gradient_ref.clone().or(Some(eye_pair.inner.clone()))
                                );
                            }
                        }
                        "bottom_left" => {
                            if let Some(eye_pair) = per_eye.bottom_left.as_ref() {
                                eprintln!("[DEBUG] Returning per-eye colors for bottom_left: outer={}, inner={}", eye_pair.outer, eye_pair.inner);
                                return (
                                    border_gradient_ref.clone().or(Some(eye_pair.outer.clone())), 
                                    center_gradient_ref.clone().or(Some(eye_pair.inner.clone()))
                                );
                            }
                        }
                        _ => {}
                    }
                }
                
                // Fall back to general eye colors or gradients
                eprintln!("[DEBUG] Returning general eye colors or gradients");
                return (
                    border_gradient_ref.or(eye_colors.outer.clone()), 
                    center_gradient_ref.or(eye_colors.inner.clone())
                );
            } else {
                eprintln!("[DEBUG] No eye_colors found in customization.colors");
            }
        } else {
            eprintln!("[DEBUG] No colors found in customization");
        }
        
        // Return gradients if available, otherwise None
        eprintln!("[DEBUG] Returning gradient refs or None");
        (border_gradient_ref, center_gradient_ref)
    }
    
    /// Genera el path para un ojo específico
    fn generate_eye_path(&self, region: &EyeRegion, eye_type: &str) -> String {
        // Primero verificar si tenemos los nuevos estilos separados
        if let Some(customization) = &self.customization {
            if customization.eye_border_style.is_some() || customization.eye_center_style.is_some() {
                return self.generate_eye_path_separated(region, eye_type);
            }
        }
        
        // Fallback al sistema antiguo si no hay estilos separados
        let eye_shape = self.customization.as_ref()
            .and_then(|c| c.eye_shape)
            .unwrap_or(EyeShape::Square);
        
        let x = region.x + self.quiet_zone;
        let y = region.y + self.quiet_zone;
        
        // Generar paths para el marco exterior (7x7) y el centro (3x3)
        let mut path_parts = Vec::new();
        
        // Marco exterior (7x7)
        match eye_shape {
            EyeShape::Square => {
                path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::RoundedSquare => {
                path_parts.push(format!(
                    "M {:.1} {} h 5.6 a 0.7 0.7 0 0 1 0.7 0.7 v 5.6 a 0.7 0.7 0 0 1 -0.7 0.7 h -5.6 a 0.7 0.7 0 0 1 -0.7 -0.7 v -5.6 a 0.7 0.7 0 0 1 0.7 -0.7 Z",
                    x as f32 + 0.7, y
                ));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::Circle => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                path_parts.push(format!(
                    "M {} {} A 3.5 3.5 0 1 0 {} {} A 3.5 3.5 0 1 0 {} {} Z",
                    cx - 3.5, cy, cx + 3.5, cy, cx - 3.5, cy
                ));
                let cx_inner = (x + 2) as f32 + 1.5;
                let cy_inner = (y + 2) as f32 + 1.5;
                path_parts.push(format!(
                    "M {} {} A 1.5 1.5 0 1 0 {} {} A 1.5 1.5 0 1 0 {} {} Z",
                    cx_inner - 1.5, cy_inner, cx_inner + 1.5, cy_inner, cx_inner - 1.5, cy_inner
                ));
            }
            EyeShape::Dot => {
                // Marco exterior cuadrado
                path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
                // Centro circular
                let cx = (x + 2) as f32 + 1.5;
                let cy = (y + 2) as f32 + 1.5;
                path_parts.push(format!(
                    "M {} {} A 1.5 1.5 0 1 0 {} {} A 1.5 1.5 0 1 0 {} {} Z",
                    cx - 1.5, cy, cx + 1.5, cy, cx - 1.5, cy
                ));
            }
            EyeShape::Leaf => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                path_parts.push(format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    cx, y as f32,
                    x as f32 + 5.6, y as f32 + 1.4, x as f32 + 7.0, cy,
                    x as f32 + 5.6, y as f32 + 5.6, cx, y as f32 + 7.0,
                    x as f32 + 1.4, y as f32 + 5.6, x as f32, cy,
                    x as f32 + 1.4, y as f32 + 1.4, cx, y as f32
                ));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::Star => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                let outer_r = 3.5;
                let inner_r = 1.75;
                
                let mut star_path = String::from("M ");
                for i in 0..10 {
                    let angle = (i as f32 * 36.0 - 90.0).to_radians();
                    let r = if i % 2 == 0 { outer_r } else { inner_r };
                    let px = cx + r * angle.cos();
                    let py = cy + r * angle.sin();
                    
                    if i == 0 {
                        star_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        star_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                star_path.push_str(" Z");
                path_parts.push(star_path);
                
                // Centro estrella más pequeña
                let cx_inner = (x + 2) as f32 + 1.5;
                let cy_inner = (y + 2) as f32 + 1.5;
                let outer_r_inner = 1.5;
                let inner_r_inner = 0.75;
                
                let mut star_path_inner = String::from("M ");
                for i in 0..10 {
                    let angle = (i as f32 * 36.0 - 90.0).to_radians();
                    let r = if i % 2 == 0 { outer_r_inner } else { inner_r_inner };
                    let px = cx_inner + r * angle.cos();
                    let py = cy_inner + r * angle.sin();
                    
                    if i == 0 {
                        star_path_inner.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        star_path_inner.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                star_path_inner.push_str(" Z");
                path_parts.push(star_path_inner);
            }
            EyeShape::Diamond => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                path_parts.push(format!(
                    "M {} {} L {} {} L {} {} L {} {} Z",
                    cx, y as f32,
                    x as f32 + 7.0, cy,
                    cx, y as f32 + 7.0,
                    x as f32, cy
                ));
                // Centro diamante
                let cx_inner = (x + 2) as f32 + 1.5;
                let cy_inner = (y + 2) as f32 + 1.5;
                path_parts.push(format!(
                    "M {} {} L {} {} L {} {} L {} {} Z",
                    cx_inner, (y + 2) as f32,
                    (x + 2) as f32 + 3.0, cy_inner,
                    cx_inner, (y + 2) as f32 + 3.0,
                    (x + 2) as f32, cy_inner
                ));
            }
            EyeShape::Cross => {
                let thickness = 7.0 / 3.0;
                let offset = (7.0 - thickness) / 2.0;
                path_parts.push(format!(
                    "M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z",
                    x as f32 + offset, y as f32,
                    thickness, offset,
                    offset, thickness,
                    offset, offset,
                    thickness, offset,
                    thickness, thickness,
                    offset
                ));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::Hexagon => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                let r = 3.5;
                
                let mut hex_path = String::from("M ");
                for i in 0..6 {
                    let angle = (i as f32 * 60.0 - 30.0).to_radians();
                    let px = cx + r * angle.cos();
                    let py = cy + r * angle.sin();
                    
                    if i == 0 {
                        hex_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        hex_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                hex_path.push_str(" Z");
                path_parts.push(hex_path);
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::Heart => {
                // Marco exterior - corazón con rotación según posición
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                
                // Determinar el ángulo de rotación según la posición del ojo
                let rotation_angle = match eye_type {
                    "top_left" => -std::f32::consts::PI / 4.0,          // -45° en radianes (apunta hacia abajo-derecha)
                    "top_right" => std::f32::consts::PI / 4.0,          // 45° en radianes (apunta hacia abajo-izquierda)
                    "bottom_left" => -std::f32::consts::PI * 3.0 / 4.0, // -135° en radianes (apunta hacia arriba-derecha)
                    _ => 0.0,                                            // 0° en radianes (sin rotación)
                };
                
                // Función para rotar un punto alrededor del centro
                let rotate_point = |px: f32, py: f32, angle: f32| -> (f32, f32) {
                    let cos_a = angle.cos();
                    let sin_a = angle.sin();
                    let dx = px - cx;
                    let dy = py - cy;
                    let rx = dx * cos_a - dy * sin_a + cx;
                    let ry = dx * sin_a + dy * cos_a + cy;
                    (rx, ry)
                };
                
                // Puntos del corazón (orientado hacia abajo inicialmente)
                let points = [
                    (cx, cy - 1.5),           // Valle entre lóbulos
                    (cx, cy - 3.5),           // Control 1
                    (cx - 3.5, cy - 3.5),     // Control 2
                    (cx - 3.5, cy - 1.5),     // Fin lóbulo izquierdo
                    (cx - 3.5, cy + 0.5),     // Control 3
                    (cx, cy + 3.5),           // Control 4
                    (cx, cy + 3.5),           // Punta
                    (cx, cy + 3.5),           // Control 5
                    (cx + 3.5, cy + 0.5),     // Control 6
                    (cx + 3.5, cy - 1.5),     // Fin lóbulo derecho
                    (cx + 3.5, cy - 3.5),     // Control 7
                    (cx, cy - 3.5),           // Control 8
                    (cx, cy - 1.5),           // Vuelta al inicio
                ];
                
                // Rotar todos los puntos
                let rotated: Vec<(f32, f32)> = points.iter()
                    .map(|&(px, py)| rotate_point(px, py, rotation_angle))
                    .collect();
                
                // Construir el path del corazón rotado
                path_parts.push(format!(
                    "M {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     Z",
                    rotated[0].0, rotated[0].1,
                    rotated[1].0, rotated[1].1, rotated[2].0, rotated[2].1, rotated[3].0, rotated[3].1,
                    rotated[4].0, rotated[4].1, rotated[5].0, rotated[5].1, rotated[6].0, rotated[6].1,
                    rotated[7].0, rotated[7].1, rotated[8].0, rotated[8].1, rotated[9].0, rotated[9].1,
                    rotated[10].0, rotated[10].1, rotated[11].0, rotated[11].1, rotated[12].0, rotated[12].1
                ));
                
                // Centro sólido (3x3)
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            // These variants are deprecated and use Square as fallback
            EyeShape::BarsHorizontal | 
            EyeShape::BarsVertical | 
            EyeShape::Shield | 
            EyeShape::Crystal | 
            EyeShape::Flower => {
                // Fallback to square shape
                path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
            EyeShape::Arrow => {
                let cx = x as f32 + 3.5;
                let arrow_width = 4.2;
                let arrow_offset = (7.0 - arrow_width) / 2.0;
                let shaft_width = 2.1;
                let shaft_offset = (7.0 - shaft_width) / 2.0;
                
                path_parts.push(format!(
                    "M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z",
                    cx, y as f32,
                    x as f32 + 7.0, y as f32 + 3.5,
                    x as f32 + 7.0 - arrow_offset, y as f32 + 3.5,
                    x as f32 + 7.0 - arrow_offset, y as f32 + 7.0,
                    x as f32 + arrow_offset, y as f32 + 7.0,
                    x as f32 + arrow_offset, y as f32 + 3.5,
                    x as f32, y as f32 + 3.5
                ));
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", x + 2, y + 2));
            }
        }
        
        path_parts.join(" ")
    }
    
    /// Genera los paths separados para un ojo con estilos de borde y centro separados
    fn generate_eye_paths_separated(&self, region: &EyeRegion, eye_type: &str) -> (String, String, String, String) {
        let border_style = self.customization.as_ref()
            .and_then(|c| c.eye_border_style)
            .unwrap_or(EyeBorderStyle::Square);
        
        let center_style = self.customization.as_ref()
            .and_then(|c| c.eye_center_style)
            .unwrap_or(EyeCenterStyle::Square);
        
        let x = region.x + self.quiet_zone;
        let y = region.y + self.quiet_zone;
        
        // Generar el borde exterior (7x7)
        let border_path = self.generate_eye_border_path(border_style, x, y, eye_type);
        
        // Generar el centro (3x3)
        let center_path = self.generate_eye_center_path(center_style, x + 2, y + 2);
        
        // Retornar también los nombres de los estilos para metadata
        let border_shape = format!("{:?}", border_style);
        let center_shape = format!("{:?}", center_style);
        
        (border_path, center_path, border_shape, center_shape)
    }
    
    /// Genera el path para un ojo con estilos de borde y centro separados (legacy)
    fn generate_eye_path_separated(&self, region: &EyeRegion, eye_type: &str) -> String {
        let (border_path, center_path, _, _) = self.generate_eye_paths_separated(region, eye_type);
        
        // Para compatibilidad hacia atrás, combinar ambos paths
        format!("{} {}", border_path, center_path)
    }
    
    /// Genera el path para el borde de un ojo (marco hueco)
    fn generate_eye_border_path(&self, style: EyeBorderStyle, x: usize, y: usize, eye_type: &str) -> String {
        match style {
            EyeBorderStyle::Square => {
                // Marco cuadrado hueco: perímetro exterior menos agujero interior
                format!("M {} {} h 7 v 7 h -7 Z M {} {} h 5 v 5 h -5 Z", 
                    x, y, x + 1, y + 1)
            }
            EyeBorderStyle::RoundedSquare => {
                // Path exacto proporcionado, escalado de 100x100 a 7x7 unidades
                // Factor de escala: 7/100 = 0.07
                match eye_type {
                    "top_left" => {
                        format!(
                            "M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 6.482, y as f32,                                         // M 92.598,0
                            x as f32 + 6.768, y as f32, x as f32 + 7.0, y as f32 + 0.232, x as f32 + 7.0, y as f32 + 0.518,  // C 96.686,0 100,3.314 100,7.402
                            x as f32 + 7.0, y as f32 + 6.482,                                   // L 100,92.598
                            x as f32 + 7.0, y as f32 + 6.768, x as f32 + 6.768, y as f32 + 7.0, x as f32 + 6.482, y as f32 + 7.0,  // C 100,96.686 96.686,100 92.598,100
                            x as f32 + 0.518, y as f32 + 7.0,                                   // L 7.402,100
                            x as f32 + 0.232, y as f32 + 7.0, x as f32, y as f32 + 6.768, x as f32, y as f32 + 6.482,  // C 3.314,100 0,96.686 0,92.598
                            x as f32, y as f32 + 0.518,                                          // L 0,7.402
                            x as f32, y as f32 + 0.232, x as f32 + 0.232, y as f32, x as f32 + 0.518, y as f32,  // C 0,3.314 3.314,0 7.402,0
                            x as f32 + 6.482, y as f32,                                          // L 92.598,0
                            
                            // Marco interior - hueco
                            x as f32 + 5.498, y as f32 + 0.990,                                  // M 78.536,14.138
                            x as f32 + 1.502, y as f32 + 0.990,                                  // L 21.464,14.138
                            x as f32 + 1.366, y as f32 + 0.990, x as f32 + 1.236, y as f32 + 1.064, x as f32 + 1.160, y as f32 + 1.160,  // C 19.521,14.138 17.658,14.91 16.284,16.284
                            x as f32 + 1.064, y as f32 + 1.236, x as f32 + 0.990, y as f32 + 1.366, x as f32 + 0.990, y as f32 + 1.502,  // C 14.91,17.658 14.138,19.521 14.138,21.464
                            x as f32 + 0.990, y as f32 + 5.498,                                  // L 14.138,78.536
                            x as f32 + 0.990, y as f32 + 5.634, x as f32 + 1.064, y as f32 + 5.764, x as f32 + 1.160, y as f32 + 5.840,  // C 14.138,80.479 14.91,82.342 16.284,83.716
                            x as f32 + 1.236, y as f32 + 5.936, x as f32 + 1.366, y as f32 + 6.010, x as f32 + 1.502, y as f32 + 6.010,  // C 17.658,85.09 19.521,85.862 21.464,85.862
                            x as f32 + 5.498, y as f32 + 6.010,                                  // L 78.536,85.862
                            x as f32 + 5.634, y as f32 + 6.010, x as f32 + 5.764, y as f32 + 5.936, x as f32 + 5.840, y as f32 + 5.840,  // C 80.479,85.862 82.342,85.09 83.716,83.716
                            x as f32 + 5.936, y as f32 + 5.764, x as f32 + 6.010, y as f32 + 5.634, x as f32 + 6.010, y as f32 + 5.498,  // C 85.09,82.342 85.862,80.479 85.862,78.536
                            x as f32 + 6.010, y as f32 + 1.502,                                  // L 85.862,21.464
                            x as f32 + 6.010, y as f32 + 1.366, x as f32 + 5.936, y as f32 + 1.236, x as f32 + 5.840, y as f32 + 1.160,  // C 85.862,19.521 85.09,17.658 83.716,16.284
                            x as f32 + 5.764, y as f32 + 1.064, x as f32 + 5.634, y as f32 + 0.990, x as f32 + 5.498, y as f32 + 0.990   // C 82.342,14.91 80.479,14.138 78.536,14.138
                        )
                    },
                    _ => {
                        // For now, use the same for all positions (TODO: add rotations)
                        format!(
                            "M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 6.482, y as f32,                                         // M 92.598,0
                            x as f32 + 6.768, y as f32, x as f32 + 7.0, y as f32 + 0.232, x as f32 + 7.0, y as f32 + 0.518,  // C 96.686,0 100,3.314 100,7.402
                            x as f32 + 7.0, y as f32 + 6.482,                                   // L 100,92.598
                            x as f32 + 7.0, y as f32 + 6.768, x as f32 + 6.768, y as f32 + 7.0, x as f32 + 6.482, y as f32 + 7.0,  // C 100,96.686 96.686,100 92.598,100
                            x as f32 + 0.518, y as f32 + 7.0,                                   // L 7.402,100
                            x as f32 + 0.232, y as f32 + 7.0, x as f32, y as f32 + 6.768, x as f32, y as f32 + 6.482,  // C 3.314,100 0,96.686 0,92.598
                            x as f32, y as f32 + 0.518,                                          // L 0,7.402
                            x as f32, y as f32 + 0.232, x as f32 + 0.232, y as f32, x as f32 + 0.518, y as f32,  // C 0,3.314 3.314,0 7.402,0
                            x as f32 + 6.482, y as f32,                                          // L 92.598,0
                            
                            // Marco interior - hueco
                            x as f32 + 5.498, y as f32 + 0.990,                                  // M 78.536,14.138
                            x as f32 + 1.502, y as f32 + 0.990,                                  // L 21.464,14.138
                            x as f32 + 1.366, y as f32 + 0.990, x as f32 + 1.236, y as f32 + 1.064, x as f32 + 1.160, y as f32 + 1.160,  // C 19.521,14.138 17.658,14.91 16.284,16.284
                            x as f32 + 1.064, y as f32 + 1.236, x as f32 + 0.990, y as f32 + 1.366, x as f32 + 0.990, y as f32 + 1.502,  // C 14.91,17.658 14.138,19.521 14.138,21.464
                            x as f32 + 0.990, y as f32 + 5.498,                                  // L 14.138,78.536
                            x as f32 + 0.990, y as f32 + 5.634, x as f32 + 1.064, y as f32 + 5.764, x as f32 + 1.160, y as f32 + 5.840,  // C 14.138,80.479 14.91,82.342 16.284,83.716
                            x as f32 + 1.236, y as f32 + 5.936, x as f32 + 1.366, y as f32 + 6.010, x as f32 + 1.502, y as f32 + 6.010,  // C 17.658,85.09 19.521,85.862 21.464,85.862
                            x as f32 + 5.498, y as f32 + 6.010,                                  // L 78.536,85.862
                            x as f32 + 5.634, y as f32 + 6.010, x as f32 + 5.764, y as f32 + 5.936, x as f32 + 5.840, y as f32 + 5.840,  // C 80.479,85.862 82.342,85.09 83.716,83.716
                            x as f32 + 5.936, y as f32 + 5.764, x as f32 + 6.010, y as f32 + 5.634, x as f32 + 6.010, y as f32 + 5.498,  // C 85.09,82.342 85.862,80.479 85.862,78.536
                            x as f32 + 6.010, y as f32 + 1.502,                                  // L 85.862,21.464
                            x as f32 + 6.010, y as f32 + 1.366, x as f32 + 5.936, y as f32 + 1.236, x as f32 + 5.840, y as f32 + 1.160,  // C 85.862,19.521 85.09,17.658 83.716,16.284
                            x as f32 + 5.764, y as f32 + 1.064, x as f32 + 5.634, y as f32 + 0.990, x as f32 + 5.498, y as f32 + 0.990   // C 82.342,14.91 80.479,14.138 78.536,14.138
                        )
                    }
                }
            }
            EyeBorderStyle::Circle => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Marco circular hueco: círculo exterior menos círculo interior
                format!(
                    "M {} {} A 3.5 3.5 0 1 0 {} {} A 3.5 3.5 0 1 0 {} {} Z M {} {} A 2.5 2.5 0 1 0 {} {} A 2.5 2.5 0 1 0 {} {} Z",
                    cx - 3.5, cy, cx + 3.5, cy, cx - 3.5, cy,
                    cx - 2.5, cy, cx + 2.5, cy, cx - 2.5, cy
                )
            }
            EyeBorderStyle::Leaf => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Marco de hoja hueco: forma exterior menos forma interior
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    cx, y as f32,
                    x as f32 + 5.6, y as f32 + 1.4, x as f32 + 7.0, cy,
                    x as f32 + 5.6, y as f32 + 5.6, cx, y as f32 + 7.0,
                    x as f32 + 1.4, y as f32 + 5.6, x as f32, cy,
                    x as f32 + 1.4, y as f32 + 1.4, cx, y as f32,
                    // Interior más pequeño
                    cx, y as f32 + 1.0,
                    x as f32 + 4.6, y as f32 + 2.0, x as f32 + 6.0, cy,
                    x as f32 + 4.6, y as f32 + 5.0, cx, y as f32 + 6.0,
                    x as f32 + 2.4, y as f32 + 5.0, x as f32 + 1.0, cy,
                    x as f32 + 2.4, y as f32 + 2.0, cx, y as f32 + 1.0
                )
            }
            EyeBorderStyle::Star => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                let outer_r = 3.5;
                let inner_r = 1.75;
                
                // Estrella exterior
                let mut star_path = String::from("M ");
                for i in 0..10 {
                    let angle = (i as f32 * 36.0 - 90.0).to_radians();
                    let r = if i % 2 == 0 { outer_r } else { inner_r };
                    let px = cx + r * angle.cos();
                    let py = cy + r * angle.sin();
                    
                    if i == 0 {
                        star_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        star_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                star_path.push_str(" Z");
                
                // Estrella interior (más pequeña)
                star_path.push_str(" M ");
                let outer_r_inner = 2.5;
                let inner_r_inner = 1.25;
                for i in 0..10 {
                    let angle = (i as f32 * 36.0 - 90.0).to_radians();
                    let r = if i % 2 == 0 { outer_r_inner } else { inner_r_inner };
                    let px = cx + r * angle.cos();
                    let py = cy + r * angle.sin();
                    
                    if i == 0 {
                        star_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        star_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                star_path.push_str(" Z");
                star_path
            }
            EyeBorderStyle::Diamond => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Marco de diamante hueco: diamante exterior menos diamante interior
                format!(
                    "M {} {} L {} {} L {} {} L {} {} Z M {} {} L {} {} L {} {} L {} {} Z",
                    cx, y as f32,                    // Diamante exterior
                    x as f32 + 7.0, cy,
                    cx, y as f32 + 7.0,
                    x as f32, cy,
                    cx, y as f32 + 1.0,              // Diamante interior más pequeño
                    x as f32 + 6.0, cy,
                    cx, y as f32 + 6.0,
                    x as f32 + 1.0, cy
                )
            }
            EyeBorderStyle::Cross => {
                // Marco de cruz hueco: cruz exterior menos cruz interior
                let outer_thickness = 7.0 / 3.0;
                let inner_thickness = 3.0 / 3.0;
                let outer_offset = (7.0 - outer_thickness) / 2.0;
                let inner_offset = (7.0 - inner_thickness) / 2.0;
                
                format!(
                    "M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z",
                    // Cruz exterior
                    x as f32 + outer_offset, y as f32,
                    outer_thickness, outer_offset,
                    outer_offset, outer_thickness,
                    outer_offset, outer_offset,
                    outer_thickness, outer_offset,
                    outer_thickness, outer_thickness,
                    outer_offset,
                    // Cruz interior (más pequeña)
                    x as f32 + inner_offset, y as f32 + 1.0,
                    inner_thickness, inner_offset - 1.0,
                    inner_offset - 1.0, inner_thickness,
                    inner_offset - 1.0, inner_offset - 1.0,
                    inner_thickness, inner_offset - 1.0,
                    inner_thickness, inner_thickness,
                    inner_offset - 1.0
                )
            }
            EyeBorderStyle::Hexagon => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                let outer_r = 3.5;
                let inner_r = 2.5;
                
                // Marco hexagonal hueco: hexágono exterior menos hexágono interior
                let mut hex_path = String::from("M ");
                
                // Hexágono exterior
                for i in 0..6 {
                    let angle = (i as f32 * 60.0 - 30.0).to_radians();
                    let px = cx + outer_r * angle.cos();
                    let py = cy + outer_r * angle.sin();
                    
                    if i == 0 {
                        hex_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        hex_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                hex_path.push_str(" Z M ");
                
                // Hexágono interior
                for i in 0..6 {
                    let angle = (i as f32 * 60.0 - 30.0).to_radians();
                    let px = cx + inner_r * angle.cos();
                    let py = cy + inner_r * angle.sin();
                    
                    if i == 0 {
                        hex_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        hex_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                hex_path.push_str(" Z");
                hex_path
            }
            EyeBorderStyle::Arrow => {
                let cx = x as f32 + 3.5;
                let outer_arrow_width = 4.2;
                let outer_arrow_offset = (7.0 - outer_arrow_width) / 2.0;
                let inner_arrow_width = 2.8;
                let inner_arrow_offset = (7.0 - inner_arrow_width) / 2.0;
                
                // Marco de flecha hueco: flecha exterior menos flecha interior
                format!(
                    "M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z",
                    // Flecha exterior
                    cx, y as f32,
                    x as f32 + 7.0, y as f32 + 3.5,
                    x as f32 + 7.0 - outer_arrow_offset, y as f32 + 3.5,
                    x as f32 + 7.0 - outer_arrow_offset, y as f32 + 7.0,
                    x as f32 + outer_arrow_offset, y as f32 + 7.0,
                    x as f32 + outer_arrow_offset, y as f32 + 3.5,
                    x as f32, y as f32 + 3.5,
                    // Flecha interior (más pequeña)
                    cx, y as f32 + 0.8,
                    x as f32 + 6.0, y as f32 + 3.5,
                    x as f32 + 6.0 - inner_arrow_offset, y as f32 + 3.5,
                    x as f32 + 6.0 - inner_arrow_offset, y as f32 + 6.0,
                    x as f32 + inner_arrow_offset + 1.0, y as f32 + 6.0,
                    x as f32 + inner_arrow_offset + 1.0, y as f32 + 3.5,
                    x as f32 + 1.0, y as f32 + 3.5
                )
            }
            EyeBorderStyle::QuarterRound => {
                // Path exacto proporcionado, escalado de 100x100 a 7x7 unidades
                // Original: M90,10C103.333,23.3334 103.333,76.6667 90,90C76.667,103.333 23.333,103.333 10,90C-3.333,76.667 -3.333,23.333 10,10C23.333,-3.333 76.666,-3.333 90,10Z
                // Factor de escala: 7/100 = 0.07
                
                format!(
                    "M {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z M {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z",
                    // Marco exterior - path exacto escalado
                    x as f32 + 6.3, y as f32 + 0.7,                                        // M 90,10 -> 6.3,0.7
                    x as f32 + 7.233, y as f32 + 1.633, x as f32 + 7.233, y as f32 + 5.367, x as f32 + 6.3, y as f32 + 6.3,  // C 103.333,23.3334 103.333,76.6667 90,90
                    x as f32 + 5.367, y as f32 + 7.233, x as f32 + 1.633, y as f32 + 7.233, x as f32 + 0.7, y as f32 + 6.3,  // C 76.667,103.333 23.333,103.333 10,90
                    x as f32 - 0.233, y as f32 + 5.367, x as f32 - 0.233, y as f32 + 1.633, x as f32 + 0.7, y as f32 + 0.7,  // C -3.333,76.667 -3.333,23.333 10,10
                    x as f32 + 1.633, y as f32 - 0.233, x as f32 + 5.367, y as f32 - 0.233, x as f32 + 6.3, y as f32 + 0.7,  // C 23.333,-3.333 76.666,-3.333 90,10
                    // Marco interior - path interior escalado
                    // Original interior: M78.8192,21.1808C69.2128,11.5745 30.7872,11.5744 21.1808,21.1808...
                    x as f32 + 5.517, y as f32 + 1.483,                                    // M 78.8192,21.1808 -> 5.517,1.483
                    x as f32 + 4.845, y as f32 + 0.810, x as f32 + 2.155, y as f32 + 0.810, x as f32 + 1.483, y as f32 + 1.483,  // C 69.2128,11.5745 30.7872,11.5744 21.1808,21.1808
                    x as f32 + 0.810, y as f32 + 2.155, x as f32 + 0.810, y as f32 + 4.845, x as f32 + 1.483, y as f32 + 5.517,  // C 11.5744,30.7872 11.5744,69.2128 21.1808,78.8192
                    x as f32 + 2.155, y as f32 + 6.190, x as f32 + 4.845, y as f32 + 6.190, x as f32 + 5.517, y as f32 + 5.517,  // C 30.7872,88.4256 69.2128,88.4256 78.8192,78.8192
                    x as f32 + 6.190, y as f32 + 4.845, x as f32 + 6.190, y as f32 + 2.155, x as f32 + 5.517, y as f32 + 1.483   // C 88.4256,69.2128 88.4255,30.7872 78.8192,21.1808
                )
            }
            EyeBorderStyle::CutCorner => {
                let cut = 1.2; // Tamaño del corte de esquina
                // Marco con esquinas cortadas diagonalmente
                format!(
                    "M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z",
                    // Marco exterior con esquinas cortadas
                    x as f32 + cut, y,                       // Start (esquina cortada)
                    x as f32 + 7.0 - cut, y,                 // Top line
                    x as f32 + 7.0, y as f32 + cut,         // Top-right cut
                    x as f32 + 7.0, y as f32 + 7.0 - cut,   // Right line
                    x as f32 + 7.0 - cut, y as f32 + 7.0,   // Bottom-right cut
                    x as f32 + cut, y as f32 + 7.0,         // Bottom line
                    x as f32, y as f32 + 7.0 - cut,         // Bottom-left cut
                    x as f32, y as f32 + cut,               // Left line
                    // Marco interior (más pequeño)
                    x as f32 + 1.0 + cut*0.6, y + 1,                  // Start interior
                    x as f32 + 6.0 - cut*0.6, y + 1,                  // Top line interior
                    x as f32 + 6.0, y as f32 + 1.0 + cut*0.6,         // Top-right cut interior
                    x as f32 + 6.0, y as f32 + 6.0 - cut*0.6,         // Right line interior
                    x as f32 + 6.0 - cut*0.6, y as f32 + 6.0,         // Bottom-right cut interior
                    x as f32 + 1.0 + cut*0.6, y as f32 + 6.0,         // Bottom line interior
                    x as f32 + 1.0, y as f32 + 6.0 - cut*0.6,         // Bottom-left cut interior
                    x as f32 + 1.0, y as f32 + 1.0 + cut*0.6          // Left line interior
                )
            }
            EyeBorderStyle::ThickBorder => {
                // Path exacto proporcionado, escalado de 100x100 a 7x7 unidades
                // Factor de escala: 7/100 = 0.07
                match eye_type {
                    "top_left" => {
                        format!(
                            "M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 4.528, y as f32,                                         // M 64.683,0
                            x as f32 + 5.893, y as f32, x as f32 + 7.0, y as f32 + 1.107, x as f32 + 7.0, y as f32 + 2.472,  // C 84.188,0 100,15.812 100,35.317
                            x as f32 + 7.0, y as f32 + 4.528,                                   // L 100,64.683
                            x as f32 + 7.0, y as f32 + 5.893, x as f32 + 5.893, y as f32 + 7.0, x as f32 + 4.528, y as f32 + 7.0,  // C 100,84.188 84.188,100 64.683,100
                            x as f32 + 2.472, y as f32 + 7.0,                                   // L 35.317,100
                            x as f32 + 1.107, y as f32 + 7.0, x as f32, y as f32 + 5.893, x as f32, y as f32 + 4.528,  // C 15.812,100 0,84.188 0,64.683
                            x as f32, y as f32 + 2.472,                                          // L 0,35.317
                            x as f32, y as f32 + 1.107, x as f32 + 1.107, y as f32, x as f32 + 2.472, y as f32,  // C 0,15.812 15.812,0 35.317,0
                            x as f32 + 4.528, y as f32,                                          // L 64.683,0
                            
                            // Marco interior - hueco
                            x as f32 + 4.470, y as f32 + 0.992,                                  // M 63.852,14.168
                            x as f32 + 2.530, y as f32 + 0.992,                                  // L 36.148,14.168
                            x as f32 + 2.122, y as f32 + 0.992, x as f32 + 1.731, y as f32 + 1.154, x as f32 + 1.442, y as f32 + 1.442,  // C 30.319,14.168 24.728,16.484 20.606,20.606
                            x as f32 + 1.154, y as f32 + 1.731, x as f32 + 0.992, y as f32 + 2.122, x as f32 + 0.992, y as f32 + 2.530,  // C 16.484,24.728 14.168,30.319 14.168,36.148
                            x as f32 + 0.992, y as f32 + 4.470,                                  // L 14.168,63.852
                            x as f32 + 0.992, y as f32 + 4.878, x as f32 + 1.154, y as f32 + 5.269, x as f32 + 1.442, y as f32 + 5.558,  // C 14.168,69.681 16.484,75.272 20.606,79.394
                            x as f32 + 1.731, y as f32 + 5.846, x as f32 + 2.122, y as f32 + 6.008, x as f32 + 2.530, y as f32 + 6.008,  // C 24.728,83.516 30.319,85.832 36.148,85.832
                            x as f32 + 4.470, y as f32 + 6.008,                                  // L 63.852,85.832
                            x as f32 + 4.878, y as f32 + 6.008, x as f32 + 5.269, y as f32 + 5.846, x as f32 + 5.558, y as f32 + 5.558,  // C 69.681,85.832 75.272,83.516 79.394,79.394
                            x as f32 + 5.846, y as f32 + 5.269, x as f32 + 6.008, y as f32 + 4.878, x as f32 + 6.008, y as f32 + 4.470,  // C 83.516,75.272 85.832,69.681 85.832,63.852
                            x as f32 + 6.008, y as f32 + 2.530,                                  // L 85.832,36.148
                            x as f32 + 6.008, y as f32 + 2.122, x as f32 + 5.846, y as f32 + 1.731, x as f32 + 5.558, y as f32 + 1.442,  // C 85.832,30.319 83.516,24.728 79.394,20.606
                            x as f32 + 5.269, y as f32 + 1.154, x as f32 + 4.878, y as f32 + 0.992, x as f32 + 4.470, y as f32 + 0.992   // C 75.272,16.484 69.681,14.168 63.852,14.168
                        )
                    },
                    _ => {
                        // For now, use the same for all positions (TODO: add rotations)
                        format!(
                            "M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 4.528, y as f32,                                         // M 64.683,0
                            x as f32 + 5.893, y as f32, x as f32 + 7.0, y as f32 + 1.107, x as f32 + 7.0, y as f32 + 2.472,  // C 84.188,0 100,15.812 100,35.317
                            x as f32 + 7.0, y as f32 + 4.528,                                   // L 100,64.683
                            x as f32 + 7.0, y as f32 + 5.893, x as f32 + 5.893, y as f32 + 7.0, x as f32 + 4.528, y as f32 + 7.0,  // C 100,84.188 84.188,100 64.683,100
                            x as f32 + 2.472, y as f32 + 7.0,                                   // L 35.317,100
                            x as f32 + 1.107, y as f32 + 7.0, x as f32, y as f32 + 5.893, x as f32, y as f32 + 4.528,  // C 15.812,100 0,84.188 0,64.683
                            x as f32, y as f32 + 2.472,                                          // L 0,35.317
                            x as f32, y as f32 + 1.107, x as f32 + 1.107, y as f32, x as f32 + 2.472, y as f32,  // C 0,15.812 15.812,0 35.317,0
                            x as f32 + 4.528, y as f32,                                          // L 64.683,0
                            
                            // Marco interior - hueco
                            x as f32 + 4.470, y as f32 + 0.992,                                  // M 63.852,14.168
                            x as f32 + 2.530, y as f32 + 0.992,                                  // L 36.148,14.168
                            x as f32 + 2.122, y as f32 + 0.992, x as f32 + 1.731, y as f32 + 1.154, x as f32 + 1.442, y as f32 + 1.442,  // C 30.319,14.168 24.728,16.484 20.606,20.606
                            x as f32 + 1.154, y as f32 + 1.731, x as f32 + 0.992, y as f32 + 2.122, x as f32 + 0.992, y as f32 + 2.530,  // C 16.484,24.728 14.168,30.319 14.168,36.148
                            x as f32 + 0.992, y as f32 + 4.470,                                  // L 14.168,63.852
                            x as f32 + 0.992, y as f32 + 4.878, x as f32 + 1.154, y as f32 + 5.269, x as f32 + 1.442, y as f32 + 5.558,  // C 14.168,69.681 16.484,75.272 20.606,79.394
                            x as f32 + 1.731, y as f32 + 5.846, x as f32 + 2.122, y as f32 + 6.008, x as f32 + 2.530, y as f32 + 6.008,  // C 24.728,83.516 30.319,85.832 36.148,85.832
                            x as f32 + 4.470, y as f32 + 6.008,                                  // L 63.852,85.832
                            x as f32 + 4.878, y as f32 + 6.008, x as f32 + 5.269, y as f32 + 5.846, x as f32 + 5.558, y as f32 + 5.558,  // C 69.681,85.832 75.272,83.516 79.394,79.394
                            x as f32 + 5.846, y as f32 + 5.269, x as f32 + 6.008, y as f32 + 4.878, x as f32 + 6.008, y as f32 + 4.470,  // C 83.516,75.272 85.832,69.681 85.832,63.852
                            x as f32 + 6.008, y as f32 + 2.530,                                  // L 85.832,36.148
                            x as f32 + 6.008, y as f32 + 2.122, x as f32 + 5.846, y as f32 + 1.731, x as f32 + 5.558, y as f32 + 1.442,  // C 85.832,30.319 83.516,24.728 79.394,20.606
                            x as f32 + 5.269, y as f32 + 1.154, x as f32 + 4.878, y as f32 + 0.992, x as f32 + 4.470, y as f32 + 0.992   // C 75.272,16.484 69.681,14.168 63.852,14.168
                        )
                    }
                }
            }
            EyeBorderStyle::DoubleBorder => {
                // Path exacto proporcionado, escalado de 100x100 a 7x7 unidades
                // Factor de escala: 7/100 = 0.07
                match eye_type {
                    "top_left" => {
                        // Rotated 90 degrees clockwise from original
                        format!(
                            "M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z",
                            // Marco exterior - rotado 90 grados en sentido horario
                            x as f32 + 7.0, y as f32 + 7.0,                                          // M 100,100 -> 7,7
                            x as f32 + 2.328, y as f32 + 7.0,                                        // L 33.251,100
                            x as f32 + 1.042, y as f32 + 7.0, x as f32, y as f32 + 5.958, x as f32, y as f32 + 4.672,  // C
                            x as f32, y as f32,                                                       // L 0,0
                            x as f32 + 4.672, y as f32,                                               // L 66.749,0
                            x as f32 + 5.958, y as f32, x as f32 + 7.0, y as f32 + 1.042, x as f32 + 7.0, y as f32 + 2.328,  // C
                            x as f32 + 7.0, y as f32 + 7.0,                                          // L 100,100
                            
                            // Marco interior - hueco rotado
                            x as f32 + 5.968, y as f32 + 5.968,                                      // M
                            x as f32 + 5.968, y as f32 + 2.270,                                      // L
                            x as f32 + 5.968, y as f32 + 1.586, x as f32 + 5.414, y as f32 + 1.032, x as f32 + 4.730, y as f32 + 1.032,  // C
                            x as f32 + 1.032, y as f32 + 1.032,                                      // L
                            x as f32 + 1.032, y as f32 + 4.730,                                      // L
                            x as f32 + 1.032, y as f32 + 5.414, x as f32 + 1.586, y as f32 + 5.968, x as f32 + 2.270, y as f32 + 5.968,  // C
                            x as f32 + 5.968, y as f32 + 5.968                                       // L
                        )
                    },
                    "top_right" => {
                        // Rotated 180 degrees from original
                        format!(
                            "M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z",
                            // Marco exterior - rotado 180 grados
                            x as f32, y as f32 + 7.0,                                                // M 0,100
                            x as f32, y as f32 + 2.328,                                              // L 0,33.251
                            x as f32, y as f32 + 1.042, x as f32 + 1.042, y as f32, x as f32 + 2.328, y as f32,  // C
                            x as f32 + 7.0, y as f32,                                                // L 100,0
                            x as f32 + 7.0, y as f32 + 4.672,                                       // L 100,66.749
                            x as f32 + 7.0, y as f32 + 5.958, x as f32 + 5.958, y as f32 + 7.0, x as f32 + 4.672, y as f32 + 7.0,  // C
                            x as f32, y as f32 + 7.0,                                                // L 0,100
                            
                            // Marco interior - hueco rotado 180 grados
                            x as f32 + 1.032, y as f32 + 5.968,                                      // M
                            x as f32 + 4.730, y as f32 + 5.968,                                      // L
                            x as f32 + 5.414, y as f32 + 5.968, x as f32 + 5.968, y as f32 + 5.414, x as f32 + 5.968, y as f32 + 4.730,  // C
                            x as f32 + 5.968, y as f32 + 1.032,                                      // L
                            x as f32 + 2.270, y as f32 + 1.032,                                      // L
                            x as f32 + 1.586, y as f32 + 1.032, x as f32 + 1.032, y as f32 + 1.586, x as f32 + 1.032, y as f32 + 2.270,  // C
                            x as f32 + 1.032, y as f32 + 5.968                                       // L
                        )
                    },
                    "bottom_left" => {
                        // Original orientation (no rotation)
                        format!(
                            "M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z",
                            // Marco exterior - path original sin rotación
                            x as f32 + 7.0, y as f32,                                               // M 100,0
                            x as f32 + 7.0, y as f32 + 4.672,                                       // L 100,66.749
                            x as f32 + 7.0, y as f32 + 5.958, x as f32 + 5.958, y as f32 + 7.0, x as f32 + 4.672, y as f32 + 7.0,  // C 100,85.113 85.113,100 66.749,100
                            x as f32, y as f32 + 7.0,                                                // L 0,100
                            x as f32, y as f32 + 2.328,                                              // L 0,33.251
                            x as f32, y as f32 + 1.042, x as f32 + 1.042, y as f32, x as f32 + 2.328, y as f32,  // C 0,14.887 14.887,0 33.251,0
                            x as f32 + 7.0, y as f32,                                                // L 100,0
                            
                            // Marco interior - hueco sin rotación
                            x as f32 + 5.968, y as f32 + 1.032,                                      // M 85.259,14.741
                            x as f32 + 2.270, y as f32 + 1.032,                                      // L 32.428,14.741
                            x as f32 + 1.586, y as f32 + 1.032, x as f32 + 1.032, y as f32 + 1.586, x as f32 + 1.032, y as f32 + 2.270,  // C 22.66,14.741 14.741,22.66 14.741,32.428
                            x as f32 + 1.032, y as f32 + 5.968,                                      // L 14.741,85.259
                            x as f32 + 4.730, y as f32 + 5.968,                                      // L 67.572,85.259
                            x as f32 + 5.414, y as f32 + 5.968, x as f32 + 5.968, y as f32 + 5.414, x as f32 + 5.968, y as f32 + 4.730,  // C 77.34,85.259 85.259,77.34 85.259,67.572
                            x as f32 + 5.968, y as f32 + 1.032                                       // L 85.259,14.741
                        )
                    },
                    _ => {
                        // Default: same as top_left (rotated 90 degrees)
                        format!(
                            "M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} Z",
                            // Marco exterior - rotado 90 grados en sentido horario
                            x as f32 + 7.0, y as f32 + 7.0,                                          // M 100,100 -> 7,7
                            x as f32 + 2.328, y as f32 + 7.0,                                        // L 33.251,100
                            x as f32 + 1.042, y as f32 + 7.0, x as f32, y as f32 + 5.958, x as f32, y as f32 + 4.672,  // C
                            x as f32, y as f32,                                                       // L 0,0
                            x as f32 + 4.672, y as f32,                                               // L 66.749,0
                            x as f32 + 5.958, y as f32, x as f32 + 7.0, y as f32 + 1.042, x as f32 + 7.0, y as f32 + 2.328,  // C
                            x as f32 + 7.0, y as f32 + 7.0,                                          // L 100,100
                            
                            // Marco interior - hueco rotado
                            x as f32 + 5.968, y as f32 + 5.968,                                      // M
                            x as f32 + 5.968, y as f32 + 2.270,                                      // L
                            x as f32 + 5.968, y as f32 + 1.586, x as f32 + 5.414, y as f32 + 1.032, x as f32 + 4.730, y as f32 + 1.032,  // C
                            x as f32 + 1.032, y as f32 + 1.032,                                      // L
                            x as f32 + 1.032, y as f32 + 4.730,                                      // L
                            x as f32 + 1.032, y as f32 + 5.414, x as f32 + 1.586, y as f32 + 5.968, x as f32 + 2.270, y as f32 + 5.968,  // C
                            x as f32 + 5.968, y as f32 + 5.968                                       // L
                        )
                    }
                }
            }
            
            // ===== FORMAS ORGÁNICAS (FASE 2.1) =====
            EyeBorderStyle::Teardrop => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Gota asimétrica con punta arriba y base redondeada
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    // Exterior (gota completa 7x7)
                    cx, y as f32,                           // Punta superior
                    cx + 2.8, y as f32 + 1.2, cx + 3.5, cy,       // Curva derecha superior
                    cx + 3.5, cy + 2.5, cx, y as f32 + 7.0,       // Base redondeada
                    cx - 3.5, cy + 2.5, cx - 3.5, cy,            // Curva izquierda
                    cx - 2.8, y as f32 + 1.2, cx, y as f32,       // Vuelta a punta
                    
                    // Interior (gota más pequeña 5x5)
                    cx, y as f32 + 1.0,                     // Punta interior
                    cx + 1.8, y as f32 + 1.8, cx + 2.5, cy,       // Curva derecha interior
                    cx + 2.5, cy + 1.5, cx, y as f32 + 6.0,       // Base interior
                    cx - 2.5, cy + 1.5, cx - 2.5, cy,            // Curva izquierda interior
                    cx - 1.8, y as f32 + 1.8, cx, y as f32 + 1.0  // Vuelta a punta interior
                )
            }
            EyeBorderStyle::Wave => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Bordes ondulados como agua - versión simplificada
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    // Exterior ondulado
                    x as f32, cy,                           // Punto izquierdo
                    x as f32 + 1.0, y as f32 + 0.5, cx, y as f32,         // Onda superior
                    x as f32 + 6.0, y as f32 + 0.5, x as f32 + 7.0, cy,   // Curva a derecha
                    x as f32 + 6.0, y as f32 + 6.5, cx, y as f32 + 7.0,   // Onda inferior
                    x as f32 + 1.0, y as f32 + 6.5, x as f32, cy,         // Vuelta a izquierda
                    
                    // Interior ondulado más suave
                    x as f32 + 1.0, cy,                     // Punto izquierdo interior
                    x as f32 + 1.5, y as f32 + 1.2, cx, y as f32 + 1.0,   // Onda superior interior
                    x as f32 + 5.5, y as f32 + 1.2, x as f32 + 6.0, cy,   // Curva derecha interior
                    x as f32 + 5.5, y as f32 + 5.8, cx, y as f32 + 6.0,   // Onda inferior interior
                    x as f32 + 1.5, y as f32 + 5.8, x as f32 + 1.0, cy    // Vuelta interior
                )
            }
            EyeBorderStyle::Petal => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Pétalo de flor suave
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    // Exterior pétalo
                    cx, y as f32,                           // Punta superior
                    x as f32 + 5.5, y as f32 + 1.0, x as f32 + 7.0, cy,   // Curva derecha suave
                    x as f32 + 5.5, y as f32 + 6.0, cx, y as f32 + 7.0,   // Base redondeada
                    x as f32 + 1.5, y as f32 + 6.0, x as f32, cy,         // Curva izquierda
                    x as f32 + 1.5, y as f32 + 1.0, cx, y as f32,         // Vuelta a punta
                    
                    // Interior pétalo más pequeño
                    cx, y as f32 + 1.0,                     // Punta interior
                    x as f32 + 4.5, y as f32 + 1.5, x as f32 + 6.0, cy,   // Curva derecha interior
                    x as f32 + 4.5, y as f32 + 5.5, cx, y as f32 + 6.0,   // Base interior
                    x as f32 + 2.5, y as f32 + 5.5, x as f32 + 1.0, cy,   // Curva izquierda interior
                    x as f32 + 2.5, y as f32 + 1.5, cx, y as f32 + 1.0    // Vuelta interior
                )
            }
            EyeBorderStyle::Crystal => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Cristal facetado con ángulos suaves - versión simplificada
                format!(
                    "M {} {} L {} {} L {} {} L {} {} L {} {} Z M {} {} L {} {} L {} {} L {} {} L {} {} Z",
                    // Exterior cristal - pentágono
                    cx, y as f32,                           // Punta superior
                    x as f32 + 5.5, y as f32 + 1.5,        // Faceta superior derecha
                    x as f32 + 7.0, cy + 0.5,              // Medio derecha
                    x as f32 + 5.5, y as f32 + 5.5,        // Faceta inferior derecha
                    cx, y as f32 + 7.0,                     // Base
                    
                    // Interior cristal
                    cx, y as f32 + 1.0,                     // Punta interior
                    x as f32 + 4.5, y as f32 + 2.0,        // Faceta interior derecha
                    x as f32 + 6.0, cy,                     // Medio derecha interior
                    x as f32 + 4.5, y as f32 + 5.0,        // Faceta inferior interior
                    cx, y as f32 + 6.0                      // Base interior
                )
            }
            EyeBorderStyle::Flame => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Llama estilizada con movimiento
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    // Exterior llama
                    cx, y as f32,                           // Punta de llama
                    cx + 1.5, y as f32 + 0.8, cx + 2.2, y as f32 + 2.0,   // Primera curva derecha
                    cx + 3.5, y as f32 + 3.2, cx + 2.8, y as f32 + 4.5,   // Oscilación derecha
                    cx + 3.0, y as f32 + 6.0, cx, y as f32 + 7.0,         // Base derecha
                    cx - 3.0, y as f32 + 6.0, cx - 1.5, y as f32 + 0.8,   // Base izquierda y vuelta
                    
                    // Interior llama
                    cx, y as f32 + 1.0,                     // Punta interior
                    cx + 1.0, y as f32 + 1.5, cx + 1.5, y as f32 + 2.5,   // Curva interior derecha
                    cx + 2.5, y as f32 + 3.8, cx + 2.0, y as f32 + 5.0,   // Oscilación interior
                    cx + 2.2, y as f32 + 5.8, cx, y as f32 + 6.0,         // Base interior
                    cx - 2.2, y as f32 + 5.8, cx, y as f32 + 1.0          // Base izquierda interior y vuelta
                )
            }
            EyeBorderStyle::Organic => {
                let cx = x as f32 + 3.5;
                let cy = y as f32 + 3.5;
                // Forma orgánica libre con variaciones aleatorias - simplificada
                format!(
                    "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
                    // Exterior orgánico
                    x as f32 + 0.3, cy,                     // Punto izquierdo irregular
                    x as f32 + 1.2, y as f32 + 0.8, cx + 2.2, y as f32 + 0.9, // Curva superior
                    x as f32 + 6.8, y as f32 + 2.1, x as f32 + 6.7, cy + 0.4, // Curva derecha
                    x as f32 + 6.2, y as f32 + 5.8, cx - 0.7, y as f32 + 7.2, // Curva inferior
                    x as f32 + 0.8, y as f32 + 4.9, x as f32 + 0.3, cy,       // Vuelta a izquierda
                    
                    // Interior orgánico
                    x as f32 + 1.2, cy,                     // Punto interior izquierdo
                    x as f32 + 1.8, y as f32 + 1.4, cx + 1.5, y as f32 + 1.5, // Interior superior
                    x as f32 + 5.7, y as f32 + 2.8, x as f32 + 5.8, cy + 0.2, // Interior derecha
                    x as f32 + 5.3, y as f32 + 5.1, cx - 0.4, y as f32 + 6.1, // Interior inferior
                    x as f32 + 1.5, y as f32 + 4.1, x as f32 + 1.2, cy        // Vuelta interior
                )
            }
            EyeBorderStyle::Propuesta01 => {
                // Path exacto proporcionado, escalado de 100x100 a 7x7 unidades
                // Original: M100,99.979L34.507,99.979C15.449,99.979 0,84.53 0,65.472L0,34.486C0,15.429 15.449,-0.021 34.507,-0.021L65.493,-0.021C84.551,-0.021 100,15.429 100,34.486L100,99.979Z
                // Factor de escala: 7/100 = 0.07
                
                match eye_type {
                    "top_left" => {
                        format!(
                            "M {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} Z M {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} C {} {} {} {} {} {} L {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 7.0, y as f32 + 6.999,       // M 100,99.979 -> 7.0,6.999
                            x as f32 + 2.415, y as f32 + 6.999,     // L 34.507,99.979 -> 2.415,6.999
                            x as f32 + 1.081, y as f32 + 6.999, x as f32, y as f32 + 5.917, x as f32, y as f32 + 4.583,  // C 15.449,99.979 0,84.53 0,65.472
                            x as f32, y as f32 + 2.414,             // L 0,34.486 -> 0,2.414
                            x as f32, y as f32 + 1.080, x as f32 + 1.081, y as f32 - 0.001, x as f32 + 2.415, y as f32 - 0.001,  // C 0,15.429 15.449,-0.021 34.507,-0.021
                            x as f32 + 4.585, y as f32 - 0.001,     // L 65.493,-0.021 -> 4.585,-0.001
                            x as f32 + 5.919, y as f32 - 0.001, x as f32 + 7.0, y as f32 + 1.080, x as f32 + 7.0, y as f32 + 2.414,  // C 84.551,-0.021 100,15.429 100,34.486
                            x as f32 + 7.0, y as f32 + 6.999,       // L 100,99.979 -> 7.0,6.999
                            // Marco interior - path interior escalado
                            x as f32 + 5.954, y as f32 + 5.953,     // M 85.06,85.039 -> 5.954,5.953
                            x as f32 + 5.954, y as f32 + 2.408,     // L 85.06,34.397 -> 5.954,2.408
                            x as f32 + 5.954, y as f32 + 2.046, x as f32 + 5.811, y as f32 + 1.699, x as f32 + 5.555, y as f32 + 1.444,  // C 85.06,29.232 83.008,24.277 79.355,20.625
                            x as f32 + 5.299, y as f32 + 1.188, x as f32 + 4.952, y as f32 + 1.044, x as f32 + 4.591, y as f32 + 1.044,  // C 75.702,16.972 70.748,14.92 65.582,14.92
                            x as f32 + 2.409, y as f32 + 1.044,     // L 34.418,14.92 -> 2.409,1.044
                            x as f32 + 2.048, y as f32 + 1.044, x as f32 + 1.701, y as f32 + 1.188, x as f32 + 1.445, y as f32 + 1.444,  // C 29.252,14.92 24.298,16.972 20.645,20.625
                            x as f32 + 1.189, y as f32 + 1.699, x as f32 + 1.046, y as f32 + 2.046, x as f32 + 1.046, y as f32 + 2.408,  // C 16.992,24.277 14.94,29.232 14.94,34.397
                            x as f32 + 1.046, y as f32 + 4.589,     // L 14.94,65.561 -> 1.046,4.589
                            x as f32 + 1.046, y as f32 + 4.951, x as f32 + 1.189, y as f32 + 5.298, x as f32 + 1.445, y as f32 + 5.553,  // C 14.94,70.727 16.992,75.681 20.645,79.334
                            x as f32 + 1.701, y as f32 + 5.809, x as f32 + 2.048, y as f32 + 5.953, x as f32 + 2.409, y as f32 + 5.953,  // C 24.298,82.987 29.252,85.039 34.418,85.039
                            x as f32 + 5.954, y as f32 + 5.953      // L 85.06,85.039 -> 5.954,5.953
                        )
                    },
                    "top_right" => {
                        // Rotación 90° clockwise: x' = 7-y, y' = x
                        format!(
                            "M {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} Z M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} Z",
                            // Marco exterior - rotado 90° clockwise
                            x as f32 + 5.25, y as f32 + 7.0,        // Rotated M 100,25
                            x as f32, y as f32 + 7.0,               // Rotated L 100,100
                            x as f32, y as f32 + 1.75,              // Rotated L 25,100
                            x as f32, y as f32 + 0.784, x as f32 + 0.784, y as f32, x as f32 + 1.75, y as f32,  // Rotated C
                            x as f32 + 5.25, y as f32,              // Rotated L 0,25
                            x as f32 + 6.216, y as f32, x as f32 + 7.0, y as f32 + 0.784, x as f32 + 7.0, y as f32 + 1.75,  // Rotated C
                            x as f32 + 7.0, y as f32 + 5.25,        // Rotated L 75,0
                            x as f32 + 7.0, y as f32 + 6.216, x as f32 + 6.216, y as f32 + 7.0, x as f32 + 5.25, y as f32 + 7.0,  // Rotated C
                            // Marco interior - rotado 90° clockwise
                            x as f32 + 4.749, y as f32 + 5.999,     // Rotated M 85.7,32.15
                            x as f32 + 5.439, y as f32 + 5.999, x as f32 + 5.999, y as f32 + 5.439, x as f32 + 5.999, y as f32 + 4.750,  // Rotated C
                            x as f32 + 5.999, y as f32 + 2.251,     // Rotated L 32.15,14.3
                            x as f32 + 5.999, y as f32 + 1.561, x as f32 + 5.439, y as f32 + 1.001, x as f32 + 4.749, y as f32 + 1.001,  // Rotated C
                            x as f32 + 2.250, y as f32 + 1.001,     // Rotated L 14.3,67.85
                            x as f32 + 1.561, y as f32 + 1.001, x as f32 + 1.001, y as f32 + 1.561, x as f32 + 1.001, y as f32 + 2.251,  // Rotated C
                            x as f32 + 1.001, y as f32 + 6.010,     // Rotated L 85.85,85.7
                            x as f32 + 4.749, y as f32 + 5.999      // Rotated L 85.7,32.15
                        )
                    },
                    "bottom_left" => {
                        // Rotación 270° clockwise (o 90° counter-clockwise): x' = y, y' = 7-x
                        format!(
                            "M {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} Z M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} Z",
                            // Marco exterior - rotado 270° clockwise
                            x as f32 + 1.75, y as f32,              // Rotated M 100,25
                            x as f32 + 7.0, y as f32,               // Rotated L 100,100
                            x as f32 + 7.0, y as f32 + 5.25,        // Rotated L 25,100
                            x as f32 + 7.0, y as f32 + 6.216, x as f32 + 6.216, y as f32 + 7.0, x as f32 + 5.25, y as f32 + 7.0,  // Rotated C
                            x as f32 + 1.75, y as f32 + 7.0,        // Rotated L 0,25
                            x as f32 + 0.784, y as f32 + 7.0, x as f32, y as f32 + 6.216, x as f32, y as f32 + 5.25,  // Rotated C
                            x as f32, y as f32 + 1.75,              // Rotated L 75,0
                            x as f32, y as f32 + 0.784, x as f32 + 0.784, y as f32, x as f32 + 1.75, y as f32,  // Rotated C
                            // Marco interior - rotado 270° clockwise
                            x as f32 + 2.251, y as f32 + 1.001,     // Rotated M 85.7,32.15
                            x as f32 + 1.561, y as f32 + 1.001, x as f32 + 1.001, y as f32 + 1.561, x as f32 + 1.001, y as f32 + 2.250,  // Rotated C
                            x as f32 + 1.001, y as f32 + 4.749,     // Rotated L 32.15,14.3
                            x as f32 + 1.001, y as f32 + 5.439, x as f32 + 1.561, y as f32 + 5.999, x as f32 + 2.251, y as f32 + 5.999,  // Rotated C
                            x as f32 + 4.750, y as f32 + 5.999,     // Rotated L 14.3,67.85
                            x as f32 + 5.439, y as f32 + 5.999, x as f32 + 5.999, y as f32 + 5.439, x as f32 + 5.999, y as f32 + 4.749,  // Rotated C
                            x as f32 + 5.999, y as f32 + 0.99,      // Rotated L 85.85,85.7
                            x as f32 + 2.251, y as f32 + 1.001      // Rotated L 85.7,32.15
                        )
                    },
                    _ => {
                        // Default: use top_left style
                        format!(
                            "M {} {} L {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} Z M {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} C {} {} {} {} {} {} L {} {} L {} {} Z",
                            // Marco exterior - path exacto escalado
                            x as f32 + 7.0, y as f32 + 1.75,        // M 100,25 -> 7.0,1.75
                            x as f32 + 7.0, y as f32 + 7.0,         // L 100,100 -> 7.0,7.0
                            x as f32 + 1.75, y as f32 + 7.0,        // L 25,100 -> 1.75,7.0
                            x as f32 + 0.784, y as f32 + 7.0, x as f32, y as f32 + 6.216, x as f32, y as f32 + 5.25,  // C 11.202,100 0,88.798 0,75 -> 0.784,7.0 0,6.216 0,5.25
                            x as f32, y as f32 + 1.75,              // L 0,25 -> 0,1.75
                            x as f32, y as f32 + 0.784, x as f32 + 0.784, y as f32, x as f32 + 1.75, y as f32,  // C 0,11.202 11.202,0 25,0 -> 0,0.784 0.784,0 1.75,0
                            x as f32 + 5.25, y as f32,              // L 75,0 -> 5.25,0
                            x as f32 + 6.216, y as f32, x as f32 + 7.0, y as f32 + 0.784, x as f32 + 7.0, y as f32 + 1.75,  // C 88.798,0 100,11.202 100,25 -> 6.216,0 7.0,0.784 7.0,1.75
                            // Marco interior - path interior escalado
                            x as f32 + 5.999, y as f32 + 2.251,     // M 85.7,32.15 -> 5.999,2.251
                            x as f32 + 5.999, y as f32 + 1.561, x as f32 + 5.439, y as f32 + 1.001, x as f32 + 4.750, y as f32 + 1.001,  // C 85.7,22.298 77.702,14.3 67.85,14.3
                            x as f32 + 2.251, y as f32 + 1.001,     // L 32.15,14.3 -> 2.251,1.001
                            x as f32 + 1.561, y as f32 + 1.001, x as f32 + 1.001, y as f32 + 1.561, x as f32 + 1.001, y as f32 + 2.251,  // C 22.298,14.3 14.3,22.298 14.3,32.15
                            x as f32 + 1.001, y as f32 + 4.750,     // L 14.3,67.85 -> 1.001,4.750
                            x as f32 + 1.001, y as f32 + 5.439, x as f32 + 1.561, y as f32 + 5.999, x as f32 + 2.251, y as f32 + 5.999,  // C 14.3,77.702 22.298,85.7 32.15,85.7
                            x as f32 + 6.010, y as f32 + 5.999,     // L 85.85,85.7 -> 6.010,5.999
                            x as f32 + 5.999, y as f32 + 2.251      // L 85.7,32.15 -> 5.999,2.251
                        )
                    }
                }
            }
        }
    }
    
    /// Genera el path para el centro de un ojo
    fn generate_eye_center_path(&self, style: EyeCenterStyle, x: usize, y: usize) -> String {
        match style {
            EyeCenterStyle::Square => {
                format!("M {} {} h 3 v 3 h -3 Z", x, y)
            }
            EyeCenterStyle::RoundedSquare => {
                format!(
                    "M {:.1} {} h 1.6 a 0.7 0.7 0 0 1 0.7 0.7 v 1.6 a 0.7 0.7 0 0 1 -0.7 0.7 h -1.6 a 0.7 0.7 0 0 1 -0.7 -0.7 v -1.6 a 0.7 0.7 0 0 1 0.7 -0.7 Z",
                    x as f32 + 0.7, y
                )
            }
            EyeCenterStyle::Circle => {
                let cx = x as f32 + 1.5;
                let cy = y as f32 + 1.5;
                format!(
                    "M {} {} A 1.5 1.5 0 1 0 {} {} A 1.5 1.5 0 1 0 {} {} Z",
                    cx - 1.5, cy, cx + 1.5, cy, cx - 1.5, cy
                )
            }
            EyeCenterStyle::Dot => {
                let cx = x as f32 + 1.5;
                let cy = y as f32 + 1.5;
                let r = 0.75;
                format!(
                    "M {} {} A {} {} 0 1 0 {} {} A {} {} 0 1 0 {} {} Z",
                    cx - r, cy, r, r, cx + r, cy, r, r, cx - r, cy
                )
            }
            EyeCenterStyle::Star => {
                // Estrella EXACTA del usuario - M67.833,16.838C68.304,15.737 69.386,15.023 70.583,15.023C71.78,15.023 72.862,15.737 73.333,16.838L79.521,31.297L95.185,32.713C96.377,32.821 97.39,33.63 97.76,34.768C98.13,35.907 97.785,37.156 96.884,37.945L85.045,48.297L88.538,63.632C88.804,64.799 88.348,66.013 87.379,66.717C86.411,67.42 85.116,67.479 84.088,66.865L70.583,58.804L57.079,66.865C56.05,67.479 54.756,67.42 53.787,66.717C52.818,66.013 52.363,64.799 52.629,63.632L56.122,48.297L44.282,37.945C43.381,37.156 43.036,35.907 43.406,34.768C43.776,33.63 44.79,32.821 45.982,32.713L61.646,31.297L67.833,16.838Z
                let base_x = x as f32;
                let base_y = y as f32;
                
                // Escalado del rango original para centrar en celda 3x3 con espaciado sutil
                let scale = 2.7 / 55.0; // Factor de escala reducido 10% para espaciado sutil
                let sc = |coord: f32| -> f32 { (coord - 43.0) * scale + base_x + 0.15 };
                let scy = |coord: f32| -> f32 { (coord - 15.0) * scale + base_y + 0.15 };
                
                // Construir el path EXACTO por concatenación
                let mut path = String::new();
                
                // M67.833,16.838
                path.push_str(&format!("M{},{}", sc(67.833), scy(16.838)));
                
                // C68.304,15.737 69.386,15.023 70.583,15.023
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(68.304), scy(15.737), sc(69.386), scy(15.023), sc(70.583), scy(15.023)));
                
                // C71.78,15.023 72.862,15.737 73.333,16.838
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(71.78), scy(15.023), sc(72.862), scy(15.737), sc(73.333), scy(16.838)));
                
                // L79.521,31.297
                path.push_str(&format!("L{},{}", sc(79.521), scy(31.297)));
                
                // L95.185,32.713
                path.push_str(&format!("L{},{}", sc(95.185), scy(32.713)));
                
                // C96.377,32.821 97.39,33.63 97.76,34.768
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(96.377), scy(32.821), sc(97.39), scy(33.63), sc(97.76), scy(34.768)));
                
                // C98.13,35.907 97.785,37.156 96.884,37.945
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(98.13), scy(35.907), sc(97.785), scy(37.156), sc(96.884), scy(37.945)));
                
                // L85.045,48.297
                path.push_str(&format!("L{},{}", sc(85.045), scy(48.297)));
                
                // L88.538,63.632
                path.push_str(&format!("L{},{}", sc(88.538), scy(63.632)));
                
                // C88.804,64.799 88.348,66.013 87.379,66.717
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(88.804), scy(64.799), sc(88.348), scy(66.013), sc(87.379), scy(66.717)));
                
                // C86.411,67.42 85.116,67.479 84.088,66.865
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(86.411), scy(67.42), sc(85.116), scy(67.479), sc(84.088), scy(66.865)));
                
                // L70.583,58.804
                path.push_str(&format!("L{},{}", sc(70.583), scy(58.804)));
                
                // L57.079,66.865
                path.push_str(&format!("L{},{}", sc(57.079), scy(66.865)));
                
                // C56.05,67.479 54.756,67.42 53.787,66.717
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(56.05), scy(67.479), sc(54.756), scy(67.42), sc(53.787), scy(66.717)));
                
                // C52.818,66.013 52.363,64.799 52.629,63.632
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(52.818), scy(66.013), sc(52.363), scy(64.799), sc(52.629), scy(63.632)));
                
                // L56.122,48.297
                path.push_str(&format!("L{},{}", sc(56.122), scy(48.297)));
                
                // L44.282,37.945
                path.push_str(&format!("L{},{}", sc(44.282), scy(37.945)));
                
                // C43.381,37.156 43.036,35.907 43.406,34.768
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(43.381), scy(37.156), sc(43.036), scy(35.907), sc(43.406), scy(34.768)));
                
                // C43.776,33.63 44.79,32.821 45.982,32.713
                path.push_str(&format!("C{},{} {},{} {},{}",
                    sc(43.776), scy(33.63), sc(44.79), scy(32.821), sc(45.982), scy(32.713)));
                
                // L61.646,31.297
                path.push_str(&format!("L{},{}", sc(61.646), scy(31.297)));
                
                // Z para cerrar
                path.push_str("Z");
                
                path
            }
            EyeCenterStyle::Diamond => {
                let cx = x as f32 + 1.5;
                let cy = y as f32 + 1.5;
                format!(
                    "M {} {} L {} {} L {} {} L {} {} Z",
                    cx, y as f32,
                    x as f32 + 3.0, cy,
                    cx, y as f32 + 3.0,
                    x as f32, cy
                )
            }
            EyeCenterStyle::Cross => {
                let thickness = 3.0 / 3.0;
                let offset = (3.0 - thickness) / 2.0;
                format!(
                    "M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z",
                    x as f32 + offset, y as f32,
                    thickness, offset,
                    offset, thickness,
                    offset, offset,
                    thickness, offset,
                    thickness, thickness,
                    offset
                )
            }
            EyeCenterStyle::Plus => {
                // Corazón para el centro del ojo
                let cx = x as f32 + 1.5;
                let cy = y as f32 + 1.5;
                let scale = 1.2; // Escala más grande para llenar mejor el área 3x3
                
                // Corazón usando curvas Bézier
                format!(
                    "M {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     C {:.2} {:.2} {:.2} {:.2} {:.2} {:.2} \
                     Z",
                    // Punto inicial (parte inferior del corazón)
                    cx, cy + 1.2 * scale,
                    // Lóbulo izquierdo
                    cx - 1.5 * scale, cy + 1.0 * scale,
                    cx - 1.8 * scale, cy - 0.5 * scale,
                    cx - 1.0 * scale, cy - 0.8 * scale,
                    // Parte superior izquierda
                    cx - 0.5 * scale, cy - 1.0 * scale,
                    cx, cy - 0.5 * scale,
                    cx, cy - 0.8 * scale,
                    // Parte superior derecha
                    cx, cy - 0.5 * scale,
                    cx + 0.5 * scale, cy - 1.0 * scale,
                    cx + 1.0 * scale, cy - 0.8 * scale,
                    // Lóbulo derecho
                    cx + 1.8 * scale, cy - 0.5 * scale,
                    cx + 1.5 * scale, cy + 1.0 * scale,
                    cx, cy + 1.2 * scale
                )
            }
            EyeCenterStyle::Squircle => {
                // Squircle para el centro del ojo usando el path correcto
                // Escalado de 100x100 a 3x3 unidades y centrado
                let scale = 0.03;
                let offset_x = x as f32 + 1.5 - 50.0 * scale; // Centrar en x+1.5 
                let offset_y = y as f32 + 1.5 - 50.0 * scale; // Centrar en y+1.5
                
                // Path del squircle escalado y centrado en el área 3x3
                format!(
                    "M{:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}C{:.3},{:.3} {:.3},{:.3} {:.3},{:.3}Z",
                    offset_x + 5.267 * scale, offset_y + 18.67 * scale,
                    offset_x + 7.407 * scale, offset_y + 12.384 * scale, offset_x + 12.344 * scale, offset_y + 7.447 * scale, offset_x + 18.63 * scale, offset_y + 5.307 * scale,
                    offset_x + 38.491 * scale, offset_y + -1.407 * scale, offset_x + 61.492 * scale, offset_y + -1.407 * scale, offset_x + 81.353 * scale, offset_y + 5.307 * scale,
                    offset_x + 87.64 * scale, offset_y + 7.447 * scale, offset_x + 92.577 * scale, offset_y + 12.384 * scale, offset_x + 94.716 * scale, offset_y + 18.67 * scale,
                    offset_x + 101.43 * scale, offset_y + 38.531 * scale, offset_x + 101.43 * scale, offset_y + 61.532 * scale, offset_x + 94.716 * scale, offset_y + 81.393 * scale,
                    offset_x + 92.577 * scale, offset_y + 87.68 * scale, offset_x + 87.64 * scale, offset_y + 92.617 * scale, offset_x + 81.353 * scale, offset_y + 94.756 * scale,
                    offset_x + 61.492 * scale, offset_y + 101.47 * scale, offset_x + 38.491 * scale, offset_y + 101.47 * scale, offset_x + 18.63 * scale, offset_y + 94.756 * scale,
                    offset_x + 12.344 * scale, offset_y + 92.617 * scale, offset_x + 7.407 * scale, offset_y + 87.68 * scale, offset_x + 5.267 * scale, offset_y + 81.393 * scale,
                    offset_x + -1.447 * scale, offset_y + 61.532 * scale, offset_x + -1.447 * scale, offset_y + 38.531 * scale, offset_x + 5.267 * scale, offset_y + 18.67 * scale
                )
            }
        }
    }
    
    /// Genera el path para un ojo específico (implementación anterior para compatibilidad)
    fn generate_eye_path_legacy(&self, region: &EyeRegion) -> String {
        let eye_shape = self.customization.as_ref()
            .and_then(|c| c.eye_shape)
            .unwrap_or(EyeShape::Square);
        
        match eye_shape {
            EyeShape::Dot => {
                let mut path = String::new();
                
                // Marco exterior (7x7) - cuadrado con esquinas ligeramente redondeadas
                let outer_x = (region.x + self.quiet_zone) as f32;
                let outer_y = (region.y + self.quiet_zone) as f32;
                let outer_size = 7.0;
                
                // Renderizar el marco exterior completo como un path
                path.push_str(&format!(
                    "M{} {}h{}v{}h-{}z",
                    outer_x, outer_y, outer_size, outer_size, outer_size
                ));
                
                // Interior (3x3) - círculo
                let inner_x = outer_x + 2.0;
                let inner_y = outer_y + 2.0;
                let inner_size = 3.0;
                let center_x = inner_x + inner_size / 2.0;
                let center_y = inner_y + inner_size / 2.0;
                let radius = inner_size / 2.0;
                
                // Agregar el círculo interior
                path.push_str(&format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                    center_x, center_y, radius, radius, radius, radius * 2.0, radius, radius, radius * 2.0
                ));
                
                path
            },
            EyeShape::Circle => {
                let mut path = String::new();
                
                // Marco exterior circular
                let outer_x = (region.x + self.quiet_zone) as f32;
                let outer_y = (region.y + self.quiet_zone) as f32;
                let outer_size = 7.0;
                let center_x = outer_x + outer_size / 2.0;
                let center_y = outer_y + outer_size / 2.0;
                let radius = outer_size / 2.0;
                
                path.push_str(&format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                    center_x, center_y, radius, radius, radius, radius * 2.0, radius, radius, radius * 2.0
                ));
                
                // Interior circular
                let inner_radius = 1.5;
                path.push_str(&format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                    center_x, center_y, inner_radius, inner_radius, inner_radius, inner_radius * 2.0, inner_radius, inner_radius, inner_radius * 2.0
                ));
                
                path
            },
            EyeShape::Leaf => {
                let mut path = String::new();
                
                // Marco exterior en forma de hoja
                let outer_x = (region.x + self.quiet_zone) as f32;
                let outer_y = (region.y + self.quiet_zone) as f32;
                let outer_size = 7.0;
                let cx = outer_x + outer_size / 2.0;
                let cy = outer_y + outer_size / 2.0;
                
                // Path de hoja para el marco exterior
                path.push_str(&format!(
                    "M{} {}Q{} {} {} {}Q{} {} {} {}Q{} {} {} {}Q{} {} {} {}z",
                    cx, outer_y,
                    outer_x + outer_size * 0.8, outer_y + outer_size * 0.2, outer_x + outer_size, cy,
                    outer_x + outer_size * 0.8, outer_y + outer_size * 0.8, cx, outer_y + outer_size,
                    outer_x + outer_size * 0.2, outer_y + outer_size * 0.8, outer_x, cy,
                    outer_x + outer_size * 0.2, outer_y + outer_size * 0.2, cx, outer_y
                ));
                
                // Interior - círculo más pequeño
                let inner_x = outer_x + 2.0;
                let inner_y = outer_y + 2.0;
                let inner_size = 3.0;
                let inner_cx = inner_x + inner_size / 2.0;
                let inner_cy = inner_y + inner_size / 2.0;
                let inner_r = inner_size / 2.0;
                
                path.push_str(&format!(
                    "M{} {}m-{} 0a{} {} 0 1 0 {} 0a{} {} 0 1 0 -{} 0",
                    inner_cx, inner_cy, inner_r, inner_r, inner_r, inner_r * 2.0, inner_r, inner_r, inner_r * 2.0
                ));
                
                path
            },
            _ => {
                // Fallback to default square rendering
                let mut path = String::new();
                for y in region.y..region.y + region.size {
                    for x in region.x..region.x + region.size {
                        if self.matrix[y][x] {
                            let x_pos = x + self.quiet_zone;
                            let y_pos = y + self.quiet_zone;
                            path.push_str(&format!("M{} {}h1v1H{}z", x_pos, y_pos, x_pos));
                        }
                    }
                }
                path
            }
        }
    }
    
    /// Construye el objeto de estilos
    fn build_styles(&self) -> crate::engine::types::QrStyles {
        let custom = self.customization.as_ref();
        
        // Estilo para datos
        let data_fill = if let Some(gradient) = custom.and_then(|c| c.gradient.as_ref()) {
            if gradient.enabled && gradient.apply_to_data {
                "url(#grad_data)".to_string()
            } else {
                custom.and_then(|c| c.colors.as_ref())
                    .map(|colors| colors.foreground.clone())
                    .unwrap_or_else(|| "#000000".to_string())
            }
        } else {
            custom.and_then(|c| c.colors.as_ref())
                .map(|colors| colors.foreground.clone())
                .unwrap_or_else(|| "#000000".to_string())
        };
        
        // Estilo para ojos
        let eyes_fill = if let Some(gradient) = custom.and_then(|c| c.gradient.as_ref()) {
            if gradient.enabled && gradient.apply_to_eyes {
                "url(#grad_eyes)".to_string()
            } else {
                // Check for eye_colors first, then fall back to foreground color
                custom.and_then(|c| c.colors.as_ref())
                    .and_then(|colors| colors.eye_colors.as_ref())
                    .and_then(|eye_colors| eye_colors.outer.clone())
                    .or_else(|| {
                        custom.and_then(|c| c.colors.as_ref())
                            .map(|colors| colors.foreground.clone())
                    })
                    .unwrap_or_else(|| data_fill.clone())
            }
        } else {
            // Check for eye_colors first, then fall back to foreground color
            custom.and_then(|c| c.colors.as_ref())
                .and_then(|colors| colors.eye_colors.as_ref())
                .and_then(|eye_colors| eye_colors.outer.clone())
                .or_else(|| {
                    custom.and_then(|c| c.colors.as_ref())
                        .map(|colors| colors.foreground.clone())
                })
                .unwrap_or_else(|| data_fill.clone())
        };
        
        // Efectos
        let effects: Vec<String> = custom.and_then(|c| c.effects.as_ref())
            .map(|effects| {
                effects.iter()
                    .filter_map(|e| {
                        match e.effect_type {
                            crate::engine::types::Effect::Shadow => Some("filter_shadow".to_string()),
                            crate::engine::types::Effect::Glow => Some("filter_glow".to_string()),
                            _ => None,
                        }
                    })
                    .collect()
            })
            .unwrap_or_default();
        
        // Determinar si aplicar stroke
        let stroke_style = custom
            .and_then(|c| c.gradient.as_ref())
            .and_then(|g| g.stroke_style.as_ref())
            .cloned();
        
        crate::engine::types::QrStyles {
            data: crate::engine::types::QrStyleConfig {
                fill: data_fill,
                effects: effects.clone(),
                shape: custom.and_then(|c| c.data_pattern)
                    .map(|pattern| format!("{:?}", pattern)),
                stroke: stroke_style.clone(),
            },
            eyes: crate::engine::types::QrStyleConfig {
                fill: eyes_fill,
                effects,
                shape: custom.and_then(|c| c.eye_shape)
                    .map(|shape| format!("{:?}", shape)),
                stroke: stroke_style,
            },
        }
    }
    
    /// Construye las definiciones (gradientes, efectos)
    fn build_definitions(&self) -> Vec<crate::engine::types::QrDefinition> {
        let mut definitions = Vec::new();
        let custom = self.customization.as_ref();
        
        // Agregar gradientes si están habilitados
        if let Some(gradient) = custom.and_then(|c| c.gradient.as_ref()) {
            if gradient.enabled {
                // Limitar a 5 stops máximo
                let colors: Vec<String> = gradient.colors.iter()
                    .take(5)
                    .cloned()
                    .collect();
                
                // Gradiente para datos
                if gradient.apply_to_data {
                    if gradient.per_module {
                        // Para gradiente por módulo, crear un gradiente que se repetirá en cada módulo
                        definitions.push(crate::engine::types::QrDefinition::Gradient(
                            crate::engine::types::QrGradientDef {
                                id: "grad_data".to_string(),
                                gradient_type: format!("{:?}", gradient.gradient_type).to_lowercase(),
                                colors: colors.clone(),
                                angle: gradient.angle,
                                coords: match gradient.gradient_type {
                                    crate::engine::types::GradientType::Radial => {
                                        Some(crate::engine::types::GradientCoords {
                                            x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5,
                                        })
                                    },
                                    _ => None,
                                },
                                per_module: Some(true),
                            }
                        ));
                    } else {
                        // Gradiente continuo a través de todos los módulos
                        definitions.push(crate::engine::types::QrDefinition::Gradient(
                            crate::engine::types::QrGradientDef {
                                id: "grad_data".to_string(),
                                gradient_type: format!("{:?}", gradient.gradient_type).to_lowercase(),
                                colors: colors.clone(),
                                angle: gradient.angle,
                                coords: match gradient.gradient_type {
                                    crate::engine::types::GradientType::Radial => {
                                        Some(crate::engine::types::GradientCoords {
                                            x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0,
                                        })
                                    },
                                    _ => None,
                                },
                                per_module: Some(false),
                            }
                        ));
                    }
                }
                
                // Gradiente para ojos
                if gradient.apply_to_eyes {
                    definitions.push(crate::engine::types::QrDefinition::Gradient(
                        crate::engine::types::QrGradientDef {
                            id: "grad_eyes".to_string(),
                            gradient_type: format!("{:?}", gradient.gradient_type).to_lowercase(),
                            colors,
                            angle: gradient.angle,
                            coords: None,
                            per_module: None,
                        }
                    ));
                }
            }
        }
        
        // Agregar gradientes específicos para bordes de ojos
        if let Some(eye_border_gradient) = custom.and_then(|c| c.eye_border_gradient.as_ref()) {
            if eye_border_gradient.enabled {
                let colors: Vec<String> = eye_border_gradient.colors.iter()
                    .take(5)
                    .cloned()
                    .collect();
                    
                definitions.push(crate::engine::types::QrDefinition::Gradient(
                    crate::engine::types::QrGradientDef {
                        id: "grad_eye_border".to_string(),
                        gradient_type: format!("{:?}", eye_border_gradient.gradient_type).to_lowercase(),
                        colors,
                        angle: eye_border_gradient.angle,
                        coords: match eye_border_gradient.gradient_type {
                            crate::engine::types::GradientType::Radial => {
                                Some(crate::engine::types::GradientCoords {
                                    x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0,
                                })
                            },
                            _ => None,
                        },
                        per_module: None,
                    }
                ));
            }
        }
        
        // Agregar gradientes específicos para centros de ojos
        if let Some(eye_center_gradient) = custom.and_then(|c| c.eye_center_gradient.as_ref()) {
            if eye_center_gradient.enabled {
                let colors: Vec<String> = eye_center_gradient.colors.iter()
                    .take(5)
                    .cloned()
                    .collect();
                    
                definitions.push(crate::engine::types::QrDefinition::Gradient(
                    crate::engine::types::QrGradientDef {
                        id: "grad_eye_center".to_string(),
                        gradient_type: format!("{:?}", eye_center_gradient.gradient_type).to_lowercase(),
                        colors,
                        angle: eye_center_gradient.angle,
                        coords: match eye_center_gradient.gradient_type {
                            crate::engine::types::GradientType::Radial => {
                                Some(crate::engine::types::GradientCoords {
                                    x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5,  // Más centrado para el centro del ojo
                                })
                            },
                            _ => None,
                        },
                        per_module: None,
                    }
                ));
            }
        }
        
        // Agregar gradientes desde eye_colors si existen
        if let Some(eye_colors) = custom.and_then(|c| c.colors.as_ref()).and_then(|c| c.eye_colors.as_ref()) {
            // Gradiente para borde exterior desde eye_colors
            if let Some(outer_gradient) = &eye_colors.outer_gradient {
                if outer_gradient.enabled {
                    let colors: Vec<String> = outer_gradient.colors.iter()
                        .take(5)
                        .cloned()
                        .collect();
                        
                    definitions.push(crate::engine::types::QrDefinition::Gradient(
                        crate::engine::types::QrGradientDef {
                            id: "grad_eye_outer".to_string(),
                            gradient_type: format!("{:?}", outer_gradient.gradient_type).to_lowercase(),
                            colors,
                            angle: outer_gradient.angle,
                            coords: match outer_gradient.gradient_type {
                                crate::engine::types::GradientType::Radial => {
                                    Some(crate::engine::types::GradientCoords {
                                        x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0,
                                    })
                                },
                                _ => None,
                            },
                            per_module: None,
                        }
                    ));
                }
            }
            
            // Gradiente para centro interior desde eye_colors
            if let Some(inner_gradient) = &eye_colors.inner_gradient {
                if inner_gradient.enabled {
                    let colors: Vec<String> = inner_gradient.colors.iter()
                        .take(5)
                        .cloned()
                        .collect();
                        
                    definitions.push(crate::engine::types::QrDefinition::Gradient(
                        crate::engine::types::QrGradientDef {
                            id: "grad_eye_inner".to_string(),
                            gradient_type: format!("{:?}", inner_gradient.gradient_type).to_lowercase(),
                            colors,
                            angle: inner_gradient.angle,
                            coords: match inner_gradient.gradient_type {
                                crate::engine::types::GradientType::Radial => {
                                    Some(crate::engine::types::GradientCoords {
                                        x1: 0.5, y1: 0.5, x2: 0.5, y2: 0.5,
                                    })
                                },
                                _ => None,
                            },
                            per_module: None,
                        }
                    ));
                }
            }
        }
        
        // Agregar efectos
        if let Some(effects) = custom.and_then(|c| c.effects.as_ref()) {
            for effect_opt in effects {
                match effect_opt.effect_type {
                    crate::engine::types::Effect::Shadow => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_shadow".to_string(),
                                effect_type: "shadow".to_string(),
                                params: serde_json::json!({
                                    "dx": 1,
                                    "dy": 1,
                                    "stdDeviation": 0.5,
                                    "opacity": 0.3
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Glow => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_glow".to_string(),
                                effect_type: "glow".to_string(),
                                params: serde_json::json!({
                                    "stdDeviation": 2,
                                    "color": match &effect_opt.config {
                                        crate::engine::types::EffectConfiguration::Glow { color, .. } => color.clone().unwrap_or_else(|| "#ffff00".to_string()),
                                        _ => "#ffff00".to_string(),
                                    }
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Blur => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_blur".to_string(),
                                effect_type: "blur".to_string(),
                                params: serde_json::json!({
                                    "stdDeviation": 2,
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Noise => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_noise".to_string(),
                                effect_type: "noise".to_string(),
                                params: serde_json::json!({
                                    "baseFrequency": 0.2,
                                    "numOctaves": 3,
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Vintage => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_vintage".to_string(),
                                effect_type: "vintage".to_string(),
                                params: serde_json::json!({
                                    "sepia_intensity": 0.8,
                                    "vignette_intensity": 0.4,
                                }),
                            }
                        ));
                    },
                    // Nuevos efectos Fase 2.2
                    crate::engine::types::Effect::Distort => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_distort".to_string(),
                                effect_type: "distort".to_string(),
                                params: serde_json::json!({
                                    "baseFrequency": 0.02,
                                    "scale": 10,
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Emboss => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_emboss".to_string(),
                                effect_type: "emboss".to_string(),
                                params: serde_json::json!({
                                    "kernelMatrix": "-2 -1 0 -1 1 1 0 1 2",
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::Outline => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_outline".to_string(),
                                effect_type: "outline".to_string(),
                                params: serde_json::json!({
                                    "radius": 1,
                                    "color": "black",
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::DropShadow => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_drop_shadow".to_string(),
                                effect_type: "drop_shadow".to_string(),
                                params: serde_json::json!({
                                    "dx": 2,
                                    "dy": 2,
                                    "stdDeviation": 3,
                                    "opacity": 0.3,
                                }),
                            }
                        ));
                    },
                    crate::engine::types::Effect::InnerShadow => {
                        definitions.push(crate::engine::types::QrDefinition::Effect(
                            crate::engine::types::QrEffectDef {
                                id: "filter_inner_shadow".to_string(),
                                effect_type: "inner_shadow".to_string(),
                                params: serde_json::json!({
                                    "dx": 2,
                                    "dy": 2,
                                    "stdDeviation": 3,
                                    "opacity": 0.3,
                                }),
                            }
                        ));
                    },
                }
            }
        }
        
        // Agregar efectos selectivos (Fase 2.2)
        if let Some(selective_effects) = custom.and_then(|c| c.selective_effects.as_ref()) {
            // Efectos para los ojos
            if let Some(eyes_effects) = &selective_effects.eyes {
                for (idx, effect_opt) in eyes_effects.effects.iter().enumerate() {
                    let effect_id = format!("filter_eyes_{}_{}", 
                        format!("{:?}", effect_opt.effect_type).to_lowercase(), idx);
                    
                    definitions.push(crate::engine::types::QrDefinition::Effect(
                        crate::engine::types::QrEffectDef {
                            id: effect_id,
                            effect_type: format!("{:?}", effect_opt.effect_type).to_lowercase(),
                            params: serde_json::json!({
                                "component": "eyes",
                                "blend_mode": eyes_effects.blend_mode.as_ref()
                                    .map(|b| format!("{:?}", b).to_lowercase())
                                    .unwrap_or_else(|| "normal".to_string()),
                                "render_priority": eyes_effects.render_priority.unwrap_or(5),
                                "apply_to_fill": eyes_effects.apply_to_fill.unwrap_or(true),
                                "apply_to_stroke": eyes_effects.apply_to_stroke.unwrap_or(false),
                            }),
                        }
                    ));
                }
            }
            
            // Efectos para los datos
            if let Some(data_effects) = &selective_effects.data {
                for (idx, effect_opt) in data_effects.effects.iter().enumerate() {
                    let effect_id = format!("filter_data_{}_{}", 
                        format!("{:?}", effect_opt.effect_type).to_lowercase(), idx);
                    
                    definitions.push(crate::engine::types::QrDefinition::Effect(
                        crate::engine::types::QrEffectDef {
                            id: effect_id,
                            effect_type: format!("{:?}", effect_opt.effect_type).to_lowercase(),
                            params: serde_json::json!({
                                "component": "data",
                                "blend_mode": data_effects.blend_mode.as_ref()
                                    .map(|b| format!("{:?}", b).to_lowercase())
                                    .unwrap_or_else(|| "normal".to_string()),
                                "render_priority": data_effects.render_priority.unwrap_or(5),
                                "apply_to_fill": data_effects.apply_to_fill.unwrap_or(true),
                                "apply_to_stroke": data_effects.apply_to_stroke.unwrap_or(false),
                            }),
                        }
                    ));
                }
            }
            
            // Efectos para el marco
            if let Some(frame_effects) = &selective_effects.frame {
                for (idx, effect_opt) in frame_effects.effects.iter().enumerate() {
                    let effect_id = format!("filter_frame_{}_{}", 
                        format!("{:?}", effect_opt.effect_type).to_lowercase(), idx);
                    
                    definitions.push(crate::engine::types::QrDefinition::Effect(
                        crate::engine::types::QrEffectDef {
                            id: effect_id,
                            effect_type: format!("{:?}", effect_opt.effect_type).to_lowercase(),
                            params: serde_json::json!({
                                "component": "frame",
                                "blend_mode": frame_effects.blend_mode.as_ref()
                                    .map(|b| format!("{:?}", b).to_lowercase())
                                    .unwrap_or_else(|| "normal".to_string()),
                                "render_priority": frame_effects.render_priority.unwrap_or(5),
                                "apply_to_fill": frame_effects.apply_to_fill.unwrap_or(true),
                                "apply_to_stroke": frame_effects.apply_to_stroke.unwrap_or(false),
                            }),
                        }
                    ));
                }
            }
            
            // Efectos globales
            if let Some(global_effects) = &selective_effects.global {
                for (idx, effect_opt) in global_effects.effects.iter().enumerate() {
                    let effect_id = format!("filter_global_{}_{}", 
                        format!("{:?}", effect_opt.effect_type).to_lowercase(), idx);
                    
                    definitions.push(crate::engine::types::QrDefinition::Effect(
                        crate::engine::types::QrEffectDef {
                            id: effect_id,
                            effect_type: format!("{:?}", effect_opt.effect_type).to_lowercase(),
                            params: serde_json::json!({
                                "component": "global",
                                "blend_mode": global_effects.blend_mode.as_ref()
                                    .map(|b| format!("{:?}", b).to_lowercase())
                                    .unwrap_or_else(|| "normal".to_string()),
                                "render_priority": global_effects.render_priority.unwrap_or(5),
                                "apply_to_fill": global_effects.apply_to_fill.unwrap_or(true),
                                "apply_to_stroke": global_effects.apply_to_stroke.unwrap_or(false),
                            }),
                        }
                    ));
                }
            }
        }
        
        definitions
    }
    
    /// Construye los overlays (logo, frame)
    fn build_overlays(&self) -> Option<crate::engine::types::QrOverlays> {
        let custom = self.customization.as_ref()?;
        
        let logo = custom.logo.as_ref().map(|logo_opt| {
            // Calcular posición centrada
            let qr_size = self.size as f32;
            let logo_size = qr_size * (logo_opt.size_percentage / 100.0).clamp(0.1, 0.3);
            let x = (qr_size - logo_size) / 2.0 + self.quiet_zone as f32;
            let y = (qr_size - logo_size) / 2.0 + self.quiet_zone as f32;
            
            crate::engine::types::QrLogo {
                src: logo_opt.data.clone(),
                size: logo_opt.size_percentage / 100.0,
                shape: format!("{:?}", logo_opt.shape).to_lowercase(),
                padding: logo_opt.padding,
                x,
                y,
            }
        });
        
        let frame = custom.frame.as_ref().map(|frame_opt| {
            // Generar path del frame según el tipo
            let frame_path = self.generate_frame_path(&frame_opt.frame_type);
            
            crate::engine::types::QrFrame {
                style: format!("{:?}", frame_opt.frame_type).to_lowercase(),
                path: frame_path,
                fill_style: crate::engine::types::QrStyleConfig {
                    fill: frame_opt.color.clone(),
                    effects: Vec::new(),
                    shape: None,
                    stroke: None,
                },
                text: frame_opt.text.as_ref().map(|text| {
                    crate::engine::types::QrFrameText {
                        content: self.sanitize_text(text),
                        x: (self.size as f32 / 2.0) + self.quiet_zone as f32,
                        y: (self.size + self.quiet_zone * 2) as f32 + 10.0,
                        font_family: "Arial".to_string(),
                        font_size: 4.0,
                        text_anchor: "middle".to_string(),
                    }
                }),
            }
        });
        
        if logo.is_some() || frame.is_some() {
            Some(crate::engine::types::QrOverlays { logo, frame })
        } else {
            None
        }
    }
    
    /// Genera el path SVG para un frame
    fn generate_frame_path(&self, frame_type: &crate::engine::types::FrameType) -> String {
        let size = (self.size + 2 * self.quiet_zone) as i32;
        let padding = 2i32;
        
        match frame_type {
            crate::engine::types::FrameType::Simple => {
                format!("M{} {}h{}v{}H{}z", 
                    -padding, -padding, 
                    size + padding * 2, 
                    size + padding * 2, 
                    -padding)
            },
            crate::engine::types::FrameType::Rounded => {
                let radius = 5i32;
                format!("M{} {}h{}a{} {} 0 0 1 {} {}v{}a{} {} 0 0 1 -{} {}H{}a{} {} 0 0 1 -{} -{}v{}a{} {} 0 0 1 {} -{}z",
                    -padding + radius, -padding,
                    size + padding * 2 - radius * 2,
                    radius, radius, radius, radius,
                    size + padding * 2 - radius * 2,
                    radius, radius, radius, radius,
                    -padding + radius,
                    radius, radius, radius, radius,
                    -padding + radius,
                    radius, radius, radius, radius
                )
            },
            _ => {
                // Default simple frame
                format!("M{} {}h{}v{}H{}z", 
                    -padding, -padding, 
                    size + padding * 2, 
                    size + padding * 2, 
                    -padding)
            }
        }
    }
    
    /// Sanitiza el texto para prevenir XSS
    fn sanitize_text(&self, text: &str) -> String {
        text.chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || matches!(c, '!' | '?' | '.' | ','))
            .take(50) // Límite de 50 caracteres
            .collect()
    }
}

// Estructura auxiliar para regiones de ojos
struct EyeRegion {
    x: usize,
    y: usize,
    size: usize,
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