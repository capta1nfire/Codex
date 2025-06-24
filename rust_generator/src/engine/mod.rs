// engine/mod.rs - Motor principal de generación QR

pub mod generator;
pub mod customizer;
pub mod validator;
pub mod optimizer;
pub mod router;
pub mod types;
pub mod error;
pub mod reporter;
pub mod constants;
pub mod zones;
pub mod geometry;
pub mod ecl_optimizer;

// Re-exportar tipos principales
pub use generator::QrGenerator;
pub use customizer::QrCustomizer;
pub use validator::QrValidator;
pub use optimizer::QrOptimizer;
pub use router::ComplexityRouter;
pub use types::ComplexityLevel;
pub use types::*;
pub use error::{QrError, QrResult};
pub use constants::get_alignment_pattern_positions;

use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::cache::distributed::{DistributedCache, DistributedCacheConfig, RedisMode};

/// Motor principal del sistema QR
pub struct QrEngine {
    generator: Arc<QrGenerator>,
    customizer: Arc<QrCustomizer>,
    validator: Arc<QrValidator>,
    optimizer: Arc<QrOptimizer>,
    router: Arc<ComplexityRouter>,
    cache: Arc<RwLock<DistributedCache>>,
}

impl QrEngine {
    /// Crea una nueva instancia del motor QR
    pub fn new() -> Self {
        // Configurar cache distribuido desde variables de entorno
        let cache_config = Self::load_cache_config();
        let cache = match DistributedCache::new(cache_config) {
            Ok(cache) => cache,
            Err(e) => {
                tracing::warn!("Failed to initialize distributed cache: {}. Using disabled cache.", e);
                DistributedCache::disabled()
            }
        };

        Self {
            generator: Arc::new(QrGenerator::new()),
            customizer: Arc::new(QrCustomizer::new()),
            validator: Arc::new(QrValidator::new()),
            optimizer: Arc::new(QrOptimizer::new()),
            router: Arc::new(ComplexityRouter::new()),
            cache: Arc::new(RwLock::new(cache)),
        }
    }

    /// Carga la configuración del cache desde variables de entorno
    fn load_cache_config() -> DistributedCacheConfig {
        let mode = if let Ok(cluster_nodes) = std::env::var("REDIS_CLUSTER_NODES") {
            // Modo cluster si se especifican nodos
            let nodes: Vec<String> = cluster_nodes
                .split(',')
                .map(|s| s.trim().to_string())
                .collect();
            RedisMode::Cluster { nodes }
        } else if let Ok(url) = std::env::var("REDIS_URL") {
            // Modo standalone con URL personalizada
            RedisMode::Standalone { url }
        } else {
            // Default a localhost
            RedisMode::Standalone {
                url: "redis://localhost:6379".to_string(),
            }
        };

        DistributedCacheConfig {
            mode,
            prefix: std::env::var("REDIS_PREFIX").unwrap_or_else(|_| "qr_engine_v2".to_string()),
            ttl: std::time::Duration::from_secs(
                std::env::var("REDIS_TTL")
                    .ok()
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(3600),
            ),
            max_connections: std::env::var("REDIS_MAX_CONNECTIONS")
                .ok()
                .and_then(|s| s.parse::<u32>().ok())
                .unwrap_or(10),
            connection_timeout: std::time::Duration::from_secs(5),
            warm_cache: std::env::var("REDIS_WARM_CACHE")
                .ok()
                .map(|s| s.to_lowercase() == "true")
                .unwrap_or(false),
            enable_stats: std::env::var("REDIS_ENABLE_STATS")
                .ok()
                .map(|s| s.to_lowercase() == "true")
                .unwrap_or(true),
        }
    }

    /// Genera un código QR con routing automático por complejidad
    pub async fn generate(&self, request: QrRequest) -> QrResult<QrOutput> {
        // 1. Generar clave de cache
        let cache_key = self.generate_cache_key(&request);
        
        // 2. Verificar cache
        {
            let mut cache = self.cache.write().await;
            if let Some(cached) = cache.get(&cache_key) {
                tracing::debug!("Cache hit for QR generation");
                return Ok(QrOutput {
                    data: cached.svg,
                    format: OutputFormat::Svg,
                    metadata: QrMetadata {
                        generation_time_ms: 0, // Cached, no generation time
                        complexity_level: self.router.determine_complexity(&request),
                        features_used: vec!["cached".to_string()],
                        quality_score: 1.0,
                    },
                });
            }
        }
        
        // 3. Determinar nivel de complejidad
        let complexity = self.router.determine_complexity(&request);
        
        // 4. Rutear a la pipeline correspondiente
        let output = match complexity {
            ComplexityLevel::Basic => self.generate_basic(request).await,
            ComplexityLevel::Medium => self.generate_medium(request).await,
            ComplexityLevel::Advanced => self.generate_advanced(request).await,
            ComplexityLevel::Ultra => self.generate_ultra(request).await,
        }?;
        
        // 5. Guardar en cache
        {
            let mut cache = self.cache.write().await;
            let cached_qr = crate::cache::redis::CachedQR {
                svg: output.data.clone(),
                metadata: crate::cache::redis::QRMetadata {
                    version: 1,
                    modules: 0, // TODO: Obtener de QR generado
                    error_correction: "M".to_string(), // TODO: Obtener de request
                    processing_time_ms: output.metadata.generation_time_ms,
                },
                generated_at: chrono::Utc::now().timestamp(),
            };
            
            if let Err(e) = cache.set(&cache_key, &cached_qr) {
                tracing::warn!("Failed to cache QR code: {}", e);
            }
        }
        
        Ok(output)
    }

    /// Genera clave de cache para una request
    fn generate_cache_key(&self, request: &QrRequest) -> String {
        // Generar hash único basado en los datos y opciones
        use sha2::{Sha256, Digest};
        use std::fmt::Write;
        
        let mut hasher = Sha256::new();
        hasher.update(request.data.as_bytes());
        hasher.update(&request.size.to_le_bytes());
        
        if let Some(custom) = &request.customization {
            let options_str = format!("{:?}", custom);
            hasher.update(options_str.as_bytes());
        }
        
        let result = hasher.finalize();
        let mut key = String::with_capacity(16);
        for byte in &result[..8] {
            write!(&mut key, "{:02x}", byte).unwrap();
        }
        
        key
    }

    /// Generación básica - Target: <20ms
    async fn generate_basic(&self, request: QrRequest) -> QrResult<QrOutput> {
        let start = std::time::Instant::now();
        
        // Generar QR básico
        let qr_code = self.generator.generate_basic(&request.data, request.size)?;
        
        // Convertir a output
        let output = QrOutput {
            data: qr_code.to_svg(),
            format: OutputFormat::Svg,
            metadata: QrMetadata {
                generation_time_ms: start.elapsed().as_millis() as u64,
                complexity_level: ComplexityLevel::Basic,
                features_used: vec!["basic_generation".to_string()],
                quality_score: 1.0,
            },
        };
        
        Ok(output)
    }

    /// Generación media - Target: <50ms
    async fn generate_medium(&self, request: QrRequest) -> QrResult<QrOutput> {
        let start = std::time::Instant::now();
        
        // Generar base
        let mut qr_code = self.generator.generate_basic(&request.data, request.size)?;
        
        // Aplicar personalizaciones medias
        if let Some(customization) = &request.customization {
            qr_code = self.customizer.apply_medium_customization(qr_code, customization)?;
        }
        
        // Optimizar
        qr_code = self.optimizer.optimize_for_scan(qr_code)?;
        
        // Validar
        let validation = self.validator.validate_basic(&qr_code)?;
        
        let output = QrOutput {
            data: qr_code.to_svg(),
            format: OutputFormat::Svg,
            metadata: QrMetadata {
                generation_time_ms: start.elapsed().as_millis() as u64,
                complexity_level: ComplexityLevel::Medium,
                features_used: self.get_used_features(&request),
                quality_score: validation.score,
            },
        };
        
        Ok(output)
    }

    /// Generación avanzada - Target: <100ms
    async fn generate_advanced(&self, request: QrRequest) -> QrResult<QrOutput> {
        let start = std::time::Instant::now();
        
        // Pipeline paralela con rayon
        let (qr_code, logo_result, frame_info, effects_info) = rayon::scope(|_s| -> QrResult<(QrCode, Option<crate::engine::customizer::LogoIntegrationResult>, Option<crate::engine::customizer::FrameInfo>, Option<crate::engine::customizer::EffectsInfo>)> {
            // Generar base en paralelo con preparación de assets
            let (qr_code, assets) = rayon::join(
                || self.generator.generate_basic(&request.data, request.size),
                || self.prepare_advanced_assets(&request),
            );
            
            let qr_code = qr_code?;
            let assets = assets?;
            
            // Aplicar customizaciones avanzadas
            if let Some(customization) = &request.customization {
                // Crear una nueva instancia mutable del customizer para esta operación
                let mut customizer = QrCustomizer::new();
                let (customized_qr, logo_res, frame_inf, effects_inf) = customizer.apply_advanced_customization(
                    qr_code, 
                    customization,
                    assets
                )?;
                Ok((customized_qr, logo_res, frame_inf, effects_inf))
            } else {
                Ok((qr_code, None, None, None))
            }
        })?;
        
        // Optimización final
        let qr_code = self.optimizer.optimize_advanced(qr_code)?;
        
        // Validación exhaustiva
        let validation = self.validator.validate_comprehensive(&qr_code)?;
        
        // Generar SVG con logo, marco y efectos si existen
        let svg = qr_code.to_svg_with_options(
            10, 
            logo_result.as_ref(), 
            frame_info.as_ref(),
            effects_info.as_ref(),
            request.customization.as_ref()
        );
        
        let output = QrOutput {
            data: svg,
            format: OutputFormat::Svg,
            metadata: QrMetadata {
                generation_time_ms: start.elapsed().as_millis() as u64,
                complexity_level: ComplexityLevel::Advanced,
                features_used: self.get_used_features(&request),
                quality_score: validation.score,
            },
        };
        
        Ok(output)
    }

    /// Generación ultra - Target: <200ms
    async fn generate_ultra(&self, request: QrRequest) -> QrResult<QrOutput> {
        // TODO: Implementar en fase 3
        self.generate_advanced(request).await
    }

    /// Prepara assets para generación avanzada
    fn prepare_advanced_assets(&self, request: &QrRequest) -> QrResult<AdvancedAssets> {
        let mut assets = AdvancedAssets::default();
        
        if let Some(customization) = &request.customization {
            // Preparar logo si existe
            if let Some(logo_data) = &customization.logo {
                assets.logo = Some(self.optimizer.prepare_logo(logo_data)?);
            }
            
            // Pre-calcular gradientes
            if let Some(gradient) = &customization.gradient {
                assets.gradient_data = Some(self.customizer.precompute_gradient(gradient)?);
            }
        }
        
        Ok(assets)
    }

    /// Obtiene lista de características usadas
    fn get_used_features(&self, request: &QrRequest) -> Vec<String> {
        let mut features = vec!["basic_generation".to_string()];
        
        if let Some(customization) = &request.customization {
            if customization.eye_shape.is_some() {
                features.push("custom_eyes".to_string());
            }
            if customization.data_pattern.is_some() {
                features.push("custom_pattern".to_string());
            }
            if customization.gradient.is_some() {
                features.push("gradient".to_string());
            }
            if customization.logo.is_some() {
                features.push("logo_embedding".to_string());
            }
            if customization.frame.is_some() {
                features.push("frame_decoration".to_string());
            }
            if let Some(effects) = &customization.effects {
                if !effects.is_empty() {
                    features.push("visual_effects".to_string());
                    for effect_opt in effects {
                        features.push(format!("effect_{:?}", effect_opt.effect_type).to_lowercase());
                    }
                }
            }
        }
        
        features
    }

    /// Obtiene estadísticas del cache distribuido
    pub async fn get_cache_stats(&self) -> QrResult<crate::cache::distributed::DistributedCacheStats> {
        let mut cache = self.cache.write().await;
        cache.stats().map_err(|e| QrError::CacheError(e.to_string()))
    }

    /// Limpia el cache por patrón
    pub async fn clear_cache_pattern(&self, pattern: &str) -> QrResult<usize> {
        let mut cache = self.cache.write().await;
        cache.clear_pattern(pattern).map_err(|e| QrError::CacheError(e.to_string()))
    }

    /// Limpia todo el cache
    pub async fn clear_all_cache(&self) -> QrResult<usize> {
        self.clear_cache_pattern("").await
    }

    /// Pre-calienta el cache con patrones comunes
    pub async fn warm_cache(&self, patterns: Vec<String>) -> QrResult<usize> {
        let mut cache = self.cache.write().await;
        cache.warm_cache(patterns).await.map_err(|e| QrError::CacheError(e.to_string()))
    }
}

/// Instancia global del motor QR
pub static QR_ENGINE: Lazy<QrEngine> = Lazy::new(QrEngine::new);

#[cfg(test)]
mod test_integration;
#[cfg(test)]
mod ecl_optimizer_tests;
#[cfg(test)]
mod zones_tests;
#[cfg(test)]
mod geometry_tests;