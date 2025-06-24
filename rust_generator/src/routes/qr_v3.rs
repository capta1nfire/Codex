// routes/qr_v3.rs - API v3 con datos estructurados (ULTRATHINK)

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use sha2::Digest;
use std::sync::Arc;
use std::time::Instant;
use tracing::{error, info, instrument};

use rust_generator::engine::{QrEngine, QrCustomization, ErrorCorrectionLevel, error::QrError};
use rust_generator::cache::redis;

/// Request para generación v3
#[derive(Debug, Clone, Deserialize)]
pub struct QrV3Request {
    /// Datos a codificar
    pub data: String,
    
    /// Opciones de personalización
    #[serde(default)]
    pub options: QrV3Options,
}

/// Opciones para v3
#[derive(Debug, Clone, Deserialize, Default)]
pub struct QrV3Options {
    /// Nivel de corrección de errores (L, M, Q, H)
    #[serde(default)]
    pub error_correction: Option<String>,
    
    /// Customización completa (para features avanzadas)
    pub customization: Option<QrCustomization>,
}

/// Response v3 con datos estructurados
#[derive(Debug, Clone, Serialize)]
pub struct QrV3Response {
    /// Indicador de éxito
    pub success: bool,
    
    /// Datos estructurados del QR
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<rust_generator::engine::types::QrStructuredOutput>,
    
    /// Información de error si falla
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<QrV3Error>,
    
    /// Metadata adicional
    pub metadata: QrV3Metadata,
}

/// Error response
#[derive(Debug, Clone, Serialize)]
pub struct QrV3Error {
    pub code: String,
    pub message: String,
}

/// Metadata de la respuesta
#[derive(Debug, Clone, Serialize)]
pub struct QrV3Metadata {
    /// Versión del motor
    pub engine_version: String,
    
    /// Si vino del cache
    pub cached: bool,
    
    /// Tiempo total de procesamiento
    pub processing_time_ms: u64,
}

/// Estado compartido para v3
#[derive(Clone)]
pub struct QrV3State {
    pub engine: Arc<QrEngine>,
    pub cache: Arc<redis::RedisCache>,
}

/// Crea las rutas v3
pub fn routes(state: QrV3State) -> Router {
    Router::new()
        .route("/api/v3/qr/generate", post(generate_qr_v3))
        .route("/api/v3/qr/enhanced", post(generate_qr_v3_enhanced))
        .with_state(state)
}

/// Handler principal v3
#[instrument(skip(state, payload))]
async fn generate_qr_v3(
    State(state): State<QrV3State>,
    Json(payload): Json<QrV3Request>,
) -> Result<Json<QrV3Response>, StatusCode> {
    let start = Instant::now();
    info!("QR v3 generation request for data length: {}", payload.data.len());
    
    // Validar entrada
    if payload.data.is_empty() {
        return Ok(Json(QrV3Response {
            success: false,
            data: None,
            error: Some(QrV3Error {
                code: "INVALID_INPUT".to_string(),
                message: "Data cannot be empty".to_string(),
            }),
            metadata: QrV3Metadata {
                engine_version: "3.0.0".to_string(),
                cached: false,
                processing_time_ms: start.elapsed().as_millis() as u64,
            },
        }));
    }
    
    // Generar cache key basado en contenido y opciones
    let cache_key = format!(
        "qrv3:{}:{}:{}",
        sha2::Sha256::digest(payload.data.as_bytes())
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>(),
        payload.options.error_correction.as_deref().unwrap_or("M"),
        serde_json::to_string(&payload.options.customization).unwrap_or_default()
    );
    
    // Verificar cache
    if let Some(cached_data) = state.cache.get(&cache_key) {
        if let Ok(structured_output) = serde_json::from_str::<rust_generator::engine::types::QrStructuredOutput>(&cached_data.svg) {
            info!("Cache hit for v3 generation");
            return Ok(Json(QrV3Response {
                success: true,
                data: Some(structured_output),
                error: None,
                metadata: QrV3Metadata {
                    engine_version: "3.0.0".to_string(),
                    cached: true,
                    processing_time_ms: start.elapsed().as_millis() as u64,
                },
            }));
        }
    }
    
    // Generar QR directamente usando QrGenerator
    let result = tokio::task::spawn_blocking({
        let data = payload.data.clone();
        let options = payload.options.clone();
        
        move || -> Result<rust_generator::engine::types::QrStructuredOutput, QrError> {
            use rust_generator::engine::generator::QrGenerator;
            
            // Convertir nivel de corrección de string a enum
            let ecl = options.error_correction
                .and_then(|ecl_str| match ecl_str.as_str() {
                    "L" => Some(ErrorCorrectionLevel::Low),
                    "M" => Some(ErrorCorrectionLevel::Medium),
                    "Q" => Some(ErrorCorrectionLevel::Quartile),
                    "H" => Some(ErrorCorrectionLevel::High),
                    _ => None,
                })
                .unwrap_or(ErrorCorrectionLevel::Medium);
            
            // Crear generador y generar código QR directamente
            let generator = QrGenerator::new();
            
            // Verificar si hay un logo con ratio de tamaño
            let has_logo_with_ratio = options.customization.as_ref()
                .and_then(|c| c.logo_size_ratio)
                .is_some();
                
            info!("Options customization: {:?}", options.customization.as_ref().map(|c| format!("logo_size_ratio: {:?}", c.logo_size_ratio)));
            info!("has_logo_with_ratio: {}", has_logo_with_ratio);
            
            // Generar QR con estrategia apropiada
            let (qr_code, exclusion_info) = if has_logo_with_ratio {
                let logo_ratio = options.customization.as_ref()
                    .and_then(|c| c.logo_size_ratio)
                    .unwrap_or(0.2);
                
                let (qr, analysis) = generator.generate_with_dynamic_ecl(
                    &data,
                    400,
                    logo_ratio,
                    Some(ecl),
                )?;
                
                let exclusion = Some(rust_generator::engine::types::ExclusionInfo {
                    excluded_modules: analysis.occluded_modules,
                    affected_codewords: analysis.affected_codewords,
                    occlusion_percentage: analysis.occlusion_percentage,
                    selected_ecl: format!("{:?}", analysis.recommended_ecl),
                    ecl_override: false,
                });
                
                (qr, exclusion)
            } else {
                let qr = generator.generate_with_ecl(&data, 400, ecl)?;
                (qr, None)
            };
            
            // Convertir a datos estructurados con exclusion info
            let structured = if has_logo_with_ratio {
                // Usar el método con exclusión cuando hay logo
                let mut structured = qr_code.to_structured_data_with_exclusion(qr_code.logo_zone.as_ref());
                if let Some(exclusion) = exclusion_info {
                    structured.metadata.exclusion_info = Some(exclusion);
                }
                structured
            } else {
                // Método estándar sin exclusión
                let mut structured = qr_code.to_structured_data();
                if let Some(exclusion) = exclusion_info {
                    structured.metadata.exclusion_info = Some(exclusion);
                }
                structured
            };
            
            Ok(structured)
        }
    })
    .await
    .map_err(|e| {
        error!("Task join error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    match result {
        Ok(structured_output) => {
            // Guardar en cache
            if let Ok(json_data) = serde_json::to_string(&structured_output) {
                let cached_qr = redis::CachedQR {
                    svg: json_data,
                    metadata: redis::QRMetadata {
                        version: 1,
                        modules: structured_output.total_modules as usize,
                        error_correction: structured_output.error_correction.clone(),
                        processing_time_ms: structured_output.metadata.generation_time_ms,
                    },
                    generated_at: chrono::Utc::now().timestamp(),
                };
                let _ = state.cache.set(&cache_key, &cached_qr);
            }
            
            info!("QR v3 generated successfully");
            Ok(Json(QrV3Response {
                success: true,
                data: Some(structured_output),
                error: None,
                metadata: QrV3Metadata {
                    engine_version: "3.0.0".to_string(),
                    cached: false,
                    processing_time_ms: start.elapsed().as_millis() as u64,
                },
            }))
        }
        Err(e) => {
            error!("QR v3 generation error: {:?}", e);
            Ok(Json(QrV3Response {
                success: false,
                data: None,
                error: Some(QrV3Error {
                    code: "GENERATION_ERROR".to_string(),
                    message: format!("Failed to generate QR: {:?}", e),
                }),
                metadata: QrV3Metadata {
                    engine_version: "3.0.0".to_string(),
                    cached: false,
                    processing_time_ms: start.elapsed().as_millis() as u64,
                },
            }))
        }
    }
}

/// Handler para v3 Enhanced con estructura completa
#[instrument(skip(state, payload))]
async fn generate_qr_v3_enhanced(
    State(state): State<QrV3State>,
    Json(payload): Json<QrV3Request>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let start = Instant::now();
    info!("QR v3 Enhanced generation request for data length: {}", payload.data.len());
    
    // Validar entrada
    if payload.data.is_empty() {
        return Ok(Json(serde_json::json!({
            "success": false,
            "error": {
                "code": "INVALID_INPUT",
                "message": "Data cannot be empty"
            },
            "metadata": {
                "engine_version": "3.0.0-enhanced",
                "cached": false,
                "processing_time_ms": start.elapsed().as_millis()
            }
        })));
    }
    
    // Generar cache key incluyendo customization
    let cache_key = format!(
        "qrv3e:{}:{}:{}",
        sha2::Sha256::digest(payload.data.as_bytes())
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>(),
        payload.options.error_correction.as_deref().unwrap_or("M"),
        serde_json::to_string(&payload.options.customization).unwrap_or_default()
    );
    
    // Verificar cache
    if let Some(cached_data) = state.cache.get(&cache_key) {
        if let Ok(enhanced_output) = serde_json::from_str::<rust_generator::engine::types::QrEnhancedOutput>(&cached_data.svg) {
            info!("Cache hit for v3 Enhanced generation");
            return Ok(Json(serde_json::json!({
                "success": true,
                "data": enhanced_output,
                "metadata": {
                    "engine_version": "3.0.0-enhanced",
                    "cached": true,
                    "processing_time_ms": start.elapsed().as_millis()
                }
            })));
        }
    }
    
    // Generar QR Enhanced
    let result = tokio::task::spawn_blocking({
        let data = payload.data.clone();
        let options = payload.options.clone();
        
        move || -> Result<rust_generator::engine::types::QrEnhancedOutput, QrError> {
            use rust_generator::engine::generator::QrGenerator;
            
            // Convertir nivel de corrección
            let ecl = options.error_correction
                .and_then(|ecl_str| match ecl_str.as_str() {
                    "L" => Some(ErrorCorrectionLevel::Low),
                    "M" => Some(ErrorCorrectionLevel::Medium),
                    "Q" => Some(ErrorCorrectionLevel::Quartile),
                    "H" => Some(ErrorCorrectionLevel::High),
                    _ => None,
                })
                .unwrap_or(ErrorCorrectionLevel::Medium);
            
            // Crear generador
            let generator = QrGenerator::new();
            
            // Verificar si hay un logo con ratio de tamaño
            let has_logo_with_ratio = options.customization.as_ref()
                .and_then(|c| c.logo_size_ratio)
                .is_some();
                
            info!("Options customization: {:?}", options.customization.as_ref().map(|c| format!("logo_size_ratio: {:?}", c.logo_size_ratio)));
            info!("has_logo_with_ratio: {}", has_logo_with_ratio);
            
            // Generar QR con estrategia apropiada
            let (qr_code, exclusion_info) = if has_logo_with_ratio {
                // Usar generación con ECL dinámico para logos
                let logo_ratio = options.customization.as_ref()
                    .and_then(|c| c.logo_size_ratio)
                    .unwrap_or(0.2);
                
                info!("Generating QR with dynamic ECL. Logo ratio: {}", logo_ratio);
                
                let (mut qr, analysis) = generator.generate_with_dynamic_ecl(
                    &data,
                    400,
                    logo_ratio,
                    Some(ecl),
                )?;
                
                // Convertir análisis a ExclusionInfo
                let exclusion = Some(rust_generator::engine::types::ExclusionInfo {
                    excluded_modules: analysis.occluded_modules,
                    affected_codewords: analysis.affected_codewords,
                    occlusion_percentage: analysis.occlusion_percentage,
                    selected_ecl: format!("{:?}", analysis.recommended_ecl),
                    ecl_override: false,
                });
                
                info!("Dynamic ECL analysis complete. Occluded modules: {}, ECL: {:?}", 
                     analysis.occluded_modules, analysis.recommended_ecl);
                
                (qr, exclusion)
            } else {
                // Generación estándar sin ECL dinámico
                let qr = generator.generate_with_ecl(&data, 400, ecl)?;
                (qr, None)
            };
            
            // Aplicar customization si está presente
            let mut qr_code = qr_code;
            if let Some(customization) = options.customization {
                qr_code.customization = Some(customization);
            }
            
            // Convertir a Enhanced data con exclusion info
            let enhanced = qr_code.to_enhanced_data_with_exclusion(exclusion_info);
            
            info!("Enhanced data exclusion info: {:?}", 
                 enhanced.metadata.exclusion_info.as_ref().map(|e| e.excluded_modules));
            
            Ok(enhanced)
        }
    })
    .await
    .map_err(|e| {
        error!("Task join error: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;
    
    match result {
        Ok(enhanced_output) => {
            // Guardar en cache
            if let Ok(json_data) = serde_json::to_string(&enhanced_output) {
                let cached_qr = redis::CachedQR {
                    svg: json_data,
                    metadata: redis::QRMetadata {
                        version: 1,
                        modules: enhanced_output.paths.data.len(),
                        error_correction: enhanced_output.metadata.error_correction.clone(),
                        processing_time_ms: enhanced_output.metadata.generation_time_ms,
                    },
                    generated_at: chrono::Utc::now().timestamp(),
                };
                let _ = state.cache.set(&cache_key, &cached_qr);
            }
            
            info!("QR v3 Enhanced generated successfully");
            Ok(Json(serde_json::json!({
                "success": true,
                "data": enhanced_output,
                "metadata": {
                    "engine_version": "3.0.0-enhanced",
                    "cached": false,
                    "processing_time_ms": start.elapsed().as_millis()
                }
            })))
        }
        Err(e) => {
            error!("QR v3 Enhanced generation error: {:?}", e);
            Ok(Json(serde_json::json!({
                "success": false,
                "error": {
                    "code": "GENERATION_ERROR",
                    "message": format!("Failed to generate QR: {:?}", e)
                },
                "metadata": {
                    "engine_version": "3.0.0-enhanced",
                    "cached": false,
                    "processing_time_ms": start.elapsed().as_millis()
                }
            })))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_request_deserialization() {
        let json = r#"{
            "data": "https://example.com",
            "options": {
                "error_correction": "H"
            }
        }"#;
        
        let request: QrV3Request = serde_json::from_str(json).unwrap();
        assert_eq!(request.data, "https://example.com");
        assert_eq!(request.options.error_correction, Some("H".to_string()));
    }
}