// engine/customizer.rs - Motor de personalización de QR

use super::types::*;
use super::error::{QrResult, QrError};
use crate::shapes::{EyeShapeRenderer, PatternRenderer, FrameRenderer};
use crate::processing::{ColorProcessor, GradientProcessor, EffectProcessor};
use crate::processing::effects::{EffectConfig, ShadowConfig, GlowConfig, BlurConfig, NoiseConfig, VintageConfig};
use image::{DynamicImage, imageops};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

/// Motor de personalización de códigos QR
pub struct QrCustomizer {
    eye_renderer: EyeShapeRenderer,
    pattern_renderer: PatternRenderer,
    frame_renderer: FrameRenderer,
    color_processor: ColorProcessor,
    gradient_processor: GradientProcessor,
    effect_processor: EffectProcessor,
}

impl QrCustomizer {
    pub fn new() -> Self {
        Self {
            eye_renderer: EyeShapeRenderer::new(10), // Default module size
            pattern_renderer: PatternRenderer::new(10),
            frame_renderer: FrameRenderer::new(10),
            color_processor: ColorProcessor::new(),
            gradient_processor: GradientProcessor::new(),
            effect_processor: EffectProcessor::new(),
        }
    }
    
    /// Aplica personalizaciones de nivel medio
    pub fn apply_medium_customization(
        &self,
        mut qr: QrCode,
        customization: &QrCustomization,
    ) -> QrResult<QrCode> {
        // TODO: Implementar en Fase 2
        
        // Por ahora solo guardamos la personalización
        qr.customization = Some(customization.clone());
        
        tracing::debug!("Medium customization applied (stub)");
        Ok(qr)
    }
    
    /// Aplica personalizaciones avanzadas
    pub fn apply_advanced_customization(
        &mut self,
        mut qr: QrCode,
        customization: &QrCustomization,
        assets: AdvancedAssets,
    ) -> QrResult<(QrCode, Option<LogoIntegrationResult>, Option<FrameInfo>, Option<EffectsInfo>)> {
        // Aplicar logo si existe
        let logo_result = if let Some(logo_opts) = &customization.logo {
            let result = self.integrate_logo(
                &mut qr.matrix,
                logo_opts,
                assets.logo,
            )?;
            
            // Si el logo requiere alta corrección de errores, validar
            if result.requires_high_ecc {
                tracing::warn!(
                    "Logo ocupa {:.1}% del QR. Se recomienda usar corrección de errores alta.",
                    result.capacity_loss_percentage
                );
            }
            
            Some(result)
        } else {
            None
        };
        
        // Preparar información del marco si existe
        let frame_info = if let Some(frame_opts) = &customization.frame {
            Some(FrameInfo {
                frame_type: frame_opts.frame_type,
                text: frame_opts.text.clone(),
                text_position: frame_opts.text_position,
                color: frame_opts.color.clone(),
            })
        } else {
            None
        };
        
        // Aplicar efectos si existen (modo legacy)
        let effects_info = if let Some(effect_options) = &customization.effects {
            let filter_defs = self.apply_effects(effect_options)?;
            Some(EffectsInfo {
                filter_definitions: filter_defs,
                filter_ids: self.effect_processor.get_active_filter_ids(),
            })
        } else if let Some(selective_effects) = &customization.selective_effects {
            // Usar nuevo sistema de efectos selectivos (Fase 2.2)
            let filter_defs = self.apply_selective_effects(selective_effects)?;
            Some(EffectsInfo {
                filter_definitions: filter_defs,
                filter_ids: self.effect_processor.get_active_filter_ids(),
            })
        } else {
            None
        };
        
        qr.customization = Some(customization.clone());
        
        tracing::debug!("Advanced customization applied with logo, frame and effects");
        Ok((qr, logo_result, frame_info, effects_info))
    }
    
    /// Pre-computa datos de gradiente
    pub fn precompute_gradient(&self, gradient: &GradientOptions) -> QrResult<GradientData> {
        // TODO: Implementar en Fase 2
        
        Ok(GradientData {
            colors: vec![[0, 0, 0, 255], [255, 255, 255, 255]],
            stops: vec![0.0, 1.0],
            gradient_type: gradient.gradient_type,
        })
    }

    /// Integra un logo en el centro del QR
    pub fn integrate_logo(
        &self,
        qr_matrix: &mut Vec<Vec<bool>>,
        logo_options: &LogoOptions,
        logo_image: Option<DynamicImage>,
    ) -> QrResult<LogoIntegrationResult> {
        let matrix_size = qr_matrix.len();
        if matrix_size == 0 {
            return Err(QrError::InternalError("QR matrix vacía".to_string()));
        }

        // Si no hay imagen pre-cargada, intentar decodificar desde base64
        let logo = match logo_image {
            Some(img) => img,
            None => {
                if logo_options.data.starts_with("data:image") {
                    // Extraer base64 de data URL
                    let base64_start = logo_options.data.find(',').unwrap_or(0) + 1;
                    let base64_data = &logo_options.data[base64_start..];
                    
                    let decoded = BASE64.decode(base64_data)
                        .map_err(|e| QrError::LogoError(format!("Error decodificando base64: {}", e)))?;
                    
                    image::load_from_memory(&decoded)
                        .map_err(|e| QrError::LogoError(format!("Error cargando imagen: {}", e)))?
                } else {
                    return Err(QrError::LogoError("Logo data debe ser base64 o imagen pre-cargada".to_string()));
                }
            }
        };

        // Validar tamaño del logo
        let max_logo_percentage = 30.0;
        if logo_options.size_percentage > max_logo_percentage {
            return Err(QrError::LogoTooLarge(logo_options.size_percentage, max_logo_percentage));
        }

        // Calcular dimensiones del logo
        let logo_size = (matrix_size as f32 * logo_options.size_percentage / 100.0) as u32;
        let logo_with_padding = logo_size + 2 * logo_options.padding;
        
        // Validar que el logo no sea demasiado grande
        if logo_with_padding >= matrix_size as u32 {
            return Err(QrError::LogoTooLarge(
                logo_with_padding as f32 / matrix_size as f32 * 100.0,
                max_logo_percentage
            ));
        }

        // Redimensionar logo
        let resized_logo = imageops::resize(
            &logo,
            logo_size,
            logo_size,
            imageops::FilterType::Lanczos3
        );

        // Calcular posición central
        let center_x = (matrix_size / 2) as i32;
        let center_y = (matrix_size / 2) as i32;
        let half_size = (logo_with_padding / 2) as i32;

        // Área que ocupará el logo (con padding)
        let logo_area = LogoArea {
            x: (center_x - half_size) as usize,
            y: (center_y - half_size) as usize,
            width: logo_with_padding as usize,
            height: logo_with_padding as usize,
        };

        // Limpiar área del logo en la matriz
        self.clear_logo_area(qr_matrix, &logo_area)?;

        // Calcular pérdida de capacidad
        let total_modules = matrix_size * matrix_size;
        let cleared_modules = logo_area.width * logo_area.height;
        let capacity_loss = cleared_modules as f32 / total_modules as f32 * 100.0;

        Ok(LogoIntegrationResult {
            logo_image: DynamicImage::ImageRgba8(resized_logo),
            logo_area,
            capacity_loss_percentage: capacity_loss,
            requires_high_ecc: capacity_loss > 15.0,
        })
    }

    /// Limpia el área donde se colocará el logo
    fn clear_logo_area(
        &self,
        matrix: &mut Vec<Vec<bool>>,
        area: &LogoArea,
    ) -> QrResult<()> {
        let matrix_size = matrix.len();
        
        // Validar límites
        if area.x + area.width > matrix_size || area.y + area.height > matrix_size {
            return Err(QrError::LogoError("Área del logo excede límites de la matriz".to_string()));
        }

        // Limpiar con patrón de borde suave
        for y in area.y..area.y + area.height {
            for x in area.x..area.x + area.width {
                // Calcular distancia al borde del área
                let dist_to_edge = self.distance_to_edge(x, y, area);
                
                // Crear borde suave (fade)
                if dist_to_edge < 2 {
                    // Mantener algunos módulos en el borde para suavizar
                    if (x + y) % 2 == 0 {
                        matrix[y][x] = false;
                    }
                } else {
                    // Limpiar completamente el centro
                    matrix[y][x] = false;
                }
            }
        }

        Ok(())
    }

    /// Calcula la distancia de un punto al borde del área
    fn distance_to_edge(&self, x: usize, y: usize, area: &LogoArea) -> usize {
        let dist_left = x - area.x;
        let dist_right = area.x + area.width - x - 1;
        let dist_top = y - area.y;
        let dist_bottom = area.y + area.height - y - 1;
        
        dist_left.min(dist_right).min(dist_top).min(dist_bottom)
    }

    /// Procesa un logo desde base64 o URL
    pub fn process_logo_data(&self, logo_data: &str) -> QrResult<DynamicImage> {
        if logo_data.starts_with("data:image") {
            // Procesar data URL
            let base64_start = logo_data.find(',').unwrap_or(0) + 1;
            let base64_data = &logo_data[base64_start..];
            
            let decoded = BASE64.decode(base64_data)
                .map_err(|e| QrError::LogoError(format!("Error decodificando base64: {}", e)))?;
            
            Ok(image::load_from_memory(&decoded)
                .map_err(|e| QrError::LogoError(format!("Error cargando imagen: {}", e)))?)
        } else if logo_data.starts_with("http") {
            // Por seguridad, no cargar URLs externas directamente
            Err(QrError::LogoError("URLs externas no soportadas por seguridad. Use base64.".to_string()))
        } else {
            Err(QrError::LogoError("Formato de logo no reconocido".to_string()))
        }
    }
    
    /// Mapea la configuración de efectos desde el formato de la API al formato interno
    fn map_effect_config(&self, config: &EffectConfiguration) -> QrResult<EffectConfig> {
        match config {
            EffectConfiguration::Shadow { offset_x, offset_y, blur_radius, color, opacity } => {
                Ok(EffectConfig::Shadow(ShadowConfig {
                    offset_x: offset_x.unwrap_or(2.0),
                    offset_y: offset_y.unwrap_or(2.0),
                    blur_radius: blur_radius.unwrap_or(3.0),
                    color: color.clone().unwrap_or_else(|| "#000000".to_string()),
                    opacity: opacity.unwrap_or(0.3),
                }))
            },
            EffectConfiguration::Glow { intensity, color } => {
                Ok(EffectConfig::Glow(GlowConfig {
                    intensity: intensity.unwrap_or(3.0),
                    color: color.clone().unwrap_or_else(|| "#FFFFFF".to_string()),
                }))
            },
            EffectConfiguration::Blur { radius } => {
                Ok(EffectConfig::Blur(BlurConfig {
                    radius: radius.unwrap_or(2.0),
                }))
            },
            EffectConfiguration::Noise { intensity } => {
                Ok(EffectConfig::Noise(NoiseConfig {
                    intensity: intensity.unwrap_or(0.2),
                }))
            },
            EffectConfiguration::Vintage { sepia_intensity, vignette_intensity } => {
                Ok(EffectConfig::Vintage(VintageConfig {
                    sepia_intensity: sepia_intensity.unwrap_or(0.8),
                    vignette_intensity: vignette_intensity.unwrap_or(0.4),
                }))
            },
            // Nuevos efectos Fase 2.2 - configuraciones básicas por ahora
            EffectConfiguration::Distort { .. } => {
                // Por ahora usamos configuración por defecto, se puede expandir después
                Ok(EffectConfig::Blur(BlurConfig { radius: 1.0 }))
            },
            EffectConfiguration::Emboss { .. } => {
                // Por ahora usamos configuración por defecto, se puede expandir después
                Ok(EffectConfig::Blur(BlurConfig { radius: 0.5 }))
            },
            EffectConfiguration::Outline { .. } => {
                // Por ahora usamos configuración por defecto, se puede expandir después
                Ok(EffectConfig::Blur(BlurConfig { radius: 0.5 }))
            },
            EffectConfiguration::DropShadow { .. } => {
                // Por ahora usamos configuración shadow, se puede expandir después
                Ok(EffectConfig::Shadow(ShadowConfig {
                    offset_x: 2.0,
                    offset_y: 2.0,
                    blur_radius: 3.0,
                    color: "#000000".to_string(),
                    opacity: 0.3,
                }))
            },
            EffectConfiguration::InnerShadow { .. } => {
                // Por ahora usamos configuración shadow, se puede expandir después
                Ok(EffectConfig::Shadow(ShadowConfig {
                    offset_x: 1.0,
                    offset_y: 1.0,
                    blur_radius: 2.0,
                    color: "#000000".to_string(),
                    opacity: 0.4,
                }))
            },
        }
    }
    
    /// Aplica efectos visuales y genera definiciones de filtros SVG
    pub fn apply_effects(&mut self, effect_options: &[EffectOptions]) -> QrResult<String> {
        let mut filter_definitions = String::new();
        
        for effect_opt in effect_options {
            let effect_config = self.map_effect_config(&effect_opt.config)?;
            
            // Generar ID único para el filtro
            let filter_id = self.effect_processor.generate_filter_id(&format!("{:?}", effect_opt.effect_type).to_lowercase());
            
            // Crear definición del filtro según el tipo
            let filter_def = match effect_opt.effect_type {
                Effect::Shadow => {
                    let config = match effect_config {
                        EffectConfig::Shadow(cfg) => cfg,
                        _ => ShadowConfig::default(),
                    };
                    self.effect_processor.create_shadow_filter(&filter_id, Some(config))?
                },
                Effect::Glow => {
                    let config = match effect_config {
                        EffectConfig::Glow(cfg) => cfg,
                        _ => GlowConfig::default(),
                    };
                    self.effect_processor.create_glow_filter(&filter_id, Some(config))?
                },
                Effect::Blur => {
                    let config = match effect_config {
                        EffectConfig::Blur(cfg) => cfg,
                        _ => BlurConfig::default(),
                    };
                    self.effect_processor.create_blur_filter(&filter_id, Some(config))?
                },
                Effect::Noise => {
                    let config = match effect_config {
                        EffectConfig::Noise(cfg) => cfg,
                        _ => NoiseConfig::default(),
                    };
                    self.effect_processor.create_noise_filter(&filter_id, Some(config))?
                },
                Effect::Vintage => {
                    let config = match effect_config {
                        EffectConfig::Vintage(cfg) => cfg,
                        _ => VintageConfig::default(),
                    };
                    self.effect_processor.create_vintage_filter(&filter_id, Some(config))?
                },
                // Nuevos efectos Fase 2.2
                Effect::Distort => {
                    self.effect_processor.create_distort_filter(&filter_id, None)?
                },
                Effect::Emboss => {
                    self.effect_processor.create_emboss_filter(&filter_id, None)?
                },
                Effect::Outline => {
                    self.effect_processor.create_outline_filter(&filter_id, None)?
                },
                Effect::DropShadow => {
                    self.effect_processor.create_drop_shadow_filter(&filter_id, None)?
                },
                Effect::InnerShadow => {
                    self.effect_processor.create_inner_shadow_filter(&filter_id, None)?
                },
            };
            
            filter_definitions.push_str(&filter_def);
        }
        
        Ok(filter_definitions)
    }
    
    /// Aplica efectos selectivos por componente (Fase 2.2)
    pub fn apply_selective_effects(&mut self, selective_effects: &SelectiveEffects) -> QrResult<String> {
        // Validar compatibilidad de efectos si hay reglas definidas
        let components = [&selective_effects.eyes, &selective_effects.data, &selective_effects.frame, &selective_effects.global];
        for component_effects in components.iter().filter_map(|opt| opt.as_ref()) {
            if let Some(warnings) = self.validate_component_effects(&component_effects.effects)? {
                if !warnings.is_empty() {
                    tracing::warn!("Advertencias de compatibilidad de efectos: {:?}", warnings);
                }
            }
        }
        
        // Generar un SVG base temporal para aplicar los efectos
        let base_svg = r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <g fill="black">
                <!-- Placeholder para efectos selectivos -->
            </g>
        </svg>"#;
        
        // Aplicar efectos selectivos usando el procesador de efectos
        let processed_svg = self.effect_processor.apply_selective_effects(base_svg, selective_effects)?;
        
        // Extraer solo las definiciones de filtros del SVG procesado
        if let Some(start) = processed_svg.find("<defs>") {
            if let Some(end) = processed_svg.find("</defs>") {
                let defs_content = &processed_svg[start + 6..end]; // +6 para saltar "<defs>"
                return Ok(defs_content.to_string());
            }
        }
        
        Ok(String::new())
    }
    
    /// Valida efectos de un componente específico
    fn validate_component_effects(&self, effects: &[EffectOptions]) -> QrResult<Option<Vec<String>>> {
        if effects.is_empty() {
            return Ok(None);
        }
        
        // Usar reglas de compatibilidad básicas por defecto
        let default_rules = CompatibilityRules {
            incompatible_combinations: vec![
                // Blur y Noise no se combinan bien
                vec![Effect::Blur, Effect::Noise],
                // Shadow y DropShadow son redundantes
                vec![Effect::Shadow, Effect::DropShadow],
            ],
            required_dependencies: vec![],
            max_concurrent_effects: Some(3),
            auto_intensity_validation: Some(true),
        };
        
        let warnings = self.effect_processor.validate_effect_compatibility(effects, Some(&default_rules))?;
        Ok(if warnings.is_empty() { None } else { Some(warnings) })
    }
}

/// Resultado de la integración del logo
pub struct LogoIntegrationResult {
    pub logo_image: DynamicImage,
    pub logo_area: LogoArea,
    pub capacity_loss_percentage: f32,
    pub requires_high_ecc: bool,
}

/// Área ocupada por el logo
#[derive(Debug, Clone)]
pub struct LogoArea {
    pub x: usize,
    pub y: usize,
    pub width: usize,
    pub height: usize,
}

/// Información del marco
#[derive(Debug, Clone)]
pub struct FrameInfo {
    pub frame_type: FrameType,
    pub text: Option<String>,
    pub text_position: TextPosition,
    pub color: String,
}

/// Información de efectos aplicados
#[derive(Debug, Clone)]
pub struct EffectsInfo {
    pub filter_definitions: String,
    pub filter_ids: Vec<String>,
}