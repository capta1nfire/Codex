// Test program to verify independent eye colors functionality
use rust_generator::engine::{QrEngine, QrRequest, types::{
    QrCustomization, OutputFormat, ColorOptions, EyeColors, EyeColorPair, 
    PerEyeColors, EyeShape
}};

#[tokio::main]
async fn main() {
    println!("🔍 Testing Independent Eye Colors\n");
    
    let engine = QrEngine::new();
    
    // Test 1: All eyes same color (Instagram style - purple eyes)
    println!("Test 1: Instagram style - Purple eyes (#833AB4)");
    let request1 = QrRequest {
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
    
    match engine.generate(request1).await {
        Ok(output) => {
            println!("✅ Generated successfully!");
            // Save to file for visual inspection
            std::fs::write("test_eye_colors_instagram.svg", &output.data).ok();
            println!("   Saved to: test_eye_colors_instagram.svg");
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 2: Different outer and inner colors
    println!("\nTest 2: Different outer and inner colors");
    let request2 = QrRequest {
        data: "https://example.com".to_string(),
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
                    outer: Some("#FF0066".to_string()), // Pink outer
                    inner: Some("#6600FF".to_string()), // Purple inner
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
            println!("✅ Generated successfully!");
            std::fs::write("test_eye_colors_different.svg", &output.data).ok();
            println!("   Saved to: test_eye_colors_different.svg");
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 3: Each eye different color
    println!("\nTest 3: Each eye different color (rainbow)");
    let request3 = QrRequest {
        data: "https://codex.com/rainbow".to_string(),
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
                    outer: None, // Will use per_eye colors
                    inner: None,
                    per_eye: Some(PerEyeColors {
                        top_left: Some(EyeColorPair {
                            outer: "#FF0000".to_string(), // Red
                            inner: "#FF6666".to_string(),
                        }),
                        top_right: Some(EyeColorPair {
                            outer: "#00FF00".to_string(), // Green
                            inner: "#66FF66".to_string(),
                        }),
                        bottom_left: Some(EyeColorPair {
                            outer: "#0000FF".to_string(), // Blue
                            inner: "#6666FF".to_string(),
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
    
    match engine.generate(request3).await {
        Ok(output) => {
            println!("✅ Generated successfully!");
            std::fs::write("test_eye_colors_rainbow.svg", &output.data).ok();
            println!("   Saved to: test_eye_colors_rainbow.svg");
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    // Test 4: Eye colors with gradient
    println!("\nTest 4: Eye colors with gradient data");
    let request4 = QrRequest {
        data: "https://example.com/gradient".to_string(),
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
                    outer: Some("#FF1493".to_string()), // Deep pink
                    inner: Some("#FF1493".to_string()),
                    per_eye: None,
                }),
            }),
            gradient: Some(rust_generator::engine::types::GradientOptions {
                enabled: true,
                gradient_type: rust_generator::engine::types::GradientType::Linear,
                colors: vec!["#667eea".to_string(), "#764ba2".to_string()],
                angle: Some(45.0),
                apply_to_eyes: false, // Eyes should use eye_colors instead
                apply_to_data: true,
                stroke_style: None,
            }),
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
            println!("✅ Generated successfully!");
            std::fs::write("test_eye_colors_with_gradient.svg", &output.data).ok();
            println!("   Saved to: test_eye_colors_with_gradient.svg");
        }
        Err(e) => println!("❌ Error: {:?}", e),
    }
    
    println!("\n✨ Eye colors tests completed!");
    println!("Check the generated SVG files to verify the eye colors are applied correctly.");
}