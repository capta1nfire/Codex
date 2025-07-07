// Test program to verify boost ECL functionality
use rust_generator::engine::generator::QrGenerator;
use rust_generator::engine::types::ErrorCorrectionLevel;

fn main() {
    println!("🔍 Testing Boost ECL Implementation\n");
    
    let generator = QrGenerator::new();
    
    // Test 1: Short data should get boosted
    println!("Test 1: Short data");
    let test_data = "HELLO WORLD";
    
    match generator.generate_with_boost_ecl(
        test_data, 
        400, 
        ErrorCorrectionLevel::Low
    ) {
        Ok((qr, boost_info)) => {
            println!("✅ Success!");
            println!("  Original ECL: {:?}", boost_info.original_ecl);
            println!("  Final ECL: {:?}", boost_info.final_ecl);
            println!("  Boost applied: {}", boost_info.boost_applied);
            println!("  Version: {}", boost_info.version);
            println!("  QR size: {}x{}", qr.size, qr.size);
            
            if boost_info.boost_applied {
                println!("  🚀 ECL was boosted!");
            }
        }
        Err(e) => {
            println!("❌ Error: {:?}", e);
        }
    }
    
    // Test 2: Different data sizes
    println!("\nTest 2: Different data sizes");
    let long_data = "A".repeat(100);
    let test_cases = vec![
        ("SHORT", "Very short data"),
        ("HELLO WORLD 12345", "Medium length"),
        ("https://example.com/product/12345?ref=test", "URL"),
        (long_data.as_str(), "Long data (100 chars)"),
    ];
    
    for (data, description) in test_cases {
        println!("\n  Testing: {} ({})", description, data.len());
        
        match generator.generate_with_boost_ecl(
            data,
            400,
            ErrorCorrectionLevel::Low
        ) {
            Ok((_qr, boost_info)) => {
                println!("    Version: {}", boost_info.version);
                println!("    Boost applied: {}", boost_info.boost_applied);
                
                if boost_info.boost_applied {
                    println!("    ECL: {:?} → {:?}", 
                        boost_info.original_ecl, 
                        boost_info.final_ecl
                    );
                }
            }
            Err(e) => {
                println!("    Error: {:?}", e);
            }
        }
    }
    
    // Test 3: Dynamic ECL with boost
    println!("\nTest 3: Dynamic ECL with boost (30% logo)");
    let logo_size_ratio = 0.3;
    
    // Without boost
    match generator.generate_with_dynamic_ecl_and_boost(
        "https://codex.com",
        400,
        logo_size_ratio,
        None,
        false // no boost
    ) {
        Ok((_qr, analysis)) => {
            println!("  Without boost:");
            println!("    Recommended ECL: {:?}", analysis.recommended_ecl);
            println!("    QR Version: {}", analysis.qr_version);
        }
        Err(e) => {
            println!("  Error (no boost): {:?}", e);
        }
    }
    
    // With boost
    match generator.generate_with_dynamic_ecl_and_boost(
        "https://codex.com",
        400,
        logo_size_ratio,
        None,
        true // boost!
    ) {
        Ok((_qr, analysis)) => {
            println!("  With boost:");
            println!("    Recommended ECL: {:?}", analysis.recommended_ecl);
            println!("    QR Version: {}", analysis.qr_version);
            println!("    ✅ Boost ECL feature is working!");
        }
        Err(e) => {
            println!("  Error (with boost): {:?}", e);
        }
    }
    
    println!("\n✨ Boost ECL tests completed!");
}