// Temporary test runner for boost ECL tests
#[cfg(test)]
mod boost_tests {
    use crate::engine::generator::QrGenerator;
    use crate::engine::types::ErrorCorrectionLevel;

    #[test]
    fn test_boost_ecl_basic() {
        let generator = QrGenerator::new();
        
        // Datos que caben en un QR pequeño con espacio libre
        let test_data = "HELLO WORLD";
        
        // Generar con boost ECL
        let result = generator.generate_with_boost_ecl(
            test_data, 
            400, 
            ErrorCorrectionLevel::Low
        );
        
        assert!(result.is_ok());
        let (_qr, boost_info) = result.unwrap();
        
        // Verificar información de boost
        println!("Boost ECL Test:");
        println!("  Original ECL: {:?}", boost_info.original_ecl);
        println!("  Final ECL: {:?}", boost_info.final_ecl);
        println!("  Boost applied: {}", boost_info.boost_applied);
        println!("  Version: {}", boost_info.version);
        
        // Para datos cortos, el boost debería aplicarse
        assert!(boost_info.boost_applied, "Boost should be applied for short data");
    }

    #[test]
    fn test_boost_ecl_with_different_data_sizes() {
        let generator = QrGenerator::new();
        
        let long_data = "A".repeat(100);
        let test_cases = vec![
            ("SHORT", "Very short data"),
            ("HELLO WORLD 12345", "Medium length"),
            ("https://example.com/product/12345?ref=test", "URL"),
            (long_data.as_str(), "Long data"),
        ];
        
        for (data, description) in test_cases {
            let result = generator.generate_with_boost_ecl(
                data,
                400,
                ErrorCorrectionLevel::Low
            );
            
            assert!(result.is_ok(), "Failed to generate QR for: {}", description);
            let (_qr, boost_info) = result.unwrap();
            
            println!("\nBoost test for {} ({}):", description, data.len());
            println!("  Version: {}", boost_info.version);
            println!("  Modules: {}", boost_info.modules_count);
            println!("  Boost applied: {}", boost_info.boost_applied);
            
            if boost_info.boost_applied {
                println!("  ECL upgraded: {:?} → {:?}", 
                    boost_info.original_ecl, 
                    boost_info.final_ecl
                );
            }
        }
    }

    #[test]
    fn test_dynamic_ecl_with_boost() {
        let generator = QrGenerator::new();
        
        // Probar con logo (30% de oclusión)
        let logo_size_ratio = 0.3;
        
        // Sin boost
        let result_no_boost = generator.generate_with_dynamic_ecl_and_boost(
            "https://codex.com",
            400,
            logo_size_ratio,
            None,
            false // sin boost
        );
        
        assert!(result_no_boost.is_ok());
        let (_qr_no_boost, analysis_no_boost) = result_no_boost.unwrap();
        
        // Con boost
        let result_boost = generator.generate_with_dynamic_ecl_and_boost(
            "https://codex.com",
            400,
            logo_size_ratio,
            None,
            true // con boost
        );
        
        assert!(result_boost.is_ok());
        let (_qr_boost, analysis_boost) = result_boost.unwrap();
        
        println!("\nDynamic ECL comparison:");
        println!("  Without boost - ECL: {:?}, Version: {}", 
            analysis_no_boost.recommended_ecl,
            analysis_no_boost.qr_version
        );
        println!("  With boost - ECL: {:?}, Version: {}", 
            analysis_boost.recommended_ecl,
            analysis_boost.qr_version
        );
        
        // El ECL con boost debería ser igual o mejor
        assert!(
            ecl_to_number(analysis_boost.recommended_ecl) >= ecl_to_number(analysis_no_boost.recommended_ecl),
            "Boost should maintain or improve ECL"
        );
    }

    // Helper para comparar ECL
    fn ecl_to_number(ecl: ErrorCorrectionLevel) -> u8 {
        match ecl {
            ErrorCorrectionLevel::Low => 1,
            ErrorCorrectionLevel::Medium => 2,
            ErrorCorrectionLevel::Quartile => 3,
            ErrorCorrectionLevel::High => 4,
        }
    }
}

fn main() {
    println!("Test runner for boost ECL tests");
}