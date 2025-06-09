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
                data_pattern: Some(DataPattern::Dots),
                colors: Some(ColorOptions {
                    foreground: "#2563EB".to_string(),
                    background: "#FFFFFF".to_string(),
                }),
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: Some(ErrorCorrectionLevel::High),
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
}