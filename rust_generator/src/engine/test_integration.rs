// engine/test_integration.rs - Tests de integración del motor QR

#[cfg(test)]
mod tests {
    use super::super::*;
    use std::time::Instant;

    #[tokio::test]
    async fn test_basic_qr_generation_performance() {
        let engine = QrEngine::new();
        
        // Test con URL simple
        let request = QrRequest {
            data: "https://codex.com".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: None,
        };
        
        let start = Instant::now();
        let result = engine.generate(request).await;
        let duration = start.elapsed();
        
        assert!(result.is_ok());
        let output = result.unwrap();
        
        // Verificar que cumple con el objetivo de <20ms
        assert!(duration.as_millis() < 20, "Generation took {}ms, expected <20ms", duration.as_millis());
        
        // Verificar metadata
        assert_eq!(output.metadata.complexity_level, ComplexityLevel::Basic);
        assert!(output.metadata.quality_score >= 0.85);
        assert!(!output.data.is_empty());
        assert!(output.data.contains("<svg"));
    }

    #[tokio::test]
    async fn test_medium_qr_with_customization() {
        let engine = QrEngine::new();
        
        // Test con personalización media
        let request = QrRequest {
            data: "https://codex.com/product/123".to_string(),
            size: 600,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: Some(EyeShape::RoundedSquare),
                eye_border_style: None,
                eye_center_style: None,
                data_pattern: Some(DataPattern::Dots),
                colors: Some(ColorOptions {
                    foreground: "#2563EB".to_string(),
                    background: "#FFFFFF".to_string(),
                    eye_colors: None,
                }),
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: Some(ErrorCorrectionLevel::High),
                logo_size_ratio: None,
                selective_effects: None,
            }),
        };
        
        let start = Instant::now();
        let result = engine.generate(request).await;
        let duration = start.elapsed();
        
        assert!(result.is_ok());
        let output = result.unwrap();
        
        // Verificar que cumple con el objetivo de <50ms
        assert!(duration.as_millis() < 50, "Generation took {}ms, expected <50ms", duration.as_millis());
        
        // Verificar que se detectó como Medium
        assert_eq!(output.metadata.complexity_level, ComplexityLevel::Medium);
        assert!(output.metadata.features_used.contains(&"custom_eyes".to_string()));
        assert!(output.metadata.features_used.contains(&"custom_pattern".to_string()));
    }

    #[test]
    fn test_complexity_routing() {
        let router = ComplexityRouter::new();
        
        // Test básico
        let basic_request = QrRequest {
            data: "test".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: None,
        };
        assert_eq!(router.determine_complexity(&basic_request), ComplexityLevel::Basic);
        
        // Test con logo (debe ser Advanced)
        let advanced_request = QrRequest {
            data: "test".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: None,
                eye_border_style: None,
                eye_center_style: None,
                data_pattern: None,
                colors: None,
                gradient: None,
                logo: Some(LogoOptions {
                    data: "base64...".to_string(),
                    size_percentage: 20.0,
                    padding: 5,
                    background: None,
                    shape: LogoShape::Circle,
                }),
                frame: None,
                effects: None,
                error_correction: None,
                logo_size_ratio: None,
                selective_effects: None,
            }),
        };
        assert_eq!(router.determine_complexity(&advanced_request), ComplexityLevel::Advanced);
    }

    #[test]
    fn test_error_correction_selection() {
        let generator = QrGenerator::new();
        
        // URL debe usar High
        let url_result = generator.generate_basic("https://example.com", 400);
        assert!(url_result.is_ok());
        
        // Texto largo debe usar Low
        let long_text = "a".repeat(150);
        let long_result = generator.generate_basic(&long_text, 400);
        assert!(long_result.is_ok());
        
        // Texto normal debe usar Medium
        let normal_result = generator.generate_basic("Hello World", 400);
        assert!(normal_result.is_ok());
    }

    #[test]
    fn test_size_validation() {
        let generator = QrGenerator::new();
        
        // Tamaño muy pequeño
        let small_result = generator.generate_basic("test", 50);
        assert!(small_result.is_err());
        if let Err(e) = small_result {
            assert_eq!(e.status_code(), 400);
        }
        
        // Tamaño muy grande
        let large_result = generator.generate_basic("test", 5000);
        assert!(large_result.is_err());
        
        // Tamaño válido
        let valid_result = generator.generate_basic("test", 400);
        assert!(valid_result.is_ok());
    }

    #[test]
    fn test_data_validation() {
        let generator = QrGenerator::new();
        
        // Datos vacíos
        let empty_result = generator.generate_basic("", 400);
        assert!(empty_result.is_err());
        
        // Datos muy largos
        let long_data = "a".repeat(3000);
        let long_result = generator.generate_basic(&long_data, 400);
        assert!(long_result.is_err());
        if let Err(e) = long_result {
            assert!(e.suggestion().is_some());
        }
    }

    #[test]
    fn test_segmentation_numeric_optimization() {
        let generator = QrGenerator::new();
        
        // Datos puramente numéricos
        let numeric_data = "123456789012345";
        
        // Generar con segmentación (por defecto)
        let with_seg_result = generator.generate_basic(numeric_data, 400);
        assert!(with_seg_result.is_ok());
        let with_seg_qr = with_seg_result.unwrap();
        
        // Generar sin segmentación
        let without_seg_result = generator.generate_basic_with_options(numeric_data, 400, false);
        assert!(without_seg_result.is_ok());
        let without_seg_qr = without_seg_result.unwrap();
        
        // El QR con segmentación debería ser igual o más pequeño
        assert!(with_seg_qr.size <= without_seg_qr.size,
            "Segmented QR should be smaller or equal. Got {} vs {}", 
            with_seg_qr.size, without_seg_qr.size);
    }

    #[test]
    fn test_segmentation_mixed_content() {
        let generator = QrGenerator::new();
        
        // Datos mixtos que se benefician de segmentación
        let mixed_data = "CODEX2025PROJECT123456";
        
        // Generar con segmentación
        let result = generator.generate_basic(mixed_data, 400);
        assert!(result.is_ok());
        
        // Verificar que se generó correctamente
        let qr = result.unwrap();
        assert!(!qr.matrix.is_empty());
        assert_eq!(qr.quiet_zone, 4);
    }

    #[test]
    fn test_segmentation_url_optimization() {
        let generator = QrGenerator::new();
        
        // URLs con números que se benefician de segmentación
        let test_cases = vec![
            "https://instagram.com/user12345",
            "https://codex.com/product/9876543210",
            "tel:+1234567890",
            "WIFI:T:WPA;S:MyNetwork;P:12345678;;",
        ];
        
        for url in test_cases {
            let result = generator.generate_basic(url, 400);
            assert!(result.is_ok(), "Failed to generate QR for: {}", url);
        }
    }

    #[test]
    fn test_segmentation_with_different_ecl() {
        let generator = QrGenerator::new();
        
        // Probar segmentación con diferentes niveles de corrección
        let data = "ABC123XYZ456";
        let ecl_levels = vec![
            ErrorCorrectionLevel::Low,
            ErrorCorrectionLevel::Medium,
            ErrorCorrectionLevel::Quartile,
            ErrorCorrectionLevel::High,
        ];
        
        for ecl in ecl_levels {
            let result = generator.generate_with_ecl(data, 400, ecl);
            assert!(result.is_ok(), "Failed with ECL: {:?}", ecl);
        }
    }

    #[test]
    fn test_segmentation_edge_cases() {
        let generator = QrGenerator::new();
        
        // Casos límite para segmentación
        
        // Solo 1 carácter numérico
        let single_digit = generator.generate_basic("5", 400);
        assert!(single_digit.is_ok());
        
        // Alternancia rápida entre tipos
        let alternating = generator.generate_basic("A1B2C3D4E5", 400);
        assert!(alternating.is_ok());
        
        // Caracteres especiales que fuerzan modo byte
        let special_chars = generator.generate_basic("Hello 世界! 123", 400);
        assert!(special_chars.is_ok());
        
        // Máxima longitud para modo numérico
        let max_numeric = "9".repeat(100);
        let numeric_result = generator.generate_basic(&max_numeric, 400);
        assert!(numeric_result.is_ok());
    }

    #[test]
    fn test_segmentation_analyzer_savings() {
        use super::super::segmenter::ContentSegmenter;
        
        let segmenter = ContentSegmenter::new();
        
        // Casos de prueba con ahorros esperados
        let test_cases = vec![
            ("123456789", "mainly numeric"),
            ("HELLO123456", "mixed alphanumeric and numeric"),
            ("https://example.com/12345", "URL with numbers"),
            ("ABC-123-XYZ-456", "alternating segments"),
        ];
        
        for (data, description) in test_cases {
            let (without, with, savings) = segmenter.estimate_savings(data);
            println!("Data: {} ({})", data, description);
            println!("  Without segmentation: {} bits", without);
            println!("  With segmentation: {} bits", with);
            println!("  Savings: {:.1}%", savings);
            
            // La segmentación siempre debe ser igual o mejor
            assert!(with <= without, 
                "Segmentation made {} worse: {} bits vs {} bits", 
                description, with, without);
        }
    }

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
        let (qr, boost_info) = result.unwrap();
        
        // Verificar que se generó correctamente
        assert!(!qr.matrix.is_empty());
        
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
            let (qr, boost_info) = result.unwrap();
            
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
        let (qr_no_boost, analysis_no_boost) = result_no_boost.unwrap();
        
        // Con boost
        let result_boost = generator.generate_with_dynamic_ecl_and_boost(
            "https://codex.com",
            400,
            logo_size_ratio,
            None,
            true // con boost
        );
        
        assert!(result_boost.is_ok());
        let (qr_boost, analysis_boost) = result_boost.unwrap();
        
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