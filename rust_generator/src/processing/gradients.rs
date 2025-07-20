// processing/gradients.rs - Sistema de gradientes para QR

use crate::engine::types::{Color, Gradient};
use crate::engine::error::QrResult;
use crate::processing::colors::{ColorProcessor, contrast_ratio};

/// Tipo de gradiente
#[derive(Debug, Clone, Copy)]
pub enum GradientType {
    Linear,
    Radial,
    Diagonal,
    Conical,
}

/// Procesador de gradientes
pub struct GradientProcessor {
    /// ID único para gradientes SVG
    gradient_counter: std::sync::atomic::AtomicU32,
}

impl GradientProcessor {
    pub fn new() -> Self {
        Self {
            gradient_counter: std::sync::atomic::AtomicU32::new(0),
        }
    }

    /// Genera un ID único para el gradiente
    fn generate_gradient_id(&self) -> String {
        let id = self.gradient_counter.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        format!("qr_gradient_{}", id)
    }

    /// Crea un gradiente lineal SVG
    pub fn create_linear_gradient(
        &self,
        start_color: &Color,
        end_color: &Color,
        angle: f64,
    ) -> Gradient {
        self.create_linear_gradient_with_size(start_color, end_color, angle, None)
    }
    
    /// Crea un gradiente lineal SVG con tamaño absoluto opcional
    pub fn create_linear_gradient_with_size(
        &self,
        start_color: &Color,
        end_color: &Color,
        angle: f64,
        canvas_size: Option<usize>,
    ) -> Gradient {
        let id = self.generate_gradient_id();
        
        // Calcular coordenadas basadas en el ángulo
        let angle_rad = angle.to_radians();
        let cos_a = angle_rad.cos();
        let sin_a = angle_rad.sin();
        
        // Normalizar para que el gradiente cubra todo el área
        let (x1, y1, x2, y2) = if cos_a.abs() > sin_a.abs() {
            if cos_a > 0.0 {
                (0.0, 0.5 - 0.5 * sin_a / cos_a, 1.0, 0.5 + 0.5 * sin_a / cos_a)
            } else {
                (1.0, 0.5 + 0.5 * sin_a / cos_a, 0.0, 0.5 - 0.5 * sin_a / cos_a)
            }
        } else {
            if sin_a > 0.0 {
                (0.5 - 0.5 * cos_a / sin_a, 0.0, 0.5 + 0.5 * cos_a / sin_a, 1.0)
            } else {
                (0.5 + 0.5 * cos_a / sin_a, 1.0, 0.5 - 0.5 * cos_a / sin_a, 0.0)
            }
        };
        
        let svg_def = if let Some(size) = canvas_size {
            // Usar coordenadas absolutas para gradiente continuo
            let abs_x1 = x1 * size as f64;
            let abs_y1 = y1 * size as f64;
            let abs_x2 = x2 * size as f64;
            let abs_y2 = y2 * size as f64;
            
            format!(
                r#"<linearGradient id="{}" x1="{:.2}" y1="{:.2}" x2="{:.2}" y2="{:.2}" gradientUnits="userSpaceOnUse">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</linearGradient>"#,
                id,
                abs_x1, abs_y1, abs_x2, abs_y2,
                ColorProcessor::to_hex(start_color),
                ColorProcessor::to_hex(end_color)
            )
        } else {
            // Usar porcentajes (comportamiento anterior)
            format!(
                r#"<linearGradient id="{}" x1="{:.2}%" y1="{:.2}%" x2="{:.2}%" y2="{:.2}%">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</linearGradient>"#,
                id,
                x1 * 100.0, y1 * 100.0, x2 * 100.0, y2 * 100.0,
                ColorProcessor::to_hex(start_color),
                ColorProcessor::to_hex(end_color)
            )
        };
        
        Gradient {
            id: id.clone(),
            start_color: start_color.clone(),
            end_color: end_color.clone(),
            gradient_type: "linear".to_string(),
            svg_definition: svg_def,
            fill_reference: format!("url(#{})", id),
        }
    }

    /// Crea un gradiente radial SVG
    pub fn create_radial_gradient(
        &self,
        center_color: &Color,
        edge_color: &Color,
        cx: f64,
        cy: f64,
        radius: f64,
    ) -> Gradient {
        self.create_radial_gradient_with_size(center_color, edge_color, cx, cy, radius, None)
    }
    
    /// Crea un gradiente radial SVG con tamaño absoluto opcional
    pub fn create_radial_gradient_with_size(
        &self,
        center_color: &Color,
        edge_color: &Color,
        cx: f64,
        cy: f64,
        radius: f64,
        canvas_size: Option<usize>,
    ) -> Gradient {
        let id = self.generate_gradient_id();
        
        let svg_def = if let Some(size) = canvas_size {
            // Usar coordenadas absolutas para gradiente continuo
            let abs_cx = cx * size as f64;
            let abs_cy = cy * size as f64;
            let abs_r = radius * size as f64;
            
            format!(
                r#"<radialGradient id="{}" cx="{:.2}" cy="{:.2}" r="{:.2}" gradientUnits="userSpaceOnUse">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</radialGradient>"#,
                id,
                abs_cx, abs_cy, abs_r,
                ColorProcessor::to_hex(center_color),
                ColorProcessor::to_hex(edge_color)
            )
        } else {
            // Usar porcentajes (comportamiento anterior)
            format!(
                r#"<radialGradient id="{}" cx="{:.2}%" cy="{:.2}%" r="{:.2}%">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</radialGradient>"#,
                id,
                cx * 100.0, cy * 100.0, radius * 100.0,
                ColorProcessor::to_hex(center_color),
                ColorProcessor::to_hex(edge_color)
            )
        };
        
        Gradient {
            id: id.clone(),
            start_color: center_color.clone(),
            end_color: edge_color.clone(),
            gradient_type: "radial".to_string(),
            svg_definition: svg_def,
            fill_reference: format!("url(#{})", id),
        }
    }

    /// Crea un gradiente diagonal (45 grados)
    pub fn create_diagonal_gradient(
        &self,
        start_color: &Color,
        end_color: &Color,
    ) -> Gradient {
        self.create_linear_gradient(start_color, end_color, 45.0)
    }

    /// Crea un gradiente diamante real
    pub fn create_diamond_gradient(
        &self,
        center_color: &Color,
        edge_color: &Color,
        canvas_size: Option<usize>,
    ) -> Gradient {
        let id = self.generate_gradient_id();
        
        // El gradiente diamante necesita un patrón especial
        // Usamos un gradiente radial con transformación para crear el efecto diamante
        let svg_def = if let Some(size) = canvas_size {
            // Usar coordenadas absolutas
            let center = size as f64 / 2.0;
            
            format!(
                r#"<radialGradient id="{}" cx="{:.2}" cy="{:.2}" r="{:.2}" gradientUnits="userSpaceOnUse" gradientTransform="scale(1, 0.5) rotate(45, {:.2}, {:.2})">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</radialGradient>"#,
                id,
                center, center, center * 1.414, // r = center * sqrt(2) para cubrir las esquinas
                center, center,
                ColorProcessor::to_hex(center_color),
                ColorProcessor::to_hex(edge_color)
            )
        } else {
            // Usar porcentajes con mejor centrado
            format!(
                r#"<radialGradient id="{}" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox" gradientTransform="scale(1.414, 1) rotate(45, 0.5, 0.5)">
  <stop offset="0%" style="stop-color:{};stop-opacity:1" />
  <stop offset="100%" style="stop-color:{};stop-opacity:1" />
</radialGradient>"#,
                id,
                ColorProcessor::to_hex(center_color),
                ColorProcessor::to_hex(edge_color)
            )
        };
        
        Gradient {
            id: id.clone(),
            start_color: center_color.clone(),
            end_color: edge_color.clone(),
            gradient_type: "diamond".to_string(),
            svg_definition: svg_def,
            fill_reference: format!("url(#{})", id),
        }
    }

    /// Crea un gradiente cónico (simulado con múltiples paradas)
    pub fn create_conical_gradient(
        &self,
        colors: &[Color],
        cx: f64,
        cy: f64,
    ) -> Gradient {
        let id = self.generate_gradient_id();
        
        // Simular gradiente cónico con múltiples gradientes lineales
        // Por simplicidad, usar gradiente radial con múltiples paradas
        let mut stops = String::new();
        for (i, color) in colors.iter().enumerate() {
            let offset = (i as f64 / (colors.len() - 1) as f64) * 100.0;
            stops.push_str(&format!(
                r#"  <stop offset="{:.1}%" style="stop-color:{};stop-opacity:1" />
"#,
                offset,
                ColorProcessor::to_hex(color)
            ));
        }
        
        let svg_def = format!(
            r#"<radialGradient id="{}" cx="{:.2}%" cy="{:.2}%">
{}
</radialGradient>"#,
            id,
            cx * 100.0, cy * 100.0,
            stops.trim_end()
        );
        
        Gradient {
            id: id.clone(),
            start_color: colors.first().unwrap_or(&Color::default()).clone(),
            end_color: colors.last().unwrap_or(&Color::default()).clone(),
            gradient_type: "conical".to_string(),
            svg_definition: svg_def,
            fill_reference: format!("url(#{})", id),
        }
    }

    /// Crea un gradiente con múltiples paradas de color
    pub fn create_multi_stop_gradient(
        &self,
        gradient_type: GradientType,
        color_stops: &[(Color, f64)], // (color, position 0.0-1.0)
        angle: Option<f64>,
    ) -> Gradient {
        let id = self.generate_gradient_id();
        
        let mut stops = String::new();
        for (color, position) in color_stops {
            stops.push_str(&format!(
                r#"  <stop offset="{:.1}%" style="stop-color:{};stop-opacity:1" />
"#,
                position * 100.0,
                ColorProcessor::to_hex(color)
            ));
        }
        
        let svg_def = match gradient_type {
            GradientType::Linear => {
                let angle_deg = angle.unwrap_or(0.0);
                let angle_rad = angle_deg.to_radians();
                let cos_a = angle_rad.cos();
                let sin_a = angle_rad.sin();
                
                let (x1, y1, x2, y2) = if cos_a.abs() > sin_a.abs() {
                    if cos_a > 0.0 {
                        (0.0, 0.5 - 0.5 * sin_a / cos_a, 1.0, 0.5 + 0.5 * sin_a / cos_a)
                    } else {
                        (1.0, 0.5 + 0.5 * sin_a / cos_a, 0.0, 0.5 - 0.5 * sin_a / cos_a)
                    }
                } else {
                    if sin_a > 0.0 {
                        (0.5 - 0.5 * cos_a / sin_a, 0.0, 0.5 + 0.5 * cos_a / sin_a, 1.0)
                    } else {
                        (0.5 + 0.5 * cos_a / sin_a, 1.0, 0.5 - 0.5 * cos_a / sin_a, 0.0)
                    }
                };
                
                format!(
                    r#"<linearGradient id="{}" x1="{:.2}%" y1="{:.2}%" x2="{:.2}%" y2="{:.2}%">
{}
</linearGradient>"#,
                    id,
                    x1 * 100.0, y1 * 100.0, x2 * 100.0, y2 * 100.0,
                    stops.trim_end()
                )
            },
            GradientType::Radial | GradientType::Conical => {
                format!(
                    r#"<radialGradient id="{}" cx="50%" cy="50%" r="50%">
{}
</radialGradient>"#,
                    id,
                    stops.trim_end()
                )
            },
            GradientType::Diagonal => {
                // Diagonal es solo linear a 45 grados
                format!(
                    r#"<linearGradient id="{}" x1="0%" y1="0%" x2="100%" y2="100%">
{}
</linearGradient>"#,
                    id,
                    stops.trim_end()
                )
            }
        };
        
        Gradient {
            id: id.clone(),
            start_color: color_stops.first().map(|(c, _)| c.clone()).unwrap_or_default(),
            end_color: color_stops.last().map(|(c, _)| c.clone()).unwrap_or_default(),
            gradient_type: format!("{:?}", gradient_type).to_lowercase(),
            svg_definition: svg_def,
            fill_reference: format!("url(#{})", id),
        }
    }

    /// Valida que un gradiente tenga suficiente contraste con el fondo
    pub fn validate_gradient_contrast(
        &self,
        gradient: &Gradient,
        background: &Color,
        min_ratio: f64,
    ) -> QrResult<()> {
        // Verificar contraste en ambos extremos del gradiente
        let start_ratio = contrast_ratio(&gradient.start_color, background);
        let end_ratio = contrast_ratio(&gradient.end_color, background);
        
        if start_ratio < min_ratio || end_ratio < min_ratio {
            let min_found = start_ratio.min(end_ratio);
            return Err(crate::engine::error::QrError::InsufficientContrast(
                min_found as f32, 
                min_ratio as f32
            ));
        }
        
        Ok(())
    }

    /// Genera un gradiente corporativo predefinido
    pub fn corporate_gradient(&self, style: &str) -> Gradient {
        match style {
            "blue" => self.create_linear_gradient(
                &Color { r: 59, g: 130, b: 246, a: 255 },  // blue-500
                &Color { r: 99, g: 102, b: 241, a: 255 },  // indigo-500
                90.0
            ),
            "dark" => self.create_linear_gradient(
                &Color { r: 30, g: 41, b: 59, a: 255 },    // slate-800
                &Color { r: 15, g: 23, b: 42, a: 255 },    // slate-900
                135.0
            ),
            "success" => self.create_linear_gradient(
                &Color { r: 34, g: 197, b: 94, a: 255 },   // green-500
                &Color { r: 16, g: 185, b: 129, a: 255 },  // emerald-500
                45.0
            ),
            "sunset" => self.create_multi_stop_gradient(
                GradientType::Linear,
                &[
                    (Color { r: 251, g: 146, b: 60, a: 255 }, 0.0),   // orange-400
                    (Color { r: 239, g: 68, b: 68, a: 255 }, 0.5),    // red-500
                    (Color { r: 168, g: 85, b: 247, a: 255 }, 1.0),   // purple-500
                ],
                Some(45.0)
            ),
            _ => self.create_linear_gradient(
                &Color { r: 0, g: 0, b: 0, a: 255 },
                &Color { r: 64, g: 64, b: 64, a: 255 },
                0.0
            )
        }
    }
}

/// Helper para aplicar gradientes a SVG
pub struct GradientSvgHelper;

impl GradientSvgHelper {
    /// Envuelve contenido SVG con definiciones de gradiente
    pub fn wrap_with_gradient(svg_content: &str, gradient: &Gradient) -> String {
        format!(
            r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    {}
  </defs>
  {}
</svg>"#,
            gradient.svg_definition,
            svg_content
        )
    }

    /// Aplica gradiente a un path SVG
    pub fn apply_gradient_to_path(path: &str, gradient: &Gradient) -> String {
        // Reemplazar fill con referencia al gradiente
        if path.contains("fill=") {
            path.replace(
                r#"fill="[^"]*""#,
                &format!(r#"fill="{}""#, gradient.fill_reference)
            )
        } else {
            // Insertar fill si no existe
            path.replace(
                "/>",
                &format!(r#" fill="{}" />"#, gradient.fill_reference)
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_gradient_creation() {
        let processor = GradientProcessor::new();
        let black = Color { r: 0, g: 0, b: 0, a: 255 };
        let white = Color { r: 255, g: 255, b: 255, a: 255 };
        
        let gradient = processor.create_linear_gradient(&black, &white, 45.0);
        
        assert!(gradient.svg_definition.contains("linearGradient"));
        assert!(gradient.svg_definition.contains("#000000"));
        assert!(gradient.svg_definition.contains("#ffffff"));
        assert!(gradient.fill_reference.starts_with("url(#qr_gradient_"));
    }

    #[test]
    fn test_radial_gradient_creation() {
        let processor = GradientProcessor::new();
        let blue = Color { r: 0, g: 0, b: 255, a: 255 };
        let red = Color { r: 255, g: 0, b: 0, a: 255 };
        
        let gradient = processor.create_radial_gradient(&blue, &red, 0.5, 0.5, 0.5);
        
        assert!(gradient.svg_definition.contains("radialGradient"));
        assert!(gradient.svg_definition.contains("#0000ff"));
        assert!(gradient.svg_definition.contains("#ff0000"));
    }

    #[test]
    fn test_multi_stop_gradient() {
        let processor = GradientProcessor::new();
        let stops = vec![
            (Color { r: 255, g: 0, b: 0, a: 255 }, 0.0),
            (Color { r: 0, g: 255, b: 0, a: 255 }, 0.5),
            (Color { r: 0, g: 0, b: 255, a: 255 }, 1.0),
        ];
        
        let gradient = processor.create_multi_stop_gradient(
            GradientType::Linear,
            &stops,
            Some(90.0)
        );
        
        assert!(gradient.svg_definition.contains("0.0%"));
        assert!(gradient.svg_definition.contains("50.0%"));
        assert!(gradient.svg_definition.contains("100.0%"));
    }

    #[test]
    fn test_gradient_contrast_validation() {
        let processor = GradientProcessor::new();
        let black = Color { r: 0, g: 0, b: 0, a: 255 };
        let dark_gray = Color { r: 64, g: 64, b: 64, a: 255 };
        let white = Color { r: 255, g: 255, b: 255, a: 255 };
        
        let gradient = processor.create_linear_gradient(&black, &dark_gray, 0.0);
        
        // Should pass with white background
        assert!(processor.validate_gradient_contrast(&gradient, &white, 4.5).is_ok());
        
        // Should fail with dark background
        assert!(processor.validate_gradient_contrast(&gradient, &dark_gray, 4.5).is_err());
    }
}