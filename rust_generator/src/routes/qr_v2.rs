use axum::{
    extract::{Json, Query},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tracing::{info, error};
use std::time::Instant;

use crate::engine::{QrError, QrResult, QR_ENGINE};
use crate::engine::types::{QrRequest, QrOutput, OutputFormat, QrCustomization};
use crate::models::qr::QrOptions;

#[derive(Debug, Serialize, Deserialize)]
pub struct QrGenerateRequest {
    pub data: String,
    pub options: Option<QrOptions>,
}

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct GradientOptions {
    #[serde(rename = "type")]
    pub gradient_type: String,
    pub colors: Vec<String>,
    pub angle: Option<f32>,
    pub center_x: Option<f32>,
    pub center_y: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogoOptions {
    pub data: String, // Base64
    pub size: Option<f32>,
    pub padding: Option<u32>,
    pub background_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FrameOptions {
    pub style: String,
    pub color: Option<String>,
    pub width: Option<u32>,
    pub text: Option<String>,
    pub text_position: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
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
    
    // Route by complexity
    let router = ComplexityRouter::new();
    let complexity = router.analyze_complexity(&request);
    
    info!("Request complexity: {:?}", complexity);
    
    // Generate QR code
    let generator = QrGenerator::new();
    let qr_result = match generator.generate(&request.data, request.options.as_ref()) {
        Ok(qr) => qr,
        Err(e) => {
            error!("QR generation failed: {}", e);
            return error_response(e);
        }
    };
    
    // Apply customizations if any
    let customizer = QrCustomizer::new();
    let customized_result = if request.options.is_some() {
        match customizer.apply(&qr_result, request.options.as_ref().unwrap()) {
            Ok(result) => result,
            Err(e) => {
                error!("QR customization failed: {}", e);
                return error_response(e);
            }
        }
    } else {
        qr_result.svg.clone()
    };
    
    let processing_time = start.elapsed().as_millis() as u64;
    
    let response = QrGenerateResponse {
        svg: customized_result,
        metadata: QrMetadata {
            version: qr_result.version,
            modules: qr_result.modules,
            error_correction: qr_result.error_correction.clone(),
            data_capacity: qr_result.data.len(),
            processing_time_ms: processing_time,
        },
        cached: false,
    };
    
    (StatusCode::OK, Json(response))
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
    let start = Instant::now();
    let total = request.codes.len();
    
    info!("QR v2 batch request: {} codes", total);
    
    let max_concurrent = request.options
        .as_ref()
        .and_then(|o| o.max_concurrent)
        .unwrap_or(10);
        
    let include_metadata = request.options
        .as_ref()
        .and_then(|o| o.include_metadata)
        .unwrap_or(true);
    
    let mut results = Vec::with_capacity(total);
    let mut successful = 0;
    let mut failed = 0;
    
    // Process batch with concurrency control
    use tokio::sync::Semaphore;
    let semaphore = std::sync::Arc::new(Semaphore::new(max_concurrent));
    
    let mut handles = Vec::new();
    
    for (idx, code_request) in request.codes.into_iter().enumerate() {
        let permit = semaphore.clone().acquire_owned().await.unwrap();
        
        let handle = tokio::spawn(async move {
            let _permit = permit; // Hold permit until done
            
            let start = Instant::now();
            let generator = QrGenerator::new();
            
            match generator.generate(&code_request.data, code_request.options.as_ref()) {
                Ok(qr_result) => {
                    let customizer = QrCustomizer::new();
                    let svg = if code_request.options.is_some() {
                        match customizer.apply(&qr_result, code_request.options.as_ref().unwrap()) {
                            Ok(svg) => svg,
                            Err(e) => {
                                return BatchResult {
                                    id: Some(idx.to_string()),
                                    success: false,
                                    svg: None,
                                    error: Some(e.to_string()),
                                    metadata: None,
                                };
                            }
                        }
                    } else {
                        qr_result.svg.clone()
                    };
                    
                    let processing_time = start.elapsed().as_millis() as u64;
                    
                    BatchResult {
                        id: Some(idx.to_string()),
                        success: true,
                        svg: Some(svg),
                        error: None,
                        metadata: if include_metadata {
                            Some(QrMetadata {
                                version: qr_result.version,
                                modules: qr_result.modules,
                                error_correction: qr_result.error_correction,
                                data_capacity: qr_result.data.len(),
                                processing_time_ms: processing_time,
                            })
                        } else {
                            None
                        },
                    }
                }
                Err(e) => BatchResult {
                    id: Some(idx.to_string()),
                    success: false,
                    svg: None,
                    error: Some(e.to_string()),
                    metadata: None,
                },
            }
        });
        
        handles.push(handle);
    }
    
    // Collect results
    for handle in handles {
        if let Ok(result) = handle.await {
            if result.success {
                successful += 1;
            } else {
                failed += 1;
            }
            results.push(result);
        }
    }
    
    let total_time = start.elapsed().as_millis() as u64;
    let average_time = if total > 0 { 
        total_time as f64 / total as f64 
    } else { 
        0.0 
    };
    
    let response = QrBatchResponse {
        success: failed == 0,
        results,
        summary: BatchSummary {
            total,
            successful,
            failed,
            total_time_ms: total_time,
            average_time_ms: average_time,
        },
    };
    
    (StatusCode::OK, Json(response))
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
    
    let generator = QrGenerator::new();
    match generator.generate(&request.data, request.options.as_ref()) {
        Ok(qr_result) => {
            let customizer = QrCustomizer::new();
            match customizer.apply(&qr_result, request.options.as_ref().unwrap()) {
                Ok(svg) => {
                    (
                        StatusCode::OK,
                        [("Content-Type", "image/svg+xml")],
                        svg,
                    )
                }
                Err(e) => {
                    error!("Preview customization failed: {}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        [("Content-Type", "text/plain")],
                        e.to_string(),
                    )
                }
            }
        }
        Err(e) => {
            error!("Preview generation failed: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                [("Content-Type", "text/plain")],
                e.to_string(),
            )
        }
    }
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
    
    let validator = QrValidator::new();
    let validation_result = validator.validate(&request);
    
    let response = QrValidateResponse {
        valid: validation_result.is_valid,
        details: ValidationDetails {
            data_length: request.data.len(),
            estimated_version: validation_result.estimated_version,
            error_correction_capacity: validation_result.error_correction_capacity,
            logo_impact: validation_result.logo_impact,
        },
        suggestions: validation_result.suggestions,
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

fn error_response(error: QrError) -> impl IntoResponse {
    let status = match error {
        QrError::InvalidInput(_) => StatusCode::BAD_REQUEST,
        QrError::DataTooLong => StatusCode::BAD_REQUEST,
        QrError::InvalidColor(_) => StatusCode::BAD_REQUEST,
        QrError::InsufficientContrast(_, _) => StatusCode::BAD_REQUEST,
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    };
    
    (
        status,
        Json(serde_json::json!({
            "error": error.to_string(),
            "success": false
        }))
    )
}