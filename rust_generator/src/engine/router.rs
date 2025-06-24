// engine/router.rs - Sistema de routing por complejidad

use super::types::*;

/// Router que determina el nivel de complejidad de una solicitud
pub struct ComplexityRouter {
    /// Umbrales de características para cada nivel
    thresholds: ComplexityThresholds,
}

#[derive(Debug, Clone)]
struct ComplexityThresholds {
    /// Tamaño máximo para considerarse básico
    basic_max_size: u32,
    
    /// Número de características para nivel medio
    medium_features_count: usize,
    
    /// Número de características para nivel avanzado
    advanced_features_count: usize,
    
    /// Características que fuerzan nivel ultra
    ultra_features: Vec<String>,
}

impl Default for ComplexityThresholds {
    fn default() -> Self {
        Self {
            basic_max_size: 600,
            medium_features_count: 2,
            advanced_features_count: 4,
            ultra_features: vec![
                "complex_frame".to_string(),
                "multiple_effects".to_string(),
                "animated".to_string(),
            ],
        }
    }
}

impl ComplexityRouter {
    pub fn new() -> Self {
        Self {
            thresholds: ComplexityThresholds::default(),
        }
    }
    
    /// Determina el nivel de complejidad basado en la solicitud
    pub fn determine_complexity(&self, request: &QrRequest) -> ComplexityLevel {
        // Contar características activas
        let feature_count = self.count_features(request);
        let has_ultra_features = self.has_ultra_features(request);
        
        // Logging para debugging
        tracing::debug!(
            data_length = request.data.len(),
            size = request.size,
            feature_count = feature_count,
            has_ultra_features = has_ultra_features,
            "Determining complexity level"
        );
        
        // Determinar nivel basado en reglas
        match (request.customization.as_ref(), feature_count, has_ultra_features) {
            // Sin personalización = básico
            (None, _, _) => ComplexityLevel::Basic,
            
            // Con características ultra = ultra
            (Some(_), _, true) => ComplexityLevel::Ultra,
            
            // Por número de características
            (Some(custom), count, false) => {
                // Efectos siempre requieren nivel avanzado como mínimo
                if custom.effects.is_some() && custom.effects.as_ref().unwrap().len() > 0 {
                    if count > self.thresholds.advanced_features_count {
                        ComplexityLevel::Ultra
                    } else {
                        ComplexityLevel::Advanced
                    }
                } else if count <= 1 && request.size <= self.thresholds.basic_max_size {
                    ComplexityLevel::Basic
                } else if count <= self.thresholds.medium_features_count {
                    ComplexityLevel::Medium
                } else if count <= self.thresholds.advanced_features_count {
                    ComplexityLevel::Advanced
                } else {
                    ComplexityLevel::Ultra
                }
            }
        }
    }
    
    /// Cuenta el número de características activas
    fn count_features(&self, request: &QrRequest) -> usize {
        let mut count = 0;
        
        if let Some(custom) = &request.customization {
            // Características básicas
            if custom.eye_shape.is_some() {
                count += 1;
            }
            if custom.data_pattern.is_some() {
                count += 1;
            }
            if custom.colors.is_some() {
                count += 1;
            }
            
            // Características avanzadas
            if let Some(gradient) = &custom.gradient {
                if gradient.enabled {
                    count += 1;
                    // Gradientes complejos cuentan extra
                    if matches!(gradient.gradient_type, GradientType::Conic | GradientType::Spiral) {
                        count += 1;
                    }
                }
            }
            
            if custom.logo.is_some() {
                count += 2; // Los logos son complejos
            }
            
            if custom.frame.is_some() {
                count += 1;
            }
            
            // Efectos
            if let Some(effects) = &custom.effects {
                count += effects.len();
            }
        }
        
        // Tamaño grande cuenta como característica
        if request.size > 1000 {
            count += 1;
        }
        
        // Datos muy largos cuentan
        if request.data.len() > 500 {
            count += 1;
        }
        
        count
    }
    
    /// Verifica si tiene características que fuerzan nivel ultra
    fn has_ultra_features(&self, request: &QrRequest) -> bool {
        if let Some(custom) = &request.customization {
            // Múltiples efectos
            if let Some(effects) = &custom.effects {
                if effects.len() > 2 {
                    return true;
                }
            }
            
            // Marcos complejos
            if let Some(frame) = &custom.frame {
                if matches!(frame.frame_type, FrameType::Speech | FrameType::Badge) {
                    return true;
                }
            }
            
            // Gradientes muy complejos
            if let Some(gradient) = &custom.gradient {
                if gradient.colors.len() > 3 {
                    return true;
                }
            }
            
            // Combinaciones complejas
            if custom.logo.is_some() && custom.gradient.is_some() {
                if let Some(effects) = &custom.effects {
                    if !effects.is_empty() {
                        return true;
                    }
                }
            }
        }
        
        false
    }
    
    /// Estima el tiempo de generación basado en complejidad
    pub fn estimate_generation_time(&self, level: ComplexityLevel) -> std::time::Duration {
        match level {
            ComplexityLevel::Basic => std::time::Duration::from_millis(20),
            ComplexityLevel::Medium => std::time::Duration::from_millis(50),
            ComplexityLevel::Advanced => std::time::Duration::from_millis(100),
            ComplexityLevel::Ultra => std::time::Duration::from_millis(200),
        }
    }
    
    /// Obtiene límites de recursos para un nivel
    pub fn get_resource_limits(&self, level: ComplexityLevel) -> ResourceLimits {
        match level {
            ComplexityLevel::Basic => ResourceLimits {
                max_memory_mb: 10,
                max_cpu_threads: 1,
                timeout_ms: 100,
            },
            ComplexityLevel::Medium => ResourceLimits {
                max_memory_mb: 25,
                max_cpu_threads: 2,
                timeout_ms: 200,
            },
            ComplexityLevel::Advanced => ResourceLimits {
                max_memory_mb: 50,
                max_cpu_threads: 4,
                timeout_ms: 500,
            },
            ComplexityLevel::Ultra => ResourceLimits {
                max_memory_mb: 100,
                max_cpu_threads: 8,
                timeout_ms: 1000,
            },
        }
    }
}

/// Límites de recursos por nivel
#[derive(Debug, Clone)]
pub struct ResourceLimits {
    pub max_memory_mb: usize,
    pub max_cpu_threads: usize,
    pub timeout_ms: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_routing() {
        let router = ComplexityRouter::new();
        
        // Sin personalización = básico
        let request = QrRequest {
            data: "https://example.com".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: None,
        };
        
        assert_eq!(router.determine_complexity(&request), ComplexityLevel::Basic);
    }
    
    #[test]
    fn test_medium_routing() {
        let router = ComplexityRouter::new();
        
        // Con algunas personalizaciones = medio
        let request = QrRequest {
            data: "https://example.com".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: Some(EyeShape::RoundedSquare),
                data_pattern: Some(DataPattern::Dots),
                colors: None,
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: None,
                logo_size_ratio: None,
            }),
        };
        
        assert_eq!(router.determine_complexity(&request), ComplexityLevel::Medium);
    }
    
    #[test]
    fn test_advanced_routing() {
        let router = ComplexityRouter::new();
        
        // Con logo = avanzado
        let request = QrRequest {
            data: "https://example.com".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: Some(EyeShape::RoundedSquare),
                data_pattern: None,
                colors: None,
                gradient: None,
                logo: Some(LogoOptions {
                    data: "base64...".to_string(),
                    size_percentage: 20.0,
                    padding: 5,
                    background: None,
                    shape: LogoShape::Circle,
                }),
                frame: None,
                effects: None,
                error_correction: None,
                logo_size_ratio: None,
            }),
        };
        
        assert_eq!(router.determine_complexity(&request), ComplexityLevel::Advanced);
    }
}