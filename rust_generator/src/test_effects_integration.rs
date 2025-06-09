// Test module to verify effects integration
#[cfg(test)]
mod tests {
    use crate::engine::types::*;
    use crate::engine::QrEngine;
    
    #[tokio::test]
    async fn test_qr_with_shadow_effect() {
        let engine = QrEngine::new();
        
        let request = QrRequest {
            data: "https://example.com".to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: None,
                data_pattern: None,
                colors: None,
                gradient: None,
                logo: None,
                frame: None,
                effects: Some(vec![
                    EffectOptions {
                        effect_type: Effect::Shadow,
                        config: EffectConfiguration::Shadow {
                            offset_x: Some(3.0),
                            offset_y: Some(3.0),
                            blur_radius: Some(5.0),
                            color: Some("#000000".to_string()),
                            opacity: Some(0.4),
                        },
                    },
                ]),
                error_correction: None,
            }),
        };
        
        let result = engine.generate(request).await;
        assert!(result.is_ok());
        
        let output = result.unwrap();
        
        // Debug: print the SVG to see what's generated
        println!("Generated SVG:\n{}", output.data);
        println!("Features used: {:?}", output.metadata.features_used);
        println!("Complexity level: {:?}", output.metadata.complexity_level);
        
        assert!(output.data.contains("filter"));
        assert!(output.data.contains("feGaussianBlur"));
        assert!(output.data.contains("feOffset"));
        assert!(output.metadata.features_used.contains(&"visual_effects".to_string()));
        assert!(output.metadata.features_used.contains(&"effect_shadow".to_string()));
    }
    
    #[tokio::test]
    async fn test_qr_with_multiple_effects() {
        let engine = QrEngine::new();
        
        let request = QrRequest {
            data: "Test QR with effects".to_string(),
            size: 500,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: Some(EyeShape::Circle),
                data_pattern: Some(DataPattern::Dots),
                colors: Some(ColorOptions {
                    foreground: "#2563eb".to_string(),
                    background: "#ffffff".to_string(),
                }),
                gradient: None,
                logo: None,
                frame: None,
                effects: Some(vec![
                    EffectOptions {
                        effect_type: Effect::Glow,
                        config: EffectConfiguration::Glow {
                            intensity: Some(4.0),
                            color: Some("#60a5fa".to_string()),
                        },
                    },
                    EffectOptions {
                        effect_type: Effect::Shadow,
                        config: EffectConfiguration::Shadow {
                            offset_x: Some(2.0),
                            offset_y: Some(2.0),
                            blur_radius: Some(3.0),
                            color: Some("#1e40af".to_string()),
                            opacity: Some(0.3),
                        },
                    },
                ]),
                error_correction: Some(ErrorCorrectionLevel::High),
            }),
        };
        
        let result = engine.generate(request).await;
        assert!(result.is_ok());
        
        let output = result.unwrap();
        assert!(output.data.contains("<defs>"));
        assert!(output.data.contains("qr-effect-glow"));
        assert!(output.data.contains("qr-effect-shadow"));
        assert!(output.data.contains("feMorphology")); // From glow effect
        assert!(output.data.contains("feOffset")); // From shadow effect
        assert_eq!(output.metadata.complexity_level, ComplexityLevel::Advanced);
    }
    
    #[tokio::test]
    async fn test_effect_configuration_mapping() {
        use crate::engine::customizer::QrCustomizer;
        use crate::processing::effects::EffectConfig;
        
        let customizer = QrCustomizer::new();
        
        // Test shadow config with defaults
        let shadow_config = EffectConfiguration::Shadow {
            offset_x: None,
            offset_y: None,
            blur_radius: None,
            color: None,
            opacity: None,
        };
        
        let mapped = customizer.map_effect_config(&shadow_config).unwrap();
        match mapped {
            EffectConfig::Shadow(cfg) => {
                assert_eq!(cfg.offset_x, 2.0);
                assert_eq!(cfg.offset_y, 2.0);
                assert_eq!(cfg.blur_radius, 3.0);
                assert_eq!(cfg.color, "#000000");
                assert_eq!(cfg.opacity, 0.3);
            },
            _ => panic!("Expected Shadow config"),
        }
    }
}