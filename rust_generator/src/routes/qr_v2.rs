use axum::{
    extract::{Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tracing::{info, error};
use std::time::Instant;

use crate::engine::{QrError, QR_ENGINE};
use crate::engine::types::{QrRequest as EngineQrRequest, QrOutput, OutputFormat, QrCustomization};

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
    let engine_request = EngineQrRequest {
        data: request.data.clone(),
        size: request.options.as_ref().and_then(|o| o.size).unwrap_or(300),
        margin: request.options.as_ref().and_then(|o| o.margin).unwrap_or(4),
        error_correction: request.options.as_ref()
            .and_then(|o| o.error_correction.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("M"),
        eye_shape: request.options.as_ref()
            .and_then(|o| o.eye_shape.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("square"),
        data_pattern: request.options.as_ref()
            .and_then(|o| o.data_pattern.as_ref())
            .map(|s| s.as_str())
            .unwrap_or("square"),
        gradient: request.options.as_ref().and_then(|o| o.gradient.as_ref()).map(|g| {
            crate::engine::types::GradientOptions {
                gradient_type: g.gradient_type.clone(),
                colors: g.colors.clone(),
                angle: g.angle,
                center_x: g.center_x,
                center_y: g.center_y,
            }
        }),
        logo: request.options.as_ref().and_then(|o| o.logo.as_ref()).map(|l| {
            crate::engine::types::LogoOptions {
                data: l.data.clone(),
                size: l.size,
                padding: l.padding,
                background_color: l.background_color.clone(),
            }
        }),
        effects: request.options.as_ref().and_then(|o| o.effects.as_ref()).map(|effects| {
            effects.iter().map(|e| {
                crate::engine::types::EffectOptions {
                    effect_type: e.effect_type.clone(),
                    intensity: e.intensity,
                    color: e.color.clone(),
                }
            }).collect()
        }),
    };
    
    // Use the global QR engine
    match QR_ENGINE.generate(engine_request).await {
        Ok(output) => {
            let processing_time = start.elapsed().as_millis() as u64;
            
            let response = QrGenerateResponse {
                svg: output.svg,
                metadata: QrMetadata {
                    version: output.metadata.version,
                    modules: output.metadata.modules,
                    error_correction: output.metadata.error_correction.to_string(),
                    data_capacity: request.data.len(),
                    processing_time_ms: processing_time,
                },
                cached: output.cached,
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

