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
            format!(r#" filter="url(#{})"#, filter_ids[0])
        } else {
            // Para múltiples efectos, crear una cadena de filtros
            let filter_chain = filter_ids.iter()
                .map(|id| format!("url(#{})", id))
                .collect::<Vec<_>>()
                .join(" ");
            format!(r#" style="filter: {}"#, filter_chain)
        };

        // Buscar el grupo principal de contenido y agregar el filtro
        if let Some(g_pos) = result.find("<g fill=") {
            result.insert_str(g_pos + 2, &filter_attr);
        }

        Ok(result)
    }

    /// Aplica efecto de sombra con configuración personalizada
    pub fn apply_shadow(&mut self, svg: &str, config: Option<ShadowConfig>) -> QrResult<String> {
        let shadow_config = config.unwrap_or_default();
        let filter_id = self.generate_filter_id("shadow");
        
        let filter_def = self.create_shadow_filter(&filter_id, Some(shadow_config))?;
        self.apply_single_filter(svg, &filter_id, &filter_def)
    }

    /// Crea definición de filtro de sombra
    pub fn create_shadow_filter(&self, id: &str, config: Option<ShadowConfig>) -> QrResult<String> {
        let config = config.unwrap_or_default();
        
        // Validar configuración
        if config.blur_radius < 0.0 {
            return Err(QrError::ValidationError("El radio de blur no puede ser negativo".to_string()));
        }
        
        if config.opacity < 0.0 || config.opacity > 1.0 {
            return Err(QrError::ValidationError("La opacidad debe estar entre 0 y 1".to_string()));
        }

        let color = ColorProcessor::parse_color(&config.color)?;
        let rgb = format!("rgb({},{},{})", color.r, color.g, color.b);

        Ok(format!(
            r#"<filter id="{}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="{:.2}"/>
                <feOffset dx="{:.2}" dy="{:.2}" result="offsetblur"/>
                <feFlood flood-color="{}" flood-opacity="{:.2}"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>"#,
            id, config.blur_radius, config.offset_x, config.offset_y, rgb, config.opacity
        ))
    }

    /// Aplica efecto de brillo/resplandor
    pub fn apply_glow(&mut self, svg: &str, config: Option<GlowConfig>) -> QrResult<String> {
        let glow_config = config.unwrap_or_default();
        let filter_id = self.generate_filter_id("glow");
        
        let filter_def = self.create_glow_filter(&filter_id, Some(glow_config))?;
        self.apply_single_filter(svg, &filter_id, &filter_def)
    }

    /// Crea definición de filtro de brillo
    pub fn create_glow_filter(&self, id: &str, config: Option<GlowConfig>) -> QrResult<String> {
        let config = config.unwrap_or_default();
        
        if config.intensity < 0.0 {
            return Err(QrError::ValidationError("La intensidad no puede ser negativa".to_string()));
        }

        let color = ColorProcessor::parse_color(&config.color)?;
        let rgb = format!("rgb({},{},{})", color.r, color.g, color.b);

        Ok(format!(
            r#"<filter id="{}" x="-50%" y="-50%" width="200%" height="200%">
                <feMorphology operator="dilate" radius="{:.2}" in="SourceAlpha" result="thicken"/>
                <feGaussianBlur in="thicken" stdDeviation="{:.2}" result="blurred"/>
                <feFlood flood-color="{}" result="glowColor"/>
                <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow"/>
                <feMerge>
                    <feMergeNode in="softGlow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>"#,
            id, config.intensity * 0.5, config.intensity * 2.0, rgb
        ))
    }

    /// Aplica efecto de desenfoque Gaussiano
    pub fn apply_blur(&mut self, svg: &str, config: Option<BlurConfig>) -> QrResult<String> {
        let blur_config = config.unwrap_or_default();
        let filter_id = self.generate_filter_id("blur");
        
        let filter_def = self.create_blur_filter(&filter_id, Some(blur_config))?;
        self.apply_single_filter(svg, &filter_id, &filter_def)
    }

    /// Crea definición de filtro de desenfoque
    pub fn create_blur_filter(&self, id: &str, config: Option<BlurConfig>) -> QrResult<String> {
        let config = config.unwrap_or_default();
        
        if config.radius < 0.0 {
            return Err(QrError::ValidationError("El radio de blur no puede ser negativo".to_string()));
        }

        Ok(format!(
            r#"<filter id="{}">
                <feGaussianBlur in="SourceGraphic" stdDeviation="{:.2}"/>
            </filter>"#,
            id, config.radius
        ))
    }

    /// Aplica efecto de ruido/textura
    pub fn apply_noise(&mut self, svg: &str, config: Option<NoiseConfig>) -> QrResult<String> {
        let noise_config = config.unwrap_or_default();
        let filter_id = self.generate_filter_id("noise");
        
        let filter_def = self.create_noise_filter(&filter_id, Some(noise_config))?;
        self.apply_single_filter(svg, &filter_id, &filter_def)
    }

    /// Crea definición de filtro de ruido
    pub fn create_noise_filter(&self, id: &str, config: Option<NoiseConfig>) -> QrResult<String> {
        let config = config.unwrap_or_default();
        
        if config.intensity < 0.0 || config.intensity > 1.0 {
            return Err(QrError::ValidationError("La intensidad del ruido debe estar entre 0 y 1".to_string()));
        }

        Ok(format!(
            r#"<filter id="{}">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="5"/>
                <feColorMatrix type="saturate" values="0"/>
                <feComponentTransfer>
                    <feFuncA type="discrete" tableValues="0 {:.2} {:.2} {:.2} {:.2} {:.2} 1"/>
                </feComponentTransfer>
                <feComposite operator="over" in2="SourceGraphic"/>
            </filter>"#,
            id, 
            config.intensity * 0.1,
            config.intensity * 0.2,
            config.intensity * 0.3,
            config.intensity * 0.2,
            config.intensity * 0.1
        ))
    }

    /// Aplica efecto vintage/retro
    pub fn apply_vintage(&mut self, svg: &str, config: Option<VintageConfig>) -> QrResult<String> {
        let vintage_config = config.unwrap_or_default();
        let filter_id = self.generate_filter_id("vintage");
        
        let filter_def = self.create_vintage_filter(&filter_id, Some(vintage_config))?;
        self.apply_single_filter(svg, &filter_id, &filter_def)
    }

    /// Crea definición de filtro vintage
    pub fn create_vintage_filter(&self, id: &str, config: Option<VintageConfig>) -> QrResult<String> {
        let config = config.unwrap_or_default();

        Ok(format!(
            r##"<filter id="{}" x="0%" y="0%" width="100%" height="100%">
                <!-- Sepia tone -->
                <feColorMatrix type="matrix" values="
                    0.393 0.769 0.189 0 0
                    0.349 0.686 0.168 0 0
                    0.272 0.534 0.131 0 0
                    0 0 0 1 0" result="sepia"/>
                
                <!-- Adjust contrast -->
                <feComponentTransfer in="sepia" result="contrast">
                    <feFuncR type="linear" slope="{:.2}" intercept="{:.2}"/>
                    <feFuncG type="linear" slope="{:.2}" intercept="{:.2}"/>
                    <feFuncB type="linear" slope="{:.2}" intercept="{:.2}"/>
                </feComponentTransfer>
                
                <!-- Vignette effect -->
                <feGaussianBlur in="SourceAlpha" stdDeviation="50" result="blur"/>
                <feOffset in="blur" result="offsetBlur"/>
                <feFlood flood-color="#000000" flood-opacity="{:.2}" result="vignette"/>
                <feComposite in="vignette" in2="offsetBlur" operator="in" result="vignetteBlur"/>
                
                <!-- Combine sepia with vignette -->
                <feMerge>
                    <feMergeNode in="contrast"/>
                    <feMergeNode in="vignetteBlur"/>
                </feMerge>
            </filter>"##,
            id,
            1.2, // slope para mayor contraste
            -0.1, // intercept para oscurecer ligeramente
            1.2,
            -0.1,
            1.2,
            -0.1,
            config.vignette_intensity
        ))
    }

    /// Aplica un solo filtro al SVG
    fn apply_single_filter(&self, svg: &str, filter_id: &str, filter_def: &str) -> QrResult<String> {
        let mut result = svg.to_string();

        // Crear o encontrar la sección <defs>
        let defs_section = format!("<defs>{}</defs>", filter_def);
        
        if let Some(_pos) = result.find("<defs>") {
            // Ya existe <defs>, insertar el filtro
            let end_pos = result.find("</defs>").ok_or_else(|| 
                QrError::RenderError("Etiqueta <defs> sin cerrar".to_string())
            )?;
            result.insert_str(end_pos, filter_def);
        } else {
            // No existe <defs>, crearlo después de <svg>
            if let Some(pos) = result.find('>') {
                result.insert_str(pos + 1, &defs_section);
            } else {
                return Err(QrError::RenderError("SVG mal formado".to_string()));
            }
        }

        // Aplicar el filtro al grupo principal
        let filter_attr = format!(r#" filter="url(#{})"#, filter_id);
        if let Some(g_pos) = result.find("<g fill=") {
            result.insert_str(g_pos + 2, &filter_attr);
        }

        Ok(result)
    }

    /// Combina múltiples efectos en un solo filtro compuesto
    pub fn create_composite_filter(&mut self, effects: &[(Effect, EffectConfig)]) -> QrResult<String> {
        let filter_id = self.generate_filter_id("composite");
        let mut filter_content = format!(
            r#"<filter id="{}" x="-50%" y="-50%" width="200%" height="200%">"#,
            filter_id
        );

        let mut last_result = "SourceGraphic".to_string();
        
        for (i, (effect, config)) in effects.iter().enumerate() {
            let result_name = format!("effect{}", i);
            
            match effect {
                Effect::Shadow => {
                    let shadow_cfg = match config {
                        EffectConfig::Shadow(cfg) => cfg,
                        _ => &ShadowConfig::default(),
                    };
                    filter_content.push_str(&self.create_shadow_filter_content(shadow_cfg, &last_result, &result_name)?);
                },
                Effect::Glow => {
                    let glow_cfg = match config {
                        EffectConfig::Glow(cfg) => cfg,
                        _ => &GlowConfig::default(),
                    };
                    filter_content.push_str(&self.create_glow_filter_content(glow_cfg, &last_result, &result_name)?);
                },
                Effect::Blur => {
                    let blur_cfg = match config {
                        EffectConfig::Blur(cfg) => cfg,
                        _ => &BlurConfig::default(),
                    };
                    filter_content.push_str(&format!(
                        r#"<feGaussianBlur in="{}" stdDeviation="{:.2}" result="{}"/>"#,
                        last_result, blur_cfg.radius, result_name
                    ));
                },
                Effect::Noise => {
                    let noise_cfg = match config {
                        EffectConfig::Noise(cfg) => cfg,
                        _ => &NoiseConfig::default(),
                    };
                    filter_content.push_str(&self.create_noise_filter_content(noise_cfg, &last_result, &result_name)?);
                },
                Effect::Vintage => {
                    let vintage_cfg = match config {
                        EffectConfig::Vintage(cfg) => cfg,
                        _ => &VintageConfig::default(),
                    };
                    filter_content.push_str(&self.create_vintage_filter_content(vintage_cfg, &last_result, &result_name)?);
                },
                // Nuevos efectos Fase 2.2 - implementación básica
                Effect::Distort => {
                    filter_content.push_str(&format!(
                        r#"<feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/>
                           <feDisplacementMap in="{}" in2="noise" scale="10" result="{}"/>"#,
                        last_result, result_name
                    ));
                },
                Effect::Emboss => {
                    filter_content.push_str(&format!(
                        r#"<feConvolveMatrix order="3" kernelMatrix="-2 -1 0 -1 1 1 0 1 2" divisor="1" in="{}" result="{}"/>"#,
                        last_result, result_name
                    ));
                },
                Effect::Outline => {
                    filter_content.push_str(&format!(
                        r#"<feMorphology operator="dilate" radius="1" in="{}" result="outline"/>
                           <feFlood flood-color="black" flood-opacity="1" result="color"/>
                           <feComposite in="color" in2="outline" operator="in" result="coloredOutline"/>
                           <feComposite in="{}" in2="coloredOutline" operator="over" result="{}"/>"#,
                        last_result, last_result, result_name
                    ));
                },
                Effect::DropShadow => {
                    filter_content.push_str(&format!(
                        r#"<feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.3" in="{}" result="{}"/>"#,
                        last_result, result_name
                    ));
                },
                Effect::InnerShadow => {
                    filter_content.push_str(&format!(
                        r#"<feOffset dx="2" dy="2" in="SourceAlpha" result="offset"/>
                           <feGaussianBlur stdDeviation="3" in="offset" result="blur"/>
                           <feFlood flood-color="black" flood-opacity="0.3"/>
                           <feComposite in2="blur" operator="in"/>
                           <feComposite in2="{}" operator="over" result="{}"/>"#,
                        last_result, result_name
                    ));
                },
            }
            
            last_result = result_name;
        }

        filter_content.push_str("</filter>");
        Ok(filter_content)
    }

    /// Crea contenido de filtro de sombra para composición
    fn create_shadow_filter_content(&self, config: &ShadowConfig, input: &str, output: &str) -> QrResult<String> {
        let color = ColorProcessor::parse_color(&config.color)?;
        let rgb = format!("rgb({},{},{})", color.r, color.g, color.b);

        Ok(format!(
            r#"<feGaussianBlur in="{}" stdDeviation="{:.2}" result="shadowBlur"/>
            <feOffset in="shadowBlur" dx="{:.2}" dy="{:.2}" result="shadowOffset"/>
            <feFlood flood-color="{}" flood-opacity="{:.2}" result="shadowColor"/>
            <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="shadow"/>
            <feMerge result="{}">
                <feMergeNode in="shadow"/>
                <feMergeNode in="{}"/>
            </feMerge>"#,
            input, config.blur_radius, config.offset_x, config.offset_y, rgb, config.opacity, output, input
        ))
    }

    /// Crea contenido de filtro de brillo para composición
    fn create_glow_filter_content(&self, config: &GlowConfig, input: &str, output: &str) -> QrResult<String> {
        let color = ColorProcessor::parse_color(&config.color)?;
        let rgb = format!("rgb({},{},{})", color.r, color.g, color.b);

        Ok(format!(
            r#"<feMorphology operator="dilate" radius="{:.2}" in="{}" result="glowThicken"/>
            <feGaussianBlur in="glowThicken" stdDeviation="{:.2}" result="glowBlur"/>
            <feFlood flood-color="{}" result="glowColor"/>
            <feComposite in="glowColor" in2="glowBlur" operator="in" result="glow"/>
            <feMerge result="{}">
                <feMergeNode in="glow"/>
                <feMergeNode in="{}"/>
            </feMerge>"#,
            config.intensity * 0.5, input, config.intensity * 2.0, rgb, output, input
        ))
    }

    /// Crea contenido de filtro de ruido para composición
    fn create_noise_filter_content(&self, config: &NoiseConfig, input: &str, output: &str) -> QrResult<String> {
        Ok(format!(
            r#"<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="5" result="noise"/>
            <feColorMatrix in="noise" type="saturate" values="0" result="noiseDesaturated"/>
            <feComponentTransfer in="noiseDesaturated" result="noiseAlpha">
                <feFuncA type="discrete" tableValues="0 {:.2} {:.2} {:.2} {:.2} {:.2} 1"/>
            </feComponentTransfer>
            <feComposite operator="over" in="noiseAlpha" in2="{}" result="{}"/>"#,
            config.intensity * 0.1,
            config.intensity * 0.2,
            config.intensity * 0.3,
            config.intensity * 0.2,
            config.intensity * 0.1,
            input,
            output
        ))
    }

    /// Crea contenido de filtro vintage para composición
    fn create_vintage_filter_content(&self, _config: &VintageConfig, input: &str, output: &str) -> QrResult<String> {
        Ok(format!(
            r#"<feColorMatrix in="{}" type="matrix" values="
                0.393 0.769 0.189 0 0
                0.349 0.686 0.168 0 0
                0.272 0.534 0.131 0 0
                0 0 0 1 0" result="sepia"/>
            <feComponentTransfer in="sepia" result="{}">
                <feFuncR type="linear" slope="1.2" intercept="-0.1"/>
                <feFuncG type="linear" slope="1.2" intercept="-0.1"/>
                <feFuncB type="linear" slope="1.2" intercept="-0.1"/>
            </feComponentTransfer>"#,
            input, output
        ))
    }

    /// Valida que los efectos sean compatibles entre sí
    pub fn validate_effect_combination(&self, effects: &[Effect]) -> QrResult<()> {
        // Validar que no haya demasiados efectos
        if effects.len() > 5 {
            return Err(QrError::ValidationError(
                "Demasiados efectos aplicados (máximo 5)".to_string()
            ));
        }

        // Validar combinaciones problemáticas
        let has_blur = effects.contains(&Effect::Blur);
        let has_noise = effects.contains(&Effect::Noise);
        
        if has_blur && has_noise {
            return Err(QrError::ValidationError(
                "Los efectos Blur y Noise juntos pueden reducir la legibilidad del código QR".to_string()
            ));
        }

        Ok(())
    }

    /// Optimiza los parámetros de efectos para mantener la escaneabilidad
    pub fn optimize_for_scanability(&self, effects: &mut [(Effect, EffectConfig)]) {
        for (effect, config) in effects.iter_mut() {
            match (effect, config) {
                (Effect::Shadow, EffectConfig::Shadow(cfg)) => {
                    // Limitar el desenfoque de sombra para mantener bordes definidos
                    cfg.blur_radius = cfg.blur_radius.min(3.0);
                    cfg.opacity = cfg.opacity.min(0.5);
                },
                (Effect::Blur, EffectConfig::Blur(cfg)) => {
                    // Limitar el radio de desenfoque
                    cfg.radius = cfg.radius.min(1.0);
                },
                (Effect::Noise, EffectConfig::Noise(cfg)) => {
                    // Limitar la intensidad del ruido
                    cfg.intensity = cfg.intensity.min(0.3);
                },
                _ => {}
            }
        }
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
                    self.create_shadow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Glow => {
                    self.create_glow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Blur => {
                    self.create_blur_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Noise => {
                    self.create_noise_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Vintage => {
                    self.create_vintage_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Distort => {
                    self.create_distort_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Emboss => {
                    self.create_emboss_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Outline => {
                    self.create_outline_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::DropShadow => {
                    self.create_drop_shadow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::InnerShadow => {
                    self.create_inner_shadow_filter(&filter_id, Some(&effect_option.config))?
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shadow_filter_creation() {
        let processor = EffectProcessor::new();
        let config = ShadowConfig::default();
        let result = processor.create_shadow_filter("test-shadow", Some(config));
        
        assert!(result.is_ok());
        let filter = result.unwrap();
        assert!(filter.contains("feGaussianBlur"));
        assert!(filter.contains("feOffset"));
        assert!(filter.contains("feMerge"));
    }

    #[test]
    fn test_glow_filter_creation() {
        let processor = EffectProcessor::new();
        let config = GlowConfig::default();
        let result = processor.create_glow_filter("test-glow", Some(config));
        
        assert!(result.is_ok());
        let filter = result.unwrap();
        assert!(filter.contains("feMorphology"));
        assert!(filter.contains("feGaussianBlur"));
    }

    #[test]
    fn test_blur_filter_creation() {
        let processor = EffectProcessor::new();
        let config = BlurConfig::default();
        let result = processor.create_blur_filter("test-blur", Some(config));
        
        assert!(result.is_ok());
        let filter = result.unwrap();
        assert!(filter.contains("feGaussianBlur"));
        assert!(filter.contains(r#"stdDeviation="2.00""#));
    }

    #[test]
    fn test_noise_filter_creation() {
        let processor = EffectProcessor::new();
        let config = NoiseConfig::default();
        let result = processor.create_noise_filter("test-noise", Some(config));
        
        assert!(result.is_ok());
        let filter = result.unwrap();
        assert!(filter.contains("feTurbulence"));
        assert!(filter.contains("fractalNoise"));
    }

    #[test]
    fn test_vintage_filter_creation() {
        let processor = EffectProcessor::new();
        let config = VintageConfig::default();
        let result = processor.create_vintage_filter("test-vintage", Some(config));
        
        assert!(result.is_ok());
        let filter = result.unwrap();
        assert!(filter.contains("feColorMatrix"));
        assert!(filter.contains("0.393 0.769 0.189"));
    }

    #[test]
    fn test_apply_single_effect() {
        let mut processor = EffectProcessor::new();
        let svg = r##"<svg viewBox="0 0 100 100"><g fill="#000000"><rect x="0" y="0" width="10" height="10"/></g></svg>"##;
        
        let result = processor.apply_shadow(svg, None);
        assert!(result.is_ok());
        
        let modified_svg = result.unwrap();
        assert!(modified_svg.contains("<defs>"));
        assert!(modified_svg.contains("filter="));
    }

    #[test]
    fn test_apply_multiple_effects() {
        let mut processor = EffectProcessor::new();
        let svg = r##"<svg viewBox="0 0 100 100"><g fill="#000000"><rect x="0" y="0" width="10" height="10"/></g></svg>"##;
        
        let effects = vec![Effect::Shadow, Effect::Glow];
        let result = processor.apply_effects(svg, &effects);
        
        assert!(result.is_ok());
        let modified_svg = result.unwrap();
        assert!(modified_svg.contains("qr-effect-shadow"));
        assert!(modified_svg.contains("qr-effect-glow"));
    }

    #[test]
    fn test_effect_validation() {
        let processor = EffectProcessor::new();
        
        // Debería pasar con pocos efectos
        let valid_effects = vec![Effect::Shadow, Effect::Glow, Effect::Vintage];
        assert!(processor.validate_effect_combination(&valid_effects).is_ok());
        
        // Debería fallar con demasiados efectos
        let too_many_effects = vec![
            Effect::Shadow,
            Effect::Glow,
            Effect::Blur,
            Effect::Noise,
            Effect::Vintage,
            Effect::Shadow,
        ];
        assert!(processor.validate_effect_combination(&too_many_effects).is_err());
        
        // Debería fallar con combinación problemática
        let problematic_effects = vec![Effect::Blur, Effect::Noise];
        assert!(processor.validate_effect_combination(&problematic_effects).is_err());
    }

    #[test]
    fn test_invalid_configurations() {
        let processor = EffectProcessor::new();
        
        // Configuración de sombra inválida
        let invalid_shadow = ShadowConfig {
            blur_radius: -1.0,
            ..Default::default()
        };
        assert!(processor.create_shadow_filter("test", Some(invalid_shadow)).is_err());
        
        // Configuración de ruido inválida
        let invalid_noise = NoiseConfig {
            intensity: 2.0, // Fuera del rango 0-1
        };
        assert!(processor.create_noise_filter("test", Some(invalid_noise)).is_err());
    }

    #[test]
    fn test_optimize_for_scanability() {
        let processor = EffectProcessor::new();
        
        let mut effects = vec![
            (Effect::Shadow, EffectConfig::Shadow(ShadowConfig {
                blur_radius: 10.0,
                opacity: 0.8,
                ..Default::default()
            })),
            (Effect::Blur, EffectConfig::Blur(BlurConfig {
                radius: 5.0,
            })),
        ];
        
        processor.optimize_for_scanability(&mut effects);
        
        // Verificar que los valores se han limitado
        match &effects[0].1 {
            EffectConfig::Shadow(cfg) => {
                assert_eq!(cfg.blur_radius, 3.0);
                assert_eq!(cfg.opacity, 0.5);
            },
            _ => panic!("Expected Shadow config"),
        }
        
        match &effects[1].1 {
            EffectConfig::Blur(cfg) => {
                assert_eq!(cfg.radius, 1.0);
            },
            _ => panic!("Expected Blur config"),
        }
    }
}

/// Configuración de sombra
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
                    self.create_shadow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Glow => {
                    self.create_glow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Blur => {
                    self.create_blur_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Noise => {
                    self.create_noise_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Vintage => {
                    self.create_vintage_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Distort => {
                    self.create_distort_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Emboss => {
                    self.create_emboss_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::Outline => {
                    self.create_outline_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::DropShadow => {
                    self.create_drop_shadow_filter(&filter_id, Some(&effect_option.config))?
                },
                crate::engine::types::Effect::InnerShadow => {
                    self.create_inner_shadow_filter(&filter_id, Some(&effect_option.config))?
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

// Incluir tests de integración
#[cfg(test)]
#[path = "effects_test.rs"]
mod integration_tests;