// Test program to understand QR version sizes
use qrcodegen::{QrCode, QrCodeEcc, Version};

fn main() {
    println!("🔍 QR Code Version Size Reference\n");
    
    // Test different versions
    let test_versions = vec![
        (1, "Smallest - Version 1"),
        (5, "Small - Version 5"),
        (10, "Medium - Version 10"),
        (15, "Large - Version 15"),
        (20, "Very Large - Version 20"),
        (25, "Extra Large - Version 25"),
        (40, "Maximum - Version 40"),
    ];
    
    println!("Version | Size (modules) | Data Capacity (bytes, ECL-L)");
    println!("--------|----------------|-----------------------------");
    
    for (version_num, description) in test_versions {
        let version = Version::new(version_num);
        let size = version_num * 4 + 17; // Formula: (version - 1) * 4 + 21
        
        // Approximate data capacity for ECL Low in byte mode
        let capacity = match version_num {
            1 => 17,
            5 => 106,
            10 => 271,
            15 => 468,
            20 => 718,
            25 => 1046,
            40 => 2953,
            _ => 0,
        };
        
        println!("{:7} | {:14} | {:4} - {}", 
            version_num, 
            format!("{}x{}", size, size),
            capacity,
            description
        );
    }
    
    println!("\n📊 Size Categories for UI:");
    println!("- Small (S): Version 1-5 (21x21 to 37x37)");
    println!("- Medium (M): Version 6-15 (41x41 to 77x77)");
    println!("- Large (L): Version 16-25 (81x81 to 117x117)");
    println!("- Extra Large (XL): Version 26-40 (121x121 to 177x177)");
    
    // Test with real data
    println!("\n🧪 Testing with sample data:");
    let test_data = "https://codex.com";
    
    for ecl in [QrCodeEcc::Low, QrCodeEcc::Medium, QrCodeEcc::Quartile, QrCodeEcc::High] {
        match QrCode::encode_text(test_data, ecl) {
            Ok(qr) => {
                println!("  ECL {:?}: Version {} ({}x{})", 
                    ecl, 
                    qr.version().value(),
                    qr.size(),
                    qr.size()
                );
            }
            Err(e) => println!("  ECL {:?}: Error - {:?}", ecl, e),
        }
    }
}