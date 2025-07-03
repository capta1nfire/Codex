// processing/effects.rs - Sistema completo de efectos visuales para códigos QR

use crate::engine::error::{QrError, QrResult};
use crate::engine::types::Effect;
use crate::processing::colors::ColorProcessor;
use std::collections::HashMap;

/// Procesador de efectos visuales para códigos QR
pub struct EffectProcessor {
    /// Cache de definiciones de filtros SVG
    filter_cache: HashMap<String, String>,
    /// Contador para IDs únicos
    id_counter: u32,
    /// IDs de filtros activos
    active_filter_ids: Vec<String>,
}

impl EffectProcessor {
    pub fn new() -> Self {
        Self {
            filter_cache: HashMap::new(),
            id_counter: 0,
            active_filter_ids: Vec::new(),
        }
    }

    /// Genera un ID único para filtros
    pub fn generate_filter_id(&mut self, effect_type: &str) -> String {
        self.id_counter += 1;
        let id = format!("qr-effect-{}-{}", effect_type, self.id_counter);
        self.active_filter_ids.push(id.clone());
        id
    }
    
    /// Obtiene los IDs de filtros activos
    pub fn get_active_filter_ids(&self) -> Vec<String> {
        self.active_filter_ids.clone()
    }

    /// Aplica múltiples efectos en secuencia
    pub fn apply_effects(&mut self, svg: &str, effects: &[Effect]) -> QrResult<String> {
        if effects.is_empty() {
            return Ok(svg.to_string());
        }

        // Extraer el contenido SVG para modificación
        let mut result = svg.to_string();
        let mut filter_ids = Vec::new();

        // Generar definiciones de filtros para cada efecto
        let mut defs_content = String::from("<defs>");
        
        for effect in effects {
            let filter_id = self.generate_filter_id(&format!("{:?}", effect).to_lowercase());
            let filter_def = match effect {
                Effect::Shadow => self.create_shadow_filter(&filter_id, None)?,
                Effect::Glow => self.create_glow_filter(&filter_id, None)?,
                Effect::Blur => self.create_blur_filter(&filter_id, None)?,
                Effect::Noise => self.create_noise_filter(&filter_id, None)?,
                Effect::Vintage => self.create_vintage_filter(&filter_id, None)?,
                // Nuevos efectos Fase 2.2
                Effect::Distort => self.create_distort_filter(&filter_id, None)?,
                Effect::Emboss => self.create_emboss_filter(&filter_id, None)?,
                Effect::Outline => self.create_outline_filter(&filter_id, None)?,
                Effect::DropShadow => self.create_drop_shadow_filter(&filter_id, None)?,
                Effect::InnerShadow => self.create_inner_shadow_filter(&filter_id, None)?,
            };
            
            defs_content.push_str(&filter_def);
            filter_ids.push(filter_id);
        }
        
        defs_content.push_str("</defs>");

        // Insertar las definiciones después de la etiqueta <svg>
        if let Some(pos) = result.find('>') {
            result.insert_str(pos + 1, &defs_content);
        } else {
            return Err(QrError::RenderError("SVG mal formado".to_string()));
        }

        // Aplicar los filtros al grupo principal
        let filter_attr = if filter_ids.len() == 1 {
            format!(r#" filter="url(#{})""#, filter_ids[0])
        } else {
            // Para múltiples efectos, crear una cadena de filtros
            let filter_chain = filter_ids.iter()
                .map(|id| format!("url(#{})", id))
                .collect::<Vec<_>>()
                .join(" ");
            format!(r#" style="filter: {}""#, filter_chain)
        };

        // Buscar el grupo principal de contenido y agregar el filtro
        if let Some(g_pos) = result.find("<g fill=") {
            result.insert_str(g_pos + 2, &filter_attr);
        }

        Ok(result)
    }

    /// Crea un filtro de sombra SVG
    pub fn create_shadow_filter(&self, filter_id: &str, config: Option<ShadowConfig>) -> QrResult<String> {
        let cfg = config.unwrap_or_default();
        Ok(format!(
            r#"<filter id="{}">
                <feDropShadow dx="{}" dy="{}" stdDeviation="{}" flood-color="{}" flood-opacity="{}"/>
               </filter>"#,
            filter_id, cfg.offset_x, cfg.offset_y, cfg.blur_radius, cfg.color, cfg.opacity
        ))
    }

    /// Crea un filtro de resplandor SVG
    pub fn create_glow_filter(&self, filter_id: &str, config: Option<GlowConfig>) -> QrResult<String> {
        let cfg = config.unwrap_or_default();
        Ok(format!(
            r#"<filter id="{}">
                <feGaussianBlur stdDeviation="{}" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
               </filter>"#,
            filter_id, cfg.intensity
        ))
    }

    /// Crea un filtro de desenfoque SVG
    pub fn create_blur_filter(&self, filter_id: &str, config: Option<BlurConfig>) -> QrResult<String> {
        let cfg = config.unwrap_or_default();
        Ok(format!(
            r#"<filter id="{}">
                <feGaussianBlur stdDeviation="{}"/>
               </filter>"#,
            filter_id, cfg.radius
        ))
    }

    /// Crea un filtro de ruido SVG
    pub fn create_noise_filter(&self, filter_id: &str, config: Option<NoiseConfig>) -> QrResult<String> {
        let cfg = config.unwrap_or_default();
        Ok(format!(
            r#"<filter id="{}">
                <feTurbulence baseFrequency="{}" numOctaves="3" result="noise"/>
                <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
               </filter>"#,
            filter_id, cfg.intensity
        ))
    }

    /// Crea un filtro vintage SVG
    pub fn create_vintage_filter(&self, filter_id: &str, config: Option<VintageConfig>) -> QrResult<String> {
        let cfg = config.unwrap_or_default();
        Ok(format!(
            r#"<filter id="{}">
                <feColorMatrix type="matrix" 
                    values="{} 0.343 0.169 0 0
                            0.272 {} 0.534 0 0
                            0.105 0.216 {} 0 0
                            0 0 0 1 0"/>
                <feGaussianBlur stdDeviation="{}"/>
               </filter>"#,
            filter_id, cfg.sepia_intensity, cfg.sepia_intensity, cfg.sepia_intensity, cfg.vignette_intensity
        ))
    }

    // ==================== NUEVOS MÉTODOS FASE 2.2 ====================

    /// Crear filtro de distorsión
    pub fn create_distort_filter(&self, filter_id: &str, _config: Option<&crate::engine::types::EffectConfiguration>) -> QrResult<String> {
        Ok(format!(
            r#"<filter id="{}">
                <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="10"/>
               </filter>"#,
            filter_id
        ))
    }

    /// Crear filtro de emboss
    pub fn create_emboss_filter(&self, filter_id: &str, _config: Option<&crate::engine::types::EffectConfiguration>) -> QrResult<String> {
        Ok(format!(
            r#"<filter id="{}">
                <feConvolveMatrix order="3" kernelMatrix="-2 -1 0 -1 1 1 0 1 2" divisor="1"/>
               </filter>"#,
            filter_id
        ))
    }

    /// Crear filtro de outline
    pub fn create_outline_filter(&self, filter_id: &str, _config: Option<&crate::engine::types::EffectConfiguration>) -> QrResult<String> {
        Ok(format!(
            r#"<filter id="{}">
                <feMorphology operator="dilate" radius="1" in="SourceGraphic" result="outline"/>
                <feFlood flood-color="black" flood-opacity="1" result="color"/>
                <feComposite in="color" in2="outline" operator="in" result="coloredOutline"/>
                <feComposite in="SourceGraphic" in2="coloredOutline" operator="over"/>
               </filter>"#,
            filter_id
        ))
    }

    /// Crear filtro de drop shadow
    pub fn create_drop_shadow_filter(&self, filter_id: &str, _config: Option<&crate::engine::types::EffectConfiguration>) -> QrResult<String> {
        Ok(format!(
            r#"<filter id="{}">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.3"/>
               </filter>"#,
            filter_id
        ))
    }

    /// Crear filtro de inner shadow
    pub fn create_inner_shadow_filter(&self, filter_id: &str, _config: Option<&crate::engine::types::EffectConfiguration>) -> QrResult<String> {
        Ok(format!(
            r#"<filter id="{}">
                <feOffset dx="2" dy="2" in="SourceAlpha" result="offset"/>
                <feGaussianBlur stdDeviation="3" in="offset" result="blur"/>
                <feFlood flood-color="black" flood-opacity="0.3"/>
                <feComposite in2="blur" operator="in"/>
                <feComposite in2="SourceGraphic" operator="over"/>
               </filter>"#,
            filter_id
        ))
    }
    
    // ==================== SISTEMA DE EFECTOS SELECTIVOS (FASE 2.2) ====================
    
    /// Aplica efectos selectivos por componente del QR
    pub fn apply_selective_effects(
        &mut self, 
        svg: &str, 
        selective_effects: &crate::engine::types::SelectiveEffects
    ) -> QrResult<String> {
        let mut result = svg.to_string();
        let mut all_filter_definitions = String::new();
        
        // Generar definiciones de filtros para cada componente
        if let Some(eyes_effects) = &selective_effects.eyes {
            let eyes_filters = self.generate_component_filters("eyes", eyes_effects)?;
            all_filter_definitions.push_str(&eyes_filters);
        }
        
        if let Some(data_effects) = &selective_effects.data {
            let data_filters = self.generate_component_filters("data", data_effects)?;
            all_filter_definitions.push_str(&data_filters);
        }
        
        if let Some(frame_effects) = &selective_effects.frame {
            let frame_filters = self.generate_component_filters("frame", frame_effects)?;
            all_filter_definitions.push_str(&frame_filters);
        }
        
        if let Some(global_effects) = &selective_effects.global {
            let global_filters = self.generate_component_filters("global", global_effects)?;
            all_filter_definitions.push_str(&global_filters);
        }
        
        // Insertar definiciones de filtros en el SVG
        if !all_filter_definitions.is_empty() {
            let defs_content = format!("<defs>{}</defs>", all_filter_definitions);
            if let Some(pos) = result.find('>') {
                result.insert_str(pos + 1, &defs_content);
            }
        }
        
        // Aplicar filtros a componentes específicos del SVG
        result = self.apply_filters_to_components(result, selective_effects)?;
        
        Ok(result)
    }
    
    /// Genera filtros para un componente específico
    fn generate_component_filters(
        &mut self, 
        component: &str, 
        component_effects: &crate::engine::types::ComponentEffects
    ) -> QrResult<String> {
        let mut filter_definitions = String::new();
        
        for (idx, effect_option) in component_effects.effects.iter().enumerate() {
            let filter_id = format!("qr-{}-effect-{}-{}", component, 
                format!("{:?}", effect_option.effect_type).to_lowercase(), idx);
            
            let filter_def = match effect_option.effect_type {
                crate::engine::types::Effect::Shadow => {
                    self.create_shadow_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Glow => {
                    self.create_glow_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Blur => {
                    self.create_blur_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Noise => {
                    self.create_noise_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Vintage => {
                    self.create_vintage_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Distort => {
                    self.create_distort_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Emboss => {
                    self.create_emboss_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::Outline => {
                    self.create_outline_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::DropShadow => {
                    self.create_drop_shadow_filter(&filter_id, None)?
                },
                crate::engine::types::Effect::InnerShadow => {
                    self.create_inner_shadow_filter(&filter_id, None)?
                },
            };
            
            filter_definitions.push_str(&filter_def);
            self.active_filter_ids.push(filter_id);
        }
        
        Ok(filter_definitions)
    }
    
    /// Aplica filtros a componentes específicos en el SVG
    fn apply_filters_to_components(
        &self, 
        mut svg: String, 
        selective_effects: &crate::engine::types::SelectiveEffects
    ) -> QrResult<String> {
        // Aplicar efectos a los ojos
        if let Some(eyes_effects) = &selective_effects.eyes {
            svg = self.apply_component_filter(&svg, "eyes", eyes_effects, "g[data-component=\"eye\"]")?;
        }
        
        // Aplicar efectos a los datos  
        if let Some(data_effects) = &selective_effects.data {
            svg = self.apply_component_filter(&svg, "data", data_effects, "g[data-component=\"data\"]")?;
        }
        
        // Aplicar efectos al marco
        if let Some(frame_effects) = &selective_effects.frame {
            svg = self.apply_component_filter(&svg, "frame", frame_effects, "g[data-component=\"frame\"]")?;
        }
        
        // Aplicar efectos globales
        if let Some(global_effects) = &selective_effects.global {
            svg = self.apply_component_filter(&svg, "global", global_effects, "g")?;
        }
        
        Ok(svg)
    }
    
    /// Aplica filtro a un componente específico con selector CSS
    fn apply_component_filter(
        &self,
        svg: &str,
        component: &str,
        component_effects: &crate::engine::types::ComponentEffects,
        _selector: &str
    ) -> QrResult<String> {
        let mut result = svg.to_string();
        
        // Crear cadena de filtros para este componente
        let filter_ids: Vec<String> = component_effects.effects.iter().enumerate()
            .map(|(idx, effect)| format!("qr-{}-effect-{}-{}", component, 
                format!("{:?}", effect.effect_type).to_lowercase(), idx))
            .collect();
        
        if filter_ids.is_empty() {
            return Ok(result);
        }
        
        // Aplicar blend mode si está especificado
        let blend_mode = match component_effects.blend_mode {
            Some(crate::engine::types::BlendMode::Normal) => "normal",
            Some(crate::engine::types::BlendMode::Multiply) => "multiply", 
            Some(crate::engine::types::BlendMode::Screen) => "screen",
            Some(crate::engine::types::BlendMode::Overlay) => "overlay",
            Some(crate::engine::types::BlendMode::SoftLight) => "soft-light",
            Some(crate::engine::types::BlendMode::HardLight) => "hard-light",
            Some(crate::engine::types::BlendMode::ColorDodge) => "color-dodge",
            Some(crate::engine::types::BlendMode::ColorBurn) => "color-burn",
            Some(crate::engine::types::BlendMode::Darken) => "darken",
            Some(crate::engine::types::BlendMode::Lighten) => "lighten",
            Some(crate::engine::types::BlendMode::Difference) => "difference",
            Some(crate::engine::types::BlendMode::Exclusion) => "exclusion",
            None => "normal",
        };
        
        // Crear atributo de filtro
        let filter_urls = filter_ids.iter()
            .map(|id| format!("url(#{})", id))
            .collect::<Vec<_>>()
            .join(" ");
        
        let filter_attribute = format!(
            r#" style="filter: {}; mix-blend-mode: {}""#,
            filter_urls, blend_mode
        );
        
        // Buscar y modificar los grupos correspondientes según el componente
        match component {
            "eyes" => {
                // Aplicar a grupos de ojos - buscar patrones comunes
                if let Some(start) = result.find("<g") {
                    if let Some(end) = result[start..].find(">") {
                        let insertion_point = start + end;
                        result.insert_str(insertion_point, &filter_attribute);
                    }
                }
            },
            "data" => {
                // Aplicar a módulos de datos - buscar el grupo principal
                if let Some(start) = result.find("<g fill=") {
                    if let Some(end) = result[start..].find(">") {
                        let insertion_point = start + end;
                        result.insert_str(insertion_point, &filter_attribute);
                    }
                }
            },
            "global" => {
                // Aplicar globalmente - al primer grupo
                if let Some(start) = result.find("<g") {
                    if let Some(end) = result[start..].find(">") {
                        let insertion_point = start + end;
                        result.insert_str(insertion_point, &filter_attribute);
                    }
                }
            },
            _ => {
                // Para frame u otros componentes futuros
                if let Some(start) = result.find("<g") {
                    if let Some(end) = result[start..].find(">") {
                        let insertion_point = start + end;
                        result.insert_str(insertion_point, &filter_attribute);
                    }
                }
            }
        }
        
        Ok(result)
    }
    
    /// Valida compatibilidad de efectos según las reglas definidas
    pub fn validate_effect_compatibility(
        &self,
        effects: &[crate::engine::types::EffectOptions],
        rules: Option<&crate::engine::types::CompatibilityRules>
    ) -> QrResult<Vec<String>> {
        let mut warnings = Vec::new();
        
        if let Some(rules) = rules {
            // Verificar límite de efectos concurrentes
            if let Some(max_effects) = rules.max_concurrent_effects {
                if effects.len() > max_effects as usize {
                    warnings.push(format!(
                        "Excede el límite de {} efectos simultáneos. Solo se aplicarán los primeros {}.",
                        max_effects, max_effects
                    ));
                }
            }
            
            // Verificar combinaciones incompatibles
            for incompatible_combo in &rules.incompatible_combinations {
                let present_effects: Vec<_> = effects.iter()
                    .map(|e| e.effect_type)
                    .filter(|e| incompatible_combo.contains(e))
                    .collect();
                    
                if present_effects.len() > 1 {
                    warnings.push(format!(
                        "Combinación incompatible detectada: {:?}. Algunos efectos pueden no funcionar correctamente.",
                        present_effects
                    ));
                }
            }
            
            // Verificar dependencias requeridas
            for (effect, dependencies) in &rules.required_dependencies {
                if effects.iter().any(|e| e.effect_type == *effect) {
                    for dep in dependencies {
                        if !effects.iter().any(|e| e.effect_type == *dep) {
                            warnings.push(format!(
                                "El efecto {:?} requiere {:?} para funcionar correctamente.",
                                effect, dep
                            ));
                        }
                    }
                }
            }
        }
        
        Ok(warnings)
    }
}

/// Configuración de sombra
#[derive(Debug, Clone)]
pub struct ShadowConfig {
    pub offset_x: f64,
    pub offset_y: f64,
    pub blur_radius: f64,
    pub color: String,
    pub opacity: f64,
}

impl Default for ShadowConfig {
    fn default() -> Self {
        Self {
            offset_x: 2.0,
            offset_y: 2.0,
            blur_radius: 3.0,
            color: "#000000".to_string(),
            opacity: 0.3,
        }
    }
}

/// Configuración de brillo/resplandor
#[derive(Debug, Clone)]
pub struct GlowConfig {
    pub intensity: f64,
    pub color: String,
}

impl Default for GlowConfig {
    fn default() -> Self {
        Self {
            intensity: 3.0,
            color: "#FFFFFF".to_string(),
        }
    }
}

/// Configuración de desenfoque
#[derive(Debug, Clone)]
pub struct BlurConfig {
    pub radius: f64,
}

impl Default for BlurConfig {
    fn default() -> Self {
        Self {
            radius: 2.0,
        }
    }
}

/// Configuración de ruido
#[derive(Debug, Clone)]
pub struct NoiseConfig {
    pub intensity: f64,
}

impl Default for NoiseConfig {
    fn default() -> Self {
        Self {
            intensity: 0.2,
        }
    }
}

/// Configuración vintage
#[derive(Debug, Clone)]
pub struct VintageConfig {
    pub sepia_intensity: f64,
    pub vignette_intensity: f64,
}

impl Default for VintageConfig {
    fn default() -> Self {
        Self {
            sepia_intensity: 0.8,
            vignette_intensity: 0.4,
        }
    }
}

/// Enum para agrupar todas las configuraciones de efectos
#[derive(Debug, Clone)]
pub enum EffectConfig {
    Shadow(ShadowConfig),
    Glow(GlowConfig),
    Blur(BlurConfig),
    Noise(NoiseConfig),
    Vintage(VintageConfig),
}

impl Default for EffectProcessor {
    fn default() -> Self {
        Self::new()
    }
}

// Incluir tests de integración
#[cfg(test)]
#[path = "effects_test.rs"]
mod integration_tests;