// No necesitamos 'mod generator;' porque cargo maneja lib.rs

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
use rust_generator::generate_code; // Usamos el nombre del crate

// --- Structs ---

// Struct para las opciones anidadas
#[derive(Deserialize, Debug, Default)] // Default para que funcione serde(default) en Option<...>
struct GenerateRequestOptions {
    #[serde(default = "default_scale")] // Usa default_scale() si 'scale' falta
    scale: u32,
    // Aquí añadiremos más opciones (color, etc.) en el futuro
}

// Función helper para el valor por defecto de scale
fn default_scale() -> u32 {
    3 // Escala 3 por defecto si no se especifica
}

// Struct principal de la petición
#[derive(Deserialize, Debug)]
struct GenerateRequest {
    barcode_type: String,
    data: String,
    #[serde(default)] // Usa Option::None si 'options' falta en el JSON
    options: Option<GenerateRequestOptions>,
}

// Structs de respuesta (sin cambios)
#[derive(Serialize)]
struct SuccessResponse {
    success: bool,
    #[serde(rename = "svgString")] // Mantenemos camelCase para JSON de salida
    svg_string: String,
}
#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: String,
}

// --- Punto de Entrada Principal ---
#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/generate", post(generate_handler));

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

// --- Handlers ---
async fn root_handler() -> &'static str {
    "Servicio de Generación de Códigos (Rust/Axum) - OK"
}

// Handler para POST /generate (¡Actualizado para usar scale!)
async fn generate_handler(Json(payload): Json<GenerateRequest>) -> impl IntoResponse {
    println!(
        "Solicitud /generate recibida: tipo={}, data='{}', opciones={:?}",
        payload.barcode_type, payload.data, payload.options
    );

    // --- Extraer Escala de Opciones ---
    // Si 'options' es Some(opts), usa opts.scale.
    // Si 'options' es None, usa el valor de default_scale().
    // Serde ya aplicó default_scale a opts.scale si 'scale' faltaba dentro de 'options'.
    let scale = payload.options.map_or_else(default_scale, |opts| opts.scale);
    // Aseguramos un mínimo de 1
    let scale = if scale == 0 { 1 } else { scale };
    // -----------------------------------

    // Hints (siguen siendo menos relevantes para nuestro SVG manual)
    let width_hint = 0;
    let height_hint = 0;

    // Llamamos a generate_code PASANDO LA ESCALA
    match generate_code( // Usa el nombre directo porque importamos con 'use'
        &payload.barcode_type,
        &payload.data,
        width_hint,
        height_hint,
        scale, // <-- Pasamos la escala extraída
    ) {
        Ok(svg_string) => {
            println!("Generación SVG exitosa para tipo {}.", payload.barcode_type);
            (StatusCode::OK, Json(SuccessResponse { success: true, svg_string }))
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
            (status_code, Json(ErrorResponse { success: false, error: error_message }))
                .into_response()
        }
    }
}