use redis::{Client, Commands, RedisResult};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{debug, error, warn};

#[derive(Clone)]
pub struct RedisCache {
    client: Client,
    prefix: String,
    ttl: Duration,
    enabled: bool,
}

#[derive(Serialize, Deserialize)]
pub struct CachedQR {
    pub svg: String,
    pub metadata: QRMetadata,
    pub generated_at: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct QRMetadata {
    pub version: u8,
    pub modules: usize,
    pub error_correction: String,
    pub processing_time_ms: u64,
}

impl RedisCache {
    pub fn new(redis_url: &str, prefix: &str, ttl_seconds: u64) -> Result<Self, redis::RedisError> {
        let client = Client::open(redis_url)?;
        
        // Test connection
        let mut conn = client.get_connection()?;
        let _: String = redis::cmd("PING").query(&mut conn)?;
        
        debug!("Redis cache initialized with prefix: {}", prefix);
        
        Ok(RedisCache {
            client,
            prefix: prefix.to_string(),
            ttl: Duration::from_secs(ttl_seconds),
            enabled: true,
        })
    }
    
    pub fn disabled() -> Self {
        RedisCache {
            client: Client::open("redis://localhost").unwrap(),
            prefix: String::new(),
            ttl: Duration::from_secs(0),
            enabled: false,
        }
    }
    
    pub fn get(&self, key: &str) -> Option<CachedQR> {
        if !self.enabled {
            return None;
        }
        
        match self.client.get_connection() {
            Ok(mut conn) => {
                let full_key = format!("{}:{}", self.prefix, key);
                match conn.get::<_, Vec<u8>>(&full_key) {
                    Ok(data) => {
                        match bincode::deserialize::<CachedQR>(&data) {
                            Ok(cached) => {
                                debug!("Cache hit for key: {}", key);
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
                        None
                    }
                }
            }
            Err(e) => {
                warn!("Redis connection failed: {}", e);
                None
            }
        }
    }
    
    pub fn set(&self, key: &str, value: &CachedQR) -> RedisResult<()> {
        if !self.enabled {
            return Ok(());
        }
        
        let mut conn = self.client.get_connection()?;
        let full_key = format!("{}:{}", self.prefix, key);
        let data = bincode::serialize(value).map_err(|e| {
            redis::RedisError::from((redis::ErrorKind::IoError, "Serialization failed", e.to_string()))
        })?;
        
        conn.set_ex(&full_key, data, self.ttl.as_secs())?;
        debug!("Cached QR for key: {} (TTL: {}s)", key, self.ttl.as_secs());
        
        Ok(())
    }
    
    pub fn delete(&self, key: &str) -> RedisResult<()> {
        if !self.enabled {
            return Ok(());
        }
        
        let mut conn = self.client.get_connection()?;
        let full_key = format!("{}:{}", self.prefix, key);
        conn.del(&full_key)?;
        debug!("Deleted cache entry: {}", key);
        
        Ok(())
    }
    
    pub fn clear_pattern(&self, pattern: &str) -> RedisResult<usize> {
        if !self.enabled {
            return Ok(0);
        }
        
        let mut conn = self.client.get_connection()?;
        let full_pattern = format!("{}:{}*", self.prefix, pattern);
        
        let keys: Vec<String> = conn.keys(&full_pattern)?;
        let count = keys.len();
        
        if count > 0 {
            conn.del(&keys)?;
            debug!("Cleared {} cache entries matching pattern: {}", count, pattern);
        }
        
        Ok(count)
    }
    
    pub fn stats(&self) -> RedisResult<CacheStats> {
        if !self.enabled {
            return Ok(CacheStats::default());
        }
        
        let mut conn = self.client.get_connection()?;
        let pattern = format!("{}:*", self.prefix);
        let keys: Vec<String> = conn.keys(&pattern)?;
        
        let info: String = redis::cmd("INFO").arg("memory").query(&mut conn)?;
        let memory_used = info
            .lines()
            .find(|line| line.starts_with("used_memory:"))
            .and_then(|line| line.split(':').nth(1))
            .and_then(|val| val.parse::<usize>().ok())
            .unwrap_or(0);
        
        Ok(CacheStats {
            total_keys: keys.len(),
            memory_bytes: memory_used,
            prefix: self.prefix.clone(),
        })
    }
}

#[derive(Debug, Default)]
pub struct CacheStats {
    pub total_keys: usize,
    pub memory_bytes: usize,
    pub prefix: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_cache_key_generation() {
        let cache = RedisCache::disabled();
        let key = "test_key";
        let full_key = format!("{}:{}", cache.prefix, key);
        assert_eq!(full_key, ":test_key");
    }
}