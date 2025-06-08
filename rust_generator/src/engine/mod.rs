// engine/mod.rs - Motor principal de generación QR

pub mod generator;
pub mod customizer;
pub mod validator;
pub mod optimizer;
pub mod router;
pub mod types;
pub mod error;

// Re-exportar tipos principales
pub use generator::QrGenerator;
pub use customizer::QrCustomizer;
pub use validator::QrValidator;
pub use optimizer::QrOptimizer;
pub use router::ComplexityRouter;
pub use types::ComplexityLevel;
pub use types::*;
pub use error::{QrError, QrResult};

use once_cell::sync::Lazy;
use std::sync::Arc;

/// Motor principal del sistema QR
pub struct QrEngine {
    generator: Arc<QrGenerator>,
    customizer: Arc<QrCustomizer>,
    validator: Arc<QrValidator>,
    optimizer: Arc<QrOptimizer>,
    router: Arc<ComplexityRouter>,
}

impl QrEngine {
    /// Crea una nueva instancia del motor QR
    pub fn new() -> Self {
        Self {
            generator: Arc::new(QrGenerator::new()),
            customizer: Arc::new(QrCustomizer::new()),
            validator: Arc::new(QrValidator::new()),
            optimizer: Arc::new(QrOptimizer::new()),
            router: Arc::new(ComplexityRouter::new()),
        }
    }

    /// Genera un código QR con routing automático por complejidad
    pub async fn generate(&self, request: QrRequest) -> QrResult<QrOutput> {
        // 1. Determinar nivel de complejidad
        let complexity = self.router.determine_complexity(&request);
        
        // 2. Rutear a la pipeline correspondiente
        match complexity {
            ComplexityLevel::Basic => self.generate_basic(request).await,
            ComplexityLevel::Medium => self.generate_medium(request).await,
            ComplexityLevel::Advanced => self.generate_advanced(request).await,
            ComplexityLevel::Ultra => self.generate_ultra(request).await,
        }
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
        let qr_code = rayon::scope(|s| -> QrResult<QrCode> {
            // Generar base en paralelo con preparación de assets
            let (mut qr_code, assets) = rayon::join(
                || self.generator.generate_basic(&request.data, request.size),
                || self.prepare_advanced_assets(&request),
            );
            
            let mut qr_code = qr_code?;
            let assets = assets?;
            
            // Aplicar customizaciones avanzadas
            if let Some(customization) = &request.customization {
                qr_code = self.customizer.apply_advanced_customization(
                    qr_code, 
                    customization,
                    assets
                )?;
            }
            
            Ok(qr_code)
        })?;
        
        // Optimización final
        let qr_code = self.optimizer.optimize_advanced(qr_code)?;
        
        // Validación exhaustiva
        let validation = self.validator.validate_comprehensive(&qr_code)?;
        
        let output = QrOutput {
            data: qr_code.to_svg(),
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
        }
        
        features
    }
}

/// Instancia global del motor QR
pub static QR_ENGINE: Lazy<QrEngine> = Lazy::new(QrEngine::new);

#[cfg(test)]
mod test_integration;