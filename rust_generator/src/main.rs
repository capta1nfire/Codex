// Correct main.rs code to re-paste (from #129)

// NO 'mod generator;' declaration needed when using lib.rs

// Imports necesarios
use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
// Importamos la función pública desde la raíz de nuestra librería (lib.rs)
// usando el keyword 'crate'.
use rust_generator::generate_code;

// --- Structs (sin cambios) ---
#[derive(Deserialize, Debug)]
struct GenerateRequest {
    barcode_type: String,
    data: String,
    #[serde(default)]
    options: Option<serde_json::Value>,
}
#[derive(Serialize)]
struct SuccessResponse {
    success: bool,
    #[serde(rename = "svgString")]
    svg_string: String, // El nombre en Rust sigue siendo snake_case
}
#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: String,
}

// --- Punto de Entrada Principal (sin cambios en la lógica principal) ---
#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/generate", post(generate_handler)); // Ruta POST añadida

    let addr = SocketAddr::from(([127, 0, 0, 1], 3002));
    println!("Servicio Rust de Generación (Axum) escuchando en {}", addr);

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

// --- Handlers (root_handler sin cambios, generate_handler ajustado) ---
async fn root_handler() -> &'static str {
    "Servicio de Generación de Códigos (Rust/Axum) - OK"
}

async fn generate_handler(Json(payload): Json<GenerateRequest>) -> impl IntoResponse {
    println!(
        "Solicitud /generate recibida: tipo={}, data='{}', opciones={:?}",
        payload.barcode_type, payload.data, payload.options
    );

    let width_hint = 0;
    let height_hint = 0;

    // --- Llamada Corregida a la función de lib.rs ---
    // Usamos directamente 'generate_code' porque la importamos con 'use crate::generate_code;'
    match generate_code(&payload.barcode_type, &payload.data, width_hint, height_hint) {
        Ok(svg_string) => {
            println!("Generación SVG exitosa para tipo {}.", payload.barcode_type);
            (
                StatusCode::OK,
                Json(SuccessResponse {
                    success: true,
                    svg_string: svg_string, // Corregido a snake_case
                }),
            )
                .into_response()
        }
        Err(e) => {
            let error_message = e.to_string();
            println!("Error en generate_code: {}", error_message);
            let status_code =
                if error_message.contains("Tipo de código no soportado") || error_message.contains("Bad character") {
                    StatusCode::BAD_REQUEST
                } else {
                    StatusCode::INTERNAL_SERVER_ERROR
                };
            (
                status_code,
                Json(ErrorResponse {
                    success: false,
                    error: error_message,
                }),
            )
                .into_response()
        }
    }
}