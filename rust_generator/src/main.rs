// main.rs actualizado con integración del sistema de validación

// Imports necesarios
use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
mod validators; // Importamos el nuevo módulo de validadores
use validators::{BarcodeRequest, ValidationError, validate_barcode_request};
use std::net::SocketAddr;

// --- Structs de Respuesta ---
#[derive(serde::Serialize)]
struct SuccessResponse {
    success: bool,
    #[serde(rename = "svgString")]
    svg_string: String,
}

#[derive(serde::Serialize)]
struct ErrorResponse {
    success: bool,
    error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    suggestion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
}

// --- Punto de Entrada Principal ---
#[tokio::main]
async fn main() {
    // Configuramos las rutas
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/generate", post(generate_handler));
    
    // Configuramos la dirección
    let addr = SocketAddr::from(([127, 0, 0, 1], 3002));
    println!("Servicio Rust de Generación (Axum) escuchando en {}", addr);
    
    // Iniciamos el servidor
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(e) => {
            eprintln!("FATAL: No se pudo enlazar al puerto {}: {}", addr.port(), e);
            std::process::exit(1);
        }
    };
    
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("FATAL: El servidor Axum falló: {}", e);
        std::process::exit(1);
    }
}

// --- Handlers ---
async fn root_handler() -> &'static str {
    "Servicio de Generación de Códigos (Rust/Axum) - OK"
}

async fn generate_handler(Json(payload): Json<BarcodeRequest>) -> impl IntoResponse {
    println!(
        "Solicitud /generate recibida: tipo={}, data='{}', opciones={:?}",
        payload.barcode_type, payload.data, payload.options
    );
    
    // [NUEVO] - Validar la solicitud primero
    if let Err(validation_error) = validate_barcode_request(&payload) {
        println!("Error de validación: {}", validation_error);
        
        // Construir respuesta de error estructurada
        return (
            StatusCode::BAD_REQUEST, 
            Json(ErrorResponse { 
                success: false, 
                error: validation_error.message.clone(),
                suggestion: validation_error.suggestion.clone(),
                code: Some(validation_error.code.clone()),
            })
        ).into_response();
    }
    
    // Si la validación es exitosa, proceder con la generación
    let scale = payload.options.as_ref().map_or_else(
        validators::default_scale, 
        |opts| opts.scale
    );
    
    let width_hint = 0;
    let height_hint = 0;
    
    // Llamada al generador
    match rust_generator::generate_code(
        &payload.barcode_type,
        &payload.data,
        width_hint,
        height_hint,
        scale,
    ) {
        Ok(svg_string) => {
            println!("Generación SVG exitosa para tipo {}.", payload.barcode_type);
            (
                StatusCode::OK, 
                Json(SuccessResponse { 
                    success: true, 
                    svg_string 
                })
            ).into_response()
        }
        Err(e) => {
            let error_message = e.to_string();
            println!("Error en generate_code: {}", error_message);
            
            // Determinar el código de estado según el tipo de error
            let status_code = if error_message.contains("Tipo de código no soportado") 
                              || error_message.contains("Bad character") {
                StatusCode::BAD_REQUEST
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
            // Generar respuesta de error
            (
                status_code, 
                Json(ErrorResponse { 
                    success: false, 
                    error: error_message,
                    suggestion: None,
                    code: None,
                })
            ).into_response()
        }
    }
}