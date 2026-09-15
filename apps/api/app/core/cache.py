import time
import json
import functools
import logging
from typing import Any, Callable, Dict, Optional, Tuple

logger = logging.getLogger("core.cache")

# Fast In-Memory Cache Store: { "key": (data, expiry_timestamp) }
_cache_store: Dict[str, Tuple[Any, float]] = {}


class ResponseCache:
    """
    High-speed caching layer for repeat and read-heavy queries.
    Supports TTL expiration, instant cache invalidation, and custom cache keys.
    """

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        record = _cache_store.get(key)
        if not record:
            return None
        data, expiry = record
        if time.time() > expiry:
            del _cache_store[key]
            return None
        return data

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300):
        _cache_store[key] = (value, time.time() + ttl_seconds)

    @classmethod
    def invalidate(cls, prefix: str):
        """Invalidates all cache keys matching the given prefix."""
        matching = [k for k in _cache_store.keys() if k.startswith(prefix)]
        for k in matching:
            _cache_store.pop(k, None)
        if matching:
            logger.info(f"Invalidated {len(matching)} cache entries with prefix: {prefix}")


def cached_endpoint(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator for caching endpoint responses.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Compute cache key from function name + kwargs
            clean_kwargs = {k: v for k, v in kwargs.items() if k not in ["db", "current_user", "request"]}
            cache_key = f"{key_prefix or func.__name__}:{json.dumps(clean_kwargs, sort_keys=True, default=str)}"
            
            cached_val = ResponseCache.get(cache_key)
            if cached_val is not None:
                return cached_val

            result = await func(*args, **kwargs) if functools.iscoroutinefunction(func) else func(*args, **kwargs)
            ResponseCache.set(cache_key, result, ttl_seconds)
            return result

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            clean_kwargs = {k: v for k, v in kwargs.items() if k not in ["db", "current_user", "request"]}
            cache_key = f"{key_prefix or func.__name__}:{json.dumps(clean_kwargs, sort_keys=True, default=str)}"
            
            cached_val = ResponseCache.get(cache_key)
            if cached_val is not None:
                return cached_val

            result = func(*args, **kwargs)
            ResponseCache.set(cache_key, result, ttl_seconds)
            return result

        if functools.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator
