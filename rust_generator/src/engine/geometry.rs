// engine/geometry.rs - Funciones de geometría para detección de colisiones

use geo_types::{Coord, Point, Rect};
use super::zones::UntouchableZone;

/// Representa la zona de exclusión del logo
#[derive(Debug, Clone)]
pub struct LogoExclusionZone {
    /// Tipo de forma del logo
    pub shape: LogoShape,
    /// Centro X en módulos
    pub center_x: f64,
    /// Centro Y en módulos
    pub center_y: f64,
    /// Tamaño (radio para círculo, lado/2 para cuadrado)
    pub size: f64,
}

/// Forma del área de exclusión del logo
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum LogoShape {
    /// Área cuadrada
    Square,
    /// Área circular
    Circle,
    /// Área con esquinas redondeadas
    RoundedSquare { radius: f64 },
}

impl LogoExclusionZone {
    /// Crea una nueva zona de exclusión para el logo
    pub fn new(shape: LogoShape, center_x: f64, center_y: f64, size: f64) -> Self {
        Self {
            shape,
            center_x,
            center_y,
            size,
        }
    }
    
    /// Verifica si un punto está contenido en la zona del logo
    pub fn contains_point(&self, x: f64, y: f64) -> bool {
        match self.shape {
            LogoShape::Square => {
                let half_size = self.size;
                x >= self.center_x - half_size && 
                x <= self.center_x + half_size &&
                y >= self.center_y - half_size && 
                y <= self.center_y + half_size
            },
            LogoShape::Circle => {
                let dx = x - self.center_x;
                let dy = y - self.center_y;
                let distance_squared = dx * dx + dy * dy;
                distance_squared <= self.size * self.size
            },
            LogoShape::RoundedSquare { radius } => {
                let half_size = self.size;
                let inner_half = half_size - radius;
                
                // Si está dentro del rectángulo interior, definitivamente está dentro
                if x >= self.center_x - inner_half && 
                   x <= self.center_x + inner_half &&
                   y >= self.center_y - inner_half && 
                   y <= self.center_y + inner_half {
                    return true;
                }
                
                // Si está fuera del rectángulo exterior, definitivamente está fuera
                if x < self.center_x - half_size || 
                   x > self.center_x + half_size ||
                   y < self.center_y - half_size || 
                   y > self.center_y + half_size {
                    return false;
                }
                
                // Verificar las esquinas redondeadas
                let corner_x = if x < self.center_x { 
                    self.center_x - inner_half 
                } else { 
                    self.center_x + inner_half 
                };
                let corner_y = if y < self.center_y { 
                    self.center_y - inner_half 
                } else { 
                    self.center_y + inner_half 
                };
                
                let dx = x - corner_x;
                let dy = y - corner_y;
                dx * dx + dy * dy <= radius * radius
            }
        }
    }
    
    /// Verifica si un módulo está dentro de la zona de exclusión
    pub fn contains_module(&self, module_x: u16, module_y: u16) -> bool {
        // Centro del módulo (agregamos 0.5 para obtener el centro)
        let mx = module_x as f64 + 0.5;
        let my = module_y as f64 + 0.5;
        
        match self.shape {
            LogoShape::Square => {
                let half_size = self.size;
                mx >= self.center_x - half_size && 
                mx <= self.center_x + half_size &&
                my >= self.center_y - half_size && 
                my <= self.center_y + half_size
            },
            LogoShape::Circle => {
                let dx = mx - self.center_x;
                let dy = my - self.center_y;
                let distance_squared = dx * dx + dy * dy;
                distance_squared <= self.size * self.size
            },
            LogoShape::RoundedSquare { radius } => {
                // Simplificación: usamos un cuadrado con verificación adicional en las esquinas
                let half_size = self.size;
                let inner_half = half_size - radius;
                
                // Si está dentro del rectángulo interior, definitivamente está dentro
                if mx >= self.center_x - inner_half && 
                   mx <= self.center_x + inner_half &&
                   my >= self.center_y - inner_half && 
                   my <= self.center_y + inner_half {
                    return true;
                }
                
                // Si está fuera del rectángulo exterior, definitivamente está fuera
                if mx < self.center_x - half_size || 
                   mx > self.center_x + half_size ||
                   my < self.center_y - half_size || 
                   my > self.center_y + half_size {
                    return false;
                }
                
                // Verificar las esquinas redondeadas
                let corner_x = if mx < self.center_x { 
                    self.center_x - inner_half 
                } else { 
                    self.center_x + inner_half 
                };
                let corner_y = if my < self.center_y { 
                    self.center_y - inner_half 
                } else { 
                    self.center_y + inner_half 
                };
                
                let dx = mx - corner_x;
                let dy = my - corner_y;
                dx * dx + dy * dy <= radius * radius
            }
        }
    }
    
    /// Calcula el área en módulos²
    pub fn area(&self) -> f64 {
        match self.shape {
            LogoShape::Square => (2.0 * self.size) * (2.0 * self.size),
            LogoShape::Circle => std::f64::consts::PI * self.size * self.size,
            LogoShape::RoundedSquare { radius } => {
                // Área aproximada: cuadrado - 4 esquinas + 4 cuartos de círculo
                let square_area = (2.0 * self.size) * (2.0 * self.size);
                let corner_area = 4.0 * radius * radius - std::f64::consts::PI * radius * radius;
                square_area - corner_area
            }
        }
    }
}

/// Verifica si un punto está dentro de una zona
pub fn is_in_zone(x: u16, y: u16, zone: &UntouchableZone) -> bool {
    x >= zone.x && 
    x < zone.x + zone.width && 
    y >= zone.y && 
    y < zone.y + zone.height
}

/// Verifica si un módulo es excluible (no está en zona intocable pero sí en zona del logo)
pub fn is_module_excludable(
    module_x: u16, 
    module_y: u16,
    logo_zone: &LogoExclusionZone,
    untouchable_zones: &[UntouchableZone]
) -> bool {
    // Primero verificar que esté en la zona del logo
    if !logo_zone.contains_module(module_x, module_y) {
        return false;
    }
    
    // Luego verificar que NO esté en ninguna zona intocable
    for zone in untouchable_zones {
        if zone.contains_point(module_x, module_y) {
            return false;
        }
    }
    
    true
}

/// Calcula el centro óptimo para el logo basado en la versión del QR
pub fn calculate_logo_center(version: u8) -> (f64, f64) {
    let size = 17 + 4 * version as u16;
    let center = size as f64 / 2.0;
    (center, center)
}

/// Calcula el tamaño máximo seguro del logo para un ratio dado
pub fn calculate_logo_size(version: u8, size_ratio: f64) -> f64 {
    let qr_size = 17 + 4 * version as u16;
    (qr_size as f64 * size_ratio) / 2.0  // Dividido por 2 porque usamos radio/half-size
}

/// Cuenta los módulos excluibles en una zona de logo
pub fn count_excludable_modules(
    version: u8,
    logo_zone: &LogoExclusionZone,
    untouchable_zones: &[UntouchableZone]
) -> usize {
    let size = 17 + 4 * version as u16;
    let mut count = 0;
    
    for y in 0..size {
        for x in 0..size {
            if is_module_excludable(x, y, logo_zone, untouchable_zones) {
                count += 1;
            }
        }
    }
    
    count
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_square_logo_contains() {
        let logo = LogoExclusionZone::new(
            LogoShape::Square,
            10.0, 10.0, 3.0
        );
        
        // Centro
        assert!(logo.contains_module(10, 10));
        
        // Bordes
        assert!(logo.contains_module(7, 10));
        assert!(logo.contains_module(12, 10)); // 12.5 is still within 13.0
        
        // Fuera
        assert!(!logo.contains_module(6, 10));
        assert!(!logo.contains_module(14, 10));
    }
    
    #[test]
    fn test_circle_logo_contains() {
        let logo = LogoExclusionZone::new(
            LogoShape::Circle,
            10.0, 10.0, 3.0
        );
        
        // Centro
        assert!(logo.contains_module(10, 10));
        
        // En el radio
        assert!(logo.contains_module(12, 10));
        
        // Esquina (fuera del círculo)
        assert!(!logo.contains_module(13, 13));
    }
    
    #[test]
    fn test_is_module_excludable() {
        let logo = LogoExclusionZone::new(
            LogoShape::Square,
            10.0, 10.0, 3.0
        );
        
        let untouchable = vec![
            UntouchableZone::new(
                crate::engine::zones::ZoneType::TimingPattern,
                6, 8, 1, 5
            )
        ];
        
        // Módulo en logo pero no en zona intocable
        assert!(is_module_excludable(10, 10, &logo, &untouchable));
        
        // Módulo en logo Y en zona intocable (timing pattern)
        assert!(!is_module_excludable(6, 10, &logo, &untouchable));
        
        // Módulo fuera del logo
        assert!(!is_module_excludable(20, 20, &logo, &untouchable));
    }
    
    #[test]
    fn test_logo_area_calculations() {
        let square = LogoExclusionZone::new(LogoShape::Square, 10.0, 10.0, 5.0);
        assert_eq!(square.area(), 100.0); // 10x10
        
        let circle = LogoExclusionZone::new(LogoShape::Circle, 10.0, 10.0, 5.0);
        let expected_circle_area = std::f64::consts::PI * 25.0;
        assert!((circle.area() - expected_circle_area).abs() < 0.001);
    }
}