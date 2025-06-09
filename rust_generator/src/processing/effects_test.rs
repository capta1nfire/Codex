// processing/effects_test.rs - Test de integración completo para efectos visuales

#[cfg(test)]
mod integration_tests {
    use crate::processing::effects::*;
    use crate::engine::types::Effect;

    #[test]
    fn test_complete_effects_workflow() {
        let mut processor = EffectProcessor::new();
        let test_svg = r##"<svg viewBox="0 0 100 100"><g fill="#000000"><rect x="0" y="0" width="10" height="10"/></g></svg>"##;

        // Test 1: Aplicar cada efecto individualmente
        let effects_to_test = vec![
            Effect::Shadow,
            Effect::Glow,
            Effect::Blur,
            Effect::Noise,
            Effect::Vintage,
        ];

        for effect in &effects_to_test {
            let result = processor.apply_effects(test_svg, &[*effect]);
            assert!(result.is_ok(), "Failed to apply effect: {:?}", effect);
            let svg = result.unwrap();
            assert!(svg.contains("<filter"), "SVG should contain filter definition");
            assert!(svg.contains("filter="), "SVG should apply filter");
        }

        // Test 2: Combinar efectos válidos
        let valid_combo = vec![Effect::Shadow, Effect::Glow];
        let result = processor.apply_effects(test_svg, &valid_combo);
        assert!(result.is_ok());
        
        // Test 3: Validar combinaciones
        let invalid_combo = vec![Effect::Blur, Effect::Noise];
        assert!(processor.validate_effect_combination(&invalid_combo).is_err());

        // Test 4: Optimización para escaneabilidad
        let mut effects_to_optimize = vec![
            (Effect::Shadow, EffectConfig::Shadow(ShadowConfig {
                blur_radius: 20.0,
                opacity: 1.0,
                ..Default::default()
            })),
            (Effect::Blur, EffectConfig::Blur(BlurConfig {
                radius: 10.0,
            })),
        ];

        processor.optimize_for_scanability(&mut effects_to_optimize);
        
        // Verificar que los valores se optimizaron
        match &effects_to_optimize[0].1 {
            EffectConfig::Shadow(cfg) => {
                assert!(cfg.blur_radius <= 3.0);
                assert!(cfg.opacity <= 0.5);
            },
            _ => panic!("Expected Shadow config"),
        }
    }

    #[test]
    fn test_svg_structure_preservation() {
        let mut processor = EffectProcessor::new();
        let original_svg = r##"<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#FFFFFF"/><g fill="#000000"><rect x="10" y="10" width="10" height="10"/></g></svg>"##;
        
        let result = processor.apply_shadow(&original_svg, None).unwrap();
        
        // Verificar que el SVG original se preserve
        assert!(result.contains("viewBox=\"0 0 100 100\""));
        assert!(result.contains("xmlns=\"http://www.w3.org/2000/svg\""));
        assert!(result.contains("rect x=\"10\" y=\"10\""));
        
        // Verificar que se agregaron los filtros
        assert!(result.contains("<defs>"));
        assert!(result.contains("<filter"));
        assert!(result.contains("filter=\"url("));
    }

    #[test]
    fn test_custom_configurations() {
        let processor = EffectProcessor::new();
        
        // Test configuración personalizada de sombra
        let shadow_config = ShadowConfig {
            offset_x: 5.0,
            offset_y: 5.0,
            blur_radius: 8.0,
            color: "#FF0000".to_string(),
            opacity: 0.6,
        };
        
        let filter = processor.create_shadow_filter("test", Some(shadow_config)).unwrap();
        assert!(filter.contains("dx=\"5.00\""));
        assert!(filter.contains("dy=\"5.00\""));
        assert!(filter.contains("stdDeviation=\"8.00\""));
        assert!(filter.contains("rgb(255,0,0)"));
        assert!(filter.contains("flood-opacity=\"0.60\""));
    }

    #[test]
    fn test_error_handling() {
        let processor = EffectProcessor::new();
        
        // Test valores inválidos
        let invalid_shadow = ShadowConfig {
            blur_radius: -5.0,
            ..Default::default()
        };
        assert!(processor.create_shadow_filter("test", Some(invalid_shadow)).is_err());
        
        let invalid_opacity = ShadowConfig {
            opacity: 1.5,
            ..Default::default()
        };
        assert!(processor.create_shadow_filter("test", Some(invalid_opacity)).is_err());
        
        let invalid_noise = NoiseConfig {
            intensity: -0.5,
        };
        assert!(processor.create_noise_filter("test", Some(invalid_noise)).is_err());
    }

    #[test]
    fn test_filter_id_uniqueness() {
        let mut processor = EffectProcessor::new();
        let svg = r##"<svg><g fill="#000000"></g></svg>"##;
        
        // Aplicar múltiples efectos y verificar IDs únicos
        let result1 = processor.apply_shadow(&svg, None).unwrap();
        let result2 = processor.apply_shadow(&svg, None).unwrap();
        
        // Extraer IDs de filtro
        let extract_id = |s: &str| -> Option<String> {
            s.find("id=\"qr-effect-")
                .and_then(|pos| {
                    let start = pos + 4;
                    s[start..].find("\"").map(|end| s[start..start+end].to_string())
                })
        };
        
        let id1 = extract_id(&result1);
        let id2 = extract_id(&result2);
        
        assert!(id1.is_some());
        assert!(id2.is_some());
        assert_ne!(id1, id2, "Filter IDs should be unique");
    }

    #[test]
    fn test_composite_filter_generation() {
        let mut processor = EffectProcessor::new();
        
        let effects = vec![
            (Effect::Shadow, EffectConfig::Shadow(ShadowConfig::default())),
            (Effect::Glow, EffectConfig::Glow(GlowConfig {
                intensity: 5.0,
                color: "#00FF00".to_string(),
            })),
            (Effect::Vintage, EffectConfig::Vintage(VintageConfig::default())),
        ];
        
        let composite = processor.create_composite_filter(&effects).unwrap();
        
        // Verificar que contiene elementos de todos los efectos
        assert!(composite.contains("feGaussianBlur")); // Shadow
        assert!(composite.contains("feMorphology"));   // Glow
        assert!(composite.contains("feColorMatrix"));  // Vintage
        assert!(composite.contains("effect0"));
        assert!(composite.contains("effect1"));
        assert!(composite.contains("effect2"));
    }
}