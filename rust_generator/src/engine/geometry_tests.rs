// Tests unitarios para geometría y detección de colisiones

#[cfg(test)]
mod tests {
    use super::super::geometry::*;
    use super::super::zones::{UntouchableZone, ZoneType};
    
    #[test]
    fn test_logo_zone_square_contains_point() {
        let logo = LogoExclusionZone::new(
            LogoShape::Square,
            50.0, // center x
            50.0, // center y
            20.0, // size
        );
        
        // Punto en el centro debería estar contenido
        assert!(logo.contains_point(50.0, 50.0));
        
        // Puntos en las esquinas del cuadrado
        assert!(logo.contains_point(30.0, 30.0)); // top-left
        assert!(logo.contains_point(70.0, 30.0)); // top-right
        assert!(logo.contains_point(30.0, 70.0)); // bottom-left
        assert!(logo.contains_point(70.0, 70.0)); // bottom-right
        
        // Puntos fuera del cuadrado
        assert!(!logo.contains_point(20.0, 50.0)); // left
        assert!(!logo.contains_point(80.0, 50.0)); // right
        assert!(!logo.contains_point(50.0, 20.0)); // top
        assert!(!logo.contains_point(50.0, 80.0)); // bottom
    }
    
    #[test]
    fn test_logo_zone_circle_contains_point() {
        let logo = LogoExclusionZone::new(
            LogoShape::Circle,
            50.0, // center x
            50.0, // center y
            20.0, // radius
        );
        
        // Punto en el centro
        assert!(logo.contains_point(50.0, 50.0));
        
        // Puntos en el borde del círculo (aproximadamente)
        assert!(logo.contains_point(50.0, 30.0)); // top
        assert!(logo.contains_point(70.0, 50.0)); // right
        assert!(logo.contains_point(50.0, 70.0)); // bottom
        assert!(logo.contains_point(30.0, 50.0)); // left
        
        // Puntos en las esquinas (fuera del círculo)
        assert!(!logo.contains_point(30.0, 30.0)); // Las esquinas están fuera
        assert!(!logo.contains_point(70.0, 30.0));
        assert!(!logo.contains_point(30.0, 70.0));
        assert!(!logo.contains_point(70.0, 70.0));
    }
    
    #[test]
    fn test_logo_zone_rounded_square_contains_point() {
        let logo = LogoExclusionZone::new(
            LogoShape::RoundedSquare { radius: 2.0 },
            50.0, // center x
            50.0, // center y
            20.0, // size
        );
        
        // Centro y puntos medios deberían estar contenidos
        assert!(logo.contains_point(50.0, 50.0));
        assert!(logo.contains_point(50.0, 35.0)); // top middle
        assert!(logo.contains_point(65.0, 50.0)); // right middle
        
        // Esquinas extremas podrían no estar contenidas debido al redondeo
        // Pero puntos ligeramente dentro sí
        assert!(logo.contains_point(35.0, 35.0));
        assert!(logo.contains_point(65.0, 65.0));
    }
    
    #[test]
    fn test_module_excludable_with_no_untouchable_zones() {
        let logo = LogoExclusionZone::new(LogoShape::Square, 50.0, 50.0, 20.0);
        let untouchable_zones = vec![];
        
        // Sin zonas intocables, cualquier módulo en el logo es excluible
        assert!(is_module_excludable(50, 50, &logo, &untouchable_zones));
        assert!(is_module_excludable(40, 40, &logo, &untouchable_zones));
        assert!(!is_module_excludable(20, 20, &logo, &untouchable_zones));
    }
    
    #[test]
    fn test_module_excludable_with_untouchable_zones() {
        let logo = LogoExclusionZone::new(LogoShape::Square, 10.0, 10.0, 10.0);
        let untouchable_zones = vec![
            UntouchableZone {
                zone_type: ZoneType::FinderPattern,
                x: 0,
                y: 0,
                width: 8,
                height: 8,
            },
            UntouchableZone {
                zone_type: ZoneType::TimingPattern,
                x: 8,
                y: 6,
                width: 10,
                height: 1,
            },
        ];
        
        // Módulo en (5,5) está en el logo Y en zona intocable - NO excluible
        assert!(!is_module_excludable(5, 5, &logo, &untouchable_zones));
        
        // Módulo en (15,15) está en el logo pero NO en zona intocable - SÍ excluible
        assert!(is_module_excludable(15, 15, &logo, &untouchable_zones));
        
        // Módulo en (10,6) está en timing pattern - NO excluible
        assert!(!is_module_excludable(10, 6, &logo, &untouchable_zones));
        
        // Módulo fuera del logo - NO excluible
        assert!(!is_module_excludable(25, 25, &logo, &untouchable_zones));
    }
    
    #[test]
    fn test_logo_zone_edge_cases() {
        // Logo muy pequeño
        let tiny_logo = LogoExclusionZone::new(LogoShape::Square, 10.0, 10.0, 1.0);
        assert!(tiny_logo.contains_point(10.0, 10.0));
        assert!(!tiny_logo.contains_point(12.0, 10.0));
        
        // Logo muy grande
        let huge_logo = LogoExclusionZone::new(LogoShape::Circle, 100.0, 100.0, 50.0);
        assert!(huge_logo.contains_point(100.0, 100.0));
        assert!(huge_logo.contains_point(100.0, 50.0));
        assert!(!huge_logo.contains_point(100.0, 40.0));
    }
    
    #[test]
    fn test_is_in_zone_helper() {
        let zone = UntouchableZone {
            zone_type: ZoneType::FinderPattern,
            x: 10,
            y: 10,
            width: 5,
            height: 5,
        };
        
        // Dentro de la zona
        assert!(is_in_zone(10, 10, &zone));
        assert!(is_in_zone(12, 12, &zone));
        assert!(is_in_zone(14, 14, &zone));
        
        // En los bordes
        assert!(is_in_zone(10, 10, &zone)); // top-left
        assert!(is_in_zone(14, 10, &zone)); // top-right
        assert!(is_in_zone(10, 14, &zone)); // bottom-left
        assert!(is_in_zone(14, 14, &zone)); // bottom-right
        
        // Fuera de la zona
        assert!(!is_in_zone(9, 10, &zone));
        assert!(!is_in_zone(15, 10, &zone));
        assert!(!is_in_zone(10, 9, &zone));
        assert!(!is_in_zone(10, 15, &zone));
    }
    
    #[test]
    fn test_multiple_overlapping_untouchable_zones() {
        let logo = LogoExclusionZone::new(LogoShape::Square, 20.0, 20.0, 15.0);
        let untouchable_zones = vec![
            UntouchableZone {
                zone_type: ZoneType::FinderPattern,
                x: 10,
                y: 10,
                width: 8,
                height: 8,
            },
            UntouchableZone {
                zone_type: ZoneType::FormatInfo,
                x: 15,
                y: 15,
                width: 10,
                height: 2,
            },
        ];
        
        // Módulo en zona de overlap de múltiples zonas intocables
        assert!(!is_module_excludable(16, 16, &logo, &untouchable_zones));
        
        // Módulo en el logo pero fuera de todas las zonas intocables
        assert!(is_module_excludable(25, 25, &logo, &untouchable_zones));
    }
}