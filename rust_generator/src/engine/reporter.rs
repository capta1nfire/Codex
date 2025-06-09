// engine/reporter.rs - Sistema de reportes de calidad

use super::types::*;
use super::error::QrResult;
use crate::standards::validator::{ValidationResult, ValidationSeverity};
use crate::standards::decoder::{DecodedData, DamageLevel};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};

/// Generador de reportes de calidad
pub struct QualityReporter {
    include_recommendations: bool,
    include_technical_details: bool,
    format_options: ReportFormatOptions,
}

/// Opciones de formato para reportes
#[derive(Debug, Clone)]
pub struct ReportFormatOptions {
    pub include_charts: bool,
    pub include_images: bool,
    pub language: ReportLanguage,
    pub detail_level: DetailLevel,
}

/// Idioma del reporte
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReportLanguage {
    English,
    Spanish,
}

/// Nivel de detalle
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DetailLevel {
    Summary,
    Standard,
    Detailed,
    Technical,
}

/// Reporte de calidad completo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityReport {
    /// ID único del reporte
    pub report_id: String,
    /// Timestamp de generación
    pub generated_at: DateTime<Utc>,
    /// Información del código QR
    pub qr_info: QrInfo,
    /// Resultados de validación
    pub validation_results: HashMap<String, ValidationSummary>,
    /// Resultados de decodificación
    pub decode_results: Option<DecodeSummary>,
    /// Puntuación general
    pub overall_score: QualityScore,
    /// Recomendaciones
    pub recommendations: Vec<Recommendation>,
    /// Certificaciones obtenidas
    pub certifications: Vec<Certification>,
    /// Metadatos adicionales
    pub metadata: ReportMetadata,
}

/// Información del QR analizado
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrInfo {
    pub data_content: String,
    pub size: u32,
    pub version: u8,
    pub error_correction: ErrorCorrectionLevel,
    pub customization_features: Vec<String>,
}

/// Resumen de validación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationSummary {
    pub profile: String,
    pub passed: bool,
    pub score: f32,
    pub critical_issues: u32,
    pub warnings: u32,
    pub compliance_rate: f32,
}

/// Resumen de decodificación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecodeSummary {
    pub successful: bool,
    pub decode_time_ms: u64,
    pub content_type: String,
    pub quality_score: f32,
    pub damage_level: String,
}

/// Puntuación de calidad general
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityScore {
    pub overall: f32,
    pub technical: f32,
    pub compliance: f32,
    pub readability: f32,
    pub durability: f32,
    pub grade: QualityGrade,
}

/// Grado de calidad
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum QualityGrade {
    A,  // Excelente (90-100%)
    B,  // Bueno (80-89%)
    C,  // Aceptable (70-79%)
    D,  // Marginal (60-69%)
    F,  // Fallo (<60%)
}

/// Recomendación
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub category: RecommendationCategory,
    pub priority: RecommendationPriority,
    pub message: String,
    pub action: String,
    pub impact: String,
}

/// Categoría de recomendación
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RecommendationCategory {
    Design,
    Technical,
    Compliance,
    Performance,
    Security,
}

/// Prioridad de recomendación
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RecommendationPriority {
    Critical,
    High,
    Medium,
    Low,
}

/// Certificación obtenida
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Certification {
    pub standard: String,
    pub level: String,
    pub compliant: bool,
    pub details: String,
}

/// Metadatos del reporte
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportMetadata {
    pub generator_version: String,
    pub analysis_duration_ms: u64,
    pub tests_performed: Vec<String>,
    pub environment: String,
}

impl QualityReporter {
    pub fn new() -> Self {
        Self {
            include_recommendations: true,
            include_technical_details: true,
            format_options: ReportFormatOptions {
                include_charts: true,
                include_images: true,
                language: ReportLanguage::English,
                detail_level: DetailLevel::Standard,
            },
        }
    }
    
    /// Genera un reporte completo de calidad
    pub fn generate_report(
        &self,
        qr: &QrCode,
        data: &str,
        validation_results: Vec<(&str, ValidationResult)>,
        decode_result: Option<DecodedData>,
    ) -> QrResult<QualityReport> {
        let start_time = std::time::Instant::now();
        
        // Procesar resultados de validación
        let mut validation_summaries = HashMap::new();
        let mut total_score = 0.0;
        let mut total_compliance = 0.0;
        
        for (profile_name, result) in &validation_results {
            let critical_issues = result.issues.iter()
                .filter(|i| i.severity == ValidationSeverity::Critical)
                .count() as u32;
            
            let warnings = result.warnings.len() as u32;
            
            let compliance_rate = result.compliance.values()
                .filter(|&&v| v)
                .count() as f32 / result.compliance.len().max(1) as f32;
            
            validation_summaries.insert(
                profile_name.to_string(),
                ValidationSummary {
                    profile: profile_name.to_string(),
                    passed: result.is_valid,
                    score: result.score,
                    critical_issues,
                    warnings,
                    compliance_rate,
                }
            );
            
            total_score += result.score;
            total_compliance += compliance_rate;
        }
        
        // Procesar resultado de decodificación
        let decode_summary = decode_result.as_ref().map(|decoded| {
            DecodeSummary {
                successful: true,
                decode_time_ms: decoded.metadata.decode_time_ms,
                content_type: format!("{:?}", decoded.content_type),
                quality_score: decoded.quality.overall_score,
                damage_level: format!("{:?}", decoded.quality.damage_assessment),
            }
        });
        
        // Calcular puntuaciones
        let num_validations = validation_results.len().max(1) as f32;
        let avg_validation_score = total_score / num_validations;
        let avg_compliance = total_compliance / num_validations;
        
        let technical_score = decode_summary.as_ref()
            .map(|d| d.quality_score)
            .unwrap_or(0.8);
        
        let readability_score = if decode_summary.is_some() { 1.0 } else { 0.0 };
        
        let durability_score = match decode_summary.as_ref()
            .map(|d| d.damage_level.as_str())
            .unwrap_or("None") {
            "None" => 1.0,
            "Minor" => 0.8,
            "Moderate" => 0.5,
            "Severe" => 0.2,
            _ => 0.0,
        };
        
        let overall_score = (avg_validation_score * 0.3 + 
                            avg_compliance * 0.3 + 
                            technical_score * 0.2 + 
                            readability_score * 0.1 + 
                            durability_score * 0.1).min(1.0).max(0.0);
        
        let grade = self.calculate_grade(overall_score);
        
        // Generar recomendaciones
        let recommendations = self.generate_recommendations(
            &validation_results,
            decode_result.as_ref(),
            overall_score
        );
        
        // Generar certificaciones
        let certifications = self.generate_certifications(&validation_results);
        
        // Información del QR
        let qr_info = QrInfo {
            data_content: data.chars().take(50).collect::<String>() + 
                         if data.len() > 50 { "..." } else { "" },
            size: qr.size as u32,
            version: (qr.size / 4 - 4) as u8, // Aproximación
            error_correction: qr.customization.as_ref()
                .and_then(|c| c.error_correction)
                .unwrap_or(ErrorCorrectionLevel::Medium),
            customization_features: self.get_customization_features(qr),
        };
        
        let analysis_duration_ms = start_time.elapsed().as_millis() as u64;
        
        Ok(QualityReport {
            report_id: uuid::Uuid::new_v4().to_string(),
            generated_at: Utc::now(),
            qr_info,
            validation_results: validation_summaries,
            decode_results: decode_summary,
            overall_score: QualityScore {
                overall: overall_score,
                technical: technical_score,
                compliance: avg_compliance,
                readability: readability_score,
                durability: durability_score,
                grade,
            },
            recommendations,
            certifications,
            metadata: ReportMetadata {
                generator_version: env!("CARGO_PKG_VERSION").to_string(),
                analysis_duration_ms,
                tests_performed: self.get_tests_performed(&validation_results),
                environment: "Production".to_string(),
            },
        })
    }
    
    /// Calcula el grado basado en la puntuación
    fn calculate_grade(&self, score: f32) -> QualityGrade {
        match (score * 100.0) as u32 {
            90..=100 => QualityGrade::A,
            80..=89 => QualityGrade::B,
            70..=79 => QualityGrade::C,
            60..=69 => QualityGrade::D,
            _ => QualityGrade::F,
        }
    }
    
    /// Genera recomendaciones basadas en los resultados
    fn generate_recommendations(
        &self,
        validation_results: &[(&str, ValidationResult)],
        decode_result: Option<&DecodedData>,
        overall_score: f32,
    ) -> Vec<Recommendation> {
        let mut recommendations = Vec::new();
        
        // Recomendaciones basadas en validación
        for (profile, result) in validation_results {
            if result.score < 0.8 {
                recommendations.push(Recommendation {
                    category: RecommendationCategory::Compliance,
                    priority: if result.score < 0.6 { 
                        RecommendationPriority::High 
                    } else { 
                        RecommendationPriority::Medium 
                    },
                    message: format!("Mejorar cumplimiento del perfil {}", profile),
                    action: "Revisar y corregir los problemas identificados en la validación".to_string(),
                    impact: format!("Aumentará la puntuación de {} a más del 80%", 
                                   (result.score * 100.0) as u32),
                });
            }
            
            // Recomendaciones específicas por warnings
            for warning in &result.warnings {
                if let Some(rec) = &warning.recommendation {
                    recommendations.push(Recommendation {
                        category: RecommendationCategory::Technical,
                        priority: RecommendationPriority::Medium,
                        message: warning.message.clone(),
                        action: rec.clone(),
                        impact: "Mejorará la compatibilidad y confiabilidad".to_string(),
                    });
                }
            }
        }
        
        // Recomendaciones basadas en decodificación
        if let Some(decoded) = decode_result {
            if decoded.quality.symbol_contrast < 0.7 {
                recommendations.push(Recommendation {
                    category: RecommendationCategory::Design,
                    priority: RecommendationPriority::High,
                    message: "Contraste insuficiente entre módulos".to_string(),
                    action: "Aumentar el contraste entre colores de primer plano y fondo".to_string(),
                    impact: "Mejorará significativamente la legibilidad".to_string(),
                });
            }
            
            if decoded.quality.damage_assessment != DamageLevel::None {
                recommendations.push(Recommendation {
                    category: RecommendationCategory::Technical,
                    priority: RecommendationPriority::Critical,
                    message: "Daño detectado en el símbolo".to_string(),
                    action: "Regenerar o reimprimir el código QR".to_string(),
                    impact: "Garantizará lectura confiable en todos los escáneres".to_string(),
                });
            }
        }
        
        // Recomendaciones generales
        if overall_score < 0.7 {
            recommendations.push(Recommendation {
                category: RecommendationCategory::Performance,
                priority: RecommendationPriority::High,
                message: "Puntuación general baja".to_string(),
                action: "Considerar rediseñar el código QR siguiendo mejores prácticas".to_string(),
                impact: "Mejorará todos los aspectos de calidad y compatibilidad".to_string(),
            });
        }
        
        recommendations
    }
    
    /// Genera certificaciones basadas en los resultados
    fn generate_certifications(&self, validation_results: &[(&str, ValidationResult)]) -> Vec<Certification> {
        let mut certifications = Vec::new();
        
        for (profile, result) in validation_results {
            // ISO 15415
            if result.compliance.get("ISO15415").copied().unwrap_or(false) {
                certifications.push(Certification {
                    standard: "ISO/IEC 15415".to_string(),
                    level: if result.score > 0.9 { "Grade A" } else { "Grade B" }.to_string(),
                    compliant: true,
                    details: "Cumple con estándares de calidad de impresión 2D".to_string(),
                });
            }
            
            // GS1
            if profile.contains("GS1") && result.is_valid {
                certifications.push(Certification {
                    standard: "GS1 General Specifications".to_string(),
                    level: "Compliant".to_string(),
                    compliant: true,
                    details: format!("Cumple con especificaciones GS1 para {}", profile),
                });
            }
            
            // FDA UDI
            if result.compliance.get("FDA_UDI").copied().unwrap_or(false) {
                certifications.push(Certification {
                    standard: "FDA UDI".to_string(),
                    level: "Compliant".to_string(),
                    compliant: true,
                    details: "Cumple con requisitos FDA para identificación única de dispositivos".to_string(),
                });
            }
        }
        
        certifications
    }
    
    /// Obtiene las características de personalización usadas
    fn get_customization_features(&self, qr: &QrCode) -> Vec<String> {
        let mut features = Vec::new();
        
        if let Some(customization) = &qr.customization {
            if customization.eye_shape.is_some() {
                features.push("Custom Eye Shape".to_string());
            }
            if customization.data_pattern.is_some() {
                features.push("Custom Data Pattern".to_string());
            }
            if customization.gradient.is_some() {
                features.push("Gradient Colors".to_string());
            }
            if customization.logo.is_some() {
                features.push("Logo Integration".to_string());
            }
            if customization.frame.is_some() {
                features.push("Decorative Frame".to_string());
            }
            if customization.effects.is_some() {
                features.push("Visual Effects".to_string());
            }
        }
        
        if features.is_empty() {
            features.push("Standard QR".to_string());
        }
        
        features
    }
    
    /// Obtiene la lista de pruebas realizadas
    fn get_tests_performed(&self, validation_results: &[(&str, ValidationResult)]) -> Vec<String> {
        let mut tests = vec![
            "Structure Analysis".to_string(),
            "Module Size Verification".to_string(),
            "Quiet Zone Check".to_string(),
            "Error Correction Validation".to_string(),
        ];
        
        for (profile, _) in validation_results {
            tests.push(format!("{} Profile Validation", profile));
        }
        
        tests.push("Decode Verification".to_string());
        tests.push("Quality Metrics Analysis".to_string());
        
        tests
    }
    
    /// Formatea el reporte en texto plano
    pub fn format_text_report(&self, report: &QualityReport) -> String {
        let mut output = String::new();
        
        // Header
        output.push_str(&"=".repeat(60));
        output.push_str("\n");
        output.push_str("           REPORTE DE CALIDAD DE CÓDIGO QR\n");
        output.push_str(&"=".repeat(60));
        output.push_str("\n\n");
        
        // Información básica
        output.push_str(&format!("ID del Reporte: {}\n", report.report_id));
        output.push_str(&format!("Fecha: {}\n", report.generated_at.format("%Y-%m-%d %H:%M:%S UTC")));
        output.push_str(&format!("Versión del Generador: {}\n", report.metadata.generator_version));
        output.push_str("\n");
        
        // Información del QR
        output.push_str("INFORMACIÓN DEL CÓDIGO QR:\n");
        output.push_str(&"-".repeat(40));
        output.push_str("\n");
        output.push_str(&format!("Contenido: {}\n", report.qr_info.data_content));
        output.push_str(&format!("Tamaño: {}x{}\n", report.qr_info.size, report.qr_info.size));
        output.push_str(&format!("Versión: {}\n", report.qr_info.version));
        output.push_str(&format!("Corrección de Errores: {:?}\n", report.qr_info.error_correction));
        output.push_str(&format!("Características: {}\n", report.qr_info.customization_features.join(", ")));
        output.push_str("\n");
        
        // Puntuación general
        output.push_str("PUNTUACIÓN DE CALIDAD:\n");
        output.push_str(&"-".repeat(40));
        output.push_str("\n");
        output.push_str(&format!("Puntuación General: {:.1}% - Grado {:?}\n", 
                                 report.overall_score.overall * 100.0,
                                 report.overall_score.grade));
        output.push_str(&format!("  Técnica: {:.1}%\n", report.overall_score.technical * 100.0));
        output.push_str(&format!("  Cumplimiento: {:.1}%\n", report.overall_score.compliance * 100.0));
        output.push_str(&format!("  Legibilidad: {:.1}%\n", report.overall_score.readability * 100.0));
        output.push_str(&format!("  Durabilidad: {:.1}%\n", report.overall_score.durability * 100.0));
        output.push_str("\n");
        
        // Resultados de validación
        if !report.validation_results.is_empty() {
            output.push_str("RESULTADOS DE VALIDACIÓN:\n");
            output.push_str(&"-".repeat(40));
            output.push_str("\n");
            for (profile, summary) in &report.validation_results {
                output.push_str(&format!("{}: {} (Score: {:.1}%)\n", 
                                        profile,
                                        if summary.passed { "PASÓ" } else { "FALLÓ" },
                                        summary.score * 100.0));
                if summary.critical_issues > 0 {
                    output.push_str(&format!("  Problemas críticos: {}\n", summary.critical_issues));
                }
                if summary.warnings > 0 {
                    output.push_str(&format!("  Advertencias: {}\n", summary.warnings));
                }
            }
            output.push_str("\n");
        }
        
        // Certificaciones
        if !report.certifications.is_empty() {
            output.push_str("CERTIFICACIONES OBTENIDAS:\n");
            output.push_str(&"-".repeat(40));
            output.push_str("\n");
            for cert in &report.certifications {
                output.push_str(&format!("✓ {} - {}\n", cert.standard, cert.level));
                output.push_str(&format!("  {}\n", cert.details));
            }
            output.push_str("\n");
        }
        
        // Recomendaciones
        if self.include_recommendations && !report.recommendations.is_empty() {
            output.push_str("RECOMENDACIONES:\n");
            output.push_str(&"-".repeat(40));
            output.push_str("\n");
            for (i, rec) in report.recommendations.iter().enumerate() {
                output.push_str(&format!("{}. [{:?}] {}\n", i + 1, rec.priority, rec.message));
                output.push_str(&format!("   Acción: {}\n", rec.action));
                output.push_str(&format!("   Impacto: {}\n", rec.impact));
                output.push_str("\n");
            }
        }
        
        // Footer
        output.push_str(&"-".repeat(60));
        output.push_str("\n");
        output.push_str(&format!("Análisis completado en {}ms\n", report.metadata.analysis_duration_ms));
        output.push_str(&format!("Pruebas realizadas: {}\n", report.metadata.tests_performed.len()));
        
        output
    }
    
    /// Formatea el reporte en HTML
    pub fn format_html_report(&self, report: &QualityReport) -> String {
        format!(r#"<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Calidad QR - {}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; }}
        .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
        .grade-a {{ color: #28a745; }}
        .grade-b {{ color: #17a2b8; }}
        .grade-c {{ color: #ffc107; }}
        .grade-d {{ color: #fd7e14; }}
        .grade-f {{ color: #dc3545; }}
        .score-bar {{ background-color: #e0e0e0; height: 20px; border-radius: 10px; }}
        .score-fill {{ background-color: #28a745; height: 100%; border-radius: 10px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
        .recommendation {{ padding: 10px; margin: 5px 0; background-color: #f9f9f9; }}
        .priority-critical {{ border-left: 4px solid #dc3545; }}
        .priority-high {{ border-left: 4px solid #fd7e14; }}
        .priority-medium {{ border-left: 4px solid #ffc107; }}
        .priority-low {{ border-left: 4px solid #28a745; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Calidad de Código QR</h1>
        <p>ID: {} | Fecha: {}</p>
    </div>
    
    <div class="section">
        <h2>Puntuación General</h2>
        <h1 class="grade-{:?}">Grado {:?} - {:.1}%</h1>
        <div class="score-bar">
            <div class="score-fill" style="width: {:.1}%"></div>
        </div>
    </div>
    
    <!-- Más secciones HTML aquí -->
    
</body>
</html>"#,
        report.report_id,
        report.report_id,
        report.generated_at.format("%Y-%m-%d %H:%M:%S UTC"),
        report.overall_score.grade,
        report.overall_score.grade,
        report.overall_score.overall * 100.0,
        report.overall_score.overall * 100.0
        )
    }
}

impl Default for QualityReporter {
    fn default() -> Self {
        Self::new()
    }
}

// Necesitamos agregar uuid a las dependencias
use uuid;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::standards::validator::{StandardValidator, ValidationProfile};
    
    #[test]
    fn test_report_generation() {
        let reporter = QualityReporter::new();
        
        // Crear QR de prueba
        let qr = QrCode {
            matrix: vec![vec![false; 25]; 25],
            size: 25,
            quiet_zone: 4,
            customization: None,
        };
        
        // Simular resultados de validación
        let validator = StandardValidator::new();
        let validation_result = validator.validate(&qr, ValidationProfile::General, "Test data").unwrap();
        
        let report = reporter.generate_report(
            &qr,
            "Test data",
            vec![("General", validation_result)],
            None
        );
        
        assert!(report.is_ok());
        let report = report.unwrap();
        assert!(!report.report_id.is_empty());
        assert!(report.overall_score.overall >= 0.0 && report.overall_score.overall <= 1.0);
    }
    
    #[test]
    fn test_grade_calculation() {
        let reporter = QualityReporter::new();
        
        assert_eq!(reporter.calculate_grade(0.95), QualityGrade::A);
        assert_eq!(reporter.calculate_grade(0.85), QualityGrade::B);
        assert_eq!(reporter.calculate_grade(0.75), QualityGrade::C);
        assert_eq!(reporter.calculate_grade(0.65), QualityGrade::D);
        assert_eq!(reporter.calculate_grade(0.55), QualityGrade::F);
    }
}