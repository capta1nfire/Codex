// Tests unitarios para el optimizador de ECL dinámico

#[cfg(test)]
mod tests {
    use super::super::ecl_optimizer::*;
    use super::super::types::ErrorCorrectionLevel;
    
    #[test]
    fn test_ecl_selection_small_logo() {
        let optimizer = EclOptimizer::new();
        
        // Logo pequeño (10%) debería usar ECL Low o Medium
        let (ecl, analysis) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.1, // 10% logo
            None,
        ).unwrap();
        
        assert!(
            matches!(ecl, ErrorCorrectionLevel::Low | ErrorCorrectionLevel::Medium),
            "Logo pequeño debería usar ECL bajo o medio, obtuvo: {:?}", ecl
        );
        assert!(analysis.occlusion_percentage < 10.0);
    }
    
    #[test]
    fn test_ecl_selection_medium_logo() {
        let optimizer = EclOptimizer::new();
        
        // Logo mediano (20%) debería usar ECL Medium o Quartile
        let (ecl, analysis) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.2, // 20% logo
            None,
        ).unwrap();
        
        assert!(
            matches!(ecl, ErrorCorrectionLevel::Medium | ErrorCorrectionLevel::Quartile),
            "Logo mediano debería usar ECL medio o cuartil, obtuvo: {:?}", ecl
        );
        println!("Medium logo occlusion: {}%", analysis.occlusion_percentage);
        // La oclusión real depende del tamaño del QR que depende de los datos
        // Para URL corta, un logo de 20% puede resultar en ~9% de oclusión real
        assert!(analysis.occlusion_percentage > 5.0 && analysis.occlusion_percentage < 25.0);
    }
    
    #[test]
    fn test_ecl_selection_large_logo() {
        let optimizer = EclOptimizer::new();
        
        // Logo grande (30%) debería usar ECL High
        let (ecl, analysis) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.3, // 30% logo
            None,
        ).unwrap();
        
        // Para logos grandes (30%), debería seleccionar ECL alto
        assert!(matches!(ecl, ErrorCorrectionLevel::Quartile | ErrorCorrectionLevel::High));
        assert!(analysis.occlusion_percentage > 10.0);
    }
    
    #[test]
    fn test_ecl_override() {
        let optimizer = EclOptimizer::new();
        
        // Override debería respetar la selección del usuario
        let (ecl, _) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.1, // Logo pequeño normalmente usaría Low/Medium
            Some(ErrorCorrectionLevel::High), // Pero usuario fuerza High
        ).unwrap();
        
        assert_eq!(ecl, ErrorCorrectionLevel::High);
    }
    
    #[test]
    fn test_occlusion_calculation_accuracy() {
        let optimizer = EclOptimizer::new();
        
        // Probar con datos conocidos
        let test_data = "HELLO WORLD";
        let logo_size = 0.15; // 15%
        
        let (_, analysis) = optimizer.determine_optimal_ecl(
            test_data,
            logo_size,
            None,
        ).unwrap();
        
        // Verificar que los cálculos son razonables
        assert!(analysis.occluded_modules > 0);
        assert!(analysis.affected_codewords > 0);
        assert!(analysis.occlusion_percentage > 0.0);
        assert!(analysis.occlusion_percentage < 30.0); // No debería ser más del 30%
    }
    
    #[test]
    fn test_version_detection() {
        let optimizer = EclOptimizer::new();
        
        // Datos cortos = versión baja
        let (_, analysis_short) = optimizer.determine_optimal_ecl(
            "Hi",
            0.2,
            None,
        ).unwrap();
        
        // Datos largos = versión alta
        let long_data = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        let (_, analysis_long) = optimizer.determine_optimal_ecl(
            long_data,
            0.2,
            None,
        ).unwrap();
        
        assert!(analysis_short.qr_version < analysis_long.qr_version);
    }
    
    #[test]
    fn test_iterative_convergence() {
        let optimizer = EclOptimizer::new();
        
        // El algoritmo debería converger en máximo 3 iteraciones
        let test_cases = vec![
            ("Short", 0.1),
            ("Medium length text for testing", 0.2),
            ("Very long text with lots of characters to ensure we get a larger QR code version for testing purposes", 0.25),
        ];
        
        for (data, logo_size) in test_cases {
            let result = optimizer.determine_optimal_ecl(data, logo_size, None);
            assert!(result.is_ok(), "Algoritmo debería converger para datos: {}", data);
        }
    }
    
    #[test]
    fn test_edge_case_tiny_logo() {
        let optimizer = EclOptimizer::new();
        
        // Logo muy pequeño (5%)
        let (ecl, analysis) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.05, // 5% logo
            None,
        ).unwrap();
        
        // Logo muy pequeño puede usar Low o Medium
        assert!(matches!(ecl, ErrorCorrectionLevel::Low | ErrorCorrectionLevel::Medium));
        assert!(analysis.occlusion_percentage < 7.0);
    }
    
    #[test]
    fn test_edge_case_max_logo() {
        let optimizer = EclOptimizer::new();
        
        // Logo al máximo permitido (30%)
        let (ecl, analysis) = optimizer.determine_optimal_ecl(
            "https://example.com",
            0.3, // 30% logo
            None,
        ).unwrap();
        
        // Logo del 35% debería usar Quartile o High
        assert!(matches!(ecl, ErrorCorrectionLevel::Quartile | ErrorCorrectionLevel::High));
        // La oclusión real debería ser menor al 30% del ECL High
        assert!(analysis.occlusion_percentage < 30.0);
    }
}