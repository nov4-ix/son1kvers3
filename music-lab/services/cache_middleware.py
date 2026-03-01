"""
Caching Middleware - Redis-based caching for expensive operations
"""

import os
import json
import hashlib
import logging
from typing import Optional, Any, Dict
from dataclasses import dataclass
from datetime import timedelta

import redis
import minio
from minio import Minio

logger = logging.getLogger(__name__)


@dataclass
class CacheConfig:
    """Cache configuration"""
    redis_url: str
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str = 'son1k-cache'
    default_ttl: int = 86400  # 24 hours
    analysis_ttl: int = 604800  # 7 days
    stems_ttl: int = 259200  # 3 days
    embeddings_ttl: int = 2592000  # 30 days


class CacheMiddleware:
    """
    Caching layer for expensive operations
    Uses Redis for metadata and MinIO for large files
    """

    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheMiddleware._from_env()
        
        # Redis for metadata
        self.redis = redis.from_url(
            self.config.redis_url,
            decode_responses=True
        )
        
        # MinIO for large files (stems, audio)
        self.minio = Minio(
            self.config.minio_endpoint,
            access_key=self.config.minio_access_key,
            secret_key=self.config.minio_secret_key,
            secure=False
        )
        
        # Ensure bucket exists
        self._ensure_bucket()
        
        logger.info("Cache middleware initialized")

    @staticmethod
    def _from_env() -> CacheConfig:
        """Create config from environment variables"""
        return CacheConfig(
            redis_url=os.environ.get('REDIS_URL', 'redis://localhost:6379'),
            minio_endpoint=os.environ.get('MINIO_ENDPOINT', 'localhost:9000'),
            minio_access_key=os.environ.get('MINIO_ACCESS_KEY', 'minioadmin'),
            minio_secret_key=os.environ.get('MINIO_SECRET_KEY', 'minioadmin'),
            minio_bucket=os.environ.get('MINIO_CACHE_BUCKET', 'son1k-cache')
        )

    def _ensure_bucket(self):
        """Ensure MinIO bucket exists"""
        try:
            if not self.minio.bucket_exists(self.config.minio_bucket):
                self.minio.make_bucket(self.config.minio_bucket)
        except Exception as e:
            logger.warning(f"Could not create bucket: {e}")

    # ============================================
    # KEY GENERATION
    # ============================================

    def generate_cache_key(
        self,
        prefix: str,
        payload: Dict[str, Any]
    ) -> str:
        """Generate cache key from payload"""
        # Sort keys for consistent hashing
        sorted_payload = json.dumps(payload, sort_keys=True)
        hash_value = hashlib.sha256(sorted_payload.encode()).hexdigest()[:16]
        return f"cache:{prefix}:{hash_value}"

    def get_analysis_key(self, audio_hash: str, options: Dict) -> str:
        """Get cache key for analysis"""
        return f"cache:analysis:{audio_hash}:{hashlib.md5(json.dumps(options).encode()).hexdigest()[:8]}"

    def get_stems_key(self, audio_hash: str) -> str:
        """Get cache key for stems"""
        return f"cache:stems:{audio_hash}"

    def get_embedding_key(self, voice_id: str) -> str:
        """Get cache key for voice embeddings"""
        return f"cache:embedding:{voice_id}"

    # ============================================
    # CACHE OPERATIONS
    # ============================================

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached value"""
        try:
            data = self.redis.get(key)
            if data:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(data)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Dict[str, Any],
        ttl: int = None
    ) -> bool:
        """Set cached value"""
        try:
            ttl = ttl or self.config.default_ttl
            self.redis.setex(key, ttl, json.dumps(value))
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete cached value"""
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.redis.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    # ============================================
    # ANALYSIS CACHING
    # ============================================

    async def get_cached_analysis(
        self,
        audio_url: str,
        options: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get cached analysis result"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_analysis_key(audio_hash, options)
        
        cached = await self.get(key)
        
        if cached:
            cached['cacheHit'] = True
            return cached
        
        return None

    async def cache_analysis(
        self,
        audio_url: str,
        options: Dict[str, Any],
        result: Dict[str, Any]
    ) -> bool:
        """Cache analysis result"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_analysis_key(audio_hash, options)
        
        return await self.set(key, result, self.config.analysis_ttl)

    # ============================================
    # STEMS CACHING
    # ============================================

    async def get_cached_stems(self, audio_url: str) -> Optional[Dict[str, str]]:
        """Get cached stems"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_stems_key(audio_hash)
        
        return await self.get(key)

    async def cache_stems(
        self,
        audio_url: str,
        stems: Dict[str, str]
    ) -> bool:
        """Cache stems"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_stems_key(audio_hash)
        
        # Store metadata in Redis
        await self.set(key, stems, self.config.stems_ttl)
        
        # Store actual files in MinIO
        for stem_type, file_path in stems.items():
            if os.path.exists(file_path):
                self._upload_to_minio(
                    f"{audio_hash}/{stem_type}.wav",
                    file_path
                )
        
        return True

    # ============================================
    # VOICE EMBEDDINGS CACHING
    # ============================================

    async def get_voice_embedding(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """Get cached voice embedding"""
        key = self.get_embedding_key(voice_id)
        
        # Try Redis first
        cached = await self.get(key)
        if cached:
            return cached
        
        # Try MinIO
        try:
            data = self.minio.get_object(
                self.config.minio_bucket,
                f"embeddings/{voice_id}.npy"
            )
            return {'embedding_data': data.read()}
        except:
            return None

    async def cache_voice_embedding(
        self,
        voice_id: str,
        embedding: Any
    ) -> bool:
        """Cache voice embedding"""
        key = self.get_embedding_key(voice_id)
        
        # Store metadata in Redis
        await self.set(
            key,
            {'voice_id': voice_id, 'cached_at': str(timedelta(seconds=self.config.embeddings_ttl))},
            self.config.embeddings_ttl
        )
        
        # Store embedding in MinIO
        # (Implementation depends on embedding format)
        
        return True

    # ============================================
    # MINIO HELPERS
    # ============================================

    def _upload_to_minio(self, object_name: str, file_path: str):
        """Upload file to MinIO"""
        try:
            self.minio.fput_object(
                self.config.minio_bucket,
                object_name,
                file_path
            )
            logger.debug(f"Uploaded to MinIO: {object_name}")
        except Exception as e:
            logger.error(f"MinIO upload error: {e}")

    def _download_from_minio(self, object_name: str, dest_path: str):
        """Download file from MinIO"""
        try:
            self.minio.fget_object(
                self.config.minio_bucket,
                object_name,
                dest_path
            )
            logger.debug(f"Downloaded from MinIO: {object_name}")
        except Exception as e:
            logger.error(f"MinIO download error: {e}")

    # ============================================
    # CACHE INVALIDATION
    # ============================================

    async def invalidate_analysis(self, audio_url: str, options: Dict[str, Any]):
        """Invalidate analysis cache"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_analysis_key(audio_hash, options)
        await self.delete(key)

    async def invalidate_stems(self, audio_url: str):
        """Invalidate stems cache"""
        audio_hash = hashlib.md5(audio_url.encode()).hexdigest()
        key = self.get_stems_key(audio_hash)
        
        # Delete from Redis
        await self.delete(key)
        
        # Delete from MinIO
        for stem_type in ['drums', 'bass', 'other', 'vocals']:
            try:
                self.minio.remove_object(
                    self.config.minio_bucket,
                    f"{audio_hash}/{stem_type}.wav"
                )
            except:
                pass

    # ============================================
    # STATS
    # ============================================

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        info = self.redis.info('stats')
        
        # Count keys by prefix
        analysis_keys = len([k for k in self.redis.keys('cache:analysis:*')])
        stems_keys = len([k for k in self.redis.keys('cache:stems:*')])
        embedding_keys = len([k for k in self.redis.keys('cache:embedding:*')])
        
        return {
            'redis_hits': info.get('keyspace_hits', 0),
            'redis_misses': info.get('keyspace_misses', 0),
            'analysis_cached': analysis_keys,
            'stems_cached': stems_keys,
            'embeddings_cached': embedding_keys
        }

    def close(self):
        """Close connections"""
        self.redis.close()


# Singleton
_cache_middleware: Optional[CacheMiddleware] = None


def get_cache_middleware() -> CacheMiddleware:
    """Get cache middleware instance"""
    global _cache_middleware
    if not _cache_middleware:
        _cache_middleware = CacheMiddleware()
    return _cache_middleware


# Export
export default CacheMiddleware
