// Test program to verify fixed size QR functionality
use rust_generator::engine::{QrEngine, QrRequest, types::{QrCustomization, QrSize, OutputFormat}};

#[tokio::main]
async fn main() {
    println!("🔍 Testing Fixed Size QR Generation\n");
    
    let engine = QrEngine::new();
    
    // Test data of varying lengths
    let test_cases = vec![
        ("SHORT", "Short test data"),
        ("MEDIUM", "This is a medium length test string for QR code generation"),
        ("LONG", "This is a very long test string that contains enough data to require a larger QR code version to properly encode all the information without loss"),
        ("URL", "https://example.com/very/long/path/with/many/segments/that/requires/more/space"),
    ];
    
    // Test each size category
    let sizes = vec![
        QrSize::Small,
        QrSize::Medium,
        QrSize::Large,
        QrSize::Auto,
    ];
    
    for size in sizes {
        println!("\n📏 Testing QR Size: {:?}", size);
        println!("Version range: {:?}", size.version_range());
        if let Some(target) = size.target_version() {
            println!("Target version: {}", target);
        }
        println!("\n");
        
        for (label, data) in &test_cases {
            print!("  {} ({} chars): ", label, data.len());
            
            let request = QrRequest {
                data: data.to_string(),
                size: 400,
                format: OutputFormat::Svg,
                customization: Some(QrCustomization {
                    eye_shape: None,
                    eye_border_style: None,
                    eye_center_style: None,
                    data_pattern: None,
                    colors: None,
                    gradient: None,
                    logo: None,
                    frame: None,
                    effects: None,
                    error_correction: None,
                    logo_size_ratio: None,
                    selective_effects: None,
                    fixed_size: Some(size),
                }),
            };
            
            match engine.generate(request).await {
                Ok(output) => {
                    // Extract version from features_used
                    let fixed_size_feature = output.metadata.features_used
                        .iter()
                        .find(|f| f.starts_with("fixed_size_"))
                        .map(|f| f.clone())
                        .unwrap_or_default();
                    
                    println!("✅ Generated successfully - {}", fixed_size_feature);
                }
                Err(e) => {
                    println!("❌ Error: {}", e);
                }
            }
        }
    }
    
    // Test batch uniformity
    println!("\n\n🎯 Testing Batch Uniformity with Medium size:");
    let batch_data = vec![
        "Item 1",
        "Product SKU 12345",
        "https://example.com/product/12345",
        "Contact: John Doe, Email: john@example.com, Phone: +1234567890",
    ];
    
    let mut versions = Vec::new();
    
    for (i, data) in batch_data.iter().enumerate() {
        let request = QrRequest {
            data: data.to_string(),
            size: 400,
            format: OutputFormat::Svg,
            customization: Some(QrCustomization {
                eye_shape: None,
                eye_border_style: None,
                eye_center_style: None,
                data_pattern: None,
                colors: None,
                gradient: None,
                logo: None,
                frame: None,
                effects: None,
                error_correction: None,
                logo_size_ratio: None,
                selective_effects: None,
                fixed_size: Some(QrSize::Medium),
            }),
        };
        
        match engine.generate(request).await {
            Ok(output) => {
                // Extract QR size from SVG (look for viewBox)
                if let Some(viewbox_start) = output.data.find("viewBox=\"") {
                    let viewbox_end = output.data[viewbox_start+9..].find("\"").unwrap_or(0);
                    let viewbox = &output.data[viewbox_start+9..viewbox_start+9+viewbox_end];
                    let parts: Vec<&str> = viewbox.split(' ').collect();
                    if parts.len() >= 4 {
                        let size = parts[2].parse::<i32>().unwrap_or(0);
                        let version = (size - 4) / 4 - 4; // Reverse calculate version from size
                        versions.push(version);
                        println!("  Item {}: {} chars → Version {} ({}x{} modules)", 
                            i+1, data.len(), version, size-8, size-8);
                    }
                }
            }
            Err(e) => {
                println!("  Item {}: Error - {}", i+1, e);
            }
        }
    }
    
    if versions.len() > 1 {
        let all_same = versions.windows(2).all(|w| w[0] == w[1]);
        if all_same {
            println!("\n✅ Batch uniformity achieved! All QR codes are version {}", versions[0]);
        } else {
            println!("\n⚠️  Versions vary: {:?}", versions);
        }
    }
    
    println!("\n✨ Fixed size QR tests completed!");
}