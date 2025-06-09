// engine/optimizer.rs - Optimizador de QR

use super::types::*;
use super::error::{QrError, QrResult};
use image::DynamicImage;
use std::sync::Arc;
use parking_lot::RwLock;
use std::collections::HashMap;

/// Configuración del optimizador
struct OptimizerConfig {
    /// Umbral para activar optimización de tamaños grandes
    large_size_threshold: u32,
    /// Tamaño máximo de caché de renders
    max_cache_size: usize,
    /// Habilitar renderizado por bloques
    enable_chunk_rendering: bool,
    /// Tamaño del bloque para renderizado chunked
    chunk_size: u32,
}

impl Default for OptimizerConfig {
    fn default() -> Self {
        Self {
            large_size_threshold: 1000,
            max_cache_size: 100,
            enable_chunk_rendering: true,
            chunk_size: 250,
        }
    }
}

/// Optimizador de códigos QR
pub struct QrOptimizer {
    config: OptimizerConfig,
    /// Caché de renders de componentes complejos
    render_cache: Arc<RwLock<HashMap<String, CachedRender>>>,
}

/// Render cacheado
#[derive(Clone)]
struct CachedRender {
    svg_content: String,
    timestamp: std::time::Instant,
    hit_count: u32,
}

impl QrOptimizer {
    pub fn new() -> Self {
        Self {
            config: OptimizerConfig::default(),
            render_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Optimiza para mejorar escaneabilidad
    pub fn optimize_for_scan(&self, qr: QrCode) -> QrResult<QrCode> {
        // Verificar si el QR es grande y necesita optimización
        let total_size = qr.size + (qr.quiet_zone * 2);
        
        if total_size > self.config.large_size_threshold as usize {
            tracing::debug!("QR size {} exceeds threshold, applying large size optimizations", total_size);
            self.optimize_large_qr(qr)
        } else {
            tracing::debug!("QR optimized for scanning");
            Ok(qr)
        }
    }
    
    /// Optimización avanzada
    pub fn optimize_advanced(&self, qr: QrCode) -> QrResult<QrCode> {
        // Aplicar optimizaciones avanzadas incluyendo caché
        let mut optimized_qr = self.optimize_for_scan(qr)?;
        
        // Pre-cachear componentes complejos si existen
        if let Some(customization) = &optimized_qr.customization {
            self.precache_complex_components(customization)?;
        }
        
        Ok(optimized_qr)
    }
    
    /// Optimiza QR de gran tamaño
    fn optimize_large_qr(&self, mut qr: QrCode) -> QrResult<QrCode> {
        // Marcar el QR para renderizado optimizado
        if let Some(ref mut customization) = qr.customization {
            // Activar optimizaciones específicas para tamaños grandes
            if self.config.enable_chunk_rendering {
                tracing::debug!("Enabling chunk rendering for large QR");
            }
        }
        
        // TODO: Implementar simplificación de patrones para tamaños grandes
        // Por ahora solo retornamos el QR con la marca de optimización
        
        Ok(qr)
    }
    
    /// Pre-cachea componentes complejos
    fn precache_complex_components(&self, customization: &QrCustomization) -> QrResult<()> {
        let mut cache_keys = Vec::new();
        
        // Identificar componentes complejos para cachear
        if let Some(gradient) = &customization.gradient {
            if gradient.enabled {
                let key = format!("gradient_{:?}_{}", gradient.gradient_type, gradient.colors.join("_"));
                cache_keys.push(key);
            }
        }
        
        if let Some(effects) = &customization.effects {
            for effect in effects {
                let key = format!("effect_{:?}", effect.effect_type);
                cache_keys.push(key);
            }
        }
        
        // Pre-generar y cachear si no existen
        for key in cache_keys {
            if !self.is_cached(&key) {
                tracing::debug!("Pre-caching component: {}", key);
                // El renderizado real se hará cuando se necesite
            }
        }
        
        Ok(())
    }
    
    /// Verifica si un componente está en caché
    pub fn is_cached(&self, key: &str) -> bool {
        let cache = self.render_cache.read();
        cache.contains_key(key)
    }
    
    /// Obtiene un render desde el caché
    pub fn get_cached_render(&self, key: &str) -> Option<String> {
        let mut cache = self.render_cache.write();
        if let Some(render) = cache.get_mut(key) {
            render.hit_count += 1;
            Some(render.svg_content.clone())
        } else {
            None
        }
    }
    
    /// Almacena un render en el caché
    pub fn cache_render(&self, key: String, svg_content: String) {
        let mut cache = self.render_cache.write();
        
        // Limpiar caché si excede el tamaño máximo
        if cache.len() >= self.config.max_cache_size {
            self.evict_least_used(&mut cache);
        }
        
        cache.insert(key, CachedRender {
            svg_content,
            timestamp: std::time::Instant::now(),
            hit_count: 0,
        });
    }
    
    /// Elimina el elemento menos usado del caché
    fn evict_least_used(&self, cache: &mut HashMap<String, CachedRender>) {
        if let Some((key_to_remove, _)) = cache.iter()
            .min_by_key(|(_, render)| render.hit_count) {
            let key = key_to_remove.clone();
            cache.remove(&key);
            tracing::debug!("Evicted cached render: {}", key);
        }
    }
    
    /// Optimiza el renderizado SVG para tamaños grandes
    pub fn optimize_svg_for_large_size(&self, svg: &str, size: u32) -> String {
        if size <= self.config.large_size_threshold {
            return svg.to_string();
        }
        
        let mut optimized = svg.to_string();
        
        // Optimización 1: Simplificar paths complejos
        if size > 2000 {
            optimized = self.simplify_svg_paths(&optimized);
        }
        
        // Optimización 2: Reducir precisión decimal
        optimized = self.reduce_decimal_precision(&optimized);
        
        // Optimización 3: Combinar elementos similares
        if size > 3000 {
            optimized = self.combine_similar_elements(&optimized);
        }
        
        optimized
    }
    
    /// Simplifica paths SVG complejos
    fn simplify_svg_paths(&self, svg: &str) -> String {
        // Por ahora retornamos sin cambios
        // TODO: Implementar simplificación real de paths
        svg.to_string()
    }
    
    /// Reduce la precisión decimal en SVG
    fn reduce_decimal_precision(&self, svg: &str) -> String {
        // Reducir decimales a 2 lugares para coordenadas
        let re = regex::Regex::new(r"(\d+\.\d{3,})").unwrap();
        re.replace_all(svg, |caps: &regex::Captures| {
            let num: f64 = caps[1].parse().unwrap_or(0.0);
            format!("{:.2}", num)
        }).to_string()
    }
    
    /// Combina elementos SVG similares
    fn combine_similar_elements(&self, svg: &str) -> String {
        // Por ahora retornamos sin cambios
        // TODO: Implementar combinación de elementos similares
        svg.to_string()
    }
    
    /// Prepara logo para integración
    pub fn prepare_logo(&self, logo_data: &LogoOptions) -> QrResult<DynamicImage> {
        use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
        
        // Decodificar logo desde base64
        if logo_data.data.starts_with("data:image") {
            let base64_start = logo_data.data.find(',').unwrap_or(0) + 1;
            let base64_data = &logo_data.data[base64_start..];
            
            let decoded = BASE64.decode(base64_data)
                .map_err(|e| QrError::LogoError(format!("Error decodificando base64: {}", e)))?;
            
            let mut logo = image::load_from_memory(&decoded)
                .map_err(|e| QrError::LogoError(format!("Error cargando imagen: {}", e)))?;
            
            // Aplicar forma al logo si es necesario
            logo = self.apply_logo_shape(logo, logo_data.shape);
            
            // Optimizar para QR (reducir colores si es necesario)
            logo = self.optimize_logo_for_qr(logo);
            
            Ok(logo)
        } else {
            Err(QrError::LogoError("Solo se soportan logos en formato base64".to_string()))
        }
    }
    
    /// Aplica forma al logo (circular, cuadrado redondeado, etc)
    fn apply_logo_shape(&self, logo: DynamicImage, shape: LogoShape) -> DynamicImage {
        use image::{Rgba, RgbaImage, GenericImageView};
        
        let (width, height) = logo.dimensions();
        let mut shaped = RgbaImage::new(width, height);
        let logo_rgba = logo.to_rgba8();
        
        match shape {
            LogoShape::Square => logo, // Sin cambios
            
            LogoShape::Circle => {
                let center_x = width as f32 / 2.0;
                let center_y = height as f32 / 2.0;
                let radius = center_x.min(center_y);
                
                for y in 0..height {
                    for x in 0..width {
                        let pixel = logo_rgba.get_pixel(x, y);
                        let dx = x as f32 - center_x;
                        let dy = y as f32 - center_y;
                        let distance = (dx * dx + dy * dy).sqrt();
                        
                        if distance <= radius {
                            shaped.put_pixel(x, y, *pixel);
                        } else {
                            shaped.put_pixel(x, y, Rgba([0, 0, 0, 0])); // Transparente
                        }
                    }
                }
                
                DynamicImage::ImageRgba8(shaped)
            },
            
            LogoShape::RoundedSquare => {
                let corner_radius = (width.min(height) as f32 * 0.2) as i32;
                
                for y in 0..height {
                    for x in 0..width {
                        let pixel = logo_rgba.get_pixel(x, y);
                        let x_i = x as i32;
                        let y_i = y as i32;
                        let w_i = width as i32;
                        let h_i = height as i32;
                        
                        // Verificar si está en una esquina
                        let in_corner = 
                            (x_i < corner_radius && y_i < corner_radius) ||
                            (x_i >= w_i - corner_radius && y_i < corner_radius) ||
                            (x_i < corner_radius && y_i >= h_i - corner_radius) ||
                            (x_i >= w_i - corner_radius && y_i >= h_i - corner_radius);
                        
                        if in_corner {
                            // Verificar si está dentro del radio de la esquina
                            let corner_x = if x_i < corner_radius { corner_radius } else { w_i - corner_radius };
                            let corner_y = if y_i < corner_radius { corner_radius } else { h_i - corner_radius };
                            
                            let dx = x_i - corner_x;
                            let dy = y_i - corner_y;
                            let distance = ((dx * dx + dy * dy) as f32).sqrt();
                            
                            if distance <= corner_radius as f32 {
                                shaped.put_pixel(x, y, *pixel);
                            } else {
                                shaped.put_pixel(x, y, Rgba([0, 0, 0, 0]));
                            }
                        } else {
                            shaped.put_pixel(x, y, *pixel);
                        }
                    }
                }
                
                DynamicImage::ImageRgba8(shaped)
            }
        }
    }
    
    /// Optimiza el logo para mejor integración con QR
    fn optimize_logo_for_qr(&self, logo: DynamicImage) -> DynamicImage {
        // Por ahora solo retornamos el logo sin cambios
        // TODO: Implementar filtros de optimización
        logo
    }
}