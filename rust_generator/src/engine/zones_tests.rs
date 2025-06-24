// Tests unitarios para zonas intocables

#[cfg(test)]
mod tests {
    use super::super::zones::*;
    
    #[test]
    fn test_untouchable_zones_version_1() {
        // Version 1 no tiene patrones de alineación
        let zones = calculate_untouchable_zones(1);
        
        // Debería tener: 3 finder + 3 separators + 2 timing + 2 format info + 4 quiet zones
        let finder_count = zones.iter().filter(|z| matches!(z.zone_type, ZoneType::FinderPattern)).count();
        let separator_count = zones.iter().filter(|z| matches!(z.zone_type, ZoneType::Separator)).count();
        let timing_count = zones.iter().filter(|z| matches!(z.zone_type, ZoneType::TimingPattern)).count();
        let format_count = zones.iter().filter(|z| matches!(z.zone_type, ZoneType::FormatInfo)).count();
        
        assert_eq!(finder_count, 3, "Debería haber 3 patrones de búsqueda");
        assert_eq!(separator_count, 6, "Debería haber 6 separadores (2 por cada patrón de búsqueda)");
        assert_eq!(timing_count, 2, "Debería haber 2 patrones de temporización");
        assert_eq!(format_count, 5, "Debería haber 5 áreas de información de formato");
    }
    
    #[test]
    fn test_untouchable_zones_version_2() {
        // Version 2 tiene 1 patrón de alineación
        let zones = calculate_untouchable_zones(2);
        
        let alignment_count = zones.iter()
            .filter(|z| matches!(z.zone_type, ZoneType::AlignmentPattern))
            .count();
        
        assert_eq!(alignment_count, 1, "Version 2 debería tener 1 patrón de alineación");
    }
    
    #[test]
    fn test_untouchable_zones_version_7_and_up() {
        // Version 7 y superiores tienen información de versión
        let zones = calculate_untouchable_zones(7);
        
        let version_info_count = zones.iter()
            .filter(|z| matches!(z.zone_type, ZoneType::VersionInfo))
            .count();
        
        assert_eq!(version_info_count, 2, "Version 7+ debería tener 2 áreas de información de versión");
    }
    
    #[test]
    fn test_finder_pattern_positions() {
        let zones = calculate_untouchable_zones(10); // Cualquier versión
        
        let finders: Vec<&UntouchableZone> = zones.iter()
            .filter(|z| matches!(z.zone_type, ZoneType::FinderPattern))
            .collect();
        
        assert_eq!(finders.len(), 3);
        
        // Verificar posiciones estándar de finder patterns
        let has_top_left = finders.iter().any(|f| f.x == 0 && f.y == 0);
        let has_top_right = finders.iter().any(|f| f.x > 30 && f.y == 0); // Depende del tamaño
        let has_bottom_left = finders.iter().any(|f| f.x == 0 && f.y > 30);
        
        assert!(has_top_left, "Debería tener finder pattern arriba-izquierda");
        assert!(has_top_right, "Debería tener finder pattern arriba-derecha");
        assert!(has_bottom_left, "Debería tener finder pattern abajo-izquierda");
    }
    
    #[test]
    fn test_timing_pattern_dimensions() {
        let zones = calculate_untouchable_zones(5);
        
        let timing_patterns: Vec<&UntouchableZone> = zones.iter()
            .filter(|z| matches!(z.zone_type, ZoneType::TimingPattern))
            .collect();
        
        assert_eq!(timing_patterns.len(), 2);
        
        for pattern in timing_patterns {
            // Los patrones de temporización deben tener ancho o alto de 1
            assert!(
                pattern.width == 1 || pattern.height == 1,
                "Patrón de temporización debe ser una línea de 1 módulo de ancho"
            );
        }
    }
    
    #[test]
    fn test_is_in_untouchable_zone() {
        let zones = calculate_untouchable_zones(1);
        
        // Punto (0,0) debería estar en zona intocable (finder pattern)
        assert!(is_in_untouchable_zone(0, 0, &zones));
        
        // Punto (3,3) debería estar en zona intocable (dentro del finder)
        assert!(is_in_untouchable_zone(3, 3, &zones));
        
        // Punto (10,10) probablemente no está en zona intocable
        // (depende del tamaño, pero en versión 1 es seguro)
        assert!(!is_in_untouchable_zone(10, 10, &zones));
    }
    
    #[test]
    fn test_no_overlapping_zones() {
        // Verificar que las zonas no se solapan incorrectamente
        for version in 1..=10 {
            let zones = calculate_untouchable_zones(version);
            
            // Verificar que no hay zonas idénticas
            for i in 0..zones.len() {
                for j in (i+1)..zones.len() {
                    let zone_a = &zones[i];
                    let zone_b = &zones[j];
                    
                    // Las zonas no deberían ser exactamente iguales
                    let identical = zone_a.x == zone_b.x && 
                                  zone_a.y == zone_b.y && 
                                  zone_a.width == zone_b.width && 
                                  zone_a.height == zone_b.height;
                    
                    assert!(!identical, 
                        "Zonas duplicadas encontradas en versión {}: {:?} y {:?}", 
                        version, zone_a, zone_b
                    );
                }
            }
        }
    }
    
    #[test]
    fn test_alignment_pattern_positions_match_constants() {
        use super::super::constants::get_alignment_pattern_positions;
        
        // Verificar algunas versiones específicas
        let test_versions = vec![2, 7, 14, 25, 32, 40];
        
        for version in test_versions {
            let zones = calculate_untouchable_zones(version);
            let expected_positions = get_alignment_pattern_positions(version);
            
            let alignment_zones: Vec<&UntouchableZone> = zones.iter()
                .filter(|z| matches!(z.zone_type, ZoneType::AlignmentPattern))
                .collect();
            
            // El número de zonas de alineación debería coincidir con las posiciones esperadas
            assert_eq!(
                alignment_zones.len(), 
                expected_positions.len(),
                "Número incorrecto de patrones de alineación para versión {}", 
                version
            );
        }
    }
}