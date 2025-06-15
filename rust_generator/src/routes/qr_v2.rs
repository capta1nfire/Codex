use axum::{
    extract::{Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tracing::{info, error};
use std::time::Instant;

use crate::engine::QR_ENGINE;
use crate::engine::types::{QrRequest as EngineQrRequest, OutputFormat, QrCustomization};

#[derive(Debug, Serialize, Deserialize)]
pub struct QrGenerateRequest {
    pub data: String,
    pub options: Option<QrOptions>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QrOptions {
    // Size and quality
    pub size: Option<u32>,
    pub margin: Option<u32>,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GradientOptions {
    #[serde(rename = "type")]
    pub gradient_type: String,
    pub colors: Vec<String>,
    pub angle: Option<f32>,
    pub center_x: Option<f32>,
    pub center_y: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogoOptions {
    pub data: String, // Base64
    pub size: Option<f32>,
    pub padding: Option<u32>,
    pub background_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FrameOptions {
    pub style: String,
    pub color: Option<String>,
    pub width: Option<u32>,
    pub text: Option<String>,
    pub text_position: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EffectOptions {
    #[serde(rename = "type")]
    pub effect_type: String,
    pub intensity: Option<f32>,
    pub color: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct QrGenerateResponse {
    pub svg: String,
    pub metadata: QrMetadata,
    pub cached: bool,
}

#[derive(Debug, Serialize)]
pub struct QrMetadata {
    pub version: u32,
    pub modules: u32,
    pub error_correction: String,
    pub data_capacity: usize,
    pub processing_time_ms: u64,
}

pub async fn generate_handler(Json(request): Json<QrGenerateRequest>) -> impl IntoResponse {
    let start = Instant::now();
    
    info!("QR v2 generation request: data_len={}", request.data.len());
    
    // Convert to engine request format
    let customization = if let Some(options) = &request.options {
        // Debug log para verificar gradiente
        if let Some(ref gradient) = options.gradient {
            info!("Gradient received: type={}, colors={:?}", gradient.gradient_type, gradient.colors);
        }
        
        Some(QrCustomization {
            eye_shape: options.eye_shape.as_ref().and_then(|s| {
                // Convert string to EyeShape enum
                match s.as_str() {
                    "square" => Some(crate::engine::types::EyeShape::Square),
                    "rounded-square" => Some(crate::engine::types::EyeShape::RoundedSquare),
                    "circle" => Some(crate::engine::types::EyeShape::Circle),
                    "dot" => Some(crate::engine::types::EyeShape::Dot),
                    "leaf" => Some(crate::engine::types::EyeShape::Leaf),
                    "bars-horizontal" => Some(crate::engine::types::EyeShape::BarsHorizontal),
                    "bars-vertical" => Some(crate::engine::types::EyeShape::BarsVertical),
                    "star" => Some(crate::engine::types::EyeShape::Star),
                    "diamond" => Some(crate::engine::types::EyeShape::Diamond),
                    "cross" => Some(crate::engine::types::EyeShape::Cross),
                    "hexagon" => Some(crate::engine::types::EyeShape::Hexagon),
                    "heart" => Some(crate::engine::types::EyeShape::Heart),
                    "shield" => Some(crate::engine::types::EyeShape::Shield),
                    "crystal" => Some(crate::engine::types::EyeShape::Crystal),
                    "flower" => Some(crate::engine::types::EyeShape::Flower),
                    "arrow" => Some(crate::engine::types::EyeShape::Arrow),
                    _ => None
                }
            }),
            data_pattern: options.data_pattern.as_ref().and_then(|s| {
                // Convert string to DataPattern enum
                match s.as_str() {
                    "square" => Some(crate::engine::types::DataPattern::Square),
                    "dots" => Some(crate::engine::types::DataPattern::Dots),
                    "rounded" => Some(crate::engine::types::DataPattern::Rounded),
                    "vertical" => Some(crate::engine::types::DataPattern::Vertical),
                    "horizontal" => Some(crate::engine::types::DataPattern::Horizontal),
                    "diamond" => Some(crate::engine::types::DataPattern::Diamond),
                    "circular" => Some(crate::engine::types::DataPattern::Circular),
                    "star" => Some(crate::engine::types::DataPattern::Star),
                    "cross" => Some(crate::engine::types::DataPattern::Cross),
                    "random" => Some(crate::engine::types::DataPattern::Random),
                    "wave" => Some(crate::engine::types::DataPattern::Wave),
                    "mosaic" => Some(crate::engine::types::DataPattern::Mosaic),
                    _ => None
                }
            }),
            colors: {
                // When using gradients, use the first gradient color as foreground
                let foreground = if let Some(ref gradient) = options.gradient {
                    gradient.colors.first().cloned().unwrap_or_else(|| "#000000".to_string())
                } else {
                    options.foreground_color.clone().unwrap_or_else(|| "#000000".to_string())
                };
                
                let background = options.background_color.clone().unwrap_or_else(|| "#FFFFFF".to_string());
                
                Some(crate::engine::types::ColorOptions {
                    foreground,
                    background,
                })
            },
            gradient: options.gradient.as_ref().map(|g| {
                crate::engine::types::GradientOptions {
                    enabled: true,
                    gradient_type: match g.gradient_type.as_str() {
                        "linear" => crate::engine::types::GradientType::Linear,
                        "radial" => crate::engine::types::GradientType::Radial,
                        "conic" => crate::engine::types::GradientType::Conic,
                        "diamond" => crate::engine::types::GradientType::Diamond,
                        "spiral" => crate::engine::types::GradientType::Spiral,
                        _ => crate::engine::types::GradientType::Linear,
                    },
                    colors: g.colors.clone(),
                    angle: g.angle,
                    apply_to_eyes: false, // Could be derived from options
                    apply_to_data: true,  // Could be derived from options
                }
            }),
            logo: options.logo.as_ref().map(|l| {
                crate::engine::types::LogoOptions {
                    data: l.data.clone(),
                    size_percentage: l.size.unwrap_or(20.0),
                    padding: l.padding.unwrap_or(2),
                    background: l.background_color.clone(),
                    shape: match l.background_color.as_ref().map(|s| s.as_str()) {
                        Some("circle") => crate::engine::types::LogoShape::Circle,
                        Some("rounded-square") => crate::engine::types::LogoShape::RoundedSquare,
                        _ => crate::engine::types::LogoShape::Square,
                    },
                }
            }),
            frame: options.frame.as_ref().map(|f| {
                crate::engine::types::FrameOptions {
                    frame_type: match f.style.as_str() {
                        "simple" => crate::engine::types::FrameType::Simple,
                        "rounded" => crate::engine::types::FrameType::Rounded,
                        "bubble" => crate::engine::types::FrameType::Bubble,
                        "speech" => crate::engine::types::FrameType::Speech,
                        "badge" => crate::engine::types::FrameType::Badge,
                        _ => crate::engine::types::FrameType::Simple,
                    },
                    text: f.text.clone(),
                    color: f.color.clone().unwrap_or_else(|| "#000000".to_string()),
                    text_position: match f.text_position.as_ref().map(|s| s.as_str()) {
                        Some("top") => crate::engine::types::TextPosition::Top,
                        Some("bottom") => crate::engine::types::TextPosition::Bottom,
                        Some("left") => crate::engine::types::TextPosition::Left,
                        Some("right") => crate::engine::types::TextPosition::Right,
                        _ => crate::engine::types::TextPosition::Bottom,
                    },
                }
            }),
            effects: options.effects.as_ref().map(|effects_vec| {
                effects_vec.iter().filter_map(|e| {
                    let effect_type = match e.effect_type.as_str() {
                        "shadow" => crate::engine::types::Effect::Shadow,
                        "glow" => crate::engine::types::Effect::Glow,
                        "blur" => crate::engine::types::Effect::Blur,
                        "noise" => crate::engine::types::Effect::Noise,
                        "vintage" => crate::engine::types::Effect::Vintage,
                        _ => return None,
                    };
                    
                    let config = match e.effect_type.as_str() {
                        "shadow" => crate::engine::types::EffectConfiguration::Shadow {
                            offset_x: Some(2.0),
                            offset_y: Some(2.0),
                            blur_radius: e.intensity.map(|i| i as f64),
                            color: e.color.clone(),
                            opacity: Some(0.3),
                        },
                        "glow" => crate::engine::types::EffectConfiguration::Glow {
                            intensity: e.intensity.map(|i| i as f64),
                            color: e.color.clone(),
                        },
                        "blur" => crate::engine::types::EffectConfiguration::Blur {
                            radius: e.intensity.map(|i| i as f64),
                        },
                        "noise" => crate::engine::types::EffectConfiguration::Noise {
                            intensity: e.intensity.map(|i| i as f64),
                        },
                        "vintage" => crate::engine::types::EffectConfiguration::Vintage {
                            sepia_intensity: e.intensity.map(|i| i as f64),
                            vignette_intensity: Some(0.4),
                        },
                        _ => return None,
                    };
                    
                    Some(crate::engine::types::EffectOptions {
                        effect_type,
                        config,
                    })
                }).collect()
            }),
            error_correction: options.error_correction.as_ref().and_then(|ec| {
                match ec.as_str() {
                    "L" => Some(crate::engine::types::ErrorCorrectionLevel::Low),
                    "M" => Some(crate::engine::types::ErrorCorrectionLevel::Medium),
                    "Q" => Some(crate::engine::types::ErrorCorrectionLevel::Quartile),
                    "H" => Some(crate::engine::types::ErrorCorrectionLevel::High),
                    _ => None
                }
            }),
        })
    } else {
        None
    };

    let engine_request = EngineQrRequest {
        data: request.data.clone(),
        size: request.options.as_ref().and_then(|o| o.size).unwrap_or(300),
        format: OutputFormat::Svg, // Default to SVG
        customization: customization.clone(),
    };
    
    // Use the global QR engine
    match QR_ENGINE.generate(engine_request).await {
        Ok(output) => {
            let _processing_time = start.elapsed().as_millis() as u64;
            
            let response = QrGenerateResponse {
                svg: output.data,  // output.data contains the SVG string
                metadata: QrMetadata {
                    version: 4,  // Default version, could be calculated based on data size
                    modules: 29, // Default for version 4
                    error_correction: customization.as_ref()
                        .and_then(|c| c.error_correction.as_ref())
                        .map(|ec| match ec {
                            crate::engine::types::ErrorCorrectionLevel::Low => "L",
                            crate::engine::types::ErrorCorrectionLevel::Medium => "M",
                            crate::engine::types::ErrorCorrectionLevel::Quartile => "Q",
                            crate::engine::types::ErrorCorrectionLevel::High => "H",
                        })
                        .unwrap_or("M")
                        .to_string(),
                    data_capacity: request.data.len(),
                    processing_time_ms: output.metadata.generation_time_ms,
                },
                cached: false, // Engine doesn't provide this field, default to false
            };
            
            (StatusCode::OK, Json(response))
        }
        Err(e) => {
            error!("QR generation failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(QrGenerateResponse {
                    svg: String::new(),
                    metadata: QrMetadata {
                        version: 0,
                        modules: 0,
                        error_correction: "M".to_string(),
                        data_capacity: 0,
                        processing_time_ms: 0,
                    },
                    cached: false,
                })
            )
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QrBatchRequest {
    pub codes: Vec<QrGenerateRequest>,
    pub options: Option<BatchOptions>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchOptions {
    pub max_concurrent: Option<usize>,
    pub include_metadata: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct QrBatchResponse {
    pub success: bool,
    pub results: Vec<BatchResult>,
    pub summary: BatchSummary,
}

#[derive(Debug, Serialize)]
pub struct BatchResult {
    pub id: Option<String>,
    pub success: bool,
    pub svg: Option<String>,
    pub error: Option<String>,
    pub metadata: Option<QrMetadata>,
}

#[derive(Debug, Serialize)]
pub struct BatchSummary {
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
    pub total_time_ms: u64,
    pub average_time_ms: f64,
}

pub async fn batch_handler(Json(request): Json<QrBatchRequest>) -> impl IntoResponse {
    // TODO: Implement batch processing with QR Engine v2
    let response = QrBatchResponse {
        success: false,
        results: vec![],
        summary: BatchSummary {
            total: request.codes.len(),
            successful: 0,
            failed: request.codes.len(),
            total_time_ms: 0,
            average_time_ms: 0.0,
        },
    };
    
    (StatusCode::NOT_IMPLEMENTED, Json(response))
}

#[derive(Debug, Deserialize)]
pub struct QrPreviewQuery {
    pub data: String,
    pub eye_shape: Option<String>,
    pub data_pattern: Option<String>,
    pub fg_color: Option<String>,
    pub bg_color: Option<String>,
    pub size: Option<u32>,
}

pub async fn preview_handler(Query(params): Query<QrPreviewQuery>) -> impl IntoResponse {
    info!("QR v2 preview request");
    
    // Convert to generate request and reuse generate_handler logic
    let options = QrOptions {
        size: params.size,
        eye_shape: params.eye_shape,
        data_pattern: params.data_pattern,
        foreground_color: params.fg_color,
        background_color: params.bg_color,
        ..Default::default()
    };
    
    let _request = QrGenerateRequest {
        data: params.data,
        options: Some(options),
    };
    
    // For now, just generate and return SVG directly
    // TODO: Optimize preview generation
    (
        StatusCode::NOT_IMPLEMENTED,
        [("Content-Type", "text/plain")],
        "Preview endpoint not yet implemented".to_string(),
    )
}

#[derive(Debug, Serialize)]
pub struct QrValidateResponse {
    pub valid: bool,
    pub details: ValidationDetails,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ValidationDetails {
    pub data_length: usize,
    pub estimated_version: u32,
    pub error_correction_capacity: f32,
    pub logo_impact: Option<f32>,
}

pub async fn validate_handler(Json(request): Json<QrGenerateRequest>) -> impl IntoResponse {
    info!("QR v2 validation request");
    
    // Basic validation for now
    let data_length = request.data.len();
    let valid = data_length > 0 && data_length < 4000; // QR code data limit
    
    let mut suggestions = Vec::new();
    if data_length > 2000 {
        suggestions.push("Consider using a higher error correction level for large data".to_string());
    }
    if data_length > 3000 {
        suggestions.push("Data is approaching QR code capacity limits".to_string());
    }
    
    let response = QrValidateResponse {
        valid,
        details: ValidationDetails {
            data_length,
            estimated_version: if data_length < 100 { 5 } else if data_length < 500 { 10 } else { 20 },
            error_correction_capacity: 0.30, // M level = 30% recovery
            logo_impact: None,
        },
        suggestions,
    };
    
    (StatusCode::OK, Json(response))
}

// Implement Default for QrOptions
impl Default for QrOptions {
    fn default() -> Self {
        Self {
            size: Some(300),
            margin: Some(4),
            error_correction: Some("M".to_string()),
            eye_shape: None,
            data_pattern: None,
            foreground_color: Some("#000000".to_string()),
            background_color: Some("#FFFFFF".to_string()),
            eye_color: None,
            gradient: None,
            logo: None,
            frame: None,
            effects: None,
            optimize_for_size: Some(false),
            enable_cache: Some(true),
        }
    }
}

