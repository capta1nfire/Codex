// processing/colors.rs - Sistema de colores con validación de contraste

use crate::engine::error::{QrError, QrResult};
use crate::engine::types::{Color, ColorMode};

/// Procesador de colores para QR
pub struct ColorProcessor {
    /// Modo de color por defecto
    default_mode: ColorMode,
}

impl ColorProcessor {
    pub fn new() -> Self {
        Self {
            default_mode: ColorMode::Solid,
        }
    }

    /// Parsea un color desde string hexadecimal
    pub fn parse_color(color_str: &str) -> QrResult<Color> {
        let hex = color_str.trim_start_matches('#');
        
        if hex.len() != 6 {
            return Err(QrError::ValidationError(
                "El color debe ser hexadecimal de 6 dígitos".to_string()
            ));
        }
        
        let r = u8::from_str_radix(&hex[0..2], 16)
            .map_err(|_| QrError::ValidationError("Color hexadecimal inválido".to_string()))?;
        let g = u8::from_str_radix(&hex[2..4], 16)
            .map_err(|_| QrError::ValidationError("Color hexadecimal inválido".to_string()))?;
        let b = u8::from_str_radix(&hex[4..6], 16)
            .map_err(|_| QrError::ValidationError("Color hexadecimal inválido".to_string()))?;
        
        Ok(Color { r, g, b, a: 255 })
    }

    /// Convierte color a string hexadecimal
    pub fn to_hex(color: &Color) -> String {
        format!("#{:02x}{:02x}{:02x}", color.r, color.g, color.b)
    }

    /// Calcula la luminancia relativa de un color
    pub fn relative_luminance(color: &Color) -> f64 {
        let r = Self::gamma_correction(color.r as f64 / 255.0);
        let g = Self::gamma_correction(color.g as f64 / 255.0);
        let b = Self::gamma_correction(color.b as f64 / 255.0);
        
        0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    /// Corrección gamma para cálculo de luminancia
    fn gamma_correction(value: f64) -> f64 {
        if value <= 0.03928 {
            value / 12.92
        } else {
            ((value + 0.055) / 1.055).powf(2.4)
        }
    }

    /// Mezcla dos colores con un ratio
    pub fn blend_colors(color1: &Color, color2: &Color, ratio: f64) -> Color {
        let ratio = ratio.clamp(0.0, 1.0);
        let inv_ratio = 1.0 - ratio;
        
        Color {
            r: (color1.r as f64 * inv_ratio + color2.r as f64 * ratio) as u8,
            g: (color1.g as f64 * inv_ratio + color2.g as f64 * ratio) as u8,
            b: (color1.b as f64 * inv_ratio + color2.b as f64 * ratio) as u8,
            a: (color1.a as f64 * inv_ratio + color2.a as f64 * ratio) as u8,
        }
    }

    /// Ajusta el brillo de un color
    pub fn adjust_brightness(color: &Color, factor: f64) -> Color {
        let factor = factor.clamp(0.0, 2.0);
        
        Color {
            r: (color.r as f64 * factor).min(255.0) as u8,
            g: (color.g as f64 * factor).min(255.0) as u8,
            b: (color.b as f64 * factor).min(255.0) as u8,
            a: color.a,
        }
    }

    /// Ajusta la saturación de un color
    pub fn adjust_saturation(color: &Color, factor: f64) -> Color {
        let factor = factor.clamp(0.0, 2.0);
        
        // Convertir a HSL
        let (h, s, l) = Self::rgb_to_hsl(color);
        
        // Ajustar saturación
        let new_s = (s * factor).min(1.0);
        
        // Convertir de vuelta a RGB
        Self::hsl_to_rgb(h, new_s, l)
    }

    /// Convierte RGB a HSL
    fn rgb_to_hsl(color: &Color) -> (f64, f64, f64) {
        let r = color.r as f64 / 255.0;
        let g = color.g as f64 / 255.0;
        let b = color.b as f64 / 255.0;
        
        let max = r.max(g).max(b);
        let min = r.min(g).min(b);
        let delta = max - min;
        
        let l = (max + min) / 2.0;
        
        if delta == 0.0 {
            return (0.0, 0.0, l);
        }
        
        let s = if l < 0.5 {
            delta / (max + min)
        } else {
            delta / (2.0 - max - min)
        };
        
        let h = if max == r {
            ((g - b) / delta + if g < b { 6.0 } else { 0.0 }) / 6.0
        } else if max == g {
            ((b - r) / delta + 2.0) / 6.0
        } else {
            ((r - g) / delta + 4.0) / 6.0
        };
        
        (h, s, l)
    }

    /// Convierte HSL a RGB
    fn hsl_to_rgb(h: f64, s: f64, l: f64) -> Color {
        if s == 0.0 {
            let v = (l * 255.0) as u8;
            return Color { r: v, g: v, b: v, a: 255 };
        }
        
        let q = if l < 0.5 {
            l * (1.0 + s)
        } else {
            l + s - l * s
        };
        
        let p = 2.0 * l - q;
        
        let r = Self::hue_to_rgb(p, q, h + 1.0 / 3.0);
        let g = Self::hue_to_rgb(p, q, h);
        let b = Self::hue_to_rgb(p, q, h - 1.0 / 3.0);
        
        Color {
            r: (r * 255.0) as u8,
            g: (g * 255.0) as u8,
            b: (b * 255.0) as u8,
            a: 255,
        }
    }

    /// Helper para conversión HSL a RGB
    fn hue_to_rgb(p: f64, q: f64, mut t: f64) -> f64 {
        if t < 0.0 { t += 1.0; }
        if t > 1.0 { t -= 1.0; }
        
        if t < 1.0 / 6.0 {
            p + (q - p) * 6.0 * t
        } else if t < 1.0 / 2.0 {
            q
        } else if t < 2.0 / 3.0 {
            p + (q - p) * (2.0 / 3.0 - t) * 6.0
        } else {
            p
        }
    }
}

/// Validador de colores para garantizar contraste adecuado
pub struct ColorValidator {
    /// Ratio mínimo de contraste requerido
    min_contrast_ratio: f64,
}

impl ColorValidator {
    pub fn new() -> Self {
        Self {
            min_contrast_ratio: 4.5, // WCAG AA standard
        }
    }

    /// Valida que dos colores tengan suficiente contraste
    pub fn validate_contrast(&self, color1: &Color, color2: &Color) -> QrResult<f64> {
        let ratio = contrast_ratio(color1, color2);
        
        if ratio < self.min_contrast_ratio {
            Err(QrError::InsufficientContrast(ratio as f32, self.min_contrast_ratio as f32))
        } else {
            Ok(ratio)
        }
    }

    /// Valida colores para código QR (foreground vs background)
    pub fn validate_qr_colors(&self, foreground: &Color, background: &Color) -> QrResult<()> {
        // Validar contraste
        self.validate_contrast(foreground, background)?;
        
        // Validar que el foreground sea más oscuro (mejor escaneabilidad)
        let fg_lum = ColorProcessor::relative_luminance(foreground);
        let bg_lum = ColorProcessor::relative_luminance(background);
        
        if fg_lum > bg_lum {
            return Err(QrError::ValidationError(
                "El color de primer plano debe ser más oscuro que el fondo para mejor escaneabilidad".to_string()
            ));
        }
        
        Ok(())
    }

    /// Sugiere un color de fondo apropiado para un foreground dado
    pub fn suggest_background(&self, foreground: &Color) -> Color {
        let fg_lum = ColorProcessor::relative_luminance(foreground);
        
        // Si el foreground es oscuro, sugerir blanco
        if fg_lum < 0.5 {
            Color { r: 255, g: 255, b: 255, a: 255 }
        } else {
            // Si es claro, sugerir negro
            Color { r: 0, g: 0, b: 0, a: 255 }
        }
    }

    /// Ajusta automáticamente colores para cumplir con el contraste mínimo
    pub fn auto_adjust_colors(&self, foreground: &Color, background: &Color) -> (Color, Color) {
        let current_ratio = contrast_ratio(foreground, background);
        
        if current_ratio >= self.min_contrast_ratio {
            return (foreground.clone(), background.clone());
        }
        
        // Intentar oscurecer el foreground y aclarar el background
        let mut fg = foreground.clone();
        let mut bg = background.clone();
        let mut best_ratio = current_ratio;
        
        // Ajustar gradualmente
        for i in 1..=10 {
            let factor = 1.0 - (i as f64 * 0.05); // Oscurecer
            let inv_factor = 1.0 + (i as f64 * 0.05); // Aclarar
            
            let test_fg = ColorProcessor::adjust_brightness(&fg, factor);
            let test_bg = ColorProcessor::adjust_brightness(&bg, inv_factor);
            
            let test_ratio = contrast_ratio(&test_fg, &test_bg);
            
            if test_ratio > best_ratio {
                fg = test_fg;
                bg = test_bg;
                best_ratio = test_ratio;
                
                if best_ratio >= self.min_contrast_ratio {
                    break;
                }
            }
        }
        
        (fg, bg)
    }
}

/// Calcula el ratio de contraste entre dos colores (WCAG 2.0)
pub fn contrast_ratio(color1: &Color, color2: &Color) -> f64 {
    let lum1 = ColorProcessor::relative_luminance(color1);
    let lum2 = ColorProcessor::relative_luminance(color2);
    
    let lighter = lum1.max(lum2);
    let darker = lum1.min(lum2);
    
    (lighter + 0.05) / (darker + 0.05)
}

/// Preset de colores corporativos optimizados para QR
pub struct CorporateColors;

impl CorporateColors {
    pub fn codex_blue() -> Color {
        Color { r: 59, g: 130, b: 246, a: 255 } // blue-500
    }
    
    pub fn codex_dark() -> Color {
        Color { r: 30, g: 41, b: 59, a: 255 } // slate-800
    }
    
    pub fn white() -> Color {
        Color { r: 255, g: 255, b: 255, a: 255 }
    }
    
    pub fn black() -> Color {
        Color { r: 0, g: 0, b: 0, a: 255 }
    }
    
    pub fn error_red() -> Color {
        Color { r: 239, g: 68, b: 68, a: 255 } // red-500
    }
    
    pub fn success_green() -> Color {
        Color { r: 34, g: 197, b: 94, a: 255 } // green-500
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_color_parsing() {
        let color = ColorProcessor::parse_color("#FF5733").unwrap();
        assert_eq!(color.r, 255);
        assert_eq!(color.g, 87);
        assert_eq!(color.b, 51);
        
        let hex = ColorProcessor::to_hex(&color);
        assert_eq!(hex, "#ff5733");
    }

    #[test]
    fn test_contrast_calculation() {
        let black = Color { r: 0, g: 0, b: 0, a: 255 };
        let white = Color { r: 255, g: 255, b: 255, a: 255 };
        
        let ratio = contrast_ratio(&black, &white);
        assert!((ratio - 21.0).abs() < 0.1); // Should be approximately 21:1
    }

    #[test]
    fn test_color_validation() {
        let validator = ColorValidator::new();
        let black = Color { r: 0, g: 0, b: 0, a: 255 };
        let white = Color { r: 255, g: 255, b: 255, a: 255 };
        
        // Should pass - high contrast
        assert!(validator.validate_qr_colors(&black, &white).is_ok());
        
        // Should fail - inverted colors
        assert!(validator.validate_qr_colors(&white, &black).is_err());
    }

    #[test]
    fn test_color_blending() {
        let red = Color { r: 255, g: 0, b: 0, a: 255 };
        let blue = Color { r: 0, g: 0, b: 255, a: 255 };
        
        let purple = ColorProcessor::blend_colors(&red, &blue, 0.5);
        assert_eq!(purple.r, 127);
        assert_eq!(purple.g, 0);
        assert_eq!(purple.b, 127);
    }

    #[test]
    fn test_brightness_adjustment() {
        let gray = Color { r: 128, g: 128, b: 128, a: 255 };
        
        let brighter = ColorProcessor::adjust_brightness(&gray, 1.5);
        assert_eq!(brighter.r, 192);
        assert_eq!(brighter.g, 192);
        assert_eq!(brighter.b, 192);
        
        let darker = ColorProcessor::adjust_brightness(&gray, 0.5);
        assert_eq!(darker.r, 64);
        assert_eq!(darker.g, 64);
        assert_eq!(darker.b, 64);
    }
}