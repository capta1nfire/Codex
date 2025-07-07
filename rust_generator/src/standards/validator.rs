// standards/validator.rs - Validador de estándares industriales

use crate::engine::error::{QrError, QrResult};
use crate::engine::types::QrCode;
use std::collections::HashMap;

/// Perfil de validación para diferentes industrias
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ValidationProfile {
    /// Retail/CPG - Consumer Packaged Goods
    Retail,
    /// Healthcare/Farmacéutica
    Healthcare,
    /// Logística y transporte
    Logistics,
    /// Manufactura
    Manufacturing,
    /// Alimentos y bebidas
    FoodBeverage,
    /// General - validación básica
    General,
}

/// Resultado de validación
#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub profile: ValidationProfile,
    pub score: f32, // 0.0 - 1.0
    pub issues: Vec<ValidationIssue>,
    pub warnings: Vec<ValidationWarning>,
    pub compliance: HashMap<String, bool>,
}

/// Problema de validación
#[derive(Debug, Clone)]
pub struct ValidationIssue {
    pub code: String,
    pub severity: ValidationSeverity,
    pub message: String,
    pub standard: Option<String>,
}

/// Advertencia de validación
#[derive(Debug, Clone)]
pub struct ValidationWarning {
    pub code: String,
    pub message: String,
    pub recommendation: Option<String>,
}

/// Severidad del problema
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ValidationSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Validador de estándares industriales
pub struct StandardValidator {
    profiles: HashMap<ValidationProfile, ProfileConfig>,
}

/// Configuración de un perfil de validación
struct ProfileConfig {
    name: &'static str,
    required_standards: Vec<Standard>,
    min_module_size: f32,
    min_quiet_zone: usize,
    max_data_capacity: f32, // Porcentaje de capacidad usada
    required_ecc_level: Option<crate::engine::types::ErrorCorrectionLevel>,
}

/// Estándar a validar
#[derive(Debug, Clone)]
enum Standard {
    ISO15415,      // Calidad de impresión 2D
    ISO15416,      // Calidad de impresión 1D
    GS1General,    // Especificaciones generales GS1
    GS1Healthcare, // GS1 para healthcare
    AnsiMh10,      // Estándar logístico
    FdaUdi,        // Unique Device Identification
}

impl StandardValidator {
    pub fn new() -> Self {
        let mut profiles = HashMap::new();
        
        // Perfil Retail
        profiles.insert(ValidationProfile::Retail, ProfileConfig {
            name: "Retail/CPG",
            required_standards: vec![
                Standard::ISO15415,
                Standard::GS1General,
            ],
            min_module_size: 0.33, // mm
            min_quiet_zone: 4,
            max_data_capacity: 0.4,
            required_ecc_level: Some(crate::engine::types::ErrorCorrectionLevel::Medium),
        });
        
        // Perfil Healthcare
        profiles.insert(ValidationProfile::Healthcare, ProfileConfig {
            name: "Healthcare/Pharmaceutical",
            required_standards: vec![
                Standard::ISO15415,
                Standard::GS1Healthcare,
                Standard::FdaUdi,
            ],
            min_module_size: 0.25,
            min_quiet_zone: 4,
            max_data_capacity: 0.3,
            required_ecc_level: Some(crate::engine::types::ErrorCorrectionLevel::High),
        });
        
        // Perfil Logística
        profiles.insert(ValidationProfile::Logistics, ProfileConfig {
            name: "Logistics/Transport",
            required_standards: vec![
                Standard::ISO15415,
                Standard::AnsiMh10,
            ],
            min_module_size: 0.5,
            min_quiet_zone: 6,
            max_data_capacity: 0.5,
            required_ecc_level: Some(crate::engine::types::ErrorCorrectionLevel::Quartile),
        });
        
        // Perfil Manufactura
        profiles.insert(ValidationProfile::Manufacturing, ProfileConfig {
            name: "Manufacturing",
            required_standards: vec![
                Standard::ISO15415,
            ],
            min_module_size: 0.38,
            min_quiet_zone: 4,
            max_data_capacity: 0.6,
            required_ecc_level: Some(crate::engine::types::ErrorCorrectionLevel::Medium),
        });
        
        // Perfil Alimentos
        profiles.insert(ValidationProfile::FoodBeverage, ProfileConfig {
            name: "Food & Beverage",
            required_standards: vec![
                Standard::ISO15415,
                Standard::GS1General,
            ],
            min_module_size: 0.33,
            min_quiet_zone: 4,
            max_data_capacity: 0.35,
            required_ecc_level: Some(crate::engine::types::ErrorCorrectionLevel::High),
        });
        
        // Perfil General
        profiles.insert(ValidationProfile::General, ProfileConfig {
            name: "General Purpose",
            required_standards: vec![],
            min_module_size: 0.25,
            min_quiet_zone: 2,
            max_data_capacity: 0.7,
            required_ecc_level: None,
        });
        
        Self { profiles }
    }
    
    /// Valida un código QR según un perfil específico
    pub fn validate(&self, qr: &QrCode, profile: ValidationProfile, data: &str) -> QrResult<ValidationResult> {
        let config = self.profiles.get(&profile)
            .ok_or_else(|| QrError::ValidationError("Perfil de validación no encontrado".to_string()))?;
        
        let mut issues = Vec::new();
        let mut warnings = Vec::new();
        let mut compliance = HashMap::new();
        let mut score = 100.0f32;
        
        // Validar zona de silencio
        if qr.quiet_zone < config.min_quiet_zone {
            issues.push(ValidationIssue {
                code: "QZ001".to_string(),
                severity: ValidationSeverity::Error,
                message: format!(
                    "Zona de silencio insuficiente: {} módulos (mínimo requerido: {})",
                    qr.quiet_zone, config.min_quiet_zone
                ),
                standard: Some("ISO/IEC 18004".to_string()),
            });
            score -= 20.0;
        }
        compliance.insert("quiet_zone".to_string(), qr.quiet_zone >= config.min_quiet_zone);
        
        // Validar tamaño del módulo (asumiendo 10 pixels por mm para la demo)
        let module_size_mm = 1.0 / 10.0; // Simplificado
        if module_size_mm < config.min_module_size {
            issues.push(ValidationIssue {
                code: "MS001".to_string(),
                severity: ValidationSeverity::Error,
                message: format!(
                    "Tamaño de módulo muy pequeño: {:.2}mm (mínimo: {:.2}mm)",
                    module_size_mm, config.min_module_size
                ),
                standard: Some("ISO/IEC 15415".to_string()),
            });
            score -= 15.0;
        }
        compliance.insert("module_size".to_string(), module_size_mm >= config.min_module_size);
        
        // Validar capacidad de datos
        let data_capacity = (data.len() as f32) / (qr.size * qr.size) as f32;
        if data_capacity > config.max_data_capacity {
            warnings.push(ValidationWarning {
                code: "DC001".to_string(),
                message: format!(
                    "Alta utilización de capacidad: {:.1}% (recomendado máximo: {:.1}%)",
                    data_capacity * 100.0, config.max_data_capacity * 100.0
                ),
                recommendation: Some("Considere usar un nivel de corrección de errores más alto".to_string()),
            });
            score -= 5.0;
        }
        compliance.insert("data_capacity".to_string(), data_capacity <= config.max_data_capacity);
        
        // Validar nivel de corrección de errores
        if let Some(required_ecc) = config.required_ecc_level {
            if let Some(customization) = &qr.customization {
                let current_ecc = customization.error_correction.unwrap_or(crate::engine::types::ErrorCorrectionLevel::Medium);
                if current_ecc < required_ecc {
                    issues.push(ValidationIssue {
                        code: "ECC001".to_string(),
                        severity: ValidationSeverity::Error,
                        message: format!(
                            "Nivel de corrección de errores insuficiente para perfil {}",
                            config.name
                        ),
                        standard: Some("Industry Best Practice".to_string()),
                    });
                    score -= 25.0;
                }
                compliance.insert("ecc_level".to_string(), current_ecc >= required_ecc);
            }
        }
        
        // Validar estándares específicos
        for standard in &config.required_standards {
            let standard_result = self.validate_standard(qr, data, standard);
            match standard_result {
                Ok(true) => {
                    compliance.insert(format!("{:?}", standard), true);
                },
                Ok(false) => {
                    compliance.insert(format!("{:?}", standard), false);
                    score -= 10.0;
                },
                Err(e) => {
                    issues.push(ValidationIssue {
                        code: "STD001".to_string(),
                        severity: ValidationSeverity::Warning,
                        message: format!("Error validando estándar {:?}: {}", standard, e),
                        standard: Some(format!("{:?}", standard)),
                    });
                    compliance.insert(format!("{:?}", standard), false);
                    score -= 5.0;
                }
            }
        }
        
        // Validaciones adicionales para perfiles específicos
        match profile {
            ValidationProfile::Healthcare => {
                // Validar requisitos FDA UDI
                if !data.contains("(01)") || !data.contains("(17)") || !data.contains("(10)") {
                    issues.push(ValidationIssue {
                        code: "UDI001".to_string(),
                        severity: ValidationSeverity::Error,
                        message: "Faltan elementos requeridos para FDA UDI (GTIN, fecha de caducidad, lote)".to_string(),
                        standard: Some("FDA UDI".to_string()),
                    });
                    score -= 30.0;
                }
            },
            ValidationProfile::FoodBeverage => {
                // Validar trazabilidad alimentaria
                if !data.contains("(01)") || (!data.contains("(10)") && !data.contains("(21)")) {
                    warnings.push(ValidationWarning {
                        code: "FOOD001".to_string(),
                        message: "Recomendado incluir número de lote o serie para trazabilidad completa".to_string(),
                        recommendation: Some("Añadir AI (10) para lote o AI (21) para número de serie".to_string()),
                    });
                    score -= 5.0;
                }
            },
            _ => {}
        }
        
        // Calcular puntuación final
        let final_score = (score.max(0.0) / 100.0).min(1.0f32);
        let is_valid = issues.iter().filter(|i| i.severity >= ValidationSeverity::Error).count() == 0;
        
        Ok(ValidationResult {
            is_valid,
            profile,
            score: final_score,
            issues,
            warnings,
            compliance,
        })
    }
    
    /// Valida un estándar específico
    fn validate_standard(&self, qr: &QrCode, data: &str, standard: &Standard) -> QrResult<bool> {
        match standard {
            Standard::ISO15415 => {
                // Validación simplificada ISO 15415
                // En producción, esto incluiría medición de contraste, decodificación, etc.
                Ok(qr.quiet_zone >= 4 && qr.size >= 21)
            },
            Standard::GS1General => {
                // Verificar que contenga al menos un AI GS1
                Ok(data.contains("(") && data.contains(")"))
            },
            Standard::GS1Healthcare => {
                // Verificar AIs específicos de healthcare
                Ok(data.contains("(01)") && (data.contains("(17)") || data.contains("(7003)")))
            },
            Standard::FdaUdi => {
                // Verificar requisitos UDI
                Ok(data.contains("(01)") && data.contains("(17)") && data.contains("(10)"))
            },
            Standard::AnsiMh10 => {
                // Validación básica ANSI MH10
                Ok(true) // Simplificado
            },
            _ => Ok(true),
        }
    }
    
    /// Genera un reporte detallado de validación
    pub fn generate_report(&self, result: &ValidationResult) -> String {
        let mut report = String::new();
        
        report.push_str(&format!("=== Reporte de Validación - Perfil: {:?} ===\n\n", result.profile));
        report.push_str(&format!("Estado: {}\n", if result.is_valid { "VÁLIDO" } else { "NO VÁLIDO" }));
        report.push_str(&format!("Puntuación: {:.1}%\n\n", result.score * 100.0));
        
        if !result.issues.is_empty() {
            report.push_str("PROBLEMAS ENCONTRADOS:\n");
            for issue in &result.issues {
                report.push_str(&format!("  [{:?}] {} - {}\n", issue.severity, issue.code, issue.message));
                if let Some(std) = &issue.standard {
                    report.push_str(&format!("    Estándar: {}\n", std));
                }
            }
            report.push_str("\n");
        }
        
        if !result.warnings.is_empty() {
            report.push_str("ADVERTENCIAS:\n");
            for warning in &result.warnings {
                report.push_str(&format!("  [{}] {}\n", warning.code, warning.message));
                if let Some(rec) = &warning.recommendation {
                    report.push_str(&format!("    Recomendación: {}\n", rec));
                }
            }
            report.push_str("\n");
        }
        
        report.push_str("CUMPLIMIENTO DE ESTÁNDARES:\n");
        for (standard, compliant) in &result.compliance {
            report.push_str(&format!("  {}: {}\n", standard, if *compliant { "✓" } else { "✗" }));
        }
        
        report
    }
}

impl Default for StandardValidator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_retail_validation() {
        let validator = StandardValidator::new();
        let qr = create_test_qr();
        let data = "(01)01234567890128(10)ABC123";
        
        let result = validator.validate(&qr, ValidationProfile::Retail, data);
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_healthcare_validation() {
        let validator = StandardValidator::new();
        let qr = create_test_qr();
        let data = "(01)01234567890128(17)251231(10)ABC123";
        
        let result = validator.validate(&qr, ValidationProfile::Healthcare, data);
        assert!(result.is_ok());
        
        let validation = result.unwrap();
        assert!(validation.compliance.get("FDA_UDI").copied().unwrap_or(false));
    }
    
    fn create_test_qr() -> QrCode {
        QrCode {
            matrix: vec![vec![false; 25]; 25],
            size: 25,
            quiet_zone: 4,
            customization: Some(crate::engine::types::QrCustomization {
                eye_shape: None,
                eye_border_style: None,
                eye_center_style: None,
                data_pattern: None,
                colors: None,
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: Some(crate::engine::types::ErrorCorrectionLevel::High),
                logo_size_ratio: None,
                selective_effects: None,
            }),
            logo_zone: None,
        }
    }
}