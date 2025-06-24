// engine/zones.rs - Mapeo de zonas intocables del código QR

use super::constants::get_alignment_pattern_positions;

/// Tipo de zona funcional en el código QR
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ZoneType {
    /// Patrón de búsqueda (3 esquinas)
    FinderPattern,
    /// Separador de patrón de búsqueda
    Separator,
    /// Patrón de temporización
    TimingPattern,
    /// Patrón de alineación
    AlignmentPattern,
    /// Información de formato
    FormatInfo,
    /// Información de versión (v7+)
    VersionInfo,
    /// Zona silenciosa (quiet zone)
    QuietZone,
}

/// Zona intocable del código QR
#[derive(Debug, Clone)]
pub struct UntouchableZone {
    /// Tipo de zona
    pub zone_type: ZoneType,
    /// Coordenada X superior izquierda
    pub x: u16,
    /// Coordenada Y superior izquierda  
    pub y: u16,
    /// Ancho de la zona
    pub width: u16,
    /// Alto de la zona
    pub height: u16,
}

impl UntouchableZone {
    /// Crea una nueva zona intocable
    pub fn new(zone_type: ZoneType, x: u16, y: u16, width: u16, height: u16) -> Self {
        Self {
            zone_type,
            x,
            y,
            width,
            height,
        }
    }
    
    /// Verifica si un punto está dentro de esta zona
    pub fn contains_point(&self, px: u16, py: u16) -> bool {
        px >= self.x && 
        px < self.x + self.width && 
        py >= self.y && 
        py < self.y + self.height
    }
    
    /// Verifica si esta zona se superpone con un rectángulo
    pub fn intersects_rect(&self, rx: u16, ry: u16, rw: u16, rh: u16) -> bool {
        !(rx >= self.x + self.width ||
          rx + rw <= self.x ||
          ry >= self.y + self.height ||
          ry + rh <= self.y)
    }
}

/// Calcula todas las zonas intocables para una versión específica de QR
pub fn calculate_untouchable_zones(version: u8) -> Vec<UntouchableZone> {
    let mut zones = Vec::new();
    
    if version == 0 || version > 40 {
        return zones;
    }
    
    let size = 17 + 4 * version as u16;
    
    // 1. Patrones de búsqueda (Finder Patterns) - 7×7 cada uno
    // Superior izquierda
    zones.push(UntouchableZone::new(
        ZoneType::FinderPattern,
        0, 0, 7, 7
    ));
    
    // Superior derecha
    zones.push(UntouchableZone::new(
        ZoneType::FinderPattern,
        size - 7, 0, 7, 7
    ));
    
    // Inferior izquierda
    zones.push(UntouchableZone::new(
        ZoneType::FinderPattern,
        0, size - 7, 7, 7
    ));
    
    // 2. Separadores - 1 módulo de ancho alrededor de cada patrón de búsqueda
    // Separador superior izquierdo
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        7, 0, 1, 8
    ));
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        0, 7, 7, 1
    ));
    
    // Separador superior derecho
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        size - 8, 0, 1, 8
    ));
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        size - 7, 7, 7, 1
    ));
    
    // Separador inferior izquierdo
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        7, size - 8, 1, 8
    ));
    zones.push(UntouchableZone::new(
        ZoneType::Separator,
        0, size - 8, 7, 1
    ));
    
    // 3. Patrones de temporización (Timing Patterns)
    // Horizontal (fila 6)
    zones.push(UntouchableZone::new(
        ZoneType::TimingPattern,
        8, 6, size - 16, 1
    ));
    
    // Vertical (columna 6)
    zones.push(UntouchableZone::new(
        ZoneType::TimingPattern,
        6, 8, 1, size - 16
    ));
    
    // 4. Información de formato - 2 franjas
    // Franja superior/izquierda
    zones.push(UntouchableZone::new(
        ZoneType::FormatInfo,
        0, 8, 9, 1
    ));
    zones.push(UntouchableZone::new(
        ZoneType::FormatInfo,
        8, 0, 1, 8
    ));
    zones.push(UntouchableZone::new(
        ZoneType::FormatInfo,
        8, 8, 1, 1  // El módulo oscuro fijo
    ));
    
    // Franja derecha/inferior
    zones.push(UntouchableZone::new(
        ZoneType::FormatInfo,
        size - 8, 8, 8, 1
    ));
    zones.push(UntouchableZone::new(
        ZoneType::FormatInfo,
        8, size - 7, 1, 7
    ));
    
    // 5. Información de versión (solo para versión 7+)
    if version >= 7 {
        // Superior derecha
        zones.push(UntouchableZone::new(
            ZoneType::VersionInfo,
            size - 11, 0, 3, 6
        ));
        
        // Inferior izquierda
        zones.push(UntouchableZone::new(
            ZoneType::VersionInfo,
            0, size - 11, 6, 3
        ));
    }
    
    // 6. Patrones de alineación
    if version >= 2 {
        let positions = get_alignment_pattern_positions(version);
        for (row, col) in positions {
            // Cada patrón es 5×5
            zones.push(UntouchableZone::new(
                ZoneType::AlignmentPattern,
                col as u16 - 2,
                row as u16 - 2,
                5,
                5
            ));
        }
    }
    
    zones
}

/// Verifica si un módulo está en alguna zona intocable
pub fn is_in_untouchable_zone(x: u16, y: u16, zones: &[UntouchableZone]) -> bool {
    zones.iter().any(|zone| zone.contains_point(x, y))
}

/// Calcula el área total ocupada por zonas intocables
pub fn calculate_untouchable_area(version: u8) -> u32 {
    let zones = calculate_untouchable_zones(version);
    let mut total_area = 0u32;
    
    // Necesitamos evitar contar áreas superpuestas
    // Por simplicidad, sumamos todas las áreas (algunas zonas pueden superponerse ligeramente)
    for zone in zones {
        total_area += (zone.width as u32) * (zone.height as u32);
    }
    
    total_area
}

/// Verifica si un módulo específico está en una zona intocable
pub fn is_module_untouchable(version: u8, x: u16, y: u16) -> bool {
    let zones = calculate_untouchable_zones(version);
    
    for zone in zones {
        if zone.contains_point(x, y) {
            return true;
        }
    }
    
    false
}

/// Obtiene el tipo de zona para un módulo específico
pub fn get_zone_type(version: u8, x: u16, y: u16) -> Option<ZoneType> {
    let zones = calculate_untouchable_zones(version);
    
    for zone in zones {
        if zone.contains_point(x, y) {
            return Some(zone.zone_type);
        }
    }
    
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_zone_contains_point() {
        let zone = UntouchableZone::new(ZoneType::FinderPattern, 0, 0, 7, 7);
        
        assert!(zone.contains_point(0, 0));
        assert!(zone.contains_point(6, 6));
        assert!(!zone.contains_point(7, 7));
        assert!(!zone.contains_point(10, 10));
    }
    
    #[test]
    fn test_zone_intersects_rect() {
        let zone = UntouchableZone::new(ZoneType::FinderPattern, 10, 10, 5, 5);
        
        // Completamente dentro
        assert!(zone.intersects_rect(11, 11, 2, 2));
        
        // Parcialmente superpuesto
        assert!(zone.intersects_rect(8, 8, 5, 5));
        
        // Tocando el borde
        assert!(zone.intersects_rect(15, 10, 5, 5));
        
        // Completamente fuera
        assert!(!zone.intersects_rect(20, 20, 5, 5));
    }
    
    #[test]
    fn test_calculate_zones_version_1() {
        let zones = calculate_untouchable_zones(1);
        
        // Version 1: sin patrones de alineación, sin info de versión
        let zone_types: Vec<ZoneType> = zones.iter().map(|z| z.zone_type).collect();
        
        assert!(zone_types.contains(&ZoneType::FinderPattern));
        assert!(zone_types.contains(&ZoneType::Separator));
        assert!(zone_types.contains(&ZoneType::TimingPattern));
        assert!(zone_types.contains(&ZoneType::FormatInfo));
        assert!(!zone_types.contains(&ZoneType::AlignmentPattern));
        assert!(!zone_types.contains(&ZoneType::VersionInfo));
    }
    
    #[test]
    fn test_calculate_zones_version_7() {
        let zones = calculate_untouchable_zones(7);
        
        // Version 7: con patrones de alineación y info de versión
        let zone_types: Vec<ZoneType> = zones.iter().map(|z| z.zone_type).collect();
        
        assert!(zone_types.contains(&ZoneType::AlignmentPattern));
        assert!(zone_types.contains(&ZoneType::VersionInfo));
        
        // Contar patrones de alineación (debería haber 6)
        let alignment_count = zones.iter()
            .filter(|z| z.zone_type == ZoneType::AlignmentPattern)
            .count();
        assert_eq!(alignment_count, 6);
    }
    
    #[test]
    fn test_is_module_untouchable() {
        // Verificar patrón de búsqueda superior izquierdo
        assert!(is_module_untouchable(1, 0, 0));
        assert!(is_module_untouchable(1, 6, 6));
        
        // Verificar patrón de temporización
        assert!(is_module_untouchable(1, 10, 6)); // Horizontal
        assert!(is_module_untouchable(1, 6, 10)); // Vertical
        
        // Verificar módulo de datos (no intocable)
        assert!(!is_module_untouchable(1, 10, 10));
    }
    
    #[test]
    fn test_untouchable_area() {
        let area_v1 = calculate_untouchable_area(1);
        let area_v7 = calculate_untouchable_area(7);
        
        // Version 7 debe tener más área intocable que version 1
        assert!(area_v7 > area_v1);
        
        // Verificar que el área es razonable
        let total_modules_v1 = 21 * 21;
        assert!(area_v1 < total_modules_v1 as u32);
    }
}