pub mod memory;
pub mod redis;
pub mod distributed;

// Re-export types
pub use redis::{CachedQR, QRMetadata};

use crate::models::qr::QrOptions;
use sha2::{Sha256, Digest};
use std::fmt::Write;

pub fn generate_cache_key(data: &str, options: Option<&QrOptions>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    
    if let Some(opts) = options {
        // Include all relevant options in the hash
        hasher.update(&opts.size.to_le_bytes());
        hasher.update(&opts.margin.to_le_bytes());
        
        if let Some(ref ec) = opts.error_correction {
            hasher.update(ec.as_bytes());
        }
        if let Some(ref shape) = opts.eye_shape {
            hasher.update(shape.as_bytes());
        }
        if let Some(ref pattern) = opts.data_pattern {
            hasher.update(pattern.as_bytes());
        }
        if let Some(ref fg) = opts.foreground_color {
            hasher.update(fg.as_bytes());
        }
        if let Some(ref bg) = opts.background_color {
            hasher.update(bg.as_bytes());
        }
        if let Some(ref gradient) = opts.gradient {
            hasher.update(format!("{:?}", gradient).as_bytes());
        }
        if let Some(ref logo) = opts.logo {
            if let Some(size) = logo.size {
                hasher.update(&size.to_le_bytes());
            }
        }
        if let Some(ref frame) = opts.frame {
            hasher.update(format!("{:?}", frame).as_bytes());
        }
    }
    
    let result = hasher.finalize();
    let mut key = String::with_capacity(16);
    for byte in &result[..8] {
        write!(&mut key, "{:02x}", byte).unwrap();
    }
    
    key
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cache_key_generation() {
        let key1 = generate_cache_key("test", None);
        let key2 = generate_cache_key("test", None);
        assert_eq!(key1, key2);
        
        let key3 = generate_cache_key("different", None);
        assert_ne!(key1, key3);
    }
    
    #[test]
    fn test_cache_key_with_options() {
        let options1 = QrOptions {
            size: 300,
            margin: 4,
            error_correction: Some("M".to_string()),
            eye_shape: Some("circle".to_string()),
            ..Default::default()
        };
        
        let options2 = QrOptions {
            size: 300,
            margin: 4,
            error_correction: Some("M".to_string()),
            eye_shape: Some("square".to_string()),
            ..Default::default()
        };
        
        let key1 = generate_cache_key("test", Some(&options1));
        let key2 = generate_cache_key("test", Some(&options2));
        assert_ne!(key1, key2);
    }
}