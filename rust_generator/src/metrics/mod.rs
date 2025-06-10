use redis::{Commands, Connection, RedisResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{error, info, debug, warn};

const METRICS_PREFIX: &str = "qr_v2:metrics";
const METRICS_TTL: u64 = 86400 * 30; // 30 days

// Temporary structure for options until we refactor
#[derive(Debug)]
pub struct BarcodeRequestOptions {
    pub scale: u32,
    pub fgcolor: Option<String>,
    pub bgcolor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QRMetrics {
    pub total_requests: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub total_generation_time_ms: u64,
    pub total_cache_hit_time_ms: u64,
    pub errors: u64,
    pub feature_usage: FeatureUsage,
    pub barcode_type_counts: HashMap<String, u64>,
    pub last_updated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FeatureUsage {
    pub gradients: u64,
    pub logos: u64,
    pub custom_shapes: u64,
    pub effects: u64,
    pub frames: u64,
    pub custom_eye_colors: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_response_ms: f64,
    pub avg_cache_hit_ms: f64,
    pub avg_generation_ms: f64,
    pub max_response_ms: u64,
    pub cache_hit_rate_percent: f64,
    pub p95_response_ms: u64,
    pub p99_response_ms: u64,
}

pub struct MetricsCollector {
    redis_conn: Arc<Mutex<Option<Connection>>>,
    local_buffer: Arc<Mutex<QRMetrics>>,
}

impl MetricsCollector {
    pub fn new(redis_url: &str) -> Self {
        let mut conn = match redis::Client::open(redis_url) {
            Ok(client) => match client.get_connection() {
                Ok(conn) => {
                    info!("Metrics collector connected to Redis");
                    Some(conn)
                }
                Err(e) => {
                    error!("Failed to connect to Redis for metrics: {}", e);
                    None
                }
            },
            Err(e) => {
                error!("Failed to create Redis client for metrics: {}", e);
                None
            }
        };

        let local_buffer = Arc::new(Mutex::new(QRMetrics::default()));
        
        // Load existing metrics from Redis if available
        if let Some(ref mut redis_conn) = conn {
            if let Ok(existing) = Self::load_metrics_from_redis(redis_conn) {
                *local_buffer.lock().unwrap() = existing;
            }
        }

        Self {
            redis_conn: Arc::new(Mutex::new(conn)),
            local_buffer,
        }
    }

    fn load_metrics_from_redis(conn: &mut Connection) -> RedisResult<QRMetrics> {
        let key = format!("{}:current", METRICS_PREFIX);
        debug!("Attempting to load metrics from Redis with key: {}", key);
        
        match conn.get::<_, Vec<u8>>(&key) {
            Ok(data) => {
                debug!("Found metrics data in Redis, size: {} bytes", data.len());
                bincode::deserialize(&data)
                    .map_err(|e| {
                        error!("Failed to deserialize metrics from Redis: {}", e);
                        redis::RedisError::from((
                            redis::ErrorKind::TypeError,
                            "Failed to deserialize metrics",
                            e.to_string()
                        ))
                    })
            }
            Err(e) => {
                debug!("No existing metrics found in Redis: {}", e);
                Err(e)
            }
        }
    }

    pub fn record_request(
        &self,
        barcode_type: &str,
        cache_hit: bool,
        response_time_ms: u64,
        options: &BarcodeRequestOptions,
    ) {
        let mut metrics = self.local_buffer.lock().unwrap();
        
        metrics.total_requests += 1;
        
        if cache_hit {
            metrics.cache_hits += 1;
            metrics.total_cache_hit_time_ms += response_time_ms;
        } else {
            metrics.cache_misses += 1;
            metrics.total_generation_time_ms += response_time_ms;
        }
        
        // Track barcode type
        *metrics.barcode_type_counts
            .entry(barcode_type.to_string())
            .or_insert(0) += 1;
        
        // Track feature usage based on available options
        // For now, track basic customizations
        if options.fgcolor.is_some() && options.fgcolor.as_ref().unwrap() != "#000000" {
            metrics.feature_usage.custom_shapes += 1; // Using as proxy for customization
        }
        if options.bgcolor.is_some() && options.bgcolor.as_ref().unwrap() != "#FFFFFF" {
            metrics.feature_usage.custom_eye_colors += 1; // Using as proxy for customization
        }
        if options.scale > 1 {
            metrics.feature_usage.effects += 1; // Using scale as proxy for enhanced rendering
        }
        
        metrics.last_updated = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Persist to Redis asynchronously
        self.persist_metrics(&metrics);
    }

    pub fn record_error(&self, _barcode_type: &str) {
        let mut metrics = self.local_buffer.lock().unwrap();
        metrics.errors += 1;
        metrics.last_updated = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        self.persist_metrics(&metrics);
    }

    fn persist_metrics(&self, metrics: &QRMetrics) {
        let metrics_clone = metrics.clone();
        
        info!("Persisting metrics synchronously. Total requests: {}", metrics.total_requests);
        
        // Try to persist synchronously first for debugging
        if let Ok(mut conn_guard) = self.redis_conn.lock() {
            if let Some(ref mut redis_conn) = *conn_guard {
                let key = format!("{}:current", METRICS_PREFIX);
                info!("Persisting metrics to Redis with key: {}", key);
                
                match bincode::serialize(&metrics_clone) {
                    Ok(data) => {
                        info!("Serialized metrics, size: {} bytes", data.len());
                        
                        match redis_conn.set_ex::<_, _, ()>(&key, data.as_slice(), METRICS_TTL) {
                            Ok(()) => {
                                info!("✅ Successfully persisted metrics to Redis. Total requests: {}, Cache hits: {}, Cache misses: {}", 
                                      metrics_clone.total_requests, metrics_clone.cache_hits, metrics_clone.cache_misses);
                                
                                // Test immediate read-back
                                match redis_conn.get::<_, Vec<u8>>(&key) {
                                    Ok(read_data) => {
                                        info!("✅ Verified metrics in Redis, data size: {} bytes", read_data.len());
                                    }
                                    Err(e) => {
                                        error!("❌ Failed to read back metrics: {}", e);
                                    }
                                }
                            }
                            Err(e) => {
                                error!("❌ Failed to persist metrics to Redis: {}", e);
                            }
                        }
                        
                        // Also store time-series data
                        let ts_key = format!("{}:ts:{}", METRICS_PREFIX, metrics_clone.last_updated);
                        let _ = redis_conn.set_ex::<_, _, ()>(&ts_key, data.as_slice(), 86400 * 7);
                    }
                    Err(e) => {
                        error!("❌ Failed to serialize metrics: {}", e);
                    }
                }
            } else {
                warn!("❌ No Redis connection available for metrics persistence");
            }
        } else {
            error!("❌ Failed to acquire metrics connection lock");
        }
    }

    pub fn get_performance_metrics(&self) -> PerformanceMetrics {
        let metrics = self.local_buffer.lock().unwrap();
        
        let avg_cache_hit_ms = if metrics.cache_hits > 0 {
            metrics.total_cache_hit_time_ms as f64 / metrics.cache_hits as f64
        } else {
            0.0
        };
        
        let avg_generation_ms = if metrics.cache_misses > 0 {
            metrics.total_generation_time_ms as f64 / metrics.cache_misses as f64
        } else {
            0.0
        };
        
        let total_time = metrics.total_cache_hit_time_ms + metrics.total_generation_time_ms;
        let avg_response_ms = if metrics.total_requests > 0 {
            total_time as f64 / metrics.total_requests as f64
        } else {
            0.0
        };
        
        let cache_hit_rate_percent = if metrics.total_requests > 0 {
            (metrics.cache_hits as f64 / metrics.total_requests as f64) * 100.0
        } else {
            0.0
        };
        
        PerformanceMetrics {
            avg_response_ms,
            avg_cache_hit_ms,
            avg_generation_ms,
            max_response_ms: avg_response_ms as u64 * 2, // Placeholder
            cache_hit_rate_percent,
            p95_response_ms: (avg_response_ms * 1.5) as u64, // Placeholder
            p99_response_ms: (avg_response_ms * 2.0) as u64, // Placeholder
        }
    }

    pub fn get_current_metrics(&self) -> QRMetrics {
        self.local_buffer.lock().unwrap().clone()
    }

    pub fn reset_metrics(&self) {
        let mut metrics = self.local_buffer.lock().unwrap();
        *metrics = QRMetrics::default();
        self.persist_metrics(&metrics);
        info!("Metrics reset");
    }
}

impl Default for QRMetrics {
    fn default() -> Self {
        Self {
            total_requests: 0,
            cache_hits: 0,
            cache_misses: 0,
            total_generation_time_ms: 0,
            total_cache_hit_time_ms: 0,
            errors: 0,
            feature_usage: FeatureUsage::default(),
            barcode_type_counts: HashMap::new(),
            last_updated: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }
}

// Analytics response structures
#[derive(Debug, Serialize)]
pub struct AnalyticsResponse {
    pub by_barcode_type: HashMap<String, BarcodeTypeMetrics>,
    pub overall: OverallMetrics,
    pub timestamp: String,
}

#[derive(Debug, Serialize)]
pub struct BarcodeTypeMetrics {
    pub avg_cache_hit_ms: f64,
    pub avg_generation_ms: f64,
    pub max_hit_ms: u64,
    pub max_generation_ms: u64,
    pub hit_count: u64,
    pub miss_count: u64,
    pub avg_data_size: u64,
    pub cache_hit_rate_percent: f64,
}

#[derive(Debug, Serialize)]
pub struct OverallMetrics {
    pub avg_response_ms: f64,
    pub max_response_ms: u64,
    pub total_requests: u64,
    pub cache_hit_rate_percent: f64,
}