use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrGenerateRequest {
    pub data: String,
    pub options: Option<QrOptions>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct QrOptions {
    // Size and quality
    pub size: u32,
    pub margin: u32,
    pub error_correction: Option<String>,
    
    // Basic customization
    pub eye_shape: Option<String>,
    pub data_pattern: Option<String>,
    
    // Colors
    pub foreground_color: Option<String>,
    pub background_color: Option<String>,
    pub eye_color: Option<String>,
    
    // Advanced features
    pub gradient: Option<GradientOptions>,
    pub logo: Option<LogoOptions>,
    pub frame: Option<FrameOptions>,
    pub effects: Option<Vec<EffectOptions>>,
    
    // Performance options
    pub optimize_for_size: Option<bool>,
    pub enable_cache: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct GradientOptions {
    #[serde(rename = "type")]
    pub gradient_type: String,
    pub colors: Vec<String>,
    pub angle: Option<i32>, // Changed to i32 for Hash
    pub center_x: Option<i32>, // Changed to i32 for Hash
    pub center_y: Option<i32>, // Changed to i32 for Hash
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct LogoOptions {
    pub data: String, // Base64
    pub size: Option<i32>, // Changed to i32 for Hash
    pub padding: Option<u32>,
    pub background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct FrameOptions {
    pub style: String,
    pub color: Option<String>,
    pub width: Option<u32>,
    pub text: Option<String>,
    pub text_position: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct EffectOptions {
    #[serde(rename = "type")]
    pub effect_type: String,
    pub intensity: Option<i32>, // Changed to i32 for Hash
    pub color: Option<String>,
}

impl Default for QrOptions {
    fn default() -> Self {
        Self {
            size: 300,
            margin: 4,
            error_correction: Some("M".to_string()),
            eye_shape: None,
            data_pattern: None,
            foreground_color: None,
            background_color: None,
            eye_color: None,
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            optimize_for_size: None,
            enable_cache: Some(true),
        }
    }
}