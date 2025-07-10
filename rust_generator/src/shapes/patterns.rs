// shapes/patterns.rs - Renderizado de patrones de datos para QR

use crate::engine::types::DataPattern;

/// Renderizador de patrones de datos
pub struct PatternRenderer {
    /// Tamaño del módulo en píxeles
    module_size: u32,
}

impl PatternRenderer {
    pub fn new(module_size: u32) -> Self {
        Self { module_size }
    }

    /// Renderiza un patrón de datos a SVG para un módulo
    pub fn render_module(
        &self,
        pattern: DataPattern,
        x: usize,
        y: usize,
        color: &str,
    ) -> String {
        let x_pos = (x * self.module_size as usize) as f32;
        let y_pos = (y * self.module_size as usize) as f32;
        let size = self.module_size as f32;
        
        match pattern {
            DataPattern::Square => self.render_square(x_pos, y_pos, size, color),
            DataPattern::SquareSmall => self.render_square_small(x_pos, y_pos, size, color),
            DataPattern::Dots => self.render_dot(x_pos, y_pos, size, color),
            DataPattern::Rounded => self.render_rounded(x_pos, y_pos, size, color),
            DataPattern::Vertical => self.render_vertical(x_pos, y_pos, size, color),
            DataPattern::Horizontal => self.render_horizontal(x_pos, y_pos, size, color),
            DataPattern::Diamond => self.render_diamond(x_pos, y_pos, size, color),
            DataPattern::Circular => self.render_circular(x_pos, y_pos, size, color),
            DataPattern::Star => self.render_star(x_pos, y_pos, size, color),
            DataPattern::Cross => self.render_cross(x_pos, y_pos, size, color),
            DataPattern::Random => self.render_random(x_pos, y_pos, size, color, x, y),
            DataPattern::Wave => self.render_wave(x_pos, y_pos, size, color),
            DataPattern::Mosaic => self.render_mosaic(x_pos, y_pos, size, color, x, y),
        }
    }

    /// Renderiza toda la matriz con un patrón
    pub fn render_matrix_with_pattern(
        &self,
        matrix: &[Vec<bool>],
        pattern: DataPattern,
        color: &str,
        exclude_eyes: bool,
    ) -> String {
        let mut svg_elements = Vec::new();
        
        for (y, row) in matrix.iter().enumerate() {
            for (x, &is_dark) in row.iter().enumerate() {
                if is_dark {
                    // Excluir áreas de ojos si está configurado
                    if exclude_eyes && self.is_eye_area(x, y, matrix.len()) {
                        continue;
                    }
                    
                    svg_elements.push(self.render_module(pattern, x, y, color));
                }
            }
        }
        
        svg_elements.join("\n")
    }

    /// Verifica si una posición está en el área de los ojos
    fn is_eye_area(&self, x: usize, y: usize, matrix_size: usize) -> bool {
        // Ojos estándar QR: 7x7 en las esquinas
        let eye_size = 7;
        
        // Top-left
        if x < eye_size && y < eye_size {
            return true;
        }
        
        // Top-right
        if x >= matrix_size - eye_size && y < eye_size {
            return true;
        }
        
        // Bottom-left
        if x < eye_size && y >= matrix_size - eye_size {
            return true;
        }
        
        false
    }

    // === Implementaciones de patrones específicos ===

    /// Cuadrado estándar
    fn render_square(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" />"#,
            x, y, size, size, color
        )
    }

    /// Cuadrado pequeño (80% del tamaño, centrado)
    fn render_square_small(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let small_size = size * 0.8;
        let offset = (size - small_size) / 2.0;
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" />"#,
            x + offset, y + offset, small_size, small_size, color
        )
    }

    /// Puntos circulares
    fn render_dot(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let radius = size * 0.4; // 80% del tamaño del módulo
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        format!(
            r#"<circle cx="{}" cy="{}" r="{}" fill="{}" />"#,
            cx, cy, radius, color
        )
    }

    /// Cuadrados redondeados
    fn render_rounded(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let radius = size * 0.25; // 25% de radio
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" rx="{}" ry="{}" fill="{}" />"#,
            x, y, size, size, radius, radius, color
        )
    }

    /// Líneas verticales
    fn render_vertical(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let width = size * 0.6;
        let offset = (size - width) / 2.0;
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" />"#,
            x + offset, y, width, size, color
        )
    }

    /// Líneas horizontales
    fn render_horizontal(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let height = size * 0.6;
        let offset = (size - height) / 2.0;
        format!(
            r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" />"#,
            x, y + offset, size, height, color
        )
    }

    /// Diamantes
    fn render_diamond(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let half = size * 0.52; // Aumentado de 0.45 a 0.52 para mayor densidad
        format!(
            r#"<path d="M {} {} L {} {} L {} {} L {} {} Z" fill="{}" />"#,
            cx, cy - half,
            cx + half, cy,
            cx, cy + half,
            cx - half, cy,
            color
        )
    }

    /// Círculos concéntricos
    fn render_circular(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let outer_r = size * 0.45;
        let inner_r = size * 0.2;
        format!(
            r#"<circle cx="{}" cy="{}" r="{}" fill="{}" />
               <circle cx="{}" cy="{}" r="{}" fill="white" />"#,
            cx, cy, outer_r, color,
            cx, cy, inner_r
        )
    }

    /// Estrellas pequeñas
    fn render_star(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let outer_r = size * 0.45;
        let inner_r = size * 0.2;
        
        let mut path = String::from("M ");
        for i in 0..10 {
            let angle = (i as f32 * 36.0 - 90.0).to_radians();
            let r = if i % 2 == 0 { outer_r } else { inner_r };
            let px = cx + r * angle.cos();
            let py = cy + r * angle.sin();
            
            if i == 0 {
                path.push_str(&format!("{} {}", px, py));
            } else {
                path.push_str(&format!(" L {} {}", px, py));
            }
        }
        path.push_str(" Z");
        
        format!(r#"<path d="{}" fill="{}" />"#, path, color)
    }

    /// Cruces
    fn render_cross(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let thickness = size * 0.3;
        let length = size * 0.8;
        let offset = (size - length) / 2.0;
        let cross_offset = (size - thickness) / 2.0;
        
        format!(
            r#"<path d="M {} {} h {} v {} h -{} Z M {} {} v {} h {} v -{} Z" fill="{}" />"#,
            x + offset, y + cross_offset,
            length, thickness, length,
            x + cross_offset, y + offset,
            length, thickness, length,
            color
        )
    }

    /// Patrón aleatorio (basado en posición)
    fn render_random(&self, x: f32, y: f32, size: f32, color: &str, grid_x: usize, grid_y: usize) -> String {
        // Usar posición para generar variación pseudo-aleatoria
        let variant = (grid_x * 7 + grid_y * 13) % 4;
        
        match variant {
            0 => self.render_dot(x, y, size, color),
            1 => self.render_rounded(x, y, size, color),
            2 => self.render_diamond(x, y, size, color),
            _ => self.render_square(x, y, size, color),
        }
    }

    /// Patrón de onda
    fn render_wave(&self, x: f32, y: f32, size: f32, color: &str) -> String {
        let wave_height = size * 0.3;
        let cy = y + size / 2.0;
        
        format!(
            r#"<path d="M {} {} Q {} {} {} {} T {} {} L {} {} L {} {} Z" fill="{}" />"#,
            x, cy - wave_height / 2.0,
            x + size * 0.25, cy - wave_height,
            x + size * 0.5, cy - wave_height / 2.0,
            x + size, cy - wave_height / 2.0,
            x + size, cy + wave_height / 2.0,
            x, cy + wave_height / 2.0,
            color
        )
    }

    /// Patrón mosaico
    fn render_mosaic(&self, x: f32, y: f32, size: f32, color: &str, grid_x: usize, grid_y: usize) -> String {
        // Crear un patrón de mosaico basado en la posición
        let is_checker = (grid_x + grid_y) % 2 == 0;
        
        if is_checker {
            // Patrón de 4 cuadrados pequeños
            let half = size / 2.0;
            format!(
                r#"<rect x="{}" y="{}" width="{}" height="{}" fill="{}" />
                   <rect x="{}" y="{}" width="{}" height="{}" fill="{}" />"#,
                x, y, half, half, color,
                x + half, y + half, half, half, color
            )
        } else {
            // Círculo con borde
            let cx = x + size / 2.0;
            let cy = y + size / 2.0;
            let r = size * 0.35;
            format!(
                r#"<circle cx="{}" cy="{}" r="{}" fill="none" stroke="{}" stroke-width="{}" />"#,
                cx, cy, r, color, size * 0.15
            )
        }
    }
}

/// Función helper para renderizar un patrón
pub fn render_data_pattern(
    pattern: DataPattern,
    x: usize,
    y: usize,
    module_size: u32,
    color: &str,
) -> String {
    let renderer = PatternRenderer::new(module_size);
    renderer.render_module(pattern, x, y, color)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_rendering() {
        let renderer = PatternRenderer::new(10);
        
        let patterns = vec![
            DataPattern::Square,
            DataPattern::SquareSmall,
            DataPattern::Dots,
            DataPattern::Rounded,
            DataPattern::Diamond,
            DataPattern::Star,
        ];
        
        for pattern in patterns {
            let svg = renderer.render_module(pattern, 0, 0, "#000000");
            assert!(!svg.is_empty());
            assert!(svg.contains("fill=\"#000000\""));
        }
    }

    #[test]
    fn test_eye_area_detection() {
        let renderer = PatternRenderer::new(10);
        
        // Test esquina superior izquierda
        assert!(renderer.is_eye_area(0, 0, 21));
        assert!(renderer.is_eye_area(6, 6, 21));
        assert!(!renderer.is_eye_area(7, 7, 21));
        
        // Test esquina superior derecha
        assert!(renderer.is_eye_area(15, 0, 21));
        assert!(renderer.is_eye_area(20, 6, 21));
        
        // Test esquina inferior izquierda
        assert!(renderer.is_eye_area(0, 15, 21));
        assert!(renderer.is_eye_area(6, 20, 21));
    }
}