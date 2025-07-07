// engine/validator.rs - Sistema de validación de QR

use super::types::*;
use super::error::{QrResult, QrError};

/// Validador de códigos QR
pub struct QrValidator {
    min_contrast_ratio: f32,
    min_quality_score: f32,
}

impl QrValidator {
    pub fn new() -> Self {
        Self {
            min_contrast_ratio: 3.0,  // WCAG AA
            min_quality_score: 0.85,
        }
    }
    
    /// Validación básica rápida
    pub fn validate_basic(&self, qr: &QrCode) -> QrResult<ValidationResult> {
        let mut issues = Vec::new();
        let mut score = 1.0;
        
        // Verificar tamaño mínimo
        if qr.size < 21 {  // QR v1 mínimo
            issues.push(ValidationIssue {
                severity: IssueSeverity::Error,
                message: "QR code demasiado pequeño".to_string(),
            });
            score -= 0.5;
        }
        
        // TODO: Más validaciones en Fase 4
        
        Ok(ValidationResult {
            score,
            scan_success: score >= self.min_quality_score,
            issues,
            recommendations: vec![],
        })
    }
    
    /// Validación exhaustiva
    pub fn validate_comprehensive(&self, qr: &QrCode) -> QrResult<ValidationResult> {
        // Por ahora usar validación básica
        // TODO: Implementar validación completa en Fase 4
        self.validate_basic(qr)
    }
    
    /// Valida contraste entre colores según WCAG
    pub fn validate_contrast(&self, fg: &str, bg: &str) -> QrResult<f32> {
        let fg_lum = self.calculate_relative_luminance(fg)?;
        let bg_lum = self.calculate_relative_luminance(bg)?;
        
        // Calcular ratio de contraste según WCAG
        let (lighter, darker) = if fg_lum > bg_lum {
            (fg_lum, bg_lum)
        } else {
            (bg_lum, fg_lum)
        };
        
        let contrast_ratio = (lighter + 0.05) / (darker + 0.05);
        Ok(contrast_ratio)
    }
    
    /// Valida contraste de ojos con el fondo
    pub fn validate_eye_contrast(&self, eye_colors: &EyeColors, background: &str) -> QrResult<Vec<ValidationIssue>> {
        let mut issues = Vec::new();
        
        // Validar colores generales de ojos
        if let Some(outer_color) = &eye_colors.outer {
            let contrast = self.validate_contrast(outer_color, background)?;
            if contrast < self.min_contrast_ratio {
                issues.push(ValidationIssue {
                    severity: IssueSeverity::Warning,
                    message: format!("El color exterior de los ojos ({}) tiene un contraste bajo ({:.2}:1) con el fondo. Mínimo recomendado: {:.1}:1", 
                        outer_color, contrast, self.min_contrast_ratio),
                });
            }
        }
        
        if let Some(inner_color) = &eye_colors.inner {
            let contrast = self.validate_contrast(inner_color, background)?;
            if contrast < self.min_contrast_ratio {
                issues.push(ValidationIssue {
                    severity: IssueSeverity::Warning,
                    message: format!("El color interior de los ojos ({}) tiene un contraste bajo ({:.2}:1) con el fondo. Mínimo recomendado: {:.1}:1", 
                        inner_color, contrast, self.min_contrast_ratio),
                });
            }
        }
        
        // Validar colores por ojo individual
        if let Some(per_eye) = &eye_colors.per_eye {
            let eye_positions = [("superior izquierdo", &per_eye.top_left), 
                                 ("superior derecho", &per_eye.top_right), 
                                 ("inferior izquierdo", &per_eye.bottom_left)];
            
            for (position, eye_color_opt) in eye_positions {
                if let Some(eye_color) = eye_color_opt {
                    let outer_contrast = self.validate_contrast(&eye_color.outer, background)?;
                    if outer_contrast < self.min_contrast_ratio {
                        issues.push(ValidationIssue {
                            severity: IssueSeverity::Warning,
                            message: format!("El ojo {} tiene color exterior ({}) con contraste bajo ({:.2}:1)", 
                                position, eye_color.outer, outer_contrast),
                        });
                    }
                    
                    let inner_contrast = self.validate_contrast(&eye_color.inner, background)?;
                    if inner_contrast < self.min_contrast_ratio {
                        issues.push(ValidationIssue {
                            severity: IssueSeverity::Warning,
                            message: format!("El ojo {} tiene color interior ({}) con contraste bajo ({:.2}:1)", 
                                position, eye_color.inner, inner_contrast),
                        });
                    }
                }
            }
        }
        
        Ok(issues)
    }
    
    /// Calcula la luminancia relativa de un color según WCAG
    fn calculate_relative_luminance(&self, hex_color: &str) -> QrResult<f32> {
        // Parsear color hex
        let color = hex_color.trim_start_matches('#');
        if color.len() != 6 {
            return Err(QrError::ValidationError(format!("Color inválido: {}", hex_color)));
        }
        
        let r = u8::from_str_radix(&color[0..2], 16)
            .map_err(|_| QrError::ValidationError(format!("Color inválido: {}", hex_color)))?;
        let g = u8::from_str_radix(&color[2..4], 16)
            .map_err(|_| QrError::ValidationError(format!("Color inválido: {}", hex_color)))?;
        let b = u8::from_str_radix(&color[4..6], 16)
            .map_err(|_| QrError::ValidationError(format!("Color inválido: {}", hex_color)))?;
        
        // Convertir a sRGB lineal
        let r_linear = self.srgb_to_linear(r as f32 / 255.0);
        let g_linear = self.srgb_to_linear(g as f32 / 255.0);
        let b_linear = self.srgb_to_linear(b as f32 / 255.0);
        
        // Calcular luminancia relativa según WCAG
        Ok(0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear)
    }
    
    /// Convierte sRGB a espacio lineal
    fn srgb_to_linear(&self, value: f32) -> f32 {
        if value <= 0.03928 {
            value / 12.92
        } else {
            ((value + 0.055) / 1.055).powf(2.4)
        }
    }
}