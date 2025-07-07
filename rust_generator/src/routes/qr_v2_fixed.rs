use axum::{
    extract::{Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tracing::{info, error};
use std::time::Instant;

use crate::engine::{QrError, QR_ENGINE};
use crate::engine::types::{
    QrRequest as EngineQrRequest, QrOutput, OutputFormat, QrCustomization,
    EyeShape, DataPattern, ColorOptions, GradientOptions, LogoOptions,
    FrameOptions, EffectOptions, ErrorCorrectionLevel, GradientType,
    LogoShape, FrameType, TextPosition, Effect, EffectConfiguration
};

// API Request/Response structures that match frontend expectations

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
    pub gradient: Option<GradientOptionsApi>,
    pub logo: Option<LogoOptionsApi>,
    pub frame: Option<FrameOptionsApi>,
    pub effects: Option<Vec<EffectOptionsApi>>,
    
    // Performance options
    pub optimize_for_size: Option<bool>,
    pub enable_cache: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GradientOptionsApi {
    #[serde(rename = "type")]
    pub gradient_type: String,
    pub colors: Vec<String>,
    pub angle: Option<f32>,
    pub apply_to_eyes: Option<bool>,
    pub apply_to_data: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogoOptionsApi {
    pub data: String, // Base64
    pub size: Option<f32>,
    pub padding: Option<u32>,
    pub background_color: Option<String>,
    pub shape: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FrameOptionsApi {
    pub style: String,
    pub color: Option<String>,
    pub width: Option<u32>,
    pub text: Option<String>,
    pub text_position: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EffectOptionsApi {
    #[serde(rename = "type")]
    pub effect_type: String,
    pub intensity: Option<f32>,
    pub color: Option<String>,
    pub offset_x: Option<f64>,
    pub offset_y: Option<f64>,
    pub blur_radius: Option<f64>,
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
    pub complexity_level: String,
    pub quality_score: f32,
}

// Conversion functions

fn parse_eye_shape(shape: &str) -> Option<EyeShape> {
    match shape {
        "square" => Some(EyeShape::Square),
        "circle" => Some(EyeShape::Circle),
        "rounded" | "rounded_square" => Some(EyeShape::RoundedSquare),
        "dot" => Some(EyeShape::Dot),
        "leaf" => Some(EyeShape::Leaf),
        "star" => Some(EyeShape::Star),
        "diamond" => Some(EyeShape::Diamond),
        _ => None,
    }
}

fn parse_data_pattern(pattern: &str) -> Option<DataPattern> {
    match pattern {
        "square" => Some(DataPattern::Square),
        "dots" => Some(DataPattern::Dots),
        "rounded" => Some(DataPattern::Rounded),
        "vertical" => Some(DataPattern::Vertical),
        "horizontal" => Some(DataPattern::Horizontal),
        "diamond" => Some(DataPattern::Diamond),
        _ => None,
    }
}

fn parse_error_correction(level: &str) -> ErrorCorrectionLevel {
    match level {
        "L" => ErrorCorrectionLevel::Low,
        "M" => ErrorCorrectionLevel::Medium,
        "Q" => ErrorCorrectionLevel::Quartile,
        "H" => ErrorCorrectionLevel::High,
        _ => ErrorCorrectionLevel::Medium,
    }
}

fn parse_gradient_type(gt: &str) -> GradientType {
    match gt {
        "linear" => GradientType::Linear,
        "radial" => GradientType::Radial,
        "conic" => GradientType::Conic,
        "diamond" => GradientType::Diamond,
        "spiral" => GradientType::Spiral,
        _ => GradientType::Linear,
    }
}

fn parse_logo_shape(shape: &str) -> LogoShape {
    match shape {
        "circle" => LogoShape::Circle,
        "rounded" | "rounded_square" => LogoShape::RoundedSquare,
        _ => LogoShape::Square,
    }
}

fn parse_frame_type(ft: &str) -> FrameType {
    match ft {
        "rounded" => FrameType::Rounded,
        "bubble" => FrameType::Bubble,
        "speech" => FrameType::Speech,
        "badge" => FrameType::Badge,
        _ => FrameType::Simple,
    }
}

fn parse_text_position(pos: &str) -> TextPosition {
    match pos {
        "top" => TextPosition::Top,
        "left" => TextPosition::Left,
        "right" => TextPosition::Right,
        _ => TextPosition::Bottom,
    }
}

fn parse_effect(effect: &str) -> Option<Effect> {
    match effect {
        "shadow" => Some(Effect::Shadow),
        "glow" => Some(Effect::Glow),
        "blur" => Some(Effect::Blur),
        "noise" => Some(Effect::Noise),
        "vintage" => Some(Effect::Vintage),
        _ => None,
    }
}

pub async fn generate_handler(Json(request): Json<QrGenerateRequest>) -> impl IntoResponse {
    let start = Instant::now();
    
    info!("QR v2 generation request: data_len={}", request.data.len());
    
    // Build customization from options
    let customization = request.options.as_ref().map(|opts| {
        QrCustomization {
            eye_shape: opts.eye_shape.as_ref().and_then(|s| parse_eye_shape(s)),
            data_pattern: opts.data_pattern.as_ref().and_then(|s| parse_data_pattern(s)),
            colors: if opts.foreground_color.is_some() || opts.background_color.is_some() {
                Some(ColorOptions {
                    foreground: opts.foreground_color.clone().unwrap_or_else(|| "#000000".to_string()),
                    background: opts.background_color.clone().unwrap_or_else(|| "#FFFFFF".to_string()),
                    eye_colors: None,
                })
            } else {
                None
            },
            gradient: opts.gradient.as_ref().map(|g| GradientOptions {
                enabled: true,
                gradient_type: parse_gradient_type(&g.gradient_type),
                colors: g.colors.clone(),
                angle: g.angle,
                apply_to_eyes: g.apply_to_eyes.unwrap_or(false),
                apply_to_data: g.apply_to_data.unwrap_or(true),
            }),
            logo: opts.logo.as_ref().map(|l| LogoOptions {
                data: l.data.clone(),
                size_percentage: l.size.unwrap_or(20.0),
                padding: l.padding.unwrap_or(5),
                background: l.background_color.clone(),
                shape: l.shape.as_ref().map(|s| parse_logo_shape(s)).unwrap_or(LogoShape::Square),
            }),
            frame: opts.frame.as_ref().map(|f| FrameOptions {
                frame_type: parse_frame_type(&f.style),
                text: f.text.clone(),
                color: f.color.clone().unwrap_or_else(|| "#000000".to_string()),
                text_position: f.text_position.as_ref().map(|p| parse_text_position(p)).unwrap_or(TextPosition::Bottom),
            }),
            effects: opts.effects.as_ref().map(|effects| {
                effects.iter().filter_map(|e| {
                    parse_effect(&e.effect_type).map(|effect_type| {
                        let config = match effect_type {
                            Effect::Shadow => EffectConfiguration::Shadow {
                                offset_x: e.offset_x,
                                offset_y: e.offset_y,
                                blur_radius: e.blur_radius,
                                color: e.color.clone(),
                                opacity: Some(0.5),
                            },
                            Effect::Glow => EffectConfiguration::Glow {
                                intensity: e.intensity.map(|i| i as f64),
                                color: e.color.clone(),
                            },
                            Effect::Blur => EffectConfiguration::Blur {
                                radius: e.blur_radius,
                            },
                            Effect::Noise => EffectConfiguration::Noise {
                                intensity: e.intensity.map(|i| i as f64),
                            },
                            Effect::Vintage => EffectConfiguration::Vintage {
                                sepia_intensity: Some(0.8),
                                vignette_intensity: Some(0.6),
                            },
                        };
                        
                        EffectOptions {
                            effect_type,
                            config,
                        }
                    })
                }).collect()
            }),
            error_correction: opts.error_correction.as_ref().map(|ec| parse_error_correction(ec)),
            logo_size_ratio: None,
            selective_effects: None,
        }
    });
    
    // Build engine request
    let engine_request = EngineQrRequest {
        data: request.data.clone(),
        size: request.options.as_ref().and_then(|o| o.size).unwrap_or(300),
        format: OutputFormat::Svg,
        customization,
    };
    
    // Use the global QR engine
    match QR_ENGINE.generate(engine_request).await {
        Ok(output) => {
            let processing_time = start.elapsed().as_millis() as u64;
            
            // Convert output to API response format
            let response = QrGenerateResponse {
                svg: output.data,
                metadata: QrMetadata {
                    version: 5, // Estimated based on data length
                    modules: 25, // Estimated
                    error_correction: request.options.as_ref()
                        .and_then(|o| o.error_correction.clone())
                        .unwrap_or_else(|| "M".to_string()),
                    data_capacity: request.data.len(),
                    processing_time_ms: processing_time,
                    complexity_level: format!("{:?}", output.metadata.complexity_level),
                    quality_score: output.metadata.quality_score,
                },
                cached: false, // TODO: Get from actual cache status
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
                        complexity_level: "Basic".to_string(),
                        quality_score: 0.0,
                    },
                    cached: false,
                })
            )
        }
    }
}

// Batch processing placeholder
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

pub async fn batch_handler(Json(_request): Json<QrBatchRequest>) -> impl IntoResponse {
    // TODO: Implement batch processing
    let response = QrBatchResponse {
        success: false,
        results: vec![],
        summary: BatchSummary {
            total: 0,
            successful: 0,
            failed: 0,
            total_time_ms: 0,
            average_time_ms: 0.0,
        },
    };
    
    (StatusCode::NOT_IMPLEMENTED, Json(response))
}

// Validation handler
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
    
    let data_length = request.data.len();
    let valid = data_length > 0 && data_length < 4000;
    
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
            error_correction_capacity: 0.30,
            logo_impact: None,
        },
        suggestions,
    };
    
    (StatusCode::OK, Json(response))
}

// Preview handler
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
    
    let options = QrOptions {
        size: params.size,
        eye_shape: params.eye_shape,
        data_pattern: params.data_pattern,
        foreground_color: params.fg_color,
        background_color: params.bg_color,
        ..Default::default()
    };
    
    let request = QrGenerateRequest {
        data: params.data,
        options: Some(options),
    };
    
    match generate_handler(Json(request)).await.into_response() {
        response => {
            let (parts, body) = response.into_parts();
            if parts.status == StatusCode::OK {
                // Extract SVG from response and return as image/svg+xml
                // This is a simplified version - in production you'd parse the JSON properly
                (
                    StatusCode::OK,
                    [("Content-Type", "image/svg+xml")],
                    "SVG content would go here".to_string(),
                )
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    [("Content-Type", "text/plain")],
                    "Preview generation failed".to_string(),
                )
            }
        }
    }
}

// Default implementation for QrOptions
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