// engine/generator.rs - Generador base de códigos QR

use qrcodegen::{QrCode as QrCodeGen, QrCodeEcc};
use super::types::*;
use super::error::{QrError, QrResult};
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
        self.validate_input(data, size)?;
        
        // Usar el optimizador para determinar el ECL óptimo
        let optimizer = super::ecl_optimizer::EclOptimizer::new();
        let (optimal_ecl, analysis) = optimizer.determine_optimal_ecl(
            data,
            logo_size_ratio,
            ecl_override,
        )?;
        
        // Generar el QR con el ECL óptimo
        let mut qr_code = self.generate_with_ecl(data, size, optimal_ecl)?;
        
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
                let eye_color = customization
                    .and_then(|c| c.colors.as_ref())
                    .map(|c| c.foreground.as_str())
                    .unwrap_or(fill_color);
                    
                svg.push_str(&self.render_custom_eyes(
                    *eye_shape, 
                    eye_color, 
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
                processor.create_linear_gradient_with_size(
                    &colors[0],
                    &colors[1],
                    options.angle.unwrap_or(90.0) as f64,
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
                // Diamond usa diagonal (45 grados)
                processor.create_diagonal_gradient(
                    &colors[0],
                    &colors[1],
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
                "", // El color se aplicará en el grupo padre
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
        color: &str, 
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
                color
            ));
            
            // Renderizar punto interior del ojo usando EyeShapeRenderer
            svg.push_str(&eye_renderer.render_to_svg_path(
                eye_shape, 
                *position, 
                EyeComponent::Inner, 
                color
            ));
            
            svg.push_str("</g>");
        }
        
        svg.push_str("</g>");
        svg
    }
    
    /// Convierte el QR a datos estructurados para ULTRATHINK
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
                    
                    // Para el patrón de dots, generar círculos individuales
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
                        _ => {
                            // Patrón cuadrado estándar (optimizado)
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
                        }
                    }
                }
            }
        }
        
        // Generar paths para cada ojo
        for (eye_type, region) in eye_regions.iter() {
            let eye_path = self.generate_eye_path(region);
            eye_paths.push(crate::engine::types::QrEyePath {
                eye_type: eye_type.clone(),
                path: eye_path,
                shape: self.customization.as_ref()
                    .and_then(|c| c.eye_shape)
                    .map(|shape| format!("{:?}", shape)),
            });
        }
        
        crate::engine::types::QrPaths {
            data: data_path,
            eyes: eye_paths,
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
    
    /// Genera el path para un ojo específico
    fn generate_eye_path(&self, region: &EyeRegion) -> String {
        let eye_shape = self.customization.as_ref()
            .and_then(|c| c.eye_shape)
            .unwrap_or(EyeShape::Square);
        
        // Generar paths para el marco exterior (7x7) y el centro (3x3)
        let mut path_parts = Vec::new();
        
        // Marco exterior (7x7)
        match eye_shape {
            EyeShape::Square => {
                let x = region.x + self.quiet_zone;
                let y = region.y + self.quiet_zone;
                path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
            }
            EyeShape::RoundedSquare => {
                let x = region.x + self.quiet_zone;
                let y = region.y + self.quiet_zone;
                path_parts.push(format!(
                    "M {:.1} {} h 5.6 a 0.7 0.7 0 0 1 0.7 0.7 v 5.6 a 0.7 0.7 0 0 1 -0.7 0.7 h -5.6 a 0.7 0.7 0 0 1 -0.7 -0.7 v -5.6 a 0.7 0.7 0 0 1 0.7 -0.7 Z",
                    x as f32 + 0.7, y
                ));
            }
            EyeShape::Circle => {
                let cx = (region.x + self.quiet_zone) as f32 + 3.5;
                let cy = (region.y + self.quiet_zone) as f32 + 3.5;
                path_parts.push(format!(
                    "M {} {} A 3.5 3.5 0 1 0 {} {} A 3.5 3.5 0 1 0 {} {} Z",
                    cx - 3.5, cy, cx + 3.5, cy, cx - 3.5, cy
                ));
            }
            EyeShape::Star => {
                let cx = (region.x + self.quiet_zone) as f32 + 3.5;
                let cy = (region.y + self.quiet_zone) as f32 + 3.5;
                let outer_r = 3.5;
                let inner_r = 1.75;
                
                let mut star_path = String::from("M ");
                for i in 0..10 {
                    let angle = (i as f32 * 36.0 - 90.0).to_radians();
                    let r = if i % 2 == 0 { outer_r } else { inner_r };
                    let px = cx as f32 + r * angle.cos();
                    let py = cy as f32 + r * angle.sin();
                    
                    if i == 0 {
                        star_path.push_str(&format!("{:.2} {:.2}", px, py));
                    } else {
                        star_path.push_str(&format!(" L {:.2} {:.2}", px, py));
                    }
                }
                star_path.push_str(" Z");
                path_parts.push(star_path);
            }
            _ => {
                // Para otras formas, usar la implementación legacy por ahora
                let x = region.x + self.quiet_zone;
                let y = region.y + self.quiet_zone;
                path_parts.push(format!("M {} {} h 7 v 7 h -7 Z", x, y));
            }
        }
        
        // Centro interior (3x3)
        let inner_x = region.x + self.quiet_zone + 2;
        let inner_y = region.y + self.quiet_zone + 2;
        
        match eye_shape {
            EyeShape::Circle | EyeShape::Dot => {
                let cx = inner_x as f32 + 1.5;
                let cy = inner_y as f32 + 1.5;
                path_parts.push(format!(
                    "M {} {} A 1.5 1.5 0 1 0 {} {} A 1.5 1.5 0 1 0 {} {} Z",
                    cx - 1.5, cy, cx + 1.5, cy, cx - 1.5, cy
                ));
            }
            EyeShape::Star => {
                let cx = inner_x as f32 + 1.5;
                let cy = inner_y as f32 + 1.5;
                let outer_r = 1.5;
                let inner_r = 0.75;
                
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
            }
            _ => {
                // Cuadrado por defecto
                path_parts.push(format!("M {} {} h 3 v 3 h -3 Z", inner_x, inner_y));
            }
        }
        
        path_parts.join(" ")
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
                custom.and_then(|c| c.colors.as_ref())
                    .map(|colors| colors.foreground.clone())
                    .unwrap_or_else(|| data_fill.clone())
            }
        } else {
            custom.and_then(|c| c.colors.as_ref())
                .map(|colors| colors.foreground.clone())
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
                        }
                    ));
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
                    _ => {},
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