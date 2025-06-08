// shapes/eyes.rs - Renderizado de formas de ojos para QR

use crate::engine::types::EyeShape;
use crate::engine::error::QrResult;

/// Posiciones de los ojos en un código QR
#[derive(Debug, Clone, Copy)]
pub enum EyePosition {
    TopLeft,
    TopRight,
    BottomLeft,
}

/// Componente del ojo (exterior o interior)
#[derive(Debug, Clone, Copy)]
pub enum EyeComponent {
    Outer,  // Marco exterior del ojo
    Inner,  // Punto interior del ojo
}

/// Renderizador de formas de ojos
pub struct EyeShapeRenderer {
    /// Tamaño del módulo en píxeles
    module_size: u32,
}

impl EyeShapeRenderer {
    pub fn new(module_size: u32) -> Self {
        Self { module_size }
    }

    /// Renderiza una forma de ojo a SVG path
    pub fn render_to_svg_path(
        &self,
        shape: EyeShape,
        position: EyePosition,
        component: EyeComponent,
        color: &str,
    ) -> String {
        let (x, y) = self.get_eye_position(position, component);
        let size = self.get_component_size(component);
        
        let path_data = match shape {
            EyeShape::Square => self.render_square(x, y, size),
            EyeShape::RoundedSquare => self.render_rounded_square(x, y, size),
            EyeShape::Circle => self.render_circle(x, y, size),
            EyeShape::Dot => self.render_dot(x, y, size),
            EyeShape::Leaf => self.render_leaf(x, y, size),
            EyeShape::BarsHorizontal => self.render_bars_horizontal(x, y, size),
            EyeShape::BarsVertical => self.render_bars_vertical(x, y, size),
            EyeShape::Star => self.render_star(x, y, size),
            EyeShape::Diamond => self.render_diamond(x, y, size),
            EyeShape::Cross => self.render_cross(x, y, size),
            EyeShape::Hexagon => self.render_hexagon(x, y, size),
            EyeShape::Heart => self.render_heart(x, y, size),
            EyeShape::Shield => self.render_shield(x, y, size),
            EyeShape::Crystal => self.render_crystal(x, y, size),
            EyeShape::Flower => self.render_flower(x, y, size),
            EyeShape::Arrow => self.render_arrow(x, y, size),
        };
        
        format!(r#"<path d="{}" fill="{}" />"#, path_data, color)
    }

    /// Obtiene la posición del ojo en el QR
    fn get_eye_position(&self, position: EyePosition, component: EyeComponent) -> (f32, f32) {
        let offset = match component {
            EyeComponent::Outer => 0.0,
            EyeComponent::Inner => 2.0 * self.module_size as f32,
        };
        
        match position {
            EyePosition::TopLeft => (offset, offset),
            EyePosition::TopRight => {
                // Calcular basado en el tamaño del QR
                // Por ahora usar valores estándar
                (self.module_size as f32 * 14.0 + offset, offset)
            }
            EyePosition::BottomLeft => {
                (offset, self.module_size as f32 * 14.0 + offset)
            }
        }
    }

    /// Obtiene el tamaño del componente
    fn get_component_size(&self, component: EyeComponent) -> f32 {
        match component {
            EyeComponent::Outer => 7.0 * self.module_size as f32,
            EyeComponent::Inner => 3.0 * self.module_size as f32,
        }
    }

    // === Implementaciones de formas específicas ===

    /// Cuadrado básico
    fn render_square(&self, x: f32, y: f32, size: f32) -> String {
        format!("M {} {} h {} v {} h -{} Z", x, y, size, size, size)
    }

    /// Cuadrado con esquinas redondeadas
    fn render_rounded_square(&self, x: f32, y: f32, size: f32) -> String {
        let radius = size * 0.2; // 20% de radio
        format!(
            "M {} {} h {} a {} {} 0 0 1 {} {} v {} a {} {} 0 0 1 -{} {} h -{} a {} {} 0 0 1 -{} -{} v -{} a {} {} 0 0 1 {} -{} Z",
            x + radius, y,
            size - 2.0 * radius,
            radius, radius, radius, radius,
            size - 2.0 * radius,
            radius, radius, radius, radius,
            size - 2.0 * radius,
            radius, radius, radius, radius,
            size - 2.0 * radius,
            radius, radius, radius, radius
        )
    }

    /// Círculo perfecto
    fn render_circle(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let r = size / 2.0;
        format!(
            "M {} {} A {} {} 0 1 0 {} {} A {} {} 0 1 0 {} {} Z",
            cx - r, cy,
            r, r, cx + r, cy,
            r, r, cx - r, cy
        )
    }

    /// Punto (círculo más pequeño)
    fn render_dot(&self, x: f32, y: f32, size: f32) -> String {
        let padding = size * 0.15;
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let r = (size - 2.0 * padding) / 2.0;
        format!(
            "M {} {} A {} {} 0 1 0 {} {} A {} {} 0 1 0 {} {} Z",
            cx - r, cy,
            r, r, cx + r, cy,
            r, r, cx - r, cy
        )
    }

    /// Forma de hoja
    fn render_leaf(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        format!(
            "M {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Q {} {} {} {} Z",
            cx, y,
            x + size * 0.8, y + size * 0.2, x + size, cy,
            x + size * 0.8, y + size * 0.8, cx, y + size,
            x + size * 0.2, y + size * 0.8, x, cy,
            x + size * 0.2, y + size * 0.2, cx, y
        )
    }

    /// Barras horizontales
    fn render_bars_horizontal(&self, x: f32, y: f32, size: f32) -> String {
        let bar_height = size / 5.0;
        let gap = bar_height / 2.0;
        format!(
            "M {} {} h {} v {} h -{} Z M {} {} h {} v {} h -{} Z M {} {} h {} v {} h -{} Z",
            x, y, size, bar_height, size,
            x, y + bar_height + gap, size, bar_height, size,
            x, y + 2.0 * (bar_height + gap), size, bar_height, size
        )
    }

    /// Barras verticales
    fn render_bars_vertical(&self, x: f32, y: f32, size: f32) -> String {
        let bar_width = size / 5.0;
        let gap = bar_width / 2.0;
        format!(
            "M {} {} v {} h {} v -{} Z M {} {} v {} h {} v -{} Z M {} {} v {} h {} v -{} Z",
            x, y, size, bar_width, size,
            x + bar_width + gap, y, size, bar_width, size,
            x + 2.0 * (bar_width + gap), y, size, bar_width, size
        )
    }

    /// Estrella
    fn render_star(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let outer_r = size / 2.0;
        let inner_r = size / 4.0;
        
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
        path
    }

    /// Diamante
    fn render_diamond(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        format!(
            "M {} {} L {} {} L {} {} L {} {} Z",
            cx, y,
            x + size, cy,
            cx, y + size,
            x, cy
        )
    }

    /// Cruz
    fn render_cross(&self, x: f32, y: f32, size: f32) -> String {
        let thickness = size / 3.0;
        let offset = (size - thickness) / 2.0;
        format!(
            "M {} {} h {} v {} h {} v {} h -{} v {} h -{} v -{} h -{} v -{} h {} Z",
            x + offset, y,
            thickness, offset,
            offset, thickness,
            offset, offset,
            thickness, offset,
            thickness, thickness,
            offset
        )
    }

    /// Hexágono
    fn render_hexagon(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let r = size / 2.0;
        
        let mut path = String::from("M ");
        for i in 0..6 {
            let angle = (i as f32 * 60.0 - 30.0).to_radians();
            let px = cx + r * angle.cos();
            let py = cy + r * angle.sin();
            
            if i == 0 {
                path.push_str(&format!("{} {}", px, py));
            } else {
                path.push_str(&format!(" L {} {}", px, py));
            }
        }
        path.push_str(" Z");
        path
    }

    /// Corazón
    fn render_heart(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size * 0.45;
        let r = size * 0.25;
        format!(
            "M {} {} A {} {} 0 0 1 {} {} A {} {} 0 0 1 {} {} Q {} {} {} {} Q {} {} {} {} Z",
            cx, cy,
            r, r, cx - r, cy - r,
            r, r, cx, cy,
            cx, y + size * 0.8, cx, y + size,
            cx, y + size * 0.8, cx, cy
        )
    }

    /// Escudo
    fn render_shield(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        format!(
            "M {} {} h {} v {} Q {} {} {} {} Q {} {} {} {} v -{} Z",
            x, y,
            size, size * 0.6,
            x + size, y + size * 0.8, cx, y + size,
            x, y + size * 0.8, x, y + size * 0.6,
            size * 0.6
        )
    }

    /// Cristal
    fn render_crystal(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let top_width = size * 0.6;
        let top_offset = (size - top_width) / 2.0;
        format!(
            "M {} {} L {} {} L {} {} L {} {} L {} {} Z",
            x + top_offset, y,
            x + top_offset + top_width, y,
            x + size, y + size * 0.3,
            cx, y + size,
            x, y + size * 0.3
        )
    }

    /// Flor
    fn render_flower(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let cy = y + size / 2.0;
        let petal_r = size * 0.2;
        let center_r = size * 0.15;
        
        let mut path = String::new();
        
        // 5 pétalos
        for i in 0..5 {
            let angle = (i as f32 * 72.0 - 90.0).to_radians();
            let px = cx + (size * 0.35) * angle.cos();
            let py = cy + (size * 0.35) * angle.sin();
            
            path.push_str(&format!(
                "M {} {} A {} {} 0 1 1 {} {} A {} {} 0 1 1 {} {} ",
                px - petal_r, py,
                petal_r, petal_r, px + petal_r, py,
                petal_r, petal_r, px - petal_r, py
            ));
        }
        
        // Centro
        path.push_str(&format!(
            "M {} {} A {} {} 0 1 0 {} {} A {} {} 0 1 0 {} {} Z",
            cx - center_r, cy,
            center_r, center_r, cx + center_r, cy,
            center_r, center_r, cx - center_r, cy
        ));
        
        path
    }

    /// Flecha
    fn render_arrow(&self, x: f32, y: f32, size: f32) -> String {
        let cx = x + size / 2.0;
        let arrow_width = size * 0.6;
        let arrow_offset = (size - arrow_width) / 2.0;
        let shaft_width = size * 0.3;
        let shaft_offset = (size - shaft_width) / 2.0;
        
        format!(
            "M {} {} L {} {} L {} {} L {} {} L {} {} L {} {} L {} {} Z",
            cx, y,
            x + size, y + size * 0.5,
            x + size - arrow_offset, y + size * 0.5,
            x + size - arrow_offset, y + size,
            x + arrow_offset, y + size,
            x + arrow_offset, y + size * 0.5,
            x, y + size * 0.5
        )
    }
}

/// Función helper para renderizar una forma de ojo
pub fn render_eye_shape(
    shape: EyeShape,
    position: EyePosition,
    component: EyeComponent,
    module_size: u32,
    color: &str,
) -> String {
    let renderer = EyeShapeRenderer::new(module_size);
    renderer.render_to_svg_path(shape, position, component, color)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_eye_shapes_svg_generation() {
        let renderer = EyeShapeRenderer::new(10);
        
        // Test que todas las formas generan SVG válido
        let shapes = vec![
            EyeShape::Square,
            EyeShape::RoundedSquare,
            EyeShape::Circle,
            EyeShape::Dot,
            EyeShape::Leaf,
            EyeShape::Star,
            EyeShape::Diamond,
            EyeShape::Heart,
        ];
        
        for shape in shapes {
            let svg = renderer.render_to_svg_path(
                shape,
                EyePosition::TopLeft,
                EyeComponent::Outer,
                "#000000"
            );
            
            assert!(svg.contains("<path"));
            assert!(svg.contains("fill=\"#000000\""));
            assert!(svg.contains("d=\""));
        }
    }
}