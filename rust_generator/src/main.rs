// main.rs actualizado con integración del sistema de validación y caché

// Imports necesarios
use axum::{
    extract::Json,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};
mod validators; // Importamos el nuevo módulo de validadores
use validators::{BarcodeRequest, validate_barcode_request}; // Quita ValidationError
use std::net::SocketAddr;
use std::time::Instant; // Simplificar importación de tiempo
use std::sync::OnceLock; // Añade OnceLock
use chrono::Local;
use std::sync::atomic::{AtomicU64, Ordering};

// Imports adicionales para caché
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use dashmap::DashMap;

// Estructura para la clave de caché
#[derive(Clone, Hash, PartialEq, Eq)]
struct CacheKey {
    barcode_type: String,
    data: String,
    scale: u32,
    error_correction_level: Option<String>,
}

// Estructura que contiene los datos de caché y estadísticas
struct CacheEntry {
    svg: String,
    created_at: Instant,
    last_accessed: Instant,
    access_count: u64,
}

// Estructura global de caché
#[derive(Default)]
struct GenerationCache {
    cache: DashMap<u64, CacheEntry>,
    hits: AtomicU64,
    misses: AtomicU64,
    max_size: usize,
}

impl GenerationCache {
    fn new(max_size: usize) -> Self {
        Self {
            cache: DashMap::with_capacity(max_size),
            hits: AtomicU64::new(0),
            misses: AtomicU64::new(0),
            max_size,
        }
    }

    // Obtiene un valor de la caché si existe
    fn get(&self, key: &CacheKey) -> Option<String> {
        let hash = self.calculate_hash(key);
        
        if let Some(mut entry) = self.cache.get_mut(&hash) {
            // Actualizar estadísticas
            entry.last_accessed = Instant::now();
            entry.access_count += 1;
            
            // Registrar hit de caché
            self.hits.fetch_add(1, Ordering::SeqCst);
            
            // Devolver copia del SVG
            Some(entry.svg.clone())
        } else {
            // Registrar miss de caché
            self.misses.fetch_add(1, Ordering::SeqCst);
            None
        }
    }

    // Almacena un valor en la caché
    fn put(&self, key: &CacheKey, svg: String) {
        let hash = self.calculate_hash(key);
        let now = Instant::now();
        
        // Si la caché está llena, eliminar las entradas menos usadas
        if self.cache.len() >= self.max_size {
            self.evict_entries();
        }
        
        // Insertar nueva entrada
        self.cache.insert(hash, CacheEntry {
            svg,
            created_at: now,
            last_accessed: now,
            access_count: 1,
        });
    }
    
    // Elimina entradas según política LRU (Least Recently Used)
    fn evict_entries(&self) {
        // Encontrar la entrada accedida menos recientemente
        let oldest_key = self.cache.iter()
            .min_by_key(|entry| entry.value().last_accessed)
            .map(|entry| *entry.key());
            
        // Si encontramos una entrada antigua, eliminarla
        if let Some(key_to_remove) = oldest_key {
            self.cache.remove(&key_to_remove);
        }
    }
    
    // Calcular hash para la clave
    fn calculate_hash(&self, key: &CacheKey) -> u64 {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish()
    }
    
    // Devuelve estadísticas de la caché
    fn stats(&self) -> (u64, u64, f64, usize) {
        let hits = self.hits.load(Ordering::Relaxed);
        let misses = self.misses.load(Ordering::Relaxed);
        let total = hits + misses;
        let hit_rate = if total > 0 {
            (hits as f64 / total as f64) * 100.0
        } else {
            0.0
        };
        
        (hits, misses, hit_rate, self.cache.len())
    }
    
    // Limpia toda la caché
    fn clear(&self) {
        self.cache.clear();
        self.hits.store(0, Ordering::SeqCst);
        self.misses.store(0, Ordering::SeqCst);
    }
}

// Instancia global de caché
static CACHE: OnceLock<GenerationCache> = OnceLock::new();

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

// Contador de solicitudes para métricas
static REQUEST_COUNTER: AtomicU64 = AtomicU64::new(0);
static ERROR_COUNTER: AtomicU64 = AtomicU64::new(0);

// Momento de inicio del servidor (para calcular uptime real)
static START_TIME: OnceLock<Instant> = OnceLock::new();

// --- Punto de Entrada Principal ---
#[tokio::main]
async fn main() {
    // Inicializar el tiempo de inicio
    let _ = START_TIME.set(Instant::now());

    // Inicializar caché con capacidad para 100 elementos
    let _ = CACHE.set(GenerationCache::new(100));
    
    // Configuramos las rutas
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/generate", post(generate_handler))
        .route("/status", get(status_handler))
        .route("/health", get(health_handler))
        .route("/cache/clear", post(clear_cache_handler));
    
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

// Añade esta función después de la función main() y antes de generate_handler()
async fn root_handler() -> &'static str {
    "Servicio de Generación de Códigos (Rust/Axum) - OK"
}

// --- Handlers ---
async fn generate_handler(Json(payload): Json<BarcodeRequest>) -> impl IntoResponse {
    // Incrementar contador de solicitudes
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);
    let start_time = Instant::now();

    // Log mejorado con ID de solicitud para seguimiento
    println!(
        "📝 [{}] REQ-{:06} INICIO | tipo={}, data_length={}, opciones={:?}",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        request_id,
        payload.barcode_type,
        payload.data.len(),
        payload.options
    );

    // [NUEVO] - Validar la solicitud primero
    if let Err(validation_error) = validate_barcode_request(&payload) {
        println!("Error de validación: {}", validation_error);
        
        // Construir respuesta de error estructurada
        ERROR_COUNTER.fetch_add(1, Ordering::SeqCst);
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
    
    // [NUEVO] Convertir el tipo de código de barras si es necesario
    // Ampliar el mapeo de tipos para mayor flexibilidad y robustez
    let barcode_type = match payload.barcode_type.to_lowercase().trim() {
        // QR Code y variantes
        "qrcode" | "qr-code" | "qr_code" | "qr" => "qr".to_string(),
        
        // Code 128 y variantes
        "code128" | "code-128" | "code_128" | "code 128" => "code128".to_string(),
        
        // Code 39 y variantes
        "code39" | "code-39" | "code_39" | "code 39" => "code39".to_string(),
        
        // DataMatrix y variantes
        "datamatrix" | "data-matrix" | "data_matrix" | "data matrix" => "datamatrix".to_string(),
        
        // EAN-13 y variantes
        "ean13" | "ean-13" | "ean_13" | "ean 13" => "ean13".to_string(),
        
        // PDF417 y variantes
        "pdf417" | "pdf-417" | "pdf_417" | "pdf 417" => "pdf417".to_string(),
        
        // UPC-A y variantes
        "upca" | "upc-a" | "upc_a" | "upc a" => "upca".to_string(),
        
        // Para tipos no reconocidos específicamente, usamos el valor original en minúsculas
        _ => payload.barcode_type.to_lowercase()
    };
    
    println!(
        "🔄 [{}] Tipo convertido: {} -> {}",
        Local::now().format("%H:%M:%S"),
        payload.barcode_type,
        barcode_type
    );
    
    // Crear clave de caché
    let cache_key = CacheKey {
        barcode_type: barcode_type.clone(),
        data: payload.data.clone(),
        scale,
        error_correction_level: payload.options.as_ref()
            .and_then(|opts| opts.error_correction_level.clone()),
    };

    // Intentar obtener de caché
    if let Some(cache) = CACHE.get() {
        if let Some(cached_svg) = cache.get(&cache_key) {
            let generation_time = start_time.elapsed();
            println!(
                "✅ [{}] REQ-{:06} ÉXITO (CACHÉ) | tipo={}, duración={}ms",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                request_id,
                payload.barcode_type,
                generation_time.as_millis()
            );
            
            return (
                StatusCode::OK, 
                Json(SuccessResponse { 
                    success: true, 
                    svg_string: cached_svg
                })
            ).into_response();
        }
    }

    // Si no está en caché, generarlo normalmente...
    match rust_generator::generate_code(
        &barcode_type,
        &payload.data,
        width_hint,
        height_hint,
        scale,
    ) {
        Ok(svg_string) => {
            let generation_time = start_time.elapsed();
            println!(
                "✅ [{}] REQ-{:06} ÉXITO | tipo={}, duración={}ms",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                request_id,
                payload.barcode_type,
                generation_time.as_millis()
            );

            // Añadir a la caché
            if let Some(cache) = CACHE.get() {
                cache.put(&cache_key, svg_string.clone());
            }

            // Opcional: Alerta para operaciones lentas
            if generation_time.as_millis() > 500 {
                println!(
                    "⚠️ [{}] Generación lenta detectada: {}ms para tipo={}, data_length={}",
                    Local::now().format("%H:%M:%S"),
                    generation_time.as_millis(),
                    payload.barcode_type,
                    payload.data.len()
                );
            }

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
            let generation_time = start_time.elapsed();
            println!(
                "❌ [{}] REQ-{:06} ERROR | tipo={}, error={}, duración={}ms",
                Local::now().format("%H:%M:%S"),
                request_id,
                payload.barcode_type,
                error_message,
                generation_time.as_millis()
            );
            ERROR_COUNTER.fetch_add(1, Ordering::SeqCst);

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

// Endpoint de estado del servicio con métricas en tiempo real
async fn status_handler() -> impl IntoResponse {
    #[derive(serde::Serialize)]
    struct StatusResponse {
        status: &'static str,
        version: &'static str,
        supported_types: Vec<&'static str>,
        memory_usage_mb: Option<f64>,
        uptime_seconds: u64,
        timestamp: String,
        metrics: Metrics,
        cache_stats: Option<CacheStats>,
    }
    
    #[derive(serde::Serialize)]
    struct Metrics {
        total_requests: u64,
        error_requests: u64,
        success_rate_percent: f64,
    }
    
    #[derive(serde::Serialize)]
    struct CacheStats {
        cache_hits: u64,
        cache_misses: u64,
        cache_hit_rate_percent: f64,
        cache_size: usize,
        cache_max_size: usize,
    }
    
    // Calcular métricas
    let total_requests = REQUEST_COUNTER.load(Ordering::Relaxed);
    let error_requests = ERROR_COUNTER.load(Ordering::Relaxed);
    let success_rate = if total_requests > 0 {
        ((total_requests - error_requests) as f64 / total_requests as f64) * 100.0
    } else {
        100.0 // Si no hay solicitudes, asumimos 100% de éxito
    };
    
    // Calcular uptime real
    let uptime = START_TIME.get()
        .map(|start| start.elapsed().as_secs())
        .unwrap_or(0);
    
    // Obtener estadísticas de caché
    let cache_stats = CACHE.get().map(|cache| {
        let (cache_hits, cache_misses, cache_hit_rate, cache_size) = cache.stats();
        CacheStats {
            cache_hits,
            cache_misses,
            cache_hit_rate_percent: (cache_hit_rate * 100.0).round() / 100.0,
            cache_size,
            cache_max_size: cache.max_size,
        }
    });
    
    let response = StatusResponse {
        status: "operational",
        version: env!("CARGO_PKG_VERSION"),
        supported_types: vec![
            "qr", "qrcode", "code128", "pdf417", "datamatrix", 
            "ean13", "ean8", "upca", "upce", "code39", "code93", "aztec", "codabar"
        ],
        memory_usage_mb: None, // Esto requeriría acceso a APIs del sistema
        uptime_seconds: uptime,
        timestamp: chrono::Local::now().to_rfc3339(),
        metrics: Metrics {
            total_requests,
            error_requests,
            success_rate_percent: (success_rate * 100.0).round() / 100.0, // Redondear a 2 decimales
        },
        cache_stats,
    };
    
    (StatusCode::OK, Json(response))
}

// Health check simplificado
async fn health_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok"
    }))
}

// Endpoint para limpiar la caché
async fn clear_cache_handler() -> impl IntoResponse {
    if let Some(cache) = CACHE.get() {
        cache.clear();
        println!("🧹 [{}] Caché limpiada", Local::now().format("%Y-%m-%d %H:%M:%S"));
        (StatusCode::OK, Json(serde_json::json!({ "success": true, "message": "Cache cleared" })))
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "success": false, "error": "Cache not initialized" })))
    }
}