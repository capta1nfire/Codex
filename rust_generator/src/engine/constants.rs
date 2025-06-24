// engine/constants.rs - Constantes del motor QR

/// Tabla de coordenadas de centros de patrones de alineación por versión
/// Fuente: ISO/IEC 18004 y validado contra implementaciones de referencia
/// 
/// Version 1 no tiene patrones de alineación
/// Versiones 2-40 tienen patrones según esta tabla
pub const ALIGNMENT_PATTERN_POSITIONS: &[&[u8]] = &[
    &[],           // Version 0 (no existe)
    &[],           // Version 1 (sin patrones)
    &[6, 18],      // Version 2
    &[6, 22],      // Version 3
    &[6, 26],      // Version 4
    &[6, 30],      // Version 5
    &[6, 34],      // Version 6
    &[6, 22, 38],  // Version 7
    &[6, 24, 42],  // Version 8
    &[6, 26, 46],  // Version 9
    &[6, 28, 50],  // Version 10
    &[6, 30, 54],  // Version 11
    &[6, 32, 58],  // Version 12
    &[6, 34, 62],  // Version 13
    &[6, 26, 46, 66],     // Version 14
    &[6, 26, 48, 70],     // Version 15
    &[6, 26, 50, 74],     // Version 16
    &[6, 30, 54, 78],     // Version 17
    &[6, 30, 56, 82],     // Version 18
    &[6, 30, 58, 86],     // Version 19
    &[6, 34, 62, 90],     // Version 20
    &[6, 28, 50, 72, 94], // Version 21
    &[6, 26, 50, 74, 98], // Version 22
    &[6, 30, 54, 78, 102], // Version 23
    &[6, 28, 54, 80, 106], // Version 24
    &[6, 32, 58, 84, 110], // Version 25
    &[6, 30, 58, 86, 114], // Version 26
    &[6, 34, 62, 90, 118], // Version 27
    &[6, 26, 50, 74, 98, 122],  // Version 28
    &[6, 30, 54, 78, 102, 126], // Version 29
    &[6, 26, 52, 78, 104, 130], // Version 30
    &[6, 30, 56, 82, 108, 134], // Version 31
    &[6, 34, 60, 86, 112, 138], // Version 32 (validada)
    &[6, 30, 58, 86, 114, 142], // Version 33
    &[6, 34, 62, 90, 118, 146], // Version 34
    &[6, 30, 54, 78, 102, 126, 150], // Version 35
    &[6, 24, 50, 76, 102, 128, 154], // Version 36 (validada)
    &[6, 28, 54, 80, 106, 132, 158], // Version 37
    &[6, 32, 58, 84, 110, 136, 162], // Version 38
    &[6, 26, 54, 82, 110, 138, 166], // Version 39 (validada)
    &[6, 30, 58, 86, 114, 142, 170], // Version 40
];

/// Obtiene las posiciones de los patrones de alineación para una versión específica
/// 
/// # Argumentos
/// * `version` - Versión del código QR (1-40)
/// 
/// # Retorna
/// * Vector con las coordenadas de los centros de los patrones
/// * Vector vacío para versión 1
/// 
/// # Ejemplo
/// ```
/// let positions = get_alignment_pattern_positions(7);
/// // positions = vec![(6,6), (6,22), (6,38), (22,6), (22,22), (22,38), (38,6), (38,22), (38,38)]
/// // Menos los 3 que coinciden con patrones de búsqueda
/// ```
pub fn get_alignment_pattern_positions(version: u8) -> Vec<(u8, u8)> {
    if version == 0 || version > 40 {
        return vec![];
    }
    
    let coords = ALIGNMENT_PATTERN_POSITIONS[version as usize];
    if coords.is_empty() {
        return vec![];
    }
    
    let mut positions = Vec::new();
    
    // Generar todas las combinaciones de coordenadas
    for &row in coords {
        for &col in coords {
            // Excluir las posiciones que coinciden con los patrones de búsqueda
            if !is_finder_pattern_position(version, row, col) {
                positions.push((row, col));
            }
        }
    }
    
    positions
}

/// Determina si una posición coincide con un patrón de búsqueda
fn is_finder_pattern_position(version: u8, row: u8, col: u8) -> bool {
    let size = 17 + 4 * version;
    let max_coord = size - 7;
    
    // Superior izquierda
    if row <= 8 && col <= 8 {
        return true;
    }
    
    // Superior derecha
    if row <= 8 && col >= max_coord {
        return true;
    }
    
    // Inferior izquierda
    if row >= max_coord && col <= 8 {
        return true;
    }
    
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_version_1_no_patterns() {
        let positions = get_alignment_pattern_positions(1);
        assert!(positions.is_empty());
    }
    
    #[test]
    fn test_version_2_single_pattern() {
        let positions = get_alignment_pattern_positions(2);
        assert_eq!(positions, vec![(18, 18)]);
    }
    
    #[test]
    fn test_version_7_multiple_patterns() {
        let positions = get_alignment_pattern_positions(7);
        // Version 7 tiene 9 posiciones totales - 3 (patrones de búsqueda) = 6
        assert_eq!(positions.len(), 6);
        assert!(positions.contains(&(22, 22))); // Centro
        assert!(positions.contains(&(6, 22)));   // Superior centro
        assert!(positions.contains(&(38, 22)));  // Inferior centro
        assert!(positions.contains(&(22, 6)));   // Izquierda centro
        assert!(positions.contains(&(22, 38)));  // Derecha centro
        assert!(positions.contains(&(38, 38)));  // Inferior derecha
    }
    
    #[test]
    fn test_version_32_problematic() {
        // Version 32 es una de las versiones problemáticas documentadas
        let positions = get_alignment_pattern_positions(32);
        let coords = ALIGNMENT_PATTERN_POSITIONS[32];
        assert_eq!(coords, &[6, 34, 60, 86, 112, 138]);
        // 6×6 posiciones - 3 patrones de búsqueda = 33 patrones de alineación
        assert_eq!(positions.len(), 33);
    }
    
    #[test]
    fn test_invalid_version() {
        assert!(get_alignment_pattern_positions(0).is_empty());
        assert!(get_alignment_pattern_positions(41).is_empty());
    }
}