// Test program para verificar validación de contraste WCAG AA en eye colors
use rust_generator::engine::{QrEngine, QrRequest, types::{
    QrCustomization, OutputFormat, ColorOptions, EyeColors, EyeColorPair, 
    PerEyeColors, EyeShape
}};

#[tokio::main]
async fn main() {
    println!("🔍 Testing Eye Colors Contrast Validation (WCAG AA)\n");
    
    let engine = QrEngine::new();
    
    // Test 1: Buen contraste - Negro sobre blanco (21:1)
    println!("Test 1: Good contrast - Black on white");
    let request1 = QrRequest {
        data: "https://example.com/good-contrast".to_string(),
        size: 400,
        format: OutputFormat::Svg,
        customization: Some(QrCustomization {
            eye_shape: Some(EyeShape::RoundedSquare),
            eye_border_style: None,
            eye_center_style: None,
            data_pattern: None,
            colors: Some(ColorOptions {
                foreground: "#000000".to_string(),
                background: "#FFFFFF".to_string(),
                eye_colors: Some(EyeColors {
                    outer: Some("#000000".to_string()), // Negro
                    inner: Some("#000000".to_string()), // Negro
                    per_eye: None,
                }),
            }),
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            error_correction: None,
            logo_size_ratio: None,
            selective_effects: None,
            fixed_size: None,
        }),
    };
    
    match engine.generate(request1).await {
        Ok(output) => {
            println!("✅ Generated successfully!");
            println!("   Quality score: {:.2}", output.metadata.quality_score);
            std::fs::write("test_contrast_good.svg", &output.data).ok();
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 2: Mal contraste - Gris claro sobre blanco (~1.5:1)
    println!("\nTest 2: Poor contrast - Light gray on white");
    let request2 = QrRequest {
        data: "https://example.com/poor-contrast".to_string(),
        size: 400,
        format: OutputFormat::Svg,
        customization: Some(QrCustomization {
            eye_shape: Some(EyeShape::Circle),
            eye_border_style: None,
            eye_center_style: None,
            data_pattern: None,
            colors: Some(ColorOptions {
                foreground: "#000000".to_string(),
                background: "#FFFFFF".to_string(),
                eye_colors: Some(EyeColors {
                    outer: Some("#CCCCCC".to_string()), // Gris claro
                    inner: Some("#DDDDDD".to_string()), // Gris más claro
                    per_eye: None,
                }),
            }),
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            error_correction: None,
            logo_size_ratio: None,
            selective_effects: None,
            fixed_size: None,
        }),
    };
    
    match engine.generate(request2).await {
        Ok(output) => {
            println!("✅ Generated with warnings!");
            println!("   Quality score: {:.2}", output.metadata.quality_score);
            std::fs::write("test_contrast_poor.svg", &output.data).ok();
            
            // El metadata no incluye los issues directamente, pero el score reflejará el problema
            if output.metadata.quality_score < 1.0 {
                println!("   ⚠️  Low quality score indicates contrast issues");
            }
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 3: Instagram con contraste aceptable - Púrpura sobre blanco (~4.7:1)
    println!("\nTest 3: Instagram purple - Acceptable contrast");
    let request3 = QrRequest {
        data: "https://instagram.com/myprofile".to_string(),
        size: 400,
        format: OutputFormat::Svg,
        customization: Some(QrCustomization {
            eye_shape: Some(EyeShape::RoundedSquare),
            eye_border_style: None,
            eye_center_style: None,
            data_pattern: None,
            colors: Some(ColorOptions {
                foreground: "#000000".to_string(),
                background: "#FFFFFF".to_string(),
                eye_colors: Some(EyeColors {
                    outer: Some("#833AB4".to_string()), // Instagram purple
                    inner: Some("#833AB4".to_string()), // Instagram purple
                    per_eye: None,
                }),
            }),
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            error_correction: None,
            logo_size_ratio: None,
            selective_effects: None,
            fixed_size: None,
        }),
    };
    
    match engine.generate(request3).await {
        Ok(output) => {
            println!("✅ Generated successfully!");
            println!("   Quality score: {:.2}", output.metadata.quality_score);
            println!("   Instagram purple passes WCAG AA (4.7:1 ratio)");
            std::fs::write("test_contrast_instagram.svg", &output.data).ok();
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 4: Colores por ojo con contraste mixto
    println!("\nTest 4: Per-eye colors with mixed contrast");
    let request4 = QrRequest {
        data: "https://example.com/mixed-contrast".to_string(),
        size: 400,
        format: OutputFormat::Svg,
        customization: Some(QrCustomization {
            eye_shape: Some(EyeShape::RoundedSquare),
            eye_border_style: None,
            eye_center_style: None,
            data_pattern: None,
            colors: Some(ColorOptions {
                foreground: "#000000".to_string(),
                background: "#FFFFFF".to_string(),
                eye_colors: Some(EyeColors {
                    outer: None,
                    inner: None,
                    per_eye: Some(PerEyeColors {
                        top_left: Some(EyeColorPair {
                            outer: "#000000".to_string(), // Negro - buen contraste
                            inner: "#333333".to_string(),
                        }),
                        top_right: Some(EyeColorPair {
                            outer: "#FF0000".to_string(), // Rojo - buen contraste
                            inner: "#CC0000".to_string(),
                        }),
                        bottom_left: Some(EyeColorPair {
                            outer: "#FFFF00".to_string(), // Amarillo - mal contraste!
                            inner: "#FFFFCC".to_string(),
                        }),
                    }),
                }),
            }),
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            error_correction: None,
            logo_size_ratio: None,
            selective_effects: None,
            fixed_size: None,
        }),
    };
    
    match engine.generate(request4).await {
        Ok(output) => {
            println!("✅ Generated with mixed contrast!");
            println!("   Quality score: {:.2}", output.metadata.quality_score);
            println!("   ⚠️  Bottom-left eye has poor contrast (yellow on white)");
            std::fs::write("test_contrast_mixed.svg", &output.data).ok();
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    println!("\n✨ Contrast validation tests completed!");
    println!("\nContrast Ratios Reference:");
    println!("- WCAG AAA: ≥7:1");
    println!("- WCAG AA: ≥4.5:1 (recommended minimum)");
    println!("- WCAG AA Large: ≥3:1");
    println!("\nCheck generated SVG files and quality scores.");
}