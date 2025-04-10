// main.rs actualizado con integración del sistema de validación, caché y métricas de rendimiento

// Imports necesarios
use axum::{
    extract::Json,
    http::{header, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Router,
};
mod validators; // Importamos el nuevo módulo de validadores
use validators::{BarcodeRequest, validate_barcode_request}; // Quita ValidationError
use std::net::SocketAddr;
use std::time::{Instant, Duration}; // Actualizando importación de tiempo
use std::sync::{Arc, OnceLock}; // Añade Arc y OnceLock
use chrono::Local;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;

// Imports adicionales para caché y métricas
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use dashmap::DashMap;
use std::collections::HashMap;

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
    expires_at: Instant, // Añadido para manejar tiempos de expiración
    access_count: u64,
}

// Estructura para métricas de rendimiento
#[derive(Clone)]
struct PerformanceMetric {
    duration_ms: u64,
    data_size: usize,
    timestamp: Instant,
}

// Estructura global de caché
struct GenerationCache {
    cache: Arc<DashMap<u64, CacheEntry>>,
    hits: AtomicU64,
    misses: AtomicU64,
    max_size: usize,
    default_ttl_secs: AtomicU64,  // Cambiado a AtomicU64
    expired_items_removed: AtomicU64,
    cache_hit_metrics: Arc<DashMap<String, Vec<PerformanceMetric>>>,
    cache_miss_metrics: Arc<DashMap<String, Vec<PerformanceMetric>>>,
    metrics_retention_count: usize, // Número máximo de métricas a retener por tipo
}

impl GenerationCache {
    fn new(max_size: usize, default_ttl_secs: u64) -> Self {
        let cache = Self {
            cache: Arc::new(DashMap::with_capacity(max_size)),
            hits: AtomicU64::new(0),
            misses: AtomicU64::new(0),
            max_size,
            default_ttl_secs: AtomicU64::new(default_ttl_secs),
            expired_items_removed: AtomicU64::new(0),
            cache_hit_metrics: Arc::new(DashMap::new()),
            cache_miss_metrics: Arc::new(DashMap::new()),
            metrics_retention_count: 1000, // Retener las últimas 1000 métricas por tipo
        };
        
        // Crear Arc para pasar al thread
        if default_ttl_secs > 0 {
            let cache_ref = Arc::clone(&cache.cache);
            let cache_arc = Arc::new(cache);
            let cache_cleanup_ref = Arc::clone(&cache_arc);
            
            std::thread::spawn(move || {
                // Thread de limpieza usando Arc
                loop {
                    thread::sleep(Duration::from_secs(60));
                    let now = Instant::now();
                    
                    // Recolectar claves expiradas
                    let expired_keys: Vec<u64> = cache_ref.iter()
                        .filter(|entry| now > entry.value().expires_at)
                        .map(|entry| *entry.key())
                        .collect();
                    
                    // Eliminar entradas expiradas
                    let count = expired_keys.len();
                    for key in expired_keys {
                        cache_ref.remove(&key);
                    }
                    
                    if count > 0 {
                        cache_cleanup_ref.expired_items_removed.fetch_add(count as u64, Ordering::SeqCst);
                        println!(
                            "🧹 [{}] Limpieza automática: {} entradas expiradas eliminadas", 
                            Local::now().format("%Y-%m-%d %H:%M:%S"),
                            count
                        );
                    }
                }
            });
            
            match Arc::try_unwrap(cache_arc) {
                Ok(cache) => cache,
                Err(arc) => (*arc).clone(),
            }
        } else {
            cache
        }
    }

    // Obtiene un valor de la caché si existe y no ha expirado
    fn get(&self, key: &CacheKey) -> Option<String> {
        let hash = self.calculate_hash(key);
        
        if let Some(mut entry) = self.cache.get_mut(&hash) {
            let now = Instant::now();
            
            if now > entry.expires_at {
                let key_to_remove = hash;
                drop(entry);
                self.cache.remove(&key_to_remove);
                self.expired_items_removed.fetch_add(1, Ordering::SeqCst);
                self.misses.fetch_add(1, Ordering::SeqCst);
                return None;
            }
            
            entry.last_accessed = now;
            entry.access_count += 1;
            self.hits.fetch_add(1, Ordering::SeqCst);
            Some(entry.svg.clone())
        } else {
            self.misses.fetch_add(1, Ordering::SeqCst);
            None
        }
    }

    // Almacena un valor en la caché con el TTL predeterminado
    fn put(&self, key: &CacheKey, svg: String) {
        let ttl_secs = self.default_ttl_secs.load(Ordering::Relaxed);
        self.put_with_ttl(key, svg, Duration::from_secs(ttl_secs));
    }
    
    // Almacena un valor en la caché con un TTL específico
    fn put_with_ttl(&self, key: &CacheKey, svg: String, ttl: Duration) {
        let hash = self.calculate_hash(key);
        let now = Instant::now();
        
        if self.cache.len() >= self.max_size {
            self.evict_entries();
        }
        
        self.cache.insert(hash, CacheEntry {
            svg,
            created_at: now,
            last_accessed: now,
            expires_at: now + ttl,
            access_count: 1,
        });
    }
    
    // Elimina entradas según política LRU (Least Recently Used)
    fn evict_entries(&self) {
        let oldest_key = self.cache.iter()
            .min_by_key(|entry| entry.value().last_accessed)
            .map(|entry| *entry.key());
            
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
    
    // Elimina todas las entradas expiradas
    fn cleanup_expired(&self) -> usize {
        let now = Instant::now();
        let mut expired_count = 0;
        
        let expired_keys: Vec<u64> = self.cache.iter()
            .filter(|entry| now > entry.value().expires_at)
            .map(|entry| *entry.key())
            .collect();
        
        for key in expired_keys.iter() {
            self.cache.remove(key);
            expired_count += 1;
        }
        
        if expired_count > 0 {
            self.expired_items_removed.fetch_add(expired_count as u64, Ordering::SeqCst);
        }
        
        expired_count
    }
    
    // Devuelve estadísticas de la caché incluyendo expiración
    fn stats(&self) -> (u64, u64, f64, usize, u64) {
        let hits = self.hits.load(Ordering::Relaxed);
        let misses = self.misses.load(Ordering::Relaxed);
        let total = hits + misses;
        let hit_rate = if total > 0 {
            (hits as f64 / total as f64) * 100.0
        } else {
            0.0
        };
        
        let expired_items_removed = self.expired_items_removed.load(Ordering::Relaxed);
        
        (hits, misses, hit_rate, self.cache.len(), expired_items_removed)
    }
    
    // Limpia toda la caché
    fn clear(&self) {
        self.cache.clear();
        self.hits.store(0, Ordering::SeqCst);
        self.misses.store(0, Ordering::SeqCst);
        self.expired_items_removed.store(0, Ordering::SeqCst);
    }

    // Devuelve el TTL predeterminado en segundos
    fn get_default_ttl_secs(&self) -> u64 {
        self.default_ttl_secs.load(Ordering::Relaxed)
    }

    // Actualiza el TTL predeterminado
    fn set_default_ttl(&self, ttl_secs: u64) {
        self.default_ttl_secs.store(ttl_secs, Ordering::SeqCst);
    }

    // Registrar métricas de caché hit
    fn record_cache_hit(&self, barcode_type: &str, duration_ms: u64, data_size: usize) {
        let metric = PerformanceMetric {
            duration_ms,
            data_size,
            timestamp: Instant::now(),
        };
        
        let mut entry = self.cache_hit_metrics
            .entry(barcode_type.to_string())
            .or_insert_with(Vec::new);
            
        entry.push(metric);
        
        // Limitar el tamaño para evitar consumo excesivo de memoria
        if entry.len() > self.metrics_retention_count {
            let drain_count = entry.len() - self.metrics_retention_count;
            let mut entry = self.cache_hit_metrics.get_mut(&barcode_type.to_string()).unwrap();
            entry.drain(0..drain_count);
        }
    }
    
    // Corregir el método record_generation
    fn record_generation(&self, barcode_type: &str, duration_ms: u64, data_size: usize) {
        let metric = PerformanceMetric {
            duration_ms,
            data_size,
            timestamp: Instant::now(),
        };
        
        let mut entry = self.cache_miss_metrics
            .entry(barcode_type.to_string())
            .or_insert_with(Vec::new);
            
        entry.push(metric);
        
        // Limitar el tamaño para evitar consumo excesivo de memoria
        if entry.len() > self.metrics_retention_count {
            let drain_count = entry.len() - self.metrics_retention_count;
            let mut entry = self.cache_miss_metrics.get_mut(&barcode_type.to_string()).unwrap();
            entry.drain(0..drain_count);
        }
    }
    
    // Corregir get_performance_analytics para manejar correctamente los Refs
    fn get_performance_analytics(&self) -> PerformanceAnalytics {
        let mut by_type = HashMap::new();
        let mut overall_hits = 0u64;
        let mut overall_misses = 0u64;
        let mut overall_hit_duration_sum = 0u64;
        let mut overall_miss_duration_sum = 0u64;
        let mut overall_max_hit = 0u64;
        let mut overall_max_miss = 0u64;
        
        let all_types: Vec<String> = self.cache_hit_metrics.iter()
            .map(|entry| entry.key().clone())
            .chain(self.cache_miss_metrics.iter().map(|entry| entry.key().clone()))
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
            
        for barcode_type in all_types {
            // Evitar el uso de clone() en Ref
            let hits: Vec<PerformanceMetric> = if let Some(metrics) = self.cache_hit_metrics.get(&barcode_type) {
                metrics.iter().cloned().collect()
            } else {
                Vec::new()
            };
            
            let misses: Vec<PerformanceMetric> = if let Some(metrics) = self.cache_miss_metrics.get(&barcode_type) {
                metrics.iter().cloned().collect()
            } else {
                Vec::new()
            };
            
            let hit_count = hits.len() as u64;
            let miss_count = misses.len() as u64;
            
            let hit_sum: u64 = hits.iter().map(|m| m.duration_ms).sum();
            let max_hit = hits.iter().map(|m| m.duration_ms).max().unwrap_or(0);
            let avg_hit = if hit_count > 0 { hit_sum as f64 / hit_count as f64 } else { 0.0 };
            
            let miss_sum: u64 = misses.iter().map(|m| m.duration_ms).sum();
            let max_miss = misses.iter().map(|m| m.duration_ms).max().unwrap_or(0);
            let avg_miss = if miss_count > 0 { miss_sum as f64 / miss_count as f64 } else { 0.0 };
            
            let total_data_size: usize = hits.iter().map(|m| m.data_size).sum::<usize>() + 
                                        misses.iter().map(|m| m.data_size).sum::<usize>();
            let avg_data_size = if (hit_count + miss_count) > 0 {
                total_data_size / (hit_count + miss_count) as usize
            } else {
                0
            };
            
            let type_hit_rate = if (hit_count + miss_count) > 0 {
                (hit_count as f64 / (hit_count + miss_count) as f64) * 100.0
            } else {
                0.0
            };
            
            by_type.insert(barcode_type.clone(), TypePerformance {
                avg_cache_hit_ms: avg_hit,
                avg_generation_ms: avg_miss,
                max_hit_ms: max_hit,
                max_generation_ms: max_miss,
                hit_count,
                miss_count,
                avg_data_size,
                cache_hit_rate_percent: type_hit_rate,
            });
            
            overall_hits += hit_count;
            overall_misses += miss_count;
            overall_hit_duration_sum += hit_sum;
            overall_miss_duration_sum += miss_sum;
            overall_max_hit = overall_max_hit.max(max_hit);
            overall_max_miss = overall_max_miss.max(max_miss);
        }
        
        let total_requests = overall_hits + overall_misses;
        let overall_duration_sum = overall_hit_duration_sum + overall_miss_duration_sum;
        let overall_avg_duration = if total_requests > 0 {
            overall_duration_sum as f64 / total_requests as f64
        } else {
            0.0
        };
        
        let overall_hit_rate = if total_requests > 0 {
            (overall_hits as f64 / total_requests as f64) * 100.0
        } else {
            0.0
        };
        
        PerformanceAnalytics {
            by_barcode_type: by_type,
            overall: OverallPerformance {
                avg_response_ms: overall_avg_duration,
                max_response_ms: overall_max_hit.max(overall_max_miss),
                total_requests,
                cache_hit_rate_percent: overall_hit_rate,
            },
            timestamp: chrono::Local::now().to_rfc3339(),
        }
    }
}

#[derive(serde::Serialize)]
struct PerformanceAnalytics {
    by_barcode_type: HashMap<String, TypePerformance>,
    overall: OverallPerformance,
    timestamp: String,
}

#[derive(serde::Serialize)]
struct TypePerformance {
    avg_cache_hit_ms: f64,
    avg_generation_ms: f64,
    max_hit_ms: u64,
    max_generation_ms: u64,
    hit_count: u64,
    miss_count: u64,
    avg_data_size: usize,
    cache_hit_rate_percent: f64,
}

#[derive(serde::Serialize)]
struct OverallPerformance {
    avg_response_ms: f64,
    max_response_ms: u64,
    total_requests: u64,
    cache_hit_rate_percent: f64,
}

// Para que esto funcione, implementamos Clone para GenerationCache
impl Clone for GenerationCache {
    fn clone(&self) -> Self {
        Self {
            cache: Arc::clone(&self.cache),
            hits: AtomicU64::new(self.hits.load(Ordering::Relaxed)),
            misses: AtomicU64::new(self.misses.load(Ordering::Relaxed)),
            max_size: self.max_size,
            default_ttl_secs: AtomicU64::new(self.default_ttl_secs.load(Ordering::Relaxed)),
            expired_items_removed: AtomicU64::new(self.expired_items_removed.load(Ordering::Relaxed)),
            cache_hit_metrics: Arc::clone(&self.cache_hit_metrics),
            cache_miss_metrics: Arc::clone(&self.cache_miss_metrics),
            metrics_retention_count: self.metrics_retention_count,
        }
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
    let _ = START_TIME.set(Instant::now());
    let _ = CACHE.set(GenerationCache::new(100, 60));
    
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/generate", post(generate_handler))
        .route("/status", get(status_handler))
        .route("/health", get(health_handler))
        .route("/cache/clear", post(clear_cache_handler))
        .route("/cache/config", post(configure_cache_handler))
        .route("/analytics/performance", get(performance_analytics_handler));
    
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

// Añade esta función después de la función main() y antes de generate_handler()
async fn root_handler() -> &'static str {
    "Servicio de Generación de Códigos (Rust/Axum) - OK"
}

// --- Handlers ---
async fn generate_handler(Json(payload): Json<BarcodeRequest>) -> impl IntoResponse {
    let request_id = REQUEST_COUNTER.fetch_add(1, Ordering::SeqCst);
    let start_time = Instant::now();

    println!(
        "📝 [{}] REQ-{:06} INICIO | tipo={}, data_length={}, opciones={:?}",
        Local::now().format("%Y-%m-%d %H:%M:%S"),
        request_id,
        payload.barcode_type,
        payload.data.len(),
        payload.options
    );

    if let Err(validation_error) = validate_barcode_request(&payload) {
        println!("Error de validación: {}", validation_error);
        
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
    
    let scale = payload.options.as_ref().map_or_else(
        validators::default_scale, 
        |opts| opts.scale
    );
    
    let width_hint = 0;
    let height_hint = 0;
    
    let barcode_type = match payload.barcode_type.to_lowercase().trim() {
        "qrcode" | "qr-code" | "qr_code" | "qr" => "qr".to_string(),
        "code128" | "code-128" | "code_128" | "code 128" => "code128".to_string(),
        "code39" | "code-39" | "code_39" | "code 39" => "code39".to_string(),
        "datamatrix" | "data-matrix" | "data_matrix" | "data matrix" => "datamatrix".to_string(),
        "ean13" | "ean-13" | "ean_13" | "ean 13" => "ean13".to_string(),
        "pdf417" | "pdf-417" | "pdf_417" | "pdf 417" => "pdf417".to_string(),
        "upca" | "upc-a" | "upc_a" | "upc a" => "upca".to_string(),
        _ => payload.barcode_type.to_lowercase()
    };
    
    println!(
        "🔄 [{}] Tipo convertido: {} -> {}",
        Local::now().format("%H:%M:%S"),
        payload.barcode_type,
        barcode_type
    );
    
    let cache_key = CacheKey {
        barcode_type: barcode_type.clone(),
        data: payload.data.clone(),
        scale,
        error_correction_level: payload.options.as_ref()
            .and_then(|opts| opts.error_correction_level.clone()),
    };

    let custom_ttl = payload.options.as_ref()
        .and_then(|opts| opts.ttl_seconds)
        .map(|secs| Duration::from_secs(secs));

    if let Some(cache) = CACHE.get() {
        if let Some(cached_svg) = cache.get(&cache_key) {
            let duration_ms = start_time.elapsed().as_millis() as u64;
            cache.record_cache_hit(&barcode_type, duration_ms, payload.data.len());
            
            println!(
                "✅ [{}] REQ-{:06} ÉXITO (CACHÉ) | tipo={}, duración={}ms",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                request_id,
                payload.barcode_type,
                duration_ms
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

    match rust_generator::generate_code(
        &barcode_type,
        &payload.data,
        width_hint,
        height_hint,
        scale,
    ) {
        Ok(svg_string) => {
            let duration_ms = start_time.elapsed().as_millis() as u64;
            
            if let Some(cache) = CACHE.get() {
                cache.record_generation(&barcode_type, duration_ms, payload.data.len());
                if let Some(ttl) = custom_ttl {
                    cache.put_with_ttl(&cache_key, svg_string.clone(), ttl);
                } else {
                    cache.put(&cache_key, svg_string.clone());
                }
            }

            println!(
                "✅ [{}] REQ-{:06} ÉXITO | tipo={}, duración={}ms",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                request_id,
                payload.barcode_type,
                duration_ms
            );

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
            let duration_ms = start_time.elapsed().as_millis() as u64;
            println!(
                "❌ [{}] REQ-{:06} ERROR | tipo={}, error={}, duración={}ms",
                Local::now().format("%H:%M:%S"),
                request_id,
                payload.barcode_type,
                error_message,
                duration_ms
            );
            ERROR_COUNTER.fetch_add(1, Ordering::SeqCst);

            let status_code = if error_message.contains("Tipo de código no soportado") 
                              || error_message.contains("Bad character") {
                StatusCode::BAD_REQUEST
            } else {
                StatusCode::INTERNAL_SERVER_ERROR
            };
            
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
        cache_default_ttl_seconds: u64,
        expired_items_removed: u64,
    }
    
    let total_requests = REQUEST_COUNTER.load(Ordering::Relaxed);
    let error_requests = ERROR_COUNTER.load(Ordering::Relaxed);
    let success_rate = if total_requests > 0 {
        ((total_requests - error_requests) as f64 / total_requests as f64) * 100.0
    } else {
        100.0
    };
    
    let uptime = START_TIME.get()
        .map(|start| start.elapsed().as_secs())
        .unwrap_or(0);
    
    let cache_stats = CACHE.get().map(|cache| {
        let (cache_hits, cache_misses, cache_hit_rate, cache_size, expired_removed) = cache.stats();
        CacheStats {
            cache_hits,
            cache_misses,
            cache_hit_rate_percent: (cache_hit_rate * 100.0).round() / 100.0,
            cache_size,
            cache_max_size: cache.max_size,
            cache_default_ttl_seconds: cache.get_default_ttl_secs(),
            expired_items_removed: expired_removed,
        }
    });
    
    let response = StatusResponse {
        status: "operational",
        version: env!("CARGO_PKG_VERSION"),
        supported_types: vec![
            "qr", "qrcode", "code128", "pdf417", "datamatrix", 
            "ean13", "ean8", "upca", "upce", "code39", "code93", "aztec", "codabar"
        ],
        memory_usage_mb: None,
        uptime_seconds: uptime,
        timestamp: chrono::Local::now().to_rfc3339(),
        metrics: Metrics {
            total_requests,
            error_requests,
            success_rate_percent: (success_rate * 100.0).round() / 100.0,
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

// Endpoint para configurar la caché
#[derive(serde::Deserialize)]
struct CacheConfigRequest {
    default_ttl_seconds: u64,
}

async fn configure_cache_handler(Json(payload): Json<CacheConfigRequest>) -> impl IntoResponse {
    if let Some(cache) = CACHE.get() {
        let old_ttl = cache.get_default_ttl_secs();
        cache.set_default_ttl(payload.default_ttl_seconds);
        
        println!(
            "⚙️ [{}] Configuración de caché actualizada: TTL predeterminado {} -> {} segundos", 
            Local::now().format("%Y-%m-%d %H:%M:%S"),
            old_ttl,
            payload.default_ttl_seconds
        );
        
        (StatusCode::OK, Json(serde_json::json!({
            "success": true, 
            "message": "Cache configuration updated",
            "old_ttl_seconds": old_ttl,
            "new_ttl_seconds": payload.default_ttl_seconds
        })))
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({
            "success": false, 
            "error": "Cache not initialized"
        })))
    }
}

// Endpoint para análisis de rendimiento
async fn performance_analytics_handler() -> impl IntoResponse {
    println!("📊 [{}] Solicitud de analytics/performance recibida", 
             Local::now().format("%Y-%m-%d %H:%M:%S"));
             
    if let Some(cache) = CACHE.get() {
        match serde_json::to_string(&cache.get_performance_analytics()) {
            Ok(json) => {
                println!("✅ [{}] Analytics generados correctamente", 
                         Local::now().format("%Y-%m-%d %H:%M:%S"));
                (StatusCode::OK, [(header::CONTENT_TYPE, "application/json")], json)
            },
            Err(e) => {
                println!("❌ [{}] Error serializando analytics: {}", 
                         Local::now().format("%Y-%m-%d %H:%M:%S"), e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    [(header::CONTENT_TYPE, "application/json")],
                    format!("{{\"error\":\"Error serializando respuesta: {}\",\"success\":false}}", e)
                )
            }
        }
    } else {
        println!("❌ [{}] Cache no inicializado al solicitar analytics", 
                 Local::now().format("%Y-%m-%d %H:%M:%S"));
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            [(header::CONTENT_TYPE, "application/json")],
            "{\"error\":\"Cache not initialized\",\"success\":false}".to_string()
        )
    }
}