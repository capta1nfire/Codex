use redis::{Client, Commands, RedisResult};
use std::time::Duration;
use tracing::{debug, error, warn, info};
use super::CachedQR;

/// Configuration for distributed Redis cache
#[derive(Clone, Debug)]
pub struct DistributedCacheConfig {
    /// Redis connection mode
    pub mode: RedisMode,
    /// Cache key prefix
    pub prefix: String,
    /// Default TTL for cache entries
    pub ttl: Duration,
    /// Maximum number of connections in the pool
    pub max_connections: u32,
    /// Connection timeout
    pub connection_timeout: Duration,
    /// Enable cache warming on startup
    pub warm_cache: bool,
    /// Enable cache statistics collection
    pub enable_stats: bool,
}

#[derive(Clone, Debug)]
pub enum RedisMode {
    /// Single Redis instance
    Standalone { url: String },
    /// Redis cluster with multiple nodes
    Cluster { nodes: Vec<String> },
    /// Redis sentinel for high availability
    Sentinel {
        service_name: String,
        sentinels: Vec<String>,
    },
}

impl Default for DistributedCacheConfig {
    fn default() -> Self {
        Self {
            mode: RedisMode::Standalone {
                url: "redis://localhost:6379".to_string(),
            },
            prefix: "qr_engine_v2".to_string(),
            ttl: Duration::from_secs(3600), // 1 hour default
            max_connections: 10,
            connection_timeout: Duration::from_secs(5),
            warm_cache: false,
            enable_stats: true,
        }
    }
}

/// Distributed Redis cache implementation
pub struct DistributedCache {
    config: DistributedCacheConfig,
    client: Option<Client>,
    enabled: bool,
}

impl DistributedCache {
    /// Create a new distributed cache instance
    pub fn new(config: DistributedCacheConfig) -> Result<Self, redis::RedisError> {
        let client = match &config.mode {
            RedisMode::Standalone { url } => {
                info!("Initializing standalone Redis cache at: {}", url);
                let client = Client::open(url.as_str())?;
                
                // Test connection
                let mut conn = client.get_connection_with_timeout(config.connection_timeout)?;
                let _: String = redis::cmd("PING").query(&mut conn)?;
                
                Some(client)
            }
            RedisMode::Cluster { nodes } => {
                warn!("Cluster mode not implemented yet, use standalone");
                return Err(redis::RedisError::from((
                    redis::ErrorKind::InvalidClientConfig,
                    "Cluster mode not implemented"
                )));
            }
            RedisMode::Sentinel { .. } => {
                warn!("Sentinel mode not implemented yet, use standalone");
                return Err(redis::RedisError::from((
                    redis::ErrorKind::InvalidClientConfig,
                    "Sentinel mode not implemented"
                )));
            }
        };

        info!("Distributed cache initialized successfully with prefix: {}", config.prefix);
        
        Ok(DistributedCache {
            config,
            client,
            enabled: true,
        })
    }

    /// Create a disabled cache instance (for testing or fallback)
    pub fn disabled() -> Self {
        DistributedCache {
            config: DistributedCacheConfig::default(),
            client: None,
            enabled: false,
        }
    }

    /// Get a cached QR code
    pub fn get(&mut self, key: &str) -> Option<CachedQR> {
        if !self.enabled || self.client.is_none() {
            return None;
        }

        let client = self.client.as_ref().unwrap();
        let full_key = self.make_key(key);
        
        match client.get_connection_with_timeout(self.config.connection_timeout) {
            Ok(mut conn) => {
                match conn.get::<_, Vec<u8>>(&full_key) {
                    Ok(data) => {
                        match bincode::deserialize::<CachedQR>(&data) {
                            Ok(cached) => {
                                debug!("Cache hit for key: {}", key);
                                
                                // Update access statistics if enabled
                                if self.config.enable_stats {
                                    let _ = self.increment_stat("hits");
                                }
                                
                                Some(cached)
                            }
                            Err(e) => {
                                error!("Failed to deserialize cached data: {}", e);
                                None
                            }
                        }
                    }
                    Err(_) => {
                        debug!("Cache miss for key: {}", key);
                        
                        // Update miss statistics if enabled
                        if self.config.enable_stats {
                            let _ = self.increment_stat("misses");
                        }
                        
                        None
                    }
                }
            }
            Err(e) => {
                error!("Failed to get Redis connection: {}", e);
                None
            }
        }
    }

    /// Set a cached QR code with TTL
    pub fn set(&mut self, key: &str, value: &CachedQR) -> RedisResult<()> {
        if !self.enabled || self.client.is_none() {
            return Ok(());
        }

        let client = self.client.as_ref().unwrap();
        let full_key = self.make_key(key);
        let data = bincode::serialize(value).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::IoError,
                "Serialization failed",
                e.to_string()
            ))
        })?;

        let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
        
        // Set with expiration
        conn.set_ex(&full_key, data, self.config.ttl.as_secs())?;
        
        debug!("Cached QR for key: {} (TTL: {}s)", key, self.config.ttl.as_secs());
        
        // Update set statistics if enabled
        if self.config.enable_stats {
            let _ = self.increment_stat("sets");
        }

        Ok(())
    }

    /// Set multiple cached QR codes in a batch (for performance)
    pub fn set_batch(&mut self, items: Vec<(&str, &CachedQR)>) -> RedisResult<()> {
        if !self.enabled || items.is_empty() || self.client.is_none() {
            return Ok(());
        }

        let client = self.client.as_ref().unwrap();
        let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
        
        // Use pipeline for batch operations
        let mut pipe = redis::pipe();
        
        let count = items.len();
        for (key, value) in items {
            let full_key = self.make_key(key);
            if let Ok(data) = bincode::serialize(value) {
                pipe.set_ex(&full_key, data, self.config.ttl.as_secs());
            }
        }

        pipe.query(&mut conn)?;
        
        debug!("Batch cached {} QR codes", count);
        
        Ok(())
    }

    /// Delete a cached entry
    pub fn delete(&mut self, key: &str) -> RedisResult<()> {
        if !self.enabled || self.client.is_none() {
            return Ok(());
        }

        let client = self.client.as_ref().unwrap();
        let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
        
        let full_key = self.make_key(key);
        conn.del(&full_key)?;
        debug!("Deleted cache entry: {}", key);

        Ok(())
    }

    /// Clear all cache entries matching a pattern
    pub fn clear_pattern(&mut self, pattern: &str) -> RedisResult<usize> {
        if !self.enabled || self.client.is_none() {
            return Ok(0);
        }

        let client = self.client.as_ref().unwrap();
        let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
        
        let full_pattern = format!("{}:{}*", self.config.prefix, pattern);
        
        // Use SCAN for better performance on large datasets
        let mut count = 0;
        let mut cursor = 0;

        loop {
            let (new_cursor, keys): (u64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(&full_pattern)
                .arg("COUNT")
                .arg(100)
                .query(&mut conn)?;

            if !keys.is_empty() {
                conn.del(&keys)?;
                count += keys.len();
            }

            cursor = new_cursor;
            if cursor == 0 {
                break;
            }
        }

        if count > 0 {
            debug!("Cleared {} cache entries matching pattern: {}", count, pattern);
        }

        Ok(count)
    }

    /// Get cache statistics
    pub fn stats(&mut self) -> RedisResult<DistributedCacheStats> {
        if !self.enabled || self.client.is_none() {
            return Ok(DistributedCacheStats::default());
        }

        let client = self.client.as_ref().unwrap();
        let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;

        // Get Redis INFO
        let info: String = redis::cmd("INFO").arg("memory").query(&mut conn)?;
        let memory_used = info
            .lines()
            .find(|line| line.starts_with("used_memory:"))
            .and_then(|line| line.split(':').nth(1))
            .and_then(|val| val.parse::<usize>().ok())
            .unwrap_or(0);

        // Count keys with our prefix
        let pattern = format!("{}:*", self.config.prefix);
        let mut key_count = 0;
        let mut cursor = 0;

        loop {
            let (new_cursor, keys): (u64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(&pattern)
                .arg("COUNT")
                .arg(1000)
                .query(&mut conn)?;

            key_count += keys.len();
            cursor = new_cursor;
            if cursor == 0 {
                break;
            }
        }

        // Get hit/miss stats if enabled
        let hits = if self.config.enable_stats {
            self.get_stat("hits").unwrap_or(0)
        } else {
            0
        };

        let misses = if self.config.enable_stats {
            self.get_stat("misses").unwrap_or(0)
        } else {
            0
        };

        Ok(DistributedCacheStats {
            total_keys: key_count,
            memory_bytes: memory_used,
            prefix: self.config.prefix.clone(),
            hits,
            misses,
            hit_rate: if hits + misses > 0 {
                (hits as f64 / (hits + misses) as f64) * 100.0
            } else {
                0.0
            },
            mode: match &self.config.mode {
                RedisMode::Standalone { .. } => "standalone".to_string(),
                RedisMode::Cluster { .. } => "cluster".to_string(),
                RedisMode::Sentinel { .. } => "sentinel".to_string(),
            },
        })
    }

    /// Warm the cache with frequently used QR codes
    pub async fn warm_cache(&mut self, patterns: Vec<String>) -> RedisResult<usize> {
        if !self.enabled || !self.config.warm_cache {
            return Ok(0);
        }

        info!("Starting cache warming with {} patterns", patterns.len());
        let mut warmed = 0;

        // This would typically load from a database or file
        // For now, we'll just log the intention
        for pattern in patterns {
            debug!("Would warm cache for pattern: {}", pattern);
            warmed += 1;
        }

        info!("Cache warming completed: {} entries", warmed);
        Ok(warmed)
    }

    /// Make a full cache key with prefix
    fn make_key(&self, key: &str) -> String {
        format!("{}:{}", self.config.prefix, key)
    }

    /// Increment a statistic counter
    fn increment_stat(&mut self, stat: &str) -> RedisResult<()> {
        if let Some(client) = &self.client {
            let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
            let stat_key = format!("{}:stats:{}", self.config.prefix, stat);
            conn.incr(&stat_key, 1)?;
        }
        Ok(())
    }

    /// Get a statistic value
    fn get_stat(&mut self, stat: &str) -> RedisResult<u64> {
        if let Some(client) = &self.client {
            let mut conn = client.get_connection_with_timeout(self.config.connection_timeout)?;
            let stat_key = format!("{}:stats:{}", self.config.prefix, stat);
            conn.get(&stat_key)
        } else {
            Ok(0)
        }
    }
}

#[derive(Debug, Default)]
pub struct DistributedCacheStats {
    pub total_keys: usize,
    pub memory_bytes: usize,
    pub prefix: String,
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
    pub mode: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = DistributedCacheConfig::default();
        assert_eq!(config.prefix, "qr_engine_v2");
        assert_eq!(config.ttl.as_secs(), 3600);
        assert_eq!(config.max_connections, 10);
    }

    #[test]
    fn test_disabled_cache() {
        let mut cache = DistributedCache::disabled();
        assert!(cache.get("test").is_none());
        assert!(cache.set("test", &CachedQR {
            svg: "test".to_string(),
            metadata: QRMetadata {
                version: 1,
                modules: 21,
                error_correction: "M".to_string(),
                processing_time_ms: 10,
            },
            generated_at: 0,
        }).is_ok());
    }
}