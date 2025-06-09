use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use std::time::{Duration, Instant};

/// Simple in-memory cache implementation
pub struct MemoryCache<K, V> {
    cache: Arc<RwLock<HashMap<K, CacheEntry<V>>>>,
    max_size: usize,
    ttl: Duration,
}

struct CacheEntry<V> {
    value: V,
    created_at: Instant,
    expires_at: Instant,
}

impl<K, V> MemoryCache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
    V: Clone,
{
    pub fn new(max_size: usize, ttl_seconds: u64) -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::with_capacity(max_size))),
            max_size,
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let cache = self.cache.read();
        
        if let Some(entry) = cache.get(key) {
            if Instant::now() < entry.expires_at {
                return Some(entry.value.clone());
            }
        }
        
        None
    }

    pub fn set(&self, key: K, value: V) {
        let mut cache = self.cache.write();
        
        // Simple eviction if at capacity
        if cache.len() >= self.max_size && !cache.contains_key(&key) {
            // Remove oldest entry (simple FIFO for now)
            if let Some(oldest_key) = cache.keys().next().cloned() {
                cache.remove(&oldest_key);
            }
        }
        
        let now = Instant::now();
        cache.insert(key, CacheEntry {
            value,
            created_at: now,
            expires_at: now + self.ttl,
        });
    }

    pub fn clear(&self) {
        self.cache.write().clear();
    }

    pub fn len(&self) -> usize {
        self.cache.read().len()
    }

    pub fn is_empty(&self) -> bool {
        self.cache.read().is_empty()
    }
}